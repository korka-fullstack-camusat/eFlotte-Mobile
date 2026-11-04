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
eas login              # compte Expo (gratuit) du propriétaire du projet
eas init               # relie le projet au compte (ajoute extra.eas.projectId dans app.json)
```
Puis à chaque version :
```bash
npm run build:apk      # = eas build -p android --profile preview
```
EAS construit l'APK dans le cloud et donne un lien de téléchargement / QR code à partager aux
chauffeurs (installation hors Play Store : autoriser « sources inconnues »).
Pour le Play Store : `npm run build:prod` (fichier `.aab`).

Avant une nouvelle version installable : incrémenter `version` dans `app.json`
(`versionCode` est incrémenté automatiquement par EAS).

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
