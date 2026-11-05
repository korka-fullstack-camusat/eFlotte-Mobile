// Première connexion : le mot de passe initial (reçu par SMS) doit être changé avant tout.
import { useNavigation } from '@react-navigation/native'
import { StatusBar } from 'expo-status-bar'
import { KeyRound } from 'lucide-react-native'
import { useRef, type ComponentRef } from 'react'
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import MotDePasseForm from '../components/MotDePasseForm'
import { toast } from '../components/ui/Toaster'
import { COLORS } from '../design/theme'
import { useSession } from '../features/auth/session'

export default function PremiereConnexionScreen() {
  const nav = useNavigation<any>()
  const nom = useSession((s) => s.utilisateur?.full_name || s.utilisateur?.username || '')
  const ancienConnu = useSession((s) => s.motDePasseConnexion)
  const defilement = useRef<ComponentRef<typeof ScrollView>>(null)
  // Champ sélectionné : laisser le clavier s'ouvrir puis faire remonter la fin du formulaire
  const afficherChamp = () => setTimeout(() => defilement.current?.scrollToEnd({ animated: true }), 300)

  const annuler = async () => {
    await useSession.getState().fermer()
    nav.reset({ index: 0, routes: [{ name: 'Login' }] })
  }

  return (
    <SafeAreaView style={S.safe}>
      <StatusBar style="light" />
      {/* « padding » aussi sur Android : en plein écran, la fenêtre ne se redimensionne plus seule */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView ref={defilement} contentContainerStyle={S.container} keyboardShouldPersistTaps="handled">
          <View style={S.card}>
            <View style={S.icone}><KeyRound color={COLORS.blue900} size={26} /></View>
            <Text style={S.titre} accessibilityRole="header">Bienvenue {nom.split(' ')[0]}</Text>
            <Text style={S.texte}>
              Le mot de passe reçu par SMS est commun à tous les nouveaux comptes : choisissez votre propre
              mot de passe pour sécuriser votre compte avant de commencer.
            </Text>
            <MotDePasseForm libelle="Valider et continuer" ancienConnu={ancienConnu} onFocusChamp={afficherChamp} onSucces={() => {
              toast.success({ title: 'Mot de passe modifié' })
              nav.reset({ index: 0, routes: [{ name: 'Main' }] })
            }} />
            <Pressable onPress={annuler} accessibilityRole="button" style={{ alignSelf: 'center', marginTop: 14 }} hitSlop={10}>
              <Text style={S.lien}>Se déconnecter</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.blue900 },
  container: { flexGrow: 1, padding: 16, alignItems: 'center', justifyContent: 'center' },
  card: { width: '100%', maxWidth: 420, backgroundColor: '#fff', borderRadius: 24, padding: 20, gap: 4 },
  icone: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.blue50,
    alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 8,
  },
  titre: { fontSize: 22, fontWeight: '900', color: COLORS.blue900, textAlign: 'center' },
  texte: { color: COLORS.muted, textAlign: 'center', marginBottom: 16, fontWeight: '600' },
  lien: { color: COLORS.blue900, fontWeight: '800' },
})
