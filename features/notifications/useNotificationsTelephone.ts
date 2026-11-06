// À monter une fois connecté : autorisation, push distant ou alertes locales, rafraîchissement
// des listes à l'arrivée d'une notification, ouverture de l'écran voulu au toucher.
import { useQueryClient } from '@tanstack/react-query'
import * as Notifications from 'expo-notifications'
import { useEffect } from 'react'
import { AppState, Platform } from 'react-native'

import { navigationRef } from '../../lib/navigationRef'
import { cibleNotification } from './api'
import { activerVerificationFond, verifierNouvellesNotifications } from './localAlerts'
import { autoriserNotifications, enregistrerPush } from './push'

export function useNotificationsTelephone() {
  const qc = useQueryClient()

  useEffect(() => {
    const rafraichir = () => {
      void qc.invalidateQueries({ queryKey: ['notifications'] })
      void qc.invalidateQueries({ queryKey: ['moi'] })
      void qc.invalidateQueries({ queryKey: ['mesDemandes'] })
    }
    const verifier = async () => {
      try { if ((await verifierNouvellesNotifications()).length) rafraichir() } catch {}
    }

    // D'abord l'autorisation et le canal Android, puis l'affichage des notifications en attente
    void (async () => {
      if (Platform.OS !== 'web') await autoriserNotifications()
      await verifier()
      if (Platform.OS !== 'web') { await enregistrerPush(); await activerVerificationFond() }
    })()
    const minuterie = setInterval(() => { if (AppState.currentState === 'active') void verifier() }, 30_000)
    const etat = AppState.addEventListener('change', (st) => { if (st === 'active') void verifier() })
    if (Platform.OS === 'web') return () => { clearInterval(minuterie); etat.remove() }

    const ouvrir = (data: Record<string, unknown> | undefined) => {
      if (!navigationRef.isReady()) return
      const c = cibleNotification(data?.type as string | undefined, data)
      navigationRef.navigate(c.name, c.params)
    }
    const recue = Notifications.addNotificationReceivedListener(rafraichir)
    const touchee = Notifications.addNotificationResponseReceivedListener((r) => {
      rafraichir()
      ouvrir(r.notification.request.content.data as Record<string, unknown>)
    })
    // App lancée en touchant une notification (fermée au départ)
    Notifications.getLastNotificationResponseAsync().then((r) => {
      if (r) setTimeout(() => ouvrir(r.notification.request.content.data as Record<string, unknown>), 600)
    }).catch(() => {})

    return () => { recue.remove(); touchee.remove(); clearInterval(minuterie); etat.remove() }
  }, [qc])
}
