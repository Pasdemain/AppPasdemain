/* ============================================================
   menus.js — écrans hors jeu : menu, laboratoire, arsenal, quêtes,
   pause, montée de niveau, fin de partie, sauvegarde JSON
   ============================================================ */
(function (w) {
  'use strict';
  const NF = w.NF, U = NF.U;
  const $ = id => document.getElementById(id);

  const SCREENS = ['menu', 'lab', 'arsenal', 'quests', 'help', 'pause', 'levelup', 'gameover'];

  const M = NF.Menus = {
    current: null,

    init() {
      this.fileInput = document.createElement('input');
      this.fileInput.type = 'file';
      this.fileInput.accept = 'application/json,.json';
      this.fileInput.style.display = 'none';
      document.body.appendChild(this.fileInput);
      this.fileInput.addEventListener('change', () => {
        const f = this.fileInput.files[0];
        if (!f) return;
        NF.Save.importFile(f, (err) => {
          this.fileInput.value = '';
          if (err) { alert('Import impossible : ' + err.message); return; }
          alert('Sauvegarde importée.');
          this.renderMenu();
        });
      });

      /* délégation d'événements sur tous les écrans */
      document.addEventListener('click', (ev) => {
        const el = ev.target.closest('[data-act]');
        if (!el) return;
        this.act(el.dataset.act, el);
      });

      $('btnPause').addEventListener('click', () => NF.game.togglePause());
      $('btnReroll').addEventListener('click', () => this.reroll());
    },

    act(a, el) {
      switch (a) {
        case 'play': NF.game.start(); break;
        case 'lab': this.renderLab(); this.show('lab'); break;
        case 'arsenal': this.renderArsenal(); this.show('arsenal'); break;
        case 'quests': this.renderQuests(); this.show('quests'); break;
        case 'help': this.show('help'); break;
        case 'back': this.renderMenu(); this.show('menu'); break;
        case 'resume': NF.game.togglePause(); break;
        case 'quit': NF.game.endRun(true); break;
        case 'again': NF.game.start(); break;
        case 'menu': this.renderMenu(); this.show('menu'); break;
        case 'export': NF.Save.exportFile(); break;
        case 'import': this.fileInput.click(); break;
        case 'reset':
          if (confirm('Effacer toute la progression (cristaux, armes, quêtes) ?')) {
            NF.Save.reset(); this.renderMenu();
          }
          break;
        case 'buyMeta': {
          const id = el.dataset.id;
          if (NF.Save.buyMeta(id)) { U.buzz(12); this.renderLab(); }
          break;
        }
        case 'buyWeapon': {
          const id = el.dataset.id;
          if (NF.Save.unlockWeapon(id)) { U.buzz(18); this.renderArsenal(); }
          break;
        }
        case 'claim': {
          const id = el.dataset.id;
          const r = NF.Quests.claim(id);
          if (r) { U.buzz(20); this.renderQuests(); }
          break;
        }
      }
    },

    show(id) {
      for (const s of SCREENS) $(s).classList.add('hidden');
      if (id) $(id).classList.remove('hidden');
      this.current = id || null;
      NF.HUD.show(id === null || id === 'pause' || id === 'levelup');
    },

    hideAll() { this.show(null); },

    /* ============================================================
       Menu principal
       ============================================================ */
    renderMenu() {
      const d = NF.Save.data;
      $('statBestWave').textContent = d.bestWave;
      $('statCrystals').textContent = U.fmt(d.crystals);
      $('statRuns').textContent = d.runs;
      const n = NF.Quests.readyCount();
      const badge = $('questBadge');
      badge.textContent = n;
      badge.classList.toggle('hidden', n === 0);
    },

    /* ============================================================
       Laboratoire
       ============================================================ */
    renderLab() {
      $('labCrystals').textContent = U.fmt(NF.Save.data.crystals);
      const box = $('labList');
      box.innerHTML = NF.META.map(m => {
        const lvl = NF.Save.metaLevel(m.id);
        const maxed = lvl >= m.max;
        const price = maxed ? 0 : m.cost(lvl);
        const poor = !maxed && NF.Save.data.crystals < price;
        return `
        <div class="lab-row">
          <div class="lab-ico">${m.icon}</div>
          <div class="lab-info">
            <h4>${m.name}</h4>
            <p>${m.step} — actuel : ${m.desc(lvl)}</p>
            <div class="lvl">Niveau ${lvl} / ${m.max}</div>
          </div>
          <button class="lab-buy ${maxed ? 'max' : (poor ? 'poor' : '')}"
                  data-act="${maxed ? '' : 'buyMeta'}" data-id="${m.id}">
            ${maxed ? 'MAX' : '◈ ' + U.fmt(price)}
          </button>
        </div>`;
      }).join('');
    },

    /* ============================================================
       Arsenal
       ============================================================ */
    renderArsenal() {
      $('arsCrystals').textContent = U.fmt(NF.Save.data.crystals);
      const box = $('arsenalList');
      box.innerHTML = NF.WEAPONS.map(wd => {
        const unlocked = NF.Save.isWeaponUnlocked(wd.id);
        const poor = NF.Save.data.crystals < wd.cost;
        return `
        <div class="arsenal-row ${unlocked ? '' : 'locked'}">
          <div class="lab-ico">${wd.icon}</div>
          <div class="lab-info">
            <h4>${wd.name}</h4>
            <p>${wd.desc}</p>
          </div>
          <button class="lab-buy ${unlocked ? 'max' : (poor ? 'poor' : '')}"
                  data-act="${unlocked ? '' : 'buyWeapon'}" data-id="${wd.id}">
            ${unlocked ? 'OBTENUE' : '◈ ' + U.fmt(wd.cost)}
          </button>
        </div>`;
      }).join('');
    },

    /* ============================================================
       Quêtes
       ============================================================ */
    renderQuests() {
      $('qCrystals').textContent = U.fmt(NF.Save.data.crystals);
      const box = $('questList');
      box.innerHTML = NF.QUESTS.map(q => {
        const s = NF.Quests.state(q);
        const pct = U.clamp(s.prog / s.goal, 0, 1) * 100;
        return `
        <div class="quest-row ${s.ready ? 'done' : ''}">
          <h4>${q.icon} ${q.name} ${s.tier > 0 ? '<span style="color:var(--amber)">· palier ' + (s.tier + 1) + '</span>' : ''}</h4>
          <p>${q.desc(s.goal)}</p>
          <div class="qprog"><i style="width:${pct}%"></i></div>
          <div class="qfoot">
            <span class="qreward">◈ ${U.fmt(s.reward)}</span>
            ${s.ready
              ? `<button class="qclaim" data-act="claim" data-id="${q.id}">RÉCLAMER</button>`
              : `<span class="qdone" style="color:var(--txt-dim)">${U.fmt(Math.min(s.prog, s.goal))} / ${U.fmt(s.goal)}</span>`}
          </div>
        </div>`;
      }).join('');
    },

    /* ============================================================
       Montée de niveau
       ============================================================ */
    showLevelUp(game) {
      this._game = game;
      this.rerolls = this.rerolls == null ? 1 : this.rerolls;
      $('luLevel').textContent = game.player.level;
      this.drawCards();
      $('rerollCount').textContent = this.rerolls;
      $('btnReroll').classList.toggle('hidden', this.rerolls <= 0);
      this.show('levelup');
    },

    drawCards() {
      const game = this._game;
      this.cards = NF.rollCards(game, 3);
      $('cards').innerHTML = this.cards.map((c, i) => `
        <button class="card rar-${c.rar}" data-i="${i}">
          <div class="cico">${c.icon}</div>
          <div>
            <div class="tag">${c.tag}</div>
            <h4>${c.name}</h4>
            <p>${c.desc}</p>
          </div>
        </button>`).join('');
      for (const el of $('cards').children) {
        el.addEventListener('click', () => this.pickCard(+el.dataset.i));
      }
    },

    reroll() {
      if (this.rerolls <= 0) return;
      this.rerolls--;
      $('rerollCount').textContent = this.rerolls;
      $('btnReroll').classList.toggle('hidden', this.rerolls <= 0);
      this.drawCards();
    },

    pickCard(i) {
      const c = this.cards[i];
      if (!c) return;
      U.buzz(14);
      c.take();
      this._game.player.recompute();
      this._game.afterLevelUp();
    },

    /* ============================================================
       Pause / fin de partie
       ============================================================ */
    showPause(game) {
      $('pauseStats').innerHTML = statGrid(game);
      this.show('pause');
    },

    showGameOver(game, res) {
      $('goTitle').textContent = res.quit ? 'PARTIE ABANDONNÉE' : 'SYSTÈME HORS LIGNE';
      $('goStats').innerHTML = statGrid(game);
      $('goRewards').innerHTML = `
        <div>◈ ${U.fmt(res.crystals)} cristaux gagnés</div>
        ${res.best ? '<div style="color:var(--lime)">NOUVEAU RECORD !</div>' : ''}`;
      this.show('gameover');
    }
  };

  function statGrid(game) {
    const p = game.player;
    return `
      <div><b>${game.waves.wave}</b><span>Vague</span></div>
      <div><b>${U.time(game.time)}</b><span>Temps</span></div>
      <div><b>${U.fmt(game.stats.kills)}</b><span>Éliminations</span></div>
      <div><b>${p.level}</b><span>Niveau</span></div>
      <div><b>${U.fmt(game.stats.damage)}</b><span>Dégâts infligés</span></div>
      <div><b>${game.stats.bosses}</b><span>Boss vaincus</span></div>`;
  }

})(window);
