// Formulaire de changement de mot de passe (première connexion et menu du compte).
import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { COLORS } from '../design/theme'
import { changerMotDePasse } from '../features/auth/api'
import { messageErreur } from '../lib/http/api'
import PasswordInput from './PasswordInput'

export default function MotDePasseForm({ onSucces, libelle = 'Enregistrer' }: { onSucces: () => void; libelle?: string }) {
  const [ancien, setAncien] = useState('')
  const [nouveau, setNouveau] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const valider = async () => {
    setErreur(null)
    if (!ancien) return setErreur('Saisissez votre mot de passe actuel.')
    if (nouveau.length < 6) return setErreur('Le nouveau mot de passe doit contenir au moins 6 caractères.')
    if (nouveau !== confirmation) return setErreur('Les deux nouveaux mots de passe ne correspondent pas.')
    if (nouveau === ancien) return setErreur("Le nouveau mot de passe doit être différent de l'actuel.")
    setEnvoi(true)
    try {
      await changerMotDePasse(ancien, nouveau)
      onSucces()
    } catch (e) {
      setErreur(messageErreur(e))
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <View style={{ gap: 12 }}>
      <View>
        <Text style={S.label} nativeID="mdp-ancien">Mot de passe actuel</Text>
        <PasswordInput accessibilityLabelledBy="mdp-ancien" value={ancien} onChangeText={setAncien} autoComplete="current-password" />
      </View>
      <View>
        <Text style={S.label} nativeID="mdp-nouveau">Nouveau mot de passe</Text>
        <PasswordInput accessibilityLabelledBy="mdp-nouveau" value={nouveau} onChangeText={setNouveau} autoComplete="new-password" />
        <Text style={S.aide}>Au moins 6 caractères.</Text>
      </View>
      <View>
        <Text style={S.label} nativeID="mdp-confirmation">Confirmer le nouveau mot de passe</Text>
        <PasswordInput accessibilityLabelledBy="mdp-confirmation" value={confirmation} onChangeText={setConfirmation}
          autoComplete="new-password" returnKeyType="done" onSubmitEditing={valider} />
      </View>
      {!!erreur && <View style={S.errorBox} accessibilityLiveRegion="polite"><Text style={S.errorText}>{erreur}</Text></View>}
      <Pressable onPress={valider} disabled={envoi} accessibilityRole="button"
        style={({ pressed }) => [S.btn, (pressed || envoi) && { opacity: 0.85 }]}>
        <Text style={S.btnText}>{envoi ? 'Enregistrement…' : libelle}</Text>
      </Pressable>
    </View>
  )
}

const S = StyleSheet.create({
  label: { fontSize: 14, fontWeight: '600', color: COLORS.blue900, marginBottom: 6 },
  aide: { fontSize: 12, color: COLORS.muted, marginTop: 4 },
  errorBox: { borderRadius: 12, borderWidth: 1, borderColor: '#fecaca', backgroundColor: '#fef2f2', padding: 10 },
  errorText: { color: '#b91c1c', fontSize: 14 },
  btn: { backgroundColor: COLORS.blue900, borderRadius: 16, paddingVertical: 14 },
  btnText: { color: '#fff', textAlign: 'center', fontWeight: '800' },
})
