// Zone de signature au doigt. Renvoie un PNG en data URI (« data:image/png;base64,… »),
// le format attendu par l'API, ou "" une fois effacée.
import { Eraser } from 'lucide-react-native'
import { type ComponentRef, useEffect, useRef, useState } from 'react'
import { PanResponder, Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { captureRef } from 'react-native-view-shot'

import { COLORS } from '../design/theme'

type Point = { x: number; y: number }
const HAUTEUR = 180

const chemin = (pts: Point[]) =>
  pts.length === 1
    ? `M${pts[0].x},${pts[0].y} l0.1,0.1`
    : pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')

/** Web (tests dans le navigateur) : dessin des traits sur un canvas. */
function pngWeb(traits: Point[][], largeur: number): string {
  const canvas = document.createElement('canvas')
  canvas.width = largeur * 2
  canvas.height = HAUTEUR * 2
  const ctx = canvas.getContext('2d')!
  ctx.scale(2, 2)
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, largeur, HAUTEUR)
  ctx.strokeStyle = '#0f172a'
  ctx.lineWidth = 2.4
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  for (const t of traits) {
    ctx.beginPath()
    t.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)))
    if (t.length === 1) ctx.lineTo(t[0].x + 0.1, t[0].y + 0.1)
    ctx.stroke()
  }
  return canvas.toDataURL('image/png')
}

export default function SignaturePad({
  value, onChange, onDebut, onFin,
}: {
  value: string
  onChange: (dataUri: string) => void
  /** Appelé au début / à la fin d'un trait : permet de bloquer le défilement de la page. */
  onDebut?: () => void
  onFin?: () => void
}) {
  const zone = useRef<ComponentRef<typeof View>>(null)
  const largeur = useRef(320)
  const [traits, setTraits] = useState<Point[][]>([])
  const [trait, setTrait] = useState<Point[]>([])
  // Copies pour les gestionnaires du geste (créés une seule fois)
  const traitsRef = useRef<Point[][]>([])
  const traitRef = useRef<Point[]>([])
  const rappels = useRef({ onChange, onDebut, onFin })
  useEffect(() => { rappels.current = { onChange, onDebut, onFin } })

  const exporter = async (tous: Point[][]) => {
    try {
      if (Platform.OS === 'web') { rappels.current.onChange(pngWeb(tous, largeur.current)); return }
      const uri = await captureRef(zone as any, { format: 'png', quality: 1, result: 'data-uri' })
      rappels.current.onChange(uri.startsWith('data:') ? uri : `data:image/png;base64,${uri}`)
    } catch {
      rappels.current.onChange('')
    }
  }

  // Gestionnaires créés une seule fois : ils lisent les refs pendant le geste, jamais au rendu.
  // eslint-disable-next-line react-hooks/refs
  const [responder] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => {
        rappels.current.onDebut?.()
        const { locationX: x, locationY: y } = e.nativeEvent
        traitRef.current = [{ x, y }]
        setTrait(traitRef.current)
      },
      onPanResponderMove: (e) => {
        const { locationX: x, locationY: y } = e.nativeEvent
        traitRef.current = [...traitRef.current, { x, y }]
        setTrait(traitRef.current)
      },
      onPanResponderRelease: () => {
        const tous = [...traitsRef.current, traitRef.current]
        traitsRef.current = tous
        traitRef.current = []
        setTraits(tous)
        setTrait([])
        rappels.current.onFin?.()
        // Laisser le trait s'afficher avant la capture
        setTimeout(() => void exporter(tous), 30)
      },
      onPanResponderTerminate: () => { traitRef.current = []; setTrait([]); rappels.current.onFin?.() },
    }),
  )

  const effacer = () => { traitsRef.current = []; traitRef.current = []; setTraits([]); setTrait([]); onChange('') }
  const vide = traits.length === 0 && trait.length === 0

  return (
    <View>
      <View
        ref={zone}
        collapsable={false}
        onLayout={(e) => { largeur.current = e.nativeEvent.layout.width }}
        style={S.zone}
        accessibilityLabel="Zone de signature : signez avec le doigt"
        {...responder.panHandlers}
      >
        <Svg width="100%" height={HAUTEUR} pointerEvents="none">
          {traits.map((t, i) => (
            <Path key={i} d={chemin(t)} stroke="#0f172a" strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          ))}
          {trait.length > 0 && (
            <Path d={chemin(trait)} stroke="#0f172a" strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          )}
        </Svg>
        {vide && <Text style={S.aide} pointerEvents="none">Signez ici avec le doigt</Text>}
      </View>
      <View style={S.bas}>
        <Text style={S.etat}>{value ? 'Signature enregistrée' : ' '}</Text>
        <Pressable onPress={effacer} disabled={vide} accessibilityRole="button" accessibilityLabel="Effacer la signature"
          style={({ pressed }) => [S.effacer, (pressed || vide) && { opacity: 0.5 }]}>
          <Eraser color={COLORS.blue900} size={16} />
          <Text style={S.effacerText}>Effacer</Text>
        </Pressable>
      </View>
    </View>
  )
}

const S = StyleSheet.create({
  zone: {
    height: HAUTEUR, backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden',
    borderWidth: 2, borderStyle: 'dashed', borderColor: '#cbd5e1',
  },
  aide: { position: 'absolute', alignSelf: 'center', top: HAUTEUR / 2 - 10, color: '#94a3b8', fontWeight: '700' },
  bas: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  etat: { color: COLORS.green600, fontWeight: '700', fontSize: 13 },
  effacer: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 8 },
  effacerText: { color: COLORS.blue900, fontWeight: '800' },
})
