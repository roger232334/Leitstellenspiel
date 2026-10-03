import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
const root = fileURLToPath(new URL('../../', import.meta.url))
const env = path.join(root, 'node_modules/.cache/osm-venv')
const python = process.platform === 'win32' ? path.join(env, 'Scripts/python.exe') : path.join(env, 'bin/python')
for (const [cmd, args] of [[process.env.PYTHON || (process.platform === 'win32' ? 'python' : 'python3'), ['-m', 'venv', env]], [python, ['-m', 'pip', 'install', '-r', path.join(root, 'scripts/osm/requirements.txt')]]]) {
  const result = spawnSync(cmd, args, { stdio: 'inherit' })
  if (result.error || result.status !== 0) { console.error(result.error?.message || 'Installation fehlgeschlagen.'); process.exit(result.status || 1) }
}
