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
    bossBase: { name: 'Boss', ai: 'none', hp: 1, dmg: 20, speed: 60, r: 46, xp: 0, color: C.magenta, sides: 6, mw: {}, weight: 0 },
    node: { name: 'Nœud', ai: 'anchor', hp: 60, dmg: 12, speed: 0, r: 16, xp: 6, color: '#ffd23e', sides: 3, mw: {}, weight: 0 },
    pillar: { name: 'Pilier', ai: 'none', hp: 140, dmg: 14, speed: 0, r: 22, xp: 10, color: '#c58bff', sides: 4, mw: {}, weight: 0, knockRes: 1 },
    decoy: { name: 'Leurre', ai: 'decoy', hp: 1, dmg: 16, speed: 70, r: 40, xp: 0, color: C.magenta, sides: 6, mw: {}, weight: 0, knockRes: 1 },
    addTurret: { name: 'Tourelle', ai: 'kite', hp: 55, dmg: 10, speed: 40, r: 14, xp: 5, color: '#ff8a3e', sides: 4, mw: {}, weight: 0, range: 300, fireCd: 1.4 },
    pod: { name: 'Couveuse', ai: 'none', hp: 110, dmg: 12, speed: 0, r: 24, xp: 14, color: '#ff6b4d', sides: 6, mw: {}, weight: 0, knockRes: 1 }
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
    },

    /* ============================================================
       SECTEUR 2 — LA FAILLE
       ============================================================ */

    /* ------------------------------------------------------------
       6 — CHIMÈRE : rejoue une mécanique différente à chaque phase
       ------------------------------------------------------------ */
    {
      id: 'chimere', name: 'SYNTHÈSE-06 « CHIMÈRE »', color: '#ff6b4d', sides: 7, r: 46,
      hpMul: 2100, dmgMul: 1.7,
      hint: 'Elle rejoue les défenses que tu as déjà brisées',
      init(b, game) {
        b.nodeCount = 3;
        b.nodes = [];
        b.decoys = [];
        b.shieldA = 0; b.shieldArc = Math.PI * .8;
        b.salvoT = 3;
        b.spawnNodes(game);
        b.hint = 'Phase 1 — détruis les nœuds';
      },
      update(b, dt, game) {
        const p = game.player;

        if (b.phase === 1) {
          b.nodes = b.nodes.filter(n => !n.dead);
          b.invuln = b.nodes.length > 0;
          b.hint = b.invuln ? `Phase 1 — nœuds restants : ${b.nodes.length}` : 'Noyau exposé !';
          if (!b.invuln) {
            b.vulnT -= dt;
            if (b.vulnT <= 0) b.spawnNodes(game);
          }
        } else if (b.phase === 2) {
          /* bouclier frontal : il faut la contourner */
          b.invuln = false;
          b.hint = 'Phase 2 — frappe-la dans le dos';
          b.shieldA = U.turnTo(b.shieldA, U.angle(b.x, b.y, p.x, p.y), 1.15 * dt);
        } else {
          /* leurres : seule celle au cœur allumé encaisse */
          b.invuln = false;
          b.hint = 'Phase 3 — vise le cœur allumé';
          b.decoys = b.decoys.filter(d => !d.dead);
          b.swapT = (b.swapT || 4) - dt;
          if (b.swapT <= 0) {
            b.swapT = 4.2;
            if (b.decoys.length) {
              const d = U.pick(b.decoys);
              const tx = d.x, ty = d.y;
              d.x = b.x; d.y = b.y; b.x = tx; b.y = ty;
              FX.burst(b.x, b.y, 12, b.color, { speed: 200, life: .35, glow: true });
              b.coreOff = .9;
            }
          }
          if (b.coreOff > 0) b.coreOff -= dt;
        }

        /* salve commune à toutes les phases */
        b.salvoT -= dt;
        if (b.salvoT <= 0) {
          b.salvoT = 3.4 - b.phase * .4;
          const base = U.angle(b.x, b.y, p.x, p.y);
          for (let i = -2; i <= 2; i++) {
            game.enemyShoot(b, base + i * .2, { speed: 250, dmg: b.dmg * .5, r: 6, color: b.color });
          }
        }
        b.driftTo(dt, game, 240, .7);
      },
      onPhase(b, game) {
        for (const n of b.nodes) if (!n.dead) n.dead = true;
        b.nodes = [];
        b.invuln = false;
        if (b.phase === 3) b.spawnDecoys(game, 2);
        game.toast('LA CHIMÈRE CHANGE DE DÉFENSE', 'bad');
        FX.screenFlash(b.color, .4);
      },
      draw(b, ctx) {
        if (b.phase === 2) {
          ctx.save();
          ctx.strokeStyle = b.color; ctx.lineCap = 'round';
          ctx.globalAlpha = .8; ctx.lineWidth = 7;
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.r + 14, b.shieldA - b.shieldArc / 2, b.shieldA + b.shieldArc / 2);
          ctx.stroke();
          ctx.restore(); ctx.globalAlpha = 1;
        }
        if (b.phase === 3 && !(b.coreOff > 0)) {
          const pulse = .5 + .5 * Math.sin(performance.now() / 140);
          ctx.globalAlpha = pulse; ctx.fillStyle = '#fff';
          ctx.beginPath(); ctx.arc(b.x, b.y, 11, 0, U.TAU); ctx.fill();
          ctx.globalAlpha = 1;
        }
      },
      block(b, x, y) {
        if (b.phase !== 2) return false;
        return Math.abs(U.angleDiff(b.shieldA, U.angle(b.x, b.y, x, y))) < b.shieldArc / 2;
      }
    },

    /* ------------------------------------------------------------
       7 — ORACLE : tire là où tu VAS, et mine le chemin parcouru
       ------------------------------------------------------------ */
    {
      id: 'oracle', name: 'ORACLE-07 « PRÉDICTEUR »', color: '#7dd3ff', sides: 3, r: 42,
      hpMul: 2450, dmgMul: 1.6,
      hint: 'Il vise ta trajectoire : change de direction après le marquage',
      init(b) {
        b.predT = 2;
        b.echoT = 5;
        b.trail = [];
        b.trailT = 0;
      },
      update(b, dt, game) {
        const p = game.player;
        b.hint = 'Change de cap quand le marqueur apparaît';

        /* mémorise le chemin du joueur */
        b.trailT -= dt;
        if (b.trailT <= 0) {
          b.trailT = .45;
          b.trail.push({ x: p.x, y: p.y });
          if (b.trail.length > 10) b.trail.shift();
        }

        /* tir prédictif : la zone vise la position anticipée */
        b.predT -= dt;
        if (b.predT <= 0) {
          b.predT = b.phase >= 3 ? 1.7 : (b.phase >= 2 ? 2.2 : 2.8);
          const shots = b.phase >= 2 ? 2 : 1;
          for (let i = 0; i < shots; i++) {
            const lead = 0.75 + i * 0.5 + (b.phase >= 3 ? .3 : 0);
            game.hazards.push(new NF.Hazard({
              kind: 'zone',
              x: U.clamp(p.x + p.vx * lead, 40, game.world.w - 40),
              y: U.clamp(p.y + p.vy * lead, 40, game.world.h - 40),
              r: 118, telegraph: .95, duration: .45,
              dmg: b.dmg * 1.25, color: '#7dd3ff', tickRate: .4
            }));
          }
        }

        /* échos : le chemin déjà parcouru devient dangereux */
        b.echoT -= dt;
        if (b.echoT <= 0) {
          b.echoT = b.phase >= 3 ? 5 : 7;
          const pts = b.trail.slice(-(b.phase >= 3 ? 6 : 4));
          for (const pt of pts) {
            game.hazards.push(new NF.Hazard({
              kind: 'zone', x: pt.x, y: pt.y, r: 92,
              telegraph: 1.2, duration: .4,
              dmg: b.dmg, color: '#4d8fff', tickRate: .4
            }));
          }
          game.toast('ÉCHO TEMPOREL', 'warn');
        }

        b.driftTo(dt, game, 330, .8);
      },
      onPhase(b, game) {
        game.toast('PRÉDICTION AFFINÉE', 'bad');
        b.trail.length = 0;
      },
      draw(b, ctx) {
        /* fil reliant les positions mémorisées */
        if (b.trail.length < 2) return;
        ctx.globalAlpha = .18; ctx.strokeStyle = '#7dd3ff'; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(b.trail[0].x, b.trail[0].y);
        for (const pt of b.trail) ctx.lineTo(pt.x, pt.y);
        ctx.stroke(); ctx.globalAlpha = 1;
      }
    },

    /* ------------------------------------------------------------
       8 — RUCHE : le corps est blindé, ce sont les couveuses la cible
       ------------------------------------------------------------ */
    {
      id: 'ruche', name: 'ESSAIM-08 « RUCHE »', color: '#ffb43e', sides: 6, r: 50,
      hpMul: 2200, dmgMul: 1.5,
      hint: 'Détruis les couveuses : chacune arrache 15 % de sa coque',
      init(b, game) {
        b.pods = [];
        b.podRespawn = 0;
        b.spawnPods(game, 3);
        b.sweepT = 4;
      },
      update(b, dt, game) {
        b.pods = b.pods.filter(p => !p.dead);
        b.invuln = b.pods.length > 0;
        b.hint = b.invuln
          ? `Couveuses actives : ${b.pods.length} — la coque est scellée`
          : 'Coque ouverte — frappe !';

        /* les couveuses recrachent des nuées */
        for (const pod of b.pods) {
          pod.broodT = (pod.broodT || U.rand(1, 3)) - dt;
          if (pod.broodT <= 0) {
            pod.broodT = b.phase >= 3 ? 3 : 4.5;
            if (game.enemies.length < 85) {
              const pt = U.ringPoint(pod.x, pod.y, 28, 50);
              game.spawnAdd('swarm', pt.x, pt.y, b.tierScale);
            }
          }
        }

        if (!b.invuln) {
          b.podRespawn -= dt;
          if (b.podRespawn <= 0) {
            const n = Math.max(1, 4 - b.phase);      // de moins en moins nombreuses
            b.spawnPods(game, n);
            game.toast('NOUVELLES COUVEUSES', 'warn');
          }
        }

        /* balayage de la ruche */
        b.sweepT -= dt;
        if (b.sweepT <= 0) {
          b.sweepT = b.phase >= 3 ? 4 : 6;
          const off = U.rand(0, U.TAU);
          for (let i = 0; i < 3; i++) {
            game.hazards.push(new NF.Hazard({
              kind: 'beam', x: b.x, y: b.y, angle: off + i * U.TAU / 3,
              len: 1500, width: 15, telegraph: .9, duration: 2.2,
              rotSpeed: .45, dmg: b.dmg, color: '#ffb43e',
              owner: b, followOwner: true
            }));
          }
        }

        b.driftTo(dt, game, 300, .45);
      },
      onPhase(b, game) {
        game.toast('LA RUCHE S\'AGITE', 'bad');
      }
    },

    /* ------------------------------------------------------------
       9 — PARADOXE : inverse tes commandes, mais s'expose en échange
       ------------------------------------------------------------ */
    {
      id: 'paradoxe', name: 'PARADOXE-09 « MIROIR »', color: '#c58bff', sides: 4, r: 44,
      hpMul: 2600, dmgMul: 1.55,
      hint: 'Pendant l\'inversion il encaisse le double : profites-en',
      init(b) {
        b.invT = 8;
        b.warned = false;
        b.mirrorT = 3;
      },
      update(b, dt, game) {
        const inverted = game.invertT > 0;
        b.hint = inverted
          ? 'INVERSION — dégâts doublés sur lui !'
          : 'Prépare-toi : l\'inversion arrive';
        b.dmgTaken = inverted ? 2 : 1;

        /* cycle d'inversion, annoncé une seconde à l'avance */
        b.invT -= dt;
        if (!b.warned && b.invT <= 1.2) {
          b.warned = true;
          game.toast('INVERSION IMMINENTE', 'bad');
          FX.screenFlash('#c58bff', .3);
        }
        if (b.invT <= 0) {
          b.invT = b.phase >= 3 ? 9 : 12;
          b.warned = false;
          game.invertT = b.phase >= 3 ? 6 : 4.5;
          U.buzz([30, 50, 30]);
        }

        /* faisceaux en miroir, symétriques par rapport au boss */
        b.mirrorT -= dt;
        if (b.mirrorT <= 0) {
          b.mirrorT = b.phase >= 3 ? 3.4 : 4.6;
          const a = U.angle(b.x, b.y, game.player.x, game.player.y);
          for (const off of [0, Math.PI]) {
            game.hazards.push(new NF.Hazard({
              kind: 'beam', x: b.x, y: b.y, angle: a + off,
              len: 1500, width: 17, telegraph: .9, duration: 1.6,
              rotSpeed: .3, dmg: b.dmg, color: '#c58bff',
              owner: b, followOwner: true
            }));
          }
        }

        b.driftTo(dt, game, 260, .6);
      },
      onPhase(b, game) {
        game.toast('LE MIROIR SE FISSURE', 'bad');
        for (let i = 0; i < 3; i++) {
          const pt = U.ringPoint(b.x, b.y, 140, 240);
          game.spawnAdd('phantom', pt.x, pt.y, b.tierScale);
        }
      },
      draw(b, ctx) {
        if (!(b.dmgTaken > 1)) return;
        NF.Draw.ring(ctx, b.x, b.y, b.r + 16 + Math.sin(performance.now() / 120) * 4, '#fff', 3, .8);
      }
    },

    /* ------------------------------------------------------------
       10 — ABYSSE : dévore ses sbires pour se soigner, referme l'arène
       ------------------------------------------------------------ */
    {
      id: 'abysse', name: 'ABYSSE-10 « DÉVOREUSE »', color: '#8b5cff', sides: 8, r: 52,
      hpMul: 3200, dmgMul: 1.7,
      hint: 'Tue ses sbires avant qu\'elle ne les avale',
      init(b) {
        b.feedT = 7;
        b.brood = [];
        b.ringT = 14;
        b.pullT = 0;
      },
      update(b, dt, game) {
        const p = game.player;
        b.brood = b.brood.filter(e => !e.dead);
        b.hint = b.brood.length
          ? `Elle va avaler ${b.brood.length} sbire${b.brood.length > 1 ? 's' : ''}`
          : 'Reste hors de son puits';

        /* aspiration permanente */
        const d = U.dist(b.x, b.y, p.x, p.y);
        if (d > 40 && d < 640) {
          const a = U.angle(p.x, p.y, b.x, b.y);
          const pull = (b.phase >= 3 ? 120 : 80) * (1 - d / 640);
          p.x += Math.cos(a) * pull * dt;
          p.y += Math.sin(a) * pull * dt;
        }

        /* elle invoque, puis dévore ce qui a survécu */
        b.feedT -= dt;
        if (b.feedT <= 0) {
          if (b.brood.length) {
            let healed = 0;
            for (const e of b.brood) {
              if (e.dead) continue;
              e.dead = true; healed++;
              game.zaps.push(new NF.Zap(e.x, e.y, b.x, b.y, '#8b5cff'));
              FX.burst(e.x, e.y, 8, '#8b5cff', { speed: 200, life: .4 });
            }
            if (healed) {
              b.hp = Math.min(b.maxHp, b.hp + b.maxHp * 0.03 * healed);
              game.toast('ELLE SE NOURRIT (+' + (3 * healed) + ' %)', 'bad');
              FX.screenFlash('#8b5cff', .3);
            }
            b.brood = [];
            b.feedT = 3;
          } else {
            b.feedT = b.phase >= 3 ? 7 : 9;
            const n = b.phase >= 3 ? 4 : 3;
            for (let i = 0; i < n; i++) {
              const pt = U.ringPoint(b.x, b.y, 180, 300);
              const e = game.spawnAdd(U.pick(['phantom', 'harrier', 'warden']), pt.x, pt.y, b.tierScale);
              e.devoured = true;
              b.brood.push(e);
            }
            game.toast('ELLE INVOQUE — TUE-LES VITE', 'warn');
          }
        }

        /* l'arène se referme */
        b.ringT -= dt;
        if (b.ringT <= 0) {
          b.ringT = 22;
          game.hazards.push(new NF.Hazard({
            kind: 'ring', x: b.x, y: b.y, r: 4000, rInner: 700,
            telegraph: 1.4, duration: 9, shrink: 62, rMin: 260,
            dmg: b.dmg * 1.2, color: '#8b5cff', owner: b, followOwner: true,
            tickRate: .55
          }));
          game.toast('L\'ABYSSE SE REFERME', 'bad');
        }

        b.driftTo(dt, game, 220, .4);
      },
      onPhase(b, game) {
        game.toast('PHASE ' + b.phase + ' — ELLE S\'AFFAME', 'bad');
        b.feedT = Math.min(b.feedT, 3);
      },
      draw(b, ctx) {
        /* halo de gravité */
        ctx.globalAlpha = .1; ctx.fillStyle = '#8b5cff';
        ctx.beginPath(); ctx.arc(b.x, b.y, 640, 0, U.TAU); ctx.fill();
        ctx.globalAlpha = 1;
        for (const e of b.brood) {
          if (e.dead) continue;
          ctx.globalAlpha = .3; ctx.strokeStyle = '#8b5cff'; ctx.lineWidth = 1.5;
          ctx.setLineDash([6, 6]);
          ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(e.x, e.y); ctx.stroke();
          ctx.setLineDash([]); ctx.globalAlpha = 1;
        }
      }
    },

    /* ============================================================
       SECTEUR 3 — LE NOYAU
       Ces boss sortent du cadre : séquences d'action rapide et
       phases jouées ailleurs que sur la carte.
       ============================================================ */

    /* ------------------------------------------------------------
       11 — CREUSET : chaque phase se conclut par un QTE de purge
       ------------------------------------------------------------ */
    {
      id: 'creuset', name: 'FORGE-11 « CREUSET »', color: '#ff8a3e', sides: 5, r: 48,
      hpMul: 3000, dmgMul: 1.6,
      hint: 'Il surchauffe : réussis la purge quand elle se déclenche',
      init(b) {
        b.heat = 0;
        b.purges = 0;          // purges réussies
        b.venting = false;
        b.spitT = 2.5;
      },
      update(b, dt, game) {
        /* la chaleur monte ; à saturation, il se verrouille et lance le QTE */
        if (!b.venting) {
          b.heat += dt * (7 + b.phase * 2.5);
          b.hint = `Surchauffe ${Math.min(100, Math.round(b.heat))} % — purges réussies : ${b.purges}/3`;
          if (b.heat >= 100) {
            b.venting = true;
            b.invuln = true;
            game.toast('SURCHAUFFE CRITIQUE', 'bad');
            NF.QTE.start(game, {
              type: 'timing',
              title: 'PURGE THERMIQUE',
              hint: 'Touche quand le curseur entre dans la zone verte',
              rounds: b.phase,                 // de plus en plus exigeant
              speed: 1.05 + b.phase * 0.35,
              width: 0.24,
              color: '#ff8a3e',
              onWin: (g) => {
                b.venting = false; b.invuln = false; b.heat = 0; b.purges++;
                const dmg = b.maxHp * 0.14;
                g.damageEnemy(b, dmg, { silent: true, source: 'qte' });
                FX.text(b.x, b.y - 60, 'PURGE RÉUSSIE', C.lime, true);
                g.toast('CIRCUITS PURGÉS', 'good');
              },
              onLose: (g) => {
                b.venting = false; b.invuln = false; b.heat = 30;
                b.hp = Math.min(b.maxHp, b.hp + b.maxHp * 0.06);
                g.toast('LE CREUSET SE RÉGÉNÈRE', 'bad');
                /* l'arène crache du magma */
                for (let i = 0; i < 6; i++) {
                  const pt = U.ringPoint(g.player.x, g.player.y, 60, 260);
                  g.hazards.push(new NF.Hazard({
                    kind: 'zone', x: pt.x, y: pt.y, r: 96,
                    telegraph: .9, duration: .5, dmg: b.dmg,
                    color: '#ff8a3e', tickRate: .4
                  }));
                }
              }
            });
            return;
          }
        }

        /* crachats de magma en continu */
        b.spitT -= dt;
        if (b.spitT <= 0) {
          b.spitT = b.phase >= 3 ? 1.9 : 2.8;
          const p = game.player;
          for (let i = 0; i < 1 + b.phase; i++) {
            const pt = U.ringPoint(p.x, p.y, 0, 110);
            game.hazards.push(new NF.Hazard({
              kind: 'zone', x: pt.x, y: pt.y, r: 88,
              telegraph: 1.05, duration: .45, dmg: b.dmg * .9,
              color: '#ff8a3e', tickRate: .4
            }));
          }
        }
        b.driftTo(dt, game, 250, .55);
      },
      onPhase(b, game) {
        game.toast('LE CREUSET S\'EMBRASE', 'bad');
        b.heat = Math.max(b.heat, 55);
      },
      draw(b, ctx) {
        /* jauge de chaleur autour du boss */
        const k = U.clamp(b.heat / 100, 0, 1);
        ctx.strokeStyle = '#ff8a3e'; ctx.lineWidth = 5; ctx.lineCap = 'round';
        ctx.globalAlpha = .25;
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r + 15, 0, U.TAU); ctx.stroke();
        ctx.globalAlpha = .95;
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r + 15, -Math.PI / 2, -Math.PI / 2 + k * U.TAU); ctx.stroke();
        ctx.globalAlpha = 1;
      }
    },

    /* ------------------------------------------------------------
       12 — ORBITALE : phase 2 jouée en défense orbitale
       ------------------------------------------------------------ */
    {
      id: 'orbitale', name: 'ORBITE-12 « SENTINELLE »', color: '#7dd3ff', sides: 4, r: 46,
      hpMul: 2500, dmgMul: 1.5,
      hint: 'Elle finira par t\'expédier en orbite : tiens la ligne',
      init(b) {
        b.beamT = 3;
        b.sent = false;
      },
      update(b, dt, game) {
        b.hint = b.sent ? 'Retour en arène — finis-la' : 'Elle prépare un transfert orbital';

        b.beamT -= dt;
        if (b.beamT <= 0) {
          b.beamT = b.phase >= 3 ? 3.2 : 4.4;
          const a = U.angle(b.x, b.y, game.player.x, game.player.y);
          for (let i = 0; i < 2; i++) {
            game.hazards.push(new NF.Hazard({
              kind: 'beam', x: b.x, y: b.y, angle: a + i * Math.PI / 2,
              len: 1600, width: 16, telegraph: .9, duration: 1.8,
              rotSpeed: .38, dmg: b.dmg, color: '#7dd3ff',
              owner: b, followOwner: true
            }));
          }
        }
        b.driftTo(dt, game, 280, .6);
      },
      onPhase(b, game) {
        /* au passage en phase 2 : transfert dans la défense orbitale */
        if (b.phase !== 2 || b.sent) { game.toast('SENTINELLE RECONFIGURÉE', 'bad'); return; }
        b.sent = true;
        b.invuln = true;
        NF.Interlude.start(game, {
          mode: 'invaders',
          title: 'TRANSFERT ORBITAL',
          subtitle: 'Détruis la formation avant qu\'elle n\'atteigne la ligne',
          duration: 20, hp: 3, color: '#7dd3ff',
          onWin: (g) => {
            b.invuln = false;
            g.damageEnemy(b, b.maxHp * 0.3, { silent: true, source: 'interlude' });
            FX.text(b.x, b.y - 60, 'RELAIS DÉTRUIT', C.lime, true);
            g.toast('ORBITE NETTOYÉE — ELLE ENCAISSE', 'good');
          },
          onLose: (g) => {
            b.invuln = false;
            b.hp = Math.min(b.maxHp, b.hp + b.maxHp * 0.1);
            g.toast('LA SENTINELLE SE RECHARGE', 'bad');
          }
        });
      }
    },

    /* ------------------------------------------------------------
       13 — CONDUIT : deux passages en course d'obstacles
       ------------------------------------------------------------ */
    {
      id: 'conduit', name: 'CIRCUIT-13 « TRACEUR »', color: '#9dff4d', sides: 3, r: 44,
      hpMul: 2400, dmgMul: 1.55,
      hint: 'Il t\'aspire dans ses conduits : saute ou percute',
      init(b) {
        b.runs = 0;
        b.dashT = 4;
      },
      update(b, dt, game) {
        b.hint = `Conduits traversés : ${b.runs}/2`;
        /* charges rectilignes entre deux conduits */
        b.dashT -= dt;
        if (b.dashT <= 0) {
          b.dashT = b.phase >= 3 ? 3.4 : 5;
          const a = U.angle(b.x, b.y, game.player.x, game.player.y);
          game.hazards.push(new NF.Hazard({
            kind: 'beam', x: b.x, y: b.y, angle: a,
            len: 1500, width: 40, telegraph: .85, duration: .5,
            dmg: b.dmg * 1.2, color: '#9dff4d', owner: b, followOwner: true
          }));
          for (let i = 0; i < 8; i++) {
            game.enemyShoot(b, a + (i - 3.5) * .16, { speed: 260, dmg: b.dmg * .5, r: 6, color: '#9dff4d' });
          }
        }
        b.driftTo(dt, game, 240, .7);
      },
      onPhase(b, game) {
        if (b.phase > 3 || b.runs >= 2) return;
        b.runs++;
        b.invuln = true;
        NF.Interlude.start(game, {
          mode: 'conduit',
          title: 'CONDUIT DE DONNÉES',
          subtitle: 'DASH ou ULT pour sauter — double saut autorisé',
          duration: 14 + b.runs * 3, hp: 3, color: '#9dff4d',
          onWin: (g) => {
            b.invuln = false;
            g.damageEnemy(b, b.maxHp * 0.28, { silent: true, source: 'interlude' });
            g.toast('CONDUIT TRAVERSÉ', 'good');
          },
          onLose: (g) => {
            b.invuln = false;
            b.hp = Math.min(b.maxHp, b.hp + b.maxHp * 0.08);
            g.toast('ÉJECTÉ DU CONDUIT', 'bad');
          }
        });
      }
    },

    /* ------------------------------------------------------------
       14 — RÉSONANCE : bouclier brisé au martèlement
       ------------------------------------------------------------ */
    {
      id: 'resonance', name: 'ÉCHO-14 « RÉSONANCE »', color: '#c58bff', sides: 8, r: 46,
      hpMul: 2700, dmgMul: 1.5,
      hint: 'Son bouclier ne cède qu\'au martèlement',
      init(b) {
        b.shielded2 = true;
        b.invuln = true;
        b.ringT = 2.5;
        b.breaks = 0;
        b.qteT = 3;
      },
      update(b, dt, game) {
        b.hint = b.breaks >= 3
          ? 'Bouclier hors service — achève-la'
          : (b.invuln
            ? 'Bouclier actif — attends la fenêtre de résonance'
            : `Bouclier brisé (${b.breaks}/3) — frappe !`);

        /* anneaux concentriques à esquiver */
        b.ringT -= dt;
        if (b.ringT <= 0) {
          b.ringT = b.phase >= 3 ? 2.6 : 3.6;
          game.hazards.push(new NF.Hazard({
            kind: 'ring', x: b.x, y: b.y, r: 150, rInner: 96,
            telegraph: .8, duration: 3, grow: 210,
            dmg: b.dmg, color: '#c58bff', owner: b, followOwner: true, tickRate: .6
          }));
        }

        /* le bouclier se reforme et rouvre une fenêtre de martèlement */
        if (b.invuln) {
          b.qteT -= dt;
          if (b.qteT <= 0) {
            b.qteT = 999;
            NF.QTE.start(game, {
              type: 'mash',
              title: 'BRISER LA RÉSONANCE',
              hint: 'Martèle l\'écran pour saturer son bouclier',
              rounds: 1,
              taps: 16 + Math.min(2, b.breaks) * 7,
              time: 4.5,
              color: '#c58bff',
              onWin: (g) => {
                b.invuln = false; b.breaks++;
                b.openT = 9;
                FX.shockwave(b.x, b.y, 260, '#c58bff', .6);
                g.toast(b.breaks >= 3 ? 'BOUCLIER HORS SERVICE' : 'BOUCLIER SATURÉ', 'good');
              },
              onLose: (g) => {
                b.qteT = 7;
                g.hurtPlayer(b.dmg * 1.2, b);
                g.toast('RÉSONANCE INTACTE', 'bad');
              }
            });
            return;
          }
        } else if (b.breaks < 3) {
          /* au troisième bris le bouclier ne se reforme plus : course finale */
          b.openT -= dt;
          if (b.openT <= 0) { b.invuln = true; b.qteT = 4; game.toast('LE BOUCLIER SE REFORME', 'warn'); }
        }

        b.driftTo(dt, game, 260, .45);
      },
      onPhase(b, game) {
        game.toast('FRÉQUENCE MODIFIÉE', 'bad');
        b.qteT = Math.min(b.qteT, 2);
      }
    },

    /* ------------------------------------------------------------
       15 — CŒUR DU PROTOCOLE : QTE, orbite, puis affrontement final
       ------------------------------------------------------------ */
    {
      id: 'coeur', name: 'NOYAU-15 « CŒUR DU PROTOCOLE »', color: '#ffd23e', sides: 12, r: 54,
      hpMul: 2200, dmgMul: 1.65,
      hint: 'Le protocole lui-même. Il te testera sur tous les tableaux.',
      init(b) {
        b.salvoT = 2;
        b.beamT = 4;
        b.trialsDone = 0;
      },
      update(b, dt, game) {
        b.hint = `Épreuves franchies : ${b.trialsDone}/2 — phase ${b.phase}`;

        /* salves radiales */
        b.salvoT -= dt;
        if (b.salvoT <= 0) {
          b.salvoT = b.phase >= 3 ? 1.8 : 2.6;
          const off = U.rand(0, U.TAU);
          const n = 10 + b.phase * 4;
          for (let i = 0; i < n; i++) {
            game.enemyShoot(b, off + i * U.TAU / n, {
              speed: 200, dmg: b.dmg * .45, r: 6, color: '#ffd23e', life: 7
            });
          }
        }

        /* balayage croisé */
        b.beamT -= dt;
        if (b.beamT <= 0) {
          b.beamT = b.phase >= 3 ? 3.6 : 5.2;
          const a = U.rand(0, U.TAU);
          for (let i = 0; i < 3; i++) {
            game.hazards.push(new NF.Hazard({
              kind: 'beam', x: b.x, y: b.y, angle: a + i * U.TAU / 3,
              len: 1800, width: 18, telegraph: .9, duration: 2.4,
              rotSpeed: .34, dmg: b.dmg, color: '#ffd23e',
              owner: b, followOwner: true
            }));
          }
        }

        b.driftTo(dt, game, 270, .5);
      },
      onPhase(b, game) {
        b.invuln = true;
        if (b.phase === 2) {
          /* première épreuve : purge en trois temps */
          NF.QTE.start(game, {
            type: 'timing',
            title: 'PROTOCOLE — ÉPREUVE 1',
            hint: 'Trois synchronisations d\'affilée',
            rounds: 3, speed: 1.7, width: 0.2, color: '#ffd23e',
            onWin: (g) => {
              b.invuln = false; b.trialsDone++;
              g.damageEnemy(b, b.maxHp * 0.12, { silent: true, source: 'qte' });
              g.toast('ÉPREUVE FRANCHIE', 'good');
            },
            onLose: (g) => {
              b.invuln = false;
              g.hurtPlayer(b.dmg * 1.6, b);
              g.toast('ÉPREUVE ÉCHOUÉE', 'bad');
            }
          });
        } else {
          /* seconde épreuve : défense orbitale */
          NF.Interlude.start(game, {
            mode: 'invaders',
            title: 'PROTOCOLE — ÉPREUVE 2',
            subtitle: 'Le cœur t\'expulse : tiens la ligne orbitale',
            duration: 22, hp: 2, color: '#ffd23e',
            onWin: (g) => {
              b.invuln = false; b.trialsDone++;
              g.damageEnemy(b, b.maxHp * 0.2, { silent: true, source: 'interlude' });
              g.toast('LE CŒUR VACILLE', 'good');
            },
            onLose: (g) => {
              b.invuln = false;
              b.hp = Math.min(b.maxHp, b.hp + b.maxHp * 0.08);
              g.toast('LE CŒUR SE RECOMPOSE', 'bad');
            }
          });
        }
      },
      draw(b, ctx) {
        /* anneaux du cœur */
        ctx.strokeStyle = '#ffd23e'; ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
          ctx.globalAlpha = .3 - i * .07;
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.r + 20 + i * 16, performance.now() / (900 + i * 300), performance.now() / (900 + i * 300) + 2.4);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
    }
  ];

  /* ============================================================
     Entité Boss
     ============================================================ */
  NF.bossDefById = id => BOSSES.find(b => b.id === id);

  class Boss extends NF.Enemy {
    constructor(defId, tier, wave, scale, game) {
      super('bossBase', game.world.w / 2, 120, { hp: 1, dmg: 1, speed: 1 }, false);
      const def = NF.bossDefById(defId) || BOSSES[0];
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

    /** Couveuses de la RUCHE : posées loin du boss, elles crachent des nuées */
    spawnPods(game, n) {
      this.pods = this.pods || [];
      for (let i = 0; i < n; i++) {
        const a = U.rand(0, U.TAU);
        const rad = U.rand(320, 520);
        const e = game.spawnAdd('pod',
          U.clamp(this.x + Math.cos(a) * rad, 60, game.world.w - 60),
          U.clamp(this.y + Math.sin(a) * rad, 60, game.world.h - 60),
          this.tierScale);
        e.maxHp *= 1.4; e.hp = e.maxHp;
        e.onDeath = () => {
          this.hp -= this.maxHp * 0.15;
          FX.text(this.x, this.y - 60, 'COQUE ENTAMÉE', C.lime, true);
          FX.screenFlash('#ffb43e', .25);
        };
        this.pods.push(e);
      }
      this.podRespawn = 12;
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

})(window);
