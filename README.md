# Permis Bateau

Application mobile de préparation au **permis plaisance option côtière**, en français.
Cours par thème, entraînement au QCM, examens blancs et suivi de progression hors ligne.

Construite avec **React Native + Expo (SDK 57)** et **Expo Router**. Tourne sur iOS, Android et le web
depuis la même base de code.

## Fonctionnalités

- **Cours** — neuf leçons couvrant le programme officiel : balisage, règles de barre, feux et marques,
  signaux sonores, sécurité, météo et marées, VHF, réglementation, navigation. Chaque leçon se termine
  par un encadré « à retenir » et un raccourci vers la série de questions correspondante.
- **Entraînement** — séries par thème, avec correction immédiate et explication à chaque réponse.
- **Examen blanc** — 30 questions tirées de l’ensemble du programme, verdict admis/refusé selon la règle
  réelle : 5 fautes maximum, une erreur sur une question de sécurité étant éliminatoire.
- **Révision ciblée** — une série constituée automatiquement des questions ratées à la dernière tentative.
- **Progression** — taux de réussite global et par thème, questions acquises, historique des examens blancs.
  Tout est stocké localement (AsyncStorage) : l’app fonctionne sans connexion et sans compte.
- **Thème clair et sombre**, suivant le réglage du système.

Les propositions de réponse sont mélangées à chaque affichage, pour qu’on retienne le contenu et non
la position de la bonne case.

## Démarrer

```bash
npm install
npm start          # puis « i », « a » ou « w » pour iOS, Android ou le web
```

Scripts disponibles :

| Commande | Effet |
| --- | --- |
| `npm start` | Serveur de développement Expo |
| `npm run ios` | Lance sur simulateur iOS |
| `npm run android` | Lance sur émulateur Android |
| `npm run web` | Lance dans le navigateur |
| `npm run typecheck` | Vérification TypeScript |

## Structure

```
src/
  app/                  Routes Expo Router (le dossier est la navigation)
    (tabs)/             Accueil, Cours, Entraînement, Progrès
    cours/[id].tsx      Détail d’une leçon
    quiz/[mode].tsx     Session de quiz : examen, thème ou révision
  components/           Composants d’interface thématisés
  constants/theme.ts    Palette, espacements, rayons
  data/
    themes.ts           Les neuf thèmes du programme
    lessons.ts          Contenu des cours
    questions.ts        Banque de questions, réponses et explications
  hooks/
    use-progress.tsx    État de progression persisté
    use-theme.ts        Palette selon le thème système
  lib/
    quiz.ts             Constitution des séries, mélange, examen blanc
    storage.ts          Accès AsyncStorage tolérant aux erreurs
```

## Enrichir la banque de questions

Ajoutez une entrée dans `src/data/questions.ts` :

```ts
{
  id: 'bal-07',
  theme: 'balisage',
  prompt: 'Question posée à l’utilisateur ?',
  choices: ['Bonne réponse', 'Distracteur', 'Distracteur', 'Distracteur'],
  answer: 0,               // index dans `choices`, avant mélange
  explanation: 'Pourquoi cette réponse est la bonne.',
  critical: true,          // facultatif : erreur éliminatoire à l’examen
}
```

`answer` désigne la position dans le tableau tel qu’il est écrit ; les propositions sont mélangées à
l’exécution et l’index est recalculé. Les identifiants doivent rester stables : ils servent de clé de
progression.

## Avertissement

Le contenu pédagogique est fourni à titre d’entraînement. Il ne remplace pas la formation dispensée par
un établissement agréé ni les textes officiels en vigueur.
