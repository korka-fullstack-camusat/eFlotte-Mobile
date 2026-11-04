import { useNavigation } from '@react-navigation/native'
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native'

import MotDePasseForm from '../components/MotDePasseForm'
import { toast } from '../components/ui/Toaster'
import { COLORS } from '../design/theme'

export default function ChangePasswordScreen() {
  const nav = useNavigation<any>()
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={S.container} keyboardShouldPersistTaps="handled">
        <Text style={S.titre} accessibilityRole="header">Changer le mot de passe</Text>
        <MotDePasseForm onSucces={() => { toast.success({ title: 'Mot de passe modifié' }); nav.goBack() }} />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const S = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  titre: { fontSize: 24, fontWeight: '900', color: COLORS.blue900 },
})
