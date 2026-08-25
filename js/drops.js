/* ============================================================
 *  洪荒剑仙 P0 - 装备掉落系统
 *  按怪物类型加权随机品质，生成部位+基础属性+词缀
 * ============================================================ */

var Drops = (function () {

  /* ---- 词缀池 ---- */
  var AFFIX_POOL = [
    { stat: 'atk',  name: '攻击',  min: 3,  max: 12 },
    { stat: 'def',  name: '防御',  min: 2,  max: 10 },
    { stat: 'hp',   name: '气血',  min: 20, max: 80 },
    { stat: 'crit', name: '会心',  min: 1,  max: 5  },  // crit rate %
    { stat: 'agi',  name: '身法',  min: 1,  max: 5  }
  ];

  /* ---- 加权随机选品质 ---- */
  function rollQuality(monsterType) {
    var weights = CONFIG.DROPS.qualityWeights[monsterType] || CONFIG.DROPS.qualityWeights.grunt;
    var total = weights.reduce(function (a, b) { return a + b; }, 0);
    var r = Math.random() * total;
    var acc = 0;
    for (var i = 0; i < weights.length; i++) {
      acc += weights[i];
      if (r < acc) return CONFIG.QUALITY[i];
    }
    return CONFIG.QUALITY[2]; // 默认上品
  }

  /* ---- 随机选部位 ---- */
  function rollSlot() {
    return CONFIG.SLOTS[Math.floor(Math.random() * CONFIG.SLOTS.length)];
  }

  /* ---- 生成随机词缀 ---- */
  function genAffixes(quality, monsterLevel) {
    var count = quality.affixMin + Math.floor(Math.random() * (quality.affixMax - quality.affixMin + 1));
    var pool = AFFIX_POOL.slice();
    var affixes = [];
    for (var i = 0; i < count && pool.length > 0; i++) {
      var idx = Math.floor(Math.random() * pool.length);
      var affix = pool.splice(idx, 1)[0];
      var lvScale = 1 + monsterLevel / 30;
      var val = Math.floor((affix.min + Math.random() * (affix.max - affix.min)) * lvScale * quality.mult);
      affixes.push({ stat: affix.stat, name: affix.name, val: val });
    }
    return affixes;
  }

  /* ---- 生成一件装备 ---- */
  function generateEquipment(monster) {
    var quality = rollQuality(monster.type);
    var slot = rollSlot();
    var lvScale = 1 + monster.lv / 10;

    // 基础属性 = 部位基础 × 品质倍率 × 等级缩放
    var baseAtk = Math.floor(slot.baseAtk * quality.mult * lvScale);
    var baseDef = Math.floor(slot.baseDef * quality.mult * lvScale);

    // 词缀加成
    var affixes = genAffixes(quality, monster.lv);

    var name = quality.name + slot.name;

    return {
      slot: slot.id,
      slotName: slot.name,
      qualityId: quality.id,
      qualityName: quality.name,
      color: quality.color,
      name: name,
      enhance: 0,
      atk: baseAtk,
      def: baseDef,
      affixes: affixes,
      sockets: [],
      gems: [],
      level: monster.lv
    };
  }

  /* ---- 掉落判定 ---- */
  function tryDrop(monster) {
    var rate = CONFIG.DROPS.baseRate;
    if (monster.isBoss) rate += CONFIG.DROPS.bossBonus;
    if (monster.type === 'elite') rate += 0.15;

    if (Math.random() < rate) {
      var item = generateEquipment(monster);
      State.addItem(item);
      return item;
    }
    return null;
  }

  /* ---- 宝石掉落判定（独立于装备） ---- */
  function tryDropGem(monster) {
    var rate = CONFIG.DROPS.gemRate;
    if (monster.isBoss) rate += CONFIG.DROPS.gemBossBonus;
    if (Math.random() < rate) {
      // 按 dropW 加权随机选宝石
      var pool = CONFIG.GEMS;
      var total = pool.reduce(function (a, b) { return a + (b.dropW || 0); }, 0);
      var r = Math.random() * total;
      var acc = 0;
      for (var i = 0; i < pool.length; i++) {
        acc += (pool[i].dropW || 0);
        if (r < acc) return State.addGem(pool[i].id);
      }
      return State.addGem(pool[0].id);
    }
    return null;
  }

  return {
    tryDrop: tryDrop,
    tryDropGem: tryDropGem,
    generateEquipment: generateEquipment,
    AFFIX_POOL: AFFIX_POOL
  };
})();
