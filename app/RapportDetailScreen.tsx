// Détail d'un rapport envoyé : véhicule, points non conformes, réponses par section,
// photos (chargées avec le jeton) et signature.
import { useRoute } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import { Image } from 'expo-image'
import { AlertTriangle } from 'lucide-react-native'
import { useState } from 'react'
import { Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Chargement, Erreur } from '../components/Etats'
import { StatutRapport } from '../components/Rapports'
import { COLORS } from '../design/theme'
import { useSession } from '../features/auth/session'
import { inspections } from '../features/inspections/api'
import { formatDate, formatKm, TYPE_RAPPORT_LABELS } from '../features/inspections/format'

function Info({ label, valeur }: { label: string; valeur?: string | null }) {
  if (!valeur) return null
  return (
    <View style={D.infoCase}>
      <Text style={D.petitLabel}>{label}</Text>
      <Text style={D.infoValeur}>{valeur}</Text>
    </View>
  )
}

export default function RapportDetailScreen() {
  const { params } = useRoute<any>()
  const id = Number(params?.id)
  const token = useSession((s) => s.token)
  const rapportQ = useQuery({ queryKey: ['rapport', id], queryFn: () => inspections.rapport(id) })
  const modeleQ = useQuery({ queryKey: ['modele'], queryFn: inspections.modele, staleTime: 3_600_000 })
  const [agrandie, setAgrandie] = useState<string | null>(null)

  if (rapportQ.isLoading || modeleQ.isLoading) return <Chargement />
  if (rapportQ.isError || modeleQ.isError || !rapportQ.data || !modeleQ.data) {
    return <Erreur texte="Impossible de charger ce rapport." onRetry={() => { void rapportQ.refetch(); void modeleQ.refetch() }} />
  }
  const r = rapportQ.data
  const modele = modeleQ.data
  const entetes = token ? { Authorization: `Bearer ${token}` } : undefined
  const libelles = Object.fromEntries(modele.photos.map((p) => [p.position, p.libelle]))

  return (
    <ScrollView style={{ flex: 1, backgroundColor: COLORS.gray50 }} contentContainerStyle={D.container}
      refreshControl={<RefreshControl refreshing={rapportQ.isRefetching} onRefresh={() => { void rapportQ.refetch() }} colors={[COLORS.blue900]} />}>
      <View style={D.carte}>
        <View style={D.ligneEntre}>
          <Text style={D.plaque} accessibilityRole="header">{r.immatriculation}</Text>
          <StatutRapport rapport={r} />
        </View>
        <Text style={D.sous}>
          {TYPE_RAPPORT_LABELS[r.type_rapport] ?? r.type_rapport} · envoyé le {formatDate(r.created_at, true)}
        </Text>
        <View style={D.grille}>
          <Info label="Marque / modèle" valeur={[r.marque, r.modele].filter(Boolean).join(' ')} />
          <Info label="Kilométrage" valeur={formatKm(r.kilometrage)} />
          <Info label="Chauffeur" valeur={r.nom_chauffeur} />
          <Info label="Filiale" valeur={r.filiale} />
          <Info label="Visite technique" valeur={r.visite_technique ? formatDate(r.visite_technique) : null} />
        </View>
      </View>

      {modele.sections.map((s) => {
        const neg = modele.types_reponse[s.type].negative
        const libelleValeur = Object.fromEntries(modele.types_reponse[s.type].options.map((o) => [o.valeur, o.libelle]))
        return (
          <View key={s.cle} style={D.carte}>
            <Text style={D.sectionTitre}>{s.titre}</Text>
            {s.items.map((i) => {
              const rep = r.reponses?.items?.[i.cle]
              const nc = rep?.valeur === neg
              return (
                <View key={i.cle} style={D.item}>
                  <View style={D.ligneEntre}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                      {nc && i.critique && <AlertTriangle color="#dc2626" size={14} accessibilityLabel="critique" />}
                      <Text style={[D.itemLibelle, nc && { color: i.critique ? '#B91C1C' : '#B45309' }]}>{i.libelle}</Text>
                    </View>
                    <Text style={[D.itemValeur, nc ? { color: '#B91C1C' } : { color: '#047857' }]}>
                      {rep ? libelleValeur[rep.valeur] ?? rep.valeur : '—'}
                    </Text>
                  </View>
                  {!!rep?.commentaire && <Text style={D.commentaire}>« {rep.commentaire} »</Text>}
                </View>
              )
            })}
            {!!r.reponses?.autres?.[s.cle] && <Text style={D.commentaire}>Autres : {r.reponses.autres[s.cle]}</Text>}
          </View>
        )
      })}

      {!!r.commentaires && (
        <View style={D.carte}>
          <Text style={D.sectionTitre}>Commentaires</Text>
          <Text style={{ color: COLORS.text }}>{r.commentaires}</Text>
        </View>
      )}

      <View style={D.carte}>
        <Text style={D.sectionTitre}>Photos</Text>
        <View style={D.photos}>
          {r.photos.map((pos) => (
            <Pressable key={pos} onPress={() => setAgrandie(pos)} accessibilityRole="imagebutton"
              accessibilityLabel={`Agrandir la photo : ${libelles[pos] ?? pos}`} style={D.photo}>
              <Image source={{ uri: inspections.urlPhoto(r.id, pos), headers: entetes }} style={StyleSheet.absoluteFill}
                contentFit="cover" transition={150} cachePolicy="memory-disk" />
              <View style={D.photoLegende}><Text style={D.photoLegendeText}>{libelles[pos] ?? pos}</Text></View>
            </Pressable>
          ))}
        </View>
      </View>

      {!!r.signature && (
        <View style={D.carte}>
          <Text style={D.sectionTitre}>Signature du conducteur</Text>
          <Image source={{ uri: r.signature }} style={D.signature} contentFit="contain" accessibilityLabel="Signature" />
        </View>
      )}

      <Modal visible={!!agrandie} transparent animationType="fade" onRequestClose={() => setAgrandie(null)}>
        <Pressable style={D.fond} onPress={() => setAgrandie(null)} accessibilityLabel="Fermer la photo">
          <SafeAreaView style={{ flex: 1, justifyContent: 'center' }}>
            {agrandie && (
              <Image source={{ uri: inspections.urlPhoto(r.id, agrandie), headers: entetes }}
                style={{ width: '100%', height: '80%' }} contentFit="contain" />
            )}
            <Text style={D.fondTexte}>{agrandie ? libelles[agrandie] : ''} · toucher pour fermer</Text>
          </SafeAreaView>
        </Pressable>
      </Modal>
    </ScrollView>
  )
}

const D = StyleSheet.create({
  container: { padding: 16, gap: 12, paddingBottom: 32 },
  carte: { backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, padding: 14, gap: 8 },
  ligneEntre: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  plaque: { fontSize: 20, fontWeight: '900', color: COLORS.blue900 },
  sous: { color: COLORS.muted, fontWeight: '600' },
  grille: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 10, marginTop: 6 },
  infoCase: { width: '50%', paddingRight: 8 },
  petitLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },
  infoValeur: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  sectionTitre: { fontSize: 15, fontWeight: '900', color: COLORS.blue900, marginBottom: 2 },
  item: { paddingVertical: 6, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.border },
  itemLibelle: { color: COLORS.text, fontWeight: '600', flexShrink: 1 },
  itemValeur: { fontWeight: '800' },
  commentaire: { color: '#475569', fontStyle: 'italic', marginTop: 2 },
  photos: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
  photo: { width: '48%', aspectRatio: 4 / 3, borderRadius: 12, overflow: 'hidden', backgroundColor: '#e5e7eb' },
  photoLegende: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.55)', paddingVertical: 3 },
  photoLegendeText: { color: '#fff', fontWeight: '700', fontSize: 11, textAlign: 'center' },
  signature: { height: 120, width: '100%', backgroundColor: '#fff' },
  fond: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)' },
  fondTexte: { color: '#fff', textAlign: 'center', marginTop: 12, fontWeight: '700' },
})
