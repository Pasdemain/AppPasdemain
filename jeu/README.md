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

- **Une partie = un secteur de 50 vagues**, terminé par un écran de victoire.
  Chaque secteur a son décor, son bestiaire et ses cinq boss ; le nettoyer
  débloque le suivant, qu'on choisit ensuite au menu.
- **Progression sans fin.** La difficulté suit une courbe polynomiale et les
  secteurs reprennent en paliers supérieurs une fois la liste épuisée.
- **Un boss toutes les 10 vagues**, avec une mécanique propre à chacun. Passé le
  dernier secteur, le cycle reprend au palier supérieur (Mk II, Mk III…).
- **Montée de niveau** : à chaque niveau, 3 cartes au choix (nouvelle arme,
  amélioration d'arme, statistique) + une relance offerte tous les 5 niveaux.
- **Cristaux ◈** gagnés en fin de partie → arbre de talents (bonus permanents)
  et Arsenal (déblocage d'armes).
- **Quêtes** à paliers infinis : chaque récompense réclamée relance un objectif
  plus ambitieux.
- **Récompense quotidienne** : un cycle de 7 jours, une série à entretenir.
- **Classement** : pseudo au choix, tri sur la vague atteinte puis sur le temps.

## Secteurs

Un secteur = **50 vagues + 5 boss**, et **une partie couvre exactement un
secteur**. Nettoyer la 50ᵉ vague termine la partie sur un **écran de victoire**
assorti d'une prime de cristaux : le jeu n'enchaîne pas sur le secteur suivant.

Cette victoire débloque définitivement le secteur d'après. On choisit ensuite
au menu celui dans lequel on veut lancer sa partie — les secteurs déjà nettoyés
restent rejouables. Au-delà du dernier secteur listé, le cycle reprend au palier
supérieur (mêmes boss en Mk II, coefficients relevés), donc la progression
n'a pas de fin.

| Secteur | Vagues | Décor | Particularités |
|---|---|---|---|
| **▦ La Grille** | 1 – 50 | réseau cyan, sol quadrillé | bestiaire de base |
| **⟁ La Faille** | 51 – 100 | violet, fractures pulsantes | éruptions du sol toutes les ~11 s, 5 ennemis inédits, +35 % de PV et +25 % de dégâts |

**Le secteur est le palier de difficulté.** On repart toujours du niveau 1 :
la courbe de difficulté est identique dans chaque secteur (elle suit la vague
*locale*, de 1 à 50), seul un multiplicateur global change — ×1,9 en vie et
×1,3 en dégâts par secteur franchi. Une partie est donc toujours le même arc,
et c'est l'arbre de talents qui permet d'encaisser le palier suivant.

Le compteur du HUD affiche la progression dans le secteur (`VAGUE 37 / 50`).

### Ennemis propres à La Faille

| Ennemi | Comportement |
|---|---|
| **Spectre** | Se dématérialise, devient inciblable, et réapparaît sur toi. |
| **Couveuse** | Reste à distance et lâche des nuées en continu. |
| **Gardien** | Bouclier qui absorbe une part des dégâts et se reforme après 4 s. |
| **Sangsue** | Dévore tes éclats d'XP au sol — elle les relâche en mourant. |
| **Faucheur** | Tourne autour de toi, tire en rafales, puis traverse en ligne droite. |

## Les dix boss

### Secteur 1 — La Grille

| Vague | Boss | Mécanique |
|---|---|---|
| 10 | **NEXUS-01 « Prisme »** | Invulnérable tant que ses 4 nœuds orbitaux vivent. Les détruire ouvre une fenêtre de 9 s ; ils se reforment ensuite. Balaie l'arène de lasers rotatifs. |
| 20 | **VORTEX-02 « Cyclone »** | Aspire le joueur en continu, tire des spirales de projectiles et projette des anneaux de compression qu'il faut traverser par l'intérieur. |
| 30 | **HYDRE-03 « Réplicant »** | Se dédouble en leurres identiques et échange sa place avec eux. Seule la copie dont le cœur brille encaisse les dégâts. |
| 40 | **BASTION-04 « Égide »** | Bouclier frontal en arc qui pivote vers le joueur : il faut le contourner et frapper dans le dos. Déploie des tourelles et charge. |
| 50 | **OMEGA-05 « Architecte »** | Grille laser alimentée par des piliers (chaque pilier détruit le blesse) et reconfiguration du secteur : trois quadrants sur quatre deviennent mortels. |

### Secteur 2 — La Faille

| Vague | Boss | Mécanique |
|---|---|---|
| 60 | **SYNTHÈSE-06 « Chimère »** | Rejoue une défense différente à chaque phase : nœuds, puis bouclier frontal, puis leurres. La règle change sous toi. |
| 70 | **ORACLE-07 « Prédicteur »** | Frappe ta position **anticipée**, pas ta position actuelle : il faut changer de cap après le marquage. Mine aussi le chemin que tu viens de parcourir. |
| 80 | **ESSAIM-08 « Ruche »** | Coque scellée tant qu'une couveuse vit. Chaque couveuse détruite lui arrache 15 % de sa coque, mais elles crachent des nuées en continu et se reforment. |
| 90 | **PARADOXE-09 « Miroir »** | Inverse tes commandes par cycles annoncés — et pendant l'inversion il encaisse le **double** de dégâts. C'est ta fenêtre de burst. |
| 100 | **ABYSSE-10 « Dévoreuse »** | Invoque des sbires puis les **avale pour se soigner** de 3 % chacun : il faut les tuer avant. Aspire en permanence et referme l'arène par un anneau. |

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
    │   ├── enemies.js     17 types d'ennemis et leurs comportements
    │   └── bosses.js      les 5 archétypes de boss + cycle des paliers
    ├── systems/
    │   ├── save.js       sauvegarde JSON, export/import
    │   ├── daily.js      récompense quotidienne et série
    │   ├── scores.js     classement (en ligne ou local)
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
