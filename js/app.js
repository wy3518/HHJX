/* ============================================================
 *  洪荒剑仙 P0 - 主入口
 *  加载存档 -> 显示角色创建/主界面 -> 启动挂机
 * ============================================================ */

(function () {
  'use strict';

  /* ---- 页面加载完成 ---- */
  function boot() {
    UI.init();

    var saved = Save.load();
    if (saved && saved.player && saved.player.professionId) {
      // 有存档：恢复状态
      Save.restore(saved);

      document.getElementById('creation-screen').style.display = 'none';
      document.getElementById('game').style.display = 'flex';

      // 离线结算
      var offline = Idle.settleOffline();
      if (offline && offline.exp > 0) {
        UI.showOffline(offline);
      }

      UI.refresh();

      // 如果之前在挂机，自动恢复
      if (State.get().currentStage) {
        Idle.start();
      }
    } else {
      // 无存档：显示角色创建
      document.getElementById('creation-screen').style.display = 'flex';
      document.getElementById('game').style.display = 'none';
    }

    // 每秒刷新 UI（顶栏、底栏、挂机状态）
    setInterval(function () {
      if (State.get().player.professionId) {
        UI.updateTopBar();
        UI.updateBottomBar();
        UI.updateIdleStatus();
      }
    }, 1000);
  }

  /* ---- 页面关闭时保存 ---- */
  window.addEventListener('beforeunload', function () {
    if (State.get().player.professionId) {
      Idle.stop();
      Save.save();
    }
  });

  /* ---- 启动 ---- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
