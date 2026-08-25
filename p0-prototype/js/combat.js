/* ============================================================
 *  洪荒剑仙 P0 - 战斗结算引擎
 *  AP²÷(AP+DP/1.5) × 体型修正，会心判定，自动战斗
 * ============================================================ */

var Combat = (function () {

  var log = [];

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

  /* ---- 执行一轮战斗 ----
   * 玩家攻击怪物，怪物攻击玩家
   * 返回 {
   *   playerDmg, playerCrit, monsterDmg, monsterCrit,
   *   reflectDmg, playerDead, monsterDead
   * }
   */
  function executeRound() {
    var s = State.get();
    if (!s.player.professionId || !s.currentStage) return null;

    var derived = State.getDerived();
    if (!derived) return null;

    // 选怪：从当前关卡随机选一只未死的怪
    var monsters = State.getStageMonsters();
    if (!monsters || monsters.length === 0) return null;

    // P0 简化：每次从关卡怪物池随机选一只
    var mIdx = Math.floor(rng() * monsters.length);
    var monster = monsters[mIdx];

    // 怪物体型修正
    var sizeMod = CONFIG.COMBAT.sizeMod[monster.size] || 1.0;

    var result = {
      monsterName: monster.name,
      playerDmg: 0, playerCrit: false,
      monsterDmg: 0, monsterCrit: false,
      reflectDmg: 0,
      playerDead: false, monsterDead: false,
      expGained: 0, goldGained: 0, drop: null
    };

    // 玩家攻击怪物
    var pAtk = calcAttack(derived.atk, monster.def, derived.critRate, derived.critDmg, sizeMod, 0);
    result.playerDmg = pAtk.dmg;
    result.playerCrit = pAtk.isCrit;

    // 怪物 HP（P0 简化：每只怪独立 HP，每次遭遇满血）
    var mHp = monster.hp;
    var mDead = pAtk.dmg >= mHp;

    if (mDead) {
      result.monsterDead = true;
      // 击杀奖励
      result.expGained = monster.expR;
      result.goldGained = monster.goldR;
      // 记录击杀
      State.recordKill(monster);
      // 掉落判定
      result.drop = Drops.tryDrop(monster);
      // 宝石掉落
      result.gemDrop = Drops.tryDropGem(monster);
      // 加经验/铜钱
      State.addExp(result.expGained);
      State.addGold(result.goldGained);
    } else {
      // 怪物反击
      var mAtk = calcAttack(monster.atk, derived.def, 0, 1.0, 1.0, derived.dmgReduce);
      result.monsterDmg = mAtk.dmg;

      // 体修反伤
      if (derived.reflect > 0) {
        result.reflectDmg = calcReflect(mAtk.dmg, derived.reflect, monster.def);
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
    var logText = result.monsterDead
      ? (result.playerCrit ? '暴击' : '击杀') + ' ' + monster.name + '，获得 ' + result.expGained + ' 经验'
      : '对 ' + monster.name + ' 造成 ' + pAtk.dmg + (pAtk.isCrit ? '（暴击）' : '') + ' 伤害，受击 ' + mAtk.dmg + (result.reflectDmg ? '，反伤 ' + result.reflectDmg : '');
    if (result.monsterDead && result.gemDrop) {
      logText += '，拾得『' + result.gemDrop.name + '』';
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
