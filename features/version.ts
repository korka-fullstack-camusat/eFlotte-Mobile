// Version affichée dans le profil : version de l'APK + mise à jour en direct (EAS Update) reçue.
import Constants from 'expo-constants'
import * as Updates from 'expo-updates'

import { formatDate } from './inspections/format'

export function libelleVersion(): string {
  const version = Constants.expoConfig?.version ?? '—'
  // Mise à jour téléchargée (et non le code d'origine de l'APK) : on affiche sa date
  if (Updates.isEnabled && !Updates.isEmbeddedLaunch && Updates.createdAt) {
    return `Version ${version} · mise à jour du ${formatDate(Updates.createdAt.toISOString(), true)}`
  }
  return `Version ${version}`
}
