/* ============================================================
   hud.js — interface en jeu (DOM, mise à jour légère)
   ============================================================ */
(function (w) {
  'use strict';
  const NF = w.NF, U = NF.U;

  const $ = id => document.getElementById(id);

  const HUD = NF.HUD = {
    init() {
      this.el = {
        hud: $('hud'),
        hpFill: $('hpFill'), hpText: $('hpText'),
        xpFill: $('xpFill'), xpText: $('xpText'),
        wave: $('waveLabel'), waveSub: $('waveSub'),
        bossBar: $('bossBar'), bossName: $('bossName'), bossPhase: $('bossPhase'),
        bossFill: $('bossFill'), bossHint: $('bossHint'),
        dash: $('btnDash'), dashFill: $('btnDash').querySelector('i'),
        ult: $('btnUlt'), ultFill: $('btnUlt').querySelector('i'),
        strip: $('weaponStrip'),
        quests: $('questTracker'),
        toasts: $('toasts')
      };
      this._weaponSig = '';
      this._biome = null;
      this._questSig = '';
    },

    show(v) { this.el.hud.classList.toggle('hidden', !v); },

    /** Mémorise le secteur courant pour l'affichage de la vague */
    setBiome(b) { this._biome = b; },

    update(game) {
      const e = this.el, p = game.player;

      /* --- vie --- */
      const hpR = U.clamp(p.hp / p.stats.maxHp, 0, 1);
      e.hpFill.style.transform = `scaleX(${hpR})`;
      e.hpText.textContent = Math.ceil(p.hp) + ' / ' + Math.round(p.stats.maxHp)
        + (p.revives > 0 ? '  ♻' + p.revives : '');

      /* --- expérience --- */
      e.xpFill.style.transform = `scaleX(${U.clamp(p.xp / p.xpNext, 0, 1)})`;
      e.xpText.textContent = 'NIV. ' + p.level;

      /* --- vague --- */
      const wv = game.waves;
      e.wave.textContent = (this._biome ? this._biome.name + ' · ' : '') + 'VAGUE ' + wv.wave;
      if (wv.state === 'cleared') {
        e.waveSub.textContent = 'PROCHAINE VAGUE DANS ' + Math.ceil(wv.breakT) + 's';
      } else if (wv.state === 'boss') {
        e.waveSub.textContent = 'ALERTE BOSS';
      } else {
        e.waveSub.textContent = wv.remaining + ' ENNEMIS  ·  ' + U.time(game.time);
      }

      /* --- boss --- */
      const b = wv.boss;
      if (b && !b.dead) {
        e.bossBar.classList.remove('hidden');
        e.bossName.textContent = b.name;
        e.bossPhase.textContent = 'PHASE ' + b.phase;
        e.bossFill.style.transform = `scaleX(${U.clamp(b.hp / b.maxHp, 0, 1)})`;
        e.bossHint.textContent = b.invuln ? '⛨ ' + b.hint : b.hint;
      } else {
        e.bossBar.classList.add('hidden');
      }

      /* --- dash / ultime --- */
      const dr = p.stats.dashCd > 0 ? U.clamp(1 - p.dashCd / p.stats.dashCd, 0, 1) : 1;
      e.dashFill.style.height = (dr * 100) + '%';
      e.dash.classList.toggle('ready', dr >= 1);
      e.dash.classList.toggle('cool', dr < 1);
      const ur = U.clamp(p.ult / p.ultMax, 0, 1);
      e.ultFill.style.height = (ur * 100) + '%';
      e.ult.classList.toggle('ready', ur >= 1);
      e.ult.classList.toggle('cool', ur < 1);

      /* --- armes (rafraîchi seulement si ça change) --- */
      const sig = p.weapons.map(x => x.id + x.lvl).join('|');
      if (sig !== this._weaponSig) {
        this._weaponSig = sig;
        e.strip.innerHTML = p.weapons.map(inst => {
          const wd = NF.weaponById(inst.id);
          return `<span class="wchip">${wd.icon}<em>${NF.romanize(inst.lvl)}</em></span>`;
        }).join('');
      }

      /* --- quêtes suivies (1 fois par seconde) --- */
      this._qT = (this._qT || 0) - game.dt;
      if (this._qT <= 0) {
        this._qT = 1;
        const tr = NF.Quests.tracked();
        const qs = tr.map(o => o.q.id + Math.floor(o.s.prog)).join('|');
        if (qs !== this._questSig) {
          this._questSig = qs;
          e.quests.innerHTML = tr.map(o =>
            `<div>${o.q.icon} ${o.q.name} <b>${U.fmt(Math.min(o.s.prog, o.s.goal))}/${U.fmt(o.s.goal)}</b></div>`
          ).join('');
        }
      }
    },

    toast(msg, kind) {
      const d = document.createElement('div');
      d.className = 'toast' + (kind ? ' ' + kind : '');
      d.textContent = msg;
      this.el.toasts.appendChild(d);
      setTimeout(() => d.remove(), 2400);
      while (this.el.toasts.children.length > 4) this.el.toasts.firstChild.remove();
    },

    clearToasts() { this.el.toasts.innerHTML = ''; }
  };

})(window);
