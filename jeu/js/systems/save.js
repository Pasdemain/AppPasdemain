/* ============================================================
   save.js — sauvegarde JSON dans le localStorage du téléphone
   + export / import d'un fichier .json (transfert d'appareil)
   ============================================================ */
(function (w) {
  'use strict';
  const NF = w.NF;

  const KEY = 'protocole-neon.save.v1';
  const VERSION = 1;

  function fresh() {
    return {
      v: VERSION,
      crystals: 0,
      totalCrystals: 0,
      bestWave: 0,
      bestTime: 0,
      runs: 0,
      totalKills: 0,
      playTime: 0,
      meta: {},                       // { idAmélioration: niveau }
      weapons: ['blaster', 'plasma', 'orbit'],   // armes débloquées
      quests: {},                     // { idQuête: {tier, prog} }
      settings: { haptics: true, shake: true },
      updated: 0
    };
  }

  const Save = NF.Save = {
    data: fresh(),
    _timer: null,

    load() {
      try {
        const raw = w.localStorage.getItem(KEY);
        if (raw) {
          const obj = JSON.parse(raw);
          this.data = this.migrate(obj);
        }
      } catch (e) {
        console.warn('[Protocole Néon] sauvegarde illisible, réinitialisation', e);
        this.data = fresh();
      }
      NF.settings = this.data.settings;
      return this.data;
    },

    /** Complète les champs manquants (compatibilité ascendante) */
    migrate(obj) {
      const base = fresh();
      if (!obj || typeof obj !== 'object') return base;
      const d = Object.assign(base, obj);
      d.v = VERSION;
      d.meta = Object.assign({}, obj.meta || {});
      d.quests = Object.assign({}, obj.quests || {});
      d.settings = Object.assign(base.settings, obj.settings || {});
      if (!Array.isArray(d.weapons) || !d.weapons.length) d.weapons = ['blaster', 'plasma', 'orbit'];
      if (d.weapons.indexOf('blaster') < 0) d.weapons.push('blaster');
      // garde-fous numériques
      for (const k of ['crystals', 'totalCrystals', 'bestWave', 'bestTime', 'runs', 'totalKills', 'playTime']) {
        d[k] = Math.max(0, Number(d[k]) || 0);
      }
      return d;
    },

    save() {
      this.data.updated = Date.now();
      try {
        w.localStorage.setItem(KEY, JSON.stringify(this.data));
      } catch (e) {
        console.warn('[Protocole Néon] écriture de la sauvegarde impossible', e);
      }
    },

    /** Écriture différée : évite d'écrire à chaque image */
    queueSave() {
      if (this._timer) return;
      this._timer = setTimeout(() => { this._timer = null; this.save(); }, 900);
    },

    reset() {
      this.data = fresh();
      NF.settings = this.data.settings;
      this.save();
    },

    /* ---------- Cristaux ---------- */
    addCrystals(n) {
      n = Math.max(0, Math.round(n));
      this.data.crystals += n;
      this.data.totalCrystals += n;
      NF.Quests && NF.Quests.notify('crystals', n);
      this.queueSave();
      return n;
    },
    spend(n) {
      if (this.data.crystals < n) return false;
      this.data.crystals -= n;
      this.save();
      return true;
    },

    /* ---------- Laboratoire ---------- */
    metaLevel(id) { return this.data.meta[id] || 0; },
    buyMeta(id) {
      const m = NF.metaById(id);
      if (!m) return false;
      const lvl = this.metaLevel(id);
      if (lvl >= m.max) return false;
      const price = m.cost(lvl);
      if (!this.spend(price)) return false;
      this.data.meta[id] = lvl + 1;
      this.save();
      return true;
    },

    /* ---------- Arsenal ---------- */
    isWeaponUnlocked(id) { return this.data.weapons.indexOf(id) >= 0; },
    unlockWeapon(id) {
      const wd = NF.weaponById(id);
      if (!wd || this.isWeaponUnlocked(id)) return false;
      if (!this.spend(wd.cost)) return false;
      this.data.weapons.push(id);
      NF.Quests.notify('arsenal', this.data.weapons.length);
      this.save();
      return true;
    },

    /* ---------- Fin de partie ---------- */
    recordRun(res) {
      const d = this.data;
      d.runs++;
      d.bestWave = Math.max(d.bestWave, res.wave);
      d.bestTime = Math.max(d.bestTime, res.time);
      d.totalKills += res.kills;
      d.playTime += res.time;
      this.save();
    },

    /* ---------- Export / import JSON ---------- */
    exportFile() {
      const json = JSON.stringify(this.data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const stamp = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `protocole-neon-sauvegarde-${stamp}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    },

    importFile(file, cb) {
      const rd = new FileReader();
      rd.onload = () => {
        try {
          const obj = JSON.parse(rd.result);
          if (!obj || typeof obj !== 'object') throw new Error('format invalide');
          this.data = this.migrate(obj);
          NF.settings = this.data.settings;
          this.save();
          cb(null, this.data);
        } catch (e) { cb(e); }
      };
      rd.onerror = () => cb(new Error('lecture impossible'));
      rd.readAsText(file);
    },

    /** Chaîne JSON brute (copier/coller manuel) */
    toJSON() { return JSON.stringify(this.data); }
  };

  /* Sauvegarde de sûreté quand l'onglet passe en arrière-plan (mobile) */
  w.addEventListener('visibilitychange', () => { if (document.hidden) Save.save(); });
  w.addEventListener('pagehide', () => Save.save());

})(window);
