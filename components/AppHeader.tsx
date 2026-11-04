// En-tête commun (style Inventory) : [retour] logo + « eFlotte-Camusat » à gauche,
// plaque du véhicule + avatar (menu) à droite.
import { useIsFocused, useNavigation, useNavigationState } from '@react-navigation/native'
import { StatusBar } from 'expo-status-bar'
import { Car, ChevronLeft } from 'lucide-react-native'
import { useState } from 'react'
import { Image, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'

import { useSession } from '../features/auth/session'
import { resetTo } from '../lib/navigationRef'

export function initiales(nom: string) {
  return nom.split(/\s+/).filter(Boolean).slice(0, 2).map((m) => m[0]!.toUpperCase()).join('')
}

export function HeaderUserMenu() {
  const nav = useNavigation<any>()
  const [open, setOpen] = useState(false)
  const utilisateur = useSession((s) => s.utilisateur)
  const nom = utilisateur?.full_name || utilisateur?.username || ''

  const allerProfil = () => { setOpen(false); nav.navigate('Main', { screen: 'Profil' }) }
  const allerMdp = () => { setOpen(false); nav.navigate('ChangePassword') }
  const deconnexion = async () => {
    setOpen(false)
    await useSession.getState().fermer()
    resetTo('Login')
  }

  return (
    <>
      <Pressable hitSlop={10} onPress={() => setOpen(true)} accessibilityRole="button" accessibilityLabel="Menu du compte"
        style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
        <View style={headerStyles.avatar}><Text style={headerStyles.avatarText}>{initiales(nom) || '?'}</Text></View>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={headerStyles.backdrop} onPress={() => setOpen(false)} accessibilityLabel="Fermer le menu" />
        <SafeAreaView pointerEvents="box-none" style={headerStyles.menuSafe}>
          <View style={headerStyles.menuBox}>
            <Pressable onPress={allerProfil} style={headerStyles.menuItem}><Text style={headerStyles.menuText}>Profil</Text></Pressable>
            <View style={headerStyles.divider} />
            <Pressable onPress={allerMdp} style={headerStyles.menuItem}><Text style={headerStyles.menuText}>Changer le mot de passe</Text></Pressable>
            <View style={headerStyles.divider} />
            <Pressable onPress={deconnexion} style={headerStyles.menuItem}>
              <Text style={[headerStyles.menuText, { color: '#b91c1c', fontWeight: '700' }]}>Se déconnecter</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </>
  )
}

export function HeaderLeftBrand() {
  return (
    <View style={headerStyles.leftWrap}>
      <View style={headerStyles.logoWrap}>
        <Image source={require('../assets/camusat-logo.png')} style={{ width: 22, height: 22, resizeMode: 'contain' }} />
      </View>
      <Text style={headerStyles.appTitle} numberOfLines={1}>eFlotte-Camusat</Text>
    </View>
  )
}

/** Bouton retour (quand il y a une page précédente) suivi du logo. */
export function HeaderLeft({ canGoBack }: { canGoBack?: boolean }) {
  const nav = useNavigation<any>()
  const focused = useIsFocused()
  const stackHasHistory = useNavigationState((st) => (st?.index ?? 0) > 0 && st?.type === 'stack')
  const showBack = !!canGoBack || stackHasHistory
  return (
    <View style={headerStyles.leftWrap}>
      {/* En-tête bleu : icônes de la barre d'état en clair tant que cet écran est affiché. */}
      {focused ? <StatusBar style="light" /> : null}
      {showBack ? (
        <Pressable onPress={() => nav.goBack()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Retour"
          style={({ pressed }) => [{ marginLeft: -4, opacity: pressed ? 0.6 : 1 }]}>
          <ChevronLeft color="#ffffff" size={28} strokeWidth={2.4} />
        </Pressable>
      ) : null}
      <HeaderLeftBrand />
    </View>
  )
}

/** Plaque du véhicule attribué (sur fond blanc, comme sur le web). */
function PlaqueVehicule() {
  const plaque = useSession((s) => s.utilisateur?.vehicule_plaque)
  if (!plaque) return null
  return (
    <View style={headerStyles.plaque} accessibilityLabel={`Mon véhicule : ${plaque}`}>
      <Car color="#0f3b82" size={14} />
      <Text style={headerStyles.plaqueText}>{plaque}</Text>
    </View>
  )
}

/** En-tête complet dessiné en JS (bleu Camusat). */
export function AppHeaderBar({ back }: { back?: unknown }) {
  const insets = useSafeAreaInsets()
  return (
    <View style={[headerStyles.bar, { paddingTop: insets.top }]}>
      <View style={headerStyles.barRow}>
        <HeaderLeft canGoBack={!!back} />
        <View style={headerStyles.rightWrap}>
          <PlaqueVehicule />
          <HeaderUserMenu />
        </View>
      </View>
    </View>
  )
}

export const headerStyles = StyleSheet.create({
  bar: { backgroundColor: '#0f3b82' },
  barRow: { height: 56, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  leftWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  rightWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoWrap: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)',
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
  },
  appTitle: { fontSize: 16, fontWeight: '800', color: '#ffffff', letterSpacing: 0.2, flexShrink: 1 },
  plaque: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
  },
  plaqueText: { color: '#0f3b82', fontWeight: '900', fontSize: 12, letterSpacing: 0.5 },
  avatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.12)' },
  menuSafe: { position: 'absolute', top: Platform.OS === 'ios' ? 60 : 54, right: 12 },
  menuBox: {
    minWidth: 220, backgroundColor: '#fff', borderRadius: 16, paddingVertical: 4,
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 16, elevation: 6,
    borderWidth: 1, borderColor: 'rgba(15,59,130,0.12)',
  },
  menuItem: { paddingHorizontal: 14, paddingVertical: 12 },
  menuText: { fontSize: 15, color: '#0b1f44' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#e5e7eb', marginHorizontal: 8 },
})
