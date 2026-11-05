// Accueil (style Inventory) : bonjour + plaque du véhicule, notifications reçues
// (relances, suivi des demandes, checklist attendue), accès rapide.
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  BellRing, CheckCircle2, ChevronRight, ClipboardCheck, ClipboardList, History, Inbox, Info, Wrench,
} from 'lucide-react-native'
import { useCallback } from 'react'
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'

import { Chargement, Erreur, Vide } from '../../components/Etats'
import { COLORS } from '../../design/theme'
import { useSession } from '../../features/auth/session'
import { inspections } from '../../features/inspections/api'
import { aujourdhuiLong, formatDate } from '../../features/inspections/format'
import { cibleNotification, notifications, type NotificationChauffeur } from '../../features/notifications/api'
import { S as shared } from './shared'

type Carte = {
  id: string
  titre: string
  sousTitre?: string
  type: 'RELANCE' | 'DEMANDE' | 'INFO' | 'CHECKLIST'
  nonLue: boolean
  aller: () => void
}

const ICONES = { RELANCE: BellRing, DEMANDE: Inbox, INFO: Info, CHECKLIST: ClipboardCheck }

function CarteNotification({ c }: { c: Carte }) {
  const Icone = ICONES[c.type]
  const alerte = c.type === 'RELANCE' || c.type === 'CHECKLIST'
  return (
    <Pressable onPress={c.aller} accessibilityRole="button" accessibilityLabel={`${c.titre}${c.sousTitre ? `. ${c.sousTitre}` : ''}`}
      style={({ pressed }) => [H.notif, pressed && { opacity: 0.85 }]}>
      <View style={[H.notifIcone, alerte && { backgroundColor: COLORS.amber50 }]}>
        <Icone color={alerte ? COLORS.amber700 : COLORS.blue900} size={20} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={H.notifTitre} numberOfLines={2}>{c.titre}</Text>
        {!!c.sousTitre && <Text style={H.notifSous} numberOfLines={2}>{c.sousTitre}</Text>}
      </View>
      {c.nonLue && <View style={H.point} accessibilityLabel="Non lue" />}
      <ChevronRight color={COLORS.blue900} size={18} />
    </Pressable>
  )
}

function Tuile({ label, Icone, onPress }: { label: string; Icone: typeof Wrench; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label}
      style={({ pressed }) => [H.tuile, pressed && { opacity: 0.85 }]}>
      <View style={H.tuileIcone}><Icone color={COLORS.blue900} size={22} /></View>
      <Text style={H.tuileTexte} numberOfLines={2}>{label}</Text>
    </Pressable>
  )
}

export default function HomeTab() {
  const nav = useNavigation<any>()
  const qc = useQueryClient()
  const utilisateur = useSession((s) => s.utilisateur)
  const prenom = (utilisateur?.full_name || utilisateur?.username || '').split(' ')[0]
  const espaceQ = useQuery({ queryKey: ['moi'], queryFn: inspections.moi })
  const notifQ = useQuery({ queryKey: ['notifications'], queryFn: () => notifications.liste(30) })
  const plaque = espaceQ.data?.vehicule_plaque ?? utilisateur?.vehicule_plaque

  // Retour sur l'accueil : on relit (une relance a pu arriver)
  const { refetch: r1 } = espaceQ
  const { refetch: r2 } = notifQ
  useFocusEffect(useCallback(() => { void r1(); void r2() }, [r1, r2]))

  const lues = useMutation({
    mutationFn: notifications.marquerLues,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const ouvrir = (n: NotificationChauffeur) => {
    if (!n.lue_at) lues.mutate()
    const c = cibleNotification(n.type, n.data)
    nav.navigate(c.name, c.params)
  }

  const espace = espaceQ.data
  const cartes: Carte[] = []
  if (espace && !espace.envoye_cette_semaine) {
    cartes.push({
      id: 'checklist', type: 'CHECKLIST', nonLue: true,
      titre: 'Checklist de la semaine à envoyer',
      sousTitre: plaque ? `Véhicule ${plaque}` : 'Touchez pour remplir le rapport.',
      aller: () => nav.navigate('NouveauRapport'),
    })
  }
  for (const n of (notifQ.data?.items ?? []).slice(0, 3)) {
    cartes.push({
      id: String(n.id), type: n.type, nonLue: !n.lue_at, titre: n.titre,
      sousTitre: [n.message, formatDate(n.created_at, true)].filter(Boolean).join(' · '),
      aller: () => ouvrir(n),
    })
  }
  const nonLues = (notifQ.data?.non_lues ?? 0) + (espace && !espace.envoye_cette_semaine ? 1 : 0)

  return (
    <ScrollView style={shared.screen} contentContainerStyle={H.container}
      refreshControl={<RefreshControl refreshing={espaceQ.isRefetching || notifQ.isRefetching}
        onRefresh={() => { void r1(); void r2() }} colors={[COLORS.blue900]} />}>
      <View style={H.entete}>
        <Text style={shared.title} accessibilityRole="header" numberOfLines={1}>Bonjour {prenom} 👋</Text>
        {!!plaque && (
          <Text style={H.plaqueLabel}>Matricule véhicule : <Text style={H.plaqueTexte}>{plaque}</Text></Text>
        )}
        <Text style={shared.subtitle}>{aujourdhuiLong()}</Text>
      </View>

      {espaceQ.isLoading ? <Chargement /> : espaceQ.isError || !espace ? (
        <Erreur texte="Impossible de charger votre espace. Vérifiez votre connexion." onRetry={r1} />
      ) : (
        <View style={{ gap: 22, flex: 1 }}>
          {espace.envoye_cette_semaine && (
            <View style={H.ok}>
              <CheckCircle2 color={COLORS.green600} size={20} />
              <Text style={H.okTexte}>Checklist de la semaine envoyée. Merci !</Text>
            </View>
          )}

          {/* ── Notifications ── */}
          <View style={{ gap: 10 }}>
            <View style={H.ligneTitre}>
              <View style={H.titreAvecBadge}>
                <Text style={shared.section}>🔔 Notifications</Text>
                {nonLues > 0 && <View style={H.badge}><Text style={H.badgeTexte}>{nonLues}</Text></View>}
              </View>
              {(notifQ.data?.non_lues ?? 0) > 0 && (
                <Pressable onPress={() => lues.mutate()} hitSlop={10} accessibilityRole="button">
                  <Text style={H.lien}>Tout marquer lu</Text>
                </Pressable>
              )}
            </View>
            {notifQ.isLoading && cartes.length === 0 ? <Chargement texte="Chargement des notifications…" /> :
              cartes.length === 0 ? <Vide texte="Aucune notification pour le moment." /> :
                cartes.slice(0, 3).map((c) => <CarteNotification key={c.id} c={c} />)}
            {notifQ.isError && <Text style={H.notifSous}>Notifications indisponibles hors connexion.</Text>}
          </View>

          {/* ── Accès rapide ── */}
          <View style={{ gap: 10, flex: 1 }}>
            <Text style={shared.section}>⚡ Accès rapide</Text>
            {/* Les tuiles s'agrandissent pour occuper le bas de l'écran quand il y a peu de notifications */}
            <View style={H.grille}>
              <View style={H.rangee}>
                <Tuile label="Rapport checklist" Icone={ClipboardCheck} onPress={() => nav.navigate('NouveauRapport')} />
                <Tuile label="Signaler une panne" Icone={Wrench} onPress={() => nav.navigate('Demandes', { screen: 'DemandeForm', params: { nature: 'PANNE' }, initial: false })} />
              </View>
              <View style={H.rangee}>
                <Tuile label="Mes demandes" Icone={ClipboardList} onPress={() => nav.navigate('Historique', { onglet: 'demandes', t: Date.now() })} />
                <Tuile label="Historique" Icone={History} onPress={() => nav.navigate('Historique')} />
              </View>
            </View>
          </View>

        </View>
      )}
    </ScrollView>
  )
}

const H = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingBottom: 20, flexGrow: 1 },
  entete: { paddingTop: 16, paddingBottom: 14, gap: 4 },
  plaqueLabel: { color: COLORS.text, fontWeight: '700', fontSize: 18, marginTop: 2 },
  plaqueTexte: { color: COLORS.blue900, fontWeight: '900', letterSpacing: 0.5 },
  ok: {
    flexDirection: 'row', gap: 10, alignItems: 'center', borderRadius: 16, borderWidth: 1, padding: 14,
    backgroundColor: COLORS.green50, borderColor: '#A7F3D0',
  },
  okTexte: { color: '#065F46', fontWeight: '800', fontSize: 14, flexShrink: 1 },
  ligneTitre: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titreAvecBadge: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { minWidth: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.red600, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  badgeTexte: { color: '#fff', fontWeight: '900', fontSize: 12 },
  notif: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff',
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, padding: 12,
  },
  notifIcone: { width: 42, height: 42, borderRadius: 12, backgroundColor: COLORS.blue50, alignItems: 'center', justifyContent: 'center' },
  notifTitre: { color: COLORS.text, fontWeight: '800', fontSize: 14 },
  notifSous: { color: COLORS.muted, fontSize: 12, fontWeight: '600' },
  point: { width: 9, height: 9, borderRadius: 5, backgroundColor: COLORS.red600 },
  grille: { flex: 1, gap: 12 },
  rangee: { flex: 1, flexDirection: 'row', gap: 12, maxHeight: 140 },
  tuile: {
    flex: 1, minHeight: 96, backgroundColor: COLORS.blue50, borderRadius: 18,
    borderWidth: 1, borderColor: COLORS.blue100, padding: 14, gap: 8, alignItems: 'center', justifyContent: 'center',
  },
  tuileIcone: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  tuileTexte: { color: COLORS.blue900, fontWeight: '900', fontSize: 14, textAlign: 'center' },
  lien: { color: COLORS.blue900, fontWeight: '800' },
})
