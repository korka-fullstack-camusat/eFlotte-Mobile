export const TYPE_RAPPORT_LABELS: Record<string, string> = { INSPECTION: 'Inspection', RESTITUTION: 'Restitution' }

const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
const MOIS_LONGS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']

const deux = (n: number) => String(n).padStart(2, '0')

/** « 04 nov. 2026 » ; « AAAA-MM-JJ » seul = date locale (sans décalage de fuseau). */
export function formatDate(iso: string | null | undefined, avecHeure = false): string {
  if (!iso) return '—'
  const d = iso.length === 10 ? new Date(`${iso}T00:00:00`) : new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const base = `${deux(d.getDate())} ${MOIS[d.getMonth()]} ${d.getFullYear()}`
  return avecHeure ? `${base} à ${deux(d.getHours())}:${deux(d.getMinutes())}` : base
}

/** « Mercredi 4 novembre » */
export function aujourdhuiLong(): string {
  const d = new Date()
  const t = `${JOURS[d.getDay()]} ${d.getDate()} ${MOIS_LONGS[d.getMonth()]}`
  return t.charAt(0).toUpperCase() + t.slice(1)
}

/** Espaces des milliers à la française (Intl n'est pas complet sur tous les Android). */
export function formatNombre(n: number): string {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

export const formatKm = (km: number) => `${formatNombre(km)} km`

/** Date du jour au format AAAA-MM-JJ (heure locale). */
export function aujourdhuiIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${deux(d.getMonth() + 1)}-${deux(d.getDate())}`
}
