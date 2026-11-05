// Demandes du chauffeur : remontée, panne, vidange (alerte e-mail côté serveur).
import { api } from '../../lib/http/api'

export type NatureDemande = 'REMONTEE' | 'PANNE' | 'VIDANGE'
export type StatutDemande = 'NOUVELLE' | 'EN_COURS' | 'TRAITEE'

export const NATURES: Record<NatureDemande, string> = { REMONTEE: 'Remontée', PANNE: 'Panne', VIDANGE: 'Vidange' }
export const STATUTS: Record<StatutDemande, string> = { NOUVELLE: 'Envoyée', EN_COURS: 'En cours', TRAITEE: 'Traitée' }

export interface Demande {
  id: number
  nature: NatureDemande
  immatriculation: string
  kilometrage: number
  position: string
  technicien: string
  description: string | null
  statut: StatutDemande
  commentaire: string | null
  traitee_par: string | null
  created_at: string
  updated_at: string | null
}

export interface NouvelleDemande {
  nature: NatureDemande
  immatriculation: string
  kilometrage: number
  position: string
  technicien: string
  description: string
}

export const demandes = {
  creer: async (d: NouvelleDemande): Promise<Demande> => (await api.post('/api/demandes', d)).data,
  mes: async (page = 1, page_size = 20): Promise<{ items: Demande[]; total: number }> =>
    (await api.get('/api/demandes/mes', { params: { page, page_size } })).data,
}
