/* ============================================================
   upgrades.js — cartes d'amélioration (roguelite, valables 1 partie)
   + tirage des 3 choix proposés à chaque niveau
   ============================================================ */
(function (w) {
  'use strict';
  const NF = w.NF, U = NF.U, C = NF.C;

  /* rarity : common (w=100) | rare (w=45) | epic (w=16) */
  const UP = NF.UPGRADES = [
    { id: 'dmg', name: 'Surcharge', icon: '💥', rar: 'common', w: 230, max: 99,
      desc: '+20 % de dégâts', apply: p => p.mods.damage += 0.20 },

    { id: 'rate', name: 'Refroidissement', icon: '🌀', rar: 'common', w: 180, max: 99,
      desc: '+15 % de cadence de tir', apply: p => p.mods.fireRate += 0.15 },

    { id: 'speed', name: 'Servomoteurs', icon: '👟', rar: 'common', w: 90, max: 12,
      desc: '+8 % de vitesse de déplacement', apply: p => p.mods.moveSpeed += 0.08 },

    { id: 'hp', name: 'Blindage réactif', icon: '❤️', rar: 'common', w: 90, max: 99,
      desc: '+22 PV max (et soigne d\'autant)', apply: p => { p.mods.maxHp += 22; p.hp += 22; } },

    { id: 'regen', name: 'Nanites', icon: '🩹', rar: 'rare', w: 45, max: 10,
      desc: '+0,7 PV régénéré par seconde', apply: p => p.mods.regen += 0.7 },

    { id: 'armor', name: 'Plaque ablative', icon: '🛡️', rar: 'rare', w: 45, max: 10,
      desc: '−7 % de dégâts subis', apply: p => p.mods.armor += 0.07 },

    { id: 'crit', name: 'Ciblage précis', icon: '🎯', rar: 'rare', w: 50, max: 20,
      desc: '+7 % de chance de critique', apply: p => p.mods.crit += 0.07 },

    { id: 'critdmg', name: 'Munitions creuses', icon: '💢', rar: 'rare', w: 40, max: 20,
      desc: '+35 % de dégâts critiques', apply: p => p.mods.critMult += 0.35 },

    { id: 'magnet', name: 'Champ magnétique', icon: '🧲', rar: 'common', w: 70, max: 8,
      desc: '+45 % de rayon de collecte', apply: p => p.mods.magnet += 0.45 },

    { id: 'xp', name: 'Analyseur', icon: '📈', rar: 'rare', w: 45, max: 8,
      desc: '+18 % d\'expérience gagnée', apply: p => p.mods.xpGain += 0.18 },

    { id: 'pierce', name: 'Noyau perforant', icon: '➰', rar: 'epic', w: 16, max: 4,
      desc: 'Les projectiles traversent 1 ennemi de plus', apply: p => p.mods.pierce += 1 },

    { id: 'projspd', name: 'Accélérateur', icon: '⏩', rar: 'common', w: 70, max: 8,
      desc: '+18 % de vitesse des projectiles', apply: p => p.mods.projSpeed += 0.18 },

    { id: 'projsize', name: 'Amplificateur', icon: '⭕', rar: 'rare', w: 40, max: 6,
      desc: '+16 % de taille des projectiles', apply: p => p.mods.projSize += 0.16 },

    { id: 'dash', name: 'Propulseurs', icon: '💨', rar: 'rare', w: 42, max: 6,
      desc: '−16 % de recharge du dash', apply: p => p.mods.dashCd += 0.16 },

    { id: 'ult', name: 'Condensateur', icon: '🔋', rar: 'rare', w: 42, max: 8,
      desc: '+25 % de charge d\'ultime par élimination', apply: p => p.mods.ultGain += 0.25 },

    { id: 'lifesteal', name: 'Siphon vital', icon: '🧛', rar: 'epic', w: 16, max: 6,
      desc: '+1,2 % des dégâts convertis en soin', apply: p => p.mods.lifesteal += 0.012 },

    { id: 'thorns', name: 'Champ de riposte', icon: '⚡', rar: 'epic', w: 16, max: 5,
      desc: 'Inflige des dégâts aux ennemis qui te touchent', apply: p => p.mods.thorns += 26 },

    { id: 'luck', name: 'Algorithme chanceux', icon: '🍀', rar: 'epic', w: 18, max: 5,
      desc: '+12 % de chance (meilleures cartes, plus de butin)', apply: p => p.mods.luck += 0.12 },

    { id: 'revive', name: 'Sauvegarde d\'urgence', icon: '💾', rar: 'epic', w: 10, max: 3,
      desc: 'Ressuscite une fois avec 50 % des PV', apply: p => p.revives += 1 },

    { id: 'shield', name: 'Bouclier cyclique', icon: '🔵', rar: 'epic', w: 15, max: 5,
      desc: 'Absorbe un coup toutes les 12 s', apply: p => { p.mods.shieldCd = (p.mods.shieldCd || 0) + 1; } },

    { id: 'greed', name: 'Prospecteur', icon: '◈', rar: 'rare', w: 35, max: 6,
      desc: '+20 % de cristaux gagnés en fin de partie', apply: p => p.mods.greed += 0.20 },

    { id: 'slowaura', name: 'Champ entropique', icon: '🕸️', rar: 'epic', w: 14, max: 3,
      desc: 'Ralentit les ennemis proches de 15 %', apply: p => p.mods.slowAura += 0.15 }
  ];

  NF.upgradeById = id => UP.find(u => u.id === id);

  /* ============================================================
     Tirage des cartes de montée de niveau
     Mélange : nouvelle arme / amélioration d'arme / statistique
     ============================================================ */
  NF.rollCards = function (game, count) {
    const p = game.player;
    const pool = [];
    const luck = p.stats.luck;

    /* --- 1. Nouvelles armes (débloquées et non équipées) --- */
    if (p.weapons.length < p.maxWeapons) {
      for (const wd of NF.WEAPONS) {
        if (p.weapons.some(x => x.id === wd.id)) continue;
        if (!NF.Save.isWeaponUnlocked(wd.id)) continue;
        pool.push({
          kind: 'weapon', rar: 'weapon', w: 190,
          id: wd.id, icon: wd.icon, name: wd.name,
          desc: wd.desc, tag: 'Nouvelle arme',
          take: () => game.addWeapon(wd.id)
        });
      }
    }

    /* --- 2. Améliorations d'armes possédées --- */
    for (const inst of p.weapons) {
      const wd = NF.weaponById(inst.id);
      if (!wd || inst.lvl >= (wd.maxLevel || 8)) continue;
      pool.push({
        kind: 'wlevel', rar: 'rare', w: 170,
        id: inst.id, icon: wd.icon, name: wd.name + ' ' + romanize(inst.lvl + 1),
        desc: wd.lvlDesc(inst.lvl + 1), tag: 'Amélioration d\'arme',
        take: () => { inst.lvl++; game.toast(wd.name + ' niveau ' + (inst.lvl), 'good'); }
      });
    }

    /* --- 3. Statistiques --- */
    for (const u of UP) {
      const stacks = p.taken[u.id] || 0;
      if (stacks >= u.max) continue;
      let weight = u.w;
      if (u.rar === 'epic') weight *= (1 + luck * 1.6);
      else if (u.rar === 'rare') weight *= (1 + luck * 0.6);
      pool.push({
        kind: 'stat', rar: u.rar, w: weight,
        id: u.id, icon: u.icon, name: u.name,
        desc: u.desc + (stacks ? `  (${stacks})` : ''),
        tag: u.rar === 'epic' ? 'Épique' : (u.rar === 'rare' ? 'Rare' : 'Commun'),
        take: () => { u.apply(p); p.taken[u.id] = stacks + 1; game.player.recompute(); }
      });
    }

    /* --- Tirage sans doublon --- */
    const out = [];
    const used = new Set();
    let guard = 0;
    while (out.length < count && pool.length && guard++ < 200) {
      const pick = U.weighted(pool.filter(c => !used.has(c.kind + c.id)));
      if (!pick) break;
      used.add(pick.kind + pick.id);
      out.push(pick);
    }

    /* Filet de sécurité : toujours proposer quelque chose */
    if (!out.length) {
      out.push({
        kind: 'stat', rar: 'common', id: 'heal', icon: '❤️', name: 'Réparation',
        desc: 'Restaure 40 % des PV', tag: 'Secours',
        take: () => { p.hp = Math.min(p.stats.maxHp, p.hp + p.stats.maxHp * 0.4); }
      });
    }
    return out;
  };

  function romanize(n) {
    return ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][n] || ('' + n);
  }
  NF.romanize = romanize;

})(window);
