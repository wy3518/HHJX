/* ============================================================
 *  洪荒剑仙 P0 - 挂机定时器
 *  每秒结算经验/铜钱产出，每3秒战斗回合，30秒自动存档
 * ============================================================ */

var Idle = (function () {

  var timer = null;
  var tickCount = 0;
  var running = false;

  /* ---- 离线收益计算 ---- */
  function calcOffline(sec) {
    var s = State.get();
    var maxSec = CONFIG.EXP.offlineMaxSec;
    if (sec > maxSec) sec = maxSec;
    var rate = CONFIG.EXP.offlineRate;
    var expGain = Math.floor(CONFIG.EXP.baseExpPerMin / 60 * sec * rate);
    var goldGain = Math.floor(CONFIG.EXP.goldPerMin / 60 * sec * rate);
    return { sec: sec, exp: expGain, gold: goldGain };
  }

  /* ---- 结算离线时间 ---- */
  function settleOffline() {
    var s = State.get();
    var now = Date.now();
    var diff = Math.floor((now - s.lastOnlineAt) / 1000);
    if (diff < 10) return null; // 不足10秒不结算

    var result = calcOffline(diff);
    s.player.exp += result.exp;
    s.player.totalExp += result.exp;
    s.currencies.gold += result.gold;
    State.checkLevelUp();
    s.lastOnlineAt = now;
    return result;
  }

  /* ---- 每秒 tick ---- */
  function tick() {
    if (!running) return;
    tickCount++;
    var s = State.get();
    s.stats.playTimeSec++;

    // 基础产出：每秒 1000/60 经验 + 50/60 铜钱
    var expPerSec = CONFIG.EXP.baseExpPerMin / 60;
    var goldPerSec = CONFIG.EXP.goldPerMin / 60;

    // 地图移动驱动（自动寻路）：沿路推进，野外可遇怪
    var area = State.getCurrentArea();
    if (typeof WorldMap !== 'undefined' && WorldMap.step) WorldMap.step();

    // 非城镇区域（野外/洞穴/魂境）有怪物才产出与战斗；城镇为安全区不产出
    if (area && area.type !== 'town' && area.monsters) {
      State.addExp(expPerSec);
      State.addGold(goldPerSec);
    }

    // 每3秒执行一次战斗
    if (area && area.type !== 'town' && area.monsters && tickCount % 3 === 0) {
      Combat.executeRound();
    }

    // 每30秒自动保存
    if (tickCount % CONFIG.SAVE.autoSaveSec === 0) {
      Save.save();
    }
  }

  /* ---- 启动 ---- */
  function start() {
    if (running) return;
    running = true;
    timer = setInterval(tick, 1000);
    try { settleOffline(); } catch (e) { console.error('[Idle] offline settle error:', e); }
    Bus.emit('idleStart');
  }

  /* ---- 停止 ---- */
  function stop() {
    running = false;
    if (timer) { clearInterval(timer); timer = null; }
    var s = State.get();
    s.lastOnlineAt = Date.now();
    Bus.emit('idleStop');
  }

  /* ---- 是否运行中 ---- */
  function isRunning() { return running; }

  /* ---- 获取 tick 数 ---- */
  function getTick() { return tickCount; }

  return {
    start: start,
    stop: stop,
    isRunning: isRunning,
    getTick: getTick,
    settleOffline: settleOffline,
    calcOffline: calcOffline
  };
})();
