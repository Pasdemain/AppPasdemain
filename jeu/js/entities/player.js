/* ============================================================
   player.js — l'unité contrôlée par le joueur
   ============================================================ */
(function (w) {
  'use strict';
  const NF = w.NF, U = NF.U, C = NF.C, FX = NF.FX;

  const BASE_SPEED = 258;   // px/s à vitesse 1
  const DASH_SPEED = 1120;
  const DASH_TIME = 0.16;
  const DASH_CD = 2.2;

  class Player {
    constructor() {
      this.mods = {}; this.stats = {}; this.weapons = []; this.taken = Object.create(null);
      this.x = 0; this.y = 0; this.r = 15; this.alive = false; this.hp = 0;
    }

    /** Nouvelle partie */
    reset(game) {
      const base = NF.baseStats(NF.Save.data.talents);
      this.base = base;

      this.x = game.world.w / 2;
      this.y = game.world.h / 2;
      this.vx = 0; this.vy = 0;
      this.r = 15;
      this.facing = -Math.PI / 2;
      this.alive = true;

      this.mods = {
        damage: 0, fireRate: 0, moveSpeed: 0, maxHp: 0, regen: 0, armor: 0,
        crit: 0, critMult: 0, magnet: 0, xpGain: 0, pierce: 0,
        projSpeed: 0, projSize: 0, dashCd: 0, ultGain: 0,
        lifesteal: 0, thorns: 0, luck: 0, greed: 0, slowAura: 0, shieldCd: 0
      };
      this.taken = Object.create(null);
      this.revives = base.revives;

      this.maxWeapons = base.slots;
      this.weapons = [];

      this.level = 1;
      this.xp = 0;
      this.xpNext = xpFor(1);
      this.pendingLevels = 0;

      this.dashT = 0; this.dashCd = 0; this.dashAngle = 0;
      this.invuln = 0;
      this.ult = 0; this.ultMax = 100;
      this.shield = 0; this.shieldT = 0;
      this.hitFlash = 0;
      this.trailT = 0;
      this.recompute();
      this.hp = this.stats.maxHp;

      // niveaux de départ offerts par l'arbre de talents
      for (let i = 0; i < base.startLevel; i++) this.pendingLevels++;
    }

    /** Recalcule les statistiques effectives */
    recompute() {
      const b = this.base, m = this.mods, s = this.stats;
      s.maxHp = b.maxHp + m.maxHp;
      s.damage = b.damage * (1 + m.damage);
      s.fireRate = b.fireRate * (1 + m.fireRate);
      s.moveSpeed = BASE_SPEED * b.moveSpeed * (1 + m.moveSpeed);
      s.armor = U.clamp(b.armor + m.armor, 0, 0.8);
      s.crit = U.clamp(b.crit + m.crit, 0, 0.95);
      s.critMult = b.critMult + m.critMult;
      s.regen = b.regen + m.regen;
      s.magnet = 92 * b.magnet * (1 + m.magnet);
      s.xpGain = b.xpGain * (1 + m.xpGain);
      s.pierce = b.pierce + m.pierce;
      s.projSpeed = b.projSpeed * (1 + m.projSpeed);
      s.projSize = b.projSize * (1 + m.projSize);
      s.dashCd = DASH_CD * (1 - U.clamp(b.dashCd + m.dashCd, 0, 0.7));
      s.ultGain = b.ultGain * (1 + m.ultGain);
      s.greed = b.greed + m.greed;
      s.luck = b.luck + m.luck;
      s.lifesteal = b.lifesteal + m.lifesteal;
      s.thorns = b.thorns + m.thorns;
      s.slowAura = b.slowAura + m.slowAura;
      if (this.hp > s.maxHp) this.hp = s.maxHp;
      const shieldStacks = (b.shieldCd || 0) + m.shieldCd;
      this.shieldMax = shieldStacks > 0 ? 1 : 0;
      this.shieldPeriod = shieldStacks > 0 ? 12 / shieldStacks : 0;
    }

    /* ---------------- Boucle ---------------- */
    update(dt, game) {
      if (!this.alive) return;

      /* --- déplacement --- */
      const mv = NF.Input.read();
      if (game.invertT > 0) { mv.x = -mv.x; mv.y = -mv.y; }   // PARADOXE
      if (mv.x || mv.y) this.facing = Math.atan2(mv.y, mv.x);

      if (this.dashT > 0) {
        this.dashT -= dt;
        this.vx = Math.cos(this.dashAngle) * DASH_SPEED;
        this.vy = Math.sin(this.dashAngle) * DASH_SPEED;
        this.trailT += dt;
        if (this.trailT > 0.015) { this.trailT = 0; FX.trail(this.x, this.y, C.cyan, 4); }
        /* talent « Dash de phase » : le sillage blesse les ennemis traversés */
        if (this.base.dashPhase) {
          this.dashHit = this.dashHit || new Set();
          for (const e of game.enemies) {
            if (e.dead || this.dashHit.has(e.uid)) continue;
            if (U.dist2(this.x, this.y, e.x, e.y) < (this.r + e.r + 8) * (this.r + e.r + 8)) {
              this.dashHit.add(e.uid);
              game.damageEnemy(e, 60 * this.stats.damage, { fromX: this.x, fromY: this.y, source: 'dash', knock: 220 });
            }
          }
        }
      } else {
        const sp = this.stats.moveSpeed;
        const tx = mv.x * sp, ty = mv.y * sp;
        const k = Math.min(1, dt * 14);
        this.vx = U.lerp(this.vx, tx, k);
        this.vy = U.lerp(this.vy, ty, k);
      }

      this.x += this.vx * dt;
      this.y += this.vy * dt;
      const W = game.world, pad = this.r + 4;
      this.x = U.clamp(this.x, pad, W.w - pad);
      this.y = U.clamp(this.y, pad, W.h - pad);

      /* --- dash --- */
      if (this.dashCd > 0) this.dashCd -= dt;
      if (NF.Input.consumeDash() && this.dashCd <= 0 && this.dashT <= 0) {
        this.dashAngle = (mv.x || mv.y) ? Math.atan2(mv.y, mv.x) : this.facing;
        this.dashT = DASH_TIME;
        this.dashCd = this.stats.dashCd;
        if (this.dashHit) this.dashHit.clear();
        this.invuln = Math.max(this.invuln, DASH_TIME + 0.14);
        FX.burst(this.x, this.y, 10, C.cyan, { speed: 260, life: .3, dir: this.dashAngle + Math.PI, spread: 1.2 });
        U.buzz(10);
        game.stats.dashes++;
        NF.Quests.notify('dash', 1);
      }

      /* --- ultime --- */
      if (NF.Input.consumeUlt() && this.ult >= this.ultMax) this.useUlt(game);

      /* --- régénération / états --- */
      if (this.invuln > 0) this.invuln -= dt;
      if (this.hitFlash > 0) this.hitFlash -= dt;
      if (this.stats.regen > 0 && this.hp < this.stats.maxHp) {
        this.hp = Math.min(this.stats.maxHp, this.hp + this.stats.regen * dt);
      }
      if (this.shieldMax > 0) {
        if (this.shield < this.shieldMax) {
          this.shieldT += dt;
          if (this.shieldT >= this.shieldPeriod) { this.shieldT = 0; this.shield = this.shieldMax; }
        }
      }

      /* --- aura de ralentissement --- */
      if (this.stats.slowAura > 0) {
        for (const e of game.enemies) {
          if (e.dead) continue;
          if (U.dist2(this.x, this.y, e.x, e.y) < 190 * 190) {
            e.slowT = Math.max(e.slowT || 0, 0.2);
            e.slowAmt = Math.max(e.slowAmt || 0, this.stats.slowAura);
          }
        }
      }

      /* --- armes --- */
      for (const inst of this.weapons) {
        const wd = NF.weaponById(inst.id);
        if (!wd) continue;
        if (wd.tick) wd.tick(game, this, inst, dt);
        if (wd.passive) continue;
        inst.t -= dt;
        if (inst.t <= 0) wd.fire(game, this, inst);
      }
    }

    /* ---------------- Actions ---------------- */
    useUlt(game) {
      this.ult = 0;
      const R = 340;
      FX.shockwave(this.x, this.y, R, C.magenta, .5);
      FX.shockwave(this.x, this.y, R * 0.7, C.cyan, .35);
      FX.kick(14); FX.screenFlash('#ffffff', .3);
      U.buzz([18, 40, 18]);
      this.invuln = Math.max(this.invuln, 0.5);

      for (const b of game.ebullets) if (b.destructible) b.dead = true;
      for (const e of game.enemies) {
        if (e.dead) continue;
        const d = U.dist(this.x, this.y, e.x, e.y);
        if (d < R) {
          game.damageEnemy(e, 70 * this.stats.damage, { source: 'ult', knock: 340 });
          e.stunT = Math.max(e.stunT || 0, 0.6);
        }
      }
      game.stats.ults++;
      NF.Quests.notify('ult', 1);
      game.toast('ONDE DE CHOC', 'warn');
    }

    gainUlt(n) {
      this.ult = Math.min(this.ultMax, this.ult + n * this.stats.ultGain);
    }

    gainXp(n, game) {
      this.xp += n * this.stats.xpGain;
      while (this.xp >= this.xpNext) {
        this.xp -= this.xpNext;
        this.level++;
        this.xpNext = xpFor(this.level);
        this.pendingLevels++;
      }
      if (game) NF.Quests.notify('level', this.level);
    }

    /** Renvoie les dégâts réellement subis */
    hurt(amount, game) {
      if (!this.alive || this.invuln > 0 || this.dashT > 0) return 0;
      if (this.shield > 0) {
        this.shield = 0; this.shieldT = 0;
        this.invuln = Math.max(this.invuln, 0.45);
        FX.shockwave(this.x, this.y, 60, C.cyan, .3);
        game.toast('BOUCLIER ABSORBÉ');
        return 0;
      }
      const dmg = amount * (1 - this.stats.armor);
      this.hp -= dmg;
      this.hitFlash = 0.22;
      this.invuln = Math.max(this.invuln, 0.42);
      FX.kick(6); FX.screenFlash(C.red, .22);
      FX.text(this.x, this.y - 22, '-' + Math.round(dmg), C.red);
      U.buzz(26);
      game.stats.tookDamageThisWave = true;
      if (this.hp <= 0) {
        if (this.revives > 0) {
          this.revives--;
          this.hp = this.stats.maxHp * 0.5;
          this.invuln = 2.2;
          FX.shockwave(this.x, this.y, 300, C.lime, .7);
          game.toast('SAUVEGARDE D\'URGENCE', 'good');
        } else {
          this.alive = false;
          this.hp = 0;
        }
      }
      return dmg;
    }

    heal(n) {
      this.hp = Math.min(this.stats.maxHp, this.hp + n);
      FX.text(this.x, this.y - 26, '+' + Math.round(n), C.lime);
    }

    /* ---------------- Rendu ---------------- */
    draw(ctx) {
      if (!this.alive) return;
      const blink = this.invuln > 0 && (Math.floor(this.invuln * 22) % 2 === 0);

      /* halo au sol */
      ctx.globalAlpha = .16; ctx.fillStyle = C.cyan;
      ctx.beginPath(); ctx.ellipse(this.x, this.y + 12, 20, 8, 0, 0, U.TAU); ctx.fill();
      ctx.globalAlpha = 1;

      if (this.shield > 0) {
        NF.Draw.ring(ctx, this.x, this.y, this.r + 9, C.cyan, 2, .55);
      }

      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.facing + Math.PI / 2);
      ctx.globalAlpha = blink ? .45 : 1;

      /* réacteur */
      const th = 0.6 + Math.min(1, Math.hypot(this.vx, this.vy) / 300) * 0.9;
      ctx.globalAlpha *= .5;
      ctx.fillStyle = C.cyan;
      ctx.beginPath();
      ctx.moveTo(-5, 10); ctx.lineTo(0, 10 + 16 * th); ctx.lineTo(5, 10);
      ctx.closePath(); ctx.fill();
      ctx.globalAlpha = blink ? .45 : 1;

      /* coque */
      ctx.fillStyle = this.hitFlash > 0 ? '#ffffff' : '#0d1b34';
      ctx.strokeStyle = this.hitFlash > 0 ? '#fff' : C.cyan;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -17);
      ctx.lineTo(12, 9);
      ctx.lineTo(5, 6);
      ctx.lineTo(0, 11);
      ctx.lineTo(-5, 6);
      ctx.lineTo(-12, 9);
      ctx.closePath();
      ctx.fill(); ctx.stroke();

      /* cockpit */
      ctx.fillStyle = C.cyan; ctx.globalAlpha *= .9;
      ctx.beginPath(); ctx.arc(0, -4, 3.4, 0, U.TAU); ctx.fill();
      ctx.restore();
      ctx.globalAlpha = 1;
    }

    /** Dessin additionnel des armes passives (orbes, drones) */
    drawWeapons(ctx) {
      for (const inst of this.weapons) {
        const wd = NF.weaponById(inst.id);
        if (wd && wd.draw) wd.draw(ctx, inst);
      }
    }
  }

  /** Expérience nécessaire pour passer du niveau n au suivant */
  function xpFor(lvl) {
    return Math.round(10 * Math.pow(1.16, lvl - 1) + lvl * 5);
  }

  NF.Player = Player;
  NF.xpFor = xpFor;

})(window);
