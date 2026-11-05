// Alertes SANS Firebase (comme Inventory) : l'app interroge elle-même le serveur
//   • au premier plan : toutes les 30 s ;
//   • en arrière-plan : toutes les ~15 min (minimum imposé par Android / iOS), même app fermée.
// Chaque nouvelle notification (relance, suivi d'une demande) devient une notification du
// téléphone. Si le push distant fonctionne (jeton enregistré), on ne double pas.
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as BackgroundTask from 'expo-background-task'
import * as Notifications from 'expo-notifications'
import * as TaskManager from 'expo-task-manager'
import { Platform } from 'react-native'

import { useSession } from '../auth/session'
import { notifications, type NotificationChauffeur } from './api'

const TACHE = 'eflotte-verifier-notifications'
const CLE_DERNIER_ID = 'notif:dernier_id'
export const CLE_JETON_PUSH = 'push:jeton_expo'

/** Affiche sur le téléphone les notifications arrivées depuis la dernière vérification. */
export async function verifierNouvellesNotifications(): Promise<NotificationChauffeur[]> {
  if (!useSession.getState().token) await useSession.getState().charger()   // tâche de fond : app fermée
  if (!useSession.getState().token) return []
  const { items } = await notifications.liste(20)
  if (!items.length) return []
  const maxId = Math.max(...items.map((n) => n.id))

  const stocke = await AsyncStorage.getItem(CLE_DERNIER_ID)
  if (stocke === null) {            // première fois : on part de l'état actuel, sans rejouer l'historique
    await AsyncStorage.setItem(CLE_DERNIER_ID, String(maxId))
    return []
  }
  const nouvelles = items.filter((n) => n.id > Number(stocke) && !n.lue_at).sort((a, b) => a.id - b.id)
  if (maxId > Number(stocke)) await AsyncStorage.setItem(CLE_DERNIER_ID, String(maxId))
  if (!nouvelles.length) return []

  const pushDistant = !!(await AsyncStorage.getItem(CLE_JETON_PUSH))
  if (!pushDistant && Platform.OS !== 'web') {
    for (const n of nouvelles.slice(-5)) {
      await Notifications.scheduleNotificationAsync({
        content: { title: n.titre, body: n.message ?? '', data: { ...(n.data ?? {}), type: n.type, notification_id: n.id }, sound: true },
        trigger: Platform.OS === 'android' ? { channelId: 'default' } : null,
      })
    }
  }
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
    await AsyncStorage.removeItem(CLE_DERNIER_ID)
  } catch {}
}
