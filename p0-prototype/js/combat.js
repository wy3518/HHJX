/* ============================================================
 *  洪荒剑仙 P0 - 战斗结算引擎
 *  AP²÷(AP+DP/1.5) × 体型修正，会心判定，自动战斗
 * ============================================================ */

var Combat = (function () {

  var log = [];

  // 当前战斗锁定目标 { monster, hp(剩余) }：挂机时持续对同一只怪累计扣血，击杀后才换下一只
  var currentTarget = null;
  // 当前技能连招指针：按出身技能表顺序循环释放（P2 技能连招）
  var skillIndex = 0;

  /* ---- 可播种随机数 ---- */
  var seed = Date.now();
  function rng() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  }

  /* ---- 单次攻击结算 ----
   * atk: 攻击方攻击力
   * def: 防御方防御力
   * critRate: 会心率
   * critDmg: 会心伤害
   * sizeMod: 体型修正（攻击方对防御方）
   * dmgReduce: 伤害减免（如体修 15%）
   * 返回 {dmg, isCrit}
   */
  function calcAttack(atk, def, critRate, critDmg, sizeMod, dmgReduce) {
    if (atk <= 0) return { dmg: 0, isCrit: false };
    sizeMod = sizeMod || 1.0;
    dmgReduce = dmgReduce || 0;

    // 基础物理伤害 = AP² ÷ (AP + DP/1.5) × 体型修正
    var base = CONFIG.COMBAT.physDmg(atk, def, sizeMod);

    // 会心判定
    var isCrit = rng() < critRate;
    if (isCrit) base = Math.floor(base * critDmg);

    // 伤害减免
    base = Math.floor(base * (1 - dmgReduce));

    return { dmg: Math.max(1, base), isCrit: isCrit };
  }

  /* ---- 反伤计算 ---- */
  function calcReflect(dmgTaken, reflectRate, attackerDef) {
    if (reflectRate <= 0) return 0;
    // 反伤 = 攻击方AP × 反伤比例（无视防御）
    return Math.floor(dmgTaken * reflectRate);
  }

  /* ---- 技能结算（P2 技能连招） ----
   * 按技能 type 分类结算，副作用写入 currentTarget.dot / s.player。
   * 返回 { dmg, isCrit, heal?, dotName?, reflectBonus? }
   */
  function resolveSkill(skill, derived, monster, sizeMod) {
    var s = State.get();
    if (s.player.hp === undefined) s.player.hp = derived.maxHp;

    // 剑修被动 skillMod 放大技能伤害
    var prof = CONFIG.PROFESSIONS.find(function (x) { return x.id === s.player.professionId; });
    var skillMod = (prof && prof.passive && prof.passive.skillMod) ? (1 + prof.passive.skillMod) : 1;
    // 技能威力（词条）进一步放大技能伤害
    var spMod = 1 + ((derived.skillPower || 0) / 100);
    var baseAtk = derived.atk * skill.power * skillMod * spMod;

    var def = monster.def;
    var critRate = Math.min(derived.critRate + (skill.critBonus || 0), 0.8);
    var critDmg = derived.critDmg;
    var dmgReduce = derived.dmgReduce;

    // 命中计算（复用基础伤害公式，指定会心）
    function hit() {
      return calcAttack(baseAtk, def, critRate, critDmg, sizeMod, dmgReduce);
    }

    // 多段连击：每段独立会心判定
    if (skill.type === 'multi') {
      var total = 0, anyCrit = false, cuts = skill.cuts || 2;
      for (var i = 0; i < cuts; i++) {
        var a = hit();
        total += a.dmg;
        if (a.isCrit) anyCrit = true;
      }
      return { dmg: total, isCrit: anyCrit };
    }

    // 破防：无视目标部分防御
    if (skill.type === 'armorBreak') {
      def = Math.max(0, def * (1 - (skill.armor || 0)));
      var b = hit();
      return { dmg: b.dmg, isCrit: b.isCrit };
    }

    // 吸血：造成伤害并按比例回血
    if (skill.type === 'leech') {
      var c = hit();
      var healAmt = Math.floor(c.dmg * (skill.leech || 0));
      s.player.hp = Math.min(s.player.hp + healAmt, derived.maxHp);
      return { dmg: c.dmg, isCrit: c.isCrit, heal: healAmt };
    }

    // 自愈：回复上限HP比例，可选附带持续灼烧
    if (skill.type === 'heal') {
      var healAmt = Math.floor(derived.maxHp * (skill.heal || 0));
      s.player.hp = Math.min(s.player.hp + healAmt, derived.maxHp);
      if (skill.dotPerTurn) {
        currentTarget.dot = {
          name: skill.name,
          perTurn: Math.max(1, Math.floor(derived.atk * skill.dotPerTurn)),
          turns: skill.dotTurns || 3
        };
      }
      var d = hit();
      return { dmg: d.dmg, isCrit: d.isCrit, heal: healAmt, dotName: skill.dotPerTurn ? skill.name : null };
    }

    // 重击+临时反伤
    if (skill.type === 'reflect') {
      var j = hit();
      return { dmg: j.dmg, isCrit: j.isCrit, reflectBonus: skill.reflectBonus || 0 };
    }

    // 持续灼烧：给当前目标挂毒，每回合跳伤
    if (skill.type === 'dot') {
      currentTarget.dot = {
        name: skill.name,
        perTurn: Math.max(1, Math.floor(derived.atk * skill.dotPerTurn)),
        turns: skill.dotTurns || 3
      };
      var e = hit();
      return { dmg: e.dmg, isCrit: e.isCrit, dotName: skill.name };
    }

    // 默认单体爆发（含 critBonus）
    var f = hit();
    return { dmg: f.dmg, isCrit: f.isCrit };
  }

  /* ---- 执行一轮战斗 ----
   * 玩家攻击怪物，怪物攻击玩家
   * 返回 {
   *   playerDmg, playerCrit, monsterDmg, monsterCrit,
   *   reflectDmg, playerDead, monsterDead
   * }
   */
  function executeRound() {
    var s = State.get();
    if (!s.player.professionId || !s.map.areaId) return null;

    var derived = State.getDerived();
    if (!derived) return null;

    // 锁定目标：没有当前目标（或上一只已击杀）时，从当前区域怪物池锁一只满血怪
    var allMonsters = State.getMapMonsters();
    if (!allMonsters || allMonsters.length === 0) {
      // 城镇安全区无怪，仅结算回血，不产生战斗
      return null;
    }

    // 分离 Boss 与普通怪：Boss 仅在特定条件下触发遭遇
    var bossMobs = allMonsters.filter(function (m) { return m.isBoss; });
    var regMobs = allMonsters.filter(function (m) { return !m.isBoss; });
    var area = State.getCurrentArea();
    var exp = s.map.explored[s.map.areaId] || { kills: 0 };
    var killCount = exp.kills || 0;

    if (!currentTarget || !currentTarget.monster) {
      var monster;
      // Boss 遭遇条件：该区域有 Boss，且每 15 次击杀后有 35% 概率遭遇 Boss
      if (bossMobs.length > 0 && killCount > 0 && killCount % 15 === 0 && rng() < 0.35) {
        var bIdx = Math.floor(rng() * bossMobs.length);
        monster = bossMobs[bIdx];
        currentTarget = { monster: monster, hp: monster.hp, isBoss: true, enrage: false };
      } else if (regMobs.length > 0) {
        var mIdx = Math.floor(rng() * regMobs.length);
        monster = regMobs[mIdx];
        currentTarget = { monster: monster, hp: monster.hp, isBoss: false };
      } else {
        // 只有 Boss 没有普通怪（极端情况）：直接遭遇 Boss
        monster = bossMobs[0];
        currentTarget = { monster: monster, hp: monster.hp, isBoss: true, enrage: false };
      }
    }
    var monster = currentTarget.monster;

    // 怪物体型修正
    var sizeMod = CONFIG.COMBAT.sizeMod[monster.size] || 1.0;

    var result = {
      monsterName: monster.name,
      playerDmg: 0, playerCrit: false,
      monsterDmg: 0, monsterCrit: false,
      reflectDmg: 0,
      playerDead: false, monsterDead: false,
      isBossKill: false,
      expGained: 0, goldGained: 0, drop: null
    };

    // === 灵力(MP)：每回合自然恢复 ===
    if (s.player.mp === undefined) s.player.mp = derived.maxMp;
    if (s.player.hp === undefined) s.player.hp = derived.maxHp;
    var mpRegen = Math.floor(derived.maxMp * 0.04) + 2;
    s.player.mp = Math.min(s.player.mp + mpRegen, derived.maxMp);

    // === 目标身上的持续灼烧：每回合跳伤 ===
    var dotDmg = 0;
    if (currentTarget.dot && currentTarget.dot.turns > 0) {
      dotDmg = currentTarget.dot.perTurn;
      currentTarget.hp -= dotDmg;
      currentTarget.dot.turns--;
      if (currentTarget.dot.turns <= 0) currentTarget.dot = null;
    }

    // === 技能连招 / 平砍：灵力足够则按连招序列循环释放 ===
    var skillSeq = CONFIG.SKILLS[s.player.professionId] || [];
    var pAtk, skillName = null;
    if (skillSeq.length > 0 && s.player.mp >= skillSeq[skillIndex].mp) {
      var skillUsed = skillSeq[skillIndex];
      skillIndex = (skillIndex + 1) % skillSeq.length;   // 连招推进
      pAtk = resolveSkill(skillUsed, derived, monster, sizeMod);
      skillName = skillUsed.name;
      s.player.mp -= skillUsed.mp;
      if (pAtk.reflectBonus) result.reflectBonus = pAtk.reflectBonus;
    } else {
      pAtk = calcAttack(derived.atk, monster.def, derived.critRate, derived.critDmg, sizeMod, 0);
    }
    result.playerDmg = dotDmg + pAtk.dmg;
    result.playerCrit = pAtk.isCrit;
    result.playerHeal = pAtk.heal || 0;
    // 通用吸血（词条）：未走技能吸血时，按吸血%回血
    if (!(pAtk.heal) && derived.leech > 0 && currentTarget.hp > 0) {
      var leechHeal = Math.floor(pAtk.dmg * (derived.leech / 100));
      if (leechHeal > 0) {
        s.player.hp = Math.min(s.player.hp + leechHeal, derived.maxHp);
        result.playerHeal = (result.playerHeal || 0) + leechHeal;
      }
    }
    result.skillName = skillName;
    result.dotName = pAtk.dotName || null;
    currentTarget.hp -= pAtk.dmg;

    // 目标生命耗尽 → 判定击杀
    var mDead = currentTarget.hp <= 0;

    if (mDead) {
      result.monsterDead = true;
      result.isBossKill = !!(currentTarget && currentTarget.isBoss);
      currentTarget = null; // 击杀后清除目标，下一轮锁定新怪
      // 击杀奖励：Boss 额外 ×3 经验 ×2 铜钱
      var expMult = result.isBossKill ? 3 : 1;
      var goldMult = result.isBossKill ? 2 : 1;
      result.expGained = Math.floor(monster.expR * expMult);
      result.goldGained = Math.floor(monster.goldR * goldMult);
      // 记录击杀
      State.recordKill(monster);
      // 掉落判定
      result.drop = Drops.tryDrop(monster);
      // 宝石掉落
      result.gemDrop = Drops.tryDropGem(monster);
      // 洗练石掉落
      result.stoneDrop = Drops.tryDropStone(monster);
      // 加经验/铜钱
      State.addExp(result.expGained);
      State.addGold(result.goldGained);
    } else {
      // Boss 狂暴：HP 低于 50% 时攻击力 ×1.5（仅触发一次）
      if (currentTarget.isBoss && !currentTarget.enrage && currentTarget.hp <= monster.hp * 0.5) {
        currentTarget.enrage = true;
        Combat.getLog().unshift({ time: Date.now(), text: '⚠ 『' + monster.name + '』进入狂暴状态！' });
      }
      var bossAtkMod = (currentTarget.isBoss && currentTarget.enrage) ? 1.5 : 1.0;
      // 怪物反击
      var mAtk = calcAttack(Math.floor(monster.atk * bossAtkMod), derived.def, 0, 1.0, 1.0, derived.dmgReduce);
      result.monsterDmg = mAtk.dmg;

      // 体修反伤（技能可临时提升本次反伤）
      if (derived.reflect > 0) {
        var reflRate = derived.reflect + (result.reflectBonus || 0);
        result.reflectDmg = calcReflect(mAtk.dmg, reflRate, monster.def);
      }

      // 玩家扣血（P0 简化：玩家 HP 在 state 中追踪）
      if (!s.player.hp) s.player.hp = derived.maxHp;
      s.player.hp -= mAtk.dmg;
      if (s.player.hp <= 0) {
        result.playerDead = true;
        s.player.hp = derived.maxHp; // P0 不真正死亡，自动满血复活
      }
    }

    // 写日志
    var skillTxt = result.skillName ? '【' + result.skillName + '】' : '';
    var bossTag = (currentTarget && currentTarget.isBoss) ? '[BOSS] ' : '';
    var logText = result.monsterDead
      ? skillTxt + (result.isBossKill ? '⚔ 击杀 BOSS 『' + monster.name + '』！获得 ' : (result.playerCrit ? '暴击' : '击杀') + ' ' + monster.name + '，获得 ') + result.expGained + ' 经验'
      : skillTxt + '对 ' + bossTag + monster.name + ' 造成 ' + pAtk.dmg + (pAtk.isCrit ? '（暴击）' : '') + ' 伤害'
          + (result.playerHeal ? '，疗伤 ' + result.playerHeal : '')
          + (result.dotName ? '，施放『' + result.dotName + '』' : '')
          + '，受击 ' + mAtk.dmg + (result.reflectDmg ? '，反伤 ' + result.reflectDmg : '');
    if (result.monsterDead && result.gemDrop) {
      logText += '，拾得『' + result.gemDrop.name + '』';
    }
    if (result.monsterDead && result.stoneDrop) {
      logText += '，拾得『洗练石』';
    }
    var entry = {
      time: Date.now(),
      text: logText
    };
    log.unshift(entry);
    if (log.length > 50) log.pop();

    Bus.emit('combatRound', result);
    return result;
  }

  /* ---- 获取日志 ---- */
  function getLog() { return log; }

  /* ---- 清空日志 ---- */
  function clearLog() { log = []; }

  return {
    rng: rng,
    calcAttack: calcAttack,
    executeRound: executeRound,
    getLog: getLog,
    clearLog: clearLog
  };
})();
