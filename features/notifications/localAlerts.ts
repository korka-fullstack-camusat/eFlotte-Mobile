// Alertes SANS Firebase (comme Inventory) : l'app interroge elle-même le serveur
//   • à l'ouverture de l'app, puis toutes les 30 s au premier plan ;
//   • en arrière-plan : toutes les ~15 min (minimum imposé par Android / iOS), même app fermée.
// Chaque nouvelle notification (relance, suivi d'une demande) devient une notification du
// téléphone. Si le push distant fonctionne (jeton enregistré), on ne double pas.
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as BackgroundTask from 'expo-background-task'
import * as Notifications from 'expo-notifications'
import * as TaskManager from 'expo-task-manager'
import { Platform } from 'react-native'

import { useSession } from '../auth/session'
import { inspections } from '../inspections/api'
import { notifications, type NotificationChauffeur } from './api'

const TACHE = 'eflotte-verifier-notifications'
export const CLE_JETON_PUSH = 'push:jeton_expo'

const CLE_AFFICHEES = 'notif:affichees'        // notifications déjà montrées sur le téléphone
const CLE_RAPPEL_CHECKLIST = 'notif:rappel_checklist'   // date (AAAA-MM-JJ) du dernier rappel checklist

const aujourdHui = () => new Date().toISOString().slice(0, 10)

async function lireAffichees(): Promise<Set<number>> {
  try { return new Set(JSON.parse((await AsyncStorage.getItem(CLE_AFFICHEES)) ?? '[]') as number[]) } catch { return new Set() }
}

/** Notification du téléphone (bandeau en haut de l'écran, son, centre de notifications), comme WhatsApp. */
async function afficher(titre: string, corps: string, data: Record<string, unknown>) {
  await Notifications.scheduleNotificationAsync({
    content: { title: titre, body: corps, data, sound: true },
    trigger: Platform.OS === 'android' ? { channelId: 'default' } : null,
  })
}

/**
 * Affiche sur le téléphone chaque notification non lue pas encore montrée (relance, suivi de
 * demande…), y compris à l'ouverture de l'app, une seule fois chacune ; met à jour le nombre
 * sur l'icône de l'app ; rappelle une fois par jour la checklist de la semaine si elle manque.
 */
export async function verifierNouvellesNotifications(): Promise<NotificationChauffeur[]> {
  if (!useSession.getState().token) await useSession.getState().charger()   // tâche de fond : app fermée
  if (!useSession.getState().token) return []
  const { items, non_lues } = await notifications.liste(20)
  if (Platform.OS === 'web') return []

  // Déjà montrée par le push distant (jeton enregistré) : pas de doublon
  const pushDistant = !!(await AsyncStorage.getItem(CLE_JETON_PUSH))
  const affichees = await lireAffichees()
  const nouvelles = items.filter((n) => !n.lue_at && !affichees.has(n.id)).sort((a, b) => a.id - b.id)
  if (!pushDistant) {
    for (const n of nouvelles.slice(-5)) {
      await afficher(n.titre, n.message ?? '', { ...(n.data ?? {}), type: n.type, notification_id: n.id })
    }
  }
  if (nouvelles.length) {
    const ids = [...affichees, ...nouvelles.map((n) => n.id)].slice(-300)
    await AsyncStorage.setItem(CLE_AFFICHEES, JSON.stringify(ids))
  }

  // Checklist de la semaine pas encore envoyée : rappel une fois par jour
  let rappel = 0
  try {
    if ((await AsyncStorage.getItem(CLE_RAPPEL_CHECKLIST)) !== aujourdHui()) {
      const espace = await inspections.moi()
      if (!espace.envoye_cette_semaine) {
        await afficher('Checklist de la semaine à envoyer',
          espace.vehicule_plaque ? `Véhicule ${espace.vehicule_plaque} : touchez pour remplir le rapport.` : 'Touchez pour remplir le rapport.',
          { ecran: 'NouveauRapport', type: 'RELANCE' })
        rappel = 1
      }
      await AsyncStorage.setItem(CLE_RAPPEL_CHECKLIST, aujourdHui())
    }
  } catch {}

  // Nombre de notifications non lues sur l'icône de l'app (selon le téléphone)
  try { await Notifications.setBadgeCountAsync(non_lues + rappel) } catch {}
  return nouvelles
}

// Défini au chargement de l'app (hors composant) pour que le système puisse l'exécuter app fermée.
if (Platform.OS !== 'web') {
  TaskManager.defineTask(TACHE, async () => {
    try {
      await verifierNouvellesNotifications()
      return BackgroundTask.BackgroundTaskResult.Success
    } catch {
      return BackgroundTask.BackgroundTaskResult.Failed
    }
  })
}

/** Planifie la vérification en arrière-plan (~15 min). Silencieux si indisponible (Expo Go, web). */
export async function activerVerificationFond(): Promise<void> {
  try {
    if (Platform.OS === 'web') return
    if ((await BackgroundTask.getStatusAsync()) !== BackgroundTask.BackgroundTaskStatus.Available) return
    if (await TaskManager.isTaskRegisteredAsync(TACHE)) return
    await BackgroundTask.registerTaskAsync(TACHE, { minimumInterval: 15 })
  } catch {}
}

export async function desactiverVerificationFond(): Promise<void> {
  try {
    if (Platform.OS !== 'web' && await TaskManager.isTaskRegisteredAsync(TACHE)) await BackgroundTask.unregisterTaskAsync(TACHE)
    await AsyncStorage.multiRemove([CLE_AFFICHEES, CLE_RAPPEL_CHECKLIST])
    await Notifications.setBadgeCountAsync(0).catch(() => {})
  } catch {}
}
