// Appareil photo intégré à l'écran (expo-camera) : l'app reste au premier plan pendant la
// prise de vue. Avec l'appareil photo du téléphone, Android fermait parfois l'app
// (mémoire) et elle redémarrait sur l'accueil après la photo.
import { CameraView, useCameraPermissions } from 'expo-camera'
import { Image } from 'expo-image'
import { Check, RotateCcw, X } from 'lucide-react-native'
import { useRef, useState } from 'react'
import { ActivityIndicator, Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { COLORS } from '../design/theme'

export type PhotoBrute = { uri: string; width: number; height: number }

export default function AppareilPhoto({ visible, titre, onFermer, onValider }: {
  visible: boolean
  titre: string
  onFermer: () => void
  onValider: (photo: PhotoBrute) => void
}) {
  const [permission, demander] = useCameraPermissions()
  const camera = useRef<CameraView>(null)
  const [pret, setPret] = useState(false)
  const [capture, setCapture] = useState<PhotoBrute | null>(null)
  const [enCours, setEnCours] = useState(false)

  const fermer = () => { setCapture(null); setPret(false); onFermer() }

  const declencher = async () => {
    if (!camera.current || enCours) return
    setEnCours(true)
    try {
      const p = await camera.current.takePictureAsync({ quality: 0.7, exif: false, shutterSound: false })
      if (p) setCapture({ uri: p.uri, width: p.width, height: p.height })
    } finally {
      setEnCours(false)
    }
  }

  const valider = () => {
    if (!capture) return
    const p = capture
    setCapture(null); setPret(false)
    onValider(p)
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={fermer} statusBarTranslucent>
      <View style={S.fond}>
        {!permission ? (
          <ActivityIndicator color="#fff" style={{ flex: 1 }} />
        ) : !permission.granted ? (
          <SafeAreaView style={S.centre}>
            <Text style={S.message}>L’application a besoin de l’appareil photo pour les photos du véhicule.</Text>
            <Pressable onPress={() => (permission.canAskAgain ? demander() : Linking.openSettings())} accessibilityRole="button" style={S.bouton}>
              <Text style={S.boutonTexte}>{permission.canAskAgain ? 'Autoriser l’appareil photo' : 'Ouvrir les réglages'}</Text>
            </Pressable>
            <Pressable onPress={fermer} accessibilityRole="button" style={S.lien}><Text style={S.lienTexte}>Annuler</Text></Pressable>
          </SafeAreaView>
        ) : capture ? (
          <>
            <Image source={{ uri: capture.uri }} style={StyleSheet.absoluteFill} contentFit="contain" />
            <SafeAreaView edges={['top']} style={S.haut}><Text style={S.titre}>{titre}</Text></SafeAreaView>
            <SafeAreaView edges={['bottom']} style={S.bas}>
              <Pressable onPress={() => setCapture(null)} accessibilityRole="button" accessibilityLabel="Reprendre la photo" style={S.action}>
                <RotateCcw color="#fff" size={22} /><Text style={S.actionTexte}>Reprendre</Text>
              </Pressable>
              <Pressable onPress={valider} accessibilityRole="button" accessibilityLabel="Valider la photo" style={[S.action, S.actionValider]}>
                <Check color="#fff" size={22} /><Text style={S.actionTexte}>Valider</Text>
              </Pressable>
            </SafeAreaView>
          </>
        ) : (
          <>
            <CameraView ref={camera} style={StyleSheet.absoluteFill} facing="back" onCameraReady={() => setPret(true)} />
            <SafeAreaView edges={['top']} style={S.haut}>
              <Pressable onPress={fermer} hitSlop={12} accessibilityRole="button" accessibilityLabel="Fermer l’appareil photo" style={S.fermer}>
                <X color="#fff" size={22} />
              </Pressable>
              <Text style={S.titre}>{titre}</Text>
            </SafeAreaView>
            <SafeAreaView edges={['bottom']} style={S.bas}>
              <Pressable onPress={declencher} disabled={!pret || enCours} accessibilityRole="button" accessibilityLabel="Prendre la photo"
                style={({ pressed }) => [S.declencheur, (pressed || enCours || !pret) && { opacity: 0.6 }]}>
                {enCours ? <ActivityIndicator color={COLORS.blue900} /> : <View style={S.declencheurInterieur} />}
              </Pressable>
            </SafeAreaView>
          </>
        )}
      </View>
    </Modal>
  )
}

const S = StyleSheet.create({
  fond: { flex: 1, backgroundColor: '#000' },
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  message: { color: '#fff', fontSize: 16, fontWeight: '700', textAlign: 'center' },
  bouton: { backgroundColor: COLORS.blue900, borderRadius: 14, paddingHorizontal: 18, paddingVertical: 14 },
  boutonTexte: { color: '#fff', fontWeight: '900', fontSize: 15 },
  lien: { padding: 10 },
  lienTexte: { color: '#cbd5e1', fontWeight: '800' },
  haut: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: 'rgba(0,0,0,0.35)' },
  titre: { color: '#fff', fontWeight: '900', fontSize: 17, flex: 1 },
  fermer: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  bas: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 16, padding: 24, backgroundColor: 'rgba(0,0,0,0.35)' },
  declencheur: { width: 78, height: 78, borderRadius: 39, borderWidth: 4, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  declencheurInterieur: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff' },
  action: { flex: 1, minHeight: 54, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.18)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  actionValider: { backgroundColor: COLORS.green600 },
  actionTexte: { color: '#fff', fontWeight: '900', fontSize: 16 },
})
