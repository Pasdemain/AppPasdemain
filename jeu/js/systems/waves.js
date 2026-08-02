/* ============================================================
   waves.js — enchaînement infini des vagues
   Vague %10 = boss. Difficulté exponentielle bornée par des paliers.
   ============================================================ */
(function (w) {
  'use strict';
  const NF = w.NF, U = NF.U;

  const MAX_ALIVE = 95;          // plafond de confort pour les téléphones

  class Waves {
    constructor(game) {
      this.game = game;
      this.reset();
    }

    reset(startWave) {
      this.startWave = startWave || 1;
      this.wave = 0;
      this.state = 'idle';       // idle | spawning | fighting | cleared | boss
      this.queue = [];           // ennemis restant à faire apparaître
      this.spawnT = 0;
      this.breakT = 0;
      this.spawned = 0;
      this.total = 0;
      this.boss = null;
    }

    /** Multiplicateurs de difficulté de la vague n
        Courbe polynomiale : elle grimpe sans fin mais reste rattrapable
        par la montée en puissance du joueur (additive). Chaque secteur
        applique en plus son propre coefficient. */
    /** Multiplicateurs de difficulté.

        La courbe est identique dans chaque secteur — elle suit la vague
        LOCALE (1 à 50), pas la vague absolue. Une partie est donc toujours
        le même arc : on repart du niveau 1 et on monte en puissance sur
        50 vagues. Ce qui change d'un secteur à l'autre, c'est un
        multiplicateur global : le secteur EST le palier de difficulté, et
        l'arbre de talents est ce qui permet de l'encaisser. */
    scaleFor(n) {
      const info = NF.biomeInfo(n);
      const k = info.local - 1;
      const b = info.biome;
      const sector = info.tier * NF.BIOMES.length + info.index;
      return {
        hp: (1 + 0.34 * k + 0.020 * k * k) * b.hpMul * Math.pow(1.9, sector),
        /* les dégâts montent bien plus doucement que les PV : sinon deux
           contacts suffisent à tuer et aucune quantité de vie ne suit */
        dmg: (1 + 0.055 * k + 0.0009 * k * k) * b.dmgMul * Math.pow(1.3, sector),
        speed: Math.min(1.6, (1 + 0.008 * k) * b.speedMul * (1 + 0.04 * sector)),
        /* le coût d'un niveau croît géométriquement : l'XP doit suivre,
           sinon la montée en puissance décroche en fin de partie */
        xp: Math.pow(1.055, k)
      };
    }

    /** Types disponibles à cette vague du secteur courant, pondérés */
    pool(n) {
      const info = NF.biomeInfo(n);
      const out = [];
      for (const id in NF.ENEMY_TYPES) {
        const t = NF.ENEMY_TYPES[id];
        if (t.weight <= 0 || !t.mw) continue;
        const first = t.mw[info.index];
        if (first === undefined || info.local < first) continue;
        // les types récents deviennent plus fréquents avec le temps
        const age = info.local - first;
        out.push({ id, w: t.weight * (1 + Math.min(1.2, age * 0.05)) });
      }
      /* filet de sécurité : un secteur ne peut pas être vide */
      if (!out.length) out.push({ id: 'drone', w: 1 });
      return out;
    }

    start(n) {
      const g = this.game;
      this.wave = n;
      this.spawned = 0;
      this.queue.length = 0;
      this.boss = null;
      const scale = this.scaleFor(n);
      this.scale = scale;

      const bossInfo = NF.bossForWave(n);
      if (bossInfo) {
        /* ---------- vague de boss ---------- */
        this.state = 'boss';
        const boss = new NF.Boss(bossInfo.id, bossInfo.tier, n, scale, g);
        g.enemies.push(boss);
        this.boss = boss;
        g.onBossSpawn(boss);
        this.total = 1;
        // quelques sbires d'accompagnement
        const adds = Math.min(14, 4 + Math.floor(NF.biomeInfo(n).local / 10) * 2);
        for (let i = 0; i < adds; i++) this.queue.push({ id: this.pickType(n), delay: 1.5 + i * 0.6 });
      } else {
        /* ---------- vague normale ---------- */
        this.state = 'spawning';
        const count = Math.min(120, Math.round(7 + NF.biomeInfo(n).local * 1.7));
        this.total = count;
        const loc = NF.biomeInfo(n).local;
        const eliteChance = loc >= 5 ? Math.min(0.22, (loc - 4) * 0.012) : 0;
        let t = 0;
        for (let i = 0; i < count; i++) {
          // les ennemis arrivent par petits paquets
          if (i % 4 === 0) t += U.rand(0.7, 1.3);
          this.queue.push({
            id: this.pickType(n),
            delay: t + U.rand(0, .35),
            elite: U.chance(eliteChance)
          });
        }
      }
      this.timer = 0;
      this.info = NF.biomeInfo(n);
      g.onWaveStart(n, this.info);
    }

    pickType(n) {
      return U.weighted(this.pool(n)).id;
    }

    update(dt) {
      const g = this.game;
      this.timer = (this.timer || 0) + dt;

      /* pause entre deux vagues — sauf après la dernière du secteur */
      if (this.state === 'cleared') {
        if (g.finishing || this.wave >= g.endWave) return;
        this.breakT -= dt;
        if (this.breakT <= 0) this.start(this.wave + 1);
        return;
      }

      /* apparitions programmées */
      if (this.queue.length) {
        const alive = g.enemies.length;
        while (this.queue.length && this.queue[0].delay <= this.timer && alive + 1 < MAX_ALIVE) {
          const item = this.queue.shift();
          this.spawnOne(item);
        }
      }

      /* plus rien à faire apparaître : place au combat */
      if (!this.queue.length && this.state === 'spawning') { this.state = 'fighting'; this.huntT = 0; }

      /* les derniers retardataires finissent par foncer sur le joueur
         pour éviter d'avoir à les chercher aux quatre coins de la carte */
      if (this.state === 'fighting') {
        this.huntT += dt;
        if (this.huntT > 6) {
          for (const e of g.enemies) {
            if (e.dead || e.hunting || e.isBoss) continue;
            e.hunting = true;
            e.speed *= 1.55;
          }
        }
      }

      /* fin de vague */
      const noneLeft = !this.queue.length && !g.enemies.some(e => !e.dead && !e.temporary);
      if (noneLeft && (this.state === 'spawning' || this.state === 'boss' || this.state === 'fighting')) {
        this.finish();
      }
    }

    spawnOne(item) {
      const g = this.game;
      const p = g.player;
      // apparition hors écran mais dans le monde
      const margin = Math.max(g.view.w, g.view.h) * 0.62 + 60;
      let x, y, tries = 0;
      do {
        const pt = U.ringPoint(p.x, p.y, margin, margin + 180);
        x = U.clamp(pt.x, 30, g.world.w - 30);
        y = U.clamp(pt.y, 30, g.world.h - 30);
        tries++;
      } while (tries < 8 && U.dist(x, y, p.x, p.y) < margin * 0.75);

      const e = new NF.Enemy(item.id, x, y, this.scale, item.elite);
      g.enemies.push(e);
      this.spawned++;
      NF.FX.burst(x, y, 5, e.color, { speed: 120, life: .3, size: 2.5 });
    }

    finish() {
      const g = this.game;
      this.state = 'cleared';
      this.breakT = this.wave % 10 === 0 ? 5.0 : 2.6;
      g.onWaveClear(this.wave);
    }

    get remaining() {
      const alive = this.game.enemies.filter(e => !e.dead).length;
      return alive + this.queue.length;
    }
  }

  NF.Waves = Waves;

})(window);
