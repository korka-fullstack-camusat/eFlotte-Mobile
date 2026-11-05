// Barre d'onglets en bas (bleu Camusat, comme Inventory) : Accueil, Demandes, Historique, Profil.
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { ClipboardList, History, Home, UserRound } from 'lucide-react-native'
import { Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { AppHeaderBar } from '../../components/AppHeader'
import { COLORS } from '../../design/theme'
import { useNotificationsTelephone } from '../../features/notifications/useNotificationsTelephone'
import DemandesStack from './DemandesStack'
import HistoriqueTab from './HistoriqueTab'
import HomeTab from './HomeTab'
import ProfilTab from './ProfilTab'

const Tab = createBottomTabNavigator()

export default function MainTabs() {
  const insets = useSafeAreaInsets()
  useNotificationsTelephone()   // notifications du téléphone (relances, suivi des demandes)
  const webBar = Platform.OS === 'web' ? { height: 68 + insets.bottom, paddingTop: 6, paddingBottom: 10 + insets.bottom } : null
  return (
    <Tab.Navigator
      initialRouteName="Accueil"
      screenOptions={{
        header: () => <AppHeaderBar />,
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.6)',
        tabBarLabelStyle: { fontSize: 12, fontWeight: '800' },
        tabBarStyle: { backgroundColor: COLORS.blue900, borderTopWidth: 0, ...webBar },
        tabBarHideOnKeyboard: true,   // la barre ne masque pas les champs pendant la saisie
      }}
    >
      <Tab.Screen name="Accueil" component={HomeTab}
        options={{ tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }} />
      <Tab.Screen name="Demandes" component={DemandesStack}
        options={{ headerShown: false, tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={size} /> }} />
      <Tab.Screen name="Historique" component={HistoriqueTab}
        options={{ tabBarIcon: ({ color, size }) => <History color={color} size={size} /> }} />
      <Tab.Screen name="Profil" component={ProfilTab}
        options={{ tabBarIcon: ({ color, size }) => <UserRound color={color} size={size} /> }} />
    </Tab.Navigator>
  )
}
