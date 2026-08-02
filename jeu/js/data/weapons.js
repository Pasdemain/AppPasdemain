/* ============================================================
   weapons.js — catalogue d'armes
   Chaque arme : coût de déblocage, montée en niveau, fonction de tir.
   Le tir est automatique et vise l'ennemi le plus proche.
   ============================================================ */
(function (w) {
  'use strict';
  const NF = w.NF, U = NF.U, C = NF.C, FX = NF.FX;

  const MAXLVL = 8;

  /** Angle vers la cible, ou direction de déplacement à défaut */
  function aim(game, p, range) {
    const t = game.nearestEnemy(p.x, p.y, range || 900);
    if (t) return { a: U.angle(p.x, p.y, t.x, t.y), t };
    return { a: p.facing, t: null };
  }

  /** Dégâts finaux d'une arme (échelle de niveau × stats joueur) */
  function dmgOf(base, lvl, p) {
    return base * (1 + 0.40 * (lvl - 1)) * p.stats.damage;
  }

  function cdOf(base, p) {
    return base / p.stats.fireRate;
  }

  const WEAPONS = NF.WEAPONS = [

    /* ---------------- 1. Blaster ---------------- */
    {
      id: 'blaster', name: 'Blaster Mk-I', icon: '🔹', color: C.cyan, cost: 0, start: true,
      desc: 'Tir rapide de projectiles énergétiques. Fiable, sans surprise.',
      lvlDesc: l => l === 1 ? 'Arme de départ' : (l % 3 === 0 ? '+1 projectile' : '+40 % dégâts'),
      maxLevel: MAXLVL,
      fire(game, p, inst) {
        const { a } = aim(game, p);
        const n = 1 + Math.floor(inst.lvl / 3);
        const spread = n > 1 ? 0.13 : 0;
        for (let i = 0; i < n; i++) {
          const off = (i - (n - 1) / 2) * spread;
          game.shoot(new NF.Bullet({
            x: p.x, y: p.y, angle: a + off + U.rand(-.03, .03),
            speed: 700 * p.stats.projSpeed,
            r: 5 * p.stats.projSize,
            dmg: game.roll(dmgOf(11, inst.lvl, p), p),
            color: C.cyan, pierce: p.stats.pierce, owner: 'blaster',
            knock: 40
          }));
        }
        inst.t = cdOf(0.30, p);
        FX.burst(p.x + Math.cos(a) * 16, p.y + Math.sin(a) * 16, 2, C.cyan, { speed: 90, life: .15, size: 2, dir: a, spread: .8 });
      }
    },

    /* ---------------- 2. Fusil plasma ---------------- */
    {
      id: 'plasma', name: 'Fusil Plasma', icon: '🔺', color: '#ff8a3e', cost: 0, start: true,
      desc: 'Gerbe d\'éclats à courte portée. Dévastateur au contact.',
      lvlDesc: l => l % 2 === 0 ? '+1 éclat' : '+40 % dégâts',
      maxLevel: MAXLVL,
      fire(game, p, inst) {
        const { a } = aim(game, p, 520);
        const n = 4 + Math.floor(inst.lvl / 2);
        for (let i = 0; i < n; i++) {
          const off = (i - (n - 1) / 2) * 0.15 + U.rand(-.05, .05);
          game.shoot(new NF.Bullet({
            x: p.x, y: p.y, angle: a + off,
            speed: U.rand(520, 660) * p.stats.projSpeed,
            r: 4.5 * p.stats.projSize, life: .55,
            dmg: game.roll(dmgOf(8, inst.lvl, p), p),
            color: '#ff8a3e', shape: 'shard',
            pierce: p.stats.pierce, owner: 'plasma', knock: 90
          }));
        }
        inst.t = cdOf(0.78, p);
        FX.kick(2.5);
      }
    },

    /* ---------------- 3. Faisceau laser ---------------- */
    {
      id: 'laser', name: 'Faisceau Sigma', icon: '⚡', color: C.magenta, cost: 300,
      desc: 'Rayon continu qui transperce toute la ligne d\'ennemis.',
      lvlDesc: l => l % 3 === 0 ? '+durée du faisceau' : '+40 % dégâts',
      maxLevel: MAXLVL,
      fire(game, p, inst) {
        const { a } = aim(game, p, 1000);
        game.playerBeams.push({
          x: p.x, y: p.y, angle: a, len: 900,
          width: 12 + inst.lvl * 1.6,
          dmg: game.roll(dmgOf(7, inst.lvl, p), p),
          life: 0.42 + Math.floor(inst.lvl / 3) * 0.12, t: 0,
          tickRate: 0.1, tick: 0, color: C.magenta,
          follow: true, owner: 'laser'
        });
        inst.t = cdOf(1.25, p);
      }
    },

    /* ---------------- 4. Missiles ---------------- */
    {
      id: 'missile', name: 'Nuée Traçante', icon: '🚀', color: C.amber, cost: 450,
      desc: 'Missiles à tête chercheuse qui explosent à l\'impact.',
      lvlDesc: l => l % 2 === 0 ? '+1 missile' : '+40 % dégâts / rayon',
      maxLevel: MAXLVL,
      fire(game, p, inst) {
        const { a } = aim(game, p, 900);
        const n = 2 + Math.floor(inst.lvl / 2);
        for (let i = 0; i < n; i++) {
          game.shoot(new NF.Bullet({
            x: p.x, y: p.y, angle: a + U.rand(-.9, .9),
            speed: 340 * p.stats.projSpeed, r: 5, life: 2.6,
            dmg: game.roll(dmgOf(14, inst.lvl, p), p),
            color: C.amber, shape: 'missile', homing: 4.4,
            explode: 62 + inst.lvl * 4, explodeDmg: dmgOf(9, inst.lvl, p),
            owner: 'missile'
          }));
        }
        inst.t = cdOf(1.5, p);
      }
    },

    /* ---------------- 5. Orbes gravitiques ---------------- */
    {
      id: 'orbit', name: 'Orbes Gravitiques', icon: '🛸', color: C.violet, cost: 0, start: true,
      desc: 'Des sphères tournent autour de toi et broient ce qu\'elles touchent.',
      lvlDesc: l => l % 2 === 0 ? '+1 orbe' : '+40 % dégâts',
      maxLevel: MAXLVL,
      passive: true,
      fire() { /* géré en continu */ },
      tick(game, p, inst, dt) {
        const n = 2 + Math.floor(inst.lvl / 2);
        inst.phase = (inst.phase || 0) + dt * (2.0 + inst.lvl * 0.1);
        inst.orbs = inst.orbs || [];
        inst.orbs.length = n;
        const rad = 86 + inst.lvl * 3;
        const dmg = dmgOf(10, inst.lvl, p) * dt * 5.5;   // dégâts continus
        for (let i = 0; i < n; i++) {
          const a = inst.phase + i * U.TAU / n;
          const ox = p.x + Math.cos(a) * rad, oy = p.y + Math.sin(a) * rad;
          inst.orbs[i] = { x: ox, y: oy, r: 13 };
          for (const e of game.enemies) {
            if (e.dead || e.invuln) continue;
            if (U.dist2(ox, oy, e.x, e.y) < (13 + e.r) * (13 + e.r)) {
              game.damageEnemy(e, dmg, { silent: true, source: 'orbit', knock: 60 });
            }
          }
          for (const b of game.ebullets) {
            if (!b.dead && b.destructible && U.dist2(ox, oy, b.x, b.y) < (14 + b.r) * (14 + b.r)) b.dead = true;
          }
        }
      },
      draw(ctx, inst) {
        if (!inst.orbs) return;
        for (const o of inst.orbs) {
          NF.Draw.glowCircle(ctx, o.x, o.y, 9, C.violet, .28);
          ctx.globalAlpha = .8; ctx.fillStyle = '#fff';
          ctx.beginPath(); ctx.arc(o.x, o.y, 3.4, 0, U.TAU); ctx.fill();
          ctx.globalAlpha = 1;
        }
      }
    },

    /* ---------------- 6. Railgun ---------------- */
    {
      id: 'rail', name: 'Railgun Oméga', icon: '🎯', color: '#7dd3ff', cost: 700,
      desc: 'Charge lente, dégâts massifs, traverse toute une file d\'ennemis.',
      lvlDesc: l => l % 3 === 0 ? '+perforation' : '+40 % dégâts',
      maxLevel: MAXLVL,
      fire(game, p, inst) {
        const { a } = aim(game, p, 1100);
        game.shoot(new NF.Bullet({
          x: p.x, y: p.y, angle: a,
          speed: 1500 * p.stats.projSpeed, r: 6, life: 1.4,
          dmg: game.roll(dmgOf(52, inst.lvl, p), p),
          color: '#7dd3ff', shape: 'rail',
          pierce: 99, owner: 'rail', knock: 160
        }));
        inst.t = cdOf(2.1, p);
        FX.kick(5); U.buzz(12);
      }
    },

    /* ---------------- 7. Arc Tesla ---------------- */
    {
      id: 'tesla', name: 'Arc Tesla', icon: '🔌', color: '#a8f0ff', cost: 900,
      desc: 'Décharge qui rebondit d\'ennemi en ennemi.',
      lvlDesc: l => l % 2 === 0 ? '+1 rebond' : '+40 % dégâts',
      maxLevel: MAXLVL,
      fire(game, p, inst) {
        const t = game.nearestEnemy(p.x, p.y, 420);
        if (!t) { inst.t = 0.25; return; }
        const jumps = 2 + Math.floor(inst.lvl / 2);
        const dmg = game.roll(dmgOf(18, inst.lvl, p), p);
        game.zaps.push(new NF.Zap(p.x, p.y, t.x, t.y, '#a8f0ff'));
        game.damageEnemy(t, dmg, { source: 'tesla' });
        game.chainLightning(t.x, t.y, t, jumps, dmg * 0.8, 230, '#a8f0ff');
        inst.t = cdOf(1.05, p);
      }
    },

    /* ---------------- 8. Onde cryo ---------------- */
    {
      id: 'cryo', name: 'Onde Cryo', icon: '❄️', color: '#7ec8ff', cost: 1100,
      desc: 'Vague circulaire qui ralentit et endommage tout autour de toi.',
      lvlDesc: l => l % 3 === 0 ? '+rayon' : '+40 % dégâts',
      maxLevel: MAXLVL,
      fire(game, p, inst) {
        const rad = 150 + inst.lvl * 16;
        const dmg = game.roll(dmgOf(16, inst.lvl, p), p);
        FX.shockwave(p.x, p.y, rad, '#7ec8ff', .45);
        for (const e of game.enemies) {
          if (e.dead) continue;
          if (U.dist(p.x, p.y, e.x, e.y) < rad + e.r) {
            game.damageEnemy(e, dmg, { source: 'cryo', knock: 110 });
            e.slowT = Math.max(e.slowT || 0, 1.8);
            e.slowAmt = 0.45;
          }
        }
        inst.t = cdOf(2.4, p);
      }
    },

    /* ---------------- 9. Drone sentinelle ---------------- */
    {
      id: 'drone', name: 'Drone Sentinelle', icon: '🤖', color: C.lime, cost: 1500,
      desc: 'Un compagnon autonome qui tire sur les ennemis proches.',
      lvlDesc: l => l % 3 === 0 ? '+1 drone' : '+40 % dégâts',
      maxLevel: MAXLVL,
      passive: true,
      fire() { },
      tick(game, p, inst, dt) {
        const n = 1 + Math.floor(inst.lvl / 3);
        inst.drones = inst.drones || [];
        while (inst.drones.length < n) inst.drones.push({ x: p.x, y: p.y, cd: U.rand(0, .5), ph: U.rand(0, 6) });
        inst.drones.length = n;
        for (let i = 0; i < n; i++) {
          const d = inst.drones[i];
          d.ph += dt * 1.5;
          const tx = p.x + Math.cos(d.ph + i * U.TAU / n) * 58;
          const ty = p.y + Math.sin(d.ph + i * U.TAU / n) * 58 - 26;
          d.x = U.lerp(d.x, tx, Math.min(1, dt * 6));
          d.y = U.lerp(d.y, ty, Math.min(1, dt * 6));
          d.cd -= dt;
          if (d.cd <= 0) {
            const t = game.nearestEnemy(d.x, d.y, 460);
            if (t) {
              game.shoot(new NF.Bullet({
                x: d.x, y: d.y, angle: U.angle(d.x, d.y, t.x, t.y),
                speed: 620, r: 4,
                dmg: game.roll(dmgOf(8, inst.lvl, p), p),
                color: C.lime, owner: 'drone', life: 1.3
              }));
              d.cd = cdOf(0.55, p);
            } else d.cd = 0.2;
          }
        }
      },
      draw(ctx, inst) {
        if (!inst.drones) return;
        for (const d of inst.drones) {
          ctx.fillStyle = C.lime; ctx.globalAlpha = .2;
          ctx.beginPath(); ctx.arc(d.x, d.y, 14, 0, U.TAU); ctx.fill();
          ctx.globalAlpha = 1;
          NF.Draw.poly(ctx, d.x, d.y, 7, 3, -Math.PI / 2); ctx.fill();
          ctx.fillStyle = '#06210a';
          ctx.beginPath(); ctx.arc(d.x, d.y + 1, 2.2, 0, U.TAU); ctx.fill();
        }
      }
    },

    /* ---------------- 10. Singularité ---------------- */
    {
      id: 'singularity', name: 'Singularité', icon: '🕳️', color: '#c58bff', cost: 2000,
      desc: 'Ouvre un puits gravitationnel qui aspire et broie les ennemis.',
      lvlDesc: l => l % 3 === 0 ? '+durée' : '+40 % dégâts',
      maxLevel: MAXLVL,
      fire(game, p, inst) {
        const t = game.nearestEnemy(p.x, p.y, 700) || { x: p.x + Math.cos(p.facing) * 220, y: p.y + Math.sin(p.facing) * 220 };
        game.singularities.push({
          x: t.x, y: t.y, r: 108 + inst.lvl * 7,
          dmg: dmgOf(7, inst.lvl, p),
          life: 2.6 + Math.floor(inst.lvl / 3) * 0.7, t: 0
        });
        inst.t = cdOf(5.5, p);
      }
    }
  ];

  NF.weaponById = id => WEAPONS.find(x => x.id === id);
  NF.WEAPON_MAXLVL = MAXLVL;

})(window);
