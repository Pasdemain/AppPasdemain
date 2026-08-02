/* ============================================================
   save.js — sauvegarde JSON dans le localStorage du téléphone
   + export / import d'un fichier .json (transfert d'appareil)
   ============================================================ */
(function (w) {
  'use strict';
  const NF = w.NF;

  const KEY = 'protocole-neon.save.v1';
  const VERSION = 4;

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
      talentPoints: 0,                // points achetés (placés ou non)
      talents: {},                    // { idNœud: rang }
      pseudo: '',                     // nom affiché au classement
      playerId: '',                   // identifiant stable de l'appareil
      daily: { lastDay: '', lastTs: 0, streak: 0, bestStreak: 0, claimed: 0 },
      localScores: [],                // classement hors ligne (parties locales)
      maxBiome: 0,                    // index du secteur le plus avancé débloqué
      startBiome: 0,                  // secteur choisi au lancement
      weapons: ['blaster', 'plasma', 'orbit'],   // armes débloquées
      quests: {},                     // { idQuête: {tier, prog} }
      settings: { haptics: true, shake: true, handed: 'right' },
      updated: 0
    };
  }

  /** Identifiant aléatoire de l'appareil (sert de clé au classement) */
  function newId() {
    const c = w.crypto;
    if (c && c.randomUUID) return c.randomUUID();
    return 'p-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  /** Pseudo sûr : lettres, chiffres, espaces et quelques signes, 16 max */
  function cleanPseudo(v) {
    return String(v || '')
      .replace(/[<>&"'\\/]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 16);
  }
  NF.cleanPseudo = cleanPseudo;

  /* Anciens tarifs du Laboratoire, conservés pour rembourser les
     sauvegardes créées avant l'arbre de talents. */
  const LEGACY_META_COST = {
    power: [60, 1.32], vitality: [55, 1.30], rate: [80, 1.34], speed: [90, 1.35],
    armor: [120, 1.38], crit: [110, 1.34], regen: [140, 1.36], magnet: [70, 1.30],
    xp: [100, 1.33], dash: [130, 1.34], ult: [150, 1.35], greed: [120, 1.31],
    luck: [200, 1.38], startlvl: [400, 1.60], slots: [900, 2.40], revive: [1200, 2.60]
  };

  function refundLegacyMeta(meta) {
    let total = 0;
    for (const id in meta) {
      const c = LEGACY_META_COST[id];
      if (!c) continue;
      for (let l = 0; l < meta[id]; l++) total += Math.round(c[0] * Math.pow(c[1], l));
    }
    return total;
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
      d.quests = Object.assign({}, obj.quests || {});
      d.talents = Object.assign({}, obj.talents || {});
      d.daily = Object.assign(base.daily, obj.daily || {});
      d.pseudo = cleanPseudo(obj.pseudo || '');
      if (!Array.isArray(d.localScores)) d.localScores = [];
      if (!d.playerId) d.playerId = newId();
      d.maxBiome = Math.max(0, Math.min(20, Math.round(Number(d.maxBiome) || 0)));
      d.startBiome = Math.max(0, Math.min(d.maxBiome, Math.round(Number(d.startBiome) || 0)));
      d.settings = Object.assign(base.settings, obj.settings || {});
      if (d.settings.handed !== 'left') d.settings.handed = 'right';
      if (!Array.isArray(d.weapons) || !d.weapons.length) d.weapons = ['blaster', 'plasma', 'orbit'];
      if (d.weapons.indexOf('blaster') < 0) d.weapons.push('blaster');

      /* v1 → v2 : le Laboratoire devient un arbre de talents.
         Les anciennes améliorations sont remboursées en cristaux. */
      if (obj.meta && Object.keys(obj.meta).length) {
        this.pendingRefund = refundLegacyMeta(obj.meta);
        d.crystals = (Number(d.crystals) || 0) + this.pendingRefund;
      }
      delete d.meta;

      // garde-fous numériques
      for (const k of ['crystals', 'totalCrystals', 'bestWave', 'bestTime', 'runs', 'totalKills', 'playTime', 'talentPoints']) {
        d[k] = Math.max(0, Number(d[k]) || 0);
      }
      /* Rangs incohérents (nœud supprimé, valeur trafiquée) : on nettoie */
      for (const id in d.talents) {
        const t = NF.talentById(id);
        if (!t || t.max <= 0) { delete d.talents[id]; continue; }
        d.talents[id] = Math.max(0, Math.min(t.max, Math.round(Number(d.talents[id]) || 0)));
        if (!d.talents[id]) delete d.talents[id];
      }
      /* Jamais plus de points placés que de points possédés */
      while (NF.talentSpent(d.talents) > d.talentPoints) {
        const ids = Object.keys(d.talents);
        if (!ids.length) break;
        const last = ids[ids.length - 1];
        if (--d.talents[last] <= 0) delete d.talents[last];
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

    /* ---------- Arbre de talents ---------- */
    talentRank(id) { return this.data.talents[id] || 0; },

    /** Points possédés / placés / disponibles */
    talentPointsFree() {
      return this.data.talentPoints - NF.talentSpent(this.data.talents);
    },

    /** Prix du prochain point de talent */
    nextPointCost() { return NF.talentPointCost(this.data.talentPoints); },

    /** Achète un point de talent avec des cristaux */
    buyTalentPoint() {
      const price = this.nextPointCost();
      if (!this.spend(price)) return false;
      this.data.talentPoints++;
      this.save();
      return true;
    },

    /** Place un point dans un nœud. Renvoie une raison d'échec, ou null. */
    investTalent(id) {
      const t = NF.talentById(id);
      if (!t || t.max <= 0) return 'inconnu';
      const rank = this.talentRank(id);
      if (rank >= t.max) return 'max';
      if (!NF.talentUnlocked(id, this.data.talents)) return 'verrouillé';
      if (this.talentPointsFree() < t.cost) return 'points';
      this.data.talents[id] = rank + 1;
      this.save();
      return null;
    },

    /** Libère tous les points placés (ils restent acquis) */
    respecTalents() {
      const freed = NF.talentSpent(this.data.talents);
      this.data.talents = {};
      this.save();
      return freed;
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

    /* ---------- Secteurs ---------- */
    /** Débloque un secteur. Renvoie true si c'est une découverte. */
    unlockBiome(index) {
      if (index <= this.data.maxBiome) return false;
      this.data.maxBiome = index;
      this.save();
      return true;
    },

    /** Secteur de départ choisi, borné à ce qui est débloqué */
    startWave() {
      const i = Math.min(this.data.startBiome, this.data.maxBiome);
      return NF.biomeFirstWave(i);
    },

    setStartBiome(i) {
      this.data.startBiome = Math.max(0, Math.min(i, this.data.maxBiome));
      this.save();
    },

    /* ---------- Identité du joueur ---------- */
    setPseudo(v) {
      const p = cleanPseudo(v);
      if (p.length < 2) return false;
      this.data.pseudo = p;
      if (!this.data.playerId) this.data.playerId = newId();
      this.save();
      return true;
    },

    /** Chaîne JSON brute (copier/coller manuel) */
    toJSON() { return JSON.stringify(this.data); }
  };

  /* Sauvegarde de sûreté quand l'onglet passe en arrière-plan (mobile) */
  w.addEventListener('visibilitychange', () => { if (document.hidden) Save.save(); });
  w.addEventListener('pagehide', () => Save.save());

})(window);
