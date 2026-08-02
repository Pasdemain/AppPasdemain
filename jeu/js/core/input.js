/* ============================================================
   input.js — clavier + joystick virtuel tactile
   Expose NF.Input avec un vecteur de déplacement normalisé.
   ============================================================ */
(function (w) {
  'use strict';
  const NF = w.NF, U = NF.U;

  const Input = NF.Input = {
    dx: 0, dy: 0,          // vecteur de déplacement (-1..1)
    active: false,         // le joystick est-il tenu ?
    dashPressed: false,    // impulsions consommées par le jeu
    ultPressed: false,
    keys: Object.create(null),

    _stickId: null,
    _ox: 0, _oy: 0,
    _base: null, _knob: null,
    MAX: 52,               // rayon max du joystick en px

    init() {
      this._base = document.getElementById('stickBase');
      this._knob = document.getElementById('stickKnob');

      /* ---------- Clavier ---------- */
      w.addEventListener('keydown', (e) => {
        const k = e.key.toLowerCase();
        this.keys[k] = true;
        if (k === ' ' || k === 'shift') { this.dashPressed = true; e.preventDefault(); }
        if (k === 'e') this.ultPressed = true;
        if (k === 'escape' || k === 'p') NF.game && NF.game.togglePause();
        if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
      });
      w.addEventListener('keyup', (e) => { this.keys[e.key.toLowerCase()] = false; });
      w.addEventListener('blur', () => { this.keys = Object.create(null); this._release(); });

      /* ---------- Tactile : moitié gauche = joystick dynamique ----------
         Les écouteurs sont posés sur le document : le calque du HUD est en
         pointer-events:none et n'aurait jamais reçu les touches. */
      const opts = { passive: false };

      /** Le geste doit-il être ignoré ? (bouton, menu ouvert) */
      const blocked = (target) => {
        if (NF.Menus && NF.Menus.current) return true;      // un écran est ouvert
        if (!NF.game || !NF.game.running || NF.game.paused) return true;
        return !!(target && target.closest && target.closest('button'));
      };

      document.addEventListener('touchstart', (e) => {
        if (blocked(e.target)) return;
        for (const t of e.changedTouches) {
          if (this._stickId !== null) break;
          if (t.clientX > w.innerWidth * 0.58) continue;    // droite réservée aux boutons
          this._grab(t);
          e.preventDefault();
        }
      }, opts);

      document.addEventListener('touchmove', (e) => {
        for (const t of e.changedTouches) {
          if (t.identifier !== this._stickId) continue;
          this._move(t.clientX, t.clientY);
          e.preventDefault();
        }
      }, opts);

      const end = (e) => {
        for (const t of e.changedTouches) {
          if (t.identifier === this._stickId) this._release();
        }
      };
      document.addEventListener('touchend', end, opts);
      document.addEventListener('touchcancel', end, opts);

      /* ---------- Souris (test sur ordinateur) ---------- */
      document.addEventListener('mousedown', (e) => {
        if (blocked(e.target)) return;
        if (e.clientX > w.innerWidth * 0.58) return;
        this._grab({ identifier: 'mouse', clientX: e.clientX, clientY: e.clientY });
      });
      w.addEventListener('mousemove', (e) => {
        if (this._stickId === 'mouse') this._move(e.clientX, e.clientY);
      });
      w.addEventListener('mouseup', () => { if (this._stickId === 'mouse') this._release(); });

      /* ---------- Boutons d'action ---------- */
      const bind = (id, fn) => {
        const el = document.getElementById(id);
        el.addEventListener('touchstart', (e) => { e.preventDefault(); fn(); }, opts);
        el.addEventListener('mousedown', (e) => { e.preventDefault(); fn(); });
      };
      bind('btnDash', () => { this.dashPressed = true; });
      bind('btnUlt', () => { this.ultPressed = true; });

      /* Empêche le zoom par double-tap et le pull-to-refresh */
      document.addEventListener('gesturestart', (e) => e.preventDefault());
      document.addEventListener('dblclick', (e) => e.preventDefault());
    },

    _grab(t) {
      this._stickId = t.identifier;
      this._ox = t.clientX; this._oy = t.clientY;
      this.active = true;
      this._base.style.left = this._ox + 'px';
      this._base.style.top = this._oy + 'px';
      this._base.classList.add('on');
      this._knob.style.transform = 'translate(0px,0px)';
    },

    _move(x, y) {
      let dx = x - this._ox, dy = y - this._oy;
      const d = Math.hypot(dx, dy);
      if (d > this.MAX) {
        // recentre l'origine pour un suivi souple sur les longs glissés
        this._ox += dx * (1 - this.MAX / d);
        this._oy += dy * (1 - this.MAX / d);
        this._base.style.left = this._ox + 'px';
        this._base.style.top = this._oy + 'px';
        dx *= this.MAX / d; dy *= this.MAX / d;
      }
      this._knob.style.transform = `translate(${dx}px,${dy}px)`;
      // zone morte de 12 % pour éviter les micro-dérives
      const mag = Math.hypot(dx, dy) / this.MAX;
      if (mag < 0.12) { this.dx = this.dy = 0; return; }
      const k = 1 / Math.hypot(dx, dy);
      const speed = U.clamp((mag - 0.12) / 0.72, 0, 1);
      this.dx = dx * k * speed;
      this.dy = dy * k * speed;
    },

    _release() {
      this._stickId = null;
      this.active = false;
      this.dx = this.dy = 0;
      if (this._base) { this._base.classList.remove('on'); }
    },

    /** Vecteur final : clavier prioritaire s'il est utilisé */
    read() {
      const k = this.keys;
      let kx = 0, ky = 0;
      if (k['a'] || k['q'] || k['arrowleft']) kx -= 1;
      if (k['d'] || k['arrowright']) kx += 1;
      if (k['w'] || k['z'] || k['arrowup']) ky -= 1;
      if (k['s'] || k['arrowdown']) ky += 1;
      if (kx || ky) {
        const m = Math.hypot(kx, ky);
        return { x: kx / m, y: ky / m };
      }
      return { x: this.dx, y: this.dy };
    },

    consumeDash() { const v = this.dashPressed; this.dashPressed = false; return v; },
    consumeUlt() { const v = this.ultPressed; this.ultPressed = false; return v; },

    reset() { this._release(); this.dashPressed = this.ultPressed = false; }
  };

})(window);
