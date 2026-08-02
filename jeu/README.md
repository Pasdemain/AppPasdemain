# Protocole Néon

Roguelite d'action top-down, futuriste, **pensé pour le téléphone**.
Aucune dépendance, aucun build : du HTML, du CSS et du JavaScript natif.

## Lancer le jeu

Ouvre `jeu/index.html` dans un navigateur. Pour jouer sur téléphone, héberge le
dossier `jeu/` sur le site du gîte et ouvre l'adresse depuis le mobile
(« Ajouter à l'écran d'accueil » donne un rendu plein écran).

## Contrôles

| Action | Mobile | Clavier |
|---|---|---|
| Déplacement | joystick virtuel (pouce sur la moitié gauche) | ZQSD / WASD / flèches |
| Tir | **automatique**, vise l'ennemi le plus proche | — |
| Dash | bouton `DASH` | Espace |
| Ultime | bouton `ULT` | E |
| Pause | bouton `❚❚` | Échap / P |

## Boucle de jeu

- **Vagues infinies.** La difficulté suit une courbe polynomiale : elle monte
  sans fin mais reste rattrapable par la montée en puissance du joueur.
- **Un boss toutes les 10 vagues**, avec une mécanique propre à chacun. Après le
  cinquième, le cycle reprend au palier supérieur (Mk II, Mk III…), sans limite.
- **Montée de niveau** : à chaque niveau, 3 cartes au choix (nouvelle arme,
  amélioration d'arme, statistique) + une relance offerte tous les 5 niveaux.
- **Cristaux ◈** gagnés en fin de partie → Laboratoire (bonus permanents) et
  Arsenal (déblocage d'armes).
- **Quêtes** à paliers infinis : chaque récompense réclamée relance un objectif
  plus ambitieux.

## Les cinq boss

| Vague | Boss | Mécanique |
|---|---|---|
| 10 | **NEXUS-01 « Prisme »** | Invulnérable tant que ses 4 nœuds orbitaux vivent. Les détruire ouvre une fenêtre de 9 s ; ils se reforment ensuite. Balaie l'arène de lasers rotatifs. |
| 20 | **VORTEX-02 « Cyclone »** | Aspire le joueur en continu, tire des spirales de projectiles et projette des anneaux de compression qu'il faut traverser par l'intérieur. |
| 30 | **HYDRE-03 « Réplicant »** | Se dédouble en leurres identiques et échange sa place avec eux. Seule la copie dont le cœur brille encaisse les dégâts. |
| 40 | **BASTION-04 « Égide »** | Bouclier frontal en arc qui pivote vers le joueur : il faut le contourner et frapper dans le dos. Déploie des tourelles et charge. |
| 50 | **OMEGA-05 « Architecte »** | Grille laser alimentée par des piliers (chaque pilier détruit le blesse) et reconfiguration du secteur : trois quadrants sur quatre deviennent mortels. |

## Sauvegarde

La progression est stockée en **JSON dans le `localStorage`** du téléphone
(clé `protocole-neon.save.v1`) : cristaux, améliorations, armes débloquées,
quêtes et records. L'écriture est différée et forcée quand l'application passe
en arrière-plan.

Depuis le menu :

- **⬇ Exporter la sauvegarde** — télécharge un fichier
  `protocole-neon-sauvegarde-AAAA-MM-JJ.json`.
- **⬆ Importer** — recharge un fichier exporté (utile pour changer d'appareil).

Le format est versionné : les sauvegardes anciennes ou incomplètes sont
complétées automatiquement au chargement.

## Organisation du code

```
jeu/
├── index.html            structure des écrans + HUD
├── css/style.css         thème néon, mobile-first (safe-area, tactile)
└── js/
    ├── core/
    │   ├── utils.js      espace de noms NF, maths, helpers de dessin
    │   ├── input.js      clavier + joystick virtuel
    │   └── fx.js         particules, textes flottants, secousse de caméra
    ├── data/
    │   ├── weapons.js    10 armes (tir, montée en niveau, coût)
    │   ├── upgrades.js   cartes de niveau + tirage pondéré
    │   ├── meta.js       améliorations permanentes du Laboratoire
    │   └── quests.js     quêtes à paliers infinis
    ├── entities/
    │   ├── projectiles.js projectiles, dangers, ramassables, éclairs
    │   ├── player.js      statistiques, dash, ultime, progression
    │   ├── enemies.js     12 types d'ennemis et leurs comportements
    │   └── bosses.js      les 5 archétypes de boss + cycle des paliers
    ├── systems/
    │   ├── save.js       sauvegarde JSON, export/import
    │   └── waves.js      enchaînement et difficulté des vagues
    ├── ui/
    │   ├── hud.js        interface en jeu
    │   └── menus.js      menus, laboratoire, arsenal, quêtes
    ├── game.js           boucle principale, collisions, règles
    └── main.js           amorçage
```

## Ajouter du contenu

- **Une arme** : ajoute une entrée dans `js/data/weapons.js` (`id`, `cost`,
  `fire(game, player, inst)`). Elle apparaîtra dans l'Arsenal et dans les cartes
  de niveau une fois débloquée.
- **Un ennemi** : ajoute un type dans `NF.ENEMY_TYPES` (`js/entities/enemies.js`)
  avec son `minWave` et son `weight` ; le tirage des vagues le prend en compte
  automatiquement.
- **Un boss** : ajoute un objet au tableau `NF.BOSSES` (`js/entities/bosses.js`)
  avec `init`, `update`, éventuellement `onPhase`, `draw` et `block`. Le cycle
  des vagues l'intègre sans autre modification.
