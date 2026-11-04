// États communs : chargement, erreur (avec « Réessayer »), liste vide.
import { RefreshCw } from 'lucide-react-native'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'

import { COLORS } from '../design/theme'

export function Chargement({ texte = 'Chargement…' }: { texte?: string }) {
  return (
    <View style={S.centre} accessibilityRole="progressbar" accessibilityLabel={texte}>
      <ActivityIndicator color={COLORS.blue900} size="large" />
      <Text style={S.texte}>{texte}</Text>
    </View>
  )
}

export function Erreur({ texte, onRetry }: { texte: string; onRetry?: () => void }) {
  return (
    <View style={S.centre}>
      <Text style={[S.texte, { textAlign: 'center' }]}>{texte}</Text>
      {onRetry && (
        <Pressable onPress={onRetry} accessibilityRole="button" style={({ pressed }) => [S.btn, pressed && { opacity: 0.85 }]}>
          <RefreshCw color="#fff" size={16} />
          <Text style={S.btnText}>Réessayer</Text>
        </Pressable>
      )}
    </View>
  )
}

export function Vide({ texte }: { texte: string }) {
  return <View style={S.vide}><Text style={S.videText}>{texte}</Text></View>
}

const S = StyleSheet.create({
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12, minHeight: 200 },
  texte: { color: COLORS.muted, fontWeight: '700' },
  btn: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.blue900,
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12,
  },
  btnText: { color: '#fff', fontWeight: '800' },
  vide: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, padding: 20, backgroundColor: '#fff' },
  videText: { color: COLORS.muted, fontWeight: '700', textAlign: 'center' },
})
