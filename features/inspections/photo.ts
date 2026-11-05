// Photo du véhicule : appareil photo du téléphone, puis réduction (plus grand côté
// 1600 px, JPEG ~72 %) pour rester sous la limite de 5 Mo de l'API et envoyer vite en 4G.
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator'
import * as ImagePicker from 'expo-image-picker'

import type { PhotoLocale } from './types'

const COTE_MAX = 1600

export class PermissionRefusee extends Error {}

export async function prendrePhoto(): Promise<PhotoLocale | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync()
  if (!perm.granted) throw new PermissionRefusee("L'accès à l'appareil photo est refusé. Autorisez-le dans les réglages du téléphone.")
  const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8, exif: false })
  if (res.canceled || !res.assets?.[0]) return null
  return reduire(res.assets[0])
}

/**
 * Android ferme parfois l'application pendant que l'appareil photo est ouvert (mémoire).
 * Au redémarrage, la photo prise est récupérée ici.
 */
export async function photoEnAttente(): Promise<PhotoLocale | null> {
  try {
    const res = await ImagePicker.getPendingResultAsync()
    if (!res || !('assets' in res) || res.canceled || !res.assets?.[0]) return null
    return await reduire(res.assets[0])
  } catch {
    return null
  }
}

/** Photo prise avec l'appareil intégré (components/AppareilPhoto) : même réduction. */
export async function reduire(a: { uri: string; width: number; height: number }): Promise<PhotoLocale> {
  const grand = Math.max(a.width || 0, a.height || 0)
  const ctx = ImageManipulator.manipulate(a.uri)
  if (grand > COTE_MAX) ctx.resize(a.width >= a.height ? { width: COTE_MAX } : { height: COTE_MAX })
  const image = await ctx.renderAsync()
  const out = await image.saveAsync({ compress: 0.72, format: SaveFormat.JPEG })
  return { uri: out.uri, width: out.width, height: out.height }
}
