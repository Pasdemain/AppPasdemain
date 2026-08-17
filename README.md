# Permis Bateau

Application de préparation au **permis plaisance option côtière**, en français.
Cours, entraînement au QCM, examens blancs et suivi de progression.

**Tout tient dans un seul fichier : `index.html`.** Pas d'installation, pas de dépendance,
pas de compte, aucune requête réseau. Ouvrez-le, il fonctionne — y compris hors ligne.

## L'ouvrir sur son téléphone

### Le plus simple : GitHub Pages

1. Sur GitHub, allez dans **Settings → Pages**.
2. Dans **Source**, choisissez **Deploy from a branch**.
3. Sélectionnez la branche de ce dépôt et le dossier `/ (root)`, puis **Save**.
4. Au bout d'une minute, l'app est en ligne à l'adresse
   `https://pasdemain.github.io/App-PermisBateau/`.

Ouvrez ce lien sur votre téléphone, puis ajoutez-le à l'écran d'accueil :

- **iPhone (Safari)** : bouton Partager → *Sur l'écran d'accueil*.
- **Android (Chrome)** : menu ⋮ → *Ajouter à l'écran d'accueil*.

L'app s'ouvre alors en plein écran, avec son icône, comme une application installée.

### Sans rien mettre en ligne

Téléchargez `index.html` sur le téléphone et ouvrez-le depuis l'application Fichiers.
C'est un fichier autonome : il marche aussi bien en mode avion.

## Fonctionnalités

- **Cours** — neuf leçons couvrant le programme officiel : balisage, règles de barre, feux et
  marques, signaux sonores, sécurité, météo et marées, VHF, réglementation, navigation. Chaque
  leçon se termine par un encadré « à retenir » et un raccourci vers les questions du thème.
- **Entraînement** — séries par thème, correction immédiate et explication à chaque réponse.
- **Examen blanc** — 40 questions tirées de tout le programme, avec la règle réelle en vigueur
  depuis le 1er juin 2022 : admis à 5 fautes maximum, soit 35 bonnes réponses minimum.
- **Mes erreurs** — série constituée automatiquement des questions ratées à la dernière tentative.
- **Progrès** — taux de réussite global et par thème, questions acquises, historique des examens.
- **Thème clair et sombre**, réglé sur le système ou forcé via le bouton ◐.

Les propositions de réponse sont mélangées à chaque affichage : on retient le contenu, pas la
position de la bonne case.

## Où sont enregistrées les données

Un seul objet JSON dans le `localStorage` du navigateur, sous la clé
`permis-bateau/progress/v1` :

```json
{
  "questions": { "bar-01": { "seen": 3, "correct": 2, "lastCorrect": true } },
  "exams": [{ "date": "2026-08-17T09:12:00.000Z", "total": 30, "correct": 27, "passed": true }]
}
```

Rien ne sort du téléphone. Le bouton *Réinitialiser ma progression*, dans l'onglet Progrès,
efface cette clé.

## Modifier le contenu

Tout est dans `index.html`. Ouvrez-le dans un éditeur de texte et cherchez `const DATA =` :
les thèmes, les cours et les questions sont juste en dessous, en JSON lisible.

Pour ajouter une question :

```json
{
  "id": "bal-07",
  "theme": "balisage",
  "prompt": "Question posée à l'utilisateur ?",
  "choices": ["Bonne réponse", "Distracteur", "Distracteur", "Distracteur"],
  "answer": 0,
  "explanation": "Pourquoi cette réponse est la bonne.",
  "critical": true
}
```

`answer` est la position de la bonne réponse dans `choices` tel que vous l'écrivez ; l'ordre est
mélangé à l'affichage et l'index recalculé. `critical` est facultatif et met simplement en avant
une question de sécurité pendant la révision — il n'a aucun effet sur le résultat. Les `id`
doivent rester stables : ils servent de clé de progression. Les `theme` doivent correspondre à un
identifiant de la liste `THEMES`.

## Avertissement

Le contenu pédagogique est fourni à titre d'entraînement. Il ne remplace ni la formation dispensée
par un établissement agréé, ni les textes officiels en vigueur.
