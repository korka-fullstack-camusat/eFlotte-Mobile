// Formulaire d'une demande (remontée, panne ou vidange, choisie dans l'onglet Demandes) :
// nature (explication libre), immatriculation, kilométrage actuel, position, technicien. Le serveur prévient les responsables par e-mail.
import { useNavigation, useRoute } from '@react-navigation/native'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Send } from 'lucide-react-native'
import { useState } from 'react'
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native'

import { ICONES_NATURE } from '../components/Demandes'
import { toast } from '../components/ui/Toaster'
import { COLORS } from '../design/theme'
import { useSession } from '../features/auth/session'
import { demandes, NATURES, type NatureDemande } from '../features/demandes/api'
import { messageErreur } from '../lib/http/api'

function Champ({ label, erreur, ...props }: { label: string; erreur?: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={F.label}>{label}</Text>
      <TextInput placeholderTextColor="#9CA3AF" accessibilityLabel={label}
        style={[F.input, !!erreur && { borderColor: COLORS.red600 }]} {...props} />
      {!!erreur && <Text style={F.erreur}>{erreur}</Text>}
    </View>
  )
}

const EXEMPLES: Record<NatureDemande, string> = {
  REMONTEE: 'Expliquez simplement la remontée (ex. : retour du véhicule au parc)…',
  PANNE: 'Expliquez simplement la panne (ex. : le moteur cale au démarrage)…',
  VIDANGE: 'Expliquez simplement la demande (ex. : voyant vidange allumé)…',
}

export default function DemandeFormScreen() {
  const nav = useNavigation<any>()
  const route = useRoute<any>()
  const qc = useQueryClient()
  const plaque = useSession((s) => s.utilisateur?.vehicule_plaque) ?? ''

  const nature: NatureDemande = route.params?.nature ?? 'PANNE'   // type choisi dans l'onglet Demandes
  const [description, setDescription] = useState('')
  const [immatriculation, setImmatriculation] = useState(plaque)
  const [kilometrage, setKilometrage] = useState('')
  const [position, setPosition] = useState('')
  const [technicien, setTechnicien] = useState('')
  const [essai, setEssai] = useState(false)

  const km = Number(kilometrage.replace(/\s/g, ''))
  const erreurs = {
    description: description.trim() ? '' : 'Expliquez simplement la demande.',
    immatriculation: immatriculation.trim() ? '' : 'Indiquez l’immatriculation.',
    kilometrage: kilometrage.trim() && Number.isInteger(km) && km >= 0 ? '' : 'Indiquez le kilométrage actuel (chiffres).',
    position: position.trim() ? '' : 'Indiquez où se trouve le véhicule.',
    technicien: technicien.trim() ? '' : 'Indiquez le technicien.',
  }
  const valide = !Object.values(erreurs).some(Boolean)
  const Icone = ICONES_NATURE[nature]

  const envoi = useMutation({
    mutationFn: () => demandes.creer({
      nature, immatriculation: immatriculation.trim(), kilometrage: km, position: position.trim(), technicien: technicien.trim(),
      description: description.trim(),
    }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['mesDemandes'] })
      toast.success({ title: `Demande ${NATURES[nature].toLowerCase()} envoyée`, message: 'Le responsable flotte est prévenu.' })
      nav.popToTop()   // l'onglet Demandes revient à la liste des choix
      nav.navigate('Main', { screen: 'Historique', params: { onglet: 'demandes', t: Date.now() } })
    },
    onError: (e) => toast.error({ title: 'Envoi impossible', message: messageErreur(e) }),
  })

  const envoyer = () => {
    setEssai(true)
    if (valide && !envoi.isPending) envoi.mutate()
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#fff' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={F.container} keyboardShouldPersistTaps="handled">
        <View style={F.entete}>
          <Icone color={COLORS.blue900} size={26} />
          <Text style={F.titre} accessibilityRole="header">Demande : {NATURES[nature]}</Text>
        </View>

        <Champ label="Nature" value={description} onChangeText={setDescription} multiline textAlignVertical="top"
          placeholder={EXEMPLES[nature]} style={[F.input, F.zoneTexte, essai && !!erreurs.description && { borderColor: COLORS.red600 }]}
          erreur={essai ? erreurs.description : ''} />

        <Champ label="Immatriculation" value={immatriculation} onChangeText={setImmatriculation} autoCapitalize="characters"
          placeholder="AA 123 BB" erreur={essai ? erreurs.immatriculation : ''} />
        <Champ label="Kilométrage actuel" value={kilometrage} onChangeText={(t) => setKilometrage(t.replace(/[^\d\s]/g, ''))}
          keyboardType="number-pad" placeholder="Ex. : 45300" erreur={essai ? erreurs.kilometrage : ''} />
        <Champ label="Position" value={position} onChangeText={setPosition} placeholder="Ex. : Dakar, Liberté 6"
          erreur={essai ? erreurs.position : ''} />
        <Champ label="Technicien" value={technicien} onChangeText={setTechnicien} placeholder="Nom du technicien"
          autoCapitalize="words" erreur={essai ? erreurs.technicien : ''} onSubmitEditing={envoyer} returnKeyType="send" />

        <Pressable onPress={envoyer} disabled={envoi.isPending} accessibilityRole="button"
          style={({ pressed }) => [F.bouton, (pressed || envoi.isPending) && { opacity: 0.85 }]}>
          {envoi.isPending ? <ActivityIndicator color="#fff" /> : <Send color="#fff" size={20} />}
          <Text style={F.boutonTexte}>Envoyer la demande</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const F = StyleSheet.create({
  container: { padding: 16, gap: 16, paddingBottom: 40 },
  titre: { fontSize: 24, fontWeight: '900', color: COLORS.blue900 },
  label: { fontWeight: '800', color: COLORS.text, fontSize: 14 },
  input: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, paddingHorizontal: 14, minHeight: 50,
    fontSize: 16, color: COLORS.text, backgroundColor: COLORS.gray50,
  },
  erreur: { color: COLORS.red600, fontSize: 12, fontWeight: '700' },
  entete: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  zoneTexte: { minHeight: 110, paddingTop: 12, paddingBottom: 12 },
  bouton: {
    minHeight: 56, borderRadius: 18, backgroundColor: COLORS.blue900, marginTop: 8,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  boutonTexte: { color: '#fff', fontWeight: '900', fontSize: 16 },
})
