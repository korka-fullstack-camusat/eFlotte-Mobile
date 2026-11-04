// Mêmes types que la plateforme web (eFlotte-Front/src/types) : contrat de /api/inspections.
export type TypeReponse = 'OUI_NON' | 'NIVEAU' | 'ETAT'

export interface ChecklistModele {
  types_reponse: Record<TypeReponse, { options: { valeur: string; libelle: string }[]; negative: string }>
  sections: {
    cle: string
    titre: string
    question: string
    type: TypeReponse
    items: { cle: string; libelle: string; critique: boolean }[]
  }[]
  photos: { position: string; libelle: string }[]
  types_rapport: { valeur: string; libelle: string }[]
}

export interface ReponseItem { valeur: string; commentaire?: string | null }
export interface ReponsesRapport { items: Record<string, ReponseItem>; autres: Record<string, string> }

export interface RapportResume {
  id: number
  user_id: number | null
  type_rapport: string
  date_rapport: string
  immatriculation: string
  marque: string | null
  modele: string | null
  nom_chauffeur: string
  kilometrage: number
  nb_non_conformes: number
  nb_critiques: number
  created_at: string
}

export interface RapportDetail extends RapportResume {
  filiale: string | null
  visite_technique: string | null
  reponses: ReponsesRapport
  commentaires: string | null
  nom_instructeur: string | null
  signature: string | null
  photos: string[]
}

export interface RapportPage { items: RapportResume[]; total: number }

export interface VehiculeMini {
  plaque_immatriculation: string
  marque: string | null
  modele: string | null
  kilometrage: number | null
  visite_technique: string | null
}

export interface RelanceChecklist { id: number; envoye_par: string | null; message: string | null; created_at: string }

export interface MonEspace {
  username: string
  full_name: string | null
  email: string | null
  nb_rapports: number
  vehicule: VehiculeMini | null
  vehicule_plaque: string | null
  filiale: string | null
  envoye_cette_semaine: boolean
  dernier_rapport: RapportResume | null
  derniers_rapports: RapportResume[]
  relances: RelanceChecklist[]
  filiale_precedente: string | null
}

export interface NouveauRapportPayload {
  type_rapport: string
  immatriculation: string
  kilometrage: number
  visite_technique: string | null
  reponses: ReponsesRapport
  commentaires: string
  nom_instructeur: string
  signature: string
}

/** Photo prise sur le téléphone, déjà réduite (fichier local JPEG). */
export interface PhotoLocale { uri: string; width: number; height: number }
