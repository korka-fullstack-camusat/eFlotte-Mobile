// Profil : identité, véhicule, filiale, nombre de rapports ; mot de passe ; déconnexion.
import { useNavigation } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import { Building2, Car, ChevronRight, FileText, KeyRound, LogOut, Mail, Phone } from 'lucide-react-native'
import type { ComponentType } from 'react'
import { Alert, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'

import { initiales } from '../../components/AppHeader'
import { Chargement, Erreur } from '../../components/Etats'
import { COLORS } from '../../design/theme'
import { useSession } from '../../features/auth/session'
import { inspections } from '../../features/inspections/api'
import { libelleVersion } from '../../features/version'
import { resetTo } from '../../lib/navigationRef'
import { S as shared } from './shared'

function Ligne({ Icon, label, valeur }: { Icon: ComponentType<{ color?: string; size?: number }>; label: string; valeur: string }) {
  return (
    <View style={P.ligne}>
      <Icon color={COLORS.blue900} size={18} />
      <View style={{ flex: 1 }}>
        <Text style={P.ligneLabel}>{label}</Text>
        <Text style={P.ligneValeur} numberOfLines={1}>{valeur}</Text>
      </View>
    </View>
  )
}

export default function ProfilTab() {
  const nav = useNavigation<any>()
  const utilisateur = useSession((s) => s.utilisateur)
  const { data: espace, isLoading, isError, refetch, isRefetching } = useQuery({ queryKey: ['moi'], queryFn: inspections.moi })
  const nom = espace?.full_name || espace?.username || ''

  const deconnexion = () => {
    const go = async () => { await useSession.getState().fermer(); resetTo('Login') }
    if (Platform.OS === 'web') { void go(); return }
    Alert.alert('Se déconnecter ?', 'Vous devrez saisir à nouveau votre identifiant et votre mot de passe.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Se déconnecter', style: 'destructive', onPress: () => void go() },
    ])
  }

  if (isLoading) return <View style={shared.screen}><Chargement /></View>
  if (isError || !espace) return <View style={shared.screen}><Erreur texte="Impossible de charger votre profil." onRetry={refetch} /></View>

  const vehicule = espace.vehicule
  return (
    <ScrollView style={shared.screen} contentContainerStyle={P.container}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => { void refetch() }} colors={[COLORS.blue900]} />}>
      <View style={P.carteId}>
        <View style={P.avatar}><Text style={P.avatarText}>{initiales(nom)}</Text></View>
        <Text style={P.nom} accessibilityRole="header">{nom}</Text>
        <Text style={P.sous}>@{espace.username} · Chauffeur</Text>
      </View>

      <View style={P.bloc}>
        <Ligne Icon={Car} label="Véhicule attribué" valeur={
          espace.vehicule_plaque
            ? [espace.vehicule_plaque, [vehicule?.marque, vehicule?.modele].filter(Boolean).join(' ')].filter(Boolean).join(' — ')
            : 'Choisi lors de votre premier rapport'} />
        <View style={P.sep} />
        <Ligne Icon={Building2} label="Filiale" valeur={espace.filiale || '—'} />
        <View style={P.sep} />
        <Ligne Icon={Phone} label="Téléphone" valeur={utilisateur?.telephone || '—'} />
        {!!espace.email && (<><View style={P.sep} /><Ligne Icon={Mail} label="E-mail" valeur={espace.email} /></>)}
        <View style={P.sep} />
        <Ligne Icon={FileText} label="Rapports envoyés" valeur={String(espace.nb_rapports)} />
      </View>

      <View style={P.bloc}>
        <Pressable onPress={() => nav.navigate('ChangePassword')} accessibilityRole="button" style={({ pressed }) => [P.action, pressed && { opacity: 0.8 }]}>
          <KeyRound color={COLORS.blue900} size={18} />
          <Text style={[P.actionText, { flex: 1 }]}>Changer le mot de passe</Text>
          <ChevronRight color={COLORS.muted} size={18} />
        </Pressable>
        <View style={P.sep} />
        <Pressable onPress={deconnexion} accessibilityRole="button" style={({ pressed }) => [P.action, pressed && { opacity: 0.8 }]}>
          <LogOut color="#b91c1c" size={18} />
          <Text style={[P.actionText, { color: '#b91c1c' }]}>Se déconnecter</Text>
        </Pressable>
      </View>

      <Text style={P.version}>{libelleVersion()}</Text>
    </ScrollView>
  )
}

const P = StyleSheet.create({
  container: { padding: 16, gap: 14, paddingBottom: 32 },
  carteId: { alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, borderRadius: 18, padding: 20, backgroundColor: '#fff' },
  avatar: { width: 76, height: 76, borderRadius: 38, backgroundColor: COLORS.blue900, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 26, fontWeight: '900' },
  nom: { marginTop: 10, fontSize: 18, fontWeight: '900', color: COLORS.text, textAlign: 'center' },
  sous: { color: COLORS.muted, fontWeight: '600', marginTop: 2 },
  bloc: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 18, backgroundColor: '#fff', paddingHorizontal: 14 },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  ligneLabel: { fontSize: 12, color: COLORS.muted, fontWeight: '600' },
  ligneValeur: { fontSize: 15, color: COLORS.text, fontWeight: '700' },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: COLORS.border },
  action: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  actionText: { fontSize: 15, fontWeight: '800', color: COLORS.blue900 },
  version: { textAlign: 'center', color: COLORS.muted, fontSize: 12, fontWeight: '600' },
})
