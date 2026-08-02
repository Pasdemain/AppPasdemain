/* ============================================================
   main.js — amorçage
   ============================================================ */
(function (w) {
  'use strict';
  const NF = w.NF;

  function boot() {
    NF.Save.load();
    NF.Quests.notify('arsenal', NF.Save.data.weapons.length);
    NF.Input.init();
    NF.HUD.init();
    NF.Menus.init();

    const canvas = document.getElementById('game');
    NF.game = new NF.Game(canvas);

    NF.Menus.applyHand();
    NF.Menus.renderMenu();
    NF.Menus.show('menu');

    /* cherche un serveur de classement ; sans réponse, le mode local suffit */
    NF.Scores.detect().catch(() => {});

    /* mise en pause automatique quand l'écran s'éteint / l'onglet part en fond */
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && NF.game.running && !NF.game.paused && !NF.game.levelling) {
        NF.game.togglePause();
      }
    });

    let last = performance.now();
    function loop(ts) {
      NF.game._last = NF.game._last || last;
      NF.game.frame(ts);
      w.requestAnimationFrame(loop);
    }
    w.requestAnimationFrame(loop);
    last = performance.now();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})(window);
