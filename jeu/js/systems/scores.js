/* ============================================================
   scores.js — classement des joueurs

   Deux modes, choisis automatiquement au démarrage :
   • en ligne  — si `api/scores.php` répond, les scores sont partagés
                 entre tous les joueurs du site ;
   • local     — sinon, le classement ne contient que les parties de
                 l'appareil. L'écran fonctionne dans les deux cas.
   ============================================================ */
(function (w) {
  'use strict';
  const NF = w.NF;

  const ENDPOINT = 'api/scores.php';
  const TIMEOUT = 5000;
  const MAX_LOCAL = 50;

  /** fetch avec délai maximum */
  function ask(url, opts) {
    opts = opts || {};
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), TIMEOUT);
    return fetch(url, Object.assign({ signal: ctl.signal, cache: 'no-store' }, opts))
      .then(r => {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .finally(() => clearTimeout(t));
  }

  const Scores = NF.Scores = {
    mode: 'local',            // 'local' | 'online'
    ready: false,
    lastError: null,

    /** Cherche un serveur de classement ; sans réponse, on reste local. */
    detect() {
      if (location.protocol === 'file:') {          // pas de serveur possible
        this.mode = 'local'; this.ready = true;
        return Promise.resolve('local');
      }
      return ask(ENDPOINT + '?ping=1')
        .then(r => {
          this.mode = (r && r.ok) ? 'online' : 'local';
          return this.mode;
        })
        .catch(() => 'local')
        .then(m => { this.mode = m; this.ready = true; return m; });
    },

    /** Meilleurs scores, triés vague ↓ puis temps ↑ */
    top(limit) {
      limit = limit || 50;
      if (this.mode === 'online') {
        return ask(ENDPOINT + '?top=' + limit)
          .then(r => (r && Array.isArray(r.scores)) ? r.scores : [])
          .catch(e => { this.lastError = e.message; this.mode = 'local'; return this.localTop(limit); });
      }
      return Promise.resolve(this.localTop(limit));
    },

    localTop(limit) {
      return NF.Save.data.localScores.slice(0, limit || MAX_LOCAL);
    },

    /** Enregistre une partie terminée. Toujours conservée en local. */
    submit(run) {
      const d = NF.Save.data;
      const entry = {
        id: d.playerId,
        pseudo: d.pseudo || 'Anonyme',
        wave: Math.max(1, Math.round(run.wave)),
        time: Math.max(0, Math.round(run.time)),
        kills: Math.max(0, Math.round(run.kills)),
        level: Math.max(1, Math.round(run.level)),
        ts: Date.now()
      };

      this.pushLocal(entry);

      if (this.mode !== 'online' || !d.pseudo) return Promise.resolve(null);
      return ask(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      }).catch(e => { this.lastError = e.message; return null; });
    },

    /** Classement local : un seul meilleur score conservé par partie */
    pushLocal(entry) {
      const list = NF.Save.data.localScores;
      list.push(entry);
      list.sort(cmp);
      if (list.length > MAX_LOCAL) list.length = MAX_LOCAL;
      NF.Save.queueSave();
    },

    /** Rang du joueur dans une liste (1-indexé), ou 0 */
    rankOf(list, id) {
      for (let i = 0; i < list.length; i++) if (list[i].id === id) return i + 1;
      return 0;
    }
  };

  /** Vague décroissante, puis temps croissant (atteindre la vague plus vite) */
  function cmp(a, b) {
    if (b.wave !== a.wave) return b.wave - a.wave;
    return a.time - b.time;
  }
  NF.scoreCmp = cmp;

})(window);
