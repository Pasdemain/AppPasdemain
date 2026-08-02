/* ============================================================
   game.js — boucle principale, monde, collisions, règles
   ============================================================ */
(function (w) {
  'use strict';
  const NF = w.NF, U = NF.U, C = NF.C, FX = NF.FX;

  const WORLD_W = 2600, WORLD_H = 2000;
  const CELL = 72;                  // taille des cases de la grille de collision

  class Game {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d', { alpha: false });
      this.world = { w: WORLD_W, h: WORLD_H };
      this.view = { w: 800, h: 600 };
      this.cam = { x: 0, y: 0 };
      this.dpr = 1;

      this.player = new NF.Player();
      this.waves = new NF.Waves(this);

      this.enemies = [];
      this.bullets = [];
      this.ebullets = [];
      this.hazards = [];
      this.pickups = [];
      this.zaps = [];
      this.playerBeams = [];
      this.singularities = [];

      this.grid = new Map();
      this.qte = null;
      this.interlude = null;
      this.running = false;
      this.paused = false;
      this.levelling = false;
      this.time = 0;
      this.dt = 0;
      this.invertT = 0;
      this._acc = 0;
      this._last = 0;

      this.stats = this.freshStats();
      this.resize();
      w.addEventListener('resize', () => this.resize());
      w.addEventListener('orientationchange', () => setTimeout(() => this.resize(), 250));
    }

    freshStats() {
      return { kills: 0, damage: 0, bosses: 0, ults: 0, dashes: 0, flawless: 0, tookDamageThisWave: false, crystalsRun: 0 };
    }

    /* ============================================================
       Cycle de vie
       ============================================================ */
    resize() {
      const dpr = Math.min(2, w.devicePixelRatio || 1);
      const cw = w.innerWidth, ch = w.innerHeight;
      this.dpr = dpr;
      this.canvas.width = Math.floor(cw * dpr);
      this.canvas.height = Math.floor(ch * dpr);
      this.canvas.style.width = cw + 'px';
      this.canvas.style.height = ch + 'px';
      this.view.w = cw; this.view.h = ch;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    start(startWave) {
      startWave = Math.max(1, Math.round(startWave || 1));
      this.enemies.length = 0;
      this.bullets.length = 0;
      this.ebullets.length = 0;
      this.hazards.length = 0;
      this.pickups.length = 0;
      this.zaps.length = 0;
      this.playerBeams.length = 0;
      this.singularities.length = 0;
      FX.reset();
      NF.HUD.clearToasts();

      if (NF.QTE.active) NF.QTE.cancel();
      NF.Interlude.abort(this);
      this.stats = this.freshStats();
      this.time = 0;
      this.invertT = 0;
      this._maxedSeen = 0;
      this.player.reset(this);
      this.addWeapon('blaster');

      this.waves.reset(startWave);
      this.applyBiome(NF.biomeInfo(startWave));
      this.startWave = startWave;
      this.endWave = startWave + NF.WAVES_PER_BIOME - 1;   // la partie s'arrête là
      this.finishing = false;
      this.waves.start(startWave);

      NF.Input.reset();
      NF.Menus.rerolls = 1;
      NF.Menus.hideAll();
      this.running = true;
      this.paused = false;
      this.levelling = false;
      this._last = performance.now();

      // niveaux offerts par le Laboratoire
      this.checkLevelUp();
    }

    /** Change de secteur : palette, décor et dangers d'ambiance */
    applyBiome(info) {
      const b = info.biome;
      const changed = this.biome !== b;
      this.biome = b;
      this.biomeInfo = info;
      this.eruptT = b.eruptions || 0;
      if (!changed && this.cracks) return;

      /* décor « faille » : des fractures figées dans le sol */
      this.cracks = [];
      this.pools = [];
      if (b.decor === 'core') {
        /* décor « noyau » : des bassins de magma et des anneaux concentriques */
        for (let i = 0; i < 18; i++) {
          this.pools.push({
            x: U.rand(120, this.world.w - 120), y: U.rand(120, this.world.h - 120),
            r: U.rand(40, 130), ph: U.rand(0, U.TAU), sp: U.rand(.5, 1.2)
          });
        }
      }
      if (b.decor === 'rift') {
        for (let i = 0; i < 26; i++) {
          const pts = [];
          let x = U.rand(0, this.world.w), y = U.rand(0, this.world.h);
          let a = U.rand(0, U.TAU);
          const seg = U.randInt(3, 6);
          for (let j = 0; j < seg; j++) {
            pts.push({ x, y });
            a += U.rand(-.7, .7);
            const len = U.rand(70, 190);
            x += Math.cos(a) * len; y += Math.sin(a) * len;
          }
          pts.push({ x, y });
          this.cracks.push(pts);
        }
      }
    }

    /** Éruptions d'ambiance propres au secteur (hors boss) */
    updateAmbient(dt) {
      if (!this.biome || !this.biome.eruptions) return;
      this.eruptT -= dt;
      if (this.eruptT > 0) return;
      this.eruptT = this.biome.eruptions * U.rand(.75, 1.25);
      const p = this.player;
      const pt = U.ringPoint(p.x, p.y, 90, 320);
      this.hazards.push(new NF.Hazard({
        kind: 'zone',
        x: U.clamp(pt.x, 40, this.world.w - 40),
        y: U.clamp(pt.y, 40, this.world.h - 40),
        r: 105, telegraph: 1.25, duration: .5,
        dmg: 12 * (this.waves.scale ? this.waves.scale.dmg : 1),
        color: this.biome.accent2, tickRate: .5
      }));
    }

    endRun(quit, victory) {
      if (!this.running) return;
      this.running = false;
      const wave = Math.max(1, this.waves.wave - (this.waves.state === 'cleared' ? 0 : 1));
      const greed = 1 + this.player.stats.greed;
      let crystals = Math.round((Math.pow(this.waves.wave, 1.55) * 2.2 + this.stats.kills * 0.35 + this.stats.bosses * 40) * greed);
      /* nettoyer un secteur entier vaut une prime */
      if (victory) crystals = Math.round(crystals * 1.6 + 400);

      const best = this.waves.wave > NF.Save.data.bestWave;
      NF.Save.addCrystals(crystals);
      NF.Save.recordRun({ wave: this.waves.wave, time: this.time, kills: this.stats.kills });

      NF.Quests.notify('wave', this.waves.wave);
      NF.Quests.notify('survive', this.time);
      NF.Quests.notify('level', this.player.level);
      NF.Save.save();

      const run = {
        wave: this.waves.wave, time: this.time,
        kills: this.stats.kills, level: this.player.level
      };
      NF.Menus.showGameOver(this, {
        crystals, best, quit: !!quit, wave, run,
        victory: !!victory,
        biome: this.biome,
        unlocked: this._justUnlocked || null
      });
      this._justUnlocked = null;
    }

    togglePause() {
      if (!this.running || this.levelling || this.qte || this.interlude) return;
      this.paused = !this.paused;
      if (this.paused) NF.Menus.showPause(this);
      else { NF.Menus.hideAll(); this._last = performance.now(); }
    }

    /* ============================================================
       Boucle
       ============================================================ */
    frame(ts) {
      let dt = (ts - this._last) / 1000;
      this._last = ts;
      if (!isFinite(dt) || dt < 0) dt = 0;
      dt = Math.min(dt, 0.05);              // évite les sauts après une pause
      this.dt = dt;

      if (this.running && !this.paused && !this.levelling) this.update(dt);
      this.draw();
    }

    update(dt) {
      /* Un QTE fige le monde : seule la surcouche vit. */
      if (this.qte) { NF.QTE.update(dt); return; }
      /* Un interlude prend la main sur toute la boucle. */
      if (this.interlude) {
        NF.Interlude.update(dt, this);
        FX.update(dt);
        if (!this.player.alive) { NF.Interlude.abort(this); this.endRun(false); return; }
        NF.HUD.update(this);
        return;
      }

      this.time += dt;
      if (this.invertT > 0) this.invertT -= dt;

      this.buildGrid();
      this.player.update(dt, this);
      this.waves.update(dt);

      for (const e of this.enemies) if (!e.dead) e.update(dt, this);
      for (const b of this.bullets) if (!b.dead) b.update(dt, this);
      for (const b of this.ebullets) if (!b.dead) b.update(dt, this);
      for (const h of this.hazards) if (!h.dead) h.update(dt, this);
      for (const p of this.pickups) if (!p.dead) p.update(dt, this);
      for (const z of this.zaps) if (!z.dead) z.update(dt);

      this.updateBeams(dt);
      this.updateSingularities(dt);
      this.updateAmbient(dt);
      this.collide();
      FX.update(dt);

      U.prune(this.enemies); U.prune(this.bullets); U.prune(this.ebullets);
      U.prune(this.hazards); U.prune(this.pickups); U.prune(this.zaps);

      /* fin de partie */
      if (!this.player.alive) { this.endRun(false); return; }

      this.checkLevelUp();
      this.updateCamera(dt);
      NF.HUD.update(this);
    }

    updateCamera(dt) {
      const p = this.player;
      const tx = U.clamp(p.x - this.view.w / 2, 0, Math.max(0, this.world.w - this.view.w));
      const ty = U.clamp(p.y - this.view.h / 2, 0, Math.max(0, this.world.h - this.view.h));
      const k = Math.min(1, dt * 8);
      this.cam.x = U.lerp(this.cam.x, tx, k);
      this.cam.y = U.lerp(this.cam.y, ty, k);
    }

    checkLevelUp() {
      if (this.player.pendingLevels > 0 && !this.levelling && this.running) {
        this.levelling = true;
        NF.Menus.showLevelUp(this);
      }
    }

    afterLevelUp() {
      this.player.pendingLevels--;
      if (this.player.pendingLevels > 0) {
        NF.Menus.showLevelUp(this);
      } else {
        this.levelling = false;
        NF.Menus.hideAll();
        this._last = performance.now();
        /* petit sursis en revenant dans l'action : on ne se fait pas
           toucher pendant qu'on relit l'écran */
        this.player.invuln = Math.max(this.player.invuln, 0.5);
        // une relance offerte par palier de 5 niveaux
        if (this.player.level % 5 === 0) NF.Menus.rerolls++;
      }
    }

    /* ============================================================
       Grille spatiale (séparation + collisions)
       ============================================================ */
    buildGrid() {
      const g = this.grid;
      g.clear();
      for (const e of this.enemies) {
        if (e.dead) continue;
        const cx = (e.x / CELL) | 0, cy = (e.y / CELL) | 0;
        const k = cx * 4096 + cy;
        let arr = g.get(k);
        if (!arr) { arr = []; g.set(k, arr); }
        arr.push(e);
      }
    }

    /** Ennemis dans les cases autour d'un point */
    near(x, y, radius, out) {
      out.length = 0;
      const c0 = ((x - radius) / CELL) | 0, c1 = ((x + radius) / CELL) | 0;
      const r0 = ((y - radius) / CELL) | 0, r1 = ((y + radius) / CELL) | 0;
      for (let cx = c0; cx <= c1; cx++) {
        for (let cy = r0; cy <= r1; cy++) {
          const arr = this.grid.get(cx * 4096 + cy);
          if (arr) for (let i = 0; i < arr.length; i++) out.push(arr[i]);
        }
      }
      return out;
    }

    separation(e) {
      const out = this._sepTmp || (this._sepTmp = []);
      this.near(e.x, e.y, e.r + 26, out);
      let sx = 0, sy = 0;
      for (let i = 0; i < out.length; i++) {
        const o = out[i];
        if (o === e || o.dead) continue;
        const dx = e.x - o.x, dy = e.y - o.y;
        const d2 = dx * dx + dy * dy;
        const min = e.r + o.r;
        if (d2 > 0.001 && d2 < min * min) {
          const d = Math.sqrt(d2);
          const push = (min - d) / min;
          sx += (dx / d) * push * 130;
          sy += (dy / d) * push * 130;
        }
      }
      return { x: sx, y: sy };
    }

    /* ============================================================
       Collisions
       ============================================================ */
    collide() {
      const tmp = this._colTmp || (this._colTmp = []);

      /* projectiles joueur → ennemis */
      for (const b of this.bullets) {
        if (b.dead) continue;
        this.near(b.x, b.y, b.r + 40, tmp);
        for (let i = 0; i < tmp.length; i++) {
          const e = tmp[i];
          if (e.dead) continue;
          if (b.hits && b.hits.has(e.uid)) continue;
          const rr = b.r + e.r;
          if (U.dist2(b.x, b.y, e.x, e.y) > rr * rr) continue;
          const res = this.damageEnemy(e, b.dmg, { fromX: b.x, fromY: b.y, source: b.owner, knock: b.knock });
          if (res === false) continue;              // cible fantôme : le tir poursuit sa route
          b.onHit(e, this);
          if (b.dead) break;
        }
      }

      /* projectiles ennemis → joueur */
      const p = this.player;
      if (p.alive) {
        for (const b of this.ebullets) {
          if (b.dead) continue;
          const rr = b.r + p.r;
          if (U.dist2(b.x, b.y, p.x, p.y) < rr * rr) {
            b.dead = true;
            this.hurtPlayer(b.dmg, b);
          }
        }
      }
    }

    /* ============================================================
       Faisceaux du joueur (arme laser)
       ============================================================ */
    updateBeams(dt) {
      const p = this.player;
      const tmp = [];
      for (const bm of this.playerBeams) {
        bm.t += dt;
        if (bm.t >= bm.life) { bm.dead = true; continue; }
        if (bm.follow) { bm.x = p.x; bm.y = p.y; }
        bm.tick -= dt;
        if (bm.tick <= 0) {
          bm.tick = bm.tickRate;
          const x2 = bm.x + Math.cos(bm.angle) * bm.len;
          const y2 = bm.y + Math.sin(bm.angle) * bm.len;
          for (const e of this.enemies) {
            if (e.dead) continue;
            if (U.distToSegment(e.x, e.y, bm.x, bm.y, x2, y2) < bm.width / 2 + e.r) {
              this.damageEnemy(e, bm.dmg, { fromX: bm.x, fromY: bm.y, source: 'laser' });
            }
          }
        }
      }
      U.prune(this.playerBeams);
      void tmp;
    }

    updateSingularities(dt) {
      for (const s of this.singularities) {
        s.t += dt;
        if (s.t >= s.life) { s.dead = true; continue; }
        s.pulse = (s.pulse || 0) - dt;
        const doDmg = s.pulse <= 0;
        if (doDmg) s.pulse = 0.35;
        for (const e of this.enemies) {
          if (e.dead || e.isBoss) continue;
          const d = U.dist(s.x, s.y, e.x, e.y);
          if (d < s.r) {
            const a = U.angle(e.x, e.y, s.x, s.y);
            const pull = (1 - d / s.r) * 260;
            e.x += Math.cos(a) * pull * dt;
            e.y += Math.sin(a) * pull * dt;
            if (doDmg) this.damageEnemy(e, s.dmg, { silent: true, source: 'singularity' });
          }
        }
        // les boss sont seulement freinés
        for (const e of this.enemies) {
          if (e.dead || !e.isBoss) continue;
          if (U.dist(s.x, s.y, e.x, e.y) < s.r) {
            if (doDmg) this.damageEnemy(e, s.dmg * .6, { silent: true, source: 'singularity' });
          }
        }
      }
      U.prune(this.singularities);
    }

    /* ============================================================
       Actions de jeu
       ============================================================ */
    shoot(bullet) {
      this.bullets.push(bullet);
      /* talent « Double détente » : le tir part parfois en double */
      const dbl = this.player.base && this.player.base.doubleShot;
      if (dbl && Math.random() < dbl) {
        const twin = Object.assign(Object.create(Object.getPrototypeOf(bullet)), bullet);
        twin.hits = null;
        const a = bullet.angle + U.rand(-.09, .09);
        const sp = Math.hypot(bullet.vx, bullet.vy);
        twin.angle = a;
        twin.vx = Math.cos(a) * sp;
        twin.vy = Math.sin(a) * sp;
        this.bullets.push(twin);
      }
    }

    enemyShoot(from, angle, o) {
      o = o || {};
      this.ebullets.push(new NF.EBullet({
        x: from.x, y: from.y, angle,
        speed: o.speed || 240, dmg: o.dmg || from.dmg,
        r: o.r || 6, color: o.color || from.color,
        life: o.life || 6, homing: o.homing || 0, spin: o.spin || 0
      }));
    }

    roll(base) { return base * U.rand(.94, 1.06); }

    /** Cible la plus proche. Les cibles invulnérables (leurres, boss protégé)
        ne sont retenues qu'en dernier recours : sinon l'auto-visée gaspille
        tous les tirs sur une carapace. */
    nearestEnemy(x, y, maxDist) {
      const max2 = (maxDist || 900) * (maxDist || 900);
      let best = null, bd = max2;
      let fallback = null, fd = max2;
      for (const e of this.enemies) {
        if (e.dead) continue;
        const d = U.dist2(x, y, e.x, e.y);
        if (e.immune || e.invuln) {
          if (d < fd) { fd = d; fallback = e; }
          continue;
        }
        if (d < bd) { bd = d; best = e; }
      }
      return best || fallback;
    }

    damageEnemy(e, dmg, opt) {
      opt = opt || {};
      if (e.dead) return 0;

      /* `false` ⇒ le projectile traverse : il ne doit pas être gaspillé
         sur un leurre ou une carapace invulnérable. */
      if (e.immune) {
        if (!opt.silent && Math.random() < .06) FX.text(e.x, e.y - e.r - 6, 'LEURRE', '#8fa3bd');
        return false;
      }
      if (e.invuln) {
        if (!opt.silent && Math.random() < .06) FX.text(e.x, e.y - e.r - 6, 'IMMUNISÉ', '#ffd23e');
        return false;
      }
      if (e.blocks && opt.fromX != null && e.blocks(opt.fromX, opt.fromY)) {
        if (!opt.silent && Math.random() < .25) FX.text(e.x, e.y - e.r - 6, 'BLOQUÉ', '#3ef2ff');
        FX.burst(opt.fromX, opt.fromY, 3, '#3ef2ff', { speed: 90, life: .2, size: 2 });
        return 0;
      }

      /* Gardien : le bouclier encaisse avant la coque */
      if (e.ward > 0) {
        const absorbed = Math.min(e.ward, dmg);
        e.ward -= absorbed;
        e.wardT = 0;
        dmg -= absorbed;
        if (!opt.silent && Math.random() < .2) FX.text(e.x, e.y - e.r - 6, 'BOUCLIER', '#ffd23e');
        if (e.ward <= 0) {
          FX.shockwave(e.x, e.y, 46, '#ffd23e', .3);
          FX.text(e.x, e.y - e.r - 6, 'BOUCLIER BRISÉ', NF.C.amber, true);
        }
        if (dmg <= 0) { e.hitFlash = 0.09; return 0; }
      }

      const p = this.player;
      let crit = false;
      if (!opt.silent && Math.random() < p.stats.crit) { dmg *= p.stats.critMult; crit = true; }
      if (e.shielded > 0) dmg *= (1 - e.shielded);
      if (e.dmgTaken) dmg *= e.dmgTaken;      // PARADOXE : double pendant l'inversion

      e.hp -= dmg;
      e.hitFlash = 0.09;
      this.stats.damage += dmg;
      NF.Quests.notify('damage', dmg);

      if (p.stats.lifesteal > 0 && p.hp < p.stats.maxHp) {
        p.hp = Math.min(p.stats.maxHp, p.hp + dmg * p.stats.lifesteal);
      }
      if (opt.knock) e.knock(U.angle(opt.fromX != null ? opt.fromX : p.x, opt.fromY != null ? opt.fromY : p.y, e.x, e.y), opt.knock);

      if (!opt.silent) {
        FX.text(e.x, e.y - e.r - 4, Math.round(dmg) + (crit ? '!' : ''), crit ? NF.C.amber : '#fff', crit);
        if (crit) FX.burst(e.x, e.y, 3, NF.C.amber, { speed: 130, life: .25, size: 2.5 });
      }

      /* talent « Détonation critique » — les dégâts de souffle sont muets,
         ils ne peuvent donc pas critiquer à leur tour ni s'enchaîner. */
      if (crit && p.base.critExplode) {
        const R = 96, blast = dmg * 0.4;
        FX.shockwave(e.x, e.y, R, NF.C.amber, .3);
        for (const o of this.enemies) {
          if (o.dead || o === e) continue;
          if (U.dist(e.x, e.y, o.x, o.y) < R + o.r) {
            this.damageEnemy(o, blast, { silent: true, source: 'critblast' });
          }
        }
      }

      /* talent « Exécution » : achève les ennemis très entamés */
      const ex = p.base.execute;
      if (ex && !e.isBoss && e.hp > 0 && e.hp < e.maxHp * ex) {
        FX.text(e.x, e.y - e.r - 6, 'EXÉCUTÉ', '#ff4d5e');
        e.hp = 0;
      }

      if (e.hp <= 0) this.killEnemy(e);
      return dmg;
    }

    killEnemy(e, noDrop) {
      if (e.dead) return;
      e.dead = true;
      const p = this.player;

      FX.burst(e.x, e.y, e.isBoss ? 46 : (e.elite ? 22 : 9), e.color,
        { speed: e.isBoss ? 420 : 220, life: e.isBoss ? .9 : .45, size: e.isBoss ? 5 : 3, glow: true });
      if (e.isBoss || e.elite) { FX.shockwave(e.x, e.y, e.isBoss ? 320 : 120, e.color, .6); FX.kick(e.isBoss ? 16 : 6); }

      if (e.onDeath) e.onDeath();

      /* la Sangsue relâche l'expérience qu'elle a volée */
      if (e.stolen > 0) {
        const n = Math.min(12, Math.max(1, Math.round(e.stolen / 3)));
        const per = Math.max(1, Math.round(e.stolen / n));
        for (let i = 0; i < n; i++) {
          const pt = U.ringPoint(e.x, e.y, 6, 30);
          this.pickups.push(new NF.Pickup(pt.x, pt.y, 'xp', per));
        }
      }

      /* réplicants : éclatent en fragments */
      if (e.def.split && !noDrop) {
        for (let i = 0; i < e.def.split; i++) {
          const pt = U.ringPoint(e.x, e.y, 10, 34);
          const m = new NF.Enemy('mini', pt.x, pt.y, this.waves.scale, false);
          m.hp = m.maxHp = e.maxHp * 0.18;
          this.enemies.push(m);
        }
      }

      if (!noDrop) this.dropLoot(e);

      this.stats.kills++;
      NF.Quests.notify('kills', 1);
      p.gainUlt(e.isBoss ? 60 : (e.elite ? 14 : 3.5));

      if (e.isBoss) {
        /* le boss emporte ses structures : leurres, nœuds et piliers
           sont détruits avec lui, sinon la vague ne se termine jamais */
        for (const m of this.enemies) {
          if (m.dead || m === e) continue;
          const mine = m.bossRef === e || (m.anchor && m.anchor.boss === e) ||
            (e.pillars && e.pillars.indexOf(m) >= 0);
          if (!mine) continue;
          m.dead = true;
          FX.burst(m.x, m.y, 10, m.color, { speed: 200, life: .5, glow: true });
        }
        this.stats.bosses++;
        NF.Quests.notify('boss', 1);
        this.toast('BOSS VAINCU', 'good');

        /* le boss de la dernière vague d'un secteur ouvre le suivant */
        if (NF.isBiomeFinale(this.waves.wave)) {
          const next = NF.biomeInfo(this.waves.wave).index + 1;
          if (NF.Save.unlockBiome(next)) {
            this._justUnlocked = next;
            this.toast('SECTEUR DÉBLOQUÉ : ' + NF.biomeLabel(next), 'good');
            FX.screenFlash('#fff', .7);
          }
        }
        FX.screenFlash('#fff', .5);
        U.buzz([40, 60, 40, 60, 90]);
        for (let i = 0; i < 10; i++) {
          const pt = U.ringPoint(e.x, e.y, 20, 120);
          this.pickups.push(new NF.Pickup(pt.x, pt.y, 'crystal', 12 + this.waves.wave));
        }
        this.pickups.push(new NF.Pickup(e.x, e.y + 30, 'heal', 0.45));
      }
    }

    dropLoot(e) {
      const luck = this.player.stats.luck;
      /* éclats d'XP */
      let n = e.isBoss ? 26 : (e.elite ? 6 : (e.xp > 4 ? 3 : 1));
      const per = Math.max(1, Math.round(e.xp / n));
      for (let i = 0; i < n; i++) {
        const pt = U.ringPoint(e.x, e.y, 4, e.isBoss ? 90 : 22);
        this.pickups.push(new NF.Pickup(pt.x, pt.y, 'xp', per));
      }
      /* butin rare */
      if (U.chance(0.016 + luck * 0.01)) this.pickups.push(new NF.Pickup(e.x, e.y, 'heal', 0.22));
      if (U.chance(0.012 + luck * 0.01)) this.pickups.push(new NF.Pickup(e.x, e.y, 'crystal', 4 + this.waves.wave));
      if (U.chance(0.008 + luck * 0.006)) this.pickups.push(new NF.Pickup(e.x, e.y, 'bomb', 1));
      if (U.chance(0.010)) this.pickups.push(new NF.Pickup(e.x, e.y, 'magnet', 1));
    }

    collect(pk) {
      const p = this.player;
      switch (pk.kind) {
        case 'xp':
          p.gainXp(pk.value, this);
          break;
        case 'heal':
          p.heal(p.stats.maxHp * pk.value);
          U.buzz(8);
          break;
        case 'crystal':
          this.stats.crystalsRun += pk.value;
          NF.Save.addCrystals(pk.value);
          FX.text(p.x, p.y - 30, '◈+' + pk.value, C.violet);
          break;
        case 'bomb':
          this.explosion(p.x, p.y, 420, 90 * p.stats.damage, C.amber);
          FX.kick(12); FX.screenFlash(C.amber, .3);
          this.toast('CHARGE DÉTONÉE', 'warn');
          break;
        case 'magnet':
          for (const o of this.pickups) if (o.kind === 'xp') o.pull = 0.4;
          this.toast('AIMANT');
          break;
      }
    }

    explosion(x, y, r, dmg, color, hurtPlayerToo) {
      FX.shockwave(x, y, r, color || C.amber, .4);
      FX.burst(x, y, 12, color || C.amber, { speed: 260, life: .4, size: 3.4, glow: true });
      for (const e of this.enemies) {
        if (e.dead) continue;
        const d = U.dist(x, y, e.x, e.y);
        if (d < r + e.r) {
          const falloff = 1 - U.clamp((d - e.r) / r, 0, 1) * 0.55;
          this.damageEnemy(e, dmg * falloff, { fromX: x, fromY: y, source: 'explosion', knock: 150 });
        }
      }
      if (hurtPlayerToo) {
        const p = this.player;
        if (U.dist(x, y, p.x, p.y) < r + p.r) this.hurtPlayer(dmg * 0.5, null);
      }
    }

    chainLightning(x, y, from, jumps, dmg, range, color) {
      let cur = from, cx = x, cy = y;
      const hit = new Set([from && from.uid]);
      for (let j = 0; j < jumps; j++) {
        let best = null, bd = range * range;
        for (const e of this.enemies) {
          if (e.dead || hit.has(e.uid) || e.immune) continue;
          const d = U.dist2(cx, cy, e.x, e.y);
          if (d < bd) { bd = d; best = e; }
        }
        if (!best) break;
        this.zaps.push(new NF.Zap(cx, cy, best.x, best.y, color || C.cyan));
        this.damageEnemy(best, dmg, { fromX: cx, fromY: cy, source: 'chain' });
        hit.add(best.uid);
        cx = best.x; cy = best.y; cur = best;
        dmg *= 0.85;
      }
      void cur;
    }

    hurtPlayer(dmg, src) {
      const taken = this.player.hurt(dmg, this);
      void src;
      return taken;
    }

    spawnAdd(typeId, x, y, scale) {
      const e = new NF.Enemy(typeId, x, y, scale || this.waves.scale || { hp: 1, dmg: 1, speed: 1 }, false);
      this.enemies.push(e);
      FX.burst(x, y, 6, e.color, { speed: 140, life: .3 });
      return e;
    }

    addWeapon(id) {
      const wd = NF.weaponById(id);
      if (!wd) return;
      if (this.player.weapons.some(x => x.id === id)) return;
      this.player.weapons.push({ id, lvl: this.player.base.weaponStartLvl || 1, t: 0 });
      this.toast(wd.name + ' équipée', 'good');
    }

    toast(msg, kind) { if (!this._quiet) NF.HUD.toast(msg, kind); }

    /* ============================================================
       Événements de vague
       ============================================================ */
    onWaveStart(n, info) {
      this.stats.tookDamageThisWave = false;

      if (NF.bossForWave(n)) {
        this.toast('⚠ VAGUE ' + n + ' — BOSS', 'bad');
        FX.screenFlash(C.magenta, .35);
        U.buzz([60, 80, 60]);
      } else {
        this.toast('VAGUE ' + n);
      }
      if (n > 1 && (n - 1) % NF.WAVES_PER_BOSS === 0) this.toast('PALIER SUPÉRIEUR', 'warn');
      NF.HUD.setBiome(this.biome);
    }

    onWaveClear(n) {
      if (!this.stats.tookDamageThisWave) {
        this.stats.flawless++;
        NF.Quests.notify('flawless', 1);
        this.toast('VAGUE PARFAITE', 'good');
      }
      NF.Quests.notify('wave', n);
      // petit soin entre les vagues
      const p = this.player;
      if (p.hp < p.stats.maxHp) p.heal(p.stats.maxHp * 0.06);
      // armes au maximum → quête
      const maxed = p.weapons.filter(i => i.lvl >= NF.WEAPON_MAXLVL).length;
      if (maxed > (this._maxedSeen || 0)) {
        NF.Quests.notify('wmax', maxed - (this._maxedSeen || 0));
        this._maxedSeen = maxed;
      }
      NF.Save.queueSave();

      /* dernière vague du secteur : la partie s'arrête sur une victoire */
      if (n >= this.endWave) {
        FX.screenFlash('#fff', .8);
        FX.kick(20);
        U.buzz([60, 60, 60, 60, 140]);
        this.finishing = true;                  // laisse l'explosion se jouer
        this.toast('SECTEUR NETTOYÉ', 'good');
        setTimeout(() => this.endRun(false, true), 1100);
      }
    }

    onBossSpawn(boss) {
      FX.kick(18);
      this.toast(boss.name, 'bad');
    }

    /* ============================================================
       Rendu
       ============================================================ */
    draw() {
      const ctx = this.ctx, W = this.view.w, H = this.view.h;

      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      ctx.fillStyle = (this.biome && this.biome.bg) || '#05060f';
      ctx.fillRect(0, 0, W, H);

      /* rien à dessiner tant qu'aucune partie n'a démarré */
      if (!this.player.alive && !this.running) return;

      /* interlude : c'est lui qui dessine tout l'écran */
      if (this.interlude) {
        NF.Interlude.draw(ctx, this);
        if (FX.flash > 0) {
          ctx.globalAlpha = FX.flash; ctx.fillStyle = FX.flashColor;
          ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
        }
        return;
      }

      const sx = -this.cam.x + FX.shakeX, sy = -this.cam.y + FX.shakeY;
      ctx.save();
      ctx.translate(Math.round(sx), Math.round(sy));

      this.drawBackground(ctx);

      for (const h of this.hazards) h.draw(ctx);
      for (const s of this.singularities) this.drawSingularity(ctx, s);
      for (const pk of this.pickups) pk.draw(ctx);

      FX.draw(ctx);

      for (const e of this.enemies) if (!e.isBoss) e.draw(ctx);
      for (const e of this.enemies) if (e.isBoss) e.draw(ctx);

      for (const bm of this.playerBeams) this.drawBeam(ctx, bm);
      for (const z of this.zaps) z.draw(ctx);
      for (const b of this.bullets) b.draw(ctx);
      for (const b of this.ebullets) b.draw(ctx);

      this.player.drawWeapons(ctx);
      this.player.draw(ctx);

      FX.drawTexts(ctx);
      ctx.restore();

      this.drawIndicators(ctx);

      /* flash plein écran */
      if (FX.flash > 0) {
        ctx.globalAlpha = FX.flash;
        ctx.fillStyle = FX.flashColor;
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
      }

      /* vignette de danger */
      const p = this.player;
      if (this.running && p.alive && p.hp / p.stats.maxHp < 0.3) {
        const a = 0.16 + 0.1 * Math.sin(this.time * 6);
        const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.32, W / 2, H / 2, Math.max(W, H) * 0.72);
        g.addColorStop(0, 'rgba(255,0,40,0)');
        g.addColorStop(1, `rgba(255,0,40,${a})`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }
    }

    /** Flèches en bord d'écran vers les boss et les derniers ennemis */
    drawIndicators(ctx) {
      if (!this.running) return;
      const W = this.view.w, H = this.view.h;
      const alive = this.enemies.filter(e => !e.dead);
      const showAll = alive.length <= 6 && this.waves.state !== 'cleared';
      const list = alive.filter(e => e.isBoss || showAll);
      if (!list.length) return;

      const cx = W / 2, cy = H / 2;
      const mx = cx - 46, my = cy - 46;
      for (const e of list) {
        const sx = e.x - this.cam.x, sy = e.y - this.cam.y;
        if (sx > 10 && sx < W - 10 && sy > 10 && sy < H - 10) continue;  // déjà visible
        const a = Math.atan2(sy - cy, sx - cx);
        // projette sur le rectangle de l'écran
        const t = Math.min(Math.abs(mx / Math.cos(a)) || 1e9, Math.abs(my / Math.sin(a)) || 1e9);
        const px = cx + Math.cos(a) * t, py = cy + Math.sin(a) * t;
        ctx.save();
        ctx.translate(px, py); ctx.rotate(a);
        ctx.globalAlpha = e.isBoss ? .95 : .6;
        ctx.fillStyle = e.isBoss ? C.magenta : e.color;
        ctx.beginPath();
        ctx.moveTo(11, 0); ctx.lineTo(-7, 7); ctx.lineTo(-7, -7);
        ctx.closePath(); ctx.fill();
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }

    drawBackground(ctx) {
      const cam = this.cam, W = this.view.w, H = this.view.h;
      const b = this.biome || NF.BIOMES[0];
      const x0 = Math.floor(cam.x / 80) * 80 - 80;
      const y0 = Math.floor(cam.y / 80) * 80 - 80;
      const x1 = cam.x + W + 80, y1 = cam.y + H + 80;

      ctx.strokeStyle = b.grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = x0; x < x1; x += 80) { ctx.moveTo(x, y0); ctx.lineTo(x, y1); }
      for (let y = y0; y < y1; y += 80) { ctx.moveTo(x0, y); ctx.lineTo(x1, y); }
      ctx.stroke();

      /* bassins de magma du secteur « Noyau » */
      if (this.pools && this.pools.length) {
        const cx = this.world.w / 2, cy = this.world.h / 2;
        ctx.strokeStyle = b.accent2 || b.accent;
        ctx.lineWidth = 2;
        for (let i = 1; i <= 5; i++) {
          const r = 240 * i + Math.sin(this.time * .6 + i) * 14;
          ctx.globalAlpha = .05;
          ctx.beginPath(); ctx.arc(cx, cy, r, 0, U.TAU); ctx.stroke();
        }
        for (const p of this.pools) {
          const k = .5 + .5 * Math.sin(this.time * p.sp + p.ph);
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
          g.addColorStop(0, b.accent2 || b.accent);
          g.addColorStop(1, 'transparent');
          ctx.globalAlpha = .07 + .06 * k;
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, U.TAU); ctx.fill();
          ctx.globalAlpha = .12 + .10 * k;
          ctx.strokeStyle = b.accent; ctx.lineWidth = 1.4;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r * .55, 0, U.TAU); ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }

      /* fractures du secteur « Faille » */
      if (this.cracks && this.cracks.length) {
        const pulse = .10 + .05 * Math.sin(this.time * 1.4);
        ctx.strokeStyle = b.accent;
        ctx.lineCap = 'round';
        for (const pts of this.cracks) {
          ctx.globalAlpha = pulse; ctx.lineWidth = 7;
          ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
          for (const pt of pts) ctx.lineTo(pt.x, pt.y);
          ctx.stroke();
          ctx.globalAlpha = pulse * 2.4; ctx.lineWidth = 1.6;
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }

      /* bordure du monde */
      ctx.strokeStyle = b.border;
      ctx.lineWidth = 3;
      ctx.strokeRect(0, 0, this.world.w, this.world.h);
      ctx.globalAlpha = .08;
      ctx.fillStyle = b.accent;
      ctx.fillRect(0, 0, this.world.w, 6);
      ctx.fillRect(0, this.world.h - 6, this.world.w, 6);
      ctx.fillRect(0, 0, 6, this.world.h);
      ctx.fillRect(this.world.w - 6, 0, 6, this.world.h);
      ctx.globalAlpha = 1;
    }

    drawBeam(ctx, bm) {
      const k = 1 - bm.t / bm.life;
      const x2 = bm.x + Math.cos(bm.angle) * bm.len;
      const y2 = bm.y + Math.sin(bm.angle) * bm.len;
      ctx.lineCap = 'round';
      ctx.globalAlpha = .22 * k;
      ctx.strokeStyle = bm.color; ctx.lineWidth = bm.width * 2.4;
      ctx.beginPath(); ctx.moveTo(bm.x, bm.y); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.globalAlpha = .85 * k; ctx.lineWidth = bm.width;
      ctx.beginPath(); ctx.moveTo(bm.x, bm.y); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.globalAlpha = k; ctx.strokeStyle = '#fff'; ctx.lineWidth = bm.width * .28;
      ctx.beginPath(); ctx.moveTo(bm.x, bm.y); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.globalAlpha = 1;
    }

    drawSingularity(ctx, s) {
      const k = 1 - s.t / s.life;
      const r = s.r * (0.6 + 0.4 * Math.sin(s.t * 4));
      ctx.globalAlpha = .18 * k; ctx.fillStyle = '#c58bff';
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, U.TAU); ctx.fill();
      ctx.globalAlpha = .9 * k; ctx.fillStyle = '#12081f';
      ctx.beginPath(); ctx.arc(s.x, s.y, r * .28, 0, U.TAU); ctx.fill();
      ctx.globalAlpha = .7 * k; ctx.strokeStyle = '#c58bff'; ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, r * (.4 + i * .22), s.t * (2 + i), s.t * (2 + i) + 2.2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
  }

  NF.Game = Game;

})(window);
