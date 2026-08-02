/* ============================================================
   meta.js — améliorations permanentes du Laboratoire
   Achetées avec des cristaux ◈, conservées entre les parties.
   ============================================================ */
(function (w) {
  'use strict';
  const NF = w.NF;

  /** Coût du niveau `lvl` (0-indexé) */
  const cost = (base, growth) => lvl => Math.round(base * Math.pow(growth, lvl));

  const META = NF.META = [
    { id: 'power', name: 'Noyau de puissance', icon: '💥', max: 25,
      desc: l => `+${(l * 6)} % de dégâts`, step: '+6 % dégâts',
      cost: cost(60, 1.32), apply: (b, l) => b.damage += l * 0.06 },

    { id: 'vitality', name: 'Structure renforcée', icon: '❤️', max: 25,
      desc: l => `+${l * 12} PV max`, step: '+12 PV max',
      cost: cost(55, 1.30), apply: (b, l) => b.maxHp += l * 12 },

    { id: 'rate', name: 'Dissipateur', icon: '🌀', max: 20,
      desc: l => `+${l * 4} % de cadence`, step: '+4 % cadence',
      cost: cost(80, 1.34), apply: (b, l) => b.fireRate += l * 0.04 },

    { id: 'speed', name: 'Exosquelette', icon: '👟', max: 12,
      desc: l => `+${l * 3} % de vitesse`, step: '+3 % vitesse',
      cost: cost(90, 1.35), apply: (b, l) => b.moveSpeed += l * 0.03 },

    { id: 'armor', name: 'Alliage dense', icon: '🛡️', max: 12,
      desc: l => `−${l * 3} % de dégâts subis`, step: '−3 % dégâts subis',
      cost: cost(120, 1.38), apply: (b, l) => b.armor += l * 0.03 },

    { id: 'crit', name: 'Processeur de visée', icon: '🎯', max: 15,
      desc: l => `+${l * 2} % de critique`, step: '+2 % critique',
      cost: cost(110, 1.34), apply: (b, l) => b.crit += l * 0.02 },

    { id: 'regen', name: 'Essaim de nanites', icon: '🩹', max: 12,
      desc: l => `+${(l * 0.3).toFixed(1)} PV/s`, step: '+0,3 PV/s',
      cost: cost(140, 1.36), apply: (b, l) => b.regen += l * 0.3 },

    { id: 'magnet', name: 'Bobine de collecte', icon: '🧲', max: 10,
      desc: l => `+${l * 12} % de rayon de collecte`, step: '+12 % collecte',
      cost: cost(70, 1.3), apply: (b, l) => b.magnet += l * 0.12 },

    { id: 'xp', name: 'Cortex d\'analyse', icon: '📈', max: 12,
      desc: l => `+${l * 6} % d'expérience`, step: '+6 % XP',
      cost: cost(100, 1.33), apply: (b, l) => b.xpGain += l * 0.06 },

    { id: 'dash', name: 'Injecteurs', icon: '💨', max: 10,
      desc: l => `−${l * 5} % de recharge du dash`, step: '−5 % recharge dash',
      cost: cost(130, 1.34), apply: (b, l) => b.dashCd += l * 0.05 },

    { id: 'ult', name: 'Réacteur d\'ultime', icon: '🔋', max: 10,
      desc: l => `+${l * 10} % de charge d'ultime`, step: '+10 % charge ultime',
      cost: cost(150, 1.35), apply: (b, l) => b.ultGain += l * 0.10 },

    { id: 'greed', name: 'Raffineur', icon: '◈', max: 15,
      desc: l => `+${l * 8} % de cristaux gagnés`, step: '+8 % cristaux',
      cost: cost(120, 1.31), apply: (b, l) => b.greed += l * 0.08 },

    { id: 'luck', name: 'Générateur stochastique', icon: '🍀', max: 10,
      desc: l => `+${l * 5} % de chance`, step: '+5 % chance',
      cost: cost(200, 1.38), apply: (b, l) => b.luck += l * 0.05 },

    { id: 'startlvl', name: 'Amorçage', icon: '⏫', max: 5,
      desc: l => `Commence la partie niveau ${1 + l}`, step: '+1 niveau de départ',
      cost: cost(400, 1.6), apply: (b, l) => b.startLevel += l },

    { id: 'slots', name: 'Rack d\'armement', icon: '⚔️', max: 2,
      desc: l => `+${l} emplacement d'arme`, step: '+1 emplacement d\'arme',
      cost: cost(900, 2.4), apply: (b, l) => b.slots += l },

    { id: 'revive', name: 'Sauvegarde persistante', icon: '💾', max: 2,
      desc: l => `${l} résurrection${l > 1 ? 's' : ''} par partie`, step: '+1 résurrection',
      cost: cost(1200, 2.6), apply: (b, l) => b.revives += l }
  ];

  NF.metaById = id => META.find(m => m.id === id);

  /** Statistiques de base + effets du Laboratoire */
  NF.baseStats = function (levels) {
    const b = {
      maxHp: 100, damage: 1, fireRate: 1, moveSpeed: 1,
      armor: 0, crit: 0.05, critMult: 1.8, regen: 0,
      magnet: 1, xpGain: 1, pierce: 0, projSpeed: 1, projSize: 1,
      dashCd: 0, ultGain: 1, greed: 0, luck: 0,
      lifesteal: 0, thorns: 0, slowAura: 0,
      startLevel: 0, slots: 4, revives: 0
    };
    for (const m of META) {
      const l = (levels && levels[m.id]) || 0;
      if (l > 0) m.apply(b, l);
    }
    return b;
  };

})(window);
