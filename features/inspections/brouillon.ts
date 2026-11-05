// Les réponses et les photos déjà prises sont gardées sur le téléphone si l'app est fermée
// en cours de saisie (y compris par Android pendant que l'appareil photo est ouvert).
// La signature ne l'est pas.
import AsyncStorage from '@react-native-async-storage/async-storage'

import type { PhotoLocale, ReponseItem } from './types'

export interface Brouillon {
  etape: number
  immatriculation: string
  kilometrage: string
  visite_technique: string
  items: Record<string, ReponseItem>
  autres: Record<string, string>
  commentaires: string
  photos?: Record<string, PhotoLocale>
  /** Appareil photo ouvert pour cette case : si l'app redémarre, on rouvre la checklist et on récupère la photo */
  photoAttendue?: string | null
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
