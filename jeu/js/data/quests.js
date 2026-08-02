/* ============================================================
   quests.js — objectifs permanents
   Chaînes infinies : chaque palier réclamé relance un palier supérieur.
   ============================================================ */
(function (w) {
  'use strict';
  const NF = w.NF;

  /* type : compteur cumulé (add) ou meilleur score (max) */
  const QUESTS = NF.QUESTS = [
    { id: 'kills', name: 'Nettoyage', icon: '☠️', mode: 'add',
      desc: n => `Éliminer ${n} ennemis`,
      goal: t => Math.round(100 * Math.pow(2.1, t)),
      reward: t => Math.round(60 * Math.pow(1.9, t)) },

    { id: 'wave', name: 'Percée', icon: '🌊', mode: 'max',
      desc: n => `Atteindre la vague ${n}`,
      goal: t => 5 + t * 5,
      reward: t => Math.round(80 * Math.pow(1.55, t)) },

    { id: 'boss', name: 'Tueur de titans', icon: '👑', mode: 'add',
      desc: n => `Vaincre ${n} boss`,
      goal: t => 1 + t * 2,
      reward: t => Math.round(150 * Math.pow(1.7, t)) },

    { id: 'damage', name: 'Puissance de feu', icon: '💢', mode: 'add',
      desc: n => `Infliger ${NF.U.fmt(n)} dégâts au total`,
      goal: t => Math.round(20000 * Math.pow(2.4, t)),
      reward: t => Math.round(70 * Math.pow(1.9, t)) },

    { id: 'survive', name: 'Endurance', icon: '⏱️', mode: 'max',
      desc: n => `Survivre ${Math.round(n / 60)} min en une partie`,
      goal: t => 180 + t * 120,
      reward: t => Math.round(120 * Math.pow(1.6, t)) },

    { id: 'level', name: 'Ascension', icon: '⏫', mode: 'max',
      desc: n => `Atteindre le niveau ${n} en une partie`,
      goal: t => 10 + t * 6,
      reward: t => Math.round(90 * Math.pow(1.6, t)) },

    { id: 'flawless', name: 'Intouchable', icon: '🕊️', mode: 'add',
      desc: n => `Terminer ${n} vagues sans subir de dégâts`,
      goal: t => 3 + t * 4,
      reward: t => Math.round(130 * Math.pow(1.75, t)) },

    { id: 'ult', name: 'Dernier recours', icon: '🔋', mode: 'add',
      desc: n => `Déclencher ${n} ultimes`,
      goal: t => 15 + t * 20,
      reward: t => Math.round(70 * Math.pow(1.7, t)) },

    { id: 'dash', name: 'Insaisissable', icon: '💨', mode: 'add',
      desc: n => `Effectuer ${n} dashs`,
      goal: t => 100 + t * 150,
      reward: t => Math.round(60 * Math.pow(1.7, t)) },

    { id: 'crystals', name: 'Prospecteur', icon: '◈', mode: 'add',
      desc: n => `Récolter ${NF.U.fmt(n)} cristaux`,
      goal: t => Math.round(500 * Math.pow(2.2, t)),
      reward: t => Math.round(100 * Math.pow(1.9, t)) },

    { id: 'wmax', name: 'Maître d\'armes', icon: '⚔️', mode: 'add',
      desc: n => `Porter ${n} armes au niveau maximum`,
      goal: t => 1 + t * 2,
      reward: t => Math.round(200 * Math.pow(1.8, t)) },

    { id: 'arsenal', name: 'Collection', icon: '🗃️', mode: 'max',
      desc: n => `Débloquer ${n} armes dans l'arsenal`,
      goal: t => Math.min(NF.WEAPONS.length, 3 + t * 2),
      reward: t => Math.round(180 * Math.pow(1.7, t)),
      cap: () => NF.WEAPONS.length }
  ];

  NF.questById = id => QUESTS.find(q => q.id === id);

  /* ------------------------------------------------------------
     Suivi
     ------------------------------------------------------------ */
  const Q = NF.Quests = {
    /** état courant d'une quête : {tier, prog, goal, reward, ready} */
    state(q) {
      const st = NF.Save.data.quests[q.id] || (NF.Save.data.quests[q.id] = { tier: 0, prog: 0 });
      const goal = q.goal(st.tier);
      return {
        tier: st.tier, prog: st.prog, goal,
        reward: q.reward(st.tier),
        ready: st.prog >= goal,
        maxed: q.cap ? (goal >= q.cap() && st.prog >= goal && q.goal(st.tier + 1) > q.cap()) : false
      };
    },

    /** Signale un événement de jeu */
    notify(id, amount) {
      const q = NF.questById(id);
      if (!q) return;
      const st = NF.Save.data.quests[id] || (NF.Save.data.quests[id] = { tier: 0, prog: 0 });
      const before = st.prog;
      if (q.mode === 'max') st.prog = Math.max(st.prog, amount);
      else st.prog += amount;
      if (st.prog !== before) NF.Save.queueSave();
      const goal = q.goal(st.tier);
      if (before < goal && st.prog >= goal && NF.game && NF.game.running) {
        NF.game.toast('Quête accomplie : ' + q.name, 'good');
      }
    },

    /** Réclame la récompense et passe au palier suivant */
    claim(id) {
      const q = NF.questById(id);
      const s = this.state(q);
      if (!s.ready) return 0;
      const st = NF.Save.data.quests[id];
      NF.Save.addCrystals(s.reward);
      st.tier++;
      if (q.mode === 'add') st.prog -= s.goal;
      NF.Save.save();
      return s.reward;
    },

    /** Nombre de récompenses réclamables (pastille du menu) */
    readyCount() {
      let n = 0;
      for (const q of QUESTS) if (this.state(q).ready) n++;
      return n;
    },

    /** Les 3 quêtes les plus proches d'être terminées (affichage en jeu) */
    tracked() {
      return QUESTS.map(q => ({ q, s: this.state(q) }))
        .filter(o => !o.s.ready)
        .sort((a, b) => (b.s.prog / b.s.goal) - (a.s.prog / a.s.goal))
        .slice(0, 3);
    }
  };

})(window);
