// Historique : mes rapports checklist et mes demandes (remontée, panne, vidange) avec leur
// suivi, page par page (pagination côté serveur) au fil du défilement.
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native'

import { CarteDemande } from '../../components/Demandes'
import { Chargement, Erreur, Vide } from '../../components/Etats'
import { RapportCarte } from '../../components/Rapports'
import { COLORS } from '../../design/theme'
import { demandes } from '../../features/demandes/api'
import { inspections } from '../../features/inspections/api'
import { S, Titre } from './shared'

const PAGE = 15
type Onglet = 'rapports' | 'demandes'

function pluriel(n: number, mot: string, accord: string) {
  return `${n} ${mot}${n > 1 ? 's' : ''} ${accord}${n > 1 ? 's' : ''}`
}

function Onglets({ actif, onChange }: { actif: Onglet; onChange: (o: Onglet) => void }) {
  return (
    <View style={H.onglets} accessibilityRole="tablist">
      {([['rapports', 'Rapports'], ['demandes', 'Demandes']] as const).map(([cle, label]) => (
        <Pressable key={cle} onPress={() => onChange(cle)} accessibilityRole="tab" accessibilityState={{ selected: actif === cle }}
          style={[H.onglet, actif === cle && H.ongletActif]}>
          <Text style={[H.ongletTexte, actif === cle && { color: '#fff' }]}>{label}</Text>
        </Pressable>
      ))}
    </View>
  )
}

export default function HistoriqueTab() {
  const nav = useNavigation<any>()
  const route = useRoute<any>()
  const [onglet, setOnglet] = useState<Onglet>(route.params?.onglet ?? 'rapports')

  // Ouvert depuis l'accès rapide « Mes demandes » ou une notification : onglet demandé
  // (t : heure de la demande, pour rouvrir l'onglet même si on l'avait quitté entre-temps)
  const [demandeVue, setDemandeVue] = useState(route.params?.t)
  if (route.params?.t !== demandeVue) {
    setDemandeVue(route.params?.t)
    if (route.params?.onglet) setOnglet(route.params.onglet)
  }

  const rapportsQ = useInfiniteQuery({
    queryKey: ['mesRapports'],
    queryFn: ({ pageParam }) => inspections.mesRapports(pageParam, PAGE),
    initialPageParam: 1,
    getNextPageParam: (last, pages) => (pages.length * PAGE < last.total ? pages.length + 1 : undefined),
  })
  const demandesQ = useInfiniteQuery({
    queryKey: ['mesDemandes'],
    queryFn: ({ pageParam }) => demandes.mes(pageParam, PAGE),
    initialPageParam: 1,
    getNextPageParam: (last, pages) => (pages.length * PAGE < last.total ? pages.length + 1 : undefined),
    enabled: onglet === 'demandes',
  })

  // Le statut d'une demande a pu changer depuis la plateforme
  const { refetch: relireDemandes } = demandesQ
  useFocusEffect(useCallback(() => { if (onglet === 'demandes') void relireDemandes() }, [onglet, relireDemandes]))

  const q = onglet === 'rapports' ? rapportsQ : demandesQ
  const total = q.data?.pages[0]?.total ?? 0
  const sousTitre = !q.data ? undefined
    : onglet === 'rapports' ? pluriel(total, 'rapport', 'envoyé') : pluriel(total, 'demande', 'envoyée')

  const entete = (
    <View style={{ gap: 8, marginBottom: 12 }}>
      <Titre title="Historique" subtitle={sousTitre} />
      <Onglets actif={onglet} onChange={setOnglet} />
    </View>
  )
  const commun = {
    contentContainerStyle: H.container,
    ListHeaderComponent: entete,
    ItemSeparatorComponent: () => <View style={{ height: 10 }} />,
    onEndReachedThreshold: 0.4,
    onEndReached: () => { if (q.hasNextPage && !q.isFetchingNextPage) void q.fetchNextPage() },
    ListFooterComponent: q.isFetchingNextPage ? <ActivityIndicator color={COLORS.blue900} style={{ marginVertical: 16 }} /> : undefined,
    refreshControl: <RefreshControl refreshing={q.isRefetching && !q.isFetchingNextPage} onRefresh={() => { void q.refetch() }} colors={[COLORS.blue900]} />,
  }
  const vide = (texte: string) => (q.isLoading ? <Chargement /> : q.isError
    ? <Erreur texte="Impossible de charger l’historique. Vérifiez votre connexion." onRetry={q.refetch} />
    : <Vide texte={texte} />)

  return (
    <View style={S.screen}>
      {onglet === 'rapports' ? (
        <FlatList {...commun}
          data={rapportsQ.data?.pages.flatMap((p) => p.items) ?? []}
          keyExtractor={(r) => `r${r.id}`}
          renderItem={({ item }) => <RapportCarte rapport={item} onPress={() => nav.navigate('RapportDetail', { id: item.id })} />}
          ListEmptyComponent={vide('Vous n’avez encore envoyé aucun rapport.')} />
      ) : (
        <FlatList {...commun}
          data={demandesQ.data?.pages.flatMap((p) => p.items) ?? []}
          keyExtractor={(d) => `d${d.id}`}
          renderItem={({ item }) => <CarteDemande d={item} />}
          ListEmptyComponent={vide('Aucune demande envoyée pour le moment.')} />
      )}
    </View>
  )
}

const H = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingBottom: 32, flexGrow: 1 },
  onglets: { flexDirection: 'row', backgroundColor: COLORS.blue50, borderRadius: 14, padding: 4, borderWidth: 1, borderColor: COLORS.blue100 },
  onglet: { flex: 1, minHeight: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  ongletActif: { backgroundColor: COLORS.blue900 },
  ongletTexte: { color: COLORS.blue900, fontWeight: '800', fontSize: 14 },
})
