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

  /* ---- 技能连招表（P2） ----
   * 每个出身一套连招序列（4 技），战斗按序循环释放、消耗灵力(MP)。
   * type 特效：
   *   strike      单体爆发（可选 critBonus 额外会心率）
   *   armorBreak  破防（armor: 无视目标防御比例）
   *   multi       多段连击（cuts: 段数，每段独立会心判定）
   *   leech       吸血（leech: 造成伤害的回血比例）
   *   heal        自愈（heal: 回复上限HP比例，可选 dotPerTurn/dotTurns 附带毒）
   *   reflect     重击（可选 reflectBonus 本次受击反伤提升）
   *   dot         持续灼烧（dotPerTurn: 每回合扣 HP 比例×atk，dotTurns: 持续回合）
   * power 为相对面板攻击的倍率；剑修被动 skillMod 会进一步放大技能伤害。
   */
  var SKILLS = {
    sword: [
      { name: '青锋斩',      mp: 10, power: 1.5, type: 'strike',     critBonus: 0.04, desc: '剑意直取，会心率+4%' },
      { name: '剑破万法',    mp: 16, power: 2.2, type: 'armorBreak', armor: 0.30,     desc: '无视目标30%防御' },
      { name: '万剑归宗',    mp: 26, power: 0.8, type: 'multi',      cuts: 4,         desc: '剑气纵横，连斩4段' },
      { name: '一剑·霜寒',   mp: 34, power: 3.6, type: 'strike',     critBonus: 0.10, desc: '霜芒满月，高会心一击' }
    ],
    body: [
      { name: '镇岳',        mp: 10, power: 1.3, type: 'leech',  leech: 0.40,              desc: '重击镇地，吸血40%' },
      { name: '金钟罩',      mp: 14, power: 0.7, type: 'heal',   heal: 0.15,               desc: '内息流转，回复15%气血' },
      { name: '反震·开山',   mp: 22, power: 2.4, type: 'reflect', reflectBonus: 0.40,     desc: '陨石裂地，临时提升反伤' },
      { name: '不动明王',    mp: 30, power: 2.0, type: 'leech',  leech: 0.80,              desc: '金身硬撼，吸血80%' }
    ],
    alchemy: [
      { name: '蚀骨火',      mp: 12, power: 1.0, type: 'dot',   dotPerTurn: 0.12, dotTurns: 4, desc: '毒火缠身，持续灼烧' },
      { name: '枯荣·生',     mp: 18, power: 0.5, type: 'heal',  heal: 0.25,                 desc: '枯木逢春，回复25%气血' },
      { name: '万毒噬心',    mp: 24, power: 1.3, type: 'dot',   dotPerTurn: 0.20, dotTurns: 5, desc: '剧毒入脉，强效侵蚀' },
      { name: '九九还丹',    mp: 32, power: 0.6, type: 'heal',  heal: 0.50, dotPerTurn: 0.15, dotTurns: 4, desc: '炼丹回照，大量回血并续毒' }
    ],
    spirit: [
      { name: '灵犀一击',    mp: 10, power: 1.0, type: 'multi', cuts: 2,                    desc: '人宠并肩，连袭2段' },
      { name: '兽灵附体',    mp: 16, power: 0.8, type: 'leech', leech: 0.50,                desc: '灵契共鸣，吸血50%' },
      { name: '共生·怒',     mp: 22, power: 0.9, type: 'multi', cuts: 3,                    desc: '共生激荡，合击3段' },
      { name: '万灵归一',    mp: 30, power: 0.85,type: 'multi', cuts: 4,                    desc: '万灵合一，齐袭4段' }
    ]
  };

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
    { id: 1, name: '凡品', color: '#9e9e9e', mult: 1.0, affixMin: 0, affixMax: 2, enhanceMax: 6,  dropWeight: 0,   reforgeStone: 1, reforgeGold: 300  },
    { id: 2, name: '良品', color: '#4caf50', mult: 1.3, affixMin: 1, affixMax: 4, enhanceMax: 8,  dropWeight: 70,  reforgeStone: 1, reforgeGold: 600  },
    { id: 3, name: '上品', color: '#2196f3', mult: 1.5, affixMin: 1, affixMax: 6, enhanceMax: 10, dropWeight: 100, reforgeStone: 2, reforgeGold: 1200 },
    { id: 4, name: '精品', color: '#ff9800', mult: 1.8, affixMin: 2, affixMax: 7, enhanceMax: 12, dropWeight: 18,  reforgeStone: 2, reforgeGold: 2000 },
    { id: 5, name: '绝品', color: '#ff5722', mult: 2.1, affixMin: 3, affixMax: 9, enhanceMax: 13, dropWeight: 6,   reforgeStone: 3, reforgeGold: 3500 },
    { id: 6, name: '仙品', color: '#e91e63', mult: 2.5, affixMin: 4, affixMax: 11,enhanceMax: 15, dropWeight: 1.5, reforgeStone: 3, reforgeGold: 5000 },
    { id: 7, name: '神话', color: '#9c27b0', mult: 3.0, affixMin: 5, affixMax: 13,enhanceMax: 15, dropWeight: 0.5, reforgeStone: 5, reforgeGold: 8000 }
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

  /* ---- 词条品阶（决定词条数值倍率与显示色） ---- */
  var AFFIX_TIER = [
    { id: 1, name: '凡', color: '#9e9e9e', mult: 0.7,  weight: 50 },
    { id: 2, name: '良', color: '#4caf50', mult: 1.0,  weight: 30 },
    { id: 3, name: '优', color: '#2196f3', mult: 1.35, weight: 14 },
    { id: 4, name: '极', color: '#ab47bc', mult: 1.75, weight: 5  },
    { id: 5, name: '仙', color: '#ffb300', mult: 2.25, weight: 1  }
  ];
  /* 词条属性统一标签（用于 parse 显示） */
  var AFFIX_STAT_LABEL = { atk: '攻击', def: '防御', hp: '气血', crit: '会心', agi: '身法', critDmg: '会心伤害', leech: '吸血', skillPower: '技能威力' };

  /* ---- 词条池（P2 装备词条系统）：各属性基准区间（精良档） ---- */
  var AFFIX_POOL = [
    { stat: 'atk',        base: 3,  max: 12 },
    { stat: 'def',        base: 2,  max: 10 },
    { stat: 'hp',         base: 20, max: 80 },
    { stat: 'crit',       base: 1,  max: 5  },
    { stat: 'agi',        base: 1,  max: 5  },
    { stat: 'critDmg',    base: 5,  max: 20 },
    { stat: 'leech',      base: 1,  max: 6  },
    { stat: 'skillPower', base: 2,  max: 10 }
  ];

  /* ---- 洗练配置 ---- */
  var REFINE = {
    stoneRate: 0.06,          // 洗练石独立掉落率
    stoneBossBonus: 0.12,     // Boss 额外洗练石掉率
    stoneName: '洗练石'
  };

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

  /* ============================================================
   * 世界场景规格表（权威数据源：worldmap-redesign.html 策划稿）
   * 地图名 / 怪物名 / 等级区间 / 所属主城 均按策划原稿，禁止自造。
   * 精英(elite)与首领(boss) 放置位置由开发自行决定（复用策划已出现的怪物名）。
   * ------------------------------------------------------------
   * city: 所属主城 id；region: 界；ch: 章节；
   * pos: [x,y] 世界总览图标点坐标（0-100 相对）；unlock: 解锁等级门槛
   * monsters: 策划该场景怪物名（脚本据此 + elite/boss 生成具体对象）
   * ============================================================ */
  var AREA_SPECS = [
    /* ===== 九 主 城（town · 安全区） ===== */
    { id: 'qingshi',        name: '青石镇',     type: 'town', region: '凡界',  ch: 1,  city: 'qingshi',        lvMin: 1,  lvMax: 10,  unlock: 1,   pos: [15, 20], desc: '凡人出发地，安身之所，镇内禁止打斗。' },
    { id: 'luoxiacheng',    name: '落霞城',     type: 'town', region: '凡界',  ch: 2,  city: 'luoxiacheng',    lvMin: 10, lvMax: 30,  unlock: 10,  pos: [30, 16], desc: '九州繁华主城，妖气初起的江湖都会。' },
    { id: 'hanyuguan',      name: '寒玉关',     type: 'town', region: '凡界',  ch: 4,  city: 'hanyuguan',      lvMin: 30, lvMax: 45,  unlock: 30,  pos: [42, 12], desc: '北域极寒关隘，冰原的咽喉。' },
    { id: 'yanyud',         name: '烟雨渡',     type: 'town', region: '凡界',  ch: 5,  city: 'yanyud',         lvMin: 45, lvMax: 55,  unlock: 45,  pos: [50, 18], desc: '江南富庶渡口，商旅云集。' },
    { id: 'xuandug',        name: '玄都观',     type: 'town', region: '凡界',  ch: 6,  city: 'xuandug',        lvMin: 55, lvMax: 70,  unlock: 55,  pos: [58, 14], desc: '仙门道观，灵气汇聚之地。' },
    { id: 'youmingdu',      name: '幽冥渡',     type: 'town', region: '冥界',  ch: 7,  city: 'youmingdu',      lvMin: 70, lvMax: 85,  unlock: 70,  pos: [70, 18], desc: '冥界入口，轮回初渡之处。（一转解锁）' },
    { id: 'chiyouzhong',    name: '蚩尤冢',     type: 'town', region: '北荒',  ch: 8,  city: 'chiyouzhong',    lvMin: 85, lvMax: 95,  unlock: 85,  pos: [64, 26], desc: '北荒古战场遗址，蚩尤陨落之地。' },
    { id: 'honghuangjianzhong', name: '洪荒剑冢', type: 'town', region: '洪荒', ch: 9,  city: 'honghuangjianzhong', lvMin: 95, lvMax: 99, unlock: 95, pos: [78, 24], desc: '东海海底终局，天下名剑葬处。' },
    { id: 'lingxiaojing',   name: '凌霄境',     type: 'town', region: '仙界',  ch: 10, city: 'lingxiaojing',   lvMin: 108, lvMax: 120, unlock: 108, pos: [86, 12], desc: '仙界天庭所在。（三转后开启）' },

    /* ===== 青石镇（章1 · 1-15） ===== */
    { id: 'qingshiwai', name: '青石镇外', type: 'field', region: '凡界', ch: 1, city: 'qingshi', lvMin: 1,  lvMax: 3,  unlock: 1,  pos: [11, 26], desc: '镇外荒地，蝙蝠野狗出没。', monsters: ['蝙蝠', '杂毛野狗', '低等野狼'], elite: ['杂毛野狗'] },
    { id: 'huangfenye', name: '荒坟野',  type: 'field', region: '凡界', ch: 1, city: 'qingshi', lvMin: 1,  lvMax: 3,  unlock: 1,  pos: [7, 30],  desc: '荒坟连片，阴气沉沉。', monsters: ['蝙蝠', '野狗'], elite: ['野狗'] },
    { id: 'yelangpo',   name: '野狼坡',   type: 'field', region: '凡界', ch: 1, city: 'qingshi', lvMin: 6,  lvMax: 8,  unlock: 4,  pos: [19, 31], desc: '狼兵盘踞的山坡。', monsters: ['刀盾狼兵', '铁弓狼兵', '锤盾狼兵'], elite: ['锤盾狼兵'] },
    { id: 'luolanggu',  name: '落狼谷',   type: 'field', region: '凡界', ch: 1, city: 'qingshi', lvMin: 6,  lvMax: 8,  unlock: 4,  pos: [23, 27], desc: '谷地狼群伏莽，妖气渐浓。', monsters: ['刀盾狼兵', '铁弓狼兵'], elite: ['刀盾狼兵'] },
    { id: 'shinherzongx', name: '十二魂冢·下', type: 'cave', region: '凡界', ch: 1, city: 'qingshi', lvMin: 1, lvMax: 15, unlock: 2, pos: [12, 37], desc: '魂冢下层，双镰与冢中精怪横立。', monsters: ['战双镰', '野狗', '低等刀盾狼精', '低等锤盾狼精'], elite: ['战双镰'], boss: ['猪精十夫长'] },
    { id: 'shinherzong_t', name: '十二魂冢·上', type: 'cave', region: '凡界', ch: 1, city: 'qingshi', lvMin: 1, lvMax: 15, unlock: 3, pos: [16, 39], desc: '魂冢上层，深处盘踞冢中妖将。', monsters: ['战双镰', '低等狼精', '低等长枪狼兵', '猪精十夫长'], elite: ['猪精十夫长'] },

    /* ===== 落霞城（章2-3 · 10-32） ===== */
    { id: 'xiehuntai',  name: '邪魂台',   type: 'ghost', region: '凡界', ch: 2, city: 'luoxiacheng', lvMin: 10, lvMax: 25, unlock: 10, pos: [27, 23], desc: '游魂汇聚的凶台。', monsters: ['刀盾狼兵魂魄', '猫妖魂魄', '傀儡魂魄', '野狗魂魄'], elite: ['猫妖魂魄'] },
    { id: 'qingxijian', name: '清溪涧',   type: 'field', region: '凡界', ch: 2, city: 'luoxiacheng', lvMin: 12, lvMax: 18, unlock: 10, pos: [29, 27], desc: '溪涧潺潺，狼精猫兵出没。', monsters: ['幡旗狼精', '铁弓狼精', '长枪猫兵', '铁爪猫兵'], elite: ['铁爪猫兵'] },
    { id: 'luoshui',    name: '洛水荒岸', type: 'field', region: '凡界', ch: 2, city: 'luoxiacheng', lvMin: 16, lvMax: 23, unlock: 12, pos: [35, 25], desc: '洛水荒岸，猫族弓手盘桓。', monsters: ['长枪猫妖', '铁爪猫兵', '飞刀猫兵', '飞刀猫妖'], elite: ['飞刀猫妖'] },
    { id: 'yaozuyingdi',name: '妖族营地', type: 'field', region: '凡界', ch: 2, city: 'luoxiacheng', lvMin: 20, lvMax: 27, unlock: 14, pos: [31, 31], desc: '妖兵扎营之处，号角声震。', monsters: ['长枪猫妖', '铁爪猫妖', '号角猫妖', '红袍狐妖'], elite: ['号角猫妖'] },
    { id: 'wuqiao',     name: '午桥废庄', type: 'field', region: '凡界', ch: 3, city: 'luoxiacheng', lvMin: 20, lvMax: 29, unlock: 16, pos: [25, 34], desc: '荒废村庄与古墓，妖兽横行。', monsters: ['长枪猫妖', '号角猫妖', '高等锤盾狼兵', '盗墓贼'], elite: ['盗墓贼'] },
    { id: 'fengmingshan',name: '凤鸣山',  type: 'field', region: '凡界', ch: 3, city: 'luoxiacheng', lvMin: 25, lvMax: 29, unlock: 18, pos: [36, 33], desc: '巨兽出没的莽原之山。', monsters: ['主战巨犀', '高等锤盾狼兵', '红袍狐妖', '盗墓贼'], elite: ['主战巨犀'] },
    { id: 'kongshansi', name: '空山寺',   type: 'field', region: '凡界', ch: 3, city: 'luoxiacheng', lvMin: 27, lvMax: 32, unlock: 20, pos: [21, 40], desc: '荒寺空门，妖魅潜行。', monsters: ['主战巨犀', '红袍狐妖', '盗墓贼', '黑盗墓贼'], elite: ['黑盗墓贼'] },
    { id: 'qingshigudao',name: '青石古道', type: 'field', region: '凡界', ch: 3, city: 'luoxiacheng', lvMin: 30, lvMax: 30, unlock: 22, pos: [27, 43], desc: '通向寒玉关的古老官道，野猪成群。', monsters: ['聒噪鬃', '野猪精'], elite: ['聒噪鬃'] },

    /* ===== 寒玉关（章4 · 30-54） ===== */
    { id: 'hanyunxuegu',name: '寒云雪谷', type: 'field', region: '凡界', ch: 4, city: 'hanyuguan', lvMin: 34, lvMax: 39, unlock: 30, pos: [40, 17], desc: '雪线之上的狐妖谷地。', monsters: ['狐狸枪兵', '狐狸弩兵', '狐狸号兵', '蓝袍狐妖'], elite: ['蓝袍狐妖'] },
    { id: 'donggu',     name: '冻骨雪原', type: 'field', region: '凡界', ch: 4, city: 'hanyuguan', lvMin: 35, lvMax: 36, unlock: 31, pos: [38, 23], desc: '冻骨遍野的无人雪原，傀儡游荡。', monsters: ['雪地豺狗', '大锤傀儡壮汉', '双斧傀儡壮汉'], elite: ['大锤傀儡壮汉'] },
    { id: 'yueluozhen', name: '月落镇',   type: 'field', region: '凡界', ch: 4, city: 'hanyuguan', lvMin: 36, lvMax: 39, unlock: 32, pos: [45, 21], desc: '被傀儡屠掠的边陲小镇。', monsters: ['傀儡枪兵', '傀儡剑卒', '傀儡弓兵', '壮汉屠夫'], elite: ['壮汉屠夫'] },
    { id: 'xuehudong',  name: '雪狐洞',   type: 'cave', region: '凡界', ch: 4, city: 'hanyuguan', lvMin: 36, lvMax: 42, unlock: 32, pos: [43, 27], desc: '雪狐妖盘踞的寒洞。', monsters: ['狐狸步卒', '狐狸号兵', '狐狸强弩手'], elite: ['狐狸强弩手'] },
    { id: 'guling1',    name: '古王陵墓·上', type: 'cave', region: '凡界', ch: 4, city: 'hanyuguan', lvMin: 36, lvMax: 48, unlock: 33, pos: [40, 30], desc: '上古王陵上层，铜甲傀儡巡弋。', monsters: ['傀儡枪兵', '铜甲傀儡枪兵', '铜甲傀儡剑卒', '壮汉屠夫'], elite: ['铜甲傀儡剑卒'] },
    { id: 'guling2',    name: '古王陵墓·下', type: 'cave', region: '凡界', ch: 4, city: 'hanyuguan', lvMin: 36, lvMax: 48, unlock: 34, pos: [44, 34], desc: '古王陵下层，旗手弓兵密布。', monsters: ['铜甲傀儡旗手', '铜甲傀儡弓兵', '钉耙傀儡壮汉'], elite: ['铜甲傀儡旗手'] },
    { id: 'gumu',       name: '古王墓室', type: 'cave', region: '凡界', ch: 4, city: 'hanyuguan', lvMin: 36, lvMax: 48, unlock: 35, pos: [48, 36], desc: '古王长眠之室，墓主傀儡苏醒。', monsters: ['铜甲傀儡旗手', '壮汉屠夫'], elite: ['壮汉屠夫'], boss: ['古王傀儡'] },
    { id: 'yaohubuluo', name: '妖狐部落', type: 'field', region: '凡界', ch: 4, city: 'hanyuguan', lvMin: 39, lvMax: 54, unlock: 34, pos: [47, 16], desc: '北地妖狐聚落的腹地。', monsters: ['狐狸精骑兵', '披甲鹿', '蓝袍狐妖', '狐狸斥候'], elite: ['披甲鹿'] },

    /* ===== 烟雨渡（章5 · 41-60） ===== */
    { id: 'qianhuling', name: '千狐岭',   type: 'field', region: '凡界', ch: 5, city: 'yanyud', lvMin: 41, lvMax: 46, unlock: 45, pos: [53, 24], desc: '狐族千骑奔掠的山岭。', monsters: ['狐狸长戟兵', '狐狸小校', '狐狸强弩手', '狐狸斥候'], elite: ['狐狸小校'] },
    { id: 'yaohudong',  name: '妖狐洞',   type: 'cave', region: '凡界', ch: 5, city: 'yanyud', lvMin: 41, lvMax: 46, unlock: 45, pos: [57, 28], desc: '狐妖地底巢穴，巨人奴役出没。', monsters: ['狐狸强弩手', '狐狸斥候', '巨人战士'], elite: ['巨人战士'] },
    { id: 'manjurengu', name: '蛮巨人谷', type: 'field', region: '凡界', ch: 5, city: 'yanyud', lvMin: 46, lvMax: 60, unlock: 46, pos: [63, 26], desc: '蛮族巨人盘踞的深谷。', monsters: ['巨人战士', '巨人投掷手', '巨人法师', '板斧蛮兵', '冰羌族勇士'], elite: ['巨人法师'] },
    { id: 'shibapan',   name: '十八盘',   type: 'field', region: '凡界', ch: 5, city: 'yanyud', lvMin: 46, lvMax: 58, unlock: 46, pos: [60, 31], desc: '层叠盘道的峡谷险径。', monsters: ['巨人战士', '巨人投掷手', '斧头蛮子', '草叉蛮子'], elite: ['巨人投掷手'] },
    { id: 'jiangyangud',name: '江烟古渡', type: 'field', region: '凡界', ch: 5, city: 'yanyud', lvMin: 57, lvMax: 60, unlock: 50, pos: [66, 21], desc: '大江之畔的古渡口，蟾精作祟。', monsters: ['恶水傀儡', '蟾精'], elite: ['蟾精'] },

    /* ===== 玄都观（章6 · 60-69） ===== */
    { id: 'lingshidao', name: '灵石岛',   type: 'field', region: '凡界', ch: 6, city: 'xuandug', lvMin: 60, lvMax: 65, unlock: 55, pos: [61, 20], desc: '灵气凝晶的江心岛。', monsters: ['火把小妖', '长棍小妖', '火弹小妖', '雌虎鲛'], elite: ['雌虎鲛'] },
    { id: 'yanhuodao',  name: '厌火岛',   type: 'field', region: '凡界', ch: 6, city: 'xuandug', lvMin: 61, lvMax: 66, unlock: 56, pos: [66, 16], desc: '烈焰吞吐的凶险岛礁。', monsters: ['火把小校', '长棍小校', '嗜火小妖头目', '火弹小妖细作'], elite: ['嗜火小妖头目'] },
    { id: 'luoxingwan', name: '落星湾',   type: 'field', region: '凡界', ch: 6, city: 'xuandug', lvMin: 60, lvMax: 65, unlock: 55, pos: [58, 22], desc: '流星坠落的港湾，虎族称雄。', monsters: ['火把小妖', '雌虎鲛', '虎王卫队'], elite: ['虎王卫队'] },
    { id: 'pingazhen',  name: '平阿镇',   type: 'field', region: '凡界', ch: 6, city: 'xuandug', lvMin: 60, lvMax: 65, unlock: 55, pos: [64, 23], desc: '被倭猴劫掠的平地小镇。', monsters: ['倭猴', '木锨倭猴', '马勺倭猴', '单刀倭猴'], elite: ['单刀倭猴'] },
    { id: 'shangyangyuan', name: '殇阳原', type: 'field', region: '凡界', ch: 6, city: 'xuandug', lvMin: 60, lvMax: 65, unlock: 55, pos: [69, 25], desc: '古战场殇阳之原，幽魂不散。', monsters: ['倭猴', '幽魂', '倭猴头目', '倭猴药师'], elite: ['倭猴头目'] },
    { id: 'tengwang1',  name: '滕王墓·上', type: 'cave', region: '凡界', ch: 6, city: 'xuandug', lvMin: 63, lvMax: 67, unlock: 57, pos: [62, 27], desc: '滕王陵寝上层。', monsters: ['绿毛怪', '幽魂'], elite: ['幽魂'], boss: ['绿毛怪'] },
    { id: 'tengwang2',  name: '滕王墓·下', type: 'cave', region: '凡界', ch: 6, city: 'xuandug', lvMin: 63, lvMax: 67, unlock: 58, pos: [66, 30], desc: '滕王陵寝下层。', monsters: ['绿毛怪', '幽魂'], elite: ['绿毛怪'] },
    { id: 'doumotai',   name: '斗魔台',   type: 'field', region: '凡界', ch: 6, city: 'xuandug', lvMin: 64, lvMax: 64, unlock: 58, pos: [71, 20], desc: '妖猴斗法的擂台绝地。', monsters: ['铁镐倭猴', '斧头倭猴', '倭猴头目', '单刀倭猴'], elite: ['倭猴头目'] },
    { id: 'manggu',     name: '蛮古山脉', type: 'field', region: '凡界', ch: 6, city: 'xuandug', lvMin: 66, lvMax: 68, unlock: 58, pos: [75, 18], desc: '蛮古山脊，飞猴御雷。', monsters: ['长槊飞猴', '幡旗飞猴', '招雷飞猴'], elite: ['招雷飞猴'] },
    { id: 'dinghushan', name: '鼎湖山',   type: 'field', region: '凡界', ch: 6, city: 'xuandug', lvMin: 66, lvMax: 69, unlock: 59, pos: [70, 13], desc: '鼎湖山巅，魔猿啸聚。', monsters: ['大棒魔猿', '双锤魔猿', '魔猿头目'], elite: ['魔猿头目'] },

    /* ===== 幽冥渡（章7 · 70-83 · 冥界） ===== */
    { id: 'mengpodu',   name: '孟婆渡',   type: 'ghost', region: '冥界', ch: 7, city: 'youmingdu', lvMin: 71, lvMax: 73, unlock: 70, pos: [72, 23], desc: '忘川之畔，地府兵卒把守的渡口。', monsters: ['钢叉地府兵卒', '锤盾地府兵卒', '地府断魂兽'], elite: ['地府断魂兽'] },
    { id: 'naiheqiao',  name: '奈何桥',   type: 'ghost', region: '冥界', ch: 7, city: 'youmingdu', lvMin: 71, lvMax: 75, unlock: 70, pos: [76, 26], desc: '奈何桥上，地狱树盘根错节。', monsters: ['钢叉地府兵卒', '铁链妖', '冥府小厮', '地狱树'], elite: ['地狱树'] },
    { id: 'youminggumu',name: '幽冥古墓', type: 'cave', region: '冥界', ch: 7, city: 'youmingdu', lvMin: 71, lvMax: 76, unlock: 70, pos: [78, 30], desc: '冥府古墓，亡魂与兵卒杂处。', monsters: ['钢叉地府兵卒', '锤盾地府兵卒', '铁链妖', '冥府小厮', '地府断魂兽'], elite: ['冥府小厮'] },
    { id: 'huangquanlu',name: '黄泉路',   type: 'ghost', region: '冥界', ch: 7, city: 'youmingdu', lvMin: 73, lvMax: 76, unlock: 71, pos: [70, 28], desc: '黄泉幽径，铁链妖与断魂拦路。', monsters: ['铁链妖', '冥府小厮'], elite: ['铁链妖'], boss: ['地狱断魂'] },
    { id: 'yunmeng',    name: '云梦大泽', type: 'field', region: '冥界', ch: 7, city: 'youmingdu', lvMin: 73, lvMax: 83, unlock: 72, pos: [82, 34], desc: '冥泽万顷，罗刹与鳄鱼精潜藏。', monsters: ['钢叉罗刹', '锤盾罗刹', '大刀鳄鱼精', '蜥蜴精刀兵', '弓箭蜥蜴精'], elite: ['锤盾罗刹'], boss: ['大刀鳄鱼精'] },
    { id: 'heiyishan',  name: '黑翼山',   type: 'ghost', region: '冥界', ch: 7, city: 'youmingdu', lvMin: 77, lvMax: 79, unlock: 74, pos: [74, 32], desc: '黑翼蝙蝠蔽日的冥山。', monsters: ['钢叉罗刹', '牛首阿旁', '马面阿旁', '冥府亡魂'], elite: ['牛首阿旁'], boss: ['暗翼蝙蝠'] },
    { id: 'wangxiangtai',name: '望乡台',  type: 'ghost', region: '冥界', ch: 7, city: 'youmingdu', lvMin: 77, lvMax: 79, unlock: 74, pos: [80, 28], desc: '亡魂回望故乡的高台。', monsters: ['钢叉罗刹', '牛首阿旁', '冥府亡魂', '冥府弓箭兵'], elite: ['牛首阿旁'] },

    /* ===== 蚩尤冢（章8 · 75-95） ===== */
    { id: 'donghai',    name: '东海',     type: 'field', region: '北荒', ch: 8, city: 'chiyouzhong', lvMin: 75, lvMax: 82, unlock: 75, pos: [61, 32], desc: '东海水畔，穿山甲监工凿山。', monsters: ['穿山甲', '民兵亡魂', '穿山甲监工'], elite: ['穿山甲监工'] },
    { id: 'laoshan',    name: '崂山',     type: 'field', region: '北荒', ch: 8, city: 'chiyouzhong', lvMin: 75, lvMax: 85, unlock: 75, pos: [56, 30], desc: '崂山幽处，贪心魂魄游荡。', monsters: ['高级穿山甲', '贪心魂魄', '穿山甲苦力'], elite: ['贪心魂魄'] },
    { id: 'qianzhong',  name: '黔中古墟', type: 'field', region: '北荒', ch: 8, city: 'chiyouzhong', lvMin: 82, lvMax: 86, unlock: 78, pos: [66, 37], desc: '黔中上古废墟，毒蜂巨兽横行。', monsters: ['巨型毒蜂', '嗜血红魔', '双斧青牛妖', '象怪首领'], elite: ['象怪首领'] },
    { id: 'taoyuan',    name: '桃源浣溪', type: 'field', region: '北荒', ch: 8, city: 'chiyouzhong', lvMin: 83, lvMax: 87, unlock: 79, pos: [52, 36], desc: '世外桃源，桃树精与蜂妖守护。', monsters: ['巨型毒蜂', '桃树精', '双斧青牛妖', '蜂妖头领'], elite: ['桃树精'] },
    { id: 'yanmofeixu', name: '炎魔废墟', type: 'field', region: '北荒', ch: 8, city: 'chiyouzhong', lvMin: 85, lvMax: 88, unlock: 80, pos: [70, 40], desc: '炎魔肆虐过后的焦土废墟。', monsters: ['炎魔蛤蟆', '炎魔鳄鱼', '烈焰淤泥怪'], elite: ['炎魔鳄鱼'] },
    { id: 'fentiangu',  name: '焚天谷',   type: 'cave', region: '北荒', ch: 8, city: 'chiyouzhong', lvMin: 89, lvMax: 92, unlock: 82, pos: [74, 44], desc: '烈火焚谷，火焰守卫镇守。', monsters: ['大锤火焰守卫', '大刀火焰守卫'], elite: ['大刀火焰守卫'], boss: ['火焰守卫'] },
    { id: 'shuiyonggu', name: '水涌谷',   type: 'cave', region: '北荒', ch: 8, city: 'chiyouzhong', lvMin: 90, lvMax: 94, unlock: 84, pos: [78, 47], desc: '水泉奔涌的幽谷，虾蟹成群。', monsters: ['血钳虾精', '蓝螯蟹妖'], elite: ['蓝螯蟹妖'], boss: ['碧鳞鱼怪'] },
    { id: 'yuelixia',   name: '月离峡',   type: 'cave', region: '北荒', ch: 8, city: 'chiyouzhong', lvMin: 90, lvMax: 94, unlock: 84, pos: [58, 43], desc: '月光不达的寒峡，紫蟹栖居。', monsters: ['绣须虾精', '紫壳蟹妖'], elite: ['紫壳蟹妖'], boss: ['苍蓝鱼怪'] },
    { id: 'hujuguan',   name: '虎踞关',   type: 'field', region: '北荒', ch: 8, city: 'chiyouzhong', lvMin: 90, lvMax: 95, unlock: 85, pos: [68, 36], desc: '虎妖扼守的雄关要道。', monsters: ['长枪虎兵', '短矛虎兵', '刀盾虎妖'], elite: ['刀盾虎妖'] },

    /* ===== 洪荒剑冢（章9 · 95-99 · 终局） ===== */
    { id: 'honghuangguxu', name: '洪荒古墟', type: 'cave', region: '洪荒', ch: 9, city: 'honghuangjianzhong', lvMin: 95, lvMax: 99, unlock: 95, pos: [80, 42], desc: '东海海底终局葬剑之所，剑祖残念盘踞。', monsters: ['洪荒残兽', '上古魔灵'], elite: ['上古魔灵'], boss: ['剑祖残念'] },

    /* ===== 凌霄境（章10 · 108+ · 仙界） ===== */
    { id: 'lingxiaoxianjie', name: '凌霄仙阶', type: 'field', region: '仙界', ch: 10, city: 'lingxiaojing', lvMin: 108, lvMax: 120, unlock: 108, pos: [88, 15], desc: '天庭凌霄仙阶，天兵仙将列守。', monsters: ['天兵', '魔族余孽'], elite: ['仙将'] }
  ];

  /* ============================================================
   * MONSTERS 生成
   * 依据 AREA_SPECS：每个场景的 monsters 名 + elite/boss 名单，
   * 按场景等级区间生成具体怪物对象。命名全部来自策划表，禁止自造。
   * ------------------------------------------------------------
   * 数值公式（P0 简化，便于冒烟平衡）：
   *   grunt hp = max(20, 25 + lv*46)     atk = max(3, 3+lv*2.6)  def = max(2, 2+lv*1.2)
   *   elite  hp×4 / atk×1.6 / def×1.35 / 体型"大"
   *   boss   hp×11 / atk×2.2 / def×1.7 / 体型"巨大"
   * ============================================================ */
  var MONSTERS = [];
  var _mseed = 0;      // 怪物 id 序（结果 m1001..）
  function _mstat(lv, type) {
    var hp = Math.max(20, Math.floor(25 + lv * 46));
    var atk = Math.max(3, Math.floor(3 + lv * 2.6));
    var def = Math.max(2, Math.floor(2 + lv * 1.2));
    if (type === 'elite') { hp *= 4; atk = Math.floor(atk * 1.6); def = Math.floor(def * 1.35); }
    if (type === 'boss')  { hp *= 11; atk = Math.floor(atk * 2.2); def = Math.floor(def * 1.7); }
    return { hp: hp, atk: atk, def: def };
  }
  function _addM(sc, lv, name, type) {
    var s = _mstat(lv, type);
    var size = (type === 'boss') ? '巨大' : ((type === 'elite') ? '大' : ((_mseed % 2) ? '小' : '中'));
    var mult = (type === 'boss') ? 20 : ((type === 'elite') ? 5 : 1);
    _mseed += 1;
    var m = {
      id: 'm' + (1000 + _mseed),
      name: name, lv: lv, ch: sc.ch, type: type,
      hp: s.hp, atk: s.atk, def: s.def, size: size,
      expR: Math.floor(s.hp * 0.05 * mult),
      goldR: Math.floor(s.hp * 0.06 * mult),
      isBoss: (type === 'boss'), isElite: (type === 'elite')
    };
    MONSTERS.push(m);
    sc._m.push(m.id);
  }

  /* 遍历 AREA_SPECS：为每个场景生成怪物对象并记录到 sc._m */
  AREA_SPECS.forEach(function (sc) {
    sc._m = [];
    if (!sc.monsters || !sc.monsters.length) return;
    var midLv = Math.floor((sc.lvMin + sc.lvMax) / 2);
    // 普通怪：策划 monsters 中不在 elite/boss 名单者，取等级区间中位
    sc.monsters.forEach(function (name) {
      if (sc.elite && sc.elite.indexOf(name) !== -1) return;
      if (sc.boss && sc.boss.indexOf(name) !== -1) return;
      _addM(sc, midLv, name, 'grunt');
    });
    // 精英怪：等级取 lvMax-1
    (sc.elite || []).forEach(function (name) {
      _addM(sc, Math.max(1, sc.lvMax - 1), name, 'elite');
    });
    // Boss：等级取 lvMax
    (sc.boss || []).forEach(function (name) {
      _addM(sc, sc.lvMax, name, 'boss');
    });
  });

  /* ============================================================
   * 关卡进度表（前 3 章 · P0 兼容保留）
   * 旧 m101.. 引用已由世界怪物表取代，但 state 用 find 查找不抛错，
   * 故保留本表以兼容已有存档与章节跳转逻辑。
   * ============================================================ */
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
    version: 2,
    autoSaveSec: 30
  };

  /* ============================================================
   * MAPAREAS 生成（B 方案 · 三界大世界总览）
   * 以 AREA_SPECS 为唯一数据源，自动组合每个场景的邻接关系：
   *   - 主城：用 _TOWN_LINKS 主城链生成双向传送门，9 主城串成一线
   *   - 野外/洞穴/魂境：exits 连回所属主城（保证 BFS 全连通）
   * pos: [x,y] 世界总览图标点坐标（0-100 相对，供 UI 标点）
   * ---
   * （说明）type 取值：
   *   town  城镇安全区（无战斗） / field 野外 / cave 洞穴 / ghost 魂境
   * ============================================================ */
  var _TOWN_LINKS = [
    ['qingshi', 'luoxiacheng'],
    ['luoxiacheng', 'hanyuguan'],
    ['hanyuguan', 'yanyud'],
    ['yanyud', 'xuandug'],
    ['xuandug', 'youmingdu'],
    ['youmingdu', 'chiyouzhong'],
    ['chiyouzhong', 'honghuangjianzhong'],
    ['honghuangjianzhong', 'lingxiaojing']
  ];
  var _CITYNAME = {
    qingshi: '青石镇', luoxiacheng: '落霞城', hanyuguan: '寒玉关',
    yanyud: '烟雨渡', xuandug: '玄都观', youmingdu: '幽冥渡',
    chiyouzhong: '蚩尤冢', honghuangjianzhong: '洪荒剑冢', lingxiaojing: '凌霄境'
  };
  /* 每个主城所辖的野外/洞穴/魂境（保证主城能通往所属场景，实现全连通） */
  var _AREA_NAME = {};
  AREA_SPECS.forEach(function (a) { _AREA_NAME[a.id] = a.name; });
  var _cityKids = {};
  AREA_SPECS.forEach(function (a) {
    if (a.type !== 'town') {
      if (!_cityKids[a.city]) _cityKids[a.city] = [];
      _cityKids[a.city].push(a.id);
    }
  });

  var MAPAREAS = AREA_SPECS.map(function (a) {
    var area = {
      id: a.id, name: a.name, type: a.type, region: a.region,
      chapter: a.ch, city: a.city,
      lvMin: a.lvMin, lvMax: a.lvMax, unlockLv: a.unlock,
      desc: a.desc, pos: a.pos,
      monsters: (a._m || []).slice(),
      spawnRate: (a.type === 'town') ? 0 : 0.22,
      exploreGoal: (a.type === 'town') ? 0 : (a._m || []).length,
      boss: (a.boss || []).slice()
    };
    // exits
    if (a.type === 'town') {
      area.exits = [];
      _TOWN_LINKS.forEach(function (link) {
        var i = link.indexOf(a.id);
        if (i !== -1) {
          var to = link[1 - i];
          area.exits.push({ id: 'to_' + to, label: '传送·' + _CITYNAME[to], to: to });
        }
      });
      (_cityKids[a.id] || []).forEach(function (kid) {
        area.exits.push({ id: 'to_' + kid, label: '往·' + _AREA_NAME[kid], to: kid });
      });
    } else {
      area.exits = [{ id: 'to_' + a.city, label: '返回·' + _CITYNAME[a.city], to: a.city }];
    }
    return area;
  });

  /* ---- 导出 ---- */
  return {
    EXP: EXP,
    PROFESSIONS: PROFESSIONS,
    SKILLS: SKILLS,
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
    SAVE: SAVE,
    AFFIX_TIER: AFFIX_TIER,
    AFFIX_POOL: AFFIX_POOL,
    AFFIX_STAT_LABEL: AFFIX_STAT_LABEL,
    REFINE: REFINE,
    AREA_SPECS: AREA_SPECS,
    MAPAREAS: MAPAREAS
  };
})();