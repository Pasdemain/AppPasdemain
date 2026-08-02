/* ============================================================
   fx.js — particules, textes flottants, secousse de caméra
   Pools bornés pour rester fluide sur téléphone.
   ============================================================ */
(function (w) {
  'use strict';
  const NF = w.NF, U = NF.U;

  const MAX_PARTICLES = 260;
  const MAX_TEXTS = 30;

  const FX = NF.FX = {
    parts: [],
    texts: [],
    shake: 0,
    shakeX: 0, shakeY: 0,
    flash: 0, flashColor: '#fff',

    reset() {
      this.parts.length = 0;
      this.texts.length = 0;
      this.shake = this.shakeX = this.shakeY = this.flash = 0;
    },

    /** Gerbe de particules */
    burst(x, y, count, color, opt) {
      opt = opt || {};
      const room = MAX_PARTICLES - this.parts.length;
      if (room <= 0) return;
      count = Math.min(count, room);
      const spd = opt.speed || 160;
      const life = opt.life || 0.45;
      const size = opt.size || 3;
      const dir = opt.dir, spread = opt.spread == null ? U.TAU : opt.spread;
      for (let i = 0; i < count; i++) {
        const a = dir == null ? Math.random() * U.TAU : dir + U.rand(-spread / 2, spread / 2);
        const s = spd * U.rand(0.35, 1);
        this.parts.push({
          x, y,
          vx: Math.cos(a) * s, vy: Math.sin(a) * s,
          life: life * U.rand(0.6, 1.2), t: 0,
          r: size * U.rand(0.6, 1.3),
          color, drag: opt.drag == null ? 2.6 : opt.drag,
          glow: !!opt.glow
        });
      }
    },

    /** Anneau de choc qui s'étend */
    shockwave(x, y, rMax, color, dur) {
      this.parts.push({ wave: true, x, y, r0: 6, r1: rMax, t: 0, life: dur || 0.4, color });
    },

    /** Traînée fine (missiles, dash) */
    trail(x, y, color, size) {
      if (this.parts.length > MAX_PARTICLES - 4) return;
      this.parts.push({
        x, y, vx: U.rand(-14, 14), vy: U.rand(-14, 14),
        life: 0.28, t: 0, r: size || 2.2, color, drag: 4, glow: false
      });
    },

    /** Nombre de dégâts flottant */
    text(x, y, str, color, big) {
      if (this.texts.length >= MAX_TEXTS) this.texts.shift();
      this.texts.push({
        x: x + U.rand(-6, 6), y, str, color: color || '#fff',
        t: 0, life: big ? 1.0 : 0.65, vy: big ? -46 : -34,
        size: big ? 17 : 12
      });
    },

    kick(amount) { this.shake = Math.min(26, this.shake + amount); },

    screenFlash(color, amount) { this.flash = Math.max(this.flash, amount || .35); this.flashColor = color || '#fff'; },

    update(dt) {
      /* particules */
      const P = this.parts;
      for (let i = 0; i < P.length; i++) {
        const p = P[i];
        p.t += dt;
        if (p.t >= p.life) { p.dead = true; continue; }
        if (p.wave) continue;
        const d = 1 - p.drag * dt;
        p.vx *= d > 0 ? d : 0; p.vy *= d > 0 ? d : 0;
        p.x += p.vx * dt; p.y += p.vy * dt;
      }
      U.prune(P);

      /* textes */
      const T = this.texts;
      for (let i = 0; i < T.length; i++) {
        const t = T[i];
        t.t += dt;
        if (t.t >= t.life) { t.dead = true; continue; }
        t.y += t.vy * dt;
        t.vy *= 1 - 1.6 * dt;
      }
      U.prune(T);

      /* secousse */
      if (this.shake > 0) {
        this.shake = Math.max(0, this.shake - 42 * dt);
        this.shakeX = U.rand(-this.shake, this.shake);
        this.shakeY = U.rand(-this.shake, this.shake);
      } else { this.shakeX = this.shakeY = 0; }

      if (this.flash > 0) this.flash = Math.max(0, this.flash - 2.2 * dt);
    },

    /** Dessin en espace monde (caméra déjà appliquée) */
    draw(ctx) {
      const P = this.parts;
      for (let i = 0; i < P.length; i++) {
        const p = P[i];
        const k = 1 - p.t / p.life;
        if (p.wave) {
          const r = U.lerp(p.r0, p.r1, 1 - k * k);
          ctx.globalAlpha = k * 0.8;
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 2 + 4 * k;
          ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, U.TAU); ctx.stroke();
          continue;
        }
        ctx.globalAlpha = k;
        ctx.fillStyle = p.color;
        const r = p.r * (0.4 + 0.6 * k);
        if (p.glow) {
          ctx.globalAlpha = k * 0.25;
          ctx.beginPath(); ctx.arc(p.x, p.y, r * 2.4, 0, U.TAU); ctx.fill();
          ctx.globalAlpha = k;
        }
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, U.TAU); ctx.fill();
      }
      ctx.globalAlpha = 1;
    },

    drawTexts(ctx) {
      const T = this.texts;
      if (!T.length) return;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let i = 0; i < T.length; i++) {
        const t = T[i];
        const k = 1 - t.t / t.life;
        ctx.globalAlpha = Math.min(1, k * 2);
        ctx.font = `900 ${t.size}px ui-sans-serif,system-ui,sans-serif`;
        ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.65)';
        ctx.strokeText(t.str, t.x, t.y);
        ctx.fillStyle = t.color;
        ctx.fillText(t.str, t.x, t.y);
      }
      ctx.globalAlpha = 1;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
    }
  };

})(window);
