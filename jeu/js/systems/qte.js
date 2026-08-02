/* ============================================================
   qte.js — séquences d'action rapide

   Un boss peut interrompre le combat pour lancer un QTE : le monde se
   fige, une surcouche apparaît, et le joueur doit réussir un ou
   plusieurs passages. Le résultat est renvoyé au boss, qui décide de
   la sanction ou de la récompense.

   Deux formes, toutes deux jouables au pouce :
     • timing — un curseur balaie une piste, il faut toucher dans la zone
     • mash   — marteler l'écran pour remplir une jauge avant la fin

   Le monde reste dessiné derrière : on voit ce qui nous attend.
   ============================================================ */
(function (w) {
  'use strict';
  const NF = w.NF, U = NF.U;
  const $ = id => document.getElementById(id);

  const QTE = NF.QTE = {
    active: false,

    init() {
      this.el = {
        root: $('qte'), title: $('qteTitle'), hint: $('qteHint'),
        rounds: $('qteRounds'), track: $('qteTrack'), zone: $('qteZone'),
        cursor: $('qteCursor'), gauge: $('qteGauge'), fill: $('qteFill'),
        timer: $('qteTimer'), btn: $('qteBtn'), verdict: $('qteVerdict')
      };
      const press = (e) => { e.preventDefault(); this.press(); };
      this.el.btn.addEventListener('touchstart', press, { passive: false });
      this.el.btn.addEventListener('mousedown', press);
      w.addEventListener('keydown', (e) => {
        if (this.active && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); this.press(); }
      });
    },

    /** Démarre une séquence. opt.onWin / opt.onLose sont appelés à la fin. */
    start(game, opt) {
      if (this.active) return;
      this.game = game;
      this.o = Object.assign({
        type: 'timing', title: 'SÉQUENCE CRITIQUE',
        hint: 'Touche quand le curseur entre dans la zone',
        rounds: 1, speed: 1.1, width: 0.22, taps: 14, time: 4,
        color: '#ffd23e', onWin: null, onLose: null
      }, opt);

      this.round = 0;
      this.failed = false;
      this.active = true;
      game.qte = this;
      this.el.title.textContent = this.o.title;
      this.el.hint.textContent = this.o.hint;
      this.el.root.style.setProperty('--qc', this.o.color);
      this.el.root.classList.remove('hidden');
      this.el.verdict.textContent = '';
      this.el.verdict.className = 'qte-verdict';
      NF.Input.reset();
      this.beginRound();
    },

    beginRound() {
      const o = this.o;
      this.t = 0;
      this.locked = false;
      this.taps = 0;
      this.dir = 1;
      this.pos = 0;
      /* la zone se resserre à chaque passage réussi */
      this.zoneW = Math.max(0.09, o.width - this.round * 0.04);
      this.zoneAt = U.rand(0.12, 0.88 - this.zoneW);
      this.limit = o.type === 'mash' ? o.time : 6;

      const isTiming = o.type === 'timing';
      this.el.track.classList.toggle('hidden', !isTiming);
      this.el.gauge.classList.toggle('hidden', isTiming);
      this.el.btn.textContent = isTiming ? 'MAINTENANT !' : 'MARTÈLE !';

      if (isTiming) {
        this.el.zone.style.left = (this.zoneAt * 100) + '%';
        this.el.zone.style.width = (this.zoneW * 100) + '%';
      }
      this.paintRounds();
    },

    paintRounds() {
      let html = '';
      for (let i = 0; i < this.o.rounds; i++) {
        const cls = i < this.round ? 'ok' : (i === this.round ? 'now' : '');
        html += `<i class="${cls}"></i>`;
      }
      this.el.rounds.innerHTML = html;
    },

    /** Appui du joueur */
    press() {
      if (!this.active || this.locked) return;
      const o = this.o;
      if (o.type === 'mash') {
        this.taps++;
        this.el.fill.style.transform = `scaleX(${Math.min(1, this.taps / o.taps)})`;
        if (this.taps >= o.taps) this.endRound(true);
        return;
      }
      /* timing : le curseur est-il dans la zone ? */
      const inZone = this.pos >= this.zoneAt && this.pos <= this.zoneAt + this.zoneW;
      this.endRound(inZone);
    },

    endRound(ok) {
      this.locked = true;
      this.el.verdict.textContent = ok ? 'RÉUSSI' : 'RATÉ';
      this.el.verdict.className = 'qte-verdict ' + (ok ? 'ok' : 'ko');
      U.buzz(ok ? [18, 40, 18] : 60);
      NF.FX.screenFlash(ok ? '#9dff4d' : '#ff4d5e', .25);

      setTimeout(() => {
        if (!this.active) return;
        if (!ok) { this.finish(false); return; }
        this.round++;
        this.paintRounds();
        if (this.round >= this.o.rounds) { this.finish(true); return; }
        this.el.verdict.textContent = '';
        this.el.verdict.className = 'qte-verdict';
        this.beginRound();
      }, 550);
    },

    finish(won) {
      this.active = false;
      this.el.root.classList.add('hidden');
      const g = this.game;
      g.qte = null;
      g._last = performance.now();
      /* on ne se fait pas cueillir en reprenant la main */
      g.player.invuln = Math.max(g.player.invuln, 0.7);
      NF.Input.reset();
      const cb = won ? this.o.onWin : this.o.onLose;
      if (cb) cb(g);
    },

    /** Appelé par la boucle de jeu tant que le QTE tourne */
    update(dt) {
      if (!this.active || this.locked) return;
      const o = this.o;
      this.t += dt;

      if (o.type === 'timing') {
        /* va-et-vient du curseur */
        this.pos += this.dir * o.speed * dt;
        if (this.pos > 1) { this.pos = 1; this.dir = -1; }
        if (this.pos < 0) { this.pos = 0; this.dir = 1; }
        this.el.cursor.style.left = (this.pos * 100) + '%';
        const inZone = this.pos >= this.zoneAt && this.pos <= this.zoneAt + this.zoneW;
        this.el.zone.classList.toggle('hot', inZone);
      } else {
        this.el.fill.style.transform = `scaleX(${Math.min(1, this.taps / o.taps)})`;
      }

      const left = Math.max(0, this.limit - this.t);
      this.el.timer.textContent = left.toFixed(1) + ' s';
      this.el.timer.classList.toggle('urgent', left < 1.2);
      if (this.t >= this.limit) this.endRound(false);
    },

    /** Interruption propre (fin de partie, abandon) */
    cancel() {
      if (!this.active) return;
      this.active = false;
      this.el.root.classList.add('hidden');
      if (this.game) this.game.qte = null;
    }
  };

})(window);
