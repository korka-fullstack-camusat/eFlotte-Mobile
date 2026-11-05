import { Platform } from 'react-native'

import { api, BASE_URL } from '../../lib/http/api'
import type {
  ChecklistModele, MonEspace, NouveauRapportPayload, PhotoLocale, RapportDetail, RapportPage, VehiculeMini,
} from './types'

const BASE = '/api/inspections'

export const inspections = {
  modele: async (): Promise<ChecklistModele> => (await api.get(`${BASE}/modele`)).data,
  moi: async (): Promise<MonEspace> => (await api.get(`${BASE}/moi`)).data,
  vehicules: async (): Promise<VehiculeMini[]> => (await api.get(`${BASE}/vehicules`)).data,
  mesRapports: async (page: number, page_size = 15, q = ''): Promise<RapportPage> =>
    (await api.get(`${BASE}/mes-rapports`, { params: { page, page_size, ...(q.trim() ? { q: q.trim() } : {}) } })).data,
  rapport: async (id: number): Promise<RapportDetail> => (await api.get(`${BASE}/rapports/${id}`)).data,

  /** Adresse d'une photo d'un rapport (à charger avec l'en-tête d'authentification). */
  urlPhoto: (id: number, position: string) => `${BASE_URL}${BASE}/rapports/${id}/photos/${position}`,

  envoyer: async (payload: NouveauRapportPayload, photos: Record<string, PhotoLocale>): Promise<RapportDetail> => {
    const form = new FormData()
    form.append('data', JSON.stringify(payload))
    for (const [position, photo] of Object.entries(photos)) {
      if (Platform.OS === 'web') {
        const blob = await (await fetch(photo.uri)).blob()
        form.append(`photo_${position}`, blob, `${position}.jpg`)
      } else {
        // Android / iOS : fichier local envoyé tel quel par React Native
        form.append(`photo_${position}`, { uri: photo.uri, name: `${position}.jpg`, type: 'image/jpeg' } as any)
      }
    }
    const { data } = await api.post(`${BASE}/rapports`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 180_000,   // 6 photos sur un réseau mobile lent
    })
    return data
  },
}
