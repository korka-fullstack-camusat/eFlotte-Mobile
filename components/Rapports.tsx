// Statut d'un rapport (conforme / anomalies / critique) et carte de liste.
import { AlertCircle, AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react-native'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { COLORS } from '../design/theme'
import { formatDate, formatKm, TYPE_RAPPORT_LABELS } from '../features/inspections/format'
import type { RapportResume } from '../features/inspections/types'

/** Même règle que le filtre `statut` de l'API. */
export function StatutRapport({ rapport }: { rapport: Pick<RapportResume, 'nb_non_conformes' | 'nb_critiques'> }) {
  if (rapport.nb_critiques > 0) {
    const n = rapport.nb_critiques
    return (
      <View style={[S.badge, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
        <AlertTriangle color="#B91C1C" size={12} />
        <Text style={[S.badgeText, { color: '#B91C1C' }]}>{n} critique{n > 1 ? 's' : ''}</Text>
      </View>
    )
  }
  if (rapport.nb_non_conformes > 0) {
    const n = rapport.nb_non_conformes
    return (
      <View style={[S.badge, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
        <AlertCircle color="#B45309" size={12} />
        <Text style={[S.badgeText, { color: '#B45309' }]}>{n} anomalie{n > 1 ? 's' : ''}</Text>
      </View>
    )
  }
  return (
    <View style={[S.badge, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
      <CheckCircle2 color="#047857" size={12} />
      <Text style={[S.badgeText, { color: '#047857' }]}>Conforme</Text>
    </View>
  )
}

export function RapportCarte({ rapport, onPress }: { rapport: RapportResume; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button"
      accessibilityLabel={`Rapport ${rapport.immatriculation} du ${formatDate(rapport.created_at)}`}
      style={({ pressed }) => [S.card, pressed && { opacity: 0.85 }]}>
      <View style={{ flex: 1, gap: 4 }}>
        <View style={S.ligne}>
          <Text style={S.plaque}>{rapport.immatriculation}</Text>
          <StatutRapport rapport={rapport} />
        </View>
        <Text style={S.sous}>
          {TYPE_RAPPORT_LABELS[rapport.type_rapport] ?? rapport.type_rapport} · {formatDate(rapport.created_at, true)} · {formatKm(rapport.kilometrage)}
        </Text>
      </View>
      <ChevronRight color={COLORS.muted} size={20} />
    </Pressable>
  )
}

const S = StyleSheet.create({
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1,
    borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2,
  },
  badgeText: { fontSize: 12, fontWeight: '800' },
  card: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, padding: 14, gap: 10,
    backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center',
  },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  plaque: { fontSize: 15, fontWeight: '900', color: COLORS.blue900 },
  sous: { fontSize: 13, color: COLORS.muted, fontWeight: '600' },
})
