// Carte d'une demande (remontée, panne, vidange) avec son statut et le commentaire du gestionnaire.
import { ArrowUpFromLine, Droplets, Wrench } from 'lucide-react-native'
import { StyleSheet, Text, View } from 'react-native'

import { COLORS } from '../design/theme'
import { NATURES, STATUTS, type Demande } from '../features/demandes/api'
import { formatDate, formatKm } from '../features/inspections/format'

export const ICONES_NATURE = { REMONTEE: ArrowUpFromLine, PANNE: Wrench, VIDANGE: Droplets }

const COULEURS_STATUT = {
  NOUVELLE: { fond: COLORS.blue50, bord: COLORS.blue100, texte: COLORS.blue900 },
  EN_COURS: { fond: COLORS.amber50, bord: COLORS.amber200, texte: COLORS.amber700 },
  TRAITEE: { fond: COLORS.green50, bord: '#A7F3D0', texte: '#065F46' },
}

export function CarteDemande({ d }: { d: Demande }) {
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


const T = StyleSheet.create({
  demande: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, padding: 12, gap: 6, backgroundColor: '#fff' },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icone: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.blue50, alignItems: 'center', justifyContent: 'center' },
  demandeTitre: { color: COLORS.text, fontWeight: '800', fontSize: 14 },
  meta: { color: COLORS.muted, fontSize: 12, fontWeight: '600' },
  statut: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  statutTexte: { fontSize: 11, fontWeight: '800' },
  commentaire: { color: COLORS.text, fontSize: 13, backgroundColor: COLORS.gray50, borderRadius: 10, padding: 8 },
})
