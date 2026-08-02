/* ============================================================
   projectiles.js — projectiles joueur/ennemi, dangers, ramassables
   ============================================================ */
(function (w) {
  'use strict';
  const NF = w.NF, U = NF.U, FX = NF.FX;

  /** Liseré d'alerte porté par tous les tirs ennemis */
  const DANGER = '#ff2d55';

  /* ------------------------------------------------------------
     Projectile du joueur
     ------------------------------------------------------------ */
  class Bullet {
    constructor(o) {
      this.x = o.x; this.y = o.y;
      const a = o.angle;
      const sp = o.speed || 640;
      this.vx = Math.cos(a) * sp;
      this.vy = Math.sin(a) * sp;
      this.angle = a;
      this.r = o.r || 5;
      this.dmg = o.dmg || 10;
      this.color = o.color || NF.C.cyan;
      this.shape = o.shape || 'orb';        // orb | shard | rail | missile | wave
      this.pierce = o.pierce || 0;
      this.life = o.life || 1.6;
      this.t = 0;
      this.homing = o.homing || 0;          // rad/s
      this.explode = o.explode || 0;        // rayon
      this.explodeDmg = o.explodeDmg || 0;
      this.chain = o.chain || 0;
      this.chainRange = o.chainRange || 190;
      this.slow = o.slow || 0;
      this.knock = o.knock || 0;
      this.crit = !!o.crit;
      this.owner = o.owner || null;         // id d'arme (statistiques / quêtes)
      this.hits = null;                     // Set des cibles déjà touchées (pierce)
      this.trailT = 0;
      this.dead = false;
    }

    update(dt, game) {
      this.t += dt;
      if (this.t >= this.life) { this.dead = true; return; }

      if (this.homing) {
        const tgt = game.nearestEnemy(this.x, this.y, 520);
        if (tgt) {
          const want = U.angle(this.x, this.y, tgt.x, tgt.y);
          this.angle = U.turnTo(this.angle, want, this.homing * dt);
          const sp = Math.hypot(this.vx, this.vy);
          this.vx = Math.cos(this.angle) * sp;
          this.vy = Math.sin(this.angle) * sp;
        }
      }

      this.x += this.vx * dt;
      this.y += this.vy * dt;

      if (this.shape === 'missile') {
        this.trailT += dt;
        if (this.trailT > 0.02) { this.trailT = 0; FX.trail(this.x, this.y, this.color, 2.6); }
      }

      const W = game.world;
      if (this.x < -40 || this.y < -40 || this.x > W.w + 40 || this.y > W.h + 40) this.dead = true;
    }

    /** Appelé par le jeu quand le projectile touche un ennemi */
    onHit(enemy, game) {
      if (this.explode > 0) {
        game.explosion(this.x, this.y, this.explode, this.explodeDmg || this.dmg * 0.6, this.color);
      }
      if (this.chain > 0) {
        game.chainLightning(this.x, this.y, enemy, this.chain, this.dmg * 0.55, this.chainRange, this.color);
        this.chain = 0;
      }
      if (this.pierce > 0) {
        this.pierce--;
        if (!this.hits) this.hits = new Set();
        this.hits.add(enemy.uid);
      } else {
        this.dead = true;
        FX.burst(this.x, this.y, 4, this.color, { speed: 110, life: .22, size: 2.2 });
      }
    }

    draw(ctx) {
      const c = this.color;
      switch (this.shape) {
        case 'rail': {
          ctx.save();
          ctx.translate(this.x, this.y); ctx.rotate(this.angle);
          ctx.globalAlpha = .3; ctx.fillStyle = c;
          ctx.fillRect(-26, -this.r * 1.7, 34, this.r * 3.4);
          ctx.globalAlpha = 1;
          ctx.fillRect(-16, -this.r * .8, 26, this.r * 1.6);
          ctx.restore();
          break;
        }
        case 'shard': {
          ctx.save();
          ctx.translate(this.x, this.y); ctx.rotate(this.angle);
          ctx.fillStyle = c; ctx.globalAlpha = .28;
          ctx.beginPath(); ctx.ellipse(0, 0, this.r * 2.6, this.r * 1.5, 0, 0, U.TAU); ctx.fill();
          ctx.globalAlpha = 1;
          ctx.beginPath();
          ctx.moveTo(this.r * 1.7, 0); ctx.lineTo(-this.r, this.r * .8);
          ctx.lineTo(-this.r * .5, 0); ctx.lineTo(-this.r, -this.r * .8);
          ctx.closePath(); ctx.fill();
          ctx.restore();
          break;
        }
        case 'missile': {
          ctx.save();
          ctx.translate(this.x, this.y); ctx.rotate(this.angle);
          ctx.fillStyle = c;
          ctx.globalAlpha = .25;
          ctx.beginPath(); ctx.arc(0, 0, this.r * 2.4, 0, U.TAU); ctx.fill();
          ctx.globalAlpha = 1;
          ctx.fillRect(-this.r * 1.6, -this.r * .55, this.r * 3.2, this.r * 1.1);
          ctx.beginPath();
          ctx.moveTo(this.r * 1.6, -this.r * .55); ctx.lineTo(this.r * 2.6, 0); ctx.lineTo(this.r * 1.6, this.r * .55);
          ctx.closePath(); ctx.fill();
          ctx.restore();
          break;
        }
        default:
          NF.Draw.glowCircle(ctx, this.x, this.y, this.r, c, .26);
          ctx.fillStyle = '#fff'; ctx.globalAlpha = .75;
          ctx.beginPath(); ctx.arc(this.x, this.y, this.r * .45, 0, U.TAU); ctx.fill();
          ctx.globalAlpha = 1;
      }
    }
  }

  /* ------------------------------------------------------------
     Projectile ennemi
     ------------------------------------------------------------ */
  class EBullet {
    constructor(o) {
      this.x = o.x; this.y = o.y;
      const sp = o.speed || 200;
      this.angle = o.angle;
      this.vx = Math.cos(o.angle) * sp;
      this.vy = Math.sin(o.angle) * sp;
      this.r = o.r || 6;
      this.dmg = o.dmg || 8;
      this.color = o.color || NF.C.magenta;
      this.life = o.life || 6;
      this.t = 0;
      this.homing = o.homing || 0;
      this.accel = o.accel || 0;
      this.dead = false;
      this.destructible = o.destructible !== false; // détruit par l'ultime
      this.spin = o.spin || 0;                      // courbure (rad/s)
    }

    update(dt, game) {
      this.t += dt;
      if (this.t >= this.life) { this.dead = true; return; }

      if (this.homing && game.player.alive) {
        const want = U.angle(this.x, this.y, game.player.x, game.player.y);
        this.angle = U.turnTo(this.angle, want, this.homing * dt);
        const sp = Math.hypot(this.vx, this.vy);
        this.vx = Math.cos(this.angle) * sp;
        this.vy = Math.sin(this.angle) * sp;
      }
      if (this.spin) {
        this.angle += this.spin * dt;
        const sp = Math.hypot(this.vx, this.vy);
        this.vx = Math.cos(this.angle) * sp;
        this.vy = Math.sin(this.angle) * sp;
      }
      if (this.accel) {
        const sp = Math.hypot(this.vx, this.vy) + this.accel * dt;
        this.vx = Math.cos(this.angle) * sp;
        this.vy = Math.sin(this.angle) * sp;
      }

      this.x += this.vx * dt; this.y += this.vy * dt;
      const W = game.world;
      if (this.x < -60 || this.y < -60 || this.x > W.w + 60 || this.y > W.h + 60) this.dead = true;
    }

    /* Losange anguleux à liseré rouge : impossible à confondre avec un
       éclat d'XP (rond, doux, cyan) même quand la teinte de l'ennemi est claire. */
    draw(ctx) {
      const r = this.r;
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle + this.t * 7);

      ctx.globalAlpha = .2; ctx.fillStyle = DANGER;
      ctx.beginPath(); ctx.arc(0, 0, r * 2.1, 0, U.TAU); ctx.fill();

      ctx.globalAlpha = 1; ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.moveTo(r * 1.75, 0);
      ctx.lineTo(0, r * .74);
      ctx.lineTo(-r * 1.75, 0);
      ctx.lineTo(0, -r * .74);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = DANGER; ctx.lineWidth = 2; ctx.stroke();

      ctx.fillStyle = '#2a0713';
      ctx.beginPath(); ctx.arc(0, 0, r * .3, 0, U.TAU); ctx.fill();
      ctx.restore();
      ctx.globalAlpha = 1;
    }
  }

  /* ------------------------------------------------------------
     Danger : rayon laser, zone au sol, mur
     Toujours télégraphié avant de devenir actif.
     ------------------------------------------------------------ */
  class Hazard {
    constructor(o) {
      this.kind = o.kind;             // beam | zone | wall | ring
      this.owner = o.owner || null;
      this.telegraph = o.telegraph == null ? 0.9 : o.telegraph;
      this.duration = o.duration == null ? 1.2 : o.duration;
      this.t = 0;
      this.dmg = o.dmg || 14;
      this.color = o.color || NF.C.magenta;
      this.dead = false;
      this.tick = 0;                  // anti-multi-dégâts
      this.tickRate = o.tickRate || 0.45;

      // beam : origine + angle + longueur + épaisseur, peut tourner
      this.x = o.x || 0; this.y = o.y || 0;
      this.angle = o.angle || 0;
      this.len = o.len || 1400;
      this.width = o.width || 16;
      this.rotSpeed = o.rotSpeed || 0;
      this.followOwner = !!o.followOwner;

      // zone / ring
      this.r = o.r || 90;
      this.rInner = o.rInner || 0;    // pour "ring" : zone sûre à l'intérieur
      this.grow = o.grow || 0;
    }

    get active() { return this.t >= this.telegraph; }

    update(dt, game) {
      this.t += dt;
      if (this.t >= this.telegraph + this.duration) { this.dead = true; return; }
      if (this.followOwner && this.owner && !this.owner.dead) { this.x = this.owner.x; this.y = this.owner.y; }
      if (this.rotSpeed) this.angle += this.rotSpeed * dt;
      if (this.grow) this.r += this.grow * dt;
      if (this.tick > 0) this.tick -= dt;

      if (!this.active) return;
      const p = game.player;
      if (!p.alive || p.invuln > 0) return;

      let touching = false;
      if (this.kind === 'beam') {
        const x2 = this.x + Math.cos(this.angle) * this.len;
        const y2 = this.y + Math.sin(this.angle) * this.len;
        touching = U.distToSegment(p.x, p.y, this.x, this.y, x2, y2) < this.width / 2 + p.r;
      } else if (this.kind === 'zone') {
        touching = U.dist(p.x, p.y, this.x, this.y) < this.r + p.r;
      } else if (this.kind === 'ring') {
        const d = U.dist(p.x, p.y, this.x, this.y);
        touching = d > this.rInner && d < this.r;   // couronne dangereuse
      }

      if (touching && this.tick <= 0) {
        this.tick = this.tickRate;
        game.hurtPlayer(this.dmg, this);
      }
    }

    draw(ctx) {
      const tel = !this.active;
      const k = tel ? (this.t / this.telegraph) : 1;
      ctx.save();
      if (this.kind === 'beam') {
        const x2 = this.x + Math.cos(this.angle) * this.len;
        const y2 = this.y + Math.sin(this.angle) * this.len;
        ctx.lineCap = 'round';
        if (tel) {
          ctx.globalAlpha = .25 + .35 * Math.abs(Math.sin(this.t * 18));
          ctx.strokeStyle = this.color; ctx.lineWidth = 2;
          ctx.setLineDash([14, 10]);
          ctx.beginPath(); ctx.moveTo(this.x, this.y); ctx.lineTo(x2, y2); ctx.stroke();
          ctx.setLineDash([]);
        } else {
          const fade = U.clamp((this.telegraph + this.duration - this.t) / 0.2, 0, 1);
          ctx.globalAlpha = .18 * fade;
          ctx.strokeStyle = this.color; ctx.lineWidth = this.width * 2.2;
          ctx.beginPath(); ctx.moveTo(this.x, this.y); ctx.lineTo(x2, y2); ctx.stroke();
          ctx.globalAlpha = .9 * fade; ctx.lineWidth = this.width;
          ctx.beginPath(); ctx.moveTo(this.x, this.y); ctx.lineTo(x2, y2); ctx.stroke();
          ctx.globalAlpha = fade; ctx.strokeStyle = '#fff'; ctx.lineWidth = this.width * .3;
          ctx.beginPath(); ctx.moveTo(this.x, this.y); ctx.lineTo(x2, y2); ctx.stroke();
        }
      } else if (this.kind === 'zone') {
        if (tel) {
          ctx.globalAlpha = .12; ctx.fillStyle = this.color;
          ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, U.TAU); ctx.fill();
          ctx.globalAlpha = .55; ctx.strokeStyle = this.color; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(this.x, this.y, this.r * k, 0, U.TAU); ctx.stroke();
        } else {
          const fade = U.clamp((this.telegraph + this.duration - this.t) / 0.25, 0, 1);
          ctx.globalAlpha = .42 * fade; ctx.fillStyle = this.color;
          ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, U.TAU); ctx.fill();
          ctx.globalAlpha = fade; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, U.TAU); ctx.stroke();
        }
      } else if (this.kind === 'ring') {
        ctx.globalAlpha = tel ? .14 : .34;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.r - this.rInner;
        ctx.beginPath(); ctx.arc(this.x, this.y, (this.r + this.rInner) / 2, 0, U.TAU); ctx.stroke();
        ctx.globalAlpha = .7; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.rInner, 0, U.TAU); ctx.stroke();
      }
      ctx.restore();
      ctx.globalAlpha = 1;
    }
  }

  /* ------------------------------------------------------------
     Ramassable : éclat d'XP, soin, cristal, bombe
     ------------------------------------------------------------ */
  class Pickup {
    constructor(x, y, kind, value) {
      this.x = x; this.y = y;
      this.kind = kind;               // xp | heal | crystal | bomb | magnet
      this.value = value || 1;
      this.r = kind === 'xp' ? 6 : 9;
      this.vx = U.rand(-40, 40); this.vy = U.rand(-40, 40);
      this.t = U.rand(0, 6);
      this.dead = false;
      this.pull = 0;
    }

    update(dt, game) {
      this.t += dt;
      const p = game.player;
      const d = U.dist(this.x, this.y, p.x, p.y);
      const mag = p.stats.magnet;
      if (d < mag || this.pull > 0) {
        this.pull = Math.min(1, this.pull + dt * 3);
        const a = U.angle(this.x, this.y, p.x, p.y);
        const sp = U.lerp(120, 760, this.pull);
        this.vx = Math.cos(a) * sp; this.vy = Math.sin(a) * sp;
      } else {
        this.vx *= 1 - 3 * dt; this.vy *= 1 - 3 * dt;
      }
      this.x += this.vx * dt; this.y += this.vy * dt;

      if (d < p.r + this.r) { this.dead = true; game.collect(this); }
    }

    draw(ctx) {
      const bob = Math.sin(this.t * 5) * 1.6;
      switch (this.kind) {
        case 'xp': {
          /* Éclat rond et doux, cœur clair : lecture opposée aux tirs
             ennemis, anguleux et cerclés de rouge. */
          const pulse = .85 + .15 * Math.sin(this.t * 4);
          ctx.globalAlpha = .15 * pulse; ctx.fillStyle = NF.C.cyan;
          ctx.beginPath(); ctx.arc(this.x, this.y + bob, 13 * pulse, 0, U.TAU); ctx.fill();
          ctx.globalAlpha = .55; ctx.fillStyle = NF.C.cyanD;
          ctx.beginPath(); ctx.arc(this.x, this.y + bob, 5.5, 0, U.TAU); ctx.fill();
          ctx.globalAlpha = 1; ctx.fillStyle = '#d8fbff';
          ctx.beginPath(); ctx.arc(this.x, this.y + bob, 2.8, 0, U.TAU); ctx.fill();
          break;
        }
        case 'heal':
          ctx.fillStyle = NF.C.lime; ctx.globalAlpha = .25;
          ctx.beginPath(); ctx.arc(this.x, this.y + bob, 15, 0, U.TAU); ctx.fill();
          ctx.globalAlpha = 1;
          ctx.fillRect(this.x - 8, this.y + bob - 2.5, 16, 5);
          ctx.fillRect(this.x - 2.5, this.y + bob - 8, 5, 16);
          break;
        case 'crystal': {
          ctx.save(); ctx.translate(this.x, this.y + bob); ctx.rotate(this.t * 1.4);
          ctx.fillStyle = NF.C.violet; ctx.globalAlpha = .28;
          ctx.beginPath(); ctx.arc(0, 0, 18, 0, U.TAU); ctx.fill(); ctx.globalAlpha = 1;
          NF.Draw.poly(ctx, 0, 0, 9, 4, 0); ctx.fill();
          ctx.restore(); break;
        }
        case 'bomb':
          ctx.fillStyle = NF.C.amber; ctx.globalAlpha = .25;
          ctx.beginPath(); ctx.arc(this.x, this.y + bob, 17, 0, U.TAU); ctx.fill(); ctx.globalAlpha = 1;
          NF.Draw.poly(ctx, this.x, this.y + bob, 9, 6, this.t); ctx.fill();
          break;
        case 'magnet':
          ctx.strokeStyle = NF.C.cyan; ctx.lineWidth = 3.5;
          ctx.beginPath(); ctx.arc(this.x, this.y + bob, 7, Math.PI * .15, Math.PI * .85, true); ctx.stroke();
          break;
      }
      ctx.globalAlpha = 1;
    }
  }

  /* ---- Éclair (visuel de chaîne électrique) ---- */
  class Zap {
    constructor(x1, y1, x2, y2, color) {
      this.x1 = x1; this.y1 = y1; this.x2 = x2; this.y2 = y2;
      this.color = color || NF.C.cyan;
      this.t = 0; this.life = .18; this.dead = false;
      this.seed = Math.random() * 100;
    }
    update(dt) { this.t += dt; if (this.t >= this.life) this.dead = true; }
    draw(ctx) {
      const k = 1 - this.t / this.life;
      const segs = 6;
      ctx.globalAlpha = k; ctx.strokeStyle = this.color; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(this.x1, this.y1);
      for (let i = 1; i < segs; i++) {
        const f = i / segs;
        const nx = U.lerp(this.x1, this.x2, f), ny = U.lerp(this.y1, this.y2, f);
        const off = Math.sin(this.seed + i * 2.7) * 16 * (1 - Math.abs(f - .5) * 2);
        const a = U.angle(this.x1, this.y1, this.x2, this.y2) + Math.PI / 2;
        ctx.lineTo(nx + Math.cos(a) * off, ny + Math.sin(a) * off);
      }
      ctx.lineTo(this.x2, this.y2); ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  NF.Bullet = Bullet;
  NF.EBullet = EBullet;
  NF.Hazard = Hazard;
  NF.Pickup = Pickup;
  NF.Zap = Zap;

})(window);
