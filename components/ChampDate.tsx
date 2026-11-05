// Champ date : un toucher ouvre le calendrier du téléphone (Android : boîte de dialogue,
// iOS : calendrier dans une fenêtre). Sur le web (tests), saisie AAAA-MM-JJ.
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker'
import { CalendarDays, X } from 'lucide-react-native'
import { useState } from 'react'
import { Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'

import { COLORS } from '../design/theme'
import { formatDate } from '../features/inspections/format'

const deux = (n: number) => String(n).padStart(2, '0')
const versIso = (d: Date) => `${d.getFullYear()}-${deux(d.getMonth() + 1)}-${deux(d.getDate())}`
const depuisIso = (iso: string) => (/^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T00:00:00`) : new Date())

export default function ChampDate({ valeur, onChange, label, placeholder = 'Choisir une date', erreur, minimum }: {
  valeur: string                 // AAAA-MM-JJ ou ''
  onChange: (iso: string) => void
  label: string
  placeholder?: string
  erreur?: boolean
  minimum?: Date
}) {
  const [iosOuvert, setIosOuvert] = useState(false)
  const [iosDate, setIosDate] = useState(() => depuisIso(valeur))

  if (Platform.OS === 'web') {
    return (
      <TextInput accessibilityLabel={label} value={valeur} placeholder="AAAA-MM-JJ" placeholderTextColor="#9aa7bd"
        onChangeText={(t) => onChange(t.replace(/[^\d-]/g, '').slice(0, 10))} style={[S.champ, S.texte, erreur && S.erreur]} />
    )
  }

  const ouvrir = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: depuisIso(valeur), mode: 'date', minimumDate: minimum,
        onChange: (e, d) => { if (e.type === 'set' && d) onChange(versIso(d)) },
      })
    } else {
      setIosDate(depuisIso(valeur)); setIosOuvert(true)
    }
  }

  return (
    <>
      <View style={[S.champ, erreur && S.erreur]}>
        <Pressable onPress={ouvrir} accessibilityRole="button" accessibilityLabel={`${label} : ${valeur ? formatDate(valeur) : 'aucune date'}`}
          style={S.zone}>
          <CalendarDays color={COLORS.blue900} size={20} />
          <Text style={[S.texte, !valeur && { color: '#9aa7bd' }]}>{valeur ? formatDate(valeur) : placeholder}</Text>
        </Pressable>
        {!!valeur && (
          <Pressable onPress={() => onChange('')} hitSlop={10} accessibilityRole="button" accessibilityLabel="Effacer la date">
            <X color={COLORS.muted} size={18} />
          </Pressable>
        )}
      </View>

      {Platform.OS === 'ios' && (
        <Modal visible={iosOuvert} transparent animationType="fade" onRequestClose={() => setIosOuvert(false)}>
          <Pressable style={S.fond} onPress={() => setIosOuvert(false)} accessibilityLabel="Fermer le calendrier" />
          <View style={S.feuille}>
            <DateTimePicker value={iosDate} mode="date" display="inline" locale="fr-FR" minimumDate={minimum}
              onChange={(_, d) => d && setIosDate(d)} />
            <Pressable onPress={() => { onChange(versIso(iosDate)); setIosOuvert(false) }} accessibilityRole="button" style={S.valider}>
              <Text style={S.validerTexte}>Valider</Text>
            </Pressable>
          </View>
        </Modal>
      )}
    </>
  )
}

const S = StyleSheet.create({
  champ: {
    minHeight: 50, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, backgroundColor: '#fff',
    paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  zone: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48 },
  texte: { fontSize: 16, color: COLORS.text, fontWeight: '600', flex: 1 },
  erreur: { borderColor: '#f87171' },
  fond: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.3)' },
  feuille: { position: 'absolute', left: 16, right: 16, top: '20%', backgroundColor: '#fff', borderRadius: 20, padding: 12 },
  valider: { marginTop: 8, minHeight: 50, borderRadius: 14, backgroundColor: COLORS.blue900, alignItems: 'center', justifyContent: 'center' },
  validerTexte: { color: '#fff', fontWeight: '900', fontSize: 16 },
})
