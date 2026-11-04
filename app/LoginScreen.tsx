// Connexion du chauffeur (même présentation que l'app Inventory).
import { useNavigation } from '@react-navigation/native'
import { StatusBar } from 'expo-status-bar'
import React, { type ComponentRef, useState } from 'react'
import {
  Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import PasswordInput from '../components/PasswordInput'
import { AccesRefuse, connexion } from '../features/auth/api'
import { messageErreur } from '../lib/http/api'

export default function LoginScreen() {
  const nav = useNavigation<any>()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const passwordRef = React.useRef<ComponentRef<typeof TextInput>>(null)

  const onSubmit = async () => {
    if (!username.trim() || !password) { setError('Saisissez votre identifiant et votre mot de passe.'); return }
    setLoading(true); setError(null)
    try {
      const moi = await connexion(username, password)
      // Mot de passe initial (Camusat@2026) : à changer avant tout
      nav.reset({ index: 0, routes: [{ name: moi.doit_changer_mdp ? 'PremiereConnexion' : 'Main' }] })
    } catch (e: any) {
      if (e instanceof AccesRefuse) setError(e.message)
      else if (e?.response?.status === 401 || e?.response?.status === 400) setError('Identifiant ou mot de passe incorrect.')
      else if (e?.response?.status === 403) setError('Compte désactivé. Contactez votre responsable.')
      else setError(messageErreur(e, 'Erreur du serveur, réessayez dans un instant.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.formCard}>
            <View style={styles.formHeaderRow}>
              <View style={styles.logoCircle}>
                <Image source={require('../assets/camusat-logo.png')} style={{ width: 24, height: 24, resizeMode: 'contain' }} />
              </View>
              <View>
                <Text style={styles.formTitle} accessibilityRole="header">Connexion</Text>
                <Text style={styles.formSubtitle}>eFlotte — Camusat · Checklists véhicule</Text>
              </View>
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.label} nativeID="lbl-identifiant">Identifiant</Text>
              <TextInput
                accessibilityLabelledBy="lbl-identifiant"
                placeholder="ex : 771234567"
                placeholderTextColor="#9aa7bd"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="username"
                value={username}
                onChangeText={setUsername}
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                style={styles.input}
              />
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.label} nativeID="lbl-mdp">Mot de passe</Text>
              <PasswordInput
                accessibilityLabelledBy="lbl-mdp"
                inputRef={passwordRef}
                placeholder="••••••••"
                placeholderTextColor="#9aa7bd"
                value={password}
                onChangeText={setPassword}
                autoComplete="current-password"
                returnKeyType="done"
                onSubmitEditing={onSubmit}
              />
            </View>

            {!!error && (
              <View style={styles.errorBox} accessibilityLiveRegion="polite">
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Pressable disabled={loading} onPress={onSubmit} accessibilityRole="button"
              style={({ pressed }) => [styles.submitBtn, (pressed || loading) && { opacity: 0.9 }]}>
              <Text style={styles.submitText}>{loading ? 'Connexion…' : 'Se connecter'}</Text>
            </Pressable>

            <Text style={styles.aide}>
              Identifiants reçus par SMS. Mot de passe oublié : contactez votre responsable de flotte.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const BLUE = '#0f3b82'

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: BLUE },
  container: { flexGrow: 1, padding: 16, alignItems: 'center', justifyContent: 'center' },
  formCard: {
    width: '100%', maxWidth: 420, backgroundColor: '#fff', borderRadius: 24, padding: 20,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, elevation: 4,
  },
  formHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  logoCircle: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(15,59,130,0.2)',
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff',
  },
  formTitle: { fontSize: 22, fontWeight: '700', color: BLUE },
  formSubtitle: { fontSize: 12, color: 'rgba(15,59,130,0.6)' },
  fieldBlock: { marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '500', color: BLUE, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, color: '#0b1f44',
  },
  errorBox: { borderRadius: 12, borderWidth: 1, borderColor: '#fecaca', backgroundColor: '#fef2f2', padding: 10, marginBottom: 8 },
  errorText: { color: '#b91c1c', fontSize: 14 },
  submitBtn: { backgroundColor: BLUE, borderRadius: 16, paddingVertical: 12, marginTop: 4 },
  submitText: { color: '#fff', textAlign: 'center', fontWeight: '600' },
  aide: { textAlign: 'center', marginTop: 14, fontSize: 12, color: '#6b7280' },
})
