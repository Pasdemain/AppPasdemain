/* ============================================================
   talents.js — arbre de talents permanent
   On part du noyau central et on progresse dans la direction de son choix.
   Les points s'achètent avec des cristaux (prix croissant) puis se
   répartissent librement ; ils sont récupérables à tout moment.
   ============================================================ */
(function (w) {
  'use strict';
  const NF = w.NF;

  /* ---------- Géométrie de l'arbre ---------- */
  const CENTER = 380;               // l'arbre est dessiné dans un carré de 760
  const RING_R = [0, 96, 172, 248, 322];
  NF.TREE_SIZE = 760;
  NF.TREE_CENTER = CENTER;

  /* ---------- Branches ---------- */
  const BRANCHES = NF.TALENT_BRANCHES = [
    { id: 'pow', name: 'Puissance', color: '#ff6b4d', angle: -90 },
    { id: 'rate', name: 'Cadence', color: '#3ef2ff', angle: -30 },
    { id: 'surv', name: 'Survie', color: '#9dff4d', angle: 30 },
    { id: 'mob', name: 'Mobilité', color: '#7dd3ff', angle: 90 },
    { id: 'loot', name: 'Butin', color: '#c58bff', angle: 150 },
    { id: 'ars', name: 'Arsenal', color: '#ff3ea5', angle: 210 }
  ];
  const branchById = id => BRANCHES.find(b => b.id === id);

  /* ---------- Nœuds ----------
     cost = points de talent par rang ; max = nombre de rangs         */
  const T = NF.TALENTS = [
    { id: 'core', branch: null, ring: 0, name: 'Noyau', icon: '✦', max: 0, cost: 0,
      step: 'Point de départ de l\'arbre', apply() { } },

    /* ---- Puissance ---- */
    { id: 'pow1', branch: 'pow', ring: 1, name: 'Surcharge', icon: '💥', max: 6, cost: 1,
      step: '+5 % de dégâts', apply: (b, r) => b.damage += r * 0.05 },
    { id: 'pow2', branch: 'pow', ring: 2, name: 'Munitions creuses', icon: '💢', max: 5, cost: 1,
      step: '+8 % de dégâts critiques et +1,5 % de chance de critique',
      apply: (b, r) => { b.critMult += r * 0.08; b.crit += r * 0.015; } },
    { id: 'pow3', branch: 'pow', ring: 3, name: 'Noyau perforant', icon: '➰', max: 3, cost: 2,
      step: '+1 ennemi traversé par projectile', apply: (b, r) => b.pierce += r },
    { id: 'powK', branch: 'pow', ring: 4, name: 'Détonation critique', icon: '☄️', max: 1, cost: 3, key: true,
      step: 'Chaque coup critique déclenche une explosion',
      apply: (b, r) => { if (r) b.critExplode = true; } },

    /* ---- Cadence ---- */
    { id: 'rate1', branch: 'rate', ring: 1, name: 'Dissipateur', icon: '🌀', max: 6, cost: 1,
      step: '+4 % de cadence de tir', apply: (b, r) => b.fireRate += r * 0.04 },
    { id: 'rate2', branch: 'rate', ring: 2, name: 'Accélérateur', icon: '⏩', max: 5, cost: 1,
      step: '+6 % de vitesse et +3 % de taille des projectiles',
      apply: (b, r) => { b.projSpeed += r * 0.06; b.projSize += r * 0.03; } },
    { id: 'rate3', branch: 'rate', ring: 3, name: 'Chargeur étendu', icon: '🧊', max: 4, cost: 2,
      step: '+3 % de cadence de tir', apply: (b, r) => b.fireRate += r * 0.03 },
    { id: 'rateK', branch: 'rate', ring: 4, name: 'Surcadence', icon: '⚡', max: 1, cost: 3, key: true,
      step: '+18 % de cadence de tir', apply: (b, r) => b.fireRate += r * 0.18 },

    /* ---- Survie ---- */
    { id: 'surv1', branch: 'surv', ring: 1, name: 'Structure renforcée', icon: '❤️', max: 6, cost: 1,
      step: '+10 PV max', apply: (b, r) => b.maxHp += r * 10 },
    { id: 'surv2', branch: 'surv', ring: 2, name: 'Alliage dense', icon: '🛡️', max: 5, cost: 1,
      step: '−2,5 % de dégâts subis', apply: (b, r) => b.armor += r * 0.025 },
    { id: 'surv3', branch: 'surv', ring: 3, name: 'Essaim de nanites', icon: '🩹', max: 4, cost: 2,
      step: '+0,35 PV régénéré par seconde', apply: (b, r) => b.regen += r * 0.35 },
    { id: 'survK', branch: 'surv', ring: 4, name: 'Seconde peau', icon: '🔵', max: 1, cost: 3, key: true,
      step: 'Un bouclier absorbe un coup toutes les 12 s',
      apply: (b, r) => { b.shieldCd += r; } },

    /* ---- Mobilité ---- */
    { id: 'mob1', branch: 'mob', ring: 1, name: 'Exosquelette', icon: '👟', max: 6, cost: 1,
      step: '+3 % de vitesse de déplacement', apply: (b, r) => b.moveSpeed += r * 0.03 },
    { id: 'mob2', branch: 'mob', ring: 2, name: 'Injecteurs', icon: '💨', max: 5, cost: 1,
      step: '−4 % de recharge du dash', apply: (b, r) => b.dashCd += r * 0.04 },
    { id: 'mob3', branch: 'mob', ring: 3, name: 'Champ entropique', icon: '🕸️', max: 3, cost: 2,
      step: 'Ralentit de 6 % les ennemis proches', apply: (b, r) => b.slowAura += r * 0.06 },
    { id: 'mobK', branch: 'mob', ring: 4, name: 'Dash de phase', icon: '🌀', max: 1, cost: 3, key: true,
      step: 'Le dash traverse les ennemis et les blesse au passage',
      apply: (b, r) => { if (r) b.dashPhase = true; } },

    /* ---- Butin ---- */
    { id: 'loot1', branch: 'loot', ring: 1, name: 'Raffineur', icon: '◈', max: 6, cost: 1,
      step: '+6 % de cristaux gagnés', apply: (b, r) => b.greed += r * 0.06 },
    { id: 'loot2', branch: 'loot', ring: 2, name: 'Bobine de collecte', icon: '🧲', max: 5, cost: 1,
      step: '+10 % de rayon de collecte', apply: (b, r) => b.magnet += r * 0.10 },
    { id: 'loot3', branch: 'loot', ring: 3, name: 'Cortex d\'analyse', icon: '📈', max: 4, cost: 2,
      step: '+5 % d\'expérience gagnée', apply: (b, r) => b.xpGain += r * 0.05 },
    { id: 'lootK', branch: 'loot', ring: 4, name: 'Amorçage', icon: '⏫', max: 1, cost: 3, key: true,
      step: 'Chaque partie démarre avec 2 niveaux d\'avance',
      apply: (b, r) => { b.startLevel += r * 2; } },

    /* ---- Arsenal ---- */
    { id: 'ars1', branch: 'ars', ring: 1, name: 'Condensateur', icon: '🔋', max: 6, cost: 1,
      step: '+8 % de charge d\'ultime', apply: (b, r) => b.ultGain += r * 0.08 },
    { id: 'ars2', branch: 'ars', ring: 2, name: 'Générateur stochastique', icon: '🍀', max: 5, cost: 1,
      step: '+3 % de chance', apply: (b, r) => b.luck += r * 0.03 },
    { id: 'ars3', branch: 'ars', ring: 3, name: 'Sauvegarde persistante', icon: '💾', max: 2, cost: 2,
      step: '+1 résurrection par partie', apply: (b, r) => b.revives += r },
    { id: 'arsK', branch: 'ars', ring: 4, name: 'Rack d\'armement', icon: '⚔️', max: 1, cost: 3, key: true,
      step: '+1 emplacement d\'arme', apply: (b, r) => b.slots += r }
  ];

  NF.talentById = id => T.find(t => t.id === id);

  /* ---------- Position à l'écran ---------- */
  for (const t of T) {
    if (!t.branch) { t.x = CENTER; t.y = CENTER; t.color = '#e8f4ff'; continue; }
    const br = branchById(t.branch);
    const a = br.angle * Math.PI / 180;
    t.x = CENTER + Math.cos(a) * RING_R[t.ring];
    t.y = CENTER + Math.sin(a) * RING_R[t.ring];
    t.color = br.color;
    t.branchName = br.name;
  }

  /* ---------- Liaisons ----------
     Chaque branche part du noyau ; les anneaux 2 sont reliés entre
     branches voisines, ce qui permet de passer de l'une à l'autre. */
  const LINKS = NF.TALENT_LINKS = [];
  for (const br of BRANCHES) {
    LINKS.push(['core', br.id + '1']);
    LINKS.push([br.id + '1', br.id + '2']);
    LINKS.push([br.id + '2', br.id + '3']);
    LINKS.push([br.id + '3', br.id + 'K']);
  }
  for (let i = 0; i < BRANCHES.length; i++) {
    const a = BRANCHES[i], b = BRANCHES[(i + 1) % BRANCHES.length];
    LINKS.push([a.id + '2', b.id + '2']);
  }

  /* Table d'adjacence */
  const ADJ = Object.create(null);
  for (const [a, b] of LINKS) {
    (ADJ[a] || (ADJ[a] = [])).push(b);
    (ADJ[b] || (ADJ[b] = [])).push(a);
  }
  NF.talentNeighbours = id => ADJ[id] || [];

  /** Un nœud est accessible s'il touche le noyau ou un nœud déjà investi. */
  NF.talentUnlocked = function (id, talents) {
    if (id === 'core') return true;
    for (const n of NF.talentNeighbours(id)) {
      if (n === 'core') return true;
      if ((talents[n] || 0) > 0) return true;
    }
    return false;
  };

  /** Points dépensés dans l'arbre */
  NF.talentSpent = function (talents) {
    let n = 0;
    for (const id in talents) {
      const t = NF.talentById(id);
      if (t) n += t.cost * talents[id];
    }
    return n;
  };

  /** Prix en cristaux du point de talent numéro `owned` (0-indexé) */
  NF.talentPointCost = function (owned) {
    return Math.round(70 * Math.pow(1.09, owned) / 5) * 5;
  };

  /* ============================================================
     Statistiques de base + effets de l'arbre
     ============================================================ */
  NF.baseStats = function (talents) {
    const b = {
      maxHp: 100, damage: 1, fireRate: 1, moveSpeed: 1,
      armor: 0, crit: 0.05, critMult: 1.8, regen: 0,
      magnet: 1, xpGain: 1, pierce: 0, projSpeed: 1, projSize: 1,
      dashCd: 0, ultGain: 1, greed: 0, luck: 0,
      lifesteal: 0, thorns: 0, slowAura: 0, shieldCd: 0,
      startLevel: 0, slots: 4, revives: 0,
      critExplode: false, dashPhase: false
    };
    if (talents) {
      for (const t of T) {
        const r = talents[t.id] || 0;
        if (r > 0) t.apply(b, r);
      }
    }
    return b;
  };

})(window);
