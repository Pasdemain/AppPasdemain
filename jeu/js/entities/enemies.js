/* ============================================================
   enemies.js — types d'ennemis et comportements
   ============================================================ */
(function (w) {
  'use strict';
  const NF = w.NF, U = NF.U, C = NF.C, FX = NF.FX;

  let UID = 1;

  /* ------------------------------------------------------------
     Catalogue
     `mw` donne la vague d'apparition PAR SECTEUR (clé = index de biome) :
     un type absent de la table n'apparaît pas dans ce secteur.
     hp / dmg / speed sont des valeurs de base, multipliées par la vague.
     ------------------------------------------------------------ */
  const TYPES = NF.ENEMY_TYPES = {
    /* ---------------- Secteur 1 — LA GRILLE ---------------- */
    drone: {
      name: 'Drone', ai: 'chase', hp: 22, dmg: 9, speed: 96, r: 14, xp: 2,
      color: '#5be8ff', sides: 3, mw: { 0: 1 }, weight: 100
    },
    rusher: {
      name: 'Éclaireur', ai: 'rush', hp: 15, dmg: 12, speed: 178, r: 11, xp: 3,
      color: '#9dff4d', sides: 3, mw: { 0: 1, 1: 1 }, weight: 70
    },
    turret: {
      name: 'Sentinelle', ai: 'kite', hp: 34, dmg: 8, speed: 62, r: 15, xp: 4,
      color: '#ff8a3e', sides: 4, mw: { 0: 2, 1: 1 }, weight: 55, range: 330, fireCd: 1.7
    },
    tank: {
      name: 'Blindé', ai: 'chase', hp: 130, dmg: 18, speed: 52, r: 24, xp: 8,
      color: '#8b5cff', sides: 6, mw: { 0: 3, 1: 1, 2: 1 }, weight: 40, knockRes: .75
    },
    splitter: {
      name: 'Réplicant', ai: 'chase', hp: 46, dmg: 10, speed: 84, r: 18, xp: 5,
      color: '#ff3ea5', sides: 5, mw: { 0: 3, 1: 2 }, weight: 45, split: 3
    },
    mini: {
      name: 'Fragment', ai: 'rush', hp: 12, dmg: 7, speed: 150, r: 9, xp: 1,
      color: '#ff7ec8', sides: 4, mw: {}, weight: 0
    },
    orbiter: {
      name: 'Rôdeur', ai: 'orbit', hp: 40, dmg: 10, speed: 130, r: 13, xp: 5,
      color: '#7dd3ff', sides: 4, mw: { 0: 4, 1: 2 }, weight: 45, orbitR: 220, fireCd: 1.3
    },
    healer: {
      name: 'Réparateur', ai: 'flee', hp: 58, dmg: 6, speed: 78, r: 15, xp: 7,
      color: '#9dff4d', sides: 6, mw: { 0: 5, 1: 3 }, weight: 28, healR: 200, healCd: 1.6
    },
    shielder: {
      name: 'Égide', ai: 'chase', hp: 76, dmg: 10, speed: 70, r: 17, xp: 8,
      color: '#3ef2ff', sides: 8, mw: { 0: 6, 1: 3, 2: 3 }, weight: 26, auraR: 190
    },
    bomber: {
      name: 'Charge Vive', ai: 'rush', hp: 30, dmg: 26, speed: 132, r: 15, xp: 5,
      color: '#ffb43e', sides: 5, mw: { 0: 5, 1: 2, 2: 4 }, weight: 34, boom: 110
    },
    sniper: {
      name: 'Perce-Ciel', ai: 'snipe', hp: 44, dmg: 22, speed: 58, r: 14, xp: 8,
      color: '#ff4d5e', sides: 3, mw: { 0: 7, 1: 4, 2: 3 }, weight: 26, range: 620, fireCd: 3.0
    },
    swarm: {
      name: 'Nuée', ai: 'swarm', hp: 9, dmg: 6, speed: 168, r: 7, xp: 1,
      color: '#c58bff', sides: 3, mw: { 0: 4, 1: 1, 2: 2 }, weight: 50, packed: true
    },

    /* ---------------- Secteur 2 — LA FAILLE ---------------- */
    phantom: {
      name: 'Spectre', ai: 'blink', hp: 52, dmg: 15, speed: 66, r: 14, xp: 7,
      color: '#b57bff', sides: 3, mw: { 1: 1, 2: 6 }, weight: 60, blinkCd: 3.2
    },
    spawner: {
      name: 'Couveuse', ai: 'spawner', hp: 120, dmg: 10, speed: 34, r: 20, xp: 12,
      color: '#ff6b4d', sides: 6, mw: { 1: 2 }, weight: 30, knockRes: .6, broodCd: 5.5
    },
    warden: {
      name: 'Gardien', ai: 'chase', hp: 90, dmg: 20, speed: 66, r: 19, xp: 12,
      color: '#ffd23e', sides: 5, mw: { 1: 4 }, weight: 28, knockRes: .5, ward: 0.45
    },
    leech: {
      name: 'Sangsue', ai: 'leech', hp: 46, dmg: 8, speed: 142, r: 12, xp: 4,
      color: '#4dffc3', sides: 4, mw: { 1: 6 }, weight: 26
    },
    harrier: {
      name: 'Faucheur', ai: 'harrier', hp: 62, dmg: 16, speed: 152, r: 13, xp: 9,
      color: '#ff2d55', sides: 3, mw: { 1: 8, 2: 5 }, weight: 30, orbitR: 250, fireCd: 2.2
    },

    /* ---------------- Secteur 3 — LE NOYAU ---------------- */
    molten: {
      name: 'Fondeur', ai: 'molten', hp: 74, dmg: 14, speed: 92, r: 17, xp: 8,
      color: '#ff8a3e', sides: 5, mw: { 2: 1 }, weight: 60, trailCd: .55
    },
    mortar: {
      name: 'Mortier', ai: 'mortar', hp: 68, dmg: 22, speed: 46, r: 18, xp: 10,
      color: '#ffd23e', sides: 6, mw: { 2: 2 }, weight: 40, range: 560, fireCd: 3.4
    },
    magnetron: {
      name: 'Aimant', ai: 'magnetron', hp: 96, dmg: 12, speed: 58, r: 20, xp: 11,
      color: '#c58bff', sides: 8, mw: { 2: 4 }, weight: 30, pullR: 420, knockRes: .6
    }
  };

  /* ------------------------------------------------------------
     Entité
     ------------------------------------------------------------ */
  class Enemy {
    constructor(typeId, x, y, scale, elite) {
      const d = TYPES[typeId];
      this.uid = UID++;
      this.type = typeId;
      this.def = d;
      this.x = x; this.y = y;
      this.vx = 0; this.vy = 0;
      this.kx = 0; this.ky = 0;             // recul
      this.r = d.r * (elite ? 1.45 : 1);
      this.elite = !!elite;

      const eliteMul = elite ? 4.2 : 1;
      this.maxHp = d.hp * scale.hp * eliteMul;
      this.hp = this.maxHp;
      this.dmg = d.dmg * scale.dmg * (elite ? 1.3 : 1);
      this.speed = d.speed * scale.speed * (elite ? 0.88 : 1);
      this.xp = Math.max(1, Math.round(d.xp * (scale.xp || 1) * (elite ? 6 : 1)));
      this.color = elite ? '#ffd23e' : d.color;

      this.angle = U.rand(0, U.TAU);
      this.spin = U.rand(-1.4, 1.4);
      this.fireCd = U.rand(0.4, (d.fireCd || 2));
      this.touchCd = 0;
      this.slowT = 0; this.slowAmt = 0;
      this.stunT = 0;
      this.hitFlash = 0;
      this.shielded = 0;                    // réduction de dégâts par une Égide
      if (d.ward) {                         // Gardien : bouclier rechargeable
        this.wardMax = this.maxHp * d.ward;
        this.ward = this.wardMax;
        this.wardT = 0;
      }
      this.state = 0; this.stateT = 0;
      this.orbitDir = U.chance(.5) ? 1 : -1;
      this.dead = false;
      this.isBoss = false;
    }

    get currentSpeed() {
      let s = this.speed;
      if (this.slowT > 0) s *= (1 - this.slowAmt);
      if (this.stunT > 0) s = 0;
      return s;
    }

    update(dt, game) {
      const p = game.player;
      if (this.slowT > 0) this.slowT -= dt;
      if (this.stunT > 0) this.stunT -= dt;
      if (this.hitFlash > 0) this.hitFlash -= dt;
      if (this.wardMax) {                   // le bouclier se reforme après 4 s
        this.wardT += dt;
        if (this.ward < this.wardMax && this.wardT > 4) {
          this.ward = Math.min(this.wardMax, this.ward + this.wardMax * 0.5 * dt);
        }
      }
      if (this.touchCd > 0) this.touchCd -= dt;
      if (this.fireCd > 0) this.fireCd -= dt;
      this.shielded = 0;
      this.angle += this.spin * dt;

      const sp = this.currentSpeed;
      let ax = 0, ay = 0;

      switch (this.def.ai) {
        case 'chase': {
          const a = U.angle(this.x, this.y, p.x, p.y);
          ax = Math.cos(a) * sp; ay = Math.sin(a) * sp;
          break;
        }
        case 'rush': {
          // charge : vise, s'arrête, puis fonce en ligne droite
          this.stateT -= dt;
          if (this.state === 0) {
            const a = U.angle(this.x, this.y, p.x, p.y);
            ax = Math.cos(a) * sp * .6; ay = Math.sin(a) * sp * .6;
            if (U.dist(this.x, this.y, p.x, p.y) < 300 && this.stateT <= 0) {
              this.state = 1; this.stateT = 0.45; this.chargeA = a;
            }
          } else if (this.state === 1) {          // télégraphe
            ax = ay = 0;
            if (this.stateT <= 0) { this.state = 2; this.stateT = 0.7; }
          } else {                                 // ruée
            ax = Math.cos(this.chargeA) * sp * 2.6;
            ay = Math.sin(this.chargeA) * sp * 2.6;
            if (this.stateT <= 0) { this.state = 0; this.stateT = 0.9; }
          }
          break;
        }
        case 'kite': {
          const d = U.dist(this.x, this.y, p.x, p.y);
          const a = U.angle(this.x, this.y, p.x, p.y);
          const want = this.def.range;
          const dir = d < want * .75 ? -1 : (d > want * 1.15 ? 1 : 0);
          ax = Math.cos(a) * sp * dir; ay = Math.sin(a) * sp * dir;
          ax += Math.cos(a + Math.PI / 2) * sp * .45 * this.orbitDir;
          ay += Math.sin(a + Math.PI / 2) * sp * .45 * this.orbitDir;
          if (this.fireCd <= 0 && d < want * 1.4) {
            this.fireCd = this.def.fireCd;
            game.enemyShoot(this, a, { speed: 260, dmg: this.dmg, r: 6, color: this.color });
          }
          break;
        }
        case 'orbit': {
          const d = U.dist(this.x, this.y, p.x, p.y);
          const a = U.angle(this.x, this.y, p.x, p.y);
          const radial = (d - this.def.orbitR) / 140;
          ax = Math.cos(a) * sp * U.clamp(radial, -1, 1) + Math.cos(a + Math.PI / 2) * sp * this.orbitDir;
          ay = Math.sin(a) * sp * U.clamp(radial, -1, 1) + Math.sin(a + Math.PI / 2) * sp * this.orbitDir;
          if (this.fireCd <= 0) {
            this.fireCd = this.def.fireCd;
            for (let i = 0; i < 3; i++) {
              game.enemyShoot(this, a + (i - 1) * .22, { speed: 230, dmg: this.dmg, r: 5, color: this.color });
            }
          }
          break;
        }
        case 'flee': {
          const d = U.dist(this.x, this.y, p.x, p.y);
          const a = U.angle(this.x, this.y, p.x, p.y);
          const dir = d < 260 ? -1 : 0.25;
          ax = Math.cos(a) * sp * dir; ay = Math.sin(a) * sp * dir;
          if (this.fireCd <= 0) {
            this.fireCd = this.def.healCd;
            let healed = 0;
            for (const e of game.enemies) {
              if (e === this || e.dead || e.isBoss) continue;
              if (U.dist2(this.x, this.y, e.x, e.y) < this.def.healR * this.def.healR && e.hp < e.maxHp) {
                e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.12);
                game.zaps.push(new NF.Zap(this.x, this.y, e.x, e.y, C.lime));
                if (++healed > 5) break;
              }
            }
          }
          break;
        }
        case 'snipe': {
          const d = U.dist(this.x, this.y, p.x, p.y);
          const a = U.angle(this.x, this.y, p.x, p.y);
          const dir = d < 380 ? -1 : (d > this.def.range ? 1 : 0);
          ax = Math.cos(a) * sp * dir; ay = Math.sin(a) * sp * dir;
          if (this.fireCd <= 0 && d < this.def.range * 1.1) {
            this.fireCd = this.def.fireCd;
            game.hazards.push(new NF.Hazard({
              kind: 'beam', x: this.x, y: this.y, angle: a,
              len: 900, width: 9, telegraph: .85, duration: .22,
              dmg: this.dmg, color: C.red, owner: this, followOwner: true
            }));
          }
          break;
        }
        case 'swarm': {
          const a = U.angle(this.x, this.y, p.x, p.y);
          // léger zigzag, cohésion de groupe
          const wob = Math.sin(game.time * 5 + this.uid) * .5;
          ax = Math.cos(a + wob) * sp; ay = Math.sin(a + wob) * sp;
          break;
        }
        case 'blink': {
          // Spectre : se dématérialise puis réapparaît près du joueur
          this.stateT -= dt;
          if (this.state === 0) {
            const a = U.angle(this.x, this.y, p.x, p.y);
            ax = Math.cos(a) * sp; ay = Math.sin(a) * sp;
            if (this.stateT <= 0) { this.state = 1; this.stateT = .5; this.immune = true; }
          } else {
            ax = ay = 0;
            if (this.stateT <= 0) {
              const pt = U.ringPoint(p.x, p.y, 110, 190);
              FX.burst(this.x, this.y, 8, this.color, { speed: 150, life: .35 });
              this.x = U.clamp(pt.x, this.r, game.world.w - this.r);
              this.y = U.clamp(pt.y, this.r, game.world.h - this.r);
              FX.burst(this.x, this.y, 10, this.color, { speed: 180, life: .4, glow: true });
              this.state = 0; this.stateT = this.def.blinkCd;
              this.immune = false;
            }
          }
          break;
        }
        case 'spawner': {
          // Couveuse : garde ses distances et lâche des nuées
          const d = U.dist(this.x, this.y, p.x, p.y);
          const a = U.angle(this.x, this.y, p.x, p.y);
          const dir = d < 380 ? -1 : (d > 520 ? 1 : 0);
          ax = Math.cos(a) * sp * dir; ay = Math.sin(a) * sp * dir;
          this.stateT -= dt;
          if (this.stateT <= 0) {
            this.stateT = this.def.broodCd;
            if (game.enemies.length < 90) {
              for (let i = 0; i < 2; i++) {
                const pt = U.ringPoint(this.x, this.y, 26, 48);
                game.spawnAdd('swarm', pt.x, pt.y, game.waves.scale);
              }
              FX.shockwave(this.x, this.y, 60, this.color, .35);
            }
          }
          break;
        }
        case 'leech': {
          // Sangsue : dévore les éclats d'XP au sol, et les rend en mourant
          let target = null, td = 520 * 520;
          for (const k of game.pickups) {
            if (k.dead || k.kind !== 'xp') continue;
            const dd = U.dist2(this.x, this.y, k.x, k.y);
            if (dd < td) { td = dd; target = k; }
          }
          if (target) {
            const a = U.angle(this.x, this.y, target.x, target.y);
            ax = Math.cos(a) * sp; ay = Math.sin(a) * sp;
            if (U.dist2(this.x, this.y, target.x, target.y) < (this.r + 10) * (this.r + 10)) {
              target.dead = true;
              this.stolen = (this.stolen || 0) + target.value;
              FX.text(this.x, this.y - this.r - 6, 'XP VOLÉ', '#4dffc3');
            }
          } else {
            const a = U.angle(this.x, this.y, p.x, p.y);
            ax = Math.cos(a) * sp; ay = Math.sin(a) * sp;
          }
          break;
        }
        case 'harrier': {
          // Faucheur : tourne autour, tire en rafale, puis traverse
          const d = U.dist(this.x, this.y, p.x, p.y);
          const a = U.angle(this.x, this.y, p.x, p.y);
          this.stateT -= dt;
          if (this.state === 2) {                       // traversée
            ax = Math.cos(this.chargeA) * sp * 2.2;
            ay = Math.sin(this.chargeA) * sp * 2.2;
            if (this.stateT <= 0) { this.state = 0; this.stateT = U.rand(3, 5); }
          } else {
            const radial = (d - this.def.orbitR) / 130;
            ax = Math.cos(a) * sp * U.clamp(radial, -1, 1) + Math.cos(a + Math.PI / 2) * sp * this.orbitDir;
            ay = Math.sin(a) * sp * U.clamp(radial, -1, 1) + Math.sin(a + Math.PI / 2) * sp * this.orbitDir;
            if (this.stateT <= 0) { this.state = 2; this.stateT = .8; this.chargeA = a; }
            if (this.fireCd <= 0) {
              this.fireCd = this.def.fireCd;
              this.burst = 3;
            }
          }
          if (this.burst > 0) {
            this.burstT = (this.burstT || 0) - dt;
            if (this.burstT <= 0) {
              this.burstT = .12; this.burst--;
              game.enemyShoot(this, a, { speed: 330, dmg: this.dmg * .6, r: 5, color: this.color });
            }
          }
          break;
        }
        case 'molten': {
          // Fondeur : poursuit en laissant une coulée brûlante
          const a = U.angle(this.x, this.y, p.x, p.y);
          ax = Math.cos(a) * sp; ay = Math.sin(a) * sp;
          this.stateT -= dt;
          if (this.stateT <= 0) {
            this.stateT = this.def.trailCd;
            game.hazards.push(new NF.Hazard({
              kind: 'zone', x: this.x, y: this.y, r: 44,
              telegraph: .35, duration: 3.4,
              dmg: this.dmg * .5, color: '#ff8a3e', tickRate: .6
            }));
          }
          break;
        }
        case 'mortar': {
          // Mortier : reste loin et arrose la position du joueur
          const d = U.dist(this.x, this.y, p.x, p.y);
          const a = U.angle(this.x, this.y, p.x, p.y);
          const dir = d < this.def.range * .7 ? -1 : (d > this.def.range ? 1 : 0);
          ax = Math.cos(a) * sp * dir; ay = Math.sin(a) * sp * dir;
          if (this.fireCd <= 0) {
            this.fireCd = this.def.fireCd;
            for (let i = 0; i < 2; i++) {
              const pt = U.ringPoint(p.x, p.y, 0, 90);
              game.hazards.push(new NF.Hazard({
                kind: 'zone',
                x: U.clamp(pt.x, 40, game.world.w - 40),
                y: U.clamp(pt.y, 40, game.world.h - 40),
                r: 92, telegraph: 1.1, duration: .45,
                dmg: this.dmg, color: '#ffd23e', tickRate: .4
              }));
            }
          }
          break;
        }
        case 'magnetron': {
          // Aimant : t'attire vers lui au lieu de te courir après
          const d = U.dist(this.x, this.y, p.x, p.y);
          const a = U.angle(this.x, this.y, p.x, p.y);
          ax = Math.cos(a) * sp * .4; ay = Math.sin(a) * sp * .4;
          if (d < this.def.pullR && d > 30 && p.dashT <= 0) {
            const pa = U.angle(p.x, p.y, this.x, this.y);
            const force = 150 * (1 - d / this.def.pullR);
            p.x += Math.cos(pa) * force * dt;
            p.y += Math.sin(pa) * force * dt;
          }
          break;
        }
        case 'anchor': {
          // nœud arrimé en orbite autour de son boss
          const A = this.anchor;
          if (A && !A.boss.dead) {
            A.ang += A.spd * dt;
            const tx = A.boss.x + Math.cos(A.ang) * A.rad;
            const ty = A.boss.y + Math.sin(A.ang) * A.rad;
            ax = (tx - this.x) * 7; ay = (ty - this.y) * 7;
          }
          break;
        }
        case 'decoy':
          // piloté par le boss (il écrit directement vx/vy)
          ax = this.vx; ay = this.vy;
          break;
        case 'none':
        default:
          ax = 0; ay = 0;
          break;
      }

      /* Égides : réduction de dégâts autour d'elles */
      if (this.def.auraR) {
        for (const e of game.enemies) {
          if (e === this || e.dead) continue;
          if (U.dist2(this.x, this.y, e.x, e.y) < this.def.auraR * this.def.auraR) e.shielded = 0.45;
        }
      }

      /* Séparation : évite l'empilement (sauf structures fixes) */
      if (this.def.ai !== 'anchor' && this.def.ai !== 'none') {
        const sep = game.separation(this);
        ax += sep.x; ay += sep.y;
      }

      this.vx = U.lerp(this.vx, ax, Math.min(1, dt * 7));
      this.vy = U.lerp(this.vy, ay, Math.min(1, dt * 7));

      this.x += (this.vx + this.kx) * dt;
      this.y += (this.vy + this.ky) * dt;
      this.kx *= Math.max(0, 1 - 6 * dt);
      this.ky *= Math.max(0, 1 - 6 * dt);

      const W = game.world;
      this.x = U.clamp(this.x, this.r, W.w - this.r);
      this.y = U.clamp(this.y, this.r, W.h - this.r);

      /* Contact avec le joueur */
      if (p.alive && this.touchCd <= 0 && U.dist2(this.x, this.y, p.x, p.y) < (this.r + p.r) * (this.r + p.r)) {
        this.touchCd = 0.65;
        game.hurtPlayer(this.dmg, this);
        const a = U.angle(p.x, p.y, this.x, this.y);
        this.kx += Math.cos(a) * 180; this.ky += Math.sin(a) * 180;
        if (p.stats.thorns > 0) game.damageEnemy(this, p.stats.thorns, { source: 'thorns' });
        if (this.def.boom) this.explodeNow(game);
      }
    }

    explodeNow(game) {
      game.explosion(this.x, this.y, this.def.boom, this.dmg * 1.4, C.amber, true);
      this.hp = 0;
      game.killEnemy(this, true);
    }

    knock(a, force) {
      const res = 1 - (this.def.knockRes || 0);
      this.kx += Math.cos(a) * force * res;
      this.ky += Math.sin(a) * force * res;
    }

    draw(ctx) {
      const d = this.def;
      const flash = this.hitFlash > 0;

      /* leurre d'Hydre : silhouette identique au boss, cœur éteint */
      if (this.bossRef) {
        ctx.globalAlpha = .2; ctx.fillStyle = this.color;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.r * 1.9, 0, U.TAU); ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = flash ? '#3a2440' : '#0d0a1e';
        ctx.strokeStyle = this.color; ctx.lineWidth = 3;
        NF.Draw.poly(ctx, this.x, this.y, this.r, 6, this.angle); ctx.fill(); ctx.stroke();
        NF.Draw.poly(ctx, this.x, this.y, this.r * .6, 6, -this.angle * 1.7); ctx.stroke();
        ctx.fillStyle = '#2a1b3d';
        ctx.beginPath(); ctx.arc(this.x, this.y, this.r * .22, 0, U.TAU); ctx.fill();
        return;
      }

      if (this.elite) {
        ctx.globalAlpha = .18; ctx.fillStyle = '#ffd23e';
        ctx.beginPath(); ctx.arc(this.x, this.y, this.r * 2.1, 0, U.TAU); ctx.fill();
        ctx.globalAlpha = 1;
      }
      if (this.shielded > 0) NF.Draw.ring(ctx, this.x, this.y, this.r + 6, C.cyan, 2, .4);
      if (this.ward > 0) {
        NF.Draw.ring(ctx, this.x, this.y, this.r + 7, '#ffd23e', 3, .35 + .35 * (this.ward / this.wardMax));
      }
      if (this.immune && this.def.ai === 'blink') {     // Spectre en transit
        ctx.globalAlpha = .25;
        NF.Draw.ring(ctx, this.x, this.y, this.r + 4 + (1 - this.stateT / .5) * 22, this.color, 2, .3);
        ctx.globalAlpha = 1;
        return;
      }
      if (this.state === 1 && d.ai === 'rush') {
        NF.Draw.ring(ctx, this.x, this.y, this.r + 8 + Math.sin(this.stateT * 30) * 3, C.red, 2, .8);
      }

      ctx.globalAlpha = .22; ctx.fillStyle = this.color;
      ctx.beginPath(); ctx.arc(this.x, this.y, this.r * 1.7, 0, U.TAU); ctx.fill();
      ctx.globalAlpha = 1;

      ctx.fillStyle = flash ? '#fff' : '#0a1024';
      ctx.strokeStyle = flash ? '#fff' : this.color;
      ctx.lineWidth = 2;
      NF.Draw.poly(ctx, this.x, this.y, this.r, d.sides, this.angle);
      ctx.fill(); ctx.stroke();

      ctx.fillStyle = flash ? '#fff' : this.color;
      ctx.beginPath(); ctx.arc(this.x, this.y, this.r * .32, 0, U.TAU); ctx.fill();

      if (this.hp < this.maxHp) NF.Draw.hpBar(ctx, this, this.r * 2, 3, this.elite ? '#ffd23e' : C.red);
    }
  }

  NF.Enemy = Enemy;

})(window);
