// Notifications push (hors application) : jeton Expo → serveur (POST /api/inspections/push-token).
// Nécessite un APK construit avec EAS (FCM) ; sinon les alertes locales prennent le relais.
import AsyncStorage from '@react-native-async-storage/async-storage'
import Constants from 'expo-constants'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

import { useSession } from '../auth/session'
import { notifications } from './api'
import { CLE_JETON_PUSH, desactiverVerificationFond } from './localAlerts'

if (Platform.OS !== 'web') {
  // App ouverte : la notification s'affiche aussi en bandeau.
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: true,
    }),
  })
}

const expoGoAndroid = () => Platform.OS === 'android' && Constants.executionEnvironment === 'storeClient'

/** Autorisation + canal Android : nécessaires aussi aux alertes locales. */
export async function autoriserNotifications(): Promise<boolean> {
  try {
    if (Platform.OS === 'web') return false
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'eFlotte-Camusat',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#0f3b82',
      })
    }
    let { status } = await Notifications.getPermissionsAsync()
    if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status
    return status === 'granted'
  } catch {
    return false
  }
}

/** Jeton Expo → serveur (push distant). null si indisponible : les alertes locales prennent le relais. */
export async function enregistrerPush(): Promise<string | null> {
  try {
    if (Platform.OS === 'web' || !Device.isDevice || expoGoAndroid()) return null
    if (!(await autoriserNotifications())) return null
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId
    if (!projectId) return null
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId })
    await notifications.enregistrerJeton(token, Platform.OS)
    await AsyncStorage.setItem(CLE_JETON_PUSH, token)
    return token
  } catch {
    await AsyncStorage.removeItem(CLE_JETON_PUSH)
    return null
  }
}

/** Déconnexion : ce téléphone ne reçoit plus les notifications du compte, puis session fermée. */
export async function seDeconnecter(): Promise<void> {
  try {
    const token = await AsyncStorage.getItem(CLE_JETON_PUSH)
    if (token) {
      await notifications.supprimerJeton(token).catch(() => {})
      await AsyncStorage.removeItem(CLE_JETON_PUSH)
    }
  } catch {}
  await desactiverVerificationFond()
  await useSession.getState().fermer()
}
