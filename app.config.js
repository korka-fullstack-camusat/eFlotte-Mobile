// Configuration Expo : app.json + réglages calculés.
// Notifications push (app fermée) sur Android : Firebase Cloud Messaging. Il suffit de déposer
// le fichier google-services.json (console Firebase, appli Android « com.camusat.eflotte »)
// à la racine du projet ; il est alors pris en compte au prochain « npm run apk ».
const { existsSync } = require('node:fs')
const { join } = require('node:path')

module.exports = ({ config }) => {
  const firebase = existsSync(join(__dirname, 'google-services.json'))
  return {
    ...config,
    android: {
      ...config.android,
      ...(firebase ? { googleServicesFile: './google-services.json' } : {}),
    },
    // Version web (iPhone : ajoutée à l'écran d'accueil) servie par le site sous /mobile/
    // (npm run web:build → dossier public/mobile du front).
    // EFLOTTE_WEB=1 (posé par le script) : chemin /mobile réservé à l'export web, l'APK et
    // les mises à jour EAS ne sont pas concernés.
    web: { ...config.web, output: 'single', name: 'eFlotte', shortName: 'eFlotte' },
    ...(process.env.EFLOTTE_WEB === '1' ? { experiments: { ...config.experiments, baseUrl: '/mobile' } } : {}),
  }
}
