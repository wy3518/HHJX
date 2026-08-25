/* ============================================================
 *  洪荒剑仙 P0 — 游戏状态管理
 *  单一权威状态源，所有系统读写此对象
 * ============================================================ */

var State = (function () {

  /* ---- 内部状态 ---- */
  var state = null;

  /* ---- 新手初始装备（凡品） ----
   * 按部位给一件基础凡品装备，属性取 SLOTS 部位基础值
   */
  function starter(slotId) {
    var slot = CONFIG.SLOTS.find(function (x) { return x.id === slotId; });
    if (!slot) return null;
    return {
      uid: 'starter_' + slot.id + '_' + Date.now() + '_' + Math.floor(Math.random() * 10000),
      slot: slot.id,
      slotName: slot.name,
      qualityId: 1,
      qualityName: '凡品',
      color: '#9e9e9e',
      name: '凡品' + slot.name,
      enhance: 0,
      atk: Math.round(slot.baseAtk * 0.8),
      def: Math.round(slot.baseDef * 0.8),
      affixes: [],
      sockets: [],
      gems: [],
      level: 1
    };
  }

  /* ---- 初始默认状态 ---- */
  function createDefault() {
    return {
      version: CONFIG.SAVE.version,
      createdAt: Date.now(),
      lastSaveAt: 0,

      // 角色
      player: {
        professionId: null,    // 未选出身时为 null
        name: '无名剑修',
        level: 1,
        exp: 0,                // 当前经验
        totalExp: 0,            // 累计经验（用于统计）
        stats: null,            // 五维 {str,erg,spi,agi,vit}
        // 派生属性在 getPlayer() 中实时计算
        hp: 0, mp: 0            // 实时生命 / 灵力（开局由 getDerived 兜底为满值）
      },

      // 货币
      currencies: {
        gold: 100,             // 初始铜钱
        iron: { '普通': 5, '中品': 0, '上品': 0 },  // 玄铁
        blessing: 0,           // 天工值
        stone: 0               // 洗练石
      },

      // 当前地图
      map: {
        areaId: 'qingshi',        // 当前所处区域（青石镇起步）
        x: 11, y: 10,             // 角色在当前场景的坐标
        routeExitId: null,        // 正在寻路前往的传送门 id
        routes: {},               // 历史停留(用于探索可视)
        explored: {}              // {areaId: {killed:{monsterId:true}}}
      },
      // 当前关卡
      currentStage: null,      // (遗留兼容)未选关卡时为 null
      stageProgress: {},       // {stageId: {kills:0, bossKilled:false}}

      // 背包
      inventory: [],            // [{uid, slot, qualityId, name, enhance, atk, def, affixes, sockets, gems, level}]
      equipped: {
        // 新手初始装备（凡品）：保证开局能击杀第 1 章最弱怪，形成击杀→掉落→强化闭环
        weapon: starter('weapon'),
        amulet: starter('amulet'),
        cloak: starter('cloak'),
        bracer: starter('bracer'),
        belt: starter('belt'),
        necklace: starter('necklace')
      },
      gems: [],                 // 宝石背包 [{uid, gid, name, stat, base, color}]

      // 统计
      stats: {
        totalKills: 0,
        totalDrops: 0,
        totalForge: 0,
        totalForgeFail: 0,
        playTimeSec: 0
      },

      // 离线
      lastOnlineAt: Date.now()
    };
  }

  /* ---- 获取状态（如不存在则初始化） ---- */
  function get() {
    if (!state) state = createDefault();
    // 兼容旧存档：缺失字段兜底
    if (!state.gems) state.gems = [];
    if (!state.map) {
      // 旧存档无地图字段：默认落在青石镇
      state.map = { areaId: 'qingshi', x: 11, y: 10, routeExitId: null, routes: {}, explored: {} };
    }
    if (state.map && !state.map.explored) state.map.explored = {};
    if (state.map && !state.map.routes) state.map.routes = {};
    return state;
  }

  /* ---- 重置（新游戏） ---- */
  function reset() {
    state = createDefault();
    return state;
  }

  /* ---- 计算玩家派生属性 ----
   * 返回 {hp, maxHp, mp, maxMp, atk, elemAtk, def, critRate, critDmg, speed, power}
   */
  function getDerived() {
    var s = get();
    if (!s.player.professionId) return null;

    var p = s.player;
    var prof = CONFIG.PROFESSIONS.find(function (x) { return x.id === p.professionId; });
    if (!prof) return null;

    var st = p.stats;
    var lv = p.level;
    var S = CONFIG.STAT;

    // 装备加成
    var eqAtk = 0, eqDef = 0;
    var gemAtk = 0, gemDef = 0, gemHp = 0, gemCrit = 0, gemAgi = 0;
    // 词缀加成（攻/防/气血/会心/身法/会伤/吸血/技威）
    var afAtk = 0, afDef = 0, afHp = 0, afCrit = 0, afAgi = 0, afCritDmg = 0, afLeech = 0, afSkillPower = 0;
    Object.keys(s.equipped).forEach(function (slot) {
      var item = s.equipped[slot];
      if (item) {
        eqAtk += item.atk || 0;
        eqDef += item.def || 0;
      }
      // 词缀加成：每件装备的词缀数组按属性累加
      if (item) (item.affixes || []).forEach(function (a) {
        if (!a) return;
        var v = a.val || 0;
        if (a.stat === 'atk') afAtk += v;
        else if (a.stat === 'def') afDef += v;
        else if (a.stat === 'hp') afHp += v;
        else if (a.stat === 'crit') afCrit += v;
        else if (a.stat === 'agi') afAgi += v;
        else if (a.stat === 'critDmg') afCritDmg += v;
        else if (a.stat === 'leech') afLeech += v;
        else if (a.stat === 'skillPower') afSkillPower += v;
      });
      // 已镶嵌宝石加成（gems[i] 与 sockets[i] 逐孔对齐）
      if (item) (item.gems || []).forEach(function (gid) {
        if (!gid) return;
        var g = CONFIG.GEMS.find(function (x) { return x.id === gid; });
        if (!g) return;
        if (g.stat === 'atk') gemAtk += g.base || 0;
        else if (g.stat === 'def') gemDef += g.base || 0;
        else if (g.stat === 'hp') gemHp += g.base || 0;
        else if (g.stat === 'crit') gemCrit += g.base || 0;
        else if (g.stat === 'agi') gemAgi += g.base || 0;
      });
    });

    // 基础攻击力 = 力量×2 + 等级×4 + 装备攻击 + 宝石攻击 + 词条攻击
    var atk = S.atk(st, lv) + eqAtk + gemAtk + afAtk;
    // 元素攻击 = 元神×1.5 + 等级×1
    var elemAtk = S.elemAtk(st, lv);
    // 防御力 = 筋骨÷3 + 等级×2 + 装备防御 + 宝石防御 + 词条防御
    var def = S.def(st, lv) + eqDef + gemDef + afDef;
    // 体力上限（宝石+词条气血加成叠加上限）
    var maxHp = S.maxHp(st, lv) + gemHp + afHp;
    // 法力上限
    var maxMp = S.maxMp(st, lv);
    // 会心（宝石+词条会心加成）
    var critRate = S.critRate(st) + gemCrit + afCrit;
    var critDmg = S.critDmg(st) + afCritDmg;
    // 身法（宝石+词条身法加成）
    var speed = S.speed(st) + gemAgi + afAgi;

    // 出身被动加成
    var pas = prof.passive;
    if (pas.type === 'crit') {
      critRate += pas.critRate;
      critDmg = pas.critDmg;
    }
    if (pas.type === 'tank') {
      // 体修：伤害减免在战斗结算时应用
    }

    // 战力（参考值）
    var power = CONFIG.combatPower(atk, def, maxHp, speed, critRate, maxMp);

    return {
      hp: Math.min(p.hp || maxHp, maxHp),
      maxHp: maxHp,
      mp: Math.min(p.mp || maxMp, maxMp),
      maxMp: maxMp,
      atk: atk,
      elemAtk: elemAtk,
      def: def,
      critRate: critRate,
      critDmg: critDmg,
      speed: speed,
      power: power,
      dmgReduce: (pas.type === 'tank') ? pas.dmgReduce : 0,
      reflect: (pas.type === 'tank') ? pas.reflect : 0,
      passiveType: pas.type,
      leech: afLeech,           // 通用吸血% (词条累计)
      skillPower: afSkillPower  // 技能威力% (词条累计)
    };
  }

  /* ---- 获取当前经验需求 ---- */
  function expNeeded(level) {
    var n = level || get().player.level;
    return Math.round(CONFIG.EXP.coef * Math.pow(n, CONFIG.EXP.exp));
  }

  /* ---- 升级检查 ---- */
  function checkLevelUp() {
    var s = get();
    var changed = false;
    while (s.player.level < CONFIG.EXP.maxLevel && s.player.exp >= expNeeded(s.player.level)) {
      s.player.exp -= expNeeded(s.player.level);
      s.player.level++;
      changed = true;

      // 自动分配潜能点（按成长比例）
      var prof = CONFIG.PROFESSIONS.find(function (x) { return x.id === s.player.professionId; });
      if (prof) {
        var g = prof.growth;
        var total = g.str + g.erg + g.spi + g.agi + g.vit;
        if (total > 0) {
          s.player.stats.str += g.str;
          s.player.stats.erg += g.erg;
          s.player.stats.spi += g.spi;
          s.player.stats.agi += g.agi;
          s.player.stats.vit += g.vit;
        }
      }

      Bus.emit('levelup', s.player.level);
    }
    return changed;
  }

  /* ---- 增加经验 ---- */
  function addExp(amount) {
    var s = get();
    s.player.exp += amount;
    s.player.totalExp += amount;
    var leveled = checkLevelUp();
    Bus.emit('expGain', amount);
    return leveled;
  }

  /* ---- 增加铜钱 ---- */
  function addGold(amount) {
    get().currencies.gold += amount;
    Bus.emit('goldChange', get().currencies.gold);
  }

  /* ---- 消耗铜钱 ---- */
  function spendGold(amount) {
    var s = get();
    if (s.currencies.gold < amount) return false;
    s.currencies.gold -= amount;
    Bus.emit('goldChange', s.currencies.gold);
    return true;
  }

  /* ---- 增加洗练石 ---- */
  function addStone(amount) {
    get().currencies.stone += amount;
    Bus.emit('stoneChange', get().currencies.stone);
  }

  /* ---- 消耗洗练石 ---- */
  function spendStone(amount) {
    var s = get();
    if (s.currencies.stone < amount) return false;
    s.currencies.stone -= amount;
    Bus.emit('stoneChange', s.currencies.stone);
    return true;
  }

  /* ---- 获取当前关卡怪物列表 ---- */
  function getStageMonsters() {
    var s = get();
    if (!s.currentStage) return [];
    var stage = CONFIG.STAGES.find(function (x) { return x.id === s.currentStage; });
    if (!stage) return [];
    return stage.monsterIds.map(function (id) {
      return CONFIG.MONSTERS.find(function (m) { return m.id === id; });
    }).filter(Boolean);
  }

  /* ---- 检查关卡解锁 ---- */
  function isStageUnlocked(stageId) {
    var s = get();
    var stage = CONFIG.STAGES.find(function (x) { return x.id === stageId; });
    if (!stage) return false;
    if (s.player.level < stage.unlockLv) return false;
    // 前置章节 Boss 需击杀
    if (stageId > 1) {
      var prev = CONFIG.STAGES.find(function (x) { return x.id === stageId - 1; });
      if (prev) {
        var prog = s.stageProgress[prev.id];
        if (!prog || !prog.bossKilled) return false;
      }
    }
    // 战力阈值（战力不达标视为未解锁）
    if (!isStagePowerOk(stageId)) return false;
    return true;
  }

  /* ---- 检查关卡战力是否达标（未选职业时返回 true，防止锁死首章） ---- */
  function isStagePowerOk(stageId) {
    var stage = CONFIG.STAGES.find(function (x) { return x.id === stageId; });
    if (!stage || !(stage.powerReq > 0)) return true;
    var d = getDerived();
    if (!d) return true;   // 未创建角色：不判战力
    return d.power >= stage.powerReq;
  }

  /* ---- 获取当前地图区域 ---- */
  function getCurrentArea() {
    var s = get();
    return CONFIG.MAPAREAS.find(function (a) { return a.id === s.map.areaId; });
  }

  /* ---- 获取当前区域怪物池（野外才有怪，城镇返回空） ---- */
  function getMapMonsters() {
    var s = get();
    var area = getCurrentArea();
    if (!area || !area.monsters) return [];
    return area.monsters.map(function (id) {
      return CONFIG.MONSTERS.find(function (m) { return m.id === id; });
    }).filter(Boolean);
  }

  /* ---- 记录击杀：累计击杀统计 + 当前区域的探索度 ---- */
  function recordKill(monster) {
    var s = get();
    var prog = s.stageProgress[s.currentStage];
    if (!prog) {
      prog = { kills: 0, bossKilled: false };
      s.stageProgress[s.currentStage] = prog;
    }
    prog.kills++;
    if (monster.isBoss) prog.bossKilled = true;
    // 探索度：记录本区域击杀过的怪物种类
    var area = getCurrentArea();
    s.map.explored[s.map.areaId] = s.map.explored[s.map.areaId] || { killed: {} };
    s.map.explored[s.map.areaId].killed[monster.id] = true;
    s.stats.totalKills++;
  }

  /* ---- 添加物品到背包 ---- */
  function addItem(item) {
    var s = get();
    item.uid = 'item_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
    s.inventory.push(item);
    s.stats.totalDrops++;
    Bus.emit('itemAdded', item);
    return item;
  }

  /* ---- 加入宝石背包 ---- */
  function addGem(gid) {
    var g = CONFIG.GEMS.find(function (x) { return x.id === gid; });
    if (!g) return null;
    var s = get();
    var gem = {
      uid: 'gem_' + Date.now() + '_' + Math.floor(Math.random() * 10000),
      gid: g.id, name: g.name, stat: g.stat, base: g.base, color: g.color
    };
    s.gems.push(gem);
    return gem;
  }

  /* ---- 穿戴装备 ---- */
  function equipItem(uid) {
    var s = get();
    var idx = s.inventory.findIndex(function (x) { return x.uid === uid; });
    if (idx < 0) return false;
    var item = s.inventory[idx];
    // 卸下原有装备
    if (s.equipped[item.slot]) {
      s.inventory.push(s.equipped[item.slot]);
    }
    s.equipped[item.slot] = item;
    s.inventory.splice(idx, 1);
    Bus.emit('equipChange', item.slot);
    return true;
  }

  /* ---- 卸下装备 ---- */
  function unequipItem(slot) {
    var s = get();
    if (!s.equipped[slot]) return false;
    s.inventory.push(s.equipped[slot]);
    delete s.equipped[slot];
    Bus.emit('equipChange', slot);
    return true;
  }

  /* ---- 获取背包已用容量 ---- */
  function inventoryCount() {
    return get().inventory.length;
  }

  return {
    get: get,
    reset: reset,
    getDerived: getDerived,
    expNeeded: expNeeded,
    addExp: addExp,
    addGold: addGold,
    spendGold: spendGold,
    addStone: addStone,
    spendStone: spendStone,
    getCurrentArea: getCurrentArea,
    getMapMonsters: getMapMonsters,
    getStageMonsters: getStageMonsters,
    isStageUnlocked: isStageUnlocked,
    isStagePowerOk: isStagePowerOk,
    recordKill: recordKill,
    addItem: addItem,
    addGem: addGem,
    equipItem: equipItem,
    unequipItem: unequipItem,
    inventoryCount: inventoryCount,
    checkLevelUp: checkLevelUp
  };
})();
