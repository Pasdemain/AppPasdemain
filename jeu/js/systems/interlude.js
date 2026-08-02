/* ============================================================
   interlude.js — phases jouées hors de l'arène

   Un boss peut téléporter le joueur dans un mini-jeu le temps d'une
   phase, puis le renvoyer sur la carte. Pendant l'interlude, la boucle
   principale est mise de côté : c'est ce module qui met à jour et
   dessine, dans son propre repère écran.

   Deux formes :
     • invaders — le vaisseau glisse en bas, les colonnes descendent
     • conduit  — course d'obstacles, on saute pour ne pas percuter

   Dans les deux cas l'interlude renvoie « réussi » ou « raté », et le
   boss décide de la suite.
   ============================================================ */
(function (w) {
  'use strict';
  const NF = w.NF, U = NF.U, FX = NF.FX;

  const Interlude = NF.Interlude = {

    /** Démarre un interlude. opt.onWin / opt.onLose renvoient la main au boss. */
    start(game, opt) {
      if (game.interlude) return;
      const o = Object.assign({
        mode: 'invaders', title: '', subtitle: '',
        duration: 22, color: '#ffd23e', hp: 3,
        onWin: null, onLose: null
      }, opt);

      const st = {
        o, t: 0, intro: 1.6, outro: 0,
        hp: o.hp, done: false, won: false,
        shake: 0, invuln: 0,
        /* repère local : le mini-jeu occupe tout l'écran */
        w: game.view.w, h: game.view.h,
        px: game.view.w / 2, py: 0,
        vx: 0, vy: 0,
        bullets: [], foes: [], obstacles: [], parts: [],
        fireT: 0, spawnT: 0, scrollX: 0,
        onGround: true, jumps: 0
      };

      if (o.mode === 'invaders') {
        st.py = st.h - 110;
        this.buildFormation(st);
      } else {
        /* la piste reste au-dessus des boutons d'action : le pouce ne
           doit jamais masquer le vaisseau ni les obstacles */
        st.groundY = st.h - 250;
        st.py = st.groundY;
        st.speed = 320;
      }

      game.interlude = st;
      /* l'écran appartient au mini-jeu : on efface le HUD d'arène, et les
         boutons d'action avec lui quand ils ne servent à rien */
      document.body.classList.add('in-interlude');
      document.body.classList.toggle('no-action', o.mode === 'invaders');
      NF.Input.reset();
      FX.screenFlash('#fff', .8);
      U.buzz([50, 40, 80]);
      game.toast(o.title || 'TRANSFERT', 'bad');
    },

    /* ---------- Invaders : formation de colonnes ---------- */
    buildFormation(st) {
      const cols = 5, rows = 4;
      /* la formation reste nettement plus étroite que l'écran : sans marge
         de balayage elle rebondirait sur les deux bords en même temps et
         tomberait d'un bloc, ce qui rend le passage imperdable… ou plutôt
         ingagnable. */
      const spanX = Math.min(st.w * 0.62, 264);
      const stepX = spanX / (cols - 1);
      const left = (st.w - spanX) / 2;
      st.total = cols * rows;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          st.foes.push({
            x: left + c * stepX, y: 78 + r * 54,
            hp: 2 + r, r: 15, col: c, row: r, dead: false, fireT: U.rand(2, 9)
          });
        }
      }
      st.dir = 1;
      st.descend = 0;
    },

    /* ============================================================
       Mise à jour
       ============================================================ */
    update(dt, game) {
      const st = game.interlude;
      if (!st) return;
      st.t += dt;
      if (st.shake > 0) st.shake = Math.max(0, st.shake - 40 * dt);

      if (st.intro > 0) { st.intro -= dt; return; }
      if (st.done) {
        st.outro -= dt;
        if (st.outro <= 0) this.finish(game);
        return;
      }

      const mv = NF.Input.read();
      if (st.o.mode === 'invaders') this.updateInvaders(dt, game, st, mv);
      else this.updateConduit(dt, game, st, mv);

      /* particules locales */
      for (const p of st.parts) {
        p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt;
        if (p.t > p.life) p.dead = true;
      }
      U.prune(st.parts);

      /* fin au temps écoulé */
      if (st.t > st.o.duration + 1.6) this.win(game, st);
    },

    burst(st, x, y, n, color) {
      for (let i = 0; i < n; i++) {
        const a = U.rand(0, U.TAU), s = U.rand(60, 260);
        st.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: 0, life: U.rand(.25, .6), color, r: U.rand(2, 4) });
      }
    },

    hurt(game, st, dmg) {
      if (st.invuln > 0) return;
      st.invuln = 1;
      st.hp--;
      st.shake = 16;
      FX.screenFlash('#ff4d5e', .35);
      U.buzz(40);
      game.player.hurt(dmg, game);
      if (st.hp <= 0) this.lose(game, st);
    },

    win(game, st) {
      if (st.done) return;
      st.done = true; st.won = true; st.outro = 1.4;
      FX.screenFlash('#9dff4d', .6);
      U.buzz([30, 50, 30, 50, 90]);
    },

    lose(game, st) {
      if (st.done) return;
      st.done = true; st.won = false; st.outro = 1.4;
      FX.screenFlash('#ff4d5e', .6);
    },

    finish(game) {
      const st = game.interlude;
      game.interlude = null;
      document.body.classList.remove('in-interlude', 'no-action');
      game._last = performance.now();
      NF.Input.reset();
      game.player.invuln = Math.max(game.player.invuln, 1.2);
      FX.screenFlash('#fff', .7);
      const cb = st.won ? st.o.onWin : st.o.onLose;
      if (cb) cb(game);
    },

    /* ============================================================
       Mode 1 — INVADERS
       ============================================================ */
    updateInvaders(dt, game, st, mv) {
      if (st.invuln > 0) st.invuln -= dt;

      /* déplacement horizontal seulement */
      st.vx = U.lerp(st.vx, mv.x * 420, Math.min(1, dt * 12));
      st.px = U.clamp(st.px + st.vx * dt, 26, st.w - 26);

      /* tir automatique vers le haut */
      st.fireT -= dt;
      if (st.fireT <= 0) {
        st.fireT = 0.16;
        st.bullets.push({ x: st.px, y: st.py - 18, vy: -680, own: 1 });
      }

      /* la formation glisse et descend en butant sur les bords */
      const alive = st.foes.filter(f => !f.dead);
      if (!alive.length) { this.win(game, st); return; }
      /* plus il en reste peu, plus les survivants s'affolent */
      const speed = 40 + (st.total - alive.length) * 4.5;
      let minX = 1e9, maxX = -1e9;
      for (const f of alive) { minX = Math.min(minX, f.x); maxX = Math.max(maxX, f.x); }
      if (st.dir > 0 && maxX > st.w - 26) { st.dir = -1; st.descend = 34; }
      else if (st.dir < 0 && minX < 26) { st.dir = 1; st.descend = 34; }
      /* la descente est un palier, pas une chute continue */
      const drop = st.descend > 0 ? Math.min(st.descend, 90 * dt) : 0;
      if (drop) st.descend -= drop;
      for (const f of alive) {
        f.x += st.dir * speed * dt;
        if (drop) f.y += drop;
        /* tir ennemi */
        f.fireT -= dt;
        if (f.fireT <= 0) {
          f.fireT = U.rand(2.2, 6);
          st.bullets.push({ x: f.x, y: f.y + 16, vy: 300, own: 0 });
        }
        /* la formation atteint le sol : c'est perdu */
        if (f.y > st.py - 30) { this.lose(game, st); return; }
      }

      /* projectiles */
      for (const b of st.bullets) {
        b.y += b.vy * dt;
        if (b.y < -20 || b.y > st.h + 20) b.dead = true;
        if (b.own) {
          for (const f of alive) {
            if (f.dead) continue;
            if (Math.abs(b.x - f.x) < f.r + 4 && Math.abs(b.y - f.y) < f.r + 6) {
              b.dead = true; f.hp--;
              this.burst(st, f.x, f.y, 5, st.o.color);
              if (f.hp <= 0) { f.dead = true; this.burst(st, f.x, f.y, 14, st.o.color); }
              break;
            }
          }
        } else if (Math.abs(b.x - st.px) < 18 && Math.abs(b.y - st.py) < 20) {
          b.dead = true;
          this.hurt(game, st, 14 * (game.waves.scale ? game.waves.scale.dmg : 1));
        }
      }
      U.prune(st.bullets);
    },

    /* ============================================================
       Mode 2 — CONDUIT (course d'obstacles)
       ============================================================ */
    updateConduit(dt, game, st, mv) {
      if (st.invuln > 0) st.invuln -= dt;
      st.speed = 320 + st.t * 9;
      st.scrollX += st.speed * dt;

      /* saut : le bouton DASH ou un appui sur la moitié droite */
      if (NF.Input.consumeDash() || NF.Input.consumeUlt()) {
        if (st.onGround || st.jumps < 2) {
          st.vy = st.onGround ? -620 : -540;
          st.jumps = st.onGround ? 1 : 2;
          st.onGround = false;
          U.buzz(8);
          this.burst(st, st.px, st.py + 16, 5, '#3ef2ff');
        }
      }
      st.vy += 1650 * dt;
      st.py += st.vy * dt;
      if (st.py >= st.groundY) { st.py = st.groundY; st.vy = 0; st.onGround = true; st.jumps = 0; }

      /* génération d'obstacles */
      st.spawnT -= dt;
      if (st.spawnT <= 0) {
        st.spawnT = U.rand(0.75, 1.25) * (340 / st.speed) * 1.6;
        const kind = U.chance(.28) ? 'haut' : 'bas';
        st.obstacles.push({
          x: st.w + 40,
          h: kind === 'bas' ? U.rand(38, 76) : 52,
          kind,
          w: U.rand(22, 40)
        });
      }
      for (const o of st.obstacles) {
        o.x -= st.speed * dt;
        if (o.x < -60) o.dead = true;
        /* collision : boîte simple autour du vaisseau */
        const py = st.py, ph = 16;
        const oy = o.kind === 'bas' ? st.groundY - o.h : st.groundY - 150;
        const oh = o.kind === 'bas' ? o.h : 60;
        if (Math.abs(o.x - st.px) < o.w / 2 + 14 && py + ph > oy && py - ph < oy + oh) {
          o.dead = true;
          this.burst(st, o.x, oy + oh / 2, 12, '#ff4d5e');
          this.hurt(game, st, 16 * (game.waves.scale ? game.waves.scale.dmg : 1));
        }
      }
      U.prune(st.obstacles);
    },

    /* ============================================================
       Rendu
       ============================================================ */
    draw(ctx, game) {
      const st = game.interlude;
      if (!st) return;
      const W = st.w, H = st.h;
      const col = st.o.color;

      ctx.setTransform(game.dpr, 0, 0, game.dpr, 0, 0);
      ctx.fillStyle = '#04060e';
      ctx.fillRect(0, 0, W, H);

      ctx.save();
      if (st.shake > 0) ctx.translate(U.rand(-st.shake, st.shake), U.rand(-st.shake, st.shake));

      /* fond : grille en fuite */
      ctx.strokeStyle = 'rgba(255,255,255,.05)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      const off = (st.o.mode === 'conduit' ? st.scrollX : st.t * 40) % 60;
      for (let x = -off; x < W + 60; x += 60) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
      for (let y = 0; y < H; y += 60) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
      ctx.stroke();

      if (st.o.mode === 'invaders') this.drawInvaders(ctx, st, col);
      else this.drawConduit(ctx, st, col);

      /* particules */
      for (const p of st.parts) {
        ctx.globalAlpha = 1 - p.t / p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, U.TAU); ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.restore();

      /* interface de l'interlude */
      ctx.textAlign = 'center';
      if (st.intro > 0) {
        ctx.globalAlpha = Math.min(1, st.intro / .4);
        ctx.fillStyle = 'rgba(4,6,14,.72)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = col;
        ctx.font = '900 26px ui-sans-serif,system-ui,sans-serif';
        ctx.fillText(st.o.title, W / 2, H / 2 - 14);
        ctx.fillStyle = '#b9c9de';
        ctx.font = '600 14px ui-sans-serif,system-ui,sans-serif';
        ctx.fillText(st.o.subtitle, W / 2, H / 2 + 16);
        ctx.globalAlpha = 1;
      } else if (st.done) {
        ctx.fillStyle = 'rgba(4,6,14,.6)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = st.won ? '#9dff4d' : '#ff4d5e';
        ctx.font = '900 28px ui-sans-serif,system-ui,sans-serif';
        ctx.fillText(st.won ? 'SÉQUENCE RÉUSSIE' : 'SÉQUENCE RATÉE', W / 2, H / 2);
      } else {
        /* barre de temps + intégrité */
        const left = U.clamp(1 - st.t / st.o.duration, 0, 1);
        ctx.fillStyle = 'rgba(255,255,255,.12)';
        ctx.fillRect(W * .15, 22, W * .7, 6);
        ctx.fillStyle = col;
        ctx.fillRect(W * .15, 22, W * .7 * left, 6);
        ctx.fillStyle = '#e8f4ff';
        ctx.font = '800 12px ui-sans-serif,system-ui,sans-serif';
        ctx.fillText('INTÉGRITÉ ' + '◆'.repeat(Math.max(0, st.hp)), W / 2, 48);
        ctx.font = '600 11px ui-sans-serif,system-ui,sans-serif';
        ctx.fillStyle = '#8fa3bd';
        /* la consigne reste en haut : en bas elle passerait sous le pouce */
        ctx.fillText(st.o.mode === 'invaders'
          ? 'Glisse pour viser — le tir est automatique'
          : 'DASH ou ULT pour sauter (double saut possible)', W / 2, 68);
      }
      ctx.textAlign = 'left';
    },

    drawInvaders(ctx, st, col) {
      /* colonnes ennemies */
      for (const f of st.foes) {
        if (f.dead) continue;
        ctx.globalAlpha = .22; ctx.fillStyle = col;
        ctx.beginPath(); ctx.arc(f.x, f.y, f.r * 1.7, 0, U.TAU); ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#0a1024';
        ctx.strokeStyle = col; ctx.lineWidth = 2;
        NF.Draw.poly(ctx, f.x, f.y, f.r, 6, st.t * .8 + f.col);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.arc(f.x, f.y, 3.5, 0, U.TAU); ctx.fill();
      }
      /* projectiles */
      for (const b of st.bullets) {
        ctx.fillStyle = b.own ? '#3ef2ff' : '#ff2d55';
        ctx.fillRect(b.x - 2, b.y - 8, 4, 14);
      }
      this.drawShip(ctx, st, st.px, st.py, -Math.PI / 2);
    },

    drawConduit(ctx, st, col) {
      /* sol */
      ctx.fillStyle = 'rgba(255,255,255,.06)';
      ctx.fillRect(0, st.groundY + 16, st.w, st.h);
      ctx.strokeStyle = col; ctx.globalAlpha = .5; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, st.groundY + 16); ctx.lineTo(st.w, st.groundY + 16); ctx.stroke();
      ctx.globalAlpha = 1;

      /* plafond décoratif */
      ctx.globalAlpha = .3; ctx.strokeStyle = col;
      ctx.beginPath(); ctx.moveTo(0, st.groundY - 210); ctx.lineTo(st.w, st.groundY - 210); ctx.stroke();
      ctx.globalAlpha = 1;

      for (const o of st.obstacles) {
        const oy = o.kind === 'bas' ? st.groundY - o.h : st.groundY - 150;
        const oh = o.kind === 'bas' ? o.h : 60;
        ctx.fillStyle = '#2a0713';
        ctx.strokeStyle = '#ff2d55'; ctx.lineWidth = 2;
        ctx.fillRect(o.x - o.w / 2, oy, o.w, oh);
        ctx.strokeRect(o.x - o.w / 2, oy, o.w, oh);
        ctx.globalAlpha = .25; ctx.fillStyle = '#ff2d55';
        ctx.fillRect(o.x - o.w / 2 - 4, oy - 4, o.w + 8, oh + 8);
        ctx.globalAlpha = 1;
      }
      this.drawShip(ctx, st, st.px, st.py, 0);
    },

    drawShip(ctx, st, x, y, rot) {
      const blink = st.invuln > 0 && Math.floor(st.invuln * 20) % 2 === 0;
      ctx.save();
      ctx.translate(x, y); ctx.rotate(rot + Math.PI / 2);
      ctx.globalAlpha = blink ? .4 : 1;
      ctx.fillStyle = '#0d1b34'; ctx.strokeStyle = '#3ef2ff'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -17); ctx.lineTo(12, 9); ctx.lineTo(5, 6);
      ctx.lineTo(0, 11); ctx.lineTo(-5, 6); ctx.lineTo(-12, 9);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#3ef2ff';
      ctx.beginPath(); ctx.arc(0, -4, 3.4, 0, U.TAU); ctx.fill();
      ctx.restore();
      ctx.globalAlpha = 1;
    }
  };

})(window);
