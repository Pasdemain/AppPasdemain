/* ============================================================
   menus.js — écrans hors jeu : menu, arbre de talents, arsenal, quêtes,
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
        case 'lab': this._treeCentered = false; this.renderLab(); this.show('lab'); break;
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
