/* ============================================================
   daily.js — récompense quotidienne et série de connexions
   Cycle de 7 jours qui se répète ; la série se casse si un jour
   est sauté. Tout est local, aucune connexion nécessaire.
   ============================================================ */
(function (w) {
  'use strict';
  const NF = w.NF;

  /* Récompenses du cycle. `crystals` est mis à l'échelle de la
     progression pour rester utile en fin de partie. */
  const CYCLE = NF.DAILY_CYCLE = [
    { day: 1, icon: '◈', crystals: 80, points: 0, label: '80 cristaux' },
    { day: 2, icon: '◈', crystals: 130, points: 0, label: '130 cristaux' },
    { day: 3, icon: '✦', crystals: 0, points: 1, label: '1 point de talent' },
    { day: 4, icon: '◈', crystals: 220, points: 0, label: '220 cristaux' },
    { day: 5, icon: '◈', crystals: 320, points: 0, label: '320 cristaux' },
    { day: 6, icon: '✦', crystals: 0, points: 1, label: '1 point de talent' },
    { day: 7, icon: '🎁', crystals: 550, points: 1, label: '550 cristaux + 1 point' }
  ];

  /** Clé de jour locale « AAAA-MM-JJ » */
  function dayKey(d) {
    d = d || new Date();
    const p = n => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }

  function shiftDay(n) {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return dayKey(d);
  }

  const Daily = NF.Daily = {
    dayKey,

    /** Facteur d'échelle des cristaux, selon la meilleure vague atteinte */
    scale() {
      return 1 + Math.min(3, NF.Save.data.bestWave * 0.05);
    },

    /** État courant : ce qui est réclamable et ce qui vient ensuite */
    state() {
      const d = NF.Save.data.daily;
      const today = dayKey();
      const claimedToday = d.lastDay === today;
      /* série que donnerait une réclamation maintenant */
      const nextStreak = d.lastDay === shiftDay(-1) ? d.streak + 1 : 1;
      const streak = claimedToday ? d.streak : nextStreak;
      const index = ((streak - 1) % CYCLE.length);
      const reward = CYCLE[index];

      /* horloge reculée : on refuse plutôt que d'offrir des récompenses */
      const clockBack = d.lastTs > 0 && Date.now() < d.lastTs - 6 * 3600e3;

      return {
        available: !claimedToday && !clockBack,
        clockBack,
        claimedToday,
        streak,
        bestStreak: d.bestStreak,
        index,
        reward,
        crystals: Math.round(reward.crystals * this.scale() / 5) * 5,
        points: reward.points,
        cycle: CYCLE,
        /* jours du cycle déjà obtenus dans la série en cours */
        doneCount: claimedToday ? index + 1 : index,
        msToNext: msUntilTomorrow()
      };
    },

    /** Réclame la récompense du jour. Renvoie le détail, ou null. */
    claim() {
      const s = this.state();
      if (!s.available) return null;
      const d = NF.Save.data.daily;

      if (s.crystals > 0) NF.Save.addCrystals(s.crystals);
      if (s.points > 0) NF.Save.data.talentPoints += s.points;

      d.lastDay = dayKey();
      d.lastTs = Date.now();
      d.streak = s.streak;
      d.bestStreak = Math.max(d.bestStreak, s.streak);
      d.claimed++;
      NF.Save.save();

      return { crystals: s.crystals, points: s.points, streak: s.streak, day: s.index + 1 };
    }
  };

  function msUntilTomorrow() {
    const now = new Date();
    const t = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
    return t - now;
  }

})(window);
