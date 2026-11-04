// Session du chauffeur : jeton dans le coffre-fort du téléphone (Keystore Android),
// profil en mémoire. Sur le web (tests), SecureStore n'existe pas : stockage du navigateur.
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'
import { create } from 'zustand'

import { queryClient } from '../../lib/query'

const CLE_JETON = 'eflotte.jeton'
const web = Platform.OS === 'web'

const lire = async (k: string) => {
  if (!web) return SecureStore.getItemAsync(k)
  try { return globalThis.localStorage?.getItem(k) ?? null } catch { return null }
}
const ecrire = async (k: string, v: string | null) => {
  if (!web) return v ? SecureStore.setItemAsync(k, v) : SecureStore.deleteItemAsync(k)
  try { v ? globalThis.localStorage?.setItem(k, v) : globalThis.localStorage?.removeItem(k) } catch {}
}

export type Utilisateur = {
  id: number
  username: string
  full_name: string | null
  email: string | null
  role: string
  vehicule_plaque: string | null
  filiale: string | null
  telephone: string | null
  doit_changer_mdp: boolean
}

type Etat = {
  pret: boolean                 // jeton relu au démarrage
  token: string | null
  utilisateur: Utilisateur | null
  charger: () => Promise<string | null>
  ouvrir: (token: string, utilisateur: Utilisateur) => Promise<void>
  majUtilisateur: (u: Partial<Utilisateur>) => void
  fermer: () => Promise<void>
}

export const useSession = create<Etat>((set, get) => ({
  pret: false,
  token: null,
  utilisateur: null,
  charger: async () => {
    let token: string | null = null
    try { token = await lire(CLE_JETON) } catch { token = null }
    set({ token, pret: true })
    return token
  },
  ouvrir: async (token, utilisateur) => {
    await ecrire(CLE_JETON, token)
    set({ token, utilisateur })
  },
  majUtilisateur: (u) => {
    const cur = get().utilisateur
    if (cur) set({ utilisateur: { ...cur, ...u } })
  },
  fermer: async () => {
    await ecrire(CLE_JETON, null)
    queryClient.clear()          // aucune donnée du compte précédent
    set({ token: null, utilisateur: null })
  },
}))
