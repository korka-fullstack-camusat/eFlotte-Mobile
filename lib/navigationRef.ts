// Référence au conteneur de navigation : permet de changer de page depuis n'importe où
// (par exemple la déconnexion lancée depuis un écran imbriqué dans un onglet).
import { createNavigationContainerRef } from '@react-navigation/native'

export const navigationRef = createNavigationContainerRef<any>()

export function resetTo(name: string) {
  if (navigationRef.isReady()) navigationRef.reset({ index: 0, routes: [{ name }] })
}
