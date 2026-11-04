// Client HTTP vers l'API eFlotte : jeton ajouté à chaque appel, déconnexion si le serveur le refuse.
import axios from 'axios'

import { useSession } from '../../features/auth/session'

// Adresse de l'API = le backend de la plateforme web (mêmes comptes, mêmes données).
// EXPO_PUBLIC_API_URL (fichier .env / eas.json), sinon le serveur de production.
export const DEFAULT_API_URL = 'https://eflotte.camusatsn.com'
export const BASE_URL = (process.env.EXPO_PUBLIC_API_URL?.trim() || DEFAULT_API_URL).replace(/\/$/, '')

export const api = axios.create({ baseURL: BASE_URL, timeout: 60_000 })

api.interceptors.request.use((config) => {
  const token = useSession.getState().token
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  return config
})

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    // Jeton expiré (24 h) ou compte désactivé : retour à l'écran de connexion
    if (err?.response?.status === 401 && useSession.getState().token) {
      await useSession.getState().fermer()
    }
    throw err
  },
)

/** Message lisible pour une erreur d'appel API. */
export function messageErreur(e: any, defaut = 'Une erreur est survenue. Réessayez.'): string {
  if (!e?.response) return 'Connexion impossible. Vérifiez votre réseau et réessayez.'
  const detail = e.response.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail) && detail[0]?.msg) return String(detail[0].msg)
  return defaut
}
