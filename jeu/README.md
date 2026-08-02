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
| Déplacement | joystick virtuel : il apparaît là où le pouce se pose | ZQSD / WASD / flèches |
| Tir | **automatique**, vise l'ennemi le plus proche | — |
| Dash | bouton `DASH` | Espace |
| Ultime | bouton `ULT` | E |
| Pause | bouton `❚❚` | Échap / P |

### Main directrice

**Paramètres → Main directrice** inverse les commandes tactiles :

| | Joystick | Boutons d'action |
|---|---|---|
| Droitier *(défaut)* | moitié gauche | en bas à droite |
| Gaucher | moitié droite | en bas à gauche |

Le bandeau d'armes et le suivi de quête suivent le mouvement pour ne jamais se
retrouver sous les boutons. Le réglage est accessible depuis le menu et depuis
l'écran de pause, il s'applique immédiatement et est conservé.

Le même écran permet de couper les **vibrations** et la **secousse d'écran**.

## Boucle de jeu

- **Une partie = un secteur de 25 vagues**, terminé par un écran de victoire.
  Chaque secteur a son décor, son bestiaire et ses cinq boss ; le nettoyer
  débloque le suivant, qu'on choisit ensuite au menu.
- **Progression sans fin.** La difficulté suit une courbe polynomiale et les
  secteurs reprennent en paliers supérieurs une fois la liste épuisée.
- **Un boss toutes les 5 vagues**, avec une mécanique propre à chacun. Passé le
  dernier secteur, le cycle reprend au palier supérieur (Mk II, Mk III…).
- **Montée de niveau** : à chaque niveau, 3 cartes au choix (nouvelle arme,
  amélioration d'arme, statistique) + une relance offerte tous les 5 niveaux.
  Au retour dans l'arène, une **demi-seconde d'invincibilité** évite de se faire
  cueillir par ce qui attendait pendant le choix.
- **Ruptures d'écran** : dès la vague 10, les boss interrompent le combat pour
  une mécanique à part — QTE de précision ou de martèlement, défense orbitale,
  course d'obstacles, partition en rythme. Un boss en porte **une par phase**,
  donc jusqu'à deux par combat à partir de la vague 25.
- **Cristaux ◈** gagnés en fin de partie → arbre de talents (bonus permanents)
  et Arsenal (déblocage d'armes).
- **Quêtes** à paliers infinis : chaque récompense réclamée relance un objectif
  plus ambitieux.
- **Récompense quotidienne** : un cycle de 7 jours, une série à entretenir.
- **Classement** : pseudo au choix, tri sur la vague atteinte puis sur le temps.

## Secteurs

Un secteur = **25 vagues + 5 boss**, et **une partie couvre exactement un
secteur**. Nettoyer la 25ᵉ vague termine la partie sur un **écran de victoire**
assorti d'une prime de cristaux : le jeu n'enchaîne pas sur le secteur suivant.

Cette victoire débloque définitivement le secteur d'après. On choisit ensuite
au menu celui dans lequel on veut lancer sa partie — les secteurs déjà nettoyés
restent rejouables. Au-delà du dernier secteur listé, le cycle reprend au palier
supérieur (mêmes boss en Mk II, coefficients relevés), donc la progression
n'a pas de fin.

| Secteur | Vagues | Décor | Particularités |
|---|---|---|---|
| **▦ La Grille** | 1 – 25 | réseau cyan, sol quadrillé | bestiaire de base |
| **⟁ La Faille** | 26 – 50 | violet, fractures pulsantes | éruptions du sol toutes les ~11 s, 5 ennemis inédits, +35 % de PV et +25 % de dégâts |
| **⬡ Le Noyau** | 51 – 75 | ambre en fusion, bassins de magma et anneaux concentriques | éruptions toutes les ~8 s, 3 ennemis inédits, boss à QTE et **phases jouées hors de l'arène** |

**Le secteur est le palier de difficulté.** On repart toujours du niveau 1 :
la courbe de difficulté est identique dans chaque secteur (elle suit la vague
*locale*, de 1 à 25), seul un multiplicateur global change — ×1,9 en vie et
×1,3 en dégâts par secteur franchi. Une partie est donc toujours le même arc,
et c'est l'arbre de talents qui permet d'encaisser le palier suivant.

Le compteur du HUD affiche la progression dans le secteur (`VAGUE 17 / 25`).

### Ennemis propres à La Faille

| Ennemi | Comportement |
|---|---|
| **Spectre** | Se dématérialise, devient inciblable, et réapparaît sur toi. |
| **Couveuse** | Reste à distance et lâche des nuées en continu. |
| **Gardien** | Bouclier qui absorbe une part des dégâts et se reforme après 4 s. |
| **Sangsue** | Dévore tes éclats d'XP au sol — elle les relâche en mourant. |
| **Faucheur** | Tourne autour de toi, tire en rafales, puis traverse en ligne droite. |

### Ennemis propres au Noyau

| Ennemi | Comportement |
|---|---|
| **Fondeur** | Laisse derrière lui une traînée de zones brûlantes. |
| **Mortier** | Reste au loin et lobe des frappes de zone annoncées au sol. |
| **Magnétron** | T'attire vers lui en continu : impossible de simplement fuir. |

## Les quinze boss

### Secteur 1 — La Grille

| Vague | Boss | Mécanique |
|---|---|---|
| 5 | **NEXUS-01 « Prisme »** | Pas de rupture d'écran : le boss d'apprentissage. Invulnérable tant que ses 4 nœuds orbitaux vivent, et chaque nœud détruit **explose en onde de choc**. Une fois à nu il panique et arrose en salves radiales. |
| 10 | **VORTEX-02 « Cyclone »** | Aspire le joueur, puis **inverse son souffle** dès la phase 2. Ph. 2 : *QTE de précision* — un seul passage, lent, pour découvrir la mécanique. |
| 15 | **HYDRE-03 « Réplicant »** | Leurres, échanges de place et **cœur fantôme** allumé sur une copie pendant que le vrai s'éteint. Ph. 2 : *QTE de martèlement*. |
| 20 | **BASTION-04 « Égide »** | Bouclier frontal à contourner ; rester dans son axe le **charge** jusqu'à une décharge en trois faisceaux. Ph. 2 : *conduit* court. |
| 25 | **OMEGA-05 « Architecte »** | Grille laser sur piliers et reconfiguration du secteur. **Premier boss à deux mécaniques** — ph. 2 : *partition*, ph. 3 : *QTE de précision* en deux passages. |

### Secteur 2 — La Faille

| Vague | Boss | Mécanique |
|---|---|---|
À partir d'ici, **chaque boss a deux mécaniques, une par phase**.

| 30 | **SYNTHÈSE-06 « Chimère »** | Rejoue ses trois défenses dans un **ordre tiré au sort à chaque partie**. Ph. 2 : *défense orbitale*, ph. 3 : *martèlement*. |
| 35 | **ORACLE-07 « Prédicteur »** | Frappe ta position **anticipée** et mine le chemin parcouru. Ph. 2 : *partition* dense, ph. 3 : *QTE de précision* en deux passages. |
| 40 | **ESSAIM-08 « Ruche »** | Coque scellée tant qu'une couveuse vit ; elles **rampent vers la ruche** et chaque retour la ravitaille de 8 %. Ph. 2 : *conduit*, ph. 3 : *martèlement*. |
| 45 | **PARADOXE-09 « Miroir »** | Inverse tes commandes, et **les tirs en l'air repartent en arrière**. Pendant l'inversion il encaisse le **double**. Ph. 2 : *QTE de précision* en trois passages, ph. 3 : *défense orbitale*. |
| 50 | **ABYSSE-10 « Dévoreuse »** | Invoque des sbires reliés pour les **avaler et se soigner** ; rompre un lien lui coûte ce qu'elle comptait gagner. Ph. 2 : *partition*, ph. 3 : *martèlement*. |

### Secteur 3 — Le Noyau

Ce secteur sort du cadre : deux boss lancent des **séquences d'action rapide
(QTE)** qui figent le combat, et deux autres **téléportent le joueur dans un
mini-jeu** le temps d'une phase avant de le renvoyer sur la carte. Réussir
arrache une grosse part de vie au boss ; échouer le soigne.

| Vague | Boss | Mécanique |
|---|---|---|
| 55 | **FORGE-11 « Creuset »** | Jauge de surchauffe qui monte **près de deux fois plus vite au contact** : le combattre au corps à corps veut dire enchaîner les *QTE de purge*, autant de passages que sa phase. Ph. 3 : *conduit en surrégime*, il vide sa chaleur dans ses évents. |
| 60 | **ORBITE-12 « Sentinelle »** | Ph. 2 : *défense orbitale*, elle t'expédie là-haut. Ph. 3 : *martèlement* pour rompre le faisceau qui veut t'y garder. |
| 65 | **CIRCUIT-13 « Traceur »** | Deux traversées de *conduit*, la seconde **en surrégime** : plus rapide, et ça vient aussi du plafond. |
| 70 | **ÉCHO-14 « Résonance »** | Bouclier qui ne cède qu'au *martèlement* ; la fenêtre ouverte elle **décroche et fuit**. Trois bris, le dernier définitif. Ph. 3 : *partition*, sa résonance devient une mesure. |
| 75 | **NOYAU-15 « Cœur du protocole »** | Le boss final : salves radiales, triple balayage rotatif, la **partition la plus dense du jeu** en phase 2, puis l'*épreuve orbitale* en phase 3. |

## Ruptures d'écran

Un boss peut interrompre le combat pour une mécanique jouée à part, **une par
phase** (les phases tombent à 66 % et 33 % de sa vie). La montée est
progressive : rien sur le tout premier boss, une seule mécanique sur les
suivants du secteur 1, puis deux par boss à partir de la vague 25.

| Mécanique | Ce qu'on fait | Réussite | Échec |
|---|---|---|---|
| **QTE de précision** | Toucher quand le curseur entre dans la zone, une à trois fois | −10 à 14 % de sa vie | il se soigne de 5 % |
| **QTE de martèlement** | Saturer une jauge avant la fin du chrono | −12 à 14 % | dégâts au joueur |
| **Défense orbitale** | Écran type Space Invaders : la formation descend, le tir est automatique, on glisse pour viser | −18 à 26 % | il se soigne de 7 % |
| **Conduit** | Course d'obstacles à la Geometry Dash : DASH ou ULT pour sauter, double saut autorisé | −17 à 26 % | il se soigne de 6 % |
| **Partition** | Jeu de rythme sur quatre pistes (voir plus bas) | jusqu'à ~30 % | rien de plus que les dégâts subis |

Le déclenchement attend toujours une image où l'écran est libre : deux
mécaniques ne peuvent pas se superposer, même si les deux phases tombent dans
le même souffle.

## Partitions

Cinq boss remplacent une phase de combat par un **jeu de rythme**. Les notes
descendent sur quatre pistes vers une ligne de frappe ; on tape la colonne qui
correspond (au doigt, ou touches `1`–`4` / `D F J K` au clavier).

- Note frappée dans la fenêtre → **le boss encaisse**, et le **combo multiplie
  les dégâts** (jusqu'à ×3, ×3,6 pour le Cœur du protocole).
- Note manquée → **le joueur perd de la vie** (3 à 4 % de ses PV max) et le
  combo retombe à zéro. L'armure, le bouclier et la sauvegarde d'urgence
  s'appliquent, mais pas les images d'invincibilité : chaque note ratée se paie.
- En fin de morceau, un **seuil de précision** (50 à 60 % selon le boss) décide
  du bonus de sortie.

Joué proprement, un passage arrache environ un quart de la vie du boss et ne
coûte rien. Joué au hasard, il tue.

## Arbre de talents

Les cristaux n'achètent pas directement les bonus : ils achètent des **points de
talent**, dont le prix augmente à chaque achat (70 ◈ pour le premier, +9 % à
chaque suivant). Ces points se placent ensuite librement dans l'arbre.

L'arbre part d'un **noyau central** et s'ouvre dans six directions — Puissance,
Cadence, Survie, Mobilité, Butin, Arsenal. Un nœud n'est accessible que s'il
touche le noyau ou un nœud déjà investi, donc on progresse de proche en proche,
dans l'ordre qu'on veut. Les anneaux intermédiaires des branches voisines sont
reliés entre eux : on peut passer d'une branche à l'autre sans repartir du
centre.

**31 nœuds, 153 rangs, 220 points pour tout maximiser.** Le prix d'un point
croît de 5,5 % à chaque achat (60 ◈ le premier) : les premiers dizaines de
points viennent vite, la fin de l'arbre est un objectif de très longue haleine.

| Points possédés | Cristaux cumulés |
|---|---|
| 20 | ~2 100 |
| 40 | ~8 200 |
| 60 | ~26 000 |
| 100 | ~230 000 |
| 220 (tout) | astronomique |

Chaque branche se termine par un **talent majeur**, puis par un **talent
ultime** (5 points, accessible seulement après le majeur) :

| Branche | Talent majeur | Talent ultime |
|---|---|---|
| Puissance | Détonation critique — chaque critique explose | **Exécution** — les ennemis sous 15 % de vie meurent instantanément |
| Cadence | Surcadence — +18 % de cadence | **Double détente** — 30 % de chance de tirer en double |
| Survie | Seconde peau — bouclier toutes les 12 s | **Dernier rempart** — +1 résurrection, relève à 70 % des PV |
| Mobilité | Dash de phase — le dash traverse et blesse | **Sillage** — dash ×3 en dégâts, −25 % de recharge |
| Butin | Amorçage — 2 niveaux d'avance | **Cristallisation** — +50 % de cristaux, +25 % d'XP |
| Arsenal | Rack d'armement — +1 emplacement | **Arsenal préchargé** — toute arme obtenue démarre niveau 3 |

Le bouton **Récupérer tous les points** les libère tous d'un coup, gratuitement,
pour les réattribuer autrement. Les points achetés ne sont jamais perdus.

Le bouton **⤢** bascule entre la vue détaillée (déplaçable au doigt) et une vue
d'ensemble de tout l'arbre.

## Récompense quotidienne

Une récompense par jour, sur un cycle de 7 jours qui se répète :

| Jour | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|
| Gain | 80 ◈ | 130 ◈ | 1 point | 220 ◈ | 320 ◈ | 1 point | 550 ◈ + 1 point |

La **série** avance d'un cran par jour consécutif et repart à un jour dès qu'une
journée est sautée. Les gains en cristaux suivent la progression du joueur
(×1 au départ, jusqu'à ×3 vers la vague 40) pour rester utiles en fin de partie.

Tout est local : la date de l'appareil suffit, aucune connexion n'est requise.
Une horloge reculée est détectée et suspend la récompense plutôt que d'en
distribuer plusieurs.

## Classement

Le joueur choisit un **pseudo** (2 à 16 caractères) dans l'écran Classement.
À chaque fin de partie, la meilleure performance est enregistrée : un seul score
par joueur, trié sur la **vague atteinte**, puis sur le **temps** mis pour y
arriver.

Le jeu fonctionne dans deux modes, choisis automatiquement au démarrage :

- **En ligne** — si `api/scores.php` répond, les scores sont partagés entre tous
  les joueurs du site.
- **Local** — sinon (pas de PHP, ouverture en `file://`, page isolée), le
  classement ne contient que les parties de l'appareil. L'écran fonctionne
  normalement, il annonce simplement le mode utilisé.

### Activer le classement partagé

Il suffit que le dossier `jeu/api/` soit présent sur un hébergement qui exécute
PHP — ce qui est le cas de la quasi-totalité des hébergements mutualisés. Aucune
base de données : les scores tiennent dans un `scores.json` créé automatiquement
à côté du script. Vérifie simplement que le dossier `api/` est **inscriptible**
par le serveur web.

Pour tester l'endpoint :

```bash
curl 'https://tonsite.fr/jeu/api/scores.php?ping=1'      # → {"ok":true,"version":1}
curl 'https://tonsite.fr/jeu/api/scores.php?top=10'      # → les dix meilleurs
```

Le script valide les envois (bornes de vague, de temps, cohérence
vague/durée), nettoie les pseudos, limite les envois à un toutes les 5 s par IP
et ne conserve que le meilleur score de chaque joueur. **Ce n'est pas
infalsifiable** : le score est calculé par le navigateur, donc quelqu'un de
motivé peut en fabriquer un faux. Les contrôles arrêtent les valeurs absurdes et
le spam, pas une triche déterminée — largement suffisant pour un classement
entre vacanciers, à ne pas confondre avec un classement compétitif.

## Sauvegarde

La progression est stockée en **JSON dans le `localStorage`** du téléphone
(clé `protocole-neon.save.v1`) : cristaux, talents, armes débloquées, quêtes,
records, pseudo et série quotidienne. L'écriture est différée et forcée quand l'application passe
en arrière-plan.

Depuis le menu :

- **⬇ Exporter la sauvegarde** — télécharge un fichier
  `protocole-neon-sauvegarde-AAAA-MM-JJ.json`.
- **⬆ Importer** — recharge un fichier exporté (utile pour changer d'appareil).

Le format est versionné : les sauvegardes anciennes ou incomplètes sont
complétées automatiquement au chargement. Les sauvegardes créées avant l'arbre
de talents sont converties, et les cristaux dépensés dans l'ancien Laboratoire
sont intégralement remboursés.

## Organisation du code

```
jeu/
├── index.html            structure des écrans + HUD
├── api/scores.php        classement partagé (optionnel, PHP)
├── css/style.css         thème néon, mobile-first (safe-area, tactile)
└── js/
    ├── core/
    │   ├── utils.js      espace de noms NF, maths, helpers de dessin
    │   ├── input.js      clavier + joystick virtuel
    │   └── fx.js         particules, textes flottants, secousse de caméra
    ├── data/
    │   ├── biomes.js     secteurs : palette, décor, bestiaire, boss
    │   ├── weapons.js    10 armes (tir, montée en niveau, coût)
    │   ├── upgrades.js   cartes de niveau + tirage pondéré
    │   ├── talents.js    arbre de talents permanent
    │   └── quests.js     quêtes à paliers infinis
    ├── entities/
    │   ├── projectiles.js projectiles, dangers, ramassables, éclairs
    │   ├── player.js      statistiques, dash, ultime, progression
    │   ├── enemies.js     20 types d'ennemis et leurs comportements
    │   └── bosses.js      les 15 boss + cycle des paliers
    ├── systems/
    │   ├── save.js       sauvegarde JSON, export/import
    │   ├── daily.js      récompense quotidienne et série
    │   ├── scores.js     classement (en ligne ou local)
    │   ├── qte.js        séquences d'action rapide (précision, martèlement)
    │   ├── interlude.js  mini-jeux hors arène (défense orbitale, conduit)
    │   └── waves.js      enchaînement et difficulté des vagues
    ├── ui/
    │   ├── hud.js        interface en jeu
    │   └── menus.js      menus, arbre de talents, arsenal, quêtes
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
- **Un talent** : ajoute un nœud dans `js/data/talents.js` (`branch`, `ring`,
  `max`, `cost`, `apply(base, rang)`). Sa position, ses liaisons et le texte de
  son effet sont calculés automatiquement.
- **Un boss** : ajoute un objet au tableau `NF.BOSSES` (`js/entities/bosses.js`)
  avec `init`, `update`, éventuellement `onPhase`, `draw` et `block`, puis cite
  son `id` dans la liste `bosses` d'un secteur.
- **Un secteur** : ajoute une entrée à `NF.BIOMES` (`js/data/biomes.js`) avec sa
  palette, ses coefficients et ses cinq boss, puis déclare la vague d'apparition
  de chaque ennemi pour ce secteur via son champ `mw`. Le découpage des vagues,
  le déblocage et le sélecteur du menu suivent automatiquement.
- **Un QTE dans un boss** : appelle `NF.QTE.start(game, {...})` depuis son
  `update` ou son `onPhase` (`type: 'timing'` ou `'mash'`, `rounds`, `onWin`,
  `onLose`). Le monde se fige tant que la séquence tourne.
- **Une rupture d'écran sur un boss** : dans son `onPhase`, appelle
  `b.queueBreak(BREAK.timing(b, {...}))` — ou `mash`, `conduit`, `invaders`,
  `partition`. Les fabriques `BREAK` (`js/entities/bosses.js`) portent les
  rendements par défaut ; `queueBreak` attend une image libre pour que deux
  mécaniques ne se superposent jamais.
- **Un interlude** : appelle `NF.Interlude.start(game, {...})` (`mode:
  'invaders'`, `'conduit'` ou `'partition'`, `duration`, `hp`, `rush`, `onWin`,
  `onLose`). Le mini-jeu prend la main sur la boucle et sur le rendu, puis rend
  l'arène. La partition accepte en plus `bpm`, `lanes`, `window`, `need`,
  `comboStep`, `maxBonus`, `onHit(game, combo, mult)` et `onMiss(game)`.
