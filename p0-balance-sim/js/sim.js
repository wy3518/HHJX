/* ============================================================
 *  洪荒剑仙 P0 — 平衡冒烟模拟引擎（第 8 章发射前检查项 2-5）
 *  复用 data.js 的真实数值，全量模拟 1→99 级挂机闭环
 *  输出：经验曲线/等级-时间轴/强化期望/掉落品味/资源断点
 *  口径：以 data.js CONFIG 为准，不重写数值
 * ============================================================ */

var Sim = (function () {

  /* ---------- 可播种随机数 ---------- */
  var _state = 1;
  function setSeed(seed) { _state = (seed || 1) >>> 0 || 1; }
  function rand() {
    _state = (_state * 1664525 + 1013904223) >>> 0;
    return _state / 4294967296;
  }

  /* ---------- 经验 ---------- */
  function expNeeded(lv) { return Math.round(CONFIG.EXP.coef * Math.pow(lv, CONFIG.EXP.exp)); }
  function cumulativeUpTo(k) { var s = 0; for (var n = 1; n <= k; n++) s += expNeeded(n); return s; }
  function expSeries() {
    var vals = [];
    for (var n = 1; n <= CONFIG.EXP.maxLevel; n++) vals.push(expNeeded(n));
    return vals;
  }
  /* 纯基础产出口径：到 99 理论天数（GDD 90天标定） */
  function baseTheoryDays() {
    var total = cumulativeUpTo(CONFIG.EXP.maxLevel);
    var perSec = CONFIG.EXP.baseExpPerMin / 60; // 1000/60
    return total / perSec / 86400;
  }

  /* ---------- 属性派生（无装备加成，逻辑与 state 一致） ---------- */
  function derivedStats(prof, stats, lv, eqAtk, eqDef) {
    var S = CONFIG.STAT;
    var atk = S.atk(stats, lv) + (eqAtk || 0);
    var def = S.def(stats, lv) + (eqDef || 0);
    var maxHp = S.maxHp(stats, lv);
    var maxMp = S.maxMp(stats, lv);
    var critRate = S.critRate(stats);
    var critDmg = S.critDmg(stats);
    var speed = S.speed(stats);
    var pas = prof.passive;
    var dmgReduce = 0, reflect = 0;
    if (pas.type === 'crit') { critRate += pas.critRate; critDmg = pas.critDmg; }
    if (pas.type === 'tank') { dmgReduce = pas.dmgReduce; reflect = pas.reflect; }
    var power = CONFIG.combatPower(atk, def, maxHp, speed, critRate, maxMp);
    return { atk: atk, def: def, maxHp: maxHp, maxMp: maxMp, critRate: critRate, critDmg: critDmg, dmgReduce: dmgReduce, reflect: reflect, power: power };
  }

  /* ---------- 简易配装（代表"抓到就穿"的中游玩家） ---------- */
  function loadout(monsterLv, bestQid) {
    var lvScale = 1 + monsterLv / 10;
    var weapon = CONFIG.SLOTS[0]; // baseAtk 10
    var wQ = CONFIG.QUALITY[bestQid || 2];
    var eqAtk = Math.floor(weapon.baseAtk * wQ.mult * lvScale);
    // 其余 5 部位防御 + 良品平均，约 8 成穿戴率
    var defSum = 5 + 8 + 3 + 10 + 3; // 护符/披风/护腕/腰带/项链
    var aQ = CONFIG.QUALITY[2]; // 良品 1.3
    var eqDef = Math.floor(defSum * aQ.mult * lvScale * 0.8);
    return { eqAtk: eqAtk, eqDef: eqDef };
  }

  /* ---------- 选挂机目标怪（排除 Boss，选 exp/s 最高且能打） ---------- */
  function bestGrind(stage, atk, critRate, critDmg) {
    var best = null, bestRate = -1, bestInfo = null;
    stage.monsterIds.forEach(function (id) {
      var m = CONFIG.MONSTERS.find(function (x) { return x.id === id; });
      if (!m || m.isBoss) return;
      var sz = CONFIG.COMBAT.sizeMod[m.size] || 1.0;
      var dmg = CONFIG.COMBAT.physDmg(atk, m.def, sz);
      dmg = Math.floor(dmg * (1 + critRate * (critDmg - 1))); // 会心期望
      if (dmg < 1) return;
      var rounds = Math.max(1, Math.ceil(m.hp / dmg));
      var ksec = rounds * CONFIG.COMBAT.roundInterval;
      var rate = m.expR / ksec;
      if (rate > bestRate) { bestRate = rate; best = m; bestInfo = { dmg: dmg, rounds: rounds, ksec: ksec, expPerSec: rate, goldPerSec: m.goldR / ksec, id: m.id }; }
    });
    return { monster: best, info: bestInfo, bestRate: bestRate };
  }

  /* ---------- 主线仿真：1→99 纯挂机 ----------
   * 返回 { levelLog:[...], daysTo99, roundsReference, issues:[...] }
   */
  function runMain(profId, seed) {
    setSeed(seed || 20260825);
    var prof = CONFIG.PROFESSIONS.find(function (x) { return x.id === profId; }) || CONFIG.PROFESSIONS[0];
    var stats = { str: prof.base.str, erg: prof.base.erg, spi: prof.base.spi, agi: prof.base.agi, vit: prof.base.vit };
    var level = 1, exp = 0, gold = 0, totalSec = 0, totalKills = 0;
    var bestQid = 1; // 从凡品起，随掉落提升
    var curStageId = 1;
    var levelLog = [];
    var issues = [];
    var dropCum = {}; // 品质id -> 件数
    var equipQProg = 2; // 初期 Q2 良品

    function unlocked(stageId) {
      var st = CONFIG.STAGES.find(function (x) { return x.id === stageId; });
      if (!st) return false;
      if (level < st.unlockLv) return false;
      if (stageId === 1) return true;
      var prev = CONFIG.STAGES.find(function (x) { return x.id === stageId - 1; });
      return prev ? (level >= prev.unlockLv) : true; // P0 简化：等级达到即可推进，不以 Boss 击杀为硬门槛
    }

    while (level < CONFIG.EXP.maxLevel) {
      // 选关卡：从高往低取第一个解锁的
      var stage = null;
      for (var sid = CONFIG.STAGES.length; sid >= 1; sid--) { if (unlocked(sid)) { stage = CONFIG.STAGES[sid - 1]; break; } }
      if (!stage) { issues.push('无可用关卡（等级 ' + level + ' 断点）'); break; }

      var ld = loadout(level, equipQProg);
      var d = derivedStats(prof, stats, level, ld.eqAtk, ld.eqDef);
      var grind = bestGrind(stage, d.atk, d.critRate, d.critDmg);

      // 基础产出（每秒）
      var baseExp = CONFIG.EXP.baseExpPerMin / 60;
      var baseGold = CONFIG.EXP.goldPerMin / 60;
      var killExp = grind.bestRate > 0 ? grind.bestRate : 0;

      // 若完全打不动当前关任何怪 → 标记卡点：只能吃基础产出
      var fightExp = grind.bestRate >= 0 ? grind.bestRate : 0;
      if (grind.bestRate < 0) {
        issues.push('等级 ' + level + ' 打不动当前关卡怪，纯基础产出（经验利用率低）。');
      }

      var expPerSec = baseExp + fightExp;
      var goldPerSec = baseGold + (grind.info ? grind.info.goldPerSec : 0);

      // 升级所需时间
      var need = expNeeded(level) - exp;
      var sec = Math.max(0, need) / Math.max(expPerSec, 0.0001);
      totalSec += sec;
      // 掉落累计：击杀数 = sec * (1/ksec)
      var killPerSec = grind.info ? (1 / grind.info.ksec) : 0;
      var kills = sec * killPerSec;
      totalKills += kills;
      gold += goldPerSec * sec;

      // 记录到该级末尾
      levelLog.push({
        lv: level, day: totalSec / 86400, cumulativeExp: cumulativeUpTo(level),
        expPerSec: expPerSec, gold: Math.round(gold), power: d.power,
        atk: d.atk, def: d.def, bossKills: 0, kills: Math.round(totalKills)
      });

      // 升级
      exp += expPerSec * sec - need; // 溢出滚到下阶
      if (exp < 0) exp = 0;
      level++;
      if (expNeeded(level)) {}
      // 属性成长
      stats.str += prof.growth.str; stats.erg += prof.growth.erg; stats.spi += prof.growth.spi;
      stats.agi += prof.growth.agi; stats.vit += prof.growth.vit;
      // 装备品质小幅爬升（模拟收到好装备）
      if (equipQProg < 5 && rand() < 0.05) equipQProg++;
      if (bestQid < 4 && rand() < 0.03) bestQid++;
    }

    return {
      profId: profId, profName: prof.name,
      daysTo99: totalSec / 86400,
      totalKills: Math.round(totalKills),
      finalGold: Math.round(gold),
      levelLog: levelLog,
      issues: issues
    };
  }

  /* ---------- 强化期望：蒙特卡洛模拟一件装备 +1→+15 ---------- */
  /* 返回 { nodes:{5:{...},10:{...},15:{...}}, legend } */
  function runForge(qid, samples) {
    samples = samples || 5000;
    var q = CONFIG.QUALITY.find(function (x) { return x.id === qid; });
    var maxE = q ? (q.enhanceMax || 6) : 6;
    var nodeStats = {};
    // 记录每个强化等级的到达次数分布
    for (var t = 1; t <= maxE; t++) nodeStats[t] = [];

    for (var g = 0; g < samples; g++) {
      var enhance = 0, blessing = 0, tries = 0;
      while (enhance < maxE) {
        tries++;
        var cfg = CONFIG.FORGE.find(function (f) { return f.lv === enhance + 1; });
        if (!cfg) break;
        var rate = (blessing >= CONFIG.BLESSING.max) ? CONFIG.BLESSING.onMaxRate : cfg.rate;
        if (rand() < rate) {
          enhance++;
          if (enhance <= maxE && enhance <= 15) nodeStats[enhance].push(tries);
        } else {
          blessing += cfg.blessing;
          if (blessing > CONFIG.BLESSING.max) blessing = CONFIG.BLESSING.max;
          if (cfg.fallback === -1) { /* 保底不回退 */ }
          else if (cfg.fallback > 0) enhance = cfg.fallback;
        }
      }
      if (g === 0) { /* 记录路径态可留空 */ }
    }

    function summarize(level) {
      var arr = (nodeStats[level] || []).slice();
      if (arr.length === 0) return { level: level, avg: null, p50: null, samples: 0 };
      arr.sort(function (a, b) { return a - b; });
      var avg = arr.reduce(function (a, b) { return a + b; }, 0) / arr.length;
      var p50 = arr[Math.floor(arr.length / 2)];
      return { level: level, avg: +avg.toFixed(1), p50: p50, samples: arr.length };
    }

    return {
      maxEnhance: maxE, samples: samples,
      nodes: {
        5: summarize(5), 10: summarize(10), 15: summarize(maxE >= 15 ? 15 : maxE)
      }
    };
  }

  /* ---------- 掉落品味：按怪类型蒙特卡洛抽样 ---------- */
  /* 返回各类型品质占比 + 神话/绝品绝对发生率 */
  function runDrop(type, samples) {
    samples = samples || 200000;
    var weights = CONFIG.DROPS.qualityWeights[type] || CONFIG.DROPS.qualityWeights.grunt;
    var total = weights.reduce(function (a, b) { return a + b; }, 0);
    var count = {};
    CONFIG.QUALITY.forEach(function (q) { count[q.id] = 0; });
    for (var i = 0; i < samples; i++) {
      var r = rand() * total, acc = 0;
      for (var k = 0; k < weights.length; k++) {
        acc += weights[k];
        if (r < acc) { count[k + 1]++; break; }
      }
    }
    var out = [];
    CONFIG.QUALITY.forEach(function (q) {
      out.push({ id: q.id, name: q.name, count: count[q.id], ratio: count[q.id] / samples });
    });
    // 绝品以上 = id>=5
    var rare = CONFIG.QUALITY.filter(function (q) { return q.id >= 5; })
      .reduce(function (a, q) { return a + count[q.id]; }, 0);
    var myth = count[7] || 0;
    return {
      type: type, samples: samples, dist: out,
      rareRatio: rare / samples, mythRatio: myth / samples
    };
  }

  return {
    setSeed: setSeed,
    expNeeded: expNeeded,
    cumulativeUpTo: cumulativeUpTo,
    expSeries: expSeries,
    baseTheoryDays: baseTheoryDays,
    runMain: runMain,
    runForge: runForge,
    runDrop: runDrop
  };
})();