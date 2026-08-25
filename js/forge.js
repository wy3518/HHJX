/* ============================================================
 *  洪荒剑仙 P0 - 强化系统
 *  +1~+15 成功率、保底节点、天工值、失败回退
 * ============================================================ */

var Forge = (function () {

  /* ---- 获取强化配置 ---- */
  function getForgeConfig(enhanceLevel) {
    return CONFIG.FORGE.find(function (f) { return f.lv === enhanceLevel; });
  }

  /* ---- 获取品质上限 ---- */
  function getQualityMax(qualityId) {
    var q = CONFIG.QUALITY.find(function (x) { return x.id === qualityId; });
    return q ? q.enhanceMax : 6;
  }

  /* ---- 计算强化后属性 ---- */
  function calcEnhancedStats(item) {
    var enhance = item.enhance || 0;
    var atkBonus = Math.floor((item.atk || 0) * enhance * 0.08); // 每级 +8%
    var defBonus = Math.floor((item.def || 0) * enhance * 0.08);
    return {
      atk: (item.atk || 0) + atkBonus,
      def: (item.def || 0) + defBonus
    };
  }

  /* ---- 执行强化 ----
   * 返回 {success, newEnhance, blessing, message, costGold, costIron}
   */
  function enhance(uid) {
    var s = State.get();
    var item = s.inventory.find(function (x) { return x.uid === uid; }) ||
               Object.values(s.equipped).find(function (x) { return x && x.uid === uid; });

    if (!item) return { success: false, message: '未找到装备' };

    var maxEnhance = getQualityMax(item.qualityId);
    if (item.enhance >= maxEnhance) {
      return { success: false, message: item.qualityName + '品质上限 +' + maxEnhance };
    }

    var cfg = getForgeConfig(item.enhance + 1);
    if (!cfg) return { success: false, message: '强化配置缺失' };

    // 检查材料
    if (s.currencies.iron[cfg.iron] < cfg.ironN) {
      return { success: false, message: '玄铁不足（需要 ' + cfg.iron + '×' + cfg.ironN + '）' };
    }
    if (s.currencies.gold < cfg.gold) {
      return { success: false, message: '铜钱不足（需要 ' + cfg.gold + '）' };
    }

    // 扣除材料
    s.currencies.iron[cfg.iron] -= cfg.ironN;
    State.spendGold(cfg.gold);
    s.stats.totalForge++;

    // 天工值保底
    var rate = cfg.rate;
    if (s.currencies.blessing >= CONFIG.BLESSING.max) {
      rate = CONFIG.BLESSING.onMaxRate;
    }

    // 成功判定
    var success = Math.random() < rate;
    var result = {
      success: success,
      oldEnhance: item.enhance,
      blessing: s.currencies.blessing,
      costGold: cfg.gold,
      costIron: cfg.iron + '×' + cfg.ironN
    };

    if (success) {
      item.enhance++;
      result.newEnhance = item.enhance;
      result.message = '强化成功！+' + item.enhance;
      // 天工值不清零（GDD 规定），继续累积
    } else {
      s.stats.totalForgeFail++;
      // 累积天工值
      s.currencies.blessing += cfg.blessing;
      if (s.currencies.blessing > CONFIG.BLESSING.max) {
        s.currencies.blessing = CONFIG.BLESSING.max;
      }
      result.blessing = s.currencies.blessing;

      // 回退处理
      if (cfg.fallback === -1) {
        // 保底节点，不回退
        result.newEnhance = item.enhance;
        result.message = '强化失败（保底不回退），天工值 +' + cfg.blessing;
      } else if (cfg.fallback > 0) {
        item.enhance = cfg.fallback;
        result.newEnhance = item.enhance;
        result.message = '强化失败，回退至 +' + item.enhance + '，天工值 +' + cfg.blessing;
      } else {
        result.newEnhance = item.enhance;
        result.message = '强化失败，天工值 +' + cfg.blessing;
      }
    }

    Bus.emit('forgeResult', result);
    return result;
  }

  /* ---- 打孔（P0 简化：仅武器，统一 65% 成功率） ---- */
  function socket(uid) {
    var s = State.get();
    var item = s.inventory.find(function (x) { return x.uid === uid; }) ||
               Object.values(s.equipped).find(function (x) { return x && x.uid === uid; });

    if (!item) return { success: false, message: '未找到装备' };
    if (item.slot !== 'weapon') return { success: false, message: 'P0 仅武器可打孔' };
    var maxSockets = (item.qualityId >= 5) ? 3 : 2;
    if (item.sockets.length >= maxSockets) return { success: false, message: '已达最大孔数' };

    var cost = 2000 + item.sockets.length * 3000;
    if (s.currencies.gold < cost) return { success: false, message: '铜钱不足' };
    State.spendGold(cost);

    var success = Math.random() < 0.65;
    if (success) {
      item.sockets.push({ filled: false });
      return { success: true, message: '打孔成功！', sockets: item.sockets.length };
    }
    return { success: false, message: '打孔失败，材料不返还（装备不损坏）' };
  }

  /* ---- 宝石属性中文标签 ---- */
  var GEM_STAT_LABEL = { atk: '攻', def: '防', hp: '气血', crit: '会心', agi: '身法' };

  function locateItem(uid) {
    var s = State.get();
    return s.inventory.find(function (x) { return x.uid === uid; }) ||
           Object.values(s.equipped).find(function (x) { return x && x.uid === uid; });
  }

  /* ---- 获取装备宝石加成汇总（用于展示） ---- */
  function getGemSummary(item) {
    var byStat = {};
    (item.gems || []).forEach(function (gid) {
      if (!gid) return;
      var g = CONFIG.GEMS.find(function (x) { return x.id === gid; });
      if (!g) return;
      byStat[g.stat] = (byStat[g.stat] || 0) + (g.base || 0);
    });
    return byStat;
  }

  /* ---- 镶嵌宝石 ----
   * 从宝石背包取一颗宝石填入第一个空孔；gems[孔索引] 逐孔对齐
   */
  function insertGem(uid, gid) {
    var s = State.get();
    var item = locateItem(uid);
    if (!item) return { success: false, message: '未找到装备' };

    var g = CONFIG.GEMS.find(function (x) { return x.id === gid; });
    if (!g) return { success: false, message: '宝石不存在' };

    var slotIdx = item.sockets.findIndex(function (so) { return !so.filled; });
    if (slotIdx < 0) return { success: false, message: '没有空孔，先打孔' };

    var bg = s.gems.findIndex(function (x) { return x.gid === gid; });
    if (bg < 0) return { success: false, message: '背包中没有『' + g.name + '』' };

    // 扣除背包宝石，填入孔位（gems[i] 与 sockets[i] 严格对齐）
    s.gems.splice(bg, 1);
    item.sockets[slotIdx].filled = true;
    item.gems[slotIdx] = gid;

    Bus.emit('equipChange', item.slot);
    return { success: true, message: '镶嵌『' + g.name + '』成功，' + GEM_STAT_LABEL[g.stat] + '+' + g.base, socket: slotIdx, gem: g };
  }

  /* ---- 抠下宝石（返还且不损坏） ---- */
  function removeGem(uid, slotIdx) {
    var s = State.get();
    var item = locateItem(uid);
    if (!item) return { success: false, message: '未找到装备' };
    if (slotIdx < 0 || slotIdx >= item.sockets.length) return { success: false, message: '孔位不存在' };
    if (!item.sockets[slotIdx].filled) return { success: false, message: '该孔未镶嵌宝石' };

    var gid = item.gems[slotIdx];
    var g = CONFIG.GEMS.find(function (x) { return x.id === gid; });
    if (!g) return { success: false, message: '宝石数据缺失' };

    item.sockets[slotIdx].filled = false;
    item.gems[slotIdx] = null;

    // 返还宝石到背包
    State.addGem(g.id);

    Bus.emit('equipChange', item.slot);
    return { success: true, message: '抠下『' + g.name + '』', gem: g };
  }

  return {
    enhance: enhance,
    socket: socket,
    insertGem: insertGem,
    removeGem: removeGem,
    getGemSummary: getGemSummary,
    getForgeConfig: getForgeConfig,
    getQualityMax: getQualityMax,
    calcEnhancedStats: calcEnhancedStats
  };
})();
