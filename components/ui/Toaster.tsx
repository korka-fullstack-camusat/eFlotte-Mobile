import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Easing, PanResponder, Platform, StyleSheet, Text, View } from 'react-native'

import * as Haptics from 'expo-haptics'
import { COLORS } from '../../design/theme'

type Kind = 'success' | 'error' | 'info'
type Toast = {
  id: string
  kind: Kind
  title?: string
  message?: string
  duration?: number // ms
}

function dotBg(kind: Kind) {
  return {
    backgroundColor:
      kind === 'success' ? '#10B981'
      : kind === 'error'   ? '#EF4444'
      : COLORS.blue600,
  } as const
}

type Ctx = { push: (t: Omit<Toast, 'id'>) => void; clear: () => void }
const ToasterCtx = createContext<Ctx | null>(null)

// ---- API globale pratique ---------------------------------------------------
let _push: Ctx['push'] = () => {}
let _clear: Ctx['clear'] = () => {}

export const toast = {
  success: (opts: Omit<Toast, 'id'|'kind'>) => _push({ ...opts, kind: 'success' }),
  error:   (opts: Omit<Toast, 'id'|'kind'>) => _push({ ...opts, kind: 'error' }),
  info:    (opts: Omit<Toast, 'id'|'kind'>) => _push({ ...opts, kind: 'info' }),
  clear:   () => _clear(),
}

// ---- Provider ---------------------------------------------------------------
export function ToasterProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([])

  const ctx = useMemo<Ctx>(() => ({
    push: (t) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
      setItems((arr) => [...arr, { id, duration: 2800, ...t }])
      // Haptics light selon état
      if (t.kind === 'error') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      else if (t.kind === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    },
    clear: () => setItems([]),
  }), [])

  // expose fonctions globales
  useEffect(() => {
    _push = ctx.push
    _clear = ctx.clear
  }, [ctx])

  return (
    <ToasterCtx.Provider value={ctx}>
      {children}
      <ToastHost items={items} onDone={(id) => setItems(arr => arr.filter(t => t.id !== id))} />
    </ToasterCtx.Provider>
  )
}

export function useToaster() {
  const v = useContext(ToasterCtx)
  if (!v) throw new Error('useToaster must be used within ToasterProvider')
  return v
}

// ---- Host (affichage + animations) -----------------------------------------
function ToastHost({ items, onDone }: { items: Toast[]; onDone: (id: string) => void }) {
  return (
    <View pointerEvents="box-none" style={S.host}>
      {items.map((t) => (
        <ToastItem key={t.id} t={t} onDone={() => onDone(t.id)} />
      ))}
    </View>
  )
}

function ToastItem({ t, onDone }: { t: Toast; onDone: () => void }) {
  const [translateY] = useState(() => new Animated.Value(-60))
  const [opacity] = useState(() => new Animated.Value(0))
  const life = useRef<ReturnType<typeof setTimeout> | null>(null)

  // swipe pour fermer
  const [pan] = useState(() => new Animated.ValueXY())
  const responder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
    onPanResponderRelease: (_e, g) => {
      if (Math.abs(g.dy) > 30 || Math.abs(g.dx) > 80) {
        Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }).start(onDone)
      } else {
        Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: true }).start()
      }
    },
  }), [onDone, opacity, pan])

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: 0, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start()
    life.current = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(onDone)
    }, t.duration ?? 2800)
    return () => { if (life.current) clearTimeout(life.current) }
  }, [onDone, opacity, t.duration, translateY])

  const { bg, fg, border } = palette(t.kind)

  return (
    <Animated.View
      {...responder.panHandlers}
      style={[
        S.item,
        { backgroundColor: bg, borderColor: border, transform: [{ translateY }, ...pan.getTranslateTransform()], opacity },
      ]}
    >
      <View style={[S.dotBase, dotBg(t.kind)]} />
      <View style={{ flex: 1 }}>
        {t.title ? <Text style={[S.title, { color: fg }]} numberOfLines={1}>{t.title}</Text> : null}
        {t.message ? <Text style={[S.msg, { color: fg }]} numberOfLines={3}>{t.message}</Text> : null}
      </View>
    </Animated.View>
  )
}

function palette(kind: Kind) {
  if (kind === 'success') return {
    bg: '#ECFDF5', fg: '#065F46', border: '#A7F3D0',
  }
  if (kind === 'error') return {
    bg: '#FEF2F2', fg: '#991B1B', border: '#FECACA',
  }
  // info = Camusat blue
  return {
    bg: Platform.select({ ios: '#EFF6FF', android: '#EFF6FF', default: '#EFF6FF' }),
    fg: COLORS.blue900, border: '#BFDBFE',
  }
}

const S = StyleSheet.create({
  host: {
    position: 'absolute',
    top: 14,
    left: 0, right: 0,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  item: {
    flexDirection: 'row',
    gap: 10,
    minHeight: 54,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    width: '94%',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    marginTop: 10,
  },
   dotBase: {
    width: 10, height: 10, borderRadius: 5, marginTop: 4,
  },
  title: { fontWeight: '700', marginBottom: 2 },
  msg: { opacity: 0.9 },
})
