import { useCallback, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, AppState, Pressable, StyleSheet, Text, View } from 'react-native'
import * as Updates from 'expo-updates'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { COLORS } from '../design/theme'

// Vérifie les mises à jour (EAS Update) au lancement, puis à chaque retour au premier plan
// (au plus toutes les MIN_GAP_MS). Quand une mise à jour existe, un bandeau propose de
// l'installer : téléchargement, puis redémarrage de l'app sur la nouvelle version.
// Fonctionne aussi pour un APK/IPA généré par EAS Build (même canal + même runtimeVersion).
// Inactif dans Expo Go et en développement (`Updates.isEnabled` est faux).
// Vérification au lancement (avec une 2e tentative rapide si le réseau n'est pas prêt), au retour
// au premier plan, puis toutes les POLL_MS tant que l'app reste ouverte : plus besoin de la quitter.
const MIN_GAP_MS = 10_000
const POLL_MS = 45_000
const RETRY_MS = 4_000

export default function UpdateBanner() {
  const insets = useSafeAreaInsets()
  const { isUpdateAvailable, isUpdatePending } = Updates.useUpdates()
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const lastCheck = useRef(0)

  const check = useCallback(async () => {
    if (!Updates.isEnabled) return
    if (Date.now() - lastCheck.current < MIN_GAP_MS) return
    lastCheck.current = Date.now()
    try {
      const r = await Updates.checkForUpdateAsync()
      // Téléchargement en arrière-plan : le bouton « Mettre à jour » redémarre alors instantanément.
      if (r.isAvailable) await Updates.fetchUpdateAsync()
    } catch {
      lastCheck.current = 0 // échec (réseau) : on retentera au prochain passage
    }
  }, [])

  useEffect(() => {
    check()
    const retry = setTimeout(check, RETRY_MS)
    const poll = setInterval(() => { if (AppState.currentState === 'active') check() }, POLL_MS)
    const sub = AppState.addEventListener('change', (st) => { if (st === 'active') check() })
    return () => { clearTimeout(retry); clearInterval(poll); sub.remove() }
  }, [check])

  const install = async () => {
    setBusy(true); setFailed(false)
    try {
      if (!isUpdatePending) await Updates.fetchUpdateAsync()
      await Updates.reloadAsync()
    } catch {
      setFailed(true); setBusy(false)
    }
  }

  if (!Updates.isEnabled || !(isUpdateAvailable || isUpdatePending)) return null

  return (
    <View pointerEvents="box-none" style={[S.wrap, { top: insets.top + 6 }]}>
      <View style={S.card} accessibilityRole="alert" accessibilityLiveRegion="polite">
        <View style={{ flex: 1 }}>
          <Text style={S.title}>Mise à jour disponible</Text>
          <Text style={S.sub}>{failed ? 'Échec du téléchargement. Vérifiez la connexion et réessayez.' : 'Une nouvelle version de l’application est prête.'}</Text>
        </View>
        <Pressable onPress={install} disabled={busy} accessibilityRole="button" accessibilityLabel="Mettre à jour l’application"
          style={({ pressed }) => [S.btn, (pressed || busy) && { opacity: 0.7 }]}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={S.btnText}>{failed ? 'Réessayer' : 'Mettre à jour'}</Text>}
        </Pressable>
      </View>
    </View>
  )
}

const S = StyleSheet.create({
  wrap: { position: 'absolute', left: 12, right: 12, zIndex: 1000, elevation: 10 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14,
    backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.blue900,
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
  },
  title: { fontWeight: '900', color: COLORS.blue900, fontSize: 14 },
  sub: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  btn: { backgroundColor: COLORS.blue900, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, minWidth: 110, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '900' },
})
