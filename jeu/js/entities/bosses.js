/* ============================================================
   bosses.js — boss toutes les 10 vagues
   Cinq archétypes avec des mécaniques propres, rejoués en boucle
   avec un palier (Mk II, Mk III…) pour des vagues illimitées.
   ============================================================ */
(function (w) {
  'use strict';
  const NF = w.NF, U = NF.U, C = NF.C, FX = NF.FX;

  /* ---- types de sbires spécifiques aux boss ---- */
  Object.assign(NF.ENEMY_TYPES, {
    bossBase: { name: 'Boss', ai: 'none', hp: 1, dmg: 20, speed: 60, r: 46, xp: 0, color: C.magenta, sides: 6, minWave: 99, weight: 0 },
    node: { name: 'Nœud', ai: 'anchor', hp: 60, dmg: 12, speed: 0, r: 16, xp: 6, color: '#ffd23e', sides: 3, minWave: 99, weight: 0 },
    pillar: { name: 'Pilier', ai: 'none', hp: 140, dmg: 14, speed: 0, r: 22, xp: 10, color: '#c58bff', sides: 4, minWave: 99, weight: 0, knockRes: 1 },
    decoy: { name: 'Leurre', ai: 'decoy', hp: 1, dmg: 16, speed: 70, r: 40, xp: 0, color: C.magenta, sides: 6, minWave: 99, weight: 0, knockRes: 1 },
    addTurret: { name: 'Tourelle', ai: 'kite', hp: 55, dmg: 10, speed: 40, r: 14, xp: 5, color: '#ff8a3e', sides: 4, minWave: 99, weight: 0, range: 300, fireCd: 1.4 }
  });

  /* ============================================================
     Définitions des boss
     ============================================================ */
  const BOSSES = NF.BOSSES = [

    /* ------------------------------------------------------------
       1 — PRISME : invulnérable tant que ses nœuds vivent
       ------------------------------------------------------------ */
    {
      id: 'prisme', name: 'NEXUS-01 « PRISME »', color: '#ffd23e', sides: 6, r: 46,
      hpMul: 900, dmgMul: 1.6,
      hint: 'Détruis les nœuds dorés pour briser son bouclier',
      init(b, game) {
        b.nodeCount = 4;
        b.nodes = [];
        b.beamT = 1.2;
        b.beamCount = 2;
        b.vulnT = 0;
        b.spawnNodes(game);
      },
      update(b, dt, game) {
        const p = game.player;

        /* nœuds vivants ⇒ invulnérable */
        b.nodes = b.nodes.filter(n => !n.dead);
        b.invuln = b.nodes.length > 0;

        if (!b.invuln) {
          b.vulnT -= dt;
          b.hint = 'NOYAU EXPOSÉ — frappe maintenant !';
          if (b.vulnT <= 0) {                       // les nœuds se reforment
            b.spawnNodes(game);
            game.toast('LES NŒUDS SE REFORMENT', 'warn');
          }
        } else {
          b.hint = `Nœuds restants : ${b.nodes.length}`;
          /* balayage laser */
          b.beamT -= dt;
          if (b.beamT <= 0) {
            b.beamT = b.phase >= 3 ? 3.0 : 4.0;
            const base = U.angle(b.x, b.y, p.x, p.y) + U.rand(-.6, .6);
            const n = b.beamCount;
            for (let i = 0; i < n; i++) {
              game.hazards.push(new NF.Hazard({
                kind: 'beam', x: b.x, y: b.y, angle: base + i * U.TAU / n,
                len: 1600, width: 22, telegraph: 1.0,
                duration: b.phase >= 3 ? 2.6 : 2.0,
                rotSpeed: (b.phase >= 3 ? .75 : .5) * (i % 2 ? 1 : 1),
                dmg: b.dmg, color: '#ffd23e', owner: b, followOwner: true
              }));
            }
          }
        }

        /* déplacement lent, garde ses distances */
        b.driftTo(dt, game, 260);

        /* phase 3 : salves radiales */
        if (b.phase >= 3) {
          b.radialT = (b.radialT || 2) - dt;
          if (b.radialT <= 0) {
            b.radialT = 2.4;
            const off = U.rand(0, U.TAU);
            for (let i = 0; i < 16; i++) {
              game.enemyShoot(b, off + i * U.TAU / 16, { speed: 190, dmg: b.dmg * .5, r: 7, color: '#ffd23e' });
            }
          }
        }
      },
      onPhase(b, game) {
        b.beamCount = Math.min(5, b.beamCount + 1);
        if (b.nodes.length) { for (const n of b.nodes) n.hp = Math.min(n.hp, n.maxHp * .6); }
      }
    },

    /* ------------------------------------------------------------
       2 — VORTEX : attire le joueur, anneaux de mort
       ------------------------------------------------------------ */
    {
      id: 'vortex', name: 'VORTEX-02 « CYCLONE »', color: '#7dd3ff', sides: 8, r: 44,
      hpMul: 1150, dmgMul: 1.5,
      hint: 'Il t\'aspire : reste près du centre ou fuis l\'anneau',
      init(b) {
        b.spiralA = 0; b.dir = 1; b.ringT = 4; b.spiralT = 0;
      },
      update(b, dt, game) {
        const p = game.player;
        b.hint = 'Traverse l\'anneau par l\'intérieur';

        /* aspiration */
        const d = U.dist(b.x, b.y, p.x, p.y);
        if (d > 30) {
          const a = U.angle(p.x, p.y, b.x, b.y);
          const pull = (b.phase >= 3 ? 160 : 110) * U.clamp(d / 500, .35, 1);
          p.x += Math.cos(a) * pull * dt;
          p.y += Math.sin(a) * pull * dt;
        }

        /* spirale de projectiles */
        b.spiralT -= dt;
        b.spiralA += dt * 2.2 * b.dir;
        if (b.spiralT <= 0) {
          b.spiralT = b.phase >= 2 ? 0.12 : 0.17;
          const arms = b.phase >= 3 ? 4 : (b.phase >= 2 ? 3 : 2);
          for (let i = 0; i < arms; i++) {
            game.enemyShoot(b, b.spiralA + i * U.TAU / arms, {
              speed: 165, dmg: b.dmg * .45, r: 7, color: '#7dd3ff', life: 7
            });
          }
        }

        /* anneau mortel qui s'écarte */
        b.ringT -= dt;
        if (b.ringT <= 0) {
          b.ringT = b.phase >= 3 ? 6 : 8.5;
          game.hazards.push(new NF.Hazard({
            kind: 'ring', x: b.x, y: b.y, r: 150, rInner: 70,
            telegraph: 1.0, duration: 3.4, grow: 190,
            dmg: b.dmg * 1.1, color: '#7dd3ff', owner: b, followOwner: true,
            tickRate: .6
          }));
          game.toast('ANNEAU DE COMPRESSION', 'warn');
        }

        b.driftTo(dt, game, 200, .35);
      },
      onPhase(b, game) {
        b.dir *= -1;
        game.toast('INVERSION DU VORTEX', 'warn');
        for (const bl of game.ebullets) bl.spin = (bl.spin || 0) + .6 * b.dir;
      }
    },

    /* ------------------------------------------------------------
       3 — HYDRE : leurres, seul le cœur brillant est vulnérable
       ------------------------------------------------------------ */
    {
      id: 'hydre', name: 'HYDRE-03 « RÉPLICANT »', color: C.magenta, sides: 6, r: 40,
      hpMul: 850, dmgMul: 1.4,
      hint: 'Frappe la copie dont le cœur brille — les autres sont des leurres',
      init(b, game) {
        b.decoys = [];
        b.swapT = 5;
        b.beamT = 2.5;
        b.spawnDecoys(game, 2);
      },
      update(b, dt, game) {
        b.decoys = b.decoys.filter(d => !d.dead);
        b.hint = 'Cœur allumé = cible réelle';

        /* échange de position : le vrai devient indiscernable */
        b.swapT -= dt;
        if (b.swapT <= 0) {
          b.swapT = b.phase >= 3 ? 3.6 : 5.2;
          if (b.decoys.length) {
            const d = U.pick(b.decoys);
            const tx = d.x, ty = d.y;
            d.x = b.x; d.y = b.y; b.x = tx; b.y = ty;
            FX.burst(b.x, b.y, 14, C.magenta, { speed: 220, life: .35, glow: true });
            FX.burst(d.x, d.y, 14, C.magenta, { speed: 220, life: .35, glow: true });
            b.coreOff = 1.1;                       // cœur masqué un instant
          }
        }
        if (b.coreOff > 0) b.coreOff -= dt;

        /* faisceaux croisés depuis chaque copie */
        b.beamT -= dt;
        if (b.beamT <= 0) {
          b.beamT = b.phase >= 3 ? 3.4 : 4.6;
          const all = [b].concat(b.decoys);
          for (const src of all) {
            const a = U.angle(src.x, src.y, game.player.x, game.player.y);
            game.hazards.push(new NF.Hazard({
              kind: 'beam', x: src.x, y: src.y, angle: a, len: 1500, width: 16,
              telegraph: .95, duration: .8, dmg: b.dmg, color: C.magenta,
              owner: src, followOwner: true
            }));
          }
        }

        b.driftTo(dt, game, 230, .5);
        for (const d of b.decoys) {
          const a = U.angle(d.x, d.y, game.player.x, game.player.y);
          const dd = U.dist(d.x, d.y, game.player.x, game.player.y);
          const dir = dd < 200 ? -.6 : .6;
          d.vx = U.lerp(d.vx, Math.cos(a) * 70 * dir, dt * 3);
          d.vy = U.lerp(d.vy, Math.sin(a) * 70 * dir, dt * 3);
        }
      },
      onPhase(b, game) {
        b.spawnDecoys(game, 1);
        game.toast('L\'HYDRE SE DÉDOUBLE', 'bad');
      },
      draw(b, ctx) {
        if (b.coreOff > 0) return;
        const pulse = .55 + .45 * Math.sin(performance.now() / 140);
        ctx.globalAlpha = pulse;
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(b.x, b.y, 11, 0, U.TAU); ctx.fill();
        ctx.globalAlpha = pulse * .5;
        ctx.beginPath(); ctx.arc(b.x, b.y, 20, 0, U.TAU); ctx.fill();
        ctx.globalAlpha = 1;
      }
    },

    /* ------------------------------------------------------------
       4 — BASTION : bouclier frontal, il faut le contourner
       ------------------------------------------------------------ */
    {
      id: 'bastion', name: 'BASTION-04 « ÉGIDE »', color: '#3ef2ff', sides: 5, r: 48,
      hpMul: 1350, dmgMul: 1.7,
      hint: 'Son bouclier bloque de face — attaque-le par derrière',
      init(b) {
        b.shieldA = 0; b.shieldArc = Math.PI * 0.78;
        b.snapT = 3; b.chargeT = 6; b.addT = 8; b.charging = 0;
      },
      update(b, dt, game) {
        const p = game.player;
        b.hint = 'Contourne le bouclier';

        /* le bouclier suit le joueur, avec un temps de retard */
        b.snapT -= dt;
        const want = U.angle(b.x, b.y, p.x, p.y);
        const rate = b.phase >= 3 ? 1.5 : (b.phase >= 2 ? 1.1 : .8);
        b.shieldA = U.turnTo(b.shieldA, want, rate * dt);

        /* charge télégraphiée */
        b.chargeT -= dt;
        if (b.charging > 0) {
          b.charging -= dt;
          b.vx = Math.cos(b.chargeA) * 640;
          b.vy = Math.sin(b.chargeA) * 640;
          FX.trail(b.x, b.y, '#3ef2ff', 5);
          if (U.dist2(b.x, b.y, p.x, p.y) < (b.r + p.r) * (b.r + p.r)) game.hurtPlayer(b.dmg * 1.4, b);
        } else if (b.chargeT <= 0) {
          b.chargeT = b.phase >= 3 ? 5 : 7.5;
          b.chargeA = want;
          b.charging = .55;
          game.hazards.push(new NF.Hazard({
            kind: 'beam', x: b.x, y: b.y, angle: want, len: 700, width: 60,
            telegraph: .8, duration: .01, dmg: 0, color: '#3ef2ff'
          }));
          game.toast('CHARGE IMMINENTE', 'warn');
        }

        /* déploiement de tourelles */
        b.addT -= dt;
        if (b.addT <= 0) {
          b.addT = b.phase >= 3 ? 8 : 12;
          for (let i = 0; i < (b.phase >= 2 ? 3 : 2); i++) {
            const pt = U.ringPoint(b.x, b.y, 120, 200);
            game.spawnAdd('addTurret', pt.x, pt.y, b.tierScale);
          }
          game.toast('TOURELLES DÉPLOYÉES');
        }

        if (b.charging <= 0) b.driftTo(dt, game, 190, .6);
        else { b.x += b.vx * dt; b.y += b.vy * dt; b.clampWorld(game); }
      },
      onPhase(b, game) {
        b.shieldArc = Math.max(Math.PI * .5, b.shieldArc - Math.PI * .12);
        game.toast('BOUCLIER RECONFIGURÉ', 'warn');
      },
      draw(b, ctx) {
        ctx.save();
        ctx.strokeStyle = '#3ef2ff';
        ctx.globalAlpha = .8; ctx.lineWidth = 7; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r + 14, b.shieldA - b.shieldArc / 2, b.shieldA + b.shieldArc / 2);
        ctx.stroke();
        ctx.globalAlpha = .18; ctx.lineWidth = 18;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r + 14, b.shieldA - b.shieldArc / 2, b.shieldA + b.shieldArc / 2);
        ctx.stroke();
        ctx.restore();
        ctx.globalAlpha = 1;
      },
      /** true ⇒ les dégâts venant de (x,y) sont bloqués */
      block(b, x, y) {
        const a = U.angle(b.x, b.y, x, y);
        return Math.abs(U.angleDiff(b.shieldA, a)) < b.shieldArc / 2;
      }
    },

    /* ------------------------------------------------------------
       5 — ARCHITECTE : grille laser + quadrant sûr + piliers
       ------------------------------------------------------------ */
    {
      id: 'architecte', name: 'OMEGA-05 « ARCHITECTE »', color: '#c58bff', sides: 4, r: 44,
      hpMul: 1550, dmgMul: 1.6,
      hint: 'Détruis les piliers et réfugie-toi dans le quadrant sûr',
      init(b, game) {
        b.pillars = [];
        b.gridA = 0;
        b.quadT = 6;
        b.swarmT = 5;
        b.spawnPillars(game, 4);
        b.gridBeams = [];
      },
      update(b, dt, game) {
        b.pillars = b.pillars.filter(p => !p.dead);
        const alive = b.pillars.length;
        b.hint = alive ? `Piliers : ${alive} — la grille tourne` : 'Grille désactivée — attaque !';

        /* grille laser tant qu'il reste des piliers */
        if (alive > 0) {
          b.gridT = (b.gridT || 0) - dt;
          b.gridA += dt * (.25 + .12 * alive);
          if (b.gridT <= 0) {
            b.gridT = 3.2;
            for (let i = 0; i < 2; i++) {
              game.hazards.push(new NF.Hazard({
                kind: 'beam', x: b.x, y: b.y, angle: b.gridA + i * Math.PI / 2,
                len: 2000, width: 18, telegraph: .9, duration: 2.8,
                rotSpeed: .32, dmg: b.dmg * .9, color: '#c58bff',
                owner: b, followOwner: true
              }));
            }
          }
        }

        /* quadrants : trois zones dangereuses, une sûre */
        b.quadT -= dt;
        if (b.quadT <= 0) {
          b.quadT = b.phase >= 3 ? 6.5 : 9;
          const safe = U.randInt(0, 3);
          for (let q = 0; q < 4; q++) {
            if (q === safe) continue;
            const a = q * Math.PI / 2 + Math.PI / 4;
            game.hazards.push(new NF.Hazard({
              kind: 'zone', x: b.x + Math.cos(a) * 420, y: b.y + Math.sin(a) * 420,
              r: 400, telegraph: 1.4, duration: 1.6,
              dmg: b.dmg * 1.3, color: '#c58bff', tickRate: .5
            }));
          }
          game.toast('RECONFIGURATION DU SECTEUR', 'warn');
        }

        /* phase 3 : nuée continue */
        if (b.phase >= 3) {
          b.swarmT -= dt;
          if (b.swarmT <= 0) {
            b.swarmT = 4;
            for (let i = 0; i < 5; i++) {
              const pt = U.ringPoint(b.x, b.y, 200, 340);
              game.spawnAdd('swarm', pt.x, pt.y, b.tierScale);
            }
          }
        }

        b.driftTo(dt, game, 280, .3);
      },
      onPhase(b, game) {
        b.spawnPillars(game, 2);
        game.toast('NOUVEAUX PILIERS', 'bad');
      }
    }
  ];

  /* ============================================================
     Entité Boss
     ============================================================ */
  class Boss extends NF.Enemy {
    constructor(defIndex, tier, wave, scale, game) {
      super('bossBase', game.world.w / 2, 120, { hp: 1, dmg: 1, speed: 1 }, false);
      const def = BOSSES[defIndex];
      this.bdef = def;
      this.tier = tier;
      this.isBoss = true;
      this.name = def.name + (tier > 0 ? ' Mk ' + NF.romanize(tier + 1) : '');
      this.color = def.color;
      this.r = def.r;
      this.def = Object.assign({}, NF.ENEMY_TYPES.bossBase, { sides: def.sides, knockRes: 1 });

      this.maxHp = def.hpMul * scale.hp * (1 + tier * 0.35);
      this.hp = this.maxHp;
      this.dmg = 16 * scale.dmg * def.dmgMul;
      this.speed = 78 * (1 + tier * 0.06);
      this.xp = 60 + wave * 3;
      this.tierScale = scale;
      this.wave = wave;

      this.phase = 1;
      this.invuln = false;
      this.hint = def.hint;
      this.spinRate = .35;
      this.entryT = 1.2;

      const spot = U.ringPoint(game.player.x, game.player.y, 340, 420);
      this.x = U.clamp(spot.x, 80, game.world.w - 80);
      this.y = U.clamp(spot.y, 80, game.world.h - 80);

      def.init && def.init(this, game);
    }

    /* --- utilitaires partagés --- */
    driftTo(dt, game, wantDist, speedMul) {
      const p = game.player;
      const d = U.dist(this.x, this.y, p.x, p.y);
      const a = U.angle(this.x, this.y, p.x, p.y);
      const dir = d > wantDist * 1.15 ? 1 : (d < wantDist * .8 ? -1 : 0);
      const sp = this.speed * (speedMul == null ? 1 : speedMul);
      this.vx = U.lerp(this.vx, Math.cos(a) * sp * dir + Math.cos(a + Math.PI / 2) * sp * .35, dt * 2);
      this.vy = U.lerp(this.vy, Math.sin(a) * sp * dir + Math.sin(a + Math.PI / 2) * sp * .35, dt * 2);
      this.x += (this.vx + this.kx) * dt;
      this.y += (this.vy + this.ky) * dt;
      this.kx *= Math.max(0, 1 - 5 * dt); this.ky *= Math.max(0, 1 - 5 * dt);
      this.clampWorld(game);
    }

    clampWorld(game) {
      this.x = U.clamp(this.x, this.r, game.world.w - this.r);
      this.y = U.clamp(this.y, this.r, game.world.h - this.r);
    }

    spawnNodes(game) {
      this.nodes = [];
      for (let i = 0; i < this.nodeCount; i++) {
        const e = game.spawnAdd('node', this.x, this.y, this.tierScale);
        e.anchor = { boss: this, ang: i * U.TAU / this.nodeCount, rad: 165, spd: .55 };
        e.maxHp *= 1.6; e.hp = e.maxHp;
        this.nodes.push(e);
      }
      this.vulnT = 9;
    }

    spawnDecoys(game, n) {
      for (let i = 0; i < n; i++) {
        const pt = U.ringPoint(this.x, this.y, 150, 260);
        const d = game.spawnAdd('decoy', pt.x, pt.y, this.tierScale);
        d.maxHp = d.hp = 1e9;
        d.immune = true;
        d.dmg = this.dmg * .7;
        d.r = this.r;
        d.color = this.color;
        d.bossRef = this;
        this.decoys.push(d);
      }
    }

    spawnPillars(game, n) {
      for (let i = 0; i < n; i++) {
        const a = U.rand(0, U.TAU);
        const pt = { x: this.x + Math.cos(a) * 300, y: this.y + Math.sin(a) * 300 };
        const e = game.spawnAdd('pillar', pt.x, pt.y, this.tierScale);
        e.maxHp *= 1.2; e.hp = e.maxHp;
        e.onDeath = () => {
          this.hp -= this.maxHp * 0.06;
          FX.text(this.x, this.y - 60, 'SURCHARGE', C.lime, true);
        };
        this.pillars.push(e);
      }
    }

    /** Le bouclier du Bastion bloque-t-il ce tir ? */
    blocks(x, y) {
      return this.bdef.block ? this.bdef.block(this, x, y) : false;
    }

    update(dt, game) {
      if (this.hitFlash > 0) this.hitFlash -= dt;
      if (this.touchCd > 0) this.touchCd -= dt;
      if (this.slowT > 0) this.slowT -= dt;
      this.angle += this.spinRate * dt;

      if (this.entryT > 0) {                       // apparition
        this.entryT -= dt;
        return;
      }

      /* phases à 66 % et 33 % */
      const ratio = this.hp / this.maxHp;
      const wantPhase = ratio > .66 ? 1 : (ratio > .33 ? 2 : 3);
      if (wantPhase > this.phase) {
        this.phase = wantPhase;
        FX.screenFlash(this.color, .4); FX.kick(12); U.buzz([30, 60, 30]);
        game.toast('PHASE ' + this.phase, 'bad');
        this.bdef.onPhase && this.bdef.onPhase(this, game);
      }

      this.bdef.update(this, dt, game);

      /* contact */
      const p = game.player;
      if (p.alive && this.touchCd <= 0 && U.dist2(this.x, this.y, p.x, p.y) < (this.r + p.r) * (this.r + p.r)) {
        this.touchCd = .8;
        game.hurtPlayer(this.dmg * .8, this);
      }
    }

    draw(ctx) {
      const flash = this.hitFlash > 0;
      const scale = this.entryT > 0 ? U.clamp(1.6 - this.entryT, .1, 1) : 1;
      const r = this.r * scale;

      /* aura */
      ctx.globalAlpha = .2; ctx.fillStyle = this.color;
      ctx.beginPath(); ctx.arc(this.x, this.y, r * 1.9, 0, U.TAU); ctx.fill();
      ctx.globalAlpha = 1;

      if (this.invuln) {
        NF.Draw.ring(ctx, this.x, this.y, r + 12 + Math.sin(performance.now() / 180) * 3, '#ffd23e', 3, .7);
      }

      ctx.fillStyle = flash ? '#fff' : '#0d0a1e';
      ctx.strokeStyle = flash ? '#fff' : this.color;
      ctx.lineWidth = 3;
      NF.Draw.poly(ctx, this.x, this.y, r, this.def.sides, this.angle);
      ctx.fill(); ctx.stroke();
      NF.Draw.poly(ctx, this.x, this.y, r * .6, this.def.sides, -this.angle * 1.7);
      ctx.stroke();

      ctx.fillStyle = this.color;
      ctx.beginPath(); ctx.arc(this.x, this.y, r * .22, 0, U.TAU); ctx.fill();

      this.bdef.draw && this.bdef.draw(this, ctx);
    }
  }

  NF.Boss = Boss;

  /** Quel boss pour cette vague ? (cycle infini avec paliers) */
  NF.bossForWave = function (wave) {
    const n = Math.floor(wave / 10) - 1;            // 10 → 0, 20 → 1 …
    return { index: ((n % BOSSES.length) + BOSSES.length) % BOSSES.length, tier: Math.floor(n / BOSSES.length) };
  };

})(window);
