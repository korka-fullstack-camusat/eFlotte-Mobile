#!/usr/bin/env node
// Construit l'APK Android (EAS, profil « preview ») puis le télécharge sous le nom
// eflotte-camusat.apk à la racine du projet — le fichier à donner à l'IT.
//
//   npm run apk            → nouvelle construction (10–20 min) puis téléchargement
//   npm run apk:dernier    → télécharge seulement la dernière construction terminée
//
// Prérequis : être connecté à Expo (npx eas login) ; la 1re construction a déjà créé la clé.
import { spawnSync } from 'node:child_process'
import { createWriteStream, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'

const NOM = 'eflotte-camusat.apk'
const dernier = process.argv.includes('--dernier')

function eas(args) {
  // Le JSON sort sur stdout ; les messages d'EAS restent visibles dans le terminal (stderr)
  const r = spawnSync('npx', ['eas', ...args, '--json', '--non-interactive'], {
    stdio: ['inherit', 'pipe', 'inherit'], encoding: 'utf8', shell: process.platform === 'win32',
    maxBuffer: 50 * 1024 * 1024,
  })
  if (r.status !== 0) {
    console.error(`\n✗ La commande « eas ${args.join(' ')} » a échoué.`)
    process.exit(r.status ?? 1)
  }
  const debut = r.stdout.search(/[[{]/)
  try {
    return JSON.parse(r.stdout.slice(debut))
  } catch {
    console.error('\n✗ Réponse inattendue d’EAS :\n' + r.stdout)
    process.exit(1)
  }
}

const lienApk = (build) => build?.artifacts?.applicationArchiveUrl ?? build?.artifacts?.buildUrl

let builds
if (dernier) {
  console.log('→ Recherche de la dernière construction Android terminée…')
  builds = eas(['build:list', '--platform', 'android', '--status', 'finished', '--limit', '1'])
} else {
  console.log('→ Construction de l’APK sur les serveurs Expo (10 à 20 minutes)…')
  builds = eas(['build', '--platform', 'android', '--profile', 'preview', '--wait'])
}
const build = Array.isArray(builds) ? builds[0] : builds
const url = lienApk(build)
if (!url) {
  console.error('\n✗ Aucun APK trouvé dans la réponse d’EAS (construction échouée ou annulée ?).')
  process.exit(1)
}

const destination = resolve(process.cwd(), NOM)
console.log(`→ Téléchargement de l’APK (version ${build.appVersion ?? '?'})…`)
const rep = await fetch(url)
if (!rep.ok || !rep.body) {
  console.error(`\n✗ Téléchargement impossible (${rep.status}). Lien : ${url}`)
  process.exit(1)
}
await pipeline(Readable.fromWeb(rep.body), createWriteStream(destination))
const mo = (statSync(destination).size / 1024 / 1024).toFixed(1)

console.log(`\n✓ APK prêt : ${destination} (${mo} Mo)`)
console.log(`  Lien direct (pour l'IT) : ${url}`)
console.log('  Sur le serveur, il se place ici : /srv/www/htdocs/eflotte-api/telechargements/eflotte-camusat.apk (tel quel)')
