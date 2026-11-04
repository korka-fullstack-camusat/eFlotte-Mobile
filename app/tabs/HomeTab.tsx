// Accueil : bonjour, rappel si la checklist de la semaine est attendue, bouton
// « Nouveau rapport », puis les 3 derniers rapports envoyés.
import { useNavigation } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import { BellRing, CheckCircle2, ChevronRight, Plus } from 'lucide-react-native'
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'

import { Chargement, Erreur, Vide } from '../../components/Etats'
import { RapportCarte } from '../../components/Rapports'
import { COLORS } from '../../design/theme'
import { useSession } from '../../features/auth/session'
import { inspections } from '../../features/inspections/api'
import { aujourdhuiLong, formatDate } from '../../features/inspections/format'
import { S as shared } from './shared'

export default function HomeTab() {
  const nav = useNavigation<any>()
  const utilisateur = useSession((s) => s.utilisateur)
  const prenom = (utilisateur?.full_name || utilisateur?.username || '').split(' ')[0]
  const { data: espace, isLoading, isError, refetch, isRefetching } = useQuery({ queryKey: ['moi'], queryFn: inspections.moi })

  return (
    <ScrollView style={shared.screen} contentContainerStyle={H.container}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => { void refetch() }} colors={[COLORS.blue900]} />}>
      <View style={shared.head}>
        <Text style={shared.title} accessibilityRole="header">Bonjour {prenom} 👋</Text>
        <Text style={shared.subtitle}>{aujourdhuiLong()}</Text>
      </View>

      {isLoading ? <Chargement /> : isError || !espace ? (
        <Erreur texte="Impossible de charger votre espace. Vérifiez votre connexion." onRetry={refetch} />
      ) : (
        <View style={{ gap: 18 }}>
          {espace.envoye_cette_semaine ? (
            <View style={[H.bandeau, H.ok]}>
              <CheckCircle2 color={COLORS.green600} size={20} />
              <Text style={[H.bandeauTitre, { color: '#065F46' }]}>Checklist de la semaine envoyée. Merci !</Text>
            </View>
          ) : espace.relances.length > 0 ? (
            <View style={[H.bandeau, H.rappel]} accessibilityRole="alert">
              <BellRing color={COLORS.amber700} size={20} />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={[H.bandeauTitre, { color: '#92400E' }]}>Rappel : votre checklist est attendue</Text>
                {espace.relances.slice(0, 2).map((r) => (
                  <View key={r.id}>
                    <Text style={H.rappelTexte}>{r.message || 'Merci d’envoyer votre checklist de la semaine.'}</Text>
                    <Text style={H.rappelMeta}>{r.envoye_par ? `${r.envoye_par} · ` : ''}{formatDate(r.created_at, true)}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          <Pressable onPress={() => nav.navigate('NouveauRapport')} accessibilityRole="button"
            style={({ pressed }) => [H.nouveau, pressed && { opacity: 0.9 }]}>
            <Plus color="#fff" size={22} />
            <Text style={H.nouveauText}>Nouveau rapport</Text>
          </Pressable>

          <View style={{ gap: 10 }}>
            <View style={H.ligneTitre}>
              <Text style={shared.section}>Derniers rapports envoyés</Text>
              {espace.derniers_rapports.length > 0 && (
                <Pressable onPress={() => nav.navigate('Historique')} accessibilityRole="link" hitSlop={10} style={H.voirPlus}>
                  <Text style={H.voirPlusText}>Voir plus</Text>
                  <ChevronRight color={COLORS.blue900} size={16} />
                </Pressable>
              )}
            </View>
            {espace.derniers_rapports.length === 0 ? (
              <Vide texte="Vous n’avez encore envoyé aucun rapport." />
            ) : (
              espace.derniers_rapports.map((r) => (
                <RapportCarte key={r.id} rapport={r} onPress={() => nav.navigate('RapportDetail', { id: r.id })} />
              ))
            )}
          </View>
        </View>
      )}
    </ScrollView>
  )
}

const H = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingBottom: 32 },
  bandeau: { flexDirection: 'row', gap: 10, borderRadius: 16, borderWidth: 1, padding: 14, alignItems: 'flex-start' },
  ok: { backgroundColor: COLORS.green50, borderColor: '#A7F3D0' },
  rappel: { backgroundColor: COLORS.amber50, borderColor: COLORS.amber200 },
  bandeauTitre: { fontWeight: '800', fontSize: 14, flexShrink: 1 },
  rappelTexte: { color: '#92400E', fontSize: 13 },
  rappelMeta: { color: '#B45309', fontSize: 12, opacity: 0.85 },
  nouveau: {
    minHeight: 58, borderRadius: 18, backgroundColor: COLORS.blue900,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, elevation: 3,
  },
  nouveauText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  ligneTitre: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  voirPlus: { flexDirection: 'row', alignItems: 'center' },
  voirPlusText: { color: COLORS.blue900, fontWeight: '800' },
})
