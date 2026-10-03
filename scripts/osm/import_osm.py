"""Offline PBF -> bounded, immutable browser snapshots. No network access."""
import argparse
from collections import Counter, defaultdict
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import sys
import unicodedata

import osmium
from shapely.geometry import Point, LineString, shape, mapping
from shapely.strtree import STRtree

ROOT = Path(__file__).resolve().parents[2]
KREISE = {
    '09362': ('stadt-regensburg', 'Stadt Regensburg'),
    '09375': ('landkreis-regensburg', 'Landkreis Regensburg'),
    '09372': ('landkreis-cham', 'Landkreis Cham'),
    '09373': ('landkreis-neumarkt', 'Landkreis Neumarkt in der Oberpfalz'),
}
PLACES = {'city', 'town', 'village', 'hamlet', 'suburb', 'quarter', 'neighbourhood', 'isolated_dwelling'}
MAPPINGS = json.loads((Path(__file__).parent / 'poi-mapping.json').read_text('utf-8'))
FACTORY = osmium.geom.GeoJSONFactory()

def norm(text):
    return unicodedata.normalize('NFC', text).strip().casefold()

def oid(obj):
    if obj.type_str() == 'a':
        return f"osm:{'way' if obj.from_way() else 'relation'}:{obj.orig_id()}"
    return f"osm:{ {'n': 'node', 'w': 'way', 'r': 'relation'}[obj.type_str()]}:{obj.id}"

def position(p):
    return {'lat': round(p.y, 7), 'lng': round(p.x, 7)}

def metadata(obj, tags, p):
    aliases = sorted({x.strip() for key in ('alt_name', 'short_name', 'official_name') for x in tags.get(key, '').split(';') if x.strip() and x.strip() != tags.get('name')})
    return {'id': oid(obj), 'name': tags['name'].strip(), 'position': position(p), 'aliases': aliases,
            'postleitzahl': tags.get('postal_code', tags.get('addr:postcode', '')),
            'verwaltungsId': tags.get('de:amtlicher_gemeindeschluessel', ''),
            'regionalschluessel': tags.get('de:regionalschluessel', ''),
            'gemeindefrei': tags.get('name:prefix') == 'Gemeindefreies Gebiet'}

def polygon(obj):
    g = shape(json.loads(FACTORY.create_multipolygon(obj)))
    if g.is_empty or not g.is_valid:
        raise ValueError('Invalid boundary/area geometry')
    return g

class Boundaries(osmium.SimpleHandler):
    def __init__(self, stats):
        super().__init__()
        self.stats, self.admin, self.places = stats, [], []

    def node(self, obj):
        if obj.tags.get('place') not in PLACES or not obj.tags.get('name'):
            return
        try:
            p = Point(obj.location.lon, obj.location.lat)
            self.places.append((metadata(obj, dict(obj.tags), p), p))
        except (ValueError, RuntimeError):
            self.stats['ungueltigeOrte'] += 1

    def area(self, obj):
        tags = dict(obj.tags)
        admin = tags.get('boundary') == 'administrative' and tags.get('admin_level') in ('6', '8')
        place = tags.get('place') in PLACES
        if not (admin or place) or not tags.get('name'):
            return
        try:
            g = polygon(obj)
            record = metadata(obj, tags, g.representative_point())
            if admin:
                self.admin.append((record, tags['admin_level'], g))
            elif place:
                self.places.append((record, g.representative_point()))
        except (ValueError, RuntimeError):
            self.stats['ungueltigeGrenzenOderOrte'] += 1

class Territory:
    def __init__(self, handler):
        self.counties, self.municipalities = [], []
        for r, level, g in handler.admin:
            key = r['verwaltungsId']
            if level == '6' and key[:5] in KREISE:
                cid, name = KREISE[key[:5]]
                self.counties.append(({**r, 'id': cid, 'osmId': r['id'], 'name': name}, g))
        if {r['id'] for r, _ in self.counties} != {v[0] for v in KREISE.values()} or len(self.counties) != 4:
            raise ValueError('Nicht alle vier Kreisgrenzen eindeutig gefunden. Bestehender Import bleibt unverändert.')
        for r, level, g in handler.admin:
            if level != '8' and not (level == '6' and r['verwaltungsId'].startswith('09362')):
                continue
            matches = [(c, cg) for c, cg in self.counties if cg.covers(g.representative_point())]
            if len(matches) != 1:
                continue
            c, cg = matches[0]
            # Official key plus actual polygon. Clipping prevents source overshoots at borders.
            if r['verwaltungsId'] and r['verwaltungsId'][:5] != c['verwaltungsId'][:5]:
                continue
            clipped = g.intersection(cg)
            if clipped.is_empty or clipped.geom_type not in ('Polygon', 'MultiPolygon'):
                continue
            self.municipalities.append(({**r, 'kreisId': c['id']}, clipped))
        if {m['kreisId'] for m, _ in self.municipalities} != {c['id'] for c, _ in self.counties}:
            raise ValueError('Gemeindegrenzen fehlen in mindestens einem Kreis.')
        self.municipalities.sort(key=lambda x: x[0]['id'])
        self.tree = STRtree([g for _, g in self.municipalities])
        self.places, self.by_municipality = [], defaultdict(list)
        seen = set()
        for r, p in sorted(handler.places, key=lambda x: (not x[0]['id'].startswith('osm:node:'), x[0]['id'])):
            m = self.municipality(p)
            if not m:
                handler.stats['orteAusserhalb'] += 1
                continue
            # A tagged area and its label node commonly describe the same place.
            key = (m['id'], norm(r['name']))
            if key in seen:
                handler.stats['doppelteOrte'] += 1
                continue
            seen.add(key)
            self.add_place(r, m)
        # Municipality itself is an actual administrative entity, not an invented village.
        for m, g in self.municipalities:
            if (m['id'], norm(m['name'])) not in seen:
                self.add_place({**m, 'ebene': 'gemeinde'}, m)
        self.nearest = {mid: STRtree([Point(r['position']['lng'] * 0.66, r['position']['lat']) for r in rows]) for mid, rows in self.by_municipality.items()}

    def add_place(self, r, m):
        row = {**r, 'bundesland': 'Bayern', 'kreisId': m['kreisId'], 'gemeindeId': m['id'], 'gemeinde': m['name'], 'ortsteil': r['name']}
        self.places.append(row)
        self.by_municipality[m['id']].append(row)

    def municipality(self, p):
        matches = self.tree.query(p, predicate='covered_by')
        return self.municipalities[int(matches[0])][0] if len(matches) == 1 else None

    def locate(self, p, tags):
        m = self.municipality(p)
        if not m:
            return None
        rows = self.by_municipality[m['id']]
        explicit = tags.get('addr:suburb', tags.get('addr:place', ''))
        candidates = [r for r in rows if norm(explicit) in {norm(r['ortsteil']), *map(norm, r['aliases'])}] if explicit else []
        if len(candidates) == 1:
            return candidates[0], 'addr-tag'
        # Places are points, not legal district boundaries. Record this approximation explicitly.
        idx = self.nearest[m['id']].nearest(Point(p.x * 0.66, p.y))
        return rows[int(idx)], 'naechster-osm-ort'

class Features(osmium.SimpleHandler):
    def __init__(self, territory, stats):
        super().__init__()
        self.territory, self.stats = territory, stats
        self.roads, self.addresses, self.pois = {}, {}, {}
        self.address_keys = set()

    def interesting(self, tags):
        return bool(tags.get('addr:street') or tags.get('addr:housenumber') or tags.get('addr:place') or self.poi_type(tags))

    def poi_type(self, tags):
        return next((m['typId'] for m in MAPPINGS if tags.get(m['tag']) in m['werte']), None)

    def node(self, obj):
        tags = dict(obj.tags)
        if not self.interesting(tags):
            return
        try:
            self.extract(obj, tags, Point(obj.location.lon, obj.location.lat))
        except (ValueError, RuntimeError):
            self.stats['ungueltigeObjekte'] += 1

    def way(self, obj):
        tags = dict(obj.tags)
        road = tags.get('highway') and tags.get('name', '').strip()
        if not road and (obj.is_closed() or not self.interesting(tags)):
            return
        try:
            line = shape(json.loads(FACTORY.create_linestring(obj)))
            if road:
                # Split at municipality borders; never use a bounding-box or out-of-area centroid.
                for idx in self.territory.tree.query(line, predicate='intersects'):
                    m, boundary = self.territory.municipalities[int(idx)]
                    clipped = line.intersection(boundary)
                    if clipped.is_empty or clipped.length == 0:
                        continue
                    p = clipped.representative_point()
                    loc = self.territory.locate(p, tags)
                    if not loc:
                        continue
                    place, method = loc
                    name = tags['name'].strip()
                    key = (m['id'], place['id'], norm(name))
                    if key in self.roads:
                        self.stats['zusammengefuehrteStrassensegmente'] += 1
                        continue
                    sid = 'strasse:' + hashlib.sha256('|'.join(key).encode()).hexdigest()[:20]
                    self.roads[key] = {'id': sid, 'osmId': oid(obj), 'gebietId': place['id'], 'name': name, 'position': position(p), 'zuordnung': method}
            if not obj.is_closed() and self.interesting(tags):
                self.extract(obj, tags, line.interpolate(0.5, normalized=True))
        except (ValueError, RuntimeError):
            self.stats['ungueltigeObjekte'] += 1

    def area(self, obj):
        tags = dict(obj.tags)
        if not self.interesting(tags):
            return
        try:
            self.extract(obj, tags, polygon(obj).representative_point())
        except (ValueError, RuntimeError):
            self.stats['ungueltigeObjekte'] += 1

    def extract(self, obj, tags, p):
        found = self.territory.locate(p, tags)
        if not found:
            self.stats['objekteAusserhalb'] += 1
            return
        place, method = found
        ident = oid(obj)
        address = {'id': ident, 'gebietId': place['id'], 'strasse': tags.get('addr:street', ''), 'hausnummer': tags.get('addr:housenumber', ''),
                   'postleitzahl': tags.get('addr:postcode', ''), 'ortsangabe': tags.get('addr:city', ''), 'adressOrt': tags.get('addr:place', ''),
                   'position': position(p), 'zuordnung': method}
        if any(k.startswith('addr:') for k in tags):
            # Building polygons and entrance nodes often carry the same postal address.
            full = bool((address['strasse'] or address['adressOrt']) and address['hausnummer'])
            key = (place['id'], norm(address['strasse']), norm(address['adressOrt']), norm(address['hausnummer']), address['postleitzahl'], None if full else (round(p.x, 5), round(p.y, 5)))
            if key not in self.address_keys:
                self.address_keys.add(key)
                self.addresses[ident] = address
            else:
                self.stats['doppelteAdressen'] += 1
        typ = self.poi_type(tags)
        if typ:
            self.pois[ident] = {**address, 'name': tags.get('name', ''), 'typId': typ}

def encode(rows, columns):
    return {'spalten': columns, 'zeilen': [[r.get(c, '') for c in columns] for r in rows]}

def run(source, output):
    if not source.is_file():
        raise ValueError(f'PBF nicht gefunden: {source}')
    stats = Counter()
    print('1/3 Verwaltungsgrenzen und Orte lesen …', flush=True)
    handler = Boundaries(stats)
    handler.apply_file(str(source), locations=True, idx='flex_mem')
    territory = Territory(handler)
    print(f'2/3 Straßen, Adressen und POI lesen ({len(territory.places)} Orte) …', flush=True)
    features = Features(territory, stats)
    features.apply_file(str(source), locations=True, idx='flex_mem')
    print('3/3 Kompakte Dateien schreiben …', flush=True)
    output.mkdir(parents=True, exist_ok=True)
    snapshot = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
    folder = output / snapshot
    folder.mkdir()
    files = {}
    def write(name, data):
        raw = json.dumps(data, ensure_ascii=False, separators=(',', ':'), allow_nan=False).encode('utf-8')
        (folder / name).write_bytes(raw)
        files[name] = {'pfad': f'{snapshot}/{name}', 'bytes': len(raw), 'sha256': hashlib.sha256(raw).hexdigest()}
    write('gebiete.json', {'kreise': [{**r, 'geometry': mapping(g)} for r, g in territory.counties], 'gemeinden': [{**r, 'geometry': mapping(g)} for r, g in territory.municipalities]})
    write('orte.json', territory.places)
    lookup = {o['id']: o for o in territory.places}
    collections = {'strassen': list(features.roads.values()), 'adressen': list(features.addresses.values()), 'pois': list(features.pois.values())}
    columns = {
        'strassen': ['id', 'gebietId', 'name', 'position', 'osmId', 'zuordnung'],
        'adressen': ['id', 'gebietId', 'strasse', 'hausnummer', 'postleitzahl', 'ortsangabe', 'adressOrt', 'position', 'zuordnung'],
        'pois': ['id', 'gebietId', 'name', 'typId', 'strasse', 'hausnummer', 'postleitzahl', 'ortsangabe', 'adressOrt', 'position', 'zuordnung'],
    }
    for kind, rows in collections.items():
        for cid, _ in KREISE.values():
            write(f'{kind}-{cid}.json', encode(sorted((r for r in rows if lookup[r['gebietId']]['kreisId'] == cid), key=lambda r: r['id']), columns[kind]))
    gemeindefrei = sum(bool(m['gemeindefrei']) for m, _ in territory.municipalities)
    counts = {'kreise': len(territory.counties), 'gemeinden': len(territory.municipalities) - gemeindefrei, 'gemeindefreieGebiete': gemeindefrei,
              'orte': len(territory.places), 'davonVerwaltungsorte': sum(r.get('ebene') == 'gemeinde' for r in territory.places),
              **{k: len(v) for k, v in collections.items()}, 'uebersprungen': dict(stats)}
    manifest = {'version': 1, 'snapshot': snapshot, 'quelle': source.name, 'erstellt': datetime.now(timezone.utc).isoformat(), 'lizenz': 'ODbL-1.0', 'attribution': '© OpenStreetMap-Mitwirkende', 'statistik': counts, 'dateien': files}
    temp = output / f'manifest-{snapshot}.tmp'
    temp.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
    os.replace(temp, output / 'manifest.json')
    print(json.dumps({**counts, 'jsonBytes': sum(f['bytes'] for f in files.values()), 'ausgabe': str(output)}, ensure_ascii=False, indent=2))
    return manifest

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('--output', type=Path, default=ROOT / 'public/data/gebiet')
    args = parser.parse_args()
    try:
        run(args.source, args.output)
    except Exception as exc:
        print(f'Import fehlgeschlagen: {exc}', file=sys.stderr)
        sys.exit(1)
