// Nouveau rapport : la checklist papier « INSPECTION/RESTITUTION D'UN VÉHICULE », étape par étape,
// comme sur la plateforme web. Première page : immatriculation (préremplie, modifiable), kilométrage
// et visite technique (calendrier). Chauffeur et filiale viennent du compte, jamais redemandés.
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Image } from 'expo-image'
import {
  AlertTriangle, Camera, CheckCheck, ChevronLeft, ChevronRight, RotateCcw, Send, X,
} from 'lucide-react-native'
import { type ComponentRef, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator, Alert, BackHandler, KeyboardAvoidingView, Platform, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'

import ChampDate from '../components/ChampDate'
import { Chargement, Erreur } from '../components/Etats'
import SignaturePad from '../components/SignaturePad'
import { toast } from '../components/ui/Toaster'
import { COLORS } from '../design/theme'
import { useSession } from '../features/auth/session'
import { inspections } from '../features/inspections/api'
import { type Brouillon, ecrireBrouillon, lireBrouillon } from '../features/inspections/brouillon'
import { aujourdhuiIso, formatDate, formatNombre } from '../features/inspections/format'
import { PermissionRefusee, prendrePhoto } from '../features/inspections/photo'
import type { ChecklistModele, MonEspace, PhotoLocale, ReponseItem, VehiculeMini } from '../features/inspections/types'
import { messageErreur } from '../lib/http/api'

/* ---------- Boutons de réponse (Oui / Non, Haut / Bas, S / NS) ---------- */
function Choix({ options, valeur, negative, onChange, label }: {
  options: { valeur: string; libelle: string }[]; valeur?: string; negative: string
  onChange: (v: string) => void; label: string
}) {
  return (
    <View style={F.choix} accessibilityRole="radiogroup" accessibilityLabel={label}>
      {options.map((o) => {
        const actif = valeur === o.valeur
        const neg = o.valeur === negative
        return (
          <Pressable key={o.valeur} onPress={() => onChange(o.valeur)} accessibilityRole="radio"
            accessibilityState={{ checked: actif }} accessibilityLabel={`${label} : ${o.libelle}`}
            style={({ pressed }) => [F.choixBtn, actif && (neg ? F.choixNeg : F.choixPos), pressed && { opacity: 0.85 }]}>
            <Text style={[F.choixText, actif && { color: '#fff' }]}>{o.libelle}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

/* ---------- Sélecteur de véhicule (premier rapport seulement) ---------- */
export default function NouveauRapportScreen() {
  const nav = useNavigation<any>()
  const qc = useQueryClient()
  const username = useSession((s) => s.utilisateur?.username ?? '')
  const modeleQ = useQuery({ queryKey: ['modele'], queryFn: inspections.modele, staleTime: 3_600_000 })
  const espaceQ = useQuery({ queryKey: ['moi'], queryFn: inspections.moi })
  const vehiculesQ = useQuery({ queryKey: ['vehicules'], queryFn: inspections.vehicules, staleTime: 600_000 })

  const modele = modeleQ.data
  const espace = espaceQ.data
  if (modeleQ.isError || espaceQ.isError) {
    return <Erreur texte="Impossible de charger le formulaire. Vérifiez votre connexion."
      onRetry={() => { void modeleQ.refetch(); void espaceQ.refetch() }} />
  }
  if (!modele || !espace) return <Chargement texte="Préparation du formulaire…" />
  return <Formulaire modele={modele} espace={espace} vehicules={vehiculesQ.data} username={username}
    onEnvoye={(id) => {
      void qc.invalidateQueries({ queryKey: ['moi'] })
      void qc.invalidateQueries({ queryKey: ['mesRapports'] })
      nav.replace('RapportDetail', { id })
    }} />
}

function Formulaire({ modele, espace, vehicules, username, onEnvoye }: {
  modele: ChecklistModele; espace: MonEspace; vehicules: VehiculeMini[] | undefined; username: string
  onEnvoye: (id: number) => void
}) {
  const nav = useNavigation<any>()
  const insets = useSafeAreaInsets()
  const [pret, setPret] = useState(false)
  const [etape, setEtape] = useState(0)
  const [immatriculation, setImmatriculation] = useState(espace.vehicule_plaque ?? '')
  const [kilometrage, setKilometrage] = useState('')
  const [visiteTechnique, setVisiteTechnique] = useState('')
  const [items, setItems] = useState<Record<string, ReponseItem>>({})
  const [autres, setAutres] = useState<Record<string, string>>({})
  const [commentaires, setCommentaires] = useState('')
  const [photos, setPhotos] = useState<Record<string, PhotoLocale>>({})
  const [photoEnCours, setPhotoEnCours] = useState<string | null>(null)
  const [signature, setSignature] = useState('')
  const [defilement, setDefilement] = useState(true)
  const [envoi, setEnvoi] = useState(false)
  const [tentative, setTentative] = useState(false)
  const corps = useRef<ComponentRef<typeof ScrollView>>(null)

  // Reprise du brouillon (réponses saisies avant une fermeture de l'app)
  useEffect(() => {
    let actif = true
    void lireBrouillon(username).then((b) => {
      if (!actif) return
      if (b) {
        // Brouillon d'une ancienne version du formulaire : repartir du début
        setEtape(b.etape < modele.sections.length + 3 ? b.etape : 0)
        if (b.immatriculation) setImmatriculation(b.immatriculation)
        setKilometrage(b.kilometrage); setVisiteTechnique(b.visite_technique)
        setItems(b.items ?? {}); setAutres(b.autres ?? {}); setCommentaires(b.commentaires ?? '')
      }
      setPret(true)
    })
    return () => { actif = false }
  }, [username, espace.vehicule_plaque, modele.sections.length])

  useEffect(() => {
    if (!pret) return
    const b: Brouillon = { etape, immatriculation, kilometrage, visite_technique: visiteTechnique, items, autres, commentaires }
    void ecrireBrouillon(username, b)
  }, [pret, username, etape, immatriculation, kilometrage, visiteTechnique, items, autres, commentaires])

  const etapes = useMemo(() => [
    { cle: 'infos', titre: 'Véhicule et kilométrage' },
    ...modele.sections.map((s) => ({ cle: s.cle, titre: s.titre })),
    { cle: 'photos', titre: 'Photos du véhicule' },
    { cle: 'validation', titre: 'Signature et envoi' },
  ], [modele])

  // Véhicule de la flotte correspondant à la plaque saisie (espaces, tirets et majuscules ignorés)
  const clePlaque = (p: string) => p.toUpperCase().replace(/[^A-Z0-9]/g, '')
  const vehicule: VehiculeMini | null =
    (espace.vehicule && clePlaque(espace.vehicule.plaque_immatriculation) === clePlaque(immatriculation) ? espace.vehicule : null)
    ?? vehicules?.find((v) => clePlaque(v.plaque_immatriculation) === clePlaque(immatriculation)) ?? null
  const vtConnue = vehicule?.visite_technique && vehicule.visite_technique >= aujourdhuiIso() ? vehicule.visite_technique : null
  const kmBas = vehicule?.kilometrage != null && kilometrage !== '' && Number(kilometrage) < vehicule.kilometrage
  const cleEtape = etapes[etape]?.cle
  const section = modele.sections.find((s) => s.cle === cleEtape)
  const derniere = etape === etapes.length - 1
  const vtValide = !visiteTechnique || /^\d{4}-\d{2}-\d{2}$/.test(visiteTechnique)

  const manquants = (idx: number): string[] => {
    const cle = etapes[idx]?.cle
    if (cle === 'infos') {
      const out: string[] = []
      if (!immatriculation.trim()) out.push('immatriculation')
      if (!/^\d+$/.test(kilometrage)) out.push('kilométrage')
      if (!vtValide) out.push('date de visite technique')
      return out
    }
    if (cle === 'photos') return modele.photos.filter((p) => !photos[p.position]).map((p) => p.libelle)
    if (cle === 'validation') return signature ? [] : ['signature']
    const s = modele.sections.find((x) => x.cle === cle)
    return s ? s.items.filter((i) => !items[i.cle]?.valeur).map((i) => i.libelle) : []
  }

  const aller = (idx: number) => { setEtape(idx); setTentative(false); corps.current?.scrollTo({ y: 0, animated: false }) }
  const suivant = () => { if (manquants(etape).length) { setTentative(true); return } aller(etape + 1) }

  const repondre = (cle: string, valeur: string) =>
    setItems((prev) => ({ ...prev, [cle]: { valeur, commentaire: prev[cle]?.commentaire ?? '' } }))
  const commenter = (cle: string, commentaire: string) =>
    setItems((prev) => ({ ...prev, [cle]: { ...prev[cle], commentaire } }))
  const toutConforme = () => {
    if (!section) return
    const t = modele.types_reponse[section.type]
    const positive = t.options.find((o) => o.valeur !== t.negative)!.valeur
    setItems((prev) => {
      const next = { ...prev }
      section.items.forEach((i) => { if (!next[i.cle]?.valeur) next[i.cle] = { valeur: positive, commentaire: '' } })
      return next
    })
  }

  const photographier = async (position: string) => {
    setPhotoEnCours(position)
    try {
      const p = await prendrePhoto()
      if (p) setPhotos((prev) => ({ ...prev, [position]: p }))
    } catch (e) {
      toast.error({ title: 'Photo impossible', message: e instanceof PermissionRefusee ? e.message : 'Réessayez.' })
    } finally {
      setPhotoEnCours(null)
    }
  }

  // Quitter en cours de saisie : les réponses restent en brouillon, pas les photos ni la signature
  const quitter = useCallback(() => {
    const commence = Object.keys(items).length > 0 || Object.keys(photos).length > 0 || kilometrage !== ''
    if (!commence || envoi) { if (!envoi) nav.goBack(); return }
    if (Platform.OS === 'web') { nav.goBack(); return }
    Alert.alert('Quitter le formulaire ?',
      'Vos réponses restent enregistrées sur ce téléphone, mais les photos et la signature seront à refaire.',
      [{ text: 'Continuer la saisie', style: 'cancel' }, { text: 'Quitter', style: 'destructive', onPress: () => nav.goBack() }])
  }, [items, photos, kilometrage, envoi, nav])

  // Bouton retour Android : étape précédente, sinon confirmation avant de quitter
  useFocusEffect(useCallback(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (envoi) return true
      if (etape > 0) { aller(etape - 1); return true }
      quitter()
      return true
    })
    return () => sub.remove()
  }, [etape, envoi, quitter]))

  const envoyer = async () => {
    const incomplete = etapes.findIndex((_, i) => manquants(i).length > 0)
    if (incomplete !== -1) { aller(incomplete); setTentative(true); return }
    setEnvoi(true)
    try {
      const rapport = await inspections.envoyer({
        type_rapport: 'INSPECTION',
        immatriculation: immatriculation.trim(),
        kilometrage: Number(kilometrage),
        visite_technique: vtConnue ? null : visiteTechnique || null,
        reponses: { items, autres },
        commentaires,
        nom_instructeur: '',
        signature,
      }, photos)
      await ecrireBrouillon(username, null)
      if (!espace.vehicule_plaque) useSession.getState().majUtilisateur({ vehicule_plaque: rapport.immatriculation })
      toast.success({ title: 'Checklist envoyée', message: 'Merci, votre rapport a bien été transmis.' })
      onEnvoye(rapport.id)
    } catch (e: any) {
      toast.error({
        title: 'Envoi impossible',
        message: e?.response ? messageErreur(e) : 'Pas de connexion. Vos réponses sont conservées : réessayez dès que le réseau revient.',
        duration: 6000,
      })
    } finally {
      setEnvoi(false)
    }
  }

  const listeManquants = tentative ? manquants(etape) : []
  const nonConformes = modele.sections.flatMap((s) =>
    s.items.filter((i) => items[i.cle]?.valeur === modele.types_reponse[s.type].negative))
  const critique = nonConformes.some((i) => i.critique)

  if (!pret) return <Chargement />

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.gray50 }}>
      {/* En-tête de l'étape + progression */}
      <StatusBar style="light" />
      <View style={[F.etapeHead, { paddingTop: insets.top + 10 }]}>
        <View style={{ flex: 1 }}>
          <Text style={F.etapeNum}>Étape {etape + 1} sur {etapes.length}</Text>
          <Text style={F.etapeTitre} accessibilityRole="header" numberOfLines={1}>{etapes[etape]?.titre}</Text>
        </View>
        <Pressable onPress={quitter} accessibilityRole="button" accessibilityLabel="Fermer le formulaire" hitSlop={8} style={F.fermer}>
          <X color="#fff" size={18} />
        </Pressable>
      </View>
      <View style={F.progression} accessibilityRole="progressbar"
        accessibilityValue={{ min: 1, max: etapes.length, now: etape + 1 }}>
        <View style={[F.progressionBarre, { width: `${((etape + 1) / etapes.length) * 100}%` }]} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView ref={corps} scrollEnabled={defilement} contentContainerStyle={[F.corps, (cleEtape === 'infos' || cleEtape === 'photos') && F.corpsCentre]} keyboardShouldPersistTaps="handled">
          {cleEtape === 'infos' ? (
            <View style={{ gap: 14 }}>
              <View>
                <Text style={F.label} nativeID="lbl-immat">Immatriculation *</Text>
                <TextInput accessibilityLabelledBy="lbl-immat" value={immatriculation} autoCapitalize="characters"
                  onChangeText={setImmatriculation} placeholder="ex : AA 512 YS" placeholderTextColor="#9aa7bd"
                  style={[F.input, tentative && !immatriculation.trim() && F.inputErreur]} />
                {!!(vehicule?.marque || vehicule?.modele) && (
                  <Text style={F.aide}>{[vehicule?.marque, vehicule?.modele].filter(Boolean).join(' ')}</Text>
                )}
              </View>

              <View>
                <Text style={F.label} nativeID="lbl-km">Kilométrage au compteur (km) *</Text>
                <TextInput accessibilityLabelledBy="lbl-km" value={kilometrage} keyboardType="number-pad"
                  onChangeText={(t) => setKilometrage(t.replace(/\D/g, ''))}
                  placeholder={vehicule?.kilometrage != null ? `Dernier relevé : ${formatNombre(vehicule.kilometrage)}` : 'ex : 45230'}
                  placeholderTextColor="#9aa7bd"
                  style={[F.input, tentative && !/^\d+$/.test(kilometrage) && F.inputErreur]} />
                <Text style={[F.aide, kmBas && { color: COLORS.amber700 }]}>
                  {kmBas
                    ? `Inférieur au dernier relevé (${formatNombre(vehicule!.kilometrage!)} km) : vérifiez le compteur.`
                    : vehicule?.kilometrage != null ? `Dernier relevé : ${formatNombre(vehicule.kilometrage)} km` : ' '}
                </Text>
              </View>

              {/* Visite technique : demandée seulement si inconnue ou dépassée */}
              {vtConnue ? (
                <Text style={F.aide}>Visite technique valable jusqu’au <Text style={{ fontWeight: '800' }}>{formatDate(vtConnue)}</Text>.</Text>
              ) : (
                <View>
                  <Text style={F.label}>
                    Date de la visite technique{vehicule?.visite_technique ? ' (la dernière connue est dépassée)' : ''}
                  </Text>
                  <ChampDate label="Date de la visite technique" valeur={visiteTechnique} onChange={setVisiteTechnique}
                    erreur={tentative && !vtValide} />
                </View>
              )}
            </View>
          ) : section ? (
            <View style={{ gap: 10 }}>
              <View style={F.ligneEntre}>
                <Text style={F.question}>{section.question}</Text>
                <Pressable onPress={toutConforme} accessibilityRole="button" style={({ pressed }) => [F.toutConforme, pressed && { opacity: 0.85 }]}>
                  <CheckCheck color={COLORS.green600} size={16} />
                  <Text style={F.toutConformeText}>Tout conforme</Text>
                </Pressable>
              </View>
              {section.items.map((i) => {
                const rep = items[i.cle]
                const neg = rep?.valeur === modele.types_reponse[section.type].negative
                const manque = tentative && !rep?.valeur
                return (
                  <View key={i.cle} style={[F.carteItem, manque && { borderColor: '#f87171' }]}>
                    <View style={F.itemTitreLigne}>
                      <Text style={F.itemTitre}>{i.libelle}</Text>
                      {i.critique && <View style={F.badgeCritique}><Text style={F.badgeCritiqueText}>CRITIQUE</Text></View>}
                    </View>
                    <Choix options={modele.types_reponse[section.type].options} valeur={rep?.valeur}
                      negative={modele.types_reponse[section.type].negative}
                      onChange={(v) => repondre(i.cle, v)} label={i.libelle} />
                    {neg && (
                      <TextInput value={rep?.commentaire ?? ''} onChangeText={(t) => commenter(i.cle, t)} multiline
                        accessibilityLabel={`Commentaire : ${i.libelle}`}
                        placeholder={section.type === 'ETAT' ? 'Pourquoi ? Où se trouve le problème ?' : 'Précisez (facultatif)'}
                        placeholderTextColor="#9aa7bd" style={[F.input, { marginTop: 8, minHeight: 56, textAlignVertical: 'top' }]} />
                    )}
                  </View>
                )
              })}
              <View style={F.carteItem}>
                <Text style={F.itemTitre} nativeID={`autres-${section.cle}`}>Autres (facultatif)</Text>
                <TextInput accessibilityLabelledBy={`autres-${section.cle}`} value={autres[section.cle] ?? ''}
                  onChangeText={(t) => setAutres((prev) => ({ ...prev, [section.cle]: t }))}
                  placeholder="Autre élément à signaler" placeholderTextColor="#9aa7bd" style={[F.input, { marginTop: 8 }]} />
              </View>
            </View>
          ) : cleEtape === 'photos' ? (
            <View style={{ gap: 14 }}>
              <Text style={F.question}>Prenez les {modele.photos.length} photos du véhicule. Touchez une case pour ouvrir l’appareil photo.</Text>
              <View style={F.photos}>
                {modele.photos.map((p) => {
                  const photo = photos[p.position]
                  const manque = tentative && !photo
                  return (
                    <Pressable key={p.position} onPress={() => photographier(p.position)} disabled={!!photoEnCours}
                      accessibilityRole="button"
                      accessibilityLabel={photo ? `Reprendre la photo : ${p.libelle}` : `Prendre la photo : ${p.libelle}`}
                      style={({ pressed }) => [F.photo, photo ? F.photoOk : manque ? F.photoManque : null, pressed && { opacity: 0.85 }]}>
                      {photoEnCours === p.position ? (
                        <ActivityIndicator color={COLORS.blue900} />
                      ) : photo ? (
                        <>
                          <Image source={{ uri: photo.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
                          <View style={F.photoLegende}>
                            <RotateCcw color="#fff" size={12} />
                            <Text style={F.photoLegendeText}>{p.libelle}</Text>
                          </View>
                        </>
                      ) : (
                        <>
                          <Camera color={manque ? '#dc2626' : COLORS.muted} size={24} />
                          <Text style={[F.photoText, manque && { color: '#dc2626' }]}>{p.libelle}</Text>
                        </>
                      )}
                    </Pressable>
                  )
                })}
              </View>
            </View>
          ) : (
            <View style={{ gap: 16 }}>
              <View style={[F.resume, critique ? F.resumeCritique : nonConformes.length ? F.resumeAnomalie : F.resumeOk]}>
                <Text style={F.resumeTitre}>
                  {nonConformes.length === 0 ? 'Tous les points sont conformes.'
                    : `${nonConformes.length} point${nonConformes.length > 1 ? 's' : ''} non conforme${nonConformes.length > 1 ? 's' : ''}`}
                </Text>
                {nonConformes.map((i) => (
                  <View key={i.cle} style={F.resumeLigne}>
                    {i.critique && <AlertTriangle color="#dc2626" size={13} accessibilityLabel="critique" />}
                    <Text style={F.resumeTexte}>{i.libelle}</Text>
                  </View>
                ))}
                {critique && (
                  <Text style={F.resumeAlerte}>
                    Un point critique n’est pas conforme : le véhicule doit être immobilisé. Prévenez votre responsable.
                  </Text>
                )}
              </View>

              <View>
                <Text style={F.label} nativeID="lbl-com">Commentaires</Text>
                <TextInput accessibilityLabelledBy="lbl-com" value={commentaires} onChangeText={setCommentaires} multiline
                  placeholder="Remarques générales (facultatif)" placeholderTextColor="#9aa7bd"
                  style={[F.input, { minHeight: 80, textAlignVertical: 'top' }]} />
              </View>

              <View>
                <Text style={F.label}>
                  Signature du conducteur * <Text style={{ fontWeight: '500', color: COLORS.muted }}>({espace.full_name || espace.username})</Text>
                </Text>
                <SignaturePad value={signature} onChange={setSignature}
                  onDebut={() => setDefilement(false)} onFin={() => setDefilement(true)} />
              </View>
            </View>
          )}

          {listeManquants.length > 0 && (
            <View style={F.manquants} accessibilityRole="alert">
              <Text style={F.manquantsText}>À compléter : {listeManquants.join(', ')}.</Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Navigation entre les étapes */}
      <SafeAreaView edges={['bottom']} style={F.navBas}>
        <Pressable onPress={() => aller(etape - 1)} disabled={etape === 0 || envoi} accessibilityRole="button"
          style={({ pressed }) => [F.btnRetour, (etape === 0 || envoi) && { opacity: 0.4 }, pressed && { opacity: 0.7 }]}>
          <ChevronLeft color={COLORS.text} size={18} />
          <Text style={F.btnRetourText}>Retour</Text>
        </Pressable>
        {derniere ? (
          <Pressable onPress={envoyer} disabled={envoi} accessibilityRole="button"
            style={({ pressed }) => [F.btnPrincipal, (pressed || envoi) && { opacity: 0.85 }]}>
            {envoi ? <ActivityIndicator color="#fff" /> : <Send color="#fff" size={18} />}
            <Text style={F.btnPrincipalText}>{envoi ? 'Envoi…' : 'Envoyer la checklist'}</Text>
          </Pressable>
        ) : (
          <Pressable onPress={suivant} accessibilityRole="button" style={({ pressed }) => [F.btnPrincipal, pressed && { opacity: 0.85 }]}>
            <Text style={F.btnPrincipalText}>Suivant</Text>
            <ChevronRight color="#fff" size={18} />
          </Pressable>
        )}
      </SafeAreaView>
    </View>
  )
}

const F = StyleSheet.create({
  etapeHead: { backgroundColor: COLORS.blue900, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
  etapeNum: { color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  etapeTitre: { color: '#fff', fontSize: 18, fontWeight: '900' },
  fermer: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  progression: { height: 5, backgroundColor: 'rgba(15,59,130,0.15)' },
  progressionBarre: { height: 5, backgroundColor: COLORS.blue600 },
  corps: { padding: 16, paddingBottom: 32 },
  // Pages courtes (véhicule, photos) : contenu centré dans la hauteur de l'écran
  corpsCentre: { flexGrow: 1, justifyContent: 'center' },
  carte: { backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  carteHead: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  icone: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.blue50, alignItems: 'center', justifyContent: 'center' },
  petitLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },
  grosTexte: { fontSize: 17, fontWeight: '900', color: COLORS.text },
  grille: { flexDirection: 'row', flexWrap: 'wrap', padding: 14, rowGap: 10 },
  grilleCase: { width: '50%', paddingRight: 8 },
  valeur: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  alerte: { backgroundColor: COLORS.amber50, borderColor: COLORS.amber200, borderWidth: 1, borderRadius: 16, padding: 12, gap: 10 },
  alerteTexte: { color: '#92400E', fontSize: 13 },
  label: { fontSize: 13, fontWeight: '800', color: '#475569', marginBottom: 6 },
  aide: { fontSize: 12, color: COLORS.muted, marginTop: 4 },
  input: {
    borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11,
    color: COLORS.text, backgroundColor: '#fff', fontSize: 15,
  },
  inputErreur: { borderColor: '#f87171' },
  selecteur: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  modalTitre: { fontSize: 20, fontWeight: '900', color: COLORS.blue900 },
  vehiculeLigne: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, padding: 12 },
  vehiculeActif: { borderColor: COLORS.blue900, backgroundColor: COLORS.blue50 },
  vehiculePlaque: { fontWeight: '900', color: COLORS.blue900, fontSize: 15 },
  vehiculeSous: { color: COLORS.muted, fontWeight: '600', marginTop: 2 },
  ligneEntre: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  question: { color: '#475569', fontWeight: '700', flexShrink: 1 },
  toutConforme: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.green50,
    borderWidth: 1, borderColor: '#A7F3D0', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8,
  },
  toutConformeText: { color: '#047857', fontWeight: '800', fontSize: 13 },
  carteItem: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: 12 },
  itemTitreLigne: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 10 },
  itemTitre: { flex: 1, fontWeight: '800', color: COLORS.text, fontSize: 15 },
  badgeCritique: { backgroundColor: COLORS.red50, borderColor: '#FECACA', borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  badgeCritiqueText: { color: '#DC2626', fontSize: 10, fontWeight: '900' },
  choix: { flexDirection: 'row', gap: 8 },
  choixBtn: {
    flex: 1, minHeight: 48, borderRadius: 12, borderWidth: 2, borderColor: '#e5e7eb',
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8,
  },
  choixPos: { backgroundColor: COLORS.green600, borderColor: COLORS.green600 },
  choixNeg: { backgroundColor: COLORS.red600, borderColor: COLORS.red600 },
  choixText: { fontWeight: '800', color: '#374151', textAlign: 'center' },
  photos: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  photo: {
    width: '48%', aspectRatio: 4 / 3, borderRadius: 16, borderWidth: 2, borderStyle: 'dashed', borderColor: '#cbd5e1',
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', gap: 6, overflow: 'hidden',
  },
  photoOk: { borderStyle: 'solid', borderColor: '#10b981' },
  photoManque: { borderColor: '#f87171', backgroundColor: '#fef2f2' },
  photoText: { color: COLORS.muted, fontWeight: '800', fontSize: 12, textAlign: 'center' },
  photoLegende: {
    position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.55)',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 4,
  },
  photoLegendeText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  resume: { borderRadius: 16, borderWidth: 1, padding: 12, gap: 4 },
  resumeOk: { backgroundColor: COLORS.green50, borderColor: '#A7F3D0' },
  resumeAnomalie: { backgroundColor: COLORS.amber50, borderColor: COLORS.amber200 },
  resumeCritique: { backgroundColor: COLORS.red50, borderColor: '#FECACA' },
  resumeTitre: { fontWeight: '900', color: COLORS.text },
  resumeLigne: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  resumeTexte: { color: '#374151' },
  resumeAlerte: { marginTop: 6, color: '#B91C1C', fontWeight: '700', fontSize: 13 },
  manquants: { marginTop: 16, backgroundColor: COLORS.red50, borderColor: '#FECACA', borderWidth: 1, borderRadius: 12, padding: 10 },
  manquantsText: { color: '#B91C1C', fontWeight: '600' },
  navBas: {
    flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  btnRetour: {
    minHeight: 50, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border,
    flexDirection: 'row', alignItems: 'center', gap: 2,
  },
  btnRetourText: { fontWeight: '800', color: COLORS.text },
  btnPrincipal: {
    flex: 1, minHeight: 50, borderRadius: 14, backgroundColor: COLORS.blue900,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  btnPrincipalText: { color: '#fff', fontWeight: '900', fontSize: 15 },
})
