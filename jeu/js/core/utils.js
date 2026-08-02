/* ============================================================
   utils.js — espace de noms global + maths / helpers
   Chargé en premier : crée window.NF
   ============================================================ */
(function (w) {
  'use strict';

  const NF = w.NF = w.NF || {};

  /* ---------- Maths ---------- */
  const U = NF.U = {
    TAU: Math.PI * 2,

    clamp(v, a, b) { return v < a ? a : (v > b ? b : v); },
    lerp(a, b, t) { return a + (b - a) * t; },
    rand(a, b) { return a + Math.random() * (b - a); },
    randInt(a, b) { return Math.floor(a + Math.random() * (b - a + 1)); },
    pick(arr) { return arr[(Math.random() * arr.length) | 0]; },
    chance(p) { return Math.random() < p; },

    dist(ax, ay, bx, by) { return Math.hypot(bx - ax, by - ay); },
    dist2(ax, ay, bx, by) { const dx = bx - ax, dy = by - ay; return dx * dx + dy * dy; },
    angle(ax, ay, bx, by) { return Math.atan2(by - ay, bx - ax); },

    /** Différence d'angle la plus courte, dans [-PI, PI] */
    angleDiff(a, b) {
      let d = (b - a) % U.TAU;
      if (d > Math.PI) d -= U.TAU;
      if (d < -Math.PI) d += U.TAU;
      return d;
    },

    /** Rotation progressive vers un angle cible */
    turnTo(cur, target, maxStep) {
      const d = U.angleDiff(cur, target);
      return cur + U.clamp(d, -maxStep, maxStep);
    },

    /** Collision cercle / cercle */
    hit(a, b) {
      const r = a.r + b.r;
      return U.dist2(a.x, a.y, b.x, b.y) <= r * r;
    },

    /** Distance point → segment (pour les rayons laser) */
    distToSegment(px, py, x1, y1, x2, y2) {
      const dx = x2 - x1, dy = y2 - y1;
      const len2 = dx * dx + dy * dy;
      if (len2 === 0) return Math.hypot(px - x1, py - y1);
      let t = ((px - x1) * dx + (py - y1) * dy) / len2;
      t = U.clamp(t, 0, 1);
      return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
    },

    /** Tirage pondéré : items = [{w:poids, ...}] */
    weighted(items) {
      let total = 0;
      for (const it of items) total += (it.w || 1);
      let r = Math.random() * total;
      for (const it of items) { r -= (it.w || 1); if (r <= 0) return it; }
      return items[items.length - 1];
    },

    /** Mélange en place (Fisher-Yates) */
    shuffle(arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = (Math.random() * (i + 1)) | 0;
        const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
      }
      return arr;
    },

    /** Retire les éléments morts d'un tableau, sans réallouer */
    prune(arr) {
      let n = 0;
      for (let i = 0; i < arr.length; i++) if (!arr[i].dead) arr[n++] = arr[i];
      arr.length = n;
      return arr;
    },

    /** 12 345 → "12.3k" */
    fmt(n) {
      n = Math.floor(n);
      if (n < 1000) return '' + n;
      if (n < 1e6) return (n / 1e3).toFixed(n < 1e4 ? 1 : 0) + 'k';
      if (n < 1e9) return (n / 1e6).toFixed(1) + 'M';
      return (n / 1e9).toFixed(1) + 'Md';
    },

    /** secondes → "3:07" */
    time(s) {
      s = Math.max(0, Math.floor(s));
      const m = (s / 60) | 0;
      return m + ':' + String(s % 60).padStart(2, '0');
    },

    /** Point aléatoire sur un anneau autour d'un centre */
    ringPoint(cx, cy, rMin, rMax) {
      const a = Math.random() * U.TAU;
      const r = U.rand(rMin, rMax);
      return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, a };
    },

    /** Vibration courte (ignorée si non supportée) */
    buzz(ms) {
      if (NF.settings && NF.settings.haptics === false) return;
      if (w.navigator && navigator.vibrate) { try { navigator.vibrate(ms); } catch (e) { /* ignoré */ } }
    }
  };

  /* ---------- Dessin ---------- */
  NF.Draw = {
    /** Halo néon bon marché : deux disques superposés (pas de shadowBlur) */
    glowCircle(ctx, x, y, r, color, glowAlpha) {
      ctx.globalAlpha = glowAlpha == null ? 0.22 : glowAlpha;
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(x, y, r * 2.1, 0, U.TAU); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.arc(x, y, r, 0, U.TAU); ctx.fill();
    },

    ring(ctx, x, y, r, color, width, alpha) {
      ctx.globalAlpha = alpha == null ? 1 : alpha;
      ctx.strokeStyle = color;
      ctx.lineWidth = width || 2;
      ctx.beginPath(); ctx.arc(x, y, r, 0, U.TAU); ctx.stroke();
      ctx.globalAlpha = 1;
    },

    /** Polygone régulier (ennemis anguleux) */
    poly(ctx, x, y, r, sides, rot) {
      ctx.beginPath();
      for (let i = 0; i < sides; i++) {
        const a = rot + i * U.TAU / sides;
        const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
    },

    /** Barre de vie flottante au-dessus d'une entité */
    hpBar(ctx, e, w2, h2, color) {
      const p = U.clamp(e.hp / e.maxHp, 0, 1);
      const x = e.x - w2 / 2, y = e.y - e.r - 9;
      ctx.globalAlpha = .55; ctx.fillStyle = '#000';
      ctx.fillRect(x - 1, y - 1, w2 + 2, h2 + 2);
      ctx.globalAlpha = 1; ctx.fillStyle = color || '#ff4d5e';
      ctx.fillRect(x, y, w2 * p, h2);
    }
  };

  /* ---------- Palette ---------- */
  NF.C = {
    cyan: '#3ef2ff', cyanD: '#0aa9bd',
    magenta: '#ff3ea5', violet: '#8b5cff',
    lime: '#9dff4d', amber: '#ffb43e',
    red: '#ff4d5e', white: '#e8f4ff',
    bg: '#05060f', grid: 'rgba(62,242,255,.07)'
  };

})(window);
