import type { ThemeId } from '@/data/themes';

export type LessonSection = {
  heading: string;
  /** Paragraphes de la section. */
  body: string[];
  /** Points à retenir, affichés en encadré. */
  keyPoints?: string[];
};

export type Lesson = {
  /** Une leçon par thème : l'identifiant est celui du thème. */
  id: ThemeId;
  title: string;
  summary: string;
  readingMinutes: number;
  sections: LessonSection[];
};

export const LESSONS: Lesson[] = [
  {
    id: 'balisage',
    title: 'Balisage et signalisation maritime',
    summary:
      'Reconnaître les marques latérales, cardinales et spéciales, et savoir de quel côté passer.',
    readingMinutes: 8,
    sections: [
      {
        heading: 'Le balisage latéral',
        body: [
          'Le balisage latéral borde les chenaux. Il s’interprète toujours dans le sens conventionnel du chenal, c’est-à-dire en venant du large vers le port.',
          'En région A — celle de la France et de l’Europe — le bâbord du chenal est rouge et le tribord est vert. En entrant au port, on laisse donc le rouge à gauche et le vert à droite.',
        ],
        keyPoints: [
          'Bâbord : marque cylindrique rouge, feu rouge.',
          'Tribord : marque conique verte, feu vert.',
          'Le sens de référence est celui de l’entrée au port.',
        ],
      },
      {
        heading: 'Les marques cardinales',
        body: [
          'Une marque cardinale indique le secteur dans lequel les eaux sont saines. Elle porte deux cônes noirs superposés dont l’orientation donne la lecture immédiate.',
          'La règle mnémotechnique tient en une phrase : les pointes des cônes montrent où se trouve la bande noire. Nord, pointes en haut, noir en haut. Sud, pointes en bas, noir en bas. Est, cônes base à base. Ouest, cônes pointe à pointe.',
          'De nuit, le feu est blanc et scintillant. Le nombre d’éclats se lit comme un cadran d’horloge : trois éclats pour l’Est (3 heures), six plus un éclat long pour le Sud (6 heures), neuf pour l’Ouest (9 heures), et un scintillement continu pour le Nord.',
        ],
        keyPoints: [
          'On passe toujours du côté indiqué par la cardinale.',
          'Nord : scintillant continu. Est : Q(3) 5 s. Sud : Q(6) + éclat long 15 s. Ouest : Q(9) 15 s.',
        ],
      },
      {
        heading: 'Les autres marques',
        body: [
          'La marque de danger isolé est noire à bandes rouges horizontales, surmontée de deux sphères noires. Elle est mouillée sur un danger de faible étendue entouré d’eaux saines : on s’en écarte de tous les côtés.',
          'La marque d’eaux saines porte des bandes verticales rouges et blanches et un voyant sphérique rouge. Elle se laisse indifféremment d’un bord ou de l’autre et sert souvent de point d’atterrissage.',
          'La marque spéciale est entièrement jaune, avec une croix de Saint-André. Elle ne signale pas un danger de navigation mais une zone particulière : mouillage organisé, câble, zone de baignade, dispositif de mesure.',
        ],
      },
    ],
  },
  {
    id: 'barre',
    title: 'Règles de barre et de route',
    summary:
      'Le RIPAM : qui doit s’écarter, qui maintient sa route, et comment manœuvrer pour éviter un abordage.',
    readingMinutes: 10,
    sections: [
      {
        heading: 'Deux obligations permanentes',
        body: [
          'Avant toute règle de priorité viennent deux obligations qui ne souffrent aucune exception. La veille, d’abord : visuelle, auditive et par tous les moyens disponibles. La vitesse de sécurité, ensuite : celle qui permet de stopper sur la distance disponible compte tenu de la visibilité, du trafic et de la manœuvrabilité du navire.',
          'Le mot « priorité » n’existe d’ailleurs pas dans le règlement. On parle de navire privilégié, qui maintient son cap et sa vitesse, et de navire non privilégié, qui s’écarte. Le privilège n’autorise jamais l’abordage : si l’autre ne manœuvre pas, il faut agir.',
        ],
      },
      {
        heading: 'Les trois situations de rencontre',
        body: [
          'Routes directement opposées : deux navires à propulsion mécanique se présentent face à face. Chacun vient sur tribord, et ils se croisent bâbord contre bâbord.',
          'Routes qui se croisent : le navire qui voit l’autre sur son tribord s’écarte. Une image utile est celle du carrefour, avec la priorité à droite. Le navire non privilégié évite de couper la route sur l’avant de l’autre.',
          'Rattrapement : un navire est considéré comme rattrapant lorsqu’il approche par un secteur situé à plus de 22,5° sur l’arrière du travers, c’est-à-dire lorsqu’il ne voit que le feu de poupe de nuit. Le rattrapant s’écarte toujours, quel que soit le mode de propulsion des deux navires.',
        ],
        keyPoints: [
          'Face à face : chacun sur tribord.',
          'Routes croisées : celui qui voit l’autre à tribord s’écarte.',
          'Rattrapant : il s’écarte, cette règle prime sur toutes les autres.',
        ],
      },
      {
        heading: 'Hiérarchie entre navires',
        body: [
          'Un navire à propulsion mécanique s’écarte de la route d’un navire non maître de sa manœuvre, d’un navire à capacité de manœuvre restreinte, d’un navire en train de pêcher, puis d’un voilier.',
          'Entre deux voiliers, celui qui reçoit le vent de bâbord s’écarte de celui qui reçoit le vent de tribord. À amures identiques, le navire situé au vent s’écarte du navire sous le vent.',
          'Un voilier qui utilise son moteur, même voiles hissées, est réglementairement un navire à propulsion mécanique et doit en porter les feux et les marques.',
        ],
      },
      {
        heading: 'Manœuvrer correctement',
        body: [
          'Toute manœuvre d’évitement doit être franche, exécutée assez tôt et immédiatement perceptible par l’autre navire. Une succession de petites corrections est dangereuse : elle est illisible de l’extérieur.',
          'Le meilleur indicateur de risque d’abordage est le relèvement constant : si l’autre navire garde le même angle par rapport à votre bateau tout en se rapprochant, la collision est en préparation.',
        ],
        keyPoints: ['Relèvement constant + distance qui diminue = risque d’abordage.'],
      },
    ],
  },
  {
    id: 'feux',
    title: 'Feux, marques et silhouettes',
    summary:
      'Identifier de nuit la nature, la taille et l’aspect d’un navire à partir de ses seuls feux.',
    readingMinutes: 9,
    sections: [
      {
        heading: 'Les feux d’un navire faisant route',
        body: [
          'Un navire à propulsion mécanique faisant route porte un feu de tête de mât blanc, deux feux de côté — rouge à bâbord, vert à tribord — et un feu de poupe blanc.',
          'Chaque feu couvre un secteur précis. Les feux de côté balaient 112,5°, de l’axe avant jusqu’à 22,5° sur l’arrière du travers. Le feu de poupe couvre les 135° restants. L’ensemble forme un cercle complet.',
          'Les navires de plus de 50 mètres portent deux feux de tête de mât, l’arrière plus haut que l’avant. Cet alignement donne une indication précieuse sur leur cap.',
        ],
      },
      {
        heading: 'Lire une situation de nuit',
        body: [
          'Voir un feu vert seul signifie que vous apercevez le côté tribord du navire. Un feu rouge seul, son côté bâbord.',
          'Voir simultanément le rouge et le vert signifie que le navire vient droit sur vous : c’est la situation de routes directement opposées.',
          'Ne voir qu’un feu blanc, sans feu de couleur, correspond soit à un navire qui s’éloigne — vous voyez son feu de poupe — soit à un navire au mouillage.',
        ],
        keyPoints: [
          'Rouge + vert ensemble : il vient sur vous, venez sur tribord.',
          'Blanc seul : il s’éloigne ou il est au mouillage.',
        ],
      },
      {
        heading: 'Voiliers, mouillage et cas particuliers',
        body: [
          'Un voilier de moins de 20 mètres faisant route à la voile peut regrouper ses feux de côté et son feu de poupe dans un feu tricolore unique en tête de mât. Ce feu est interdit dès que le moteur tourne.',
          'Au mouillage, un navire de moins de 50 mètres montre un feu blanc visible sur tout l’horizon. De jour, il arbore une boule noire à l’avant. Un navire échoué montre trois boules noires superposées.',
          'Un navire non maître de sa manœuvre montre deux feux rouges superposés visibles sur tout l’horizon, et de jour deux boules noires.',
        ],
      },
    ],
  },
  {
    id: 'sonores',
    title: 'Signaux sonores et visibilité réduite',
    summary:
      'Annoncer sa manœuvre, exprimer un doute et se signaler dans la brume.',
    readingMinutes: 6,
    sections: [
      {
        heading: 'Les signaux de manœuvre',
        body: [
          'Un son bref dure environ une seconde, un son prolongé de quatre à six secondes. Les signaux de manœuvre s’émettent quand des navires sont en vue les uns des autres.',
          'La logique est facile à retenir : un son bref pour tribord, deux pour bâbord, trois pour la marche arrière.',
        ],
        keyPoints: [
          '1 son bref : je viens sur tribord.',
          '2 sons brefs : je viens sur bâbord.',
          '3 sons brefs : je bats en arrière.',
          '5 sons brefs ou plus : je doute de vos intentions.',
        ],
      },
      {
        heading: 'Le signal d’avertissement',
        body: [
          'Au moins cinq sons brefs et rapprochés expriment un doute sur les intentions de l’autre navire, ou l’estimation que sa manœuvre est insuffisante pour éviter l’abordage.',
          'Recevoir ce signal impose de réagir immédiatement : ralentir, clarifier sa manœuvre, et au besoin stopper.',
        ],
      },
      {
        heading: 'Par visibilité réduite',
        body: [
          'Un navire à propulsion mécanique faisant route émet un son prolongé à intervalles ne dépassant pas deux minutes. S’il est stoppé et n’a plus d’erre, il émet deux sons prolongés séparés d’environ deux secondes.',
          'Un voilier, un navire en train de pêcher ou un navire à capacité de manœuvre restreinte émettent un son prolongé suivi de deux sons brefs.',
          'La brume impose surtout une vitesse de sécurité, une veille renforcée et, si le risque devient trop élevé, la réduction de l’allure au minimum permettant de tenir le cap.',
        ],
      },
    ],
  },
  {
    id: 'securite',
    title: 'Sécurité et matériel d’armement',
    summary:
      'Le matériel obligatoire selon la distance d’un abri et les réflexes qui sauvent.',
    readingMinutes: 8,
    sections: [
      {
        heading: 'Trois niveaux d’armement',
        body: [
          'La division 240 organise le matériel de sécurité selon l’éloignement d’un abri. L’équipement basique couvre la navigation jusqu’à 2 milles, l’équipement côtier jusqu’à 6 milles, l’équipement hauturier au-delà.',
          'L’équipement basique comprend notamment un équipement individuel de flottabilité par personne embarquée, un moyen de repérage lumineux individuel, un dispositif d’assèchement, un moyen de lutte contre l’incendie, une ligne de mouillage et un dispositif de remorquage.',
          'L’équipement côtier y ajoute trois feux rouges à main, un compas magnétique, les cartes de la zone fréquentée, le règlement pour prévenir les abordages en mer et une VHF fixe.',
        ],
        keyPoints: [
          'Un équipement individuel de flottabilité par personne, sans exception.',
          'Côtier = basique + 3 feux rouges à main + compas + cartes + RIPAM + VHF fixe.',
        ],
      },
      {
        heading: 'Préparer la sortie',
        body: [
          'La préparation compte davantage que le matériel. Consulter la météo et les horaires de marée, vérifier le carburant avec une marge, contrôler l’état du matériel de sécurité et sa validité, connaître le nombre de personnes à bord et prévenir un contact à terre du programme et de l’heure de retour prévue.',
        ],
      },
      {
        heading: 'L’homme à la mer',
        body: [
          'Le danger principal n’est pas la chute mais la perte du contact visuel. La séquence est toujours la même : alerter par un « un homme à la mer » clair, jeter immédiatement une bouée ou tout objet flottant repérable, désigner un équipier dont le seul rôle est de garder la personne des yeux et de la pointer du doigt.',
          'On manœuvre ensuite pour revenir, en approchant face au vent et au courant, moteur débrayé à l’approche finale. Si la récupération n’est pas immédiate, on lance un appel de détresse.',
        ],
        keyPoints: ['Alerter, jeter, désigner un veilleur, manœuvrer, récupérer.'],
      },
    ],
  },
  {
    id: 'meteo',
    title: 'Météorologie, marées et courants',
    summary:
      'Lire un bulletin, anticiper le vent, calculer une hauteur d’eau.',
    readingMinutes: 9,
    sections: [
      {
        heading: 'Le vent et les bulletins',
        body: [
          'L’échelle de Beaufort gradue la force du vent de 0 à 12. La force 7, le grand frais, correspond à 28-33 nœuds : c’est le seuil de l’avis de vent fort. La force 8, le coup de vent, déclenche un avis de coup de vent.',
          'Un Bulletin Météorologique Spécial signale un phénomène dangereux. Il est diffusé par les CROSS sur la VHF, après annonce sur le canal 16. Un BMS en cours doit conduire à renoncer à la sortie.',
          'Le vent est toujours donné par la direction d’où il vient. Un vent de secteur ouest souffle depuis l’ouest.',
        ],
      },
      {
        heading: 'Vent contre courant',
        body: [
          'La mer se creuse fortement lorsque le vent s’oppose au courant. Une zone praticable au changement de marée peut devenir dangereuse deux heures plus tard sans que le vent ait forci.',
          'Les brises thermiques côtières sont un autre piège classique : brise de mer l’après-midi, souvent plus forte qu’annoncée près des côtes.',
        ],
      },
      {
        heading: 'La marée',
        body: [
          'Un cycle complet dure environ 12 h 25, soit près de 6 h 12 entre une pleine mer et la basse mer suivante. Les heures se décalent d’environ 50 minutes par jour.',
          'Le coefficient, de 20 à 120, mesure l’amplitude. Autour de 45 on parle de mortes-eaux, autour de 95 de vives-eaux. Plus le coefficient est élevé, plus le marnage et les courants sont importants.',
          'La règle des douzièmes donne une estimation rapide : la marée parcourt 1/12 du marnage la première heure, puis 2/12, 3/12, 3/12, 2/12 et 1/12. L’eau bouge donc le plus vite en milieu de marée.',
        ],
        keyPoints: [
          'Douzièmes : 1, 2, 3, 3, 2, 1.',
          'Profondeur réelle = sonde de la carte + hauteur de marée du moment.',
        ],
      },
    ],
  },
  {
    id: 'radio',
    title: 'Radiotéléphonie VHF et ASN',
    summary:
      'Émettre un appel correct, connaître les trois niveaux d’alerte et utiliser l’appel sélectif numérique.',
    readingMinutes: 7,
    sections: [
      {
        heading: 'Les canaux essentiels',
        body: [
          'Le canal 16 est le canal international de détresse, d’urgence, de sécurité et d’appel. Il est veillé en permanence par les CROSS. Une fois le contact établi, on dérive vers un canal de travail pour le libérer.',
          'Le canal 70 est réservé à l’appel sélectif numérique. Il ne s’utilise jamais en phonie.',
          'L’usage d’une VHF requiert le Certificat Restreint de Radiotéléphoniste. En situation de détresse réelle, cette exigence ne fait évidemment pas obstacle à l’émission d’un appel.',
        ],
      },
      {
        heading: 'Les trois niveaux d’alerte',
        body: [
          'MAYDAY signale une détresse : danger grave et imminent pour le navire ou pour une personne, secours immédiat requis.',
          'PAN PAN signale une urgence : la sécurité est en cause mais le péril n’est pas immédiat — panne moteur au large, blessure sans risque vital.',
          'SÉCURITÉ précède un message de sécurité relatif à la navigation ou à la météorologie.',
        ],
        keyPoints: ['MAYDAY : détresse. PAN PAN : urgence. SÉCURITÉ : information.'],
      },
      {
        heading: 'Composer un message de détresse',
        body: [
          'La structure est fixe et se retient facilement. MAYDAY répété trois fois, le nom du navire répété trois fois, l’indicatif ou le MMSI, puis « ICI ».',
          'Vient ensuite le corps du message : position en latitude et longitude ou relèvement et distance d’un point connu, nature de la détresse, secours demandé, nombre de personnes à bord, description du navire, et « À VOUS ».',
          'Une VHF équipée de l’ASN et reliée à un GPS transmet automatiquement l’identité et la position du navire par un appui long sur la touche de détresse. C’est le geste le plus rapide et le plus fiable — il complète l’appel vocal, il ne le remplace pas.',
        ],
      },
    ],
  },
  {
    id: 'reglementation',
    title: 'Réglementation et environnement',
    summary:
      'Titres de conduite, zones réglementées, vitesse et protection du milieu marin.',
    readingMinutes: 7,
    sections: [
      {
        heading: 'Le titre de conduite',
        body: [
          'En eaux maritimes, la conduite d’un navire de plaisance à moteur d’une puissance supérieure à 6 CV (4,5 kW) exige un titre de conduite. L’option côtière s’obtient à partir de 16 ans.',
          'Elle autorise la navigation jusqu’à 6 milles d’un abri, de jour comme de nuit. Au-delà, l’extension hauturière est nécessaire ; elle ne comporte pas de limite de distance.',
          'L’examen théorique est un QCM de 30 questions. Il est réussi avec 5 fautes au maximum, une erreur sur une question de sécurité étant éliminatoire.',
        ],
        keyPoints: ['Côtier : 6 milles d’un abri, 16 ans, moteur de plus de 6 CV.'],
      },
      {
        heading: 'Zones et vitesses',
        body: [
          'Dans la bande littorale des 300 mètres, la vitesse est limitée à 5 nœuds. Cette zone concentre baigneurs, plongeurs et petites embarcations.',
          'Les zones réservées aux baigneurs sont interdites à la navigation. On les franchit uniquement par un chenal traversier, à 5 nœuds maximum, sans s’y arrêter et sans y pratiquer d’activité tractée.',
          'La plongée sous-marine est signalée par le pavillon Alpha ou un pavillon rouge à bande blanche diagonale : on s’écarte largement et on réduit l’allure.',
        ],
      },
      {
        heading: 'Protéger le milieu',
        body: [
          'Le rejet d’hydrocarbures et de déchets est interdit. Les eaux de fond de cale et les ordures se débarquent à terre, dans les installations portuaires prévues.',
          'Le mouillage sur les herbiers de posidonie est interdit ou strictement encadré en Méditerranée : l’ancre y détruit un écosystème qui met des décennies à se reconstituer. On privilégie les fonds de sable et les mouillages organisés.',
          'L’approche des mammifères marins est réglementée : on ne les poursuit pas, on ne coupe pas leur route, on maintient une vitesse constante et une distance de sécurité.',
        ],
      },
    ],
  },
  {
    id: 'navigation',
    title: 'Cartographie et navigation',
    summary:
      'Lire une carte marine, mesurer une distance, faire un point et utiliser ses instruments.',
    readingMinutes: 8,
    sections: [
      {
        heading: 'Lire une carte marine',
        body: [
          'Les sondes portées sur la carte sont exprimées par rapport au zéro hydrographique, niveau des plus basses mers. La profondeur réelle s’obtient en ajoutant la hauteur de marée du moment à la sonde.',
          'Les distances se mesurent sur l’échelle des latitudes, en bordure verticale de la carte : une minute de latitude vaut un mille nautique. L’échelle des longitudes n’est pas utilisable pour cela.',
          'La rose des vents donne le nord vrai sur son cercle extérieur et le nord magnétique sur son cercle intérieur, accompagné de la déclinaison et de sa variation annuelle.',
        ],
        keyPoints: [
          '1 mille nautique = 1 852 m = 1 minute de latitude.',
          '1 nœud = 1 mille nautique par heure.',
        ],
      },
      {
        heading: 'Caps et routes',
        body: [
          'Le cap vrai se réfère au nord géographique. Le cap magnétique s’en déduit par la déclinaison, propre au lieu et à l’année. Le cap compas ajoute la déviation, propre au bateau et à son cap.',
          'La route sur le fond diffère du cap tenu dès qu’il y a du courant ou de la dérive due au vent. C’est elle qui compte pour éviter un danger.',
        ],
      },
      {
        heading: 'Instruments et bon sens',
        body: [
          'Le GPS donne la position, la vitesse et la route sur le fond. Le sondeur donne la profondeur sous la sonde. Le compas donne le cap. Aucun ne remplace la carte ni la veille visuelle.',
          'La bonne pratique consiste à croiser les sources : une position GPS confirmée par un amer visible, une profondeur cohérente avec la sonde attendue. Une incohérence est un signal d’alerte, pas une curiosité.',
        ],
      },
    ],
  },
];

const BY_ID = new Map(LESSONS.map((lesson) => [lesson.id, lesson]));

export function getLesson(id: string): Lesson | undefined {
  return BY_ID.get(id as ThemeId);
}
