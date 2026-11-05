import { api } from '../../lib/http/api'
import { type Utilisateur, useSession } from './session'

export class AccesRefuse extends Error {}

/** Connexion (formulaire OAuth2 de l'API), puis profil : l'application est réservée aux chauffeurs. */
export async function connexion(username: string, password: string): Promise<Utilisateur> {
  const corps = new URLSearchParams({ username: username.trim(), password }).toString()
  const { data } = await api.post<{ access_token: string }>('/api/auth/login', corps, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  const { data: moi } = await api.get<Utilisateur>('/api/auth/me', {
    headers: { Authorization: `Bearer ${data.access_token}` },
  })
  if (moi.role !== 'CHAUFFEUR') {
    throw new AccesRefuse(
      "Cette application est réservée aux chauffeurs.\nUtilisez la plateforme web eFlotte pour la gestion du parc.",
    )
  }
  await useSession.getState().ouvrir(data.access_token, moi)
  if (moi.doit_changer_mdp) useSession.setState({ motDePasseConnexion: password })
  return moi
}

export async function profil(): Promise<Utilisateur> {
  const { data } = await api.get<Utilisateur>('/api/auth/me')
  return data
}

export async function changerMotDePasse(ancien: string, nouveau: string) {
  await api.post('/api/auth/me/mot-de-passe', { ancien, nouveau })
  useSession.getState().majUtilisateur({ doit_changer_mdp: false })
  useSession.setState({ motDePasseConnexion: null })
}
