/* ============================================================
   menus.js — écrans hors jeu : menu, arbre de talents, arsenal, quêtes,
   pause, montée de niveau, fin de partie, sauvegarde JSON
   ============================================================ */
(function (w) {
  'use strict';
  const NF = w.NF, U = NF.U;
  const $ = id => document.getElementById(id);

  const SCREENS = ['menu', 'lab', 'arsenal', 'quests', 'daily', 'board', 'settings', 'help', 'pause', 'levelup', 'gameover'];

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
      $('btnQuickPick').addEventListener('click', () => this.quickPick());
    },

    act(a, el) {
      switch (a) {
        case 'play': NF.game.start(NF.Save.startWave()); break;
        case 'again': NF.game.start(NF.Save.startWave()); break;
        case 'setBiome':
          NF.Save.setStartBiome(+el.dataset.i);
          U.buzz(12);
          this.renderMenu();
          break;
        case 'lab': this._treeCentered = false; this.renderLab(); this.show('lab'); break;
        case 'arsenal': this.renderArsenal(); this.show('arsenal'); break;
        case 'quests': this.renderQuests(); this.show('quests'); break;
        case 'daily': this.renderDaily(); this.show('daily'); break;
        case 'board': this.show('board'); this.renderBoard(); break;
        case 'claimDaily': {
          const r = NF.Daily.claim();
          if (r) {
            U.buzz([16, 40, 16]);
            this.renderDaily();
            this.renderMenu();
          }
          break;
        }
        case 'goSavePseudo': {
          const v = $('goPseudo').value;
          if (NF.Save.setPseudo(v)) { U.buzz(12); this.renderGameOverBoard(this._lastRes); }
          else alert('Choisis un pseudo d\'au moins 2 caractères.');
          break;
        }
        case 'savePseudo': {
          const v = $('pseudoInput').value;
          if (NF.Save.setPseudo(v)) { U.buzz(12); this.renderBoard(); }
          else alert('Choisis un pseudo d\'au moins 2 caractères.');
          break;
        }
        case 'refreshBoard': this.renderBoard(true); break;
        case 'settings':
          /* depuis la pause, on y revient après réglage */
          this._settingsFrom = (this.current === 'pause') ? 'pause' : 'menu';
          this.renderSettings();
          this.show('settings');
          break;
        case 'backFromSettings':
          if (this._settingsFrom === 'pause') { this.showPause(NF.game); }
          else { this.renderMenu(); this.show('menu'); }
          break;
        case 'setHand':
          NF.settings.handed = el.dataset.hand === 'left' ? 'left' : 'right';
          NF.Save.save();
          this.applyHand();
          this.renderSettings();
          U.buzz(14);
          break;
        case 'toggle': {
          const k = el.dataset.key;
          NF.settings[k] = !NF.settings[k];
          NF.Save.save();
          this.renderSettings();
          if (k === 'haptics' && NF.settings[k]) U.buzz(18);
          break;
        }
        case 'help': this.show('help'); break;
        case 'back': this.renderMenu(); this.show('menu'); break;
        case 'resume': NF.game.togglePause(); break;
        case 'quit': NF.game.endRun(true); break;
        case 'menu': this.renderMenu(); this.show('menu'); break;
        case 'export': NF.Save.exportFile(); break;
        case 'import': this.fileInput.click(); break;
        case 'reset':
          if (confirm('Effacer toute la progression (cristaux, armes, quêtes) ?')) {
            NF.Save.reset(); this.renderMenu();
          }
          break;
        case 'fitTree': this.toggleFit(); break;
        case 'buyPoint':
          if (NF.Save.buyTalentPoint()) { U.buzz(12); this.renderLab(); if (this._selTalent) this.selectTalent(this._selTalent); }
          break;
        case 'invest': {
          const why = NF.Save.investTalent(el.dataset.id);
          if (!why) { U.buzz(16); this.renderLab(); this.selectTalent(el.dataset.id); }
          break;
        }
        case 'respec': {
          const n = NF.talentSpent(NF.Save.data.talents);
          if (!n) break;
          if (confirm(`Récupérer les ${n} points placés pour les réattribuer ?`)) {
            NF.Save.respecTalents();
            U.buzz(20);
            this.renderLab();
            if (this._selTalent) this.selectTalent(this._selTalent);
          }
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
       Paramètres
       ============================================================ */

    /** Applique la main directrice au HUD (miroir des commandes) */
    applyHand() {
      document.getElementById('app')
        .classList.toggle('lefty', NF.settings.handed === 'left');
    },

    renderSettings() {
      const st = NF.settings;
      for (const el of document.querySelectorAll('.hand-card')) {
        el.classList.toggle('on', el.dataset.hand === st.handed);
      }
      for (const el of document.querySelectorAll('.set-row')) {
        el.classList.toggle('on', st[el.dataset.key] !== false);
      }
    },

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
      $('dailyBadge').classList.toggle('hidden', !NF.Daily.state().available);
      this.renderBiomePick();
    },

    /** Choix du secteur de départ (visible dès qu'un second est ouvert) */
    renderBiomePick() {
      const box = $('biomePick');
      const d = NF.Save.data;
      if (d.maxBiome <= 0) { box.classList.add('hidden'); return; }
      box.classList.remove('hidden');
      const cur = Math.min(d.startBiome, d.maxBiome);
      let html = '<span class="bp-label">Secteur de départ</span><div class="bp-row">';
      for (let i = 0; i <= d.maxBiome; i++) {
        const b = NF.BIOMES[i % NF.BIOMES.length];
        const first = NF.biomeFirstWave(i);
        html += `<button class="bp-chip ${i === cur ? 'on' : ''}" data-act="setBiome" data-i="${i}"
                   style="--c:${b.accent}">${b.icon} ${esc(NF.biomeLabel(i))}<em>vagues ${first}–${first + 49}</em></button>`;
      }
      box.innerHTML = html + '</div>';
    },

    /* ============================================================
       Récompense quotidienne
       ============================================================ */
    renderDaily() {
      const s = NF.Daily.state();
      $('dailyCrystals').textContent = U.fmt(NF.Save.data.crystals);
      $('streakNow').textContent = s.claimedToday ? s.streak : Math.max(0, s.streak - 1);
      $('streakBest').textContent = s.bestStreak;

      const scale = NF.Daily.scale();
      $('dailyGrid').innerHTML = s.cycle.map((r, i) => {
        const done = i < s.doneCount;
        const today = i === s.index && !s.claimedToday;
        const cry = Math.round(r.crystals * scale / 5) * 5;
        const txt = r.points
          ? (cry ? `◈ ${U.fmt(cry)}<br>+${r.points} pt` : `+${r.points} pt`)
          : `◈ ${U.fmt(cry)}`;
        return `<div class="dcell ${done ? 'done' : ''} ${today ? 'today' : ''} ${r.day === 7 ? 'gift' : ''}">
          <span class="dday">J${r.day}</span>
          <span class="dico">${done ? '✓' : r.icon}</span>
          <span class="dval">${txt}</span>
        </div>`;
      }).join('');

      if (s.clockBack) {
        $('dailyFoot').innerHTML = '<p class="dhint warn">L\'horloge de l\'appareil a reculé. ' +
          'Remets-la à l\'heure pour reprendre la série.</p>';
      } else if (s.available) {
        $('dailyFoot').innerHTML =
          `<button class="btn primary" data-act="claimDaily">RÉCLAMER — ${s.points
            ? (s.crystals ? '◈ ' + U.fmt(s.crystals) + ' + ' + s.points + ' PT' : s.points + ' POINT DE TALENT')
            : '◈ ' + U.fmt(s.crystals)}</button>`;
      } else {
        $('dailyFoot').innerHTML =
          `<p class="dhint">Déjà réclamé aujourd'hui. Prochaine récompense dans <b>${hms(s.msToNext)}</b>.</p>`;
      }
    },

    /* ============================================================
       Classement
       ============================================================ */
    renderBoard(force) {
      const d = NF.Save.data;
      $('pseudoInput').value = d.pseudo;
      const list = $('boardList');
      const mode = $('boardMode');

      mode.textContent = NF.Scores.mode === 'online'
        ? 'Classement en ligne — tous les joueurs du site.'
        : 'Classement local — seules les parties de cet appareil (aucun serveur détecté).';
      mode.className = 'board-mode ' + NF.Scores.mode;

      if (!force && this._boardCache && Date.now() - this._boardAt < 20000) {
        this.paintBoard(this._boardCache);
        return;
      }
      list.innerHTML = '<p class="dhint">Chargement…</p>';
      NF.Scores.top(50).then(rows => {
        this._boardCache = rows;
        this._boardAt = Date.now();
        this.paintBoard(rows);
      });
    },

    paintBoard(rows) {
      const me = NF.Save.data.playerId;
      const list = $('boardList');
      if (!rows.length) {
        list.innerHTML = '<p class="dhint">Aucun score pour l\'instant. Lance une partie !</p>';
        return;
      }
      list.innerHTML = rows.map((r, i) => `
        <div class="brow ${r.id === me ? 'me' : ''} ${i < 3 ? 'top' + (i + 1) : ''}">
          <span class="brank">${i + 1}</span>
          <span class="bname">${esc(r.pseudo)}</span>
          <span class="bwave">vague <b>${r.wave}</b></span>
          <span class="btime">${U.time(r.time)}</span>
        </div>`).join('');
    },

    /* ============================================================
       Arbre de talents
       ============================================================ */
    renderLab() {
      const S = NF.Save, d = S.data;
      $('labCrystals').textContent = U.fmt(d.crystals);

      /* --- bandeau : points et achat --- */
      const free = S.talentPointsFree();
      const price = S.nextPointCost();
      $('ptsFree').textContent = free;
      $('ptsPlural').textContent = free > 1 ? 's' : '';
      $('ptsTotal').textContent = d.talentPoints + ' acheté' + (d.talentPoints > 1 ? 's' : '');
      $('ptPrice').textContent = '◈ ' + U.fmt(price);
      $('btnBuyPoint').classList.toggle('poor', d.crystals < price);
      $('btnRespec').classList.toggle('hidden', NF.talentSpent(d.talents) === 0);

      this.buildTree();
      this.paintTree();
      if (!this._treeCentered) {
        this._treeCentered = true;
        requestAnimationFrame(() => this.centerTree());
      }
    },

    /** Construit une fois le SVG des liaisons et les boutons des nœuds */
    buildTree() {
      if (this._treeBuilt) return;
      this._treeBuilt = true;
      const canvas = $('treeCanvas');
      const svg = $('treeLinks');

      svg.setAttribute('width', NF.TREE_SIZE);
      svg.setAttribute('height', NF.TREE_SIZE);
      svg.innerHTML = NF.TALENT_LINKS.map(([a, b]) => {
        const A = NF.talentById(a), B = NF.talentById(b);
        return `<line data-link="${a}|${b}" x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}" />`;
      }).join('');

      for (const t of NF.TALENTS) {
        const el = document.createElement('button');
        el.className = 'tnode' + (t.key ? ' key' : '') + (t.id === 'core' ? ' core' : '');
        el.dataset.id = t.id;
        el.style.left = t.x + 'px';
        el.style.top = t.y + 'px';
        el.style.setProperty('--c', t.color);
        el.innerHTML = `<span class="tico">${t.icon}</span><em class="trank"></em>`;
        el.addEventListener('click', () => this.selectTalent(t.id));
        canvas.appendChild(el);
      }
    },

    /** Met à jour l'état visuel de chaque nœud et de chaque liaison */
    paintTree() {
      const talents = NF.Save.data.talents;
      const free = NF.Save.talentPointsFree();
      for (const t of NF.TALENTS) {
        const el = $('treeCanvas').querySelector(`[data-id="${t.id}"]`);
        const rank = talents[t.id] || 0;
        const unlocked = NF.talentUnlocked(t.id, talents);
        const maxed = t.max > 0 && rank >= t.max;
        el.classList.toggle('locked', !unlocked && t.id !== 'core');
        el.classList.toggle('owned', rank > 0 || t.id === 'core');
        el.classList.toggle('maxed', maxed);
        el.classList.toggle('ready', unlocked && !maxed && t.max > 0 && free >= t.cost);
        el.classList.toggle('sel', this._selTalent === t.id);
        el.querySelector('.trank').textContent = t.max > 0 ? rank + '/' + t.max : '';
      }
      for (const line of $('treeLinks').children) {
        const [a, b] = line.dataset.link.split('|');
        const on = (a === 'core' || (talents[a] || 0) > 0) && (b === 'core' || (talents[b] || 0) > 0);
        line.classList.toggle('on', on);
      }
    },

    centerTree() {
      const vp = $('treeViewport');
      vp.scrollLeft = (vp.scrollWidth - vp.clientWidth) / 2;
      vp.scrollTop = (vp.scrollHeight - vp.clientHeight) / 2;
    },

    /** Vue d'ensemble : l'arbre entier tient dans la largeur disponible */
    toggleFit() {
      const cv = $('treeCanvas'), vp = $('treeViewport');
      this._fit = !this._fit;
      const k = Math.min(1, (vp.clientWidth - 8) / NF.TREE_SIZE);
      cv.style.setProperty('--fit', k);
      cv.style.width = cv.style.height = this._fit ? (NF.TREE_SIZE * k) + 'px' : NF.TREE_SIZE + 'px';
      cv.classList.toggle('fit', this._fit);
      $('btnFit').classList.toggle('on', this._fit);
      requestAnimationFrame(() => this._selTalent ? this.centerOn(this._selTalent) : this.centerTree());
    },

    /** Amène un nœud au centre de la fenêtre de l'arbre */
    centerOn(id) {
      const t = NF.talentById(id);
      if (!t) return;
      const vp = $('treeViewport');
      const k = this._fit ? Math.min(1, (vp.clientWidth - 8) / NF.TREE_SIZE) : 1;
      vp.scrollTo({
        left: t.x * k - vp.clientWidth / 2,
        top: t.y * k - vp.clientHeight / 2,
        behavior: 'smooth'
      });
    },

    selectTalent(id) {
      this._selTalent = id;
      const t = NF.talentById(id);
      const talents = NF.Save.data.talents;
      const rank = talents[id] || 0;
      const unlocked = NF.talentUnlocked(id, talents);
      const free = NF.Save.talentPointsFree();
      const maxed = t.max > 0 && rank >= t.max;

      let action = '';
      if (t.max <= 0) {
        action = '<span class="tstate">Toujours actif</span>';
      } else if (maxed) {
        action = '<span class="tstate max">Rang maximum</span>';
      } else if (!unlocked) {
        action = '<span class="tstate lock">Investis d\'abord dans un nœud voisin</span>';
      } else if (free < t.cost) {
        action = `<span class="tstate lock">${t.cost} point${t.cost > 1 ? 's' : ''} requis — il t'en reste ${free}</span>`;
      } else {
        action = `<button class="tbuy" data-act="invest" data-id="${id}">PLACER ${t.cost} POINT${t.cost > 1 ? 'S' : ''}</button>`;
      }

      const cur = rank > 0 ? `<div class="tcur">Cumul actuel : ${describe(t, rank)}</div>` : '';
      $('treeDetail').innerHTML = `
        <div class="tdet-head" style="--c:${t.color}">
          <span class="tico">${t.icon}</span>
          <div>
            <h4>${t.name}</h4>
            <span class="tbranch">${t.branchName || 'Noyau'}${t.key ? ' · talent majeur' : ''}</span>
          </div>
          <b class="trankbig">${t.max > 0 ? rank + ' / ' + t.max : '—'}</b>
        </div>
        <p class="tstep">${t.step}${t.max > 1 ? ' <em>par rang</em>' : ''}</p>
        ${cur}
        ${action}`;
      this.paintTree();
      this.centerOn(id);
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
      const many = game.player.pendingLevels > 3;
      $('btnQuickPick').classList.toggle('hidden', !many);
      if (many) $('quickCount').textContent = game.player.pendingLevels;
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

    /** Enchaîne les niveaux en attente en tirant au sort à chaque fois */
    quickPick() {
      const g = this._game;
      let guard = 0;
      g._quiet = true;                       // évite un mur de notifications
      while (g.player.pendingLevels > 0 && guard++ < 80) {
        this.pickCard((Math.random() * this.cards.length) | 0);
      }
      g._quiet = false;
      g.toast('AMÉLIORATIONS APPLIQUÉES', 'good');
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

    /** Bloc classement de l'écran de fin : pseudo à saisir, ou rang obtenu */
    renderGameOverBoard(res) {
      const box = $('goBoard');
      const d = NF.Save.data;
      if (!d.pseudo) {
        box.innerHTML = `
          <p class="dhint">Choisis un pseudo pour apparaître au classement :</p>
          <div class="pseudo-row">
            <input id="goPseudo" type="text" maxlength="16" placeholder="ton nom" autocomplete="off" spellcheck="false">
            <button class="btn small" data-act="goSavePseudo">OK</button>
          </div>`;
        return;
      }
      box.innerHTML = `<p class="dhint">Score envoyé au classement sous <b>${esc(d.pseudo)}</b>.</p>`;
      NF.Scores.submit(res.run).then(r => {
        if (r && r.rank) box.innerHTML = `<p class="dhint">Classement : <b>${esc(d.pseudo)}</b> — ${r.rank}<sup>e</sup> place.</p>`;
      });
    },

    showGameOver(game, res) {
      this._lastRes = res;
      const box = $('gameover').querySelector('.modal');
      box.classList.toggle('win', !!res.victory);
      $('goTitle').textContent = res.victory
        ? 'SECTEUR NETTOYÉ'
        : (res.quit ? 'PARTIE ABANDONNÉE' : 'SYSTÈME HORS LIGNE');
      $('goStats').innerHTML =
        (res.victory && res.biome ? `<div class="go-win">${res.biome.icon} ${esc(res.biome.name)} — 50 vagues, 5 boss</div>` : '')
        + statGrid(game);
      $('goRewards').innerHTML = `
        <div>◈ ${U.fmt(res.crystals)} cristaux gagnés${res.victory ? ' <em>(prime de secteur)</em>' : ''}</div>
        ${res.unlocked != null
          ? `<div style="color:var(--lime)">SECTEUR DÉBLOQUÉ : ${esc(NF.biomeLabel(res.unlocked))}</div>
             <div class="dhint">Choisis-le au menu pour y lancer une partie.</div>`
          : ''}
        ${res.best ? '<div style="color:var(--lime)">NOUVEAU RECORD !</div>' : ''}`;
      this.renderGameOverBoard(res);
      this.show('gameover');
    }
  };

  /* ------------------------------------------------------------
     Décrit l'effet cumulé d'un talent en comparant les statistiques
     de base avec et sans lui : aucun texte à maintenir à la main.
     ------------------------------------------------------------ */
  const pct = v => (v > 0 ? '+' : '') + Math.round(v * 100) + ' %';
  const num = v => (v > 0 ? '+' : '') + Math.round(v * 10) / 10;
  const STAT_LABEL = {
    maxHp: [v => num(v) + ' PV max'],
    damage: [v => pct(v) + ' de dégâts'],
    fireRate: [v => pct(v) + ' de cadence'],
    moveSpeed: [v => pct(v) + ' de vitesse'],
    armor: [v => '−' + Math.round(v * 100) + ' % de dégâts subis'],
    crit: [v => pct(v) + ' de critique'],
    critMult: [v => pct(v) + ' de dégâts critiques'],
    regen: [v => num(v) + ' PV/s'],
    magnet: [v => pct(v) + ' de collecte'],
    xpGain: [v => pct(v) + ' d\'expérience'],
    pierce: [v => num(v) + ' ennemi traversé'],
    projSpeed: [v => pct(v) + ' de vitesse de projectile'],
    projSize: [v => pct(v) + ' de taille de projectile'],
    dashCd: [v => '−' + Math.round(v * 100) + ' % de recharge du dash'],
    ultGain: [v => pct(v) + ' de charge d\'ultime'],
    greed: [v => pct(v) + ' de cristaux'],
    luck: [v => pct(v) + ' de chance'],
    slowAura: [v => 'ralentissement de ' + Math.round(v * 100) + ' %'],
    shieldCd: [() => 'bouclier périodique'],
    startLevel: [v => num(v) + ' niveau de départ'],
    slots: [v => num(v) + ' emplacement d\'arme'],
    revives: [v => num(v) + ' résurrection'],
    critExplode: [() => 'explosions critiques'],
    dashPhase: [() => 'dash traversant']
  };

  function describe(t, rank) {
    const before = NF.baseStats(null);
    const after = NF.baseStats(null);
    t.apply(after, rank);
    const out = [];
    for (const k in after) {
      if (after[k] === before[k]) continue;
      const lbl = STAT_LABEL[k];
      if (!lbl) continue;
      out.push(typeof after[k] === 'boolean' ? lbl[0]() : lbl[0](after[k] - before[k]));
    }
    return out.length ? out.join(', ') : '—';
  }

  /** Échappe le texte venu d'ailleurs (pseudo d'un autre joueur) */
  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  /** Durée « 7 h 12 min » pour le compte à rebours quotidien */
  function hms(ms) {
    const m = Math.max(0, Math.round(ms / 60000));
    const h = Math.floor(m / 60);
    return h > 0 ? h + ' h ' + (m % 60) + ' min' : m + ' min';
  }

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
