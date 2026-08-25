/* ============================================================
 *  洪荒剑仙 P0 原型 — 全局配置数据
 *  数值来源：GDD ch5 角色 / ch6 战斗 / ch8 装备 / ch15 数值框架
 *  修改数值只需改本文件，不触碰逻辑代码（ch17 架构原则）
 * ============================================================ */

var CONFIG = (function () {

  /* ---- 经验曲线 ----
   * exp(n) = round(coef * n^exp)
   * GDD 口径：99 级单级约 895 万、总经验约 1.26 亿
   * 挂机基础产出 1000/分钟，约 90 天纯挂机到 99
   * P0 暂用 coef=145（exp(99)≈893万），平衡冒烟时校准总量
   */
  var EXP = {
    coef: 145,
    exp: 2.4,
    maxLevel: 99,
    baseExpPerMin: 1000,   // 基础挂机经验/分钟
    goldPerMin: 50,        // 基础铜钱产出/分钟
    offlineMaxSec: 43200,  // 离线上限 12 小时
    offlineRate: 1.0       // 离线产出倍率（与在线一致）
  };

  /* ---- 四大出身 ----
   * 五维：力(str) 气(erg) 神(spi) 身(agi) 根(vit)
   * 每级 3 潜能点，按 growth 比例自动分配（P0 简化为自动）
   */
  var PROFESSIONS = [
    {
      id: 'sword', name: '剑修 · 出鞘', desc: '会心爆发流',
      base: { str: 14, erg: 0, spi: 8, agi: 6, vit: 2 },
      growth: { str: 1.6, erg: 0, spi: 0.9, agi: 0.5, vit: 0 },
      passive: { type: 'crit', critRate: 0.08, critDmg: 1.65, skillMod: 0.20 }
    },
    {
      id: 'body', name: '体修 · 不动', desc: '防御反伤流',
      base: { str: 6, erg: 10, spi: 0, agi: 2, vit: 12 },
      growth: { str: 0, erg: 1.2, spi: 0, agi: 0, vit: 1.8 },
      passive: { type: 'tank', dmgReduce: 0.15, reflect: 0.30, rageMult: 2.0 }
    },
    {
      id: 'alchemy', name: '丹修 · 回春', desc: '持续消耗流',
      base: { str: 0, erg: 12, spi: 12, agi: 4, vit: 2 },
      growth: { str: 0, erg: 1.4, spi: 1.4, agi: 0.2, vit: 0 },
      passive: { type: 'dot', healBonus: 0.20, dotBonus: 0.25, dotExtraTurn: 1 }
    },
    {
      id: 'spirit', name: '御灵 · 共生', desc: '人宠合击流',
      base: { str: 0, erg: 9, spi: 9, agi: 8, vit: 4 },
      growth: { str: 0, erg: 1.0, spi: 1.2, agi: 0.8, vit: 0 },
      passive: { type: 'combo', comboBonus: 0.20, allStatBonus: 0.005 }
    }
  ];

  /* ---- 属性换算公式 ---- */
  var STAT = {
    // 物理攻击力 = 力量 × 2 + 等级 × 4（每级基础成长）
    atk: function (s, lv) { return Math.floor(s.str * 2 + lv * 4); },
    // 元素攻击力 = 元神 × 1.5 + 等级 × 1
    elemAtk: function (s, lv) { return Math.floor(s.spi * 1.5 + lv * 1); },
    // 防御力 = 筋骨 ÷ 3 + 等级 × 2（每级基础成长）
    def: function (s, lv) { return Math.floor(s.vit / 3 + lv * 2); },
    // 体力上限 = (筋骨 × 5 + 力量 × 2) × (1 + 等级/10) + 等级 × 50
    maxHp: function (s, lv) { return Math.floor((s.vit * 5 + s.str * 2) * (1 + lv / 10) + lv * 50); },
    // 法力上限 = (元气 × 5 + 元神 × 3) × (1 + 等级/10) + 等级 × 5
    maxMp: function (s, lv) { return Math.floor((s.erg * 5 + s.spi * 3) * (1 + lv / 10) + lv * 5); },
    // 会心率 = min(身法 / 200, 0.5)
    critRate: function (s) { return Math.min(s.agi / 200, 0.5); },
    // 会心伤害 = 1.5 + 力量 / 200
    critDmg: function (s) { return 1.5 + s.str / 200; },
    // 身法（出手速度）= 身法值
    speed: function (s) { return s.agi; }
  };

  /* ---- 战力公式（参考值，不参与结算） ---- */
  function combatPower(atk, def, hp, agi, crit, mp) {
    return Math.floor(atk * 4 + def * 3 + hp * 0.5 + agi * 2 + crit * 10 + mp * 1.5);
  }

  /* ---- 战斗公式 ----
   * 物理伤害 = AP² ÷ (AP + DP/1.5) × 体型修正
   * AP = 面板攻击力 × 技能修正（P0 技能修正=1.0，无手动技能）
   * DP = 目标防御力
   */
  var COMBAT = {
    // 物理伤害计算
    physDmg: function (ap, dp, sizeMod) {
      sizeMod = sizeMod || 1.0;
      if (ap <= 0) return 0;
      return Math.max(1, Math.floor(ap * ap / (ap + dp / 1.5) * sizeMod));
    },
    // 体型修正（超小1.1/小1.05/中1.0/偏大中0.95/大0.9/超大0.85/巨大0.8）
    sizeMod: { '超小': 1.1, '小': 1.05, '中': 1.0, '偏大中': 0.95, '大': 0.9, '超大': 0.85, '巨大': 0.8 },
    // 回合间隔（秒）
    roundInterval: 3,
    // 逃跑阈值（HP%低于此值怪物逃跑）
    fleeThreshold: 0.1
  };

  /* ---- 装备品质（7 档） ---- */
  var QUALITY = [
    { id: 1, name: '凡品', color: '#9e9e9e', mult: 1.0, affixMin: 0, affixMax: 2, enhanceMax: 6,  dropWeight: 0   },
    { id: 2, name: '良品', color: '#4caf50', mult: 1.3, affixMin: 1, affixMax: 4, enhanceMax: 8,  dropWeight: 70  },
    { id: 3, name: '上品', color: '#2196f3', mult: 1.5, affixMin: 1, affixMax: 6, enhanceMax: 10, dropWeight: 100 },
    { id: 4, name: '精品', color: '#ff9800', mult: 1.8, affixMin: 2, affixMax: 7, enhanceMax: 12, dropWeight: 18  },
    { id: 5, name: '绝品', color: '#ff5722', mult: 2.1, affixMin: 3, affixMax: 9, enhanceMax: 13, dropWeight: 6   },
    { id: 6, name: '仙品', color: '#e91e63', mult: 2.5, affixMin: 4, affixMax: 11,enhanceMax: 15, dropWeight: 1.5 },
    { id: 7, name: '神话', color: '#9c27b0', mult: 3.0, affixMin: 5, affixMax: 13,enhanceMax: 15, dropWeight: 0.5 }
  ];

  /* ---- 装备部位（6 类） ---- */
  var SLOTS = [
    { id: 'weapon',   name: '武器', baseAtk: 10, baseDef: 0 },
    { id: 'amulet',   name: '护符', baseAtk: 0,  baseDef: 5 },
    { id: 'cloak',    name: '披风', baseAtk: 0,  baseDef: 8 },
    { id: 'bracer',   name: '护腕', baseAtk: 5,  baseDef: 3 },
    { id: 'belt',     name: '腰带', baseAtk: 0,  baseDef: 10 },
    { id: 'necklace', name: '项链', baseAtk: 3,  baseDef: 3 }
  ];

  /* ---- 强化成功率表（+1 ~ +15） ---- */
  var FORGE = [
    { lv: 1,  rate: 1.00, fallback: 0,  iron: '普通', ironN: 1, gold: 1000,  blessing: 0  },
    { lv: 2,  rate: 0.95, fallback: 0,  iron: '普通', ironN: 1, gold: 1000,  blessing: 5  },
    { lv: 3,  rate: 0.90, fallback: 0,  iron: '普通', ironN: 1, gold: 1500,  blessing: 10 },
    { lv: 4,  rate: 0.85, fallback: 0,  iron: '普通', ironN: 1, gold: 2000,  blessing: 15 },
    { lv: 5,  rate: 0.80, fallback: -1, iron: '普通', ironN: 1, gold: 2500,  blessing: 20 }, // 保底
    { lv: 6,  rate: 0.75, fallback: 5,  iron: '中品', ironN: 1, gold: 3000,  blessing: 25 },
    { lv: 7,  rate: 0.70, fallback: 5,  iron: '中品', ironN: 1, gold: 3500,  blessing: 30 },
    { lv: 8,  rate: 0.65, fallback: 5,  iron: '中品', ironN: 1, gold: 4000,  blessing: 35 },
    { lv: 9,  rate: 0.60, fallback: 5,  iron: '中品', ironN: 1, gold: 4500,  blessing: 40 },
    { lv: 10, rate: 0.56, fallback: -1, iron: '中品', ironN: 1, gold: 5000,  blessing: 45 }, // 保底
    { lv: 11, rate: 0.55, fallback: 10, iron: '上品', ironN: 1, gold: 6000,  blessing: 50 },
    { lv: 12, rate: 0.45, fallback: 10, iron: '上品', ironN: 1, gold: 7000,  blessing: 55 },
    { lv: 13, rate: 0.40, fallback: 10, iron: '上品', ironN: 1, gold: 8000,  blessing: 60 },
    { lv: 14, rate: 0.36, fallback: 10, iron: '上品', ironN: 1, gold: 9000,  blessing: 65 },
    { lv: 15, rate: 0.34, fallback: -1, iron: '上品', ironN: 1, gold: 10000, blessing: 70 }  // 保底
  ];

  var BLESSING = { max: 100, onMaxRate: 1.00, clearOnSuccess: false };

  /* ---- 宝石（镶嵌用，属性与词缀池对齐：atk/def/hp/crit/agi） ---- */
  var GEMS = [
    { id: 1, name: '赤炎晶', stat: 'atk',  base: 8,  color: '#e53935', dropW: 100 },
    { id: 2, name: '玄岩玉', stat: 'def',  base: 8,  color: '#5e54ff', dropW: 100 },
    { id: 3, name: '血魄珠', stat: 'hp',   base: 60, color: '#d81b60', dropW: 80  },
    { id: 4, name: '会心石', stat: 'crit', base: 3,  color: '#ffb300', dropW: 50  },
    { id: 5, name: '疾风坠', stat: 'agi',  base: 3,  color: '#00bcd4', dropW: 50  }
  ];

  /* ---- 掉落配置 ---- */
  var DROPS = {
    baseRate: 0.18,           // 18% 基础掉落率
    bossBonus: 0.50,          // Boss 额外掉落加成
    gemRate: 0.10,            // 未打孔宝石独立掉落率
    gemBossBonus: 0.15,       // Boss 额外宝石掉率
    // 品质权重按怪物类型区分
    qualityWeights: {
      // 品质权重按【凡品/良品/上品/精品/绝品/仙品/神话】排列；神话仅 Boss 档产出
      grunt:  [0, 70, 100, 18, 6, 1.5, 0],
      elite:  [0, 30, 60, 40, 15, 5, 0],
      boss:   [0, 0,  20, 40, 30, 15, 5]
    }
  };

  /* ---- 怪物数据（前 3 章，来自怪物资料库） ---- */
  var MONSTERS = [
    /* 第一章 乱葬岗（lv 1-10） */
    { id: 'm101', name: '杂毛野犬',   lv: 1,  hp: 50,   atk: 4,   def: 1,  type: 'grunt', size: '小',   ch: 1, expR: 5,    goldR: 8   },
    { id: 'm102', name: '食腐僵尸',   lv: 3,  hp: 150,  atk: 6,   def: 3,  type: 'grunt', size: '中',   ch: 1, expR: 15,   goldR: 24  },
    { id: 'm103', name: '黑毛野犬',   lv: 5,  hp: 250,  atk: 11,  def: 8,  type: 'grunt', size: '小',   ch: 1, expR: 25,   goldR: 40  },
    { id: 'm104', name: '爆裂僵尸',   lv: 6,  hp: 300,  atk: 13,  def: 8,  type: 'grunt', size: '中',   ch: 1, expR: 30,   goldR: 48  },
    { id: 'm105', name: '刀盾狼兵',   lv: 6,  hp: 300,  atk: 14,  def: 15, type: 'grunt', size: '中',   ch: 1, expR: 30,   goldR: 48  },
    { id: 'm106', name: '食腐毒僵尸', lv: 7,  hp: 350,  atk: 14,  def: 12, type: 'grunt', size: '中',   ch: 1, expR: 35,   goldR: 56  },
    { id: 'm107', name: '铁弓狼兵',   lv: 7,  hp: 350,  atk: 15,  def: 11, type: 'grunt', size: '中',   ch: 1, expR: 35,   goldR: 56  },
    { id: 'm108', name: '锤盾狼兵',   lv: 8,  hp: 400,  atk: 17,  def: 21, type: 'grunt', size: '中',   ch: 1, expR: 40,   goldR: 64  },
    { id: 'm109', name: '刀盾狼精',   lv: 9,  hp: 450,  atk: 19,  def: 24, type: 'grunt', size: '中',   ch: 1, expR: 45,   goldR: 72  },
    { id: 'm110', name: '狼兵牙将',   lv: 10, hp: 1200, atk: 58,  def: 30, type: 'elite', size: '中',   ch: 1, expR: 500,  goldR: 250, isBoss: true },

    /* 第二章 瓦当山（lv 10-25） */
    { id: 'm201', name: '锤盾狼精',   lv: 11, hp: 550,  atk: 21,  def: 31, type: 'grunt', size: '中',   ch: 2, expR: 55,   goldR: 88  },
    { id: 'm202', name: '铁弓狼精',   lv: 12, hp: 600,  atk: 21,  def: 22, type: 'grunt', size: '中',   ch: 2, expR: 60,   goldR: 96  },
    { id: 'm203', name: '幡旗狼精',   lv: 13, hp: 650,  atk: 24,  def: 26, type: 'grunt', size: '中',   ch: 2, expR: 65,   goldR: 104 },
    { id: 'm204', name: '长枪狼精',   lv: 14, hp: 700,  atk: 26,  def: 33, type: 'grunt', size: '中',   ch: 2, expR: 70,   goldR: 112 },
    { id: 'm205', name: '猪精十夫长', lv: 14, hp: 1680, atk: 45,  def: 30, type: 'elite', size: '大',   ch: 2, expR: 350,  goldR: 200 },
    { id: 'm206', name: '双镰尸妖',   lv: 15, hp: 750,  atk: 44,  def: 40, type: 'grunt', size: '中',   ch: 2, expR: 75,   goldR: 120 },
    { id: 'm207', name: '长枪猫兵',   lv: 16, hp: 800,  atk: 32,  def: 42, type: 'grunt', size: '小',   ch: 2, expR: 80,   goldR: 128 },
    { id: 'm208', name: '飞刀猫兵',   lv: 17, hp: 850,  atk: 29,  def: 47, type: 'grunt', size: '小',   ch: 2, expR: 85,   goldR: 136 },
    { id: 'm209', name: '铁爪猫妖',   lv: 18, hp: 900,  atk: 32,  def: 49, type: 'grunt', size: '小',   ch: 2, expR: 90,   goldR: 144 },
    { id: 'm210', name: '妖王护卫',   lv: 20, hp: 2400, atk: 63,  def: 58, type: 'elite', size: '中',   ch: 2, expR: 1000, goldR: 500, isBoss: true },

    /* 第三章 午桥庄（lv 25-40） */
    { id: 'm301', name: '号角猫妖',   lv: 21, hp: 1050, atk: 30,  def: 57, type: 'grunt', size: '小',   ch: 3, expR: 105,  goldR: 168 },
    { id: 'm302', name: '爆裂毒僵尸', lv: 24, hp: 1200, atk: 36,  def: 42, type: 'grunt', size: '中',   ch: 3, expR: 120,  goldR: 192 },
    { id: 'm303', name: '红袍狐妖',   lv: 25, hp: 1250, atk: 10,  def: 50, type: 'grunt', size: '中',   ch: 3, expR: 125,  goldR: 200 },
    { id: 'm304', name: '主战巨犀',   lv: 28, hp: 1400, atk: 60,  def: 30, type: 'grunt', size: '大',   ch: 3, expR: 140,  goldR: 224 },
    { id: 'm305', name: '掘墓鬼',     lv: 28, hp: 1400, atk: 53,  def: 64, type: 'grunt', size: '中',   ch: 3, expR: 140,  goldR: 224 },
    { id: 'm306', name: '黑掘墓鬼',   lv: 32, hp: 1600, atk: 47,  def: 64, type: 'grunt', size: '中',   ch: 3, expR: 160,  goldR: 256 },
    { id: 'm307', name: '雌虎蛟',     lv: 34, hp: 1700, atk: 170, def: 64, type: 'grunt', size: '小',   ch: 3, expR: 170,  goldR: 272 },
    { id: 'm308', name: '狐狸枪兵',   lv: 34, hp: 1700, atk: 51,  def: 70, type: 'grunt', size: '中',   ch: 3, expR: 170,  goldR: 272 },
    { id: 'm309', name: '聒噪鬃',     lv: 30, hp: 3600, atk: 75,  def: 102,type: 'elite', size: '中',   ch: 3, expR: 1500, goldR: 750, isBoss: true },
    { id: 'm310', name: '冰魄玄蛟',   lv: 40, hp: 8000, atk: 200, def: 120,type: 'boss',  size: '巨大', ch: 3, expR: 5000, goldR: 2000, isBoss: true }
  ];

  /* ---- 关卡进度表（前 3 章） ---- */
  var STAGES = [
    {
      id: 1, ch: 1, name: '乱葬岗', desc: '新生剑修的第一战场，遍地腐尸野犬。',
      unlockLv: 1, monsterIds: ['m101','m102','m103','m104','m105','m106','m107','m108','m109','m110'],
      bossId: 'm110', powerReq: 0
    },
    {
      id: 2, ch: 2, name: '瓦当山', desc: '狼精猫兵盘踞的山道，妖气渐浓。',
      unlockLv: 10, monsterIds: ['m201','m202','m203','m204','m205','m206','m207','m208','m209','m210'],
      bossId: 'm210', powerReq: 300
    },
    {
      id: 3, ch: 3, name: '午桥庄', desc: '荒废的村庄与古墓，妖兽横行。',
      unlockLv: 20, monsterIds: ['m301','m302','m303','m304','m305','m306','m307','m308','m309','m310'],
      bossId: 'm310', powerReq: 800
    }
  ];

  /* ---- 存档配置 ---- */
  var SAVE = {
    key: 'honghuang_p0_save',
    version: 1,
    autoSaveSec: 30
  };

  /* ---- 导出 ---- */
  return {
    EXP: EXP,
    PROFESSIONS: PROFESSIONS,
    STAT: STAT,
    COMBAT: COMBAT,
    combatPower: combatPower,
    QUALITY: QUALITY,
    SLOTS: SLOTS,
    FORGE: FORGE,
    BLESSING: BLESSING,
    DROPS: DROPS,
    GEMS: GEMS,
    MONSTERS: MONSTERS,
    STAGES: STAGES,
    SAVE: SAVE
  };
})();
