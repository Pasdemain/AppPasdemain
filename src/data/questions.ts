import type { ThemeId } from '@/data/themes';

export type Question = {
  id: string;
  theme: ThemeId;
  prompt: string;
  choices: string[];
  /** Index de la bonne réponse dans `choices`. */
  answer: number;
  explanation: string;
  /**
   * Question de sécurité. À l'examen, une erreur sur ce type de question est
   * éliminatoire, indépendamment du nombre total de fautes.
   */
  critical?: boolean;
};

export const QUESTIONS: Question[] = [
  // ─────────────────────────────── Balisage ───────────────────────────────
  {
    id: 'bal-01',
    theme: 'balisage',
    prompt: 'En région A, quelle est la marque latérale de bâbord ?',
    choices: [
      'Une marque cylindrique rouge',
      'Une marque conique verte',
      'Une marque sphérique jaune',
      'Une marque à bandes rouges et blanches',
    ],
    answer: 0,
    explanation:
      'En région A (Europe, dont la France), le bâbord du chenal est marqué en rouge, avec un voyant cylindrique et un feu rouge. Le tribord est vert et conique.',
  },
  {
    id: 'bal-02',
    theme: 'balisage',
    prompt: 'Vous entrez dans un port en région A. Vous devez laisser la marque verte :',
    choices: [
      'Sur votre tribord',
      'Sur votre bâbord',
      'Indifféremment, la couleur ne concerne que les navires de commerce',
      'Toujours à plus de 100 mètres',
    ],
    answer: 0,
    explanation:
      'Le balisage latéral s’entend dans le sens conventionnel du chenal, c’est-à-dire en entrant au port. La marque verte (conique) se laisse alors sur tribord, la rouge sur bâbord.',
  },
  {
    id: 'bal-03',
    theme: 'balisage',
    prompt: 'Une bouée cardinale Nord se reconnaît à :',
    choices: [
      'Deux cônes noirs superposés, pointes vers le haut, noir au-dessus du jaune',
      'Deux cônes noirs superposés, pointes vers le bas, jaune au-dessus du noir',
      'Deux cônes base à base, bandes noir-jaune-noir',
      'Deux sphères noires superposées',
    ],
    answer: 0,
    explanation:
      'Moyen mnémotechnique : les pointes des cônes indiquent où se trouve la couleur noire. Nord = pointes en haut = noir en haut. Il faut passer au nord de la marque.',
  },
  {
    id: 'bal-04',
    theme: 'balisage',
    prompt: 'Vous identifiez une cardinale Sud. Où devez-vous passer ?',
    choices: [
      'Au sud de la marque',
      'Au nord de la marque',
      'À l’est de la marque',
      'Au plus près de la marque, quel que soit le côté',
    ],
    answer: 0,
    explanation:
      'Une marque cardinale indique le secteur dans lequel les eaux sont saines. Sur une cardinale Sud, le danger est au nord : on passe donc au sud.',
  },
  {
    id: 'bal-05',
    theme: 'balisage',
    prompt: 'Une marque de danger isolé se caractérise par :',
    choices: [
      'Un corps noir à une ou plusieurs bandes rouges et deux sphères noires superposées',
      'Un corps jaune surmonté d’une croix de Saint-André',
      'Des bandes verticales rouges et blanches',
      'Un corps vert surmonté d’un cône',
    ],
    answer: 0,
    explanation:
      'La marque de danger isolé est mouillée sur un danger de faible étendue entouré d’eaux saines. Son feu est blanc à deux éclats groupés — Fl(2).',
  },
  {
    id: 'bal-06',
    theme: 'balisage',
    prompt: 'Une bouée à bandes verticales rouges et blanches surmontée d’un voyant sphérique rouge signale :',
    choices: [
      'Des eaux saines, souvent une atterrissage ou un milieu de chenal',
      'Un danger isolé',
      'Une zone de baignade',
      'Une épave récente',
    ],
    answer: 0,
    explanation:
      'C’est la marque d’eaux saines. On peut la laisser indifféremment d’un bord ou de l’autre. Elle sert fréquemment de point d’atterrissage à l’entrée d’un chenal.',
  },

  // ────────────────────────── Règles de barre ──────────────────────────
  {
    id: 'bar-01',
    theme: 'barre',
    prompt:
      'Deux navires à propulsion mécanique font des routes directement opposées. Que doivent-ils faire ?',
    choices: [
      'Chacun vient sur tribord pour passer bâbord contre bâbord',
      'Chacun vient sur bâbord',
      'Le plus rapide s’écarte, l’autre maintient sa route',
      'Le plus petit s’écarte, l’autre maintient sa route',
    ],
    answer: 0,
    explanation:
      'Règle 14 du RIPAM : en cas de routes directement opposées ou presque, chaque navire vient sur tribord de manière à passer bâbord sur bâbord.',
    critical: true,
  },
  {
    id: 'bar-02',
    theme: 'barre',
    prompt:
      'Vous êtes à la barre d’un bateau à moteur. Un autre bateau à moteur vous arrive sur votre tribord, les routes se croisent. Que faites-vous ?',
    choices: [
      'Vous vous écartez : il est privilégié',
      'Vous maintenez votre cap et votre vitesse : vous êtes privilégié',
      'Vous accélérez pour passer devant lui',
      'Vous venez sur bâbord et lui coupez la route',
    ],
    answer: 0,
    explanation:
      'Règle 15 : le navire qui voit l’autre sur son tribord doit s’écarter et, si les circonstances le permettent, éviter de croiser sa route sur l’avant.',
    critical: true,
  },
  {
    id: 'bar-03',
    theme: 'barre',
    prompt: 'Un navire à propulsion mécanique croise la route d’un voilier qui navigue à la voile. Qui s’écarte ?',
    choices: [
      'Le navire à propulsion mécanique',
      'Le voilier, plus manœuvrant',
      'Le plus petit des deux',
      'Celui qui est sous le vent',
    ],
    answer: 0,
    explanation:
      'Règle 18 : un navire à propulsion mécanique s’écarte de la route d’un voilier. Attention, cela ne vaut plus si le voilier rattrape le navire à moteur : le rattrapant s’écarte toujours.',
    critical: true,
  },
  {
    id: 'bar-04',
    theme: 'barre',
    prompt: 'Vous rattrapez un autre navire. Qui doit manœuvrer ?',
    choices: [
      'Vous, le navire rattrapant, quel que soit son mode de propulsion',
      'Le navire rattrapé, qui doit vous laisser le passage',
      'Aucun des deux, il suffit de passer à plus de 50 mètres',
      'Celui des deux qui est à moteur',
    ],
    answer: 0,
    explanation:
      'Règle 13 : le navire rattrapant s’écarte de la route du navire rattrapé. Cette règle prime sur toutes les autres, y compris moteur contre voile.',
    critical: true,
  },
  {
    id: 'bar-05',
    theme: 'barre',
    prompt: 'Deux voiliers s’approchent en recevant le vent de bords différents. Lequel doit s’écarter ?',
    choices: [
      'Celui qui reçoit le vent de bâbord',
      'Celui qui reçoit le vent de tribord',
      'Celui qui est sous le vent',
      'Celui qui a le plus de toile',
    ],
    answer: 0,
    explanation:
      'Règle 12 : à amures contraires, le voilier bâbord amures s’écarte du voilier tribord amures. À amures identiques, le navire au vent s’écarte du navire sous le vent.',
  },
  {
    id: 'bar-06',
    theme: 'barre',
    prompt: 'Une manœuvre destinée à éviter un abordage doit être :',
    choices: [
      'Franche, exécutée assez tôt et immédiatement perceptible par l’autre navire',
      'Discrète, pour ne pas surprendre l’autre navire',
      'Faite au dernier moment, quand la situation est certaine',
      'Toujours une réduction de vitesse, jamais un changement de cap',
    ],
    answer: 0,
    explanation:
      'Règle 8 : toute manœuvre doit être franche, exécutée largement à temps et clairement visible d’un autre navire, notamment au radar. Une succession de petits changements est à proscrire.',
    critical: true,
  },

  // ─────────────────────────── Feux et marques ───────────────────────────
  {
    id: 'feu-01',
    theme: 'feux',
    prompt: 'De nuit, vous apercevez un feu vert. Que voyez-vous ?',
    choices: [
      'Le côté tribord d’un navire',
      'Le côté bâbord d’un navire',
      'La poupe d’un navire',
      'Un navire au mouillage',
    ],
    answer: 0,
    explanation:
      'Le feu de côté vert est porté à tribord, le rouge à bâbord. Chaque feu de côté couvre un secteur de 112,5°, de l’avant jusqu’à 22,5° sur l’arrière du travers.',
  },
  {
    id: 'feu-02',
    theme: 'feux',
    prompt: 'De nuit, vous voyez simultanément un feu rouge et un feu vert, avec un feu blanc au-dessus. Que se passe-t-il ?',
    choices: [
      'Un navire à propulsion mécanique vient droit sur vous',
      'Un navire s’éloigne de vous',
      'Un navire est au mouillage',
      'Un navire est en train de pêcher',
    ],
    answer: 0,
    explanation:
      'Voir les deux feux de côté en même temps signifie que vous êtes dans l’axe du navire : il fait route vers vous. Situation de routes directement opposées, chacun vient sur tribord.',
    critical: true,
  },
  {
    id: 'feu-03',
    theme: 'feux',
    prompt: 'Un navire au mouillage de moins de 50 mètres montre, de nuit :',
    choices: [
      'Un feu blanc visible sur tout l’horizon',
      'Deux feux rouges superposés',
      'Un feu vert et un feu rouge',
      'Aucun feu, le mouillage étant une situation statique',
    ],
    answer: 0,
    explanation:
      'Au mouillage, le navire montre un feu blanc visible sur tout l’horizon. De jour, il arbore une boule noire à l’avant.',
  },
  {
    id: 'feu-04',
    theme: 'feux',
    prompt: 'De jour, un navire portant une boule noire à l’avant est :',
    choices: [
      'Au mouillage',
      'En train de pêcher',
      'Échoué',
      'Non maître de sa manœuvre',
    ],
    answer: 0,
    explanation:
      'La boule noire signale un navire au mouillage. Un navire échoué montre trois boules noires superposées.',
  },
  {
    id: 'feu-05',
    theme: 'feux',
    prompt: 'Un voilier de moins de 20 mètres faisant route à la voile peut porter :',
    choices: [
      'Un feu tricolore combiné en tête de mât',
      'Un feu blanc de tête de mât en plus de ses feux de côté',
      'Deux feux rouges superposés',
      'Un feu jaune à éclats',
    ],
    answer: 0,
    explanation:
      'Les voiliers de moins de 20 mètres peuvent regrouper feux de côté et feu de poupe dans un feu tricolore unique en tête de mât. Ce feu ne doit pas être utilisé au moteur.',
  },
  {
    id: 'feu-06',
    theme: 'feux',
    prompt: 'De nuit, vous n’apercevez qu’un seul feu blanc, sans feu de côté. Il peut s’agir :',
    choices: [
      'De la poupe d’un navire qui s’éloigne, ou d’un navire au mouillage',
      'D’un navire venant droit sur vous',
      'Obligatoirement d’un phare',
      'D’un navire en détresse',
    ],
    answer: 0,
    explanation:
      'Le feu de poupe est blanc et couvre 135° dans l’axe arrière. Ne voir qu’un feu blanc signifie généralement que le navire s’éloigne — ou qu’il est au mouillage.',
  },

  // ────────────────────────── Signaux sonores ──────────────────────────
  {
    id: 'son-01',
    theme: 'sonores',
    prompt: 'Un navire émet un son bref. Que signifie ce signal ?',
    choices: [
      'Je viens sur tribord',
      'Je viens sur bâbord',
      'Je bats en arrière',
      'Je suis en détresse',
    ],
    answer: 0,
    explanation:
      'Signaux de manœuvre (règle 34) : 1 son bref = « je viens sur tribord », 2 sons brefs = « je viens sur bâbord », 3 sons brefs = « je bats en arrière ».',
  },
  {
    id: 'son-02',
    theme: 'sonores',
    prompt: 'Trois sons brefs signifient :',
    choices: [
      'Je bats en arrière',
      'Je viens sur bâbord',
      'Je suis non maître de ma manœuvre',
      'Je demande l’ouverture d’un pont',
    ],
    answer: 0,
    explanation:
      'Trois sons brefs indiquent que le navire fait fonctionner ses machines en marche arrière. Cela ne veut pas dire qu’il recule déjà sur le fond.',
  },
  {
    id: 'son-03',
    theme: 'sonores',
    prompt: 'Vous entendez au moins cinq sons brefs et rapprochés. Cela signifie :',
    choices: [
      'Un navire doute de vos intentions ou juge la situation dangereuse',
      'Un navire vous salue',
      'Un navire quitte son poste à quai',
      'Un navire signale sa position par brume',
    ],
    answer: 0,
    explanation:
      'C’est le signal d’avertissement de la règle 34(d). Il exprime un doute sur les intentions de l’autre navire ou sur la suffisance de sa manœuvre. Réagissez immédiatement.',
    critical: true,
  },
  {
    id: 'son-04',
    theme: 'sonores',
    prompt:
      'Par visibilité réduite, un navire à propulsion mécanique faisant route sur l’eau émet :',
    choices: [
      'Un son prolongé à intervalles ne dépassant pas deux minutes',
      'Deux sons brefs toutes les minutes',
      'Trois sons prolongés toutes les cinq minutes',
      'Aucun signal, il doit rester silencieux pour écouter',
    ],
    answer: 0,
    explanation:
      'Règle 35 : un navire à propulsion mécanique faisant route émet un son prolongé au maximum toutes les deux minutes. S’il est stoppé et n’a plus d’erre, il émet deux sons prolongés.',
  },
  {
    id: 'son-05',
    theme: 'sonores',
    prompt: 'Par visibilité réduite, quelle est la bonne conduite ?',
    choices: [
      'Naviguer à une vitesse de sécurité adaptée et faire une veille renforcée',
      'Maintenir sa vitesse pour sortir plus vite de la zone de brume',
      'S’arrêter systématiquement au milieu du chenal',
      'Naviguer aux instruments sans veille visuelle',
    ],
    answer: 0,
    explanation:
      'Règles 5, 6 et 19 : veille permanente, vitesse de sécurité, prise en compte de la visibilité, de la densité du trafic et de la manœuvrabilité du navire.',
    critical: true,
  },
  {
    id: 'son-06',
    theme: 'sonores',
    prompt: 'Deux sons brefs signifient :',
    choices: [
      'Je viens sur bâbord',
      'Je viens sur tribord',
      'Je stoppe mes machines',
      'Je demande le passage',
    ],
    answer: 0,
    explanation:
      'Le nombre de sons brefs suit une logique simple : 1 pour tribord, 2 pour bâbord, 3 pour l’arrière.',
  },

  // ──────────────────────────── Sécurité ────────────────────────────
  {
    id: 'sec-01',
    theme: 'securite',
    prompt: 'Combien d’équipements individuels de flottabilité faut-il avoir à bord ?',
    choices: [
      'Un par personne embarquée',
      'Un pour deux personnes embarquées',
      'Deux au total, quel que soit le nombre de personnes',
      'Aucun si l’on navigue à moins d’un mille',
    ],
    answer: 0,
    explanation:
      'La division 240 impose un équipement individuel de flottabilité par personne embarquée, dès l’équipement basique, quel que soit le type de navigation.',
    critical: true,
  },
  {
    id: 'sec-02',
    theme: 'securite',
    prompt: 'Jusqu’à quelle distance d’un abri l’équipement dit « côtier » permet-il de naviguer ?',
    choices: ['6 milles', '2 milles', '12 milles', 'Sans limite'],
    answer: 0,
    explanation:
      'La division 240 définit trois niveaux : basique jusqu’à 2 milles d’un abri, côtier jusqu’à 6 milles, hauturier au-delà. Le permis côtier couvre la navigation jusqu’à 6 milles.',
  },
  {
    id: 'sec-03',
    theme: 'securite',
    prompt: 'Parmi ces éléments, lequel fait partie de l’équipement de sécurité côtier (jusqu’à 6 milles) ?',
    choices: [
      'Trois feux rouges à main',
      'Un radeau de survie',
      'Une balise de détresse par satellite',
      'Un canot de sauvetage rigide',
    ],
    answer: 0,
    explanation:
      'L’équipement côtier ajoute à l’équipement basique : trois feux rouges à main, un compas magnétique, les cartes de la zone, le RIPAM et une VHF fixe.',
  },
  {
    id: 'sec-04',
    theme: 'securite',
    prompt: 'Un équipier tombe à la mer. Quelle est la première chose à faire ?',
    choices: [
      'Crier « un homme à la mer », jeter une bouée et désigner un équipier chargé de ne pas le quitter des yeux',
      'Arrêter immédiatement le moteur et attendre',
      'Sauter à l’eau pour le rejoindre',
      'Appeler le CROSS avant toute autre action',
    ],
    answer: 0,
    explanation:
      'Perdre le contact visuel est le principal risque. On alerte, on jette un objet flottant repérable, on désigne un veilleur, puis on manœuvre pour récupérer. L’alerte VHF vient ensuite si nécessaire.',
    critical: true,
  },
  {
    id: 'sec-05',
    theme: 'securite',
    prompt: 'À quoi sert le dispositif de repérage lumineux individuel ?',
    choices: [
      'À rendre une personne tombée à l’eau repérable, notamment de nuit',
      'À éclairer le pont pendant les manœuvres de nuit',
      'À signaler le navire aux autres bateaux',
      'À remplacer les feux de navigation en cas de panne',
    ],
    answer: 0,
    explanation:
      'C’est un moyen de repérage lumineux individuel, obligatoire dès l’équipement basique. Un homme à la mer sans repérage lumineux est presque introuvable de nuit.',
  },
  {
    id: 'sec-06',
    theme: 'securite',
    prompt: 'Avant d’appareiller, quelle vérification relève de la sécurité élémentaire ?',
    choices: [
      'Consulter la météo et informer une personne à terre de son programme',
      'Vérifier uniquement le niveau de carburant',
      'Contrôler seulement la validité du permis',
      'Rien de particulier pour une sortie de moins d’une heure',
    ],
    answer: 0,
    explanation:
      'Météo, état du matériel de sécurité, carburant, nombre de personnes à bord et information d’un contact à terre : c’est la base de la préparation d’une sortie, même courte.',
    critical: true,
  },

  // ─────────────────────── Météorologie et marées ───────────────────────
  {
    id: 'met-01',
    theme: 'meteo',
    prompt: 'La règle des douzièmes décrit la marée par tranche horaire selon la séquence :',
    choices: [
      '1, 2, 3, 3, 2, 1',
      '1, 1, 2, 2, 3, 3',
      '2, 2, 2, 2, 2, 2',
      '3, 2, 1, 1, 2, 3',
    ],
    answer: 0,
    explanation:
      'La marée monte ou descend lentement en début et en fin de cycle, et rapidement au milieu : 1/12, 2/12, 3/12, 3/12, 2/12, 1/12 du marnage par heure.',
  },
  {
    id: 'met-02',
    theme: 'meteo',
    prompt: 'Qu’appelle-t-on le marnage ?',
    choices: [
      'La différence de hauteur d’eau entre une pleine mer et la basse mer qui suit',
      'La vitesse du courant de marée',
      'La profondeur indiquée sur la carte',
      'La distance entre le rivage et la laisse de basse mer',
    ],
    answer: 0,
    explanation:
      'Le marnage est l’amplitude verticale de la marée. Il varie avec le coefficient : fort en vives-eaux, faible en mortes-eaux.',
  },
  {
    id: 'met-03',
    theme: 'meteo',
    prompt: 'Un coefficient de marée de 95 correspond à :',
    choices: [
      'Une période de vives-eaux',
      'Une période de mortes-eaux',
      'Une marée moyenne',
      'Une absence de marée',
    ],
    answer: 0,
    explanation:
      'Le coefficient va de 20 à 120. Autour de 45 on parle de mortes-eaux, autour de 95 de vives-eaux : marnage important et courants plus forts.',
  },
  {
    id: 'met-04',
    theme: 'meteo',
    prompt: 'Sur l’échelle de Beaufort, la force 7 correspond à :',
    choices: ['Un grand frais', 'Une brise légère', 'Une tempête', 'Un ouragan'],
    answer: 0,
    explanation:
      'Force 7 = grand frais, soit environ 28 à 33 nœuds. C’est le seuil à partir duquel un Bulletin Météorologique Spécial (avis de vent fort) est diffusé.',
  },
  {
    id: 'met-05',
    theme: 'meteo',
    prompt: 'Que signifie l’émission d’un BMS ?',
    choices: [
      'Un Bulletin Météorologique Spécial annonce des conditions dangereuses',
      'Un Bulletin Maritime Standard donne la météo quotidienne',
      'Une balise de mouillage est signalée',
      'Un bateau demande une assistance',
    ],
    answer: 0,
    explanation:
      'Le BMS signale un phénomène dangereux : avis de vent fort à partir de force 7, avis de coup de vent à partir de force 8. Il doit conduire à reconsidérer la sortie.',
    critical: true,
  },
  {
    id: 'met-06',
    theme: 'meteo',
    prompt: 'Combien de temps s’écoule en moyenne entre une pleine mer et la basse mer suivante ?',
    choices: ['Environ 6 h 12', 'Environ 12 h 25', 'Exactement 6 h 00', 'Environ 3 h 00'],
    answer: 0,
    explanation:
      'Un cycle complet de marée semi-diurne dure environ 12 h 25, soit à peu près 6 h 12 entre pleine mer et basse mer. Les heures se décalent d’environ 50 minutes chaque jour.',
  },

  // ───────────────────────────── Radio VHF ─────────────────────────────
  {
    id: 'rad-01',
    theme: 'radio',
    prompt: 'Quel est le canal VHF international de détresse, d’urgence, de sécurité et d’appel ?',
    choices: ['Le canal 16', 'Le canal 6', 'Le canal 9', 'Le canal 72'],
    answer: 0,
    explanation:
      'Le canal 16 (156,800 MHz) est veillé en permanence par les CROSS. Après un appel, on dérive vers un canal de travail pour libérer le 16.',
    critical: true,
  },
  {
    id: 'rad-02',
    theme: 'radio',
    prompt: 'Le message « MAYDAY » correspond à :',
    choices: [
      'Un signal de détresse : danger grave et imminent',
      'Un signal d’urgence sans danger immédiat',
      'Un message de sécurité concernant la navigation',
      'Un appel de routine vers la capitainerie',
    ],
    answer: 0,
    explanation:
      'Trois niveaux : MAYDAY pour la détresse (danger grave et imminent), PAN PAN pour l’urgence, SÉCURITÉ pour les messages de sécurité (météo, navigation).',
    critical: true,
  },
  {
    id: 'rad-03',
    theme: 'radio',
    prompt: 'Le message « PAN PAN » signale :',
    choices: [
      'Une situation d’urgence, sans danger grave et imminent',
      'Une détresse absolue',
      'Un simple appel de courtoisie',
      'Un essai radio',
    ],
    answer: 0,
    explanation:
      'PAN PAN est utilisé lorsque la sécurité du navire ou d’une personne est en cause, mais sans péril immédiat : panne moteur au large, blessure sans gravité vitale.',
  },
  {
    id: 'rad-04',
    theme: 'radio',
    prompt: 'À quoi sert le canal 70 d’une VHF ?',
    choices: [
      'À l’Appel Sélectif Numérique (ASN/DSC), il ne sert pas à la phonie',
      'Aux communications de port',
      'Aux communications entre plaisanciers',
      'Aux bulletins météo',
    ],
    answer: 0,
    explanation:
      'Le canal 70 est réservé à l’ASN. Un appui long sur la touche détresse d’une VHF ASN transmet automatiquement l’identité du navire et, si la VHF est reliée au GPS, sa position.',
  },
  {
    id: 'rad-05',
    theme: 'radio',
    prompt: 'Le numéro MMSI d’un navire comporte :',
    choices: ['9 chiffres', '6 chiffres', '12 chiffres', 'Une lettre et 5 chiffres'],
    answer: 0,
    explanation:
      'Le MMSI (Maritime Mobile Service Identity) est un identifiant à 9 chiffres attribué à la station. Ses trois premiers chiffres indiquent le pays.',
  },
  {
    id: 'rad-06',
    theme: 'radio',
    prompt: 'Que faut-il pour utiliser une VHF marine à bord d’un navire de plaisance ?',
    choices: [
      'Le Certificat Restreint de Radiotéléphoniste (CRR)',
      'Rien, la VHF est libre d’usage',
      'Uniquement le permis côtier',
      'Une licence de radioamateur',
    ],
    answer: 0,
    explanation:
      'L’usage d’une VHF est soumis au CRR. En cas de détresse réelle, toute personne à bord peut évidemment émettre un appel : la règle ne prime jamais sur le secours.',
  },

  // ────────────────── Réglementation et environnement ──────────────────
  {
    id: 'reg-01',
    theme: 'reglementation',
    prompt: 'Dans la bande littorale des 300 mètres, la vitesse est limitée à :',
    choices: ['5 nœuds', '10 nœuds', '15 nœuds', 'Aucune limite'],
    answer: 0,
    explanation:
      'La bande des 300 mètres à partir du rivage est limitée à 5 nœuds. Cette zone concentre baigneurs et plongeurs : le respect de la limite est un enjeu de sécurité.',
    critical: true,
  },
  {
    id: 'reg-02',
    theme: 'reglementation',
    prompt: 'Jusqu’à quelle distance d’un abri le permis côtier autorise-t-il à naviguer ?',
    choices: ['6 milles', '2 milles', '12 milles', 'Sans limite de distance'],
    answer: 0,
    explanation:
      'L’option côtière autorise la conduite des navires de plaisance à moteur jusqu’à 6 milles d’un abri, de jour comme de nuit. Au-delà, il faut l’extension hauturière.',
  },
  {
    id: 'reg-03',
    theme: 'reglementation',
    prompt: 'À partir de quelle puissance le permis est-il obligatoire pour conduire un bateau à moteur ?',
    choices: [
      'Au-delà de 6 CV (4,5 kW)',
      'Au-delà de 2 CV',
      'Au-delà de 20 CV',
      'Le permis est toujours obligatoire, quelle que soit la puissance',
    ],
    answer: 0,
    explanation:
      'En eaux maritimes, la conduite d’un navire de plaisance à moteur d’une puissance supérieure à 6 CV (4,5 kW) exige un titre de conduite.',
  },
  {
    id: 'reg-04',
    theme: 'reglementation',
    prompt: 'Quel est l’âge minimum pour passer le permis plaisance option côtière ?',
    choices: ['16 ans', '14 ans', '18 ans', '21 ans'],
    answer: 0,
    explanation:
      'Le permis plaisance option côtière peut être obtenu à partir de 16 ans.',
  },
  {
    id: 'reg-05',
    theme: 'reglementation',
    prompt: 'Dans un chenal traversier balisé, que devez-vous respecter ?',
    choices: [
      'Une vitesse limitée à 5 nœuds, sans s’y arrêter ni y pratiquer d’activité tractée',
      'Une vitesse libre, le chenal étant réservé aux bateaux',
      'Une priorité absolue sur tous les autres usagers',
      'Un mouillage obligatoire à l’entrée',
    ],
    answer: 0,
    explanation:
      'Le chenal traversier permet de franchir la bande des 300 mètres. Il se parcourt à 5 nœuds maximum, sans stationner, et les engins tractés y sont interdits.',
  },
  {
    id: 'reg-06',
    theme: 'reglementation',
    prompt: 'Concernant les rejets en mer depuis un navire de plaisance :',
    choices: [
      'Le rejet d’hydrocarbures et de déchets est interdit',
      'Le rejet est autorisé au-delà de 3 milles',
      'Seuls les plastiques sont interdits',
      'Le rejet est libre en dehors des zones portuaires',
    ],
    answer: 0,
    explanation:
      'La convention MARPOL et le droit français interdisent le rejet d’hydrocarbures et de déchets. Les eaux de fond de cale et les ordures se débarquent à terre.',
  },

  // ─────────────────── Cartographie et navigation ───────────────────
  {
    id: 'nav-01',
    theme: 'navigation',
    prompt: 'À quelle distance correspond un mille nautique ?',
    choices: ['1 852 mètres', '1 000 mètres', '1 609 mètres', '2 000 mètres'],
    answer: 0,
    explanation:
      'Le mille nautique vaut 1 852 mètres, soit la longueur d’une minute d’arc de méridien. Sur une carte marine, il se lit sur l’échelle des latitudes, en bordure verticale.',
  },
  {
    id: 'nav-02',
    theme: 'navigation',
    prompt: 'Un nœud correspond à :',
    choices: [
      'Un mille nautique par heure',
      'Un kilomètre par heure',
      'Un mille nautique par minute',
      'Un mètre par seconde',
    ],
    answer: 0,
    explanation:
      'Un nœud = 1 mille nautique par heure, soit environ 1,852 km/h. Ne dites jamais « nœuds à l’heure », l’unité contient déjà le temps.',
  },
  {
    id: 'nav-03',
    theme: 'navigation',
    prompt: 'Sur une carte marine, les sondes sont exprimées par rapport :',
    choices: [
      'Au zéro hydrographique, niveau des plus basses mers',
      'Au niveau moyen de la mer',
      'Au niveau de la pleine mer',
      'Au niveau du sol le plus proche',
    ],
    answer: 0,
    explanation:
      'Les sondes donnent la profondeur minimale théorique. La hauteur de marée du moment s’ajoute à la sonde pour obtenir la profondeur réelle — un calcul essentiel avant d’approcher un haut-fond.',
    critical: true,
  },
  {
    id: 'nav-04',
    theme: 'navigation',
    prompt: 'Sur une carte marine, où mesure-t-on les distances ?',
    choices: [
      'Sur l’échelle des latitudes, en bordure verticale de la carte',
      'Sur l’échelle des longitudes, en bordure horizontale',
      'Sur la rose des vents',
      'Sur n’importe quelle règle graduée en centimètres',
    ],
    answer: 0,
    explanation:
      'Une minute de latitude vaut un mille nautique. En projection Mercator, l’échelle des longitudes n’est pas utilisable pour mesurer une distance.',
  },
  {
    id: 'nav-05',
    theme: 'navigation',
    prompt: 'Que représente le cap vrai ?',
    choices: [
      'La direction suivie par le navire par rapport au nord géographique',
      'La direction indiquée par le compas magnétique',
      'La route réellement suivie sur le fond, courant compris',
      'L’angle entre le vent et l’axe du navire',
    ],
    answer: 0,
    explanation:
      'Le cap vrai se rapporte au nord géographique. Le cap compas s’en écarte de la déclinaison magnétique et de la déviation propre au bateau.',
  },
  {
    id: 'nav-06',
    theme: 'navigation',
    prompt: 'Quelle information un GPS ne fournit-il pas directement ?',
    choices: [
      'La profondeur d’eau sous la quille',
      'La position du navire',
      'La vitesse sur le fond',
      'La route suivie sur le fond',
    ],
    answer: 0,
    explanation:
      'Le GPS donne position, vitesse et route sur le fond. La profondeur vient du sondeur, et la sécurité vient du croisement des deux avec la carte.',
  },
];

/** Nombre de questions posées lors d’un examen blanc. */
export const EXAM_LENGTH = 30;

/** Nombre de fautes au-delà duquel l’examen blanc est refusé. */
export const EXAM_MAX_ERRORS = 5;

export function questionsByTheme(theme: ThemeId): Question[] {
  return QUESTIONS.filter((question) => question.theme === theme);
}

export function getQuestion(id: string): Question | undefined {
  return QUESTIONS.find((question) => question.id === id);
}
