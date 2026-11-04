// Éléments communs aux onglets : écran avec titre, styles.
import { StyleSheet, Text, View } from 'react-native'

import { COLORS } from '../../design/theme'

export function Titre({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={S.head}>
      <Text style={S.title} accessibilityRole="header">{title}</Text>
      {!!subtitle && <Text style={S.subtitle}>{subtitle}</Text>}
    </View>
  )
}

export const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.white },
  head: { paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '900', color: COLORS.blue900 },
  subtitle: { fontSize: 13, color: COLORS.muted, fontWeight: '700', marginTop: 4 },
  section: { fontSize: 15, fontWeight: '900', color: COLORS.blue900 },
})
