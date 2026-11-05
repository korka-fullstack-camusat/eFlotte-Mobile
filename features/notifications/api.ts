// Notifications du chauffeur (relances de checklist, suivi des demandes…).
import { api } from '../../lib/http/api'

export type TypeNotification = 'RELANCE' | 'DEMANDE' | 'INFO'

export interface NotificationChauffeur {
  id: number
  type: TypeNotification
  titre: string
  message: string | null
  data: Record<string, unknown> | null
  created_at: string
  lue_at: string | null
}

export const notifications = {
  liste: async (limite = 30): Promise<{ items: NotificationChauffeur[]; non_lues: number }> =>
    (await api.get('/api/inspections/notifications', { params: { limite } })).data,
  marquerLues: async (): Promise<void> => { await api.post('/api/inspections/notifications/lues') },
  enregistrerJeton: async (token: string, platform: string) => { await api.post('/api/inspections/push-token', { token, platform }) },
  supprimerJeton: async (token: string) => { await api.post('/api/inspections/push-token/supprimer', { token }) },
}

/** Écran ouvert quand on touche une notification. */
export function cibleNotification(type: string | undefined, data?: Record<string, unknown> | null):
  { name: string; params?: object } {
  if (type === 'RELANCE' || data?.ecran === 'NouveauRapport') return { name: 'NouveauRapport' }
  if (type === 'DEMANDE' || data?.demande_id) return { name: 'Main', params: { screen: 'Demandes' } }
  return { name: 'Main', params: { screen: 'Accueil' } }
}
