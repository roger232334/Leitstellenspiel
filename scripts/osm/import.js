import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
const root = fileURLToPath(new URL('../../', import.meta.url))
const python = path.join(root, 'node_modules/.cache/osm-venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python')
if (!existsSync(python)) { console.error('Bitte zuerst Python 3.11+ installieren und npm run setup-osm ausführen.'); process.exit(1) }
const args = process.argv.slice(2)
const test = args[0] === '--test'
const result = spawnSync(python, [path.join(root, test ? 'scripts/osm/test_import.py' : 'scripts/osm/import_osm.py'), ...(!test ? (args.length ? args : [path.join(root, 'data/osm/oberpfalz-latest.osm.pbf')]) : [])], { stdio: 'inherit', env: { ...process.env, PYTHONUTF8: '1', PYTHONUNBUFFERED: '1' } })
if (result.error) console.error(result.error.message)
process.exit(result.status ?? 1)
