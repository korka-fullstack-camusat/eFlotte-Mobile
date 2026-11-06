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
  }
}
