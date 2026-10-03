"""Synthetic PBF integration test; never writes to public/ or user settings."""
import json
from pathlib import Path
import tempfile
import unittest
import osmium
from import_osm import run, KREISE

def fixture(path, missing=False):
    nodes, ways, relations = [], [], []
    def node(lon, lat, tags=None):
        ident = len(nodes) + 1
        nodes.append(osmium.osm.mutable.Node(id=ident, location=(lon, lat), tags=tags or {}))
        return ident
    def ring(x, y, size, tags=None):
        refs = [node(x, y), node(x + size, y), node(x + size, y + size), node(x, y + size)]
        ident = len(ways) + 1
        ways.append(osmium.osm.mutable.Way(id=ident, nodes=refs + [refs[0]], tags=tags or {}))
        return ident
    for i, (key, (_, name)) in enumerate(KREISE.items()):
        if missing and i == 3:
            continue
        x = 11 + i
        outer, hole = ring(x, 49, 0.8), ring(x + 0.6, 49.6, 0.1)
        for level in ('6', '8'):
            if i == 0 and level == '8':
                continue
            relations.append(osmium.osm.mutable.Relation(id=len(relations) + 1,
                members=[('w', outer, 'outer'), ('w', hole, 'inner')],
                tags={'type': 'boundary', 'boundary': 'administrative', 'admin_level': level,
                      'name': name if level == '6' else f'Gemeinde {i}',
                      'de:amtlicher_gemeindeschluessel': key + ('001' if level == '8' else '')}))
        node(x + 0.2, 49.2, {'place': 'village', 'name': f'Ort {i}'})
        node(x + 0.21, 49.21, {'addr:street': 'Hauptstraße', 'addr:housenumber': '12', 'addr:postcode': '12345'})
        node(x + 0.2101, 49.2101, {'addr:street': 'Hauptstraße', 'addr:housenumber': '12', 'addr:postcode': '12345'})
        node(x + 0.22, 49.22, {'addr:street': 'Hauptstraße'})
        node(x + 0.23, 49.23, {'addr:housenumber': '9', 'addr:place': f'Ort {i}'})
        if i % 2:
            ring(x + 0.3, 49.3, 0.01, {'amenity': 'hospital', 'name': 'Klinik'})
        else:
            node(x + 0.3, 49.3, {'amenity': 'hospital', 'name': 'Klinik'})
        node(x + 0.65, 49.65, {'addr:street': 'Lochstraße', 'addr:housenumber': '1'})
        for offset in (0.1, 0.15):
            refs = [node(x + offset, 49.1), node(x + offset, 49.2)]
            ways.append(osmium.osm.mutable.Way(id=len(ways) + 1, nodes=refs, tags={'highway': 'residential', 'name': 'Hauptstraße'}))
    node(10, 48, {'place': 'city', 'name': 'Außerhalb'})
    node(10, 48, {'addr:street': 'Fremdstraße', 'addr:housenumber': '1'})
    with osmium.SimpleWriter(str(path)) as writer:
        for obj in nodes + ways + relations:
            writer.add(obj)

class ImportTest(unittest.TestCase):
    def test_pipeline(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp)
            fixture(p / 'test.osm.pbf')
            m = run(p / 'test.osm.pbf', p / 'out')
            self.assertEqual(m['statistik']['kreise'], 4)
            self.assertEqual(m['statistik']['adressen'], 12)
            self.assertEqual(m['statistik']['strassen'], 4)
            self.assertEqual(m['statistik']['pois'], 4)
            self.assertEqual(m['statistik']['uebersprungen']['objekteAusserhalb'], 5)
            self.assertEqual(m['statistik']['uebersprungen']['doppelteAdressen'], 4)
            addresses = json.loads((p / 'out' / m['dateien']['adressen-stadt-regensburg.json']['pfad']).read_text('utf-8'))
            rows = [dict(zip(addresses['spalten'], row)) for row in addresses['zeilen']]
            self.assertTrue(any(not a['strasse'] for a in rows))
            self.assertTrue(any(not a['hausnummer'] for a in rows))
            old = (p / 'out/manifest.json').read_bytes()
            fixture(p / 'missing.osm.pbf', missing=True)
            with self.assertRaisesRegex(ValueError, 'vier Kreisgrenzen'):
                run(p / 'missing.osm.pbf', p / 'out')
            self.assertEqual((p / 'out/manifest.json').read_bytes(), old)
            again = run(p / 'test.osm.pbf', p / 'out')
            self.assertEqual(m['statistik'], again['statistik'])
            self.assertEqual(m['dateien']['orte.json']['sha256'], again['dateien']['orte.json']['sha256'])

if __name__ == '__main__':
    unittest.main()
