#!/usr/bin/env node
// Construit la version web de l'app (iPhone : ajoutée à l'écran d'accueil depuis la page /app)
// et la dépose dans le front, servie par le site sous /mobile/.
//
//   npm run web:build                      → ../../Frontend/eFlotte-Front/public/mobile
//   npm run web:build -- <dossier du front> → <dossier du front>/public/mobile
//
// Ensuite : commiter public/mobile dans eFlotte-Front puis redéployer le front.
import { spawnSync } from 'node:child_process'
import { existsSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'

const front = resolve(process.argv[2] ?? '../../Frontend/eFlotte-Front')
if (!existsSync(resolve(front, 'package.json'))) {
  console.error(`✗ Dossier du front introuvable : ${front}\n  Usage : npm run web:build -- <dossier eFlotte-Front>`)
  process.exit(1)
}
const sortie = resolve(front, 'public/mobile')
rmSync(sortie, { recursive: true, force: true })

const r = spawnSync('npx', ['expo', 'export', '--platform', 'web', '--output-dir', sortie, '--clear'], {
  stdio: 'inherit', shell: process.platform === 'win32', env: { ...process.env, CI: '1', EFLOTTE_WEB: '1' },
})
if (r.status !== 0) process.exit(r.status ?? 1)
rmSync(resolve(sortie, 'metadata.json'), { force: true })
console.log(`\n✓ Version web déposée dans ${sortie}\n  → commiter ce dossier dans eFlotte-Front, puis redéployer le front.`)
