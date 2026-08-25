/* ============================================================
 *  洪荒剑仙 P0 - 2D 场景视图
 *  点击大地图标点 -> 弹出详情卡 -> 进入场景
 *  场景内人物自动跑动、攻击怪物、怪物刷新
 *  纯视觉层：实际战斗数值仍由 Combat.executeRound() 结算
 * ============================================================ */

var Scene = (function () {

  var active = false;       // 场景视图是否激活
  var areaId = null;        // 当前场景区域 id
  var monsters = [];        // 怪物精灵列表 {id,name,x,y,hp,maxHp,type,alive,el}
  var player = { x: 50, y: 50, el: null, target: null, attacking: false };
  var sceneTimer = null;    // 场景刷新定时器 (200ms)
  var monsterIdSeq = 0;
  var waveCount = 0;
  var killCount = 0;

  /* ============ 详情卡弹窗 ============ */
  function showDetail(id) {
    var s = State.get();
    var a = WorldMap.getArea(id);
    if (!a) return;

    var el = document.getElementById('area-detail');
    document.getElementById('ad-name').textContent = a.name;
    document.getElementById('ad-type').textContent = areaTypeTxt(a) + ' · ' + a.region;
    document.getElementById('ad-type').className = 'ad-type ' + a.type;

    var info = 'Lv' + a.lvMin + '-' + a.lvMax;
    if (a.unlockLv && s.player.level < a.unlockLv) info += ' · 🔒 需 Lv.' + a.unlockLv;
    info += '<br>' + a.desc;

    var prog = WorldMap.getExploreProgress(id);
    if (a.type !== 'town') info += '<br>探索度 ' + Math.floor(prog * 100) + '%';

    document.getElementById('ad-info').innerHTML = info;

    // 怪物列表
    var mhtml = '';
    if (a.monsters && a.monsters.length) {
      mhtml = '<div class="ad-section">怪物：</div><div class="ad-mlist">';
      a.monsters.forEach(function (m) {
        mhtml += '<span class="ad-mtag">' + m + '</span>';
      });
      mhtml += '</div>';
      if (a.elite && a.elite.length) {
        mhtml += '<div class="ad-section">精英：</div><div class="ad-mlist">';
        a.elite.forEach(function (m) { mhtml += '<span class="ad-mtag elite">' + m + '</span>'; });
        mhtml += '</div>';
      }
      if (a.boss && a.boss.length) {
        mhtml += '<div class="ad-section">BOSS：</div><div class="ad-mlist">';
        a.boss.forEach(function (m) { mhtml += '<span class="ad-mtag boss">' + m + '</span>'; });
        mhtml += '</div>';
      }
    } else {
      mhtml = '<div class="ad-section">安全区域，无怪物</div>';
    }
    document.getElementById('ad-monsters').innerHTML = mhtml;

    // 按钮状态
    var btnEnter = document.getElementById('ad-enter');
    var btnTravel = document.getElementById('ad-travel');

    if (a.type === 'town') {
      btnEnter.textContent = '进入城镇';
      btnEnter.style.display = '';
      btnTravel.style.display = 'none';
      btnEnter.disabled = false;
    } else if (id === s.map.areaId) {
      btnEnter.textContent = '进入场景';
      btnEnter.style.display = '';
      btnTravel.style.display = 'none';
      btnEnter.disabled = false;
    } else if (s.player.level < (a.unlockLv || 0)) {
      btnEnter.textContent = '🔒 需 Lv.' + a.unlockLv;
      btnEnter.style.display = '';
      btnTravel.style.display = 'none';
      btnEnter.disabled = true;
    } else {
      btnEnter.textContent = '进入场景';
      btnEnter.style.display = '';
      btnEnter.disabled = true;
      btnTravel.style.display = '';
      btnTravel.textContent = '前往此地';
      btnTravel.disabled = false;
    }

    // 绑定按钮
    btnEnter.onclick = function () {
      if (btnEnter.disabled) return;
      el.style.display = 'none';
      enterScene(id);
    };
    btnTravel.onclick = function () {
      el.style.display = 'none';
      if (WorldMap.travelTo(id)) {
        UI.updateMap();
        UI.updateIdleStatus();
      }
    };

    el.style.display = 'flex';

    // 关闭按钮
    document.getElementById('ad-close').onclick = function () {
      el.style.display = 'none';
    };
    // 点击遮罩关闭
    el.onclick = function (e) {
      if (e.target === el) el.style.display = 'none';
    };
  }

  /* ============ 进入场景 ============ */
  function enterScene(id) {
    var a = WorldMap.getArea(id);
    if (!a) return;

    areaId = id;
    active = true;
    waveCount = 0;
    killCount = 0;

    // 隐藏大地图，显示场景视图
    document.getElementById('worldmap').style.display = 'none';
    document.querySelector('.wm-controls').style.display = 'none';
    document.getElementById('map-travel').style.display = 'none';
    document.getElementById('wm-legend').style.display = 'none';
    document.getElementById('wm-filter').style.display = 'none';
    var sv = document.getElementById('scene-view');
    sv.style.display = '';

    document.getElementById('scene-title').textContent = a.name + ' · ' + a.region;

    renderSceneBg(a);
    spawnWave(a);

    // 启动场景定时器
    if (sceneTimer) clearInterval(sceneTimer);
    sceneTimer = setInterval(sceneTick, 300);

    // 绑定返回按钮
    document.getElementById('scene-back').onclick = exitScene;
  }

  /* ============ 退出场景 ============ */
  function exitScene() {
    active = false;
    if (sceneTimer) { clearInterval(sceneTimer); sceneTimer = null; }

    document.getElementById('scene-view').style.display = 'none';
    document.getElementById('worldmap').style.display = '';
    document.querySelector('.wm-controls').style.display = '';
    document.getElementById('map-travel').style.display = '';
    document.getElementById('wm-legend').style.display = '';
    document.getElementById('wm-filter').style.display = '';

    // 清理精灵
    var canvas = document.getElementById('scene-canvas');
    if (canvas) canvas.innerHTML = '';
    monsters = [];
    player.el = null;
    player.target = null;

    UI.updateMap();
    UI.updateIdleStatus();
  }

  /* ============ 渲染场景背景 ============ */
  function renderSceneBg(a) {
    var canvas = document.getElementById('scene-canvas');
    canvas.className = 'scene-canvas bg-' + a.type;
    canvas.innerHTML = '';

    // 地面纹理装饰
    var decor = '';
    if (a.type === 'field') {
      // 野外：草石点缀
      for (var i = 0; i < 8; i++) {
        var dx = 5 + Math.random() * 90;
        var dy = 5 + Math.random() * 90;
        var sz = 12 + Math.random() * 20;
        decor += '<div class="scene-decor stone" style="left:' + dx + '%;top:' + dy + '%;width:' + sz + 'px;height:' + sz + 'px"></div>';
      }
      for (var i = 0; i < 5; i++) {
        var gx = 5 + Math.random() * 90;
        var gy = 5 + Math.random() * 90;
        decor += '<div class="scene-decor grass" style="left:' + gx + '%;top:' + gy + '%"></div>';
      }
    } else if (a.type === 'cave') {
      for (var i = 0; i < 6; i++) {
        var dx = 5 + Math.random() * 90;
        var dy = 5 + Math.random() * 90;
        var sz = 16 + Math.random() * 24;
        decor += '<div class="scene-decor rock" style="left:' + dx + '%;top:' + dy + '%;width:' + sz + 'px;height:' + sz + 'px"></div>';
      }
    } else if (a.type === 'ghost') {
      for (var i = 0; i < 10; i++) {
        var dx = 5 + Math.random() * 90;
        var dy = 5 + Math.random() * 90;
        decor += '<div class="scene-decor mist" style="left:' + dx + '%;top:' + dy + '%"></div>';
      }
    } else if (a.type === 'town') {
      decor += '<div class="scene-decor building" style="left:30%;top:10%;width:40%;height:25%"></div>';
      decor += '<div class="scene-decor building" style="left:55%;top:15%;width:25%;height:20%"></div>';
      decor += '<div class="scene-decor building" style="left:15%;top:55%;width:30%;height:18%"></div>';
    }
    canvas.innerHTML = decor;

    // 创建玩家精灵
    createPlayerSprite();
  }

  /* ============ 创建玩家精灵 ============ */
  function createPlayerSprite() {
    var canvas = document.getElementById('scene-canvas');
    var d = State.getDerived();
    var hpPct = d ? (d.hp / d.maxHp * 100) : 100;

    var el = document.createElement('div');
    el.className = 'player-sprite';
    el.innerHTML =
      '<div class="sprite-hp"><div class="sprite-hp-fill" style="width:' + hpPct + '%"></div></div>' +
      '<div class="sprite-body player-body">剑</div>' +
      '<div class="sprite-name">我</div>';
    el.style.left = '50%';
    el.style.top = '50%';
    canvas.appendChild(el);
    player.el = el;
    player.x = 50;
    player.y = 50;
    player.target = null;
    player.attacking = false;
  }

  /* ============ 生成怪物波 ============ */
  function spawnWave(a) {
    if (!a.monsters || a.monsters.length === 0) return;
    waveCount++;
    monsters = [];

    var count = 3 + Math.floor(Math.random() * 3); // 3-5只
    var canvas = document.getElementById('scene-canvas');

    for (var i = 0; i < count; i++) {
      var mname = a.monsters[Math.floor(Math.random() * a.monsters.length)];
      var mtype = 'grunt';
      // 15% 精英
      if (a.elite && a.elite.length && Math.random() < 0.15) {
        mname = a.elite[Math.floor(Math.random() * a.elite.length)];
        mtype = 'elite';
      }
      // Boss 机制：每 15 杀 35% 概率
      if (a.boss && a.boss.length && killCount > 0 && killCount % 15 === 0 && Math.random() < 0.35) {
        mname = a.boss[0];
        mtype = 'boss';
      }

      var mx = 10 + Math.random() * 80;
      var my = 10 + Math.random() * 80;
      // 避免和玩家重叠
      if (Math.abs(mx - 50) < 15 && Math.abs(my - 50) < 15) { mx += 20; my += 20; }

      var m = {
        id: 'm' + (++monsterIdSeq),
        name: mname,
        x: mx, y: my,
        hp: 100, maxHp: 100,
        type: mtype,
        alive: true,
        el: null
      };

      // 根据 type 设置 HP
      if (mtype === 'elite') m.hp = m.maxHp = 250;
      else if (mtype === 'boss') m.hp = m.maxHp = 800;

      var el = document.createElement('div');
      el.className = 'monster-sprite ' + mtype;
      var icon = mtype === 'boss' ? '王' : (mtype === 'elite' ? '精' : '怪');
      var sz = mtype === 'boss' ? 44 : (mtype === 'elite' ? 34 : 28);
      el.innerHTML =
        '<div class="sprite-hp"><div class="sprite-hp-fill" style="width:100%"></div></div>' +
        '<div class="sprite-body monster-body ' + mtype + '" style="width:' + sz + 'px;height:' + sz + 'px">' + icon + '</div>' +
        '<div class="sprite-name">' + shortenName(mname) + '</div>';
      el.style.left = mx + '%';
      el.style.top = my + '%';
      canvas.appendChild(el);
      m.el = el;

      monsters.push(m);
    }

    updateSceneInfo();
  }

  /* ============ 场景定时器（300ms） ============ */
  var sceneTickCount = 0;
  function sceneTick() {
    if (!active) return;
    sceneTickCount++;

    // 更新玩家 HP 条
    updatePlayerHp();

    // 找最近的活着的怪物
    if (!player.target || !player.target.alive) {
      player.target = findNearestMonster();
      player.attacking = false;
    }

    if (player.target && player.target.alive) {
      var dx = player.target.x - player.x;
      var dy = player.target.y - player.y;
      var dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 8) {
        // 移动 toward 怪物
        var speed = 6;
        var ratio = speed / dist;
        player.x += dx * ratio;
        player.y += dy * ratio;
        player.x = Math.max(2, Math.min(98, player.x));
        player.y = Math.max(2, Math.min(98, player.y));
        if (player.el) {
          player.el.style.left = player.x + '%';
          player.el.style.top = player.y + '%';
        }
        player.attacking = false;
      } else {
        // 在攻击范围内：攻击动画
        if (!player.attacking) {
          player.attacking = true;
          doVisualAttack(player.target);
        }
      }
    }

    // 每 3 秒（10 tick）执行一次实际战斗结算
    if (sceneTickCount % 10 === 0) {
      var s = State.get();
      var area = State.getCurrentArea();
      if (area && area.type !== 'town' && area.monsters && Idle.isRunning()) {
        // 让 idle.js 的 Combat.executeRound 处理实际数值
        // 场景视图只负责视觉表现
      }
    }
  }

  /* ============ 视觉攻击 ============ */
  function doVisualAttack(m) {
    if (!m || !m.alive) return;
    var d = State.getDerived();
    if (!d) return;

    // 计算视觉伤害（近似值）
    var dmg = Math.floor(d.atk * (0.7 + Math.random() * 0.5));
    var crit = Math.random() < (d.critRate || 0);
    if (crit) dmg = Math.floor(dmg * (d.critDmg || 1.5));

    // 显示伤害数字
    showDamage(m.x, m.y, dmg, crit);

    // 怪物受击动画
    if (m.el) {
      var body = m.el.querySelector('.monster-body');
      if (body) {
        body.classList.add('hit');
        setTimeout(function () { body.classList.remove('hit'); }, 200);
      }
    }

    // 玩家攻击动画
    if (player.el) {
      var pbody = player.el.querySelector('.player-body');
      if (pbody) {
        pbody.classList.add('attack');
        setTimeout(function () { pbody.classList.remove('attack'); }, 250);
      }
    }

    // 减少视觉 HP（近似）
    m.hp = Math.max(0, m.hp - dmg);
    if (m.el) {
      var hpFill = m.el.querySelector('.sprite-hp-fill');
      if (hpFill) hpFill.style.width = (m.hp / m.maxHp * 100) + '%';
    }

    // 怪物视觉死亡（HP 归零）
    if (m.hp <= 0 && m.alive) {
      killMonsterVisual(m);
    }
  }

  /* ============ 怪物视觉死亡 ============ */
  function killMonsterVisual(m) {
    m.alive = false;
    killCount++;

    if (m.el) {
      m.el.classList.add('dying');
      var self = m;
      setTimeout(function () {
        if (self.el && self.el.parentNode) self.el.parentNode.removeChild(self.el);
        // 检查是否需要新波
        var aliveCount = monsters.filter(function (x) { return x.alive; }).length;
        if (aliveCount === 0) {
          var a = WorldMap.getArea(areaId);
          if (a && a.type !== 'town') {
            setTimeout(function () { spawnWave(a); }, 800);
          }
        } else {
          // 补充怪物（保持 3-5 只）
          if (aliveCount < 3) {
            var single = createSingleMonster(a);
            if (single) monsters.push(single);
          }
        }
        updateSceneInfo();
      }, 500);
    }

    // 清除目标引用
    if (player.target === m) player.target = null;
    player.attacking = false;
  }

  /* ============ 创建单个补充怪物 ============ */
  function createSingleMonster(a) {
    if (!a.monsters || a.monsters.length === 0) return null;
    var mname = a.monsters[Math.floor(Math.random() * a.monsters.length)];
    var mtype = 'grunt';
    if (a.elite && a.elite.length && Math.random() < 0.15) {
      mname = a.elite[Math.floor(Math.random() * a.elite.length)];
      mtype = 'elite';
    }

    var mx = 10 + Math.random() * 80;
    var my = 10 + Math.random() * 80;
    if (Math.abs(mx - 50) < 15) mx += 20;

    var m = {
      id: 'm' + (++monsterIdSeq),
      name: mname, x: mx, y: my,
      hp: 100, maxHp: 100, type: mtype, alive: true, el: null
    };
    if (mtype === 'elite') m.hp = m.maxHp = 250;

    var canvas = document.getElementById('scene-canvas');
    var el = document.createElement('div');
    el.className = 'monster-sprite ' + mtype + ' spawning';
    var sz = mtype === 'elite' ? 34 : 28;
    var icon = mtype === 'elite' ? '精' : '怪';
    el.innerHTML =
      '<div class="sprite-hp"><div class="sprite-hp-fill" style="width:100%"></div></div>' +
      '<div class="sprite-body monster-body ' + mtype + '" style="width:' + sz + 'px;height:' + sz + 'px">' + icon + '</div>' +
      '<div class="sprite-name">' + shortenName(mname) + '</div>';
    el.style.left = mx + '%';
    el.style.top = my + '%';
    canvas.appendChild(el);
    m.el = el;
    return m;
  }

  /* ============ 查找最近怪物 ============ */
  function findNearestMonster() {
    var nearest = null;
    var minDist = 999;
    monsters.forEach(function (m) {
      if (!m.alive) return;
      var dx = m.x - player.x;
      var dy = m.y - player.y;
      var d = Math.sqrt(dx * dx + dy * dy);
      if (d < minDist) { minDist = d; nearest = m; }
    });
    return nearest;
  }

  /* ============ 伤害数字飘字 ============ */
  function showDamage(x, y, dmg, crit) {
    var canvas = document.getElementById('scene-canvas');
    if (!canvas) return;
    var el = document.createElement('div');
    el.className = 'dmg-number' + (crit ? ' crit' : '');
    el.textContent = crit ? dmg + '!' : dmg;
    el.style.left = x + '%';
    el.style.top = y + '%';
    canvas.appendChild(el);
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 1000);
  }

  /* ============ 更新玩家 HP 条 ============ */
  function updatePlayerHp() {
    var d = State.getDerived();
    if (!d || !player.el) return;
    var pct = Math.max(0, d.hp / d.maxHp * 100);
    var hpFill = player.el.querySelector('.sprite-hp-fill');
    if (hpFill) hpFill.style.width = pct + '%';
  }

  /* ============ 更新场景信息 ============ */
  function updateSceneInfo() {
    var el = document.getElementById('scene-info');
    if (!el) return;
    var alive = monsters.filter(function (m) { return m.alive; }).length;
    el.textContent = '第' + waveCount + '波 · 剩余 ' + alive + '怪 · 累计击杀 ' + killCount;
  }

  /* ============ 工具函数 ============ */
  function areaTypeTxt(a) {
    if (a.type === 'town') return '城镇';
    if (a.type === 'cave') return '洞穴';
    if (a.type === 'ghost') return '魂境';
    return '野外';
  }

  function shortenName(n) {
    if (n.length <= 4) return n;
    return n.substring(0, 4) + '…';
  }

  /* ============ 对外接口 ============ */
  return {
    showDetail: showDetail,
    enter: enterScene,
    exit: exitScene,
    isActive: function () { return active; },
    getKillCount: function () { return killCount; }
  };

})();
