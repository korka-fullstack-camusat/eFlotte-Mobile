# eFlotte — application mobile Android (Expo)

Application des **chauffeurs Camusat** pour envoyer la checklist hebdomadaire du véhicule
(« CHECKLIST INSPECTION/RESTITUTION D'UN VÉHICULE »). Elle remplace l'app chauffeur web (`/app`)
de la plateforme eFlotte et utilise **le même backend** (`eFlotte-Api`) : mêmes comptes, mêmes
données, les rapports apparaissent dans *Checklists chauffeurs* sur la plateforme web.

Même pile et même présentation que l'app **Inventory** (`inventory_mobile`) : Expo SDK 58,
React Native, TypeScript, React Navigation, TanStack Query, zustand, axios, lucide.

## Fonctionnalités

| Écran | Contenu |
|---|---|
| Connexion | Identifiant + mot de passe (reçus par SMS). Réservée au rôle `CHAUFFEUR`. |
| Première connexion | Changement obligatoire du mot de passe initial. |
| Accueil | Bonjour, rappel si la checklist de la semaine est attendue (relances), bouton **Nouveau rapport**, 3 derniers rapports. |
| Nouveau rapport | Étapes : véhicule → 5 sections du formulaire (Oui/Non, Haut/Bas, S/NS, « Tout conforme », commentaire si non conforme) → kilométrage + 6 photos (appareil photo) → résumé des non-conformités, commentaires, **signature au doigt** → envoi. |
| Historique | Tous mes rapports (pagination serveur, chargement au défilement). |
| Détail d'un rapport | Réponses par section, points critiques, photos, signature. |
| Profil | Véhicule, filiale, téléphone, nombre de rapports, changer le mot de passe, déconnexion. |

- Véhicule, chauffeur et filiale du compte ne sont jamais redemandés ; la visite technique
  seulement si elle est inconnue ou dépassée.
- Les réponses sont gardées sur le téléphone si l'app est fermée en cours de saisie
  (pas les photos ni la signature).
- Photos réduites sur le téléphone (1600 px, JPEG) avant l'envoi : rapide en 4G, sous la limite de 5 Mo.
- Les données déjà vues restent sur le téléphone : l'app s'ouvre tout de suite, même avec un réseau faible.

## Tester avec Expo Go

1. Installer Node.js (20 ou 22) et **Expo Go** (Play Store) sur le téléphone.
2. ```bash
   git clone <adresse du dépôt> eFlotte-Mobile
   cd eFlotte-Mobile
   npm install
   npm run go
   ```
3. Scanner le QR code avec Expo Go. Ordinateur et téléphone sur le même Wi-Fi, sinon `npm run go -- --tunnel`.
4. Se connecter avec un compte **chauffeur** créé sur la plateforme (page *Comptes utilisateurs*).

## Adresse de l'API

`EXPO_PUBLIC_API_URL` dans `.env` (développement) et `eas.json` (APK) — par défaut le serveur de
production `http://16.171.169.105`. Autre serveur pour un test : fichier `.env.local` (non suivi par git)
avec `EXPO_PUBLIC_API_URL=http://…`.

⚠ Le serveur est en **HTTP** (adresse IP, pas de certificat) : l'APK autorise ce trafic
(`usesCleartextTraffic` dans `app.json`). Dès qu'un nom de domaine en HTTPS est en place
(Caddy le fait automatiquement), mettre `https://…` dans `.env` et `eas.json`, et retirer
`usesCleartextTraffic`.

⚠ Les rapports envoyés depuis l'app sont de vrais rapports sur le serveur utilisé.

## Générer l'APK Android (EAS Build)

Une seule fois :
```bash
npm install -g eas-cli
eas login              # compte Expo du propriétaire (« owner » dans app.json : korka-diallo)
eas init               # crée le projet Expo : ajoute extra.eas.projectId dans app.json
eas update:configure   # active les mises à jour : ajoute updates.url dans app.json
```
Committer ensuite `app.json` (projectId + updates.url).

Puis :
```bash
npm run build:apk      # = eas build -p android --profile preview  → APK (canal « preview »)
```
EAS construit l'APK dans le cloud et donne un lien / QR code de téléchargement à partager aux
chauffeurs (installation hors Play Store : autoriser « sources inconnues »).
Pour le Play Store : `npm run build:prod` (fichier `.aab`, canal « production »).

## Mises à jour sans réinstaller l'APK (bouton « Mettre à jour »)

L'app vérifie au lancement, au retour au premier plan, puis toutes les 45 s s'il existe une
mise à jour (EAS Update). Si oui, elle la télécharge en arrière-plan et affiche le bandeau
**« Mise à jour disponible » → Mettre à jour** : l'app redémarre aussitôt sur la nouvelle version.
La version installée est affichée en bas du **Profil** (avec la date de la dernière mise à jour reçue).

Publier une mise à jour (écrans, textes, correctifs : tout le code JavaScript / TypeScript) :
```bash
npm run update:preview -- "Description de la mise à jour"   # APK du profil preview
npm run update:prod -- "Description de la mise à jour"      # build production (Play Store)
```
- L'adresse de l'API d'une mise à jour vient du fichier `.env` (pas d'`eas.json`) : vérifier
  qu'aucun `.env.local` de test n'est présent avant de publier.
- Une mise à jour ne s'applique qu'aux APK de même **`version`** (`runtimeVersion` = `version` d'`app.json`)
  et du même canal.
- **Nouvel APK obligatoire** (les chauffeurs le réinstallent une fois) quand on ajoute ou modifie
  un module natif, une permission, l'icône ou le nom de l'app, ou qu'on passe à un nouveau SDK Expo :
  incrémenter alors `version` dans `app.json` (ex. 1.0.0 → 1.1.0) puis `npm run build:apk`.
- Inactif dans Expo Go et en développement.

## Vérifications

```bash
npm run typecheck      # TypeScript
npm run lint           # ESLint (règles Expo)
npx expo export --platform android   # le bundle Android se construit
```

## Structure

```
App.tsx                      démarrage (session), navigation
app/                         écrans (connexion, nouveau rapport, détail, onglets)
components/                  en-tête, signature, cartes, états (chargement / erreur / vide)
features/auth/               connexion, session (jeton dans le Keystore Android)
features/inspections/        API /api/inspections, types, brouillon, photos
lib/http/api.ts              client HTTP (jeton, retour à la connexion si refusé)
design/theme.ts              couleurs Camusat
```

## Session

Le jeton de l'API est valable **24 h** (`TOKEN_EXPIRE_HOURS` dans `eFlotte-Api`) : passé ce délai,
l'app ramène à l'écran de connexion.
