// Onglet « Demandes » : les principales demandes du chauffeur. Le rapport checklist ouvre
// le formulaire existant ; remontée, panne et vidange ouvrent le formulaire de demande.
// En dessous : « Mes demandes » et leur suivi (envoyée, en cours, traitée).
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import { ArrowUpFromLine, ChevronRight, ClipboardCheck, Droplets, Wrench } from 'lucide-react-native'
import { useCallback } from 'react'
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'

import { Chargement, Erreur, Vide } from '../../components/Etats'
import { COLORS } from '../../design/theme'
import { demandes, NATURES, STATUTS, type Demande, type NatureDemande } from '../../features/demandes/api'
import { formatDate, formatKm } from '../../features/inspections/format'
import { S as shared } from './shared'

export const ICONES_NATURE = { REMONTEE: ArrowUpFromLine, PANNE: Wrench, VIDANGE: Droplets }

const CHOIX: { cle: 'CHECKLIST' | NatureDemande; titre: string; sous: string; Icone: typeof Wrench }[] = [
  { cle: 'CHECKLIST', titre: 'Rapport checklist', sous: 'Checklist hebdomadaire du véhicule', Icone: ClipboardCheck },
  { cle: 'REMONTEE', titre: 'Remontée', sous: 'Signaler une remontée du véhicule', Icone: ArrowUpFromLine },
  { cle: 'PANNE', titre: 'Panne', sous: 'Déclarer une panne', Icone: Wrench },
  { cle: 'VIDANGE', titre: 'Vidange', sous: 'Demander une vidange', Icone: Droplets },
]

const COULEURS_STATUT = {
  NOUVELLE: { fond: COLORS.blue50, bord: COLORS.blue100, texte: COLORS.blue900 },
  EN_COURS: { fond: COLORS.amber50, bord: COLORS.amber200, texte: COLORS.amber700 },
  TRAITEE: { fond: COLORS.green50, bord: '#A7F3D0', texte: '#065F46' },
}

function CarteDemande({ d }: { d: Demande }) {
  const Icone = ICONES_NATURE[d.nature] ?? Wrench
  const c = COULEURS_STATUT[d.statut] ?? COULEURS_STATUT.NOUVELLE
  return (
    <View style={T.demande}>
      <View style={T.ligne}>
        <View style={T.icone}><Icone color={COLORS.blue900} size={18} /></View>
        <View style={{ flex: 1 }}>
          <Text style={T.demandeTitre}>{NATURES[d.nature] ?? d.nature} · {d.immatriculation}</Text>
          <Text style={T.meta}>{formatDate(d.created_at, true)} · {formatKm(d.kilometrage)}</Text>
        </View>
        <View style={[T.statut, { backgroundColor: c.fond, borderColor: c.bord }]}>
          <Text style={[T.statutTexte, { color: c.texte }]}>{STATUTS[d.statut] ?? d.statut}</Text>
        </View>
      </View>
      <Text style={T.meta}>{d.position} · Technicien : {d.technicien}</Text>
      {!!d.commentaire && <Text style={T.commentaire}>{d.commentaire}</Text>}
    </View>
  )
}

export default function DemandesTab() {
  const nav = useNavigation<any>()
  const q = useQuery({ queryKey: ['mesDemandes'], queryFn: () => demandes.mes(1, 20) })
  const { refetch } = q
  useFocusEffect(useCallback(() => { void refetch() }, [refetch]))

  return (
    <ScrollView style={shared.screen} contentContainerStyle={T.container}
      refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => { void refetch() }} colors={[COLORS.blue900]} />}>
      <View style={shared.head}>
        <Text style={shared.title} accessibilityRole="header">Demandes</Text>
        <Text style={shared.subtitle}>Choisissez votre demande</Text>
      </View>

      <View style={{ gap: 12, marginTop: 8 }}>
        {CHOIX.map(({ cle, titre, sous, Icone }) => (
          <Pressable key={cle} accessibilityRole="button" accessibilityLabel={`${titre}. ${sous}`}
            onPress={() => (cle === 'CHECKLIST' ? nav.navigate('NouveauRapport') : nav.navigate('DemandeForm', { nature: cle }))}
            style={({ pressed }) => [T.choix, pressed && { opacity: 0.85 }]}>
            <View style={T.choixIcone}><Icone color={COLORS.blue900} size={22} /></View>
            <View style={{ flex: 1 }}>
              <Text style={T.choixTitre}>{titre}</Text>
              <Text style={T.choixSous}>{sous}</Text>
            </View>
            <ChevronRight color={COLORS.blue900} size={20} />
          </Pressable>
        ))}
      </View>

      <View style={{ gap: 10, marginTop: 26 }}>
        <Text style={shared.section}>Mes demandes</Text>
        {q.isLoading ? <Chargement /> : q.isError ? (
          <Erreur texte="Impossible de charger vos demandes." onRetry={refetch} />
        ) : !q.data?.items.length ? (
          <Vide texte="Aucune demande envoyée pour le moment." />
        ) : q.data.items.map((d) => <CarteDemande key={d.id} d={d} />)}
      </View>
    </ScrollView>
  )
}

const T = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingBottom: 32 },
  choix: {
    flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: COLORS.blue50,
    borderWidth: 1, borderColor: COLORS.blue100, borderRadius: 18, padding: 16, minHeight: 76,
  },
  choixIcone: { width: 46, height: 46, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  choixTitre: { color: COLORS.blue900, fontWeight: '900', fontSize: 16 },
  choixSous: { color: COLORS.muted, fontWeight: '600', fontSize: 13, marginTop: 2 },
  demande: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, padding: 12, gap: 6, backgroundColor: '#fff' },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icone: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.blue50, alignItems: 'center', justifyContent: 'center' },
  demandeTitre: { color: COLORS.text, fontWeight: '800', fontSize: 14 },
  meta: { color: COLORS.muted, fontSize: 12, fontWeight: '600' },
  statut: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  statutTexte: { fontSize: 11, fontWeight: '800' },
  commentaire: { color: COLORS.text, fontSize: 13, backgroundColor: COLORS.gray50, borderRadius: 10, padding: 8 },
})
