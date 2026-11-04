// Les réponses sont gardées sur le téléphone si l'app est fermée en cours de saisie.
// Photos et signature ne le sont pas (fichiers temporaires / trop lourds).
import AsyncStorage from '@react-native-async-storage/async-storage'

import type { ReponseItem } from './types'

export interface Brouillon {
  etape: number
  immatriculation: string
  kilometrage: string
  visite_technique: string
  items: Record<string, ReponseItem>
  autres: Record<string, string>
  commentaires: string
}

const cle = (username: string) => `eflotte.brouillon.${username}`

export async function lireBrouillon(username: string): Promise<Brouillon | null> {
  try {
    const brut = await AsyncStorage.getItem(cle(username))
    return brut ? (JSON.parse(brut) as Brouillon) : null
  } catch {
    return null
  }
}

export async function ecrireBrouillon(username: string, b: Brouillon | null) {
  try {
    if (b) await AsyncStorage.setItem(cle(username), JSON.stringify(b))
    else await AsyncStorage.removeItem(cle(username))
  } catch {
    // stockage indisponible : on continue sans brouillon
  }
}
