/* ============================================================
   interlude.js — phases jouées hors de l'arène

   Un boss peut téléporter le joueur dans un mini-jeu le temps d'une
   phase, puis le renvoyer sur la carte. Pendant l'interlude, la boucle
   principale est mise de côté : c'est ce module qui met à jour et
   dessine, dans son propre repère écran.

   Trois formes :
     • invaders  — le vaisseau glisse en bas, les colonnes descendent
     • conduit   — course d'obstacles, on saute pour ne pas percuter
     • partition — les notes défilent, on frappe en rythme

   Chaque interlude renvoie « réussi » ou « raté », et le boss décide de
   la suite. La partition, elle, agit aussi pendant qu'elle se joue :
   chaque note touchée blesse le boss, chaque note manquée blesse le
   joueur, et le combo fait monter la mise.
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
        duration: 22, color: '#ffd23e', hp: 3, rush: false,
        /* partition */
        lanes: 4, bpm: 104, window: 0.17, need: 0.6,
        comboStep: 0.08, maxBonus: 2.0,
        onHit: null, onMiss: null,
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

      if (o.mode === 'partition') {
        this.buildChart(st);
      } else if (o.mode === 'invaders') {
        st.py = st.h - 110;
        this.buildFormation(st);
      } else {
        /* la piste reste au-dessus des boutons d'action : le pouce ne
           doit jamais masquer le vaisseau ni les obstacles */
        st.groundY = st.h - 250;
        st.py = st.groundY;
        st.speed = o.rush ? 400 : 320;
      }

      game.interlude = st;
      this.gameRef = game;
      /* l'écran appartient au mini-jeu : on efface le HUD d'arène, et les
         boutons d'action avec lui quand ils ne servent à rien */
      document.body.classList.add('in-interlude');
      document.body.classList.toggle('no-action', o.mode !== 'conduit');
      document.body.classList.toggle('rythme', o.mode === 'partition');
      if (o.mode === 'partition') this.listenLanes(st);
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
      if (st.o.mode === 'partition') this.updateChart(dt, game, st);
      else if (st.o.mode === 'invaders') this.updateInvaders(dt, game, st, mv);
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

    /** Démontage sans verdict : mort du joueur, abandon, nouvelle partie.
        Sans ça les écouteurs de piste survivent à l'interlude et avalent
        les touchers des menus. */
    abort(game) {
      if (!game.interlude) { this.stopLanes(); return; }
      game.interlude = null;
      this.stopLanes();
      document.body.classList.remove('in-interlude', 'no-action', 'rythme');
      NF.Input.reset();
    },

    finish(game) {
      const st = game.interlude;
      game.interlude = null;
      this.stopLanes();
      document.body.classList.remove('in-interlude', 'no-action', 'rythme');
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
          f.fireT = U.rand(2.8, 7);
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
      st.speed = (st.o.rush ? 355 : 320) + st.t * (st.o.rush ? 10 : 9);
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
        /* en surrégime la piste défile plus vite : on espace davantage,
           sinon la fenêtre de réaction devient impraticable au pouce */
        st.spawnT = U.rand(0.75, 1.25) * (340 / st.speed) * (st.o.rush ? 2.0 : 1.6);
        const kind = U.chance(st.o.rush ? .45 : .28) ? 'haut' : 'bas';
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
       Mode 3 — PARTITION (jeu de rythme)

       Les notes descendent vers une ligne de frappe. Frappée dans la
       fenêtre, une note arrache de la vie au boss ; laissée passer, elle
       en coûte au joueur. Le combo multiplie les dégâts, et le rater
       remet le multiplicateur à plat : c'est là qu'est la tension.
       ============================================================ */

    /** Géométrie de la piste, recalculée à la volée (rotation, resize) */
    lanesGeom(st) {
      const n = st.o.lanes;
      const pad = 14;
      const wLane = (st.w - pad * 2) / n;
      return { n, pad, wLane, topY: 104, lineY: st.h - 190 };
    },

    laneX(st, i) {
      const g = this.lanesGeom(st);
      return g.pad + g.wLane * (i + 0.5);
    },

    /** Compose la partition : densité croissante, jamais deux notes
        simultanées sur la même piste. */
    buildChart(st) {
      const o = st.o;
      st.notes = [];
      st.combo = 0; st.bestCombo = 0;
      st.hits = 0; st.misses = 0;
      st.flash = new Array(o.lanes).fill(0);
      st.judge = null;
      st.approach = 1.75;                        // temps de descente d'une note
      st.mult = () => 1 + Math.min(o.maxBonus, st.combo * o.comboStep);

      const beat = 60 / o.bpm;
      const step = beat / 2;                     // croches
      let t = 2.0, last = -1;
      while (t < o.duration - 0.6) {
        /* la densité monte au fil du morceau */
        const k = t / o.duration;
        if (U.chance(0.42 + k * 0.34)) {
          let lane = U.randInt(0, o.lanes - 1);
          if (lane === last && U.chance(.7)) lane = (lane + 1 + U.randInt(0, o.lanes - 2)) % o.lanes;
          st.notes.push({ lane, t, done: false, ok: false });
          last = lane;
          /* rafale : une deuxième note sur une autre piste */
          if (k > .45 && U.chance(.18)) {
            const other = (lane + 1 + U.randInt(0, o.lanes - 2)) % o.lanes;
            st.notes.push({ lane: other, t, done: false, ok: false });
          }
        }
        t += step;
      }
      st.total = st.notes.length;
    },

    /** Écoute des frappes : tout l'écran est jouable, la colonne décide
        de la piste. Le clavier reste dispo pour tester au bureau. */
    listenLanes(st) {
      this.stopLanes();
      const hit = (clientX) => {
        const g = this.lanesGeom(st);
        const i = U.clamp(Math.floor((clientX - g.pad) / g.wLane), 0, g.n - 1);
        this.strike(st, i);
      };
      this._onTouch = (e) => {
        if (!this.gameRef || !this.gameRef.interlude) return;
        e.preventDefault();
        for (const t of e.changedTouches) hit(t.clientX);
      };
      this._onMouse = (e) => { if (this.gameRef && this.gameRef.interlude) hit(e.clientX); };
      this._onKey = (e) => {
        const map = { '1': 0, '2': 1, '3': 2, '4': 3, d: 0, f: 1, j: 2, k: 3 };
        const i = map[e.key.toLowerCase()];
        if (i !== undefined && i < st.o.lanes) { e.preventDefault(); this.strike(st, i); }
      };
      document.addEventListener('touchstart', this._onTouch, { passive: false });
      document.addEventListener('mousedown', this._onMouse);
      w.addEventListener('keydown', this._onKey);
    },

    stopLanes() {
      if (this._onTouch) document.removeEventListener('touchstart', this._onTouch, { passive: false });
      if (this._onMouse) document.removeEventListener('mousedown', this._onMouse);
      if (this._onKey) w.removeEventListener('keydown', this._onKey);
      this._onTouch = this._onMouse = this._onKey = null;
    },

    /** Coût d'une note manquée.

        On passe par player.hurt pour que l'armure, le bouclier et la
        sauvegarde d'urgence s'appliquent, mais on neutralise les images
        d'invincibilité : sinon deux notes ratées coup sur coup n'en
        coûteraient qu'une, et le rythme n'aurait plus d'enjeu. */
    noteCost(game, frac) {
      const p = game.player;
      if (!p.alive) return;
      const revives = p.revives;
      p.invuln = 0;
      p.hurt(p.stats.maxHp * frac, game);
      if (p.revives === revives) p.invuln = 0;
    },

    /** Frappe du joueur sur une piste */
    strike(st, lane) {
      if (st.done || st.intro > 0) return;
      st.flash[lane] = .18;
      const now = st.songT;
      const o = st.o;
      /* la note la plus proche de la ligne, sur cette piste */
      let best = null, bestD = 1e9;
      for (const n of st.notes) {
        if (n.done || n.lane !== lane) continue;
        const d = Math.abs(n.t - now);
        if (d < bestD) { bestD = d; best = n; }
      }
      if (!best || bestD > o.window) { this.breakCombo(st, false); return; }
      best.done = true; best.ok = true;
      st.hits++;
      st.combo++;
      st.bestCombo = Math.max(st.bestCombo, st.combo);
      const mult = st.mult();
      const g = this.lanesGeom(st);
      this.burst(st, this.laneX(st, lane), g.lineY, 12, o.color);
      st.judge = { text: bestD < o.window * .4 ? 'PARFAIT' : 'BIEN', col: '#9dff4d', t: .5 };
      U.buzz(bestD < o.window * .4 ? 12 : 8);
      if (o.onHit) o.onHit(this.gameRef, st.combo, mult);
    },

    /** Note manquée, ou frappe dans le vide */
    breakCombo(st, real) {
      const o = st.o;
      st.combo = 0;
      if (!real) { st.judge = { text: 'À CÔTÉ', col: '#ffb43e', t: .4 }; return; }
      st.misses++;
      st.judge = { text: 'RATÉ', col: '#ff4d5e', t: .5 };
      st.shake = 12;
      FX.screenFlash('#ff4d5e', .28);
      U.buzz(45);
      if (o.onMiss) o.onMiss(this.gameRef);
    },

    updateChart(dt, game, st) {
      this.gameRef = game;
      st.songT = st.t - 1.6;                     // l'intro ne compte pas
      const o = st.o;

      for (let i = 0; i < st.flash.length; i++) if (st.flash[i] > 0) st.flash[i] -= dt;
      if (st.judge && (st.judge.t -= dt) <= 0) st.judge = null;

      /* notes dépassées */
      for (const n of st.notes) {
        if (n.done || n.t > st.songT - o.window) continue;
        n.done = true; n.ok = false;
        this.breakCombo(st, true);
      }

      /* fin du morceau : le verdict tient à la précision */
      if (st.songT > o.duration) {
        const ratio = st.total ? st.hits / st.total : 1;
        if (ratio >= o.need) this.win(game, st); else this.lose(game, st);
      }
    },

    drawChart(ctx, st, col) {
      const g = this.lanesGeom(st);
      const now = st.songT;

      /* pistes */
      for (let i = 0; i < g.n; i++) {
        const x = g.pad + g.wLane * i;
        ctx.fillStyle = i % 2 ? 'rgba(255,255,255,.025)' : 'rgba(255,255,255,.05)';
        ctx.fillRect(x, g.topY, g.wLane - 3, g.lineY - g.topY + 60);
      }

      /* ligne de frappe */
      ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.globalAlpha = .85;
      ctx.beginPath(); ctx.moveTo(g.pad, g.lineY); ctx.lineTo(st.w - g.pad, g.lineY); ctx.stroke();
      ctx.globalAlpha = 1;

      /* pastilles de frappe */
      for (let i = 0; i < g.n; i++) {
        const x = this.laneX(st, i);
        const lit = st.flash[i] > 0;
        ctx.globalAlpha = lit ? .9 : .3;
        ctx.fillStyle = lit ? col : 'rgba(255,255,255,.10)';
        ctx.beginPath(); ctx.arc(x, g.lineY, 26, 0, U.TAU); ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = col; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(x, g.lineY, 26, 0, U.TAU); ctx.stroke();
      }

      /* notes */
      for (const n of st.notes) {
        if (n.done) continue;
        const dt2 = n.t - now;
        if (dt2 > st.approach || dt2 < -st.o.window) continue;
        const y = g.lineY - (dt2 / st.approach) * (g.lineY - g.topY);
        const x = this.laneX(st, n.lane);
        const close = 1 - U.clamp(Math.abs(dt2) / st.approach, 0, 1);
        ctx.globalAlpha = .2 + .3 * close;
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.arc(x, y, 30, 0, U.TAU); ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#0a1024';
        ctx.strokeStyle = col; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(x, y, 21, 0, U.TAU); ctx.fill(); ctx.stroke();
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.arc(x, y, 6, 0, U.TAU); ctx.fill();
      }

      /* verdict de la dernière frappe */
      if (st.judge) {
        ctx.textAlign = 'center';
        ctx.globalAlpha = U.clamp(st.judge.t * 2.5, 0, 1);
        ctx.fillStyle = st.judge.col;
        ctx.font = '900 22px ui-sans-serif,system-ui,sans-serif';
        ctx.fillText(st.judge.text, st.w / 2, g.lineY - 70);
        ctx.globalAlpha = 1;
        ctx.textAlign = 'left';
      }

      /* précision courante */
      ctx.textAlign = 'center';
      ctx.fillStyle = '#8fa3bd';
      ctx.font = '700 12px ui-sans-serif,system-ui,sans-serif';
      const seen = st.hits + st.misses;
      ctx.fillText(`${st.hits} / ${st.total}  ·  ${seen ? Math.round(100 * st.hits / seen) : 100} %`
        + `  ·  seuil ${Math.round(st.o.need * 100)} %`, st.w / 2, g.lineY + 74);
      ctx.textAlign = 'left';
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

      if (st.o.mode === 'partition') this.drawChart(ctx, st, col);
      else if (st.o.mode === 'invaders') this.drawInvaders(ctx, st, col);
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
        if (st.o.mode === 'partition') {
          ctx.fillText('COMBO ×' + st.combo + '   ·   ×' + st.mult().toFixed(1) + ' DÉGÂTS', W / 2, 48);
        } else {
          ctx.fillText('INTÉGRITÉ ' + '◆'.repeat(Math.max(0, st.hp)), W / 2, 48);
        }
        ctx.font = '600 11px ui-sans-serif,system-ui,sans-serif';
        ctx.fillStyle = '#8fa3bd';
        /* la consigne reste en haut : en bas elle passerait sous le pouce */
        ctx.fillText(st.o.mode === 'partition'
          ? 'Frappe la piste quand la note touche la ligne'
          : st.o.mode === 'invaders'
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
