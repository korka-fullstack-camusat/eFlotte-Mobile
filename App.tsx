// App.tsx — eFlotte mobile : checklists véhicule des chauffeurs Camusat.
import AsyncStorage from '@react-native-async-storage/async-storage'
import { NavigationContainer, useNavigation } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useMemo } from 'react'
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import ChangePasswordScreen from './app/ChangePasswordScreen'
import LoginScreen from './app/LoginScreen'
import NouveauRapportScreen from './app/NouveauRapportScreen'
import PremiereConnexionScreen from './app/PremiereConnexionScreen'
import RapportDetailScreen from './app/RapportDetailScreen'
import MainTabs from './app/tabs/MainTabs'
import { AppHeaderBar } from './components/AppHeader'
import { ToasterProvider } from './components/ui/Toaster'
import UpdateBanner from './components/UpdateBanner'
import { profil } from './features/auth/api'
import { lireBrouillon } from './features/inspections/brouillon'
import './features/notifications/localAlerts'   // définit la tâche de fond (vérification app fermée)
import { useSession } from './features/auth/session'
import { navigationRef } from './lib/navigationRef'
import { queryClient } from './lib/query'

const Stack = createNativeStackNavigator()
const CAMUSAT_BLUE = '#0f3b82'

// Les données déjà vues (accueil, historique, modèle de checklist) restent sur le téléphone :
// l'app s'ouvre tout de suite sur les derniers chiffres, puis se met à jour.
const persister = createAsyncStoragePersister({ storage: AsyncStorage, key: 'eflotte.cache' })

export default function App() {
  return (
    <PersistQueryClientProvider client={queryClient}
      persistOptions={{ persister, maxAge: 7 * 24 * 3600 * 1000, buster: 'v1' }}>
      <ToasterProvider>
        <StatusBar style="dark" />
        <SafeAreaProvider>
          <NavigationContainer ref={navigationRef}>
            <Root />
          </NavigationContainer>
          {/* Bandeau « Mise à jour disponible » (EAS Update) */}
          <UpdateBanner />
        </SafeAreaProvider>
      </ToasterProvider>
    </PersistQueryClientProvider>
  )
}

/* ---------- Démarrage : jeton enregistré ? compte toujours valide ? ---------- */
// Jamais plus de DEMARRAGE_MAX_MS : sans réponse du serveur, on garde la session et on ouvre
// l'accueil (données gardées sur le téléphone) plutôt qu'un « Chargement… » sans fin.
const DEMARRAGE_MAX_MS = 6000

function SplashScreen() {
  const nav = useNavigation<any>()
  useEffect(() => {
    let fini = false
    const aller = (name: string) => { if (!fini) { fini = true; nav.reset({ index: 0, routes: [{ name }] }) } }
    ;(async () => {
      const token = await useSession.getState().charger()
      if (!token) return aller('Login')
      const delai = setTimeout(() => aller('Main'), DEMARRAGE_MAX_MS)
      try {
        const moi = await profil()
        clearTimeout(delai)
        if (moi.role !== 'CHAUFFEUR') { await useSession.getState().fermer(); return aller('Login') }
        await useSession.getState().ouvrir(token, moi)
        if (moi.doit_changer_mdp) return aller('PremiereConnexion')
        // Android a fermé l'app pendant une prise de photo : on rouvre la checklist en cours
        const brouillon = await lireBrouillon(moi.username)
        if (brouillon?.photoAttendue && !fini) {
          fini = true
          nav.reset({ index: 1, routes: [{ name: 'Main' }, { name: 'NouveauRapport' }] })
          return
        }
        aller('Main')
      } catch (e: any) {
        clearTimeout(delai)
        const status = e?.response?.status
        if (status === 401 || status === 403) { await useSession.getState().fermer(); return aller('Login') }
        aller('Main')   // hors réseau : on garde la session
      }
    })()
    return () => { fini = true }
  }, [nav])

  return (
    <View style={S.splash}>
      <Image source={require('./assets/camusat-logo.png')} style={{ width: 96, height: 96, resizeMode: 'contain' }} />
      <Text style={S.splashTitre}>eFlotte — Camusat</Text>
      <ActivityIndicator color={CAMUSAT_BLUE} />
    </View>
  )
}

function Root() {
  const options = useMemo(() => ({
    header: ({ back }: { back?: unknown }) => <AppHeaderBar back={back} />,
    contentStyle: { backgroundColor: '#ffffff' },
  }), [])

  return (
    <Stack.Navigator initialRouteName="Splash" screenOptions={options}>
      <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="PremiereConnexion" component={PremiereConnexionScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
      {/* Formulaire plein écran : son propre en-tête (étape + progression + fermer) */}
      <Stack.Screen name="NouveauRapport" component={NouveauRapportScreen} options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="RapportDetail" component={RapportDetailScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
    </Stack.Navigator>
  )
}

const S = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, backgroundColor: '#fff' },
  splashTitre: { color: CAMUSAT_BLUE, fontWeight: '900', fontSize: 18 },
})
