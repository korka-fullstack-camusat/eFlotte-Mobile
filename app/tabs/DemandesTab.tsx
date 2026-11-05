// Onglet « Demandes » : les principales demandes du chauffeur. Le rapport checklist ouvre
// le formulaire existant ; remontée, panne et vidange ouvrent le formulaire de demande.
// En dessous : « Mes demandes » et leur suivi (envoyée, en cours, traitée).
import { useNavigation } from '@react-navigation/native'
import { ArrowUpFromLine, ChevronRight, ClipboardCheck, Droplets, Wrench } from 'lucide-react-native'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

import { COLORS } from '../../design/theme'
import type { NatureDemande } from '../../features/demandes/api'
import { S as shared } from './shared'

const CHOIX: { cle: 'CHECKLIST' | NatureDemande; titre: string; sous: string; Icone: typeof Wrench }[] = [
  { cle: 'CHECKLIST', titre: 'Rapport checklist', sous: 'Checklist hebdomadaire du véhicule', Icone: ClipboardCheck },
  { cle: 'REMONTEE', titre: 'Remontée', sous: 'Signaler une remontée du véhicule', Icone: ArrowUpFromLine },
  { cle: 'PANNE', titre: 'Panne', sous: 'Déclarer une panne', Icone: Wrench },
  { cle: 'VIDANGE', titre: 'Vidange', sous: 'Demander une vidange', Icone: Droplets },
]

export default function DemandesTab() {
  const nav = useNavigation<any>()
  return (
    <ScrollView style={shared.screen} contentContainerStyle={T.container}>
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

    </ScrollView>
  )
}

const T = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingBottom: 32 },
  choix: {
    flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: COLORS.blue50,
    borderWidth: 1, borderColor: COLORS.blue100, borderRadius: 18, padding: 16, minHeight: 76,
  },
  choixIcone: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center' },
  choixTitre: { color: COLORS.blue900, fontWeight: '900', fontSize: 16 },
  choixSous: { color: COLORS.muted, fontWeight: '600', fontSize: 13, marginTop: 2 },
})
