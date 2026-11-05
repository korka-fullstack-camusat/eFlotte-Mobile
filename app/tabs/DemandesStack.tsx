// Onglet « Demandes » : liste des choix puis formulaire, dans l'onglet lui-même pour que
// la barre d'onglets en bas reste visible pendant la saisie d'une demande.
import { createNativeStackNavigator } from '@react-navigation/native-stack'

import { AppHeaderBar } from '../../components/AppHeader'
import DemandeFormScreen from '../DemandeFormScreen'
import DemandesTab from './DemandesTab'

const Stack = createNativeStackNavigator()

export default function DemandesStack() {
  return (
    <Stack.Navigator screenOptions={{
      header: ({ back }) => <AppHeaderBar back={back} />,
      contentStyle: { backgroundColor: '#ffffff' },
    }}>
      <Stack.Screen name="ChoixDemande" component={DemandesTab} />
      <Stack.Screen name="DemandeForm" component={DemandeFormScreen} />
    </Stack.Navigator>
  )
}
