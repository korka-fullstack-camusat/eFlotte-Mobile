// Historique : tous mes rapports, page par page (pagination côté serveur) au fil du défilement.
import { useNavigation } from '@react-navigation/native'
import { useInfiniteQuery } from '@tanstack/react-query'
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native'

import { Chargement, Erreur, Vide } from '../../components/Etats'
import { RapportCarte } from '../../components/Rapports'
import { COLORS } from '../../design/theme'
import { inspections } from '../../features/inspections/api'
import { S, Titre } from './shared'

const PAGE = 15

export default function HistoriqueTab() {
  const nav = useNavigation<any>()
  const q = useInfiniteQuery({
    queryKey: ['mesRapports'],
    queryFn: ({ pageParam }) => inspections.mesRapports(pageParam, PAGE),
    initialPageParam: 1,
    getNextPageParam: (last, pages) => (pages.length * PAGE < last.total ? pages.length + 1 : undefined),
  })
  const items = q.data?.pages.flatMap((p) => p.items) ?? []
  const total = q.data?.pages[0]?.total ?? 0

  return (
    <View style={S.screen}>
      <FlatList
        data={items}
        keyExtractor={(r) => String(r.id)}
        contentContainerStyle={H.container}
        ListHeaderComponent={<Titre title="Historique" subtitle={q.data ? `${total} rapport${total > 1 ? 's' : ''} envoyé${total > 1 ? 's' : ''}` : undefined} />}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => <RapportCarte rapport={item} onPress={() => nav.navigate('RapportDetail', { id: item.id })} />}
        ListEmptyComponent={
          q.isLoading ? <Chargement /> : q.isError
            ? <Erreur texte="Impossible de charger l’historique. Vérifiez votre connexion." onRetry={q.refetch} />
            : <Vide texte="Vous n’avez encore envoyé aucun rapport." />
        }
        onEndReachedThreshold={0.4}
        onEndReached={() => { if (q.hasNextPage && !q.isFetchingNextPage) void q.fetchNextPage() }}
        ListFooterComponent={q.isFetchingNextPage ? <ActivityIndicator color={COLORS.blue900} style={{ marginVertical: 16 }} /> : undefined}
        refreshControl={<RefreshControl refreshing={q.isRefetching && !q.isFetchingNextPage} onRefresh={() => { void q.refetch() }} colors={[COLORS.blue900]} />}
      />
    </View>
  )
}

const H = StyleSheet.create({ container: { paddingHorizontal: 16, paddingBottom: 32, flexGrow: 1 } })
