/* ============================================================
 *  洪荒剑仙 P0 - UI 渲染层
 *  订阅事件总线实时更新，纯 DOM 操作无框架
 * ============================================================ */

var UI = (function () {

  var selectedProf = null;

  /* ============ 角色创建 ============ */
  function renderProfessions() {
    var html = CONFIG.PROFESSIONS.map(function (p) {
      var b = p.base;
      var stats = '力' + b.str + ' · 气' + b.erg + ' · 神' + b.spi + ' · 身' + b.agi + ' · 根' + b.vit;
      var passive = '';
      var pas = p.passive;
      if (pas.type === 'crit') passive = '会心率+8% · 会心伤害×1.65';
      else if (pas.type === 'tank') passive = '减伤15% · 反伤30%';
      else if (pas.type === 'dot') passive = '治疗+20% · 持续伤害+25%';
      else if (pas.type === 'combo') passive = '合击+20%终伤 · 全属性收集加成';
      return '<div class="prof-card" data-id="' + p.id + '">' +
        '<h4>' + p.name + '</h4>' +
        '<div class="desc">' + p.desc + '</div>' +
        '<div class="stats">' + stats + '</div>' +
        '<div class="passive">' + passive + '</div>' +
        '</div>';
    }).join('');
    document.getElementById('profession-list').innerHTML = html;

    // 绑定点击
    document.querySelectorAll('.prof-card').forEach(function (card) {
      card.addEventListener('click', function () {
        document.querySelectorAll('.prof-card').forEach(function (c) { c.classList.remove('selected'); });
        card.classList.add('selected');
        selectedProf = card.dataset.id;
        document.getElementById('creation-confirm').style.display = 'block';
      });
    });
  }

  /* ============ 顶栏更新 ============ */
  function updateTopBar() {
    var s = State.get();
    var d = State.getDerived();
    if (!d) return;

    document.getElementById('player-name').textContent = s.player.name;
    document.getElementById('player-level').textContent = 'Lv.' + s.player.level;

    var prof = CONFIG.PROFESSIONS.find(function (x) { return x.id === s.player.professionId; });
    document.getElementById('player-prof').textContent = prof ? prof.name : '';

    var need = State.expNeeded();
    var pct = Math.min(100, s.player.exp / need * 100);
    document.getElementById('exp-bar').style.width = pct + '%';
    document.getElementById('exp-text').textContent = Math.floor(s.player.exp) + ' / ' + need;

    document.getElementById('gold').textContent = Math.floor(s.currencies.gold).toLocaleString();
    document.getElementById('blessing').textContent = s.currencies.blessing;
    if (document.getElementById('stone')) {
      document.getElementById('stone').textContent = s.currencies.stone;
    }
  }

  /* ============ 角色属性面板 ============ */
  function updateStats() {
    var d = State.getDerived();
    if (!d) return;
    var s = State.get();

    var rows = [
      ['气血', d.hp + ' / ' + d.maxHp],
      ['法力', d.mp + ' / ' + d.maxMp],
      ['攻击', d.atk],
      ['元素攻击', d.elemAtk],
      ['防御', d.def],
      ['会心率', (d.critRate * 100).toFixed(1) + '%'],
      ['会心伤害', (d.critDmg * 100).toFixed(0) + '%'],
      ['身法', d.speed],
      ['吸血', (d.leech > 0) ? d.leech + '%' : '-'],
      ['技能威力', (d.skillPower > 0) ? '+' + d.skillPower + '%' : '-'],
      ['在线时长', Math.floor(s.stats.playTimeSec / 60) + ' 分']
    ];

    var html = rows.map(function (r) {
      return '<div class="stat-row"><span class="label">' + r[0] + '</span><span class="val' + (r[0] === '会心率' ? ' crit' : '') + '">' + r[1] + '</span></div>';
    }).join('');

    // 技能连招区（P2）：展示当前出身可释放的技能序列
    var skills = CONFIG.SKILLS[s.player.professionId] || [];
    var shtml = '<div class="skill-hd">技能连招</div>';
    if (skills.length) {
      skills.forEach(function (sk, i) {
        shtml += '<div class="skill-row">'
          + '<span class="skill-idx">' + (i + 1) + '</span>'
          + '<span class="skill-name" title="' + sk.desc + '">' + sk.name + '</span>'
          + '<span class="skill-mp">MP' + sk.mp + '</span>'
          + '</div>';
      });
    } else {
      shtml += '<div class="skill-row muted">未习得技能，以普通攻击对敌</div>';
    }
    html += shtml;

    document.getElementById('stat-block').innerHTML = html;

    // 战力
    document.getElementById('power-display').textContent = d.power.toLocaleString();
  }

  /* ============ 装备栏 ============ */
  function updateEquipSlots() {
    var s = State.get();
    var html = CONFIG.SLOTS.map(function (slot) {
      var item = s.equipped[slot.id];
      if (item) {
        var enhanced = Forge.calcEnhancedStats(item);
        return '<div class="equip-slot" data-slot="' + slot.id + '">' +
          '<div class="slot-name">' + slot.name + '</div>' +
          '<div class="item-name" style="color:' + item.color + '">' +
            (item.enhance > 0 ? '+' + item.enhance + ' ' : '') + item.name +
          '</div>' +
          '<div style="font-size:10px;color:var(--muted)">攻' + enhanced.atk + ' 防御' + enhanced.def + '</div>' +
          (item.affixes && item.affixes.length > 0 ? '<div style="font-size:10px;color:var(--blue)">' + item.affixes.length + '词缀</div>' : '') +
        '</div>';
      }
      return '<div class="equip-slot empty" data-slot="' + slot.id + '">' +
        '<div class="slot-name">' + slot.name + '</div>' +
        '<div class="item-name">空</div>' +
      '</div>';
    }).join('');
    document.getElementById('equip-slots').innerHTML = html;

    // 绑定卸下
    document.querySelectorAll('.equip-slot').forEach(function (el) {
      el.addEventListener('click', function () {
        var slot = this.dataset.slot;
        if (s.equipped[slot]) {
          State.unequipItem(slot);
          refresh();
        }
      });
    });
  }

  /* ============ 三界大世界总览图 ============ */
  function areaTypeTxt(a) {
    if (a.type === 'town') return '城镇';
    if (a.type === 'cave') return '洞穴';
    if (a.type === 'ghost') return '魂境';
    return '野外';
  }

  /* ---- 总览图主体：SVG 底色（界名+连通边）+ HTML 标点 ---- */
  function renderWorldMap() {
    var s = State.get();
    var m = s.map;
    var areas = CONFIG.MAPAREAS;
    var bg = document.getElementById('worldmap-bg');
    var nodesEl = document.getElementById('worldmap-nodes');
    if (!bg || !nodesEl) return;

    // --- SVG 底色：界名 + 连通边 ---
    var svg = '';
    var zones = {};
    areas.forEach(function (a) { zones[a.region] = zones[a.region] || []; zones[a.region].push(a); });
    Object.keys(zones).forEach(function (region) {
      var list = zones[region];
      var ax = 0, ay = 0;
      list.forEach(function (a) { ax += a.pos[0]; ay += a.pos[1]; });
      ax /= list.length; ay /= list.length;
      svg += '<text class="zlabel" x="' + (ax / 100 * 1000).toFixed(0) + '" y="' + (ay / 100 * 700).toFixed(0) + '">' + region + '</text>';
    });
    var drawn = {};
    areas.forEach(function (a) {
      (a.exits || []).forEach(function (ex) {
        var b = WorldMap.getArea(ex.to);
        if (!b) return;
        var key = a.id < ex.to ? a.id + '|' + ex.to : ex.to + '|' + a.id;
        if (drawn[key]) return;
        drawn[key] = true;
        var isTownLink = (a.type === 'town' && b.type === 'town');
        svg += '<line class="conn' + (isTownLink ? ' town' : '') + '" x1="' + (a.pos[0] / 100 * 1000).toFixed(1) + '" y1="' + (a.pos[1] / 100 * 700).toFixed(1) + '" x2="' + (b.pos[0] / 100 * 1000).toFixed(1) + '" y2="' + (b.pos[1] / 100 * 700).toFixed(1) + '"/>';
      });
    });
    bg.innerHTML = svg;

    // --- HTML 标点 ---
    var parts = areas.map(function (a) {
      var cur = a.id === m.areaId;
      var reached = WorldMap.hasReached(a.id);
      var locked = s.player.level < (a.unlockLv || 0);
      var isTown = a.type === 'town';
      var icon = isTown ? '城' : (a.type === 'cave' ? '洞' : (a.type === 'ghost' ? '魂' : '野'));
      var cls = 'wm-node ' + a.type;
      if (cur) cls += ' cur';
      else if (locked) cls += ' locked';
      else if (!reached) cls += ' unreached';
      var prog = WorldMap.getExploreProgress(a.id);
      var title = a.name + ' · ' + a.region + '（' + areaTypeTxt(a) + '）\n'
        + 'Lv' + a.lvMin + '-' + a.lvMax
        + (a.boss && a.boss.length ? ' [BOSS]' : '')
        + (locked ? '\n🔒 需 Lv.' + a.unlockLv + ' 解锁' : '')
        + '\n' + a.desc
        + (isTown ? '' : '\n探索 ' + Math.floor(prog * 100) + '%');
      return '<div class="' + cls + '" data-id="' + a.id + '" title="' + title.replace(/"/g, '&quot;') + '">'
        + '<span class="dot">' + icon + '</span>'
        + (locked ? '<span class="lock">\uD83D\uDD12</span>' : '')
        + (a.boss && a.boss.length ? '<span class="boss">B</span>' : '')
        + '<span class="cap">' + a.name + '</span>'
        + '</div>';
    });
    nodesEl.innerHTML = parts.join('');

    Array.prototype.forEach.call(nodesEl.querySelectorAll('.wm-node'), function (node) {
      var a = WorldMap.getArea(node.dataset.id);
      if (!a) return;
      node.style.left = (a.pos[0]) + '%';
      node.style.top = (a.pos[1]) + '%';
      node.addEventListener('click', function () { onWorldNodeClick(a.id); });
    });
  }

  /* ---- 点击总览图标点：直达或提示解锁 ---- */
  function onWorldNodeClick(id) {
    var s = State.get();
    if (id === s.map.areaId) return;
    var a = WorldMap.getArea(id);
    if (!a) return;
    if (s.player.level < (a.unlockLv || 0)) {
      Combat.getLog().unshift({ time: Date.now(), text: '「' + a.name + '」需 Lv.' + a.unlockLv + ' 才可前往' });
      refresh();
      return;
    }
    if (WorldMap.travelTo(id)) {
      updateMap();
      updateIdleStatus();
    }
  }

  /* ---- 图例 ---- */
  function renderLegend() {
    var el = document.getElementById('wm-legend');
    if (!el) return;
    var areas = CONFIG.MAPAREAS;
    var zones = {};
    areas.forEach(function (a) { zones[a.region] = (zones[a.region] || 0) + 1; });
    var lg =
      '<span class="lg"><span class="kw" style="border-color:var(--gold)"></span>城镇</span>' +
      '<span class="lg"><span class="kw" style="border-color:var(--green)"></span>野外</span>' +
      '<span class="lg"><span class="kw" style="border-color:var(--blue)"></span>洞穴</span>' +
      '<span class="lg"><span class="kw" style="border-color:#c486ff"></span>魂境</span>' +
      '<span class="lg"><span class="kw" style="background:var(--accent);border-color:#fff"></span>当前</span>' +
      '<span class="lg">\uD83D\uDD12 未解锁</span><span class="lg">B BOSS</span>';
    Object.keys(zones).forEach(function (r) {
      lg += '<span class="lg">· ' + r + '×' + zones[r] + '</span>';
    });
    el.innerHTML = lg;
  }

  /* ---- 大地图面板刷新 ---- */
  function updateMap() {
    var s = State.get();
    var m = s.map;
    var area = State.getCurrentArea() || CONFIG.MAPAREAS[0];

    document.getElementById('map-title').textContent = area.name + ' · ' + area.region;
    document.getElementById('map-pos').textContent =
      areaTypeTxt(area) + (area.type === 'town' ? '安全区' : '') + ' · Lv' + area.lvMin + '-' + area.lvMax;

    renderWorldMap();

    var travelEl = document.getElementById('map-travel');
    if (m.travel && m.moving && m.travel.segments && m.travel.segments.length) {
      var target = WorldMap.getArea(m.travel.to);
      travelEl.textContent = '▶ 正在前往「' + (target ? target.name : m.travel.to) + '」 · 途经 ' + m.travel.segments.length + ' 站';
      travelEl.style.color = 'var(--blue)';
    } else {
      travelEl.textContent = area.type === 'town'
        ? '点击上方总览标点，自动寻路前往任意场景'
        : '停留于此 · 点击总览标点前往他处';
      travelEl.style.color = 'var(--muted)';
    }

    renderLegend();
  }

  /* ============ 战斗日志 ============ */
  function updateCombatLog() {
    var log = Combat.getLog();
    var html = log.slice(0, 30).map(function (e) {
      var cls = 'log-entry';
      if (e.text.indexOf('暴击') >= 0) cls += ' crit';
      else if (e.text.indexOf('击杀') >= 0) cls += ' kill';
      else if (e.text.indexOf('掉落') >= 0 || e.text.indexOf('获得') >= 0) cls += ' drop';
      else if (e.text.indexOf('强化') >= 0) cls += ' forge';
      return '<div class="' + cls + '">' + e.text + '</div>';
    }).join('');
    document.getElementById('combat-log').innerHTML = html || '<div class="log-entry">等待战斗...</div>';
  }

  /* ============ 背包 ============ */
  /* ---- 渲染词缀（品阶色 + 属性标签 + 数值） ---- */
  function fmtAffix(item) {
    var a = item.affixes || [];
    if (a.length === 0) return '';
    return '<div class="affix-list">' + a.map(function (af) {
      var tc = af.tierColor || item.color;
      return '<span class="affix-line" style="color:' + tc + '">'
        + (af.tierName ? '[' + af.tierName + ']' : '')
        + af.name + ' +' + af.val + '</span>';
    }).join('') + '</div>';
  }

  function updateInventory() {
    var s = State.get();
    document.getElementById('inv-count').textContent = s.inventory.length + '/30';

    if (s.inventory.length === 0) {
      document.getElementById('inventory').innerHTML = '<div class="hint">背包空空如也</div>';
      return;
    }

    var html = s.inventory.map(function (item) {
      var enhanced = Forge.calcEnhancedStats(item);
      return '<div class="inv-item" data-uid="' + item.uid + '">' +
        '<div class="item-color" style="background:' + item.color + '"></div>' +
        '<div class="item-info">' +
          '<span style="color:' + item.color + '">' + item.name + '</span>' +
          (item.enhance > 0 ? ' <span class="item-enhance">+' + item.enhance + '</span>' : '') +
          '<div style="font-size:10px;color:var(--muted)">攻' + enhanced.atk + ' 防御' + enhanced.def + (item.affixes.length > 0 ? ' · ' + item.affixes.length + '词缀' : '') + '</div>' +
          fmtAffix(item) +
        '</div>' +
        '<button class="btn-sm equip-btn" data-uid="' + item.uid + '">穿</button>' +
      '</div>';
    }).join('');
    document.getElementById('inventory').innerHTML = html;

    document.querySelectorAll('.equip-btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        State.equipItem(this.dataset.uid);
        refresh();
      });
    });
  }

  /* ============ 强化面板 ============ */
  function updateForgePanel() {
    var s = State.get();
    // 合并背包+已穿装备
    var all = s.inventory.concat(Object.values(s.equipped).filter(Boolean));

    if (all.length === 0) {
      document.getElementById('forge-list').innerHTML = '<div class="hint">无装备可强化</div>';
      document.getElementById('forge-detail').style.display = 'none';
      return;
    }

    var html = all.map(function (item) {
      var max = Forge.getQualityMax(item.qualityId);
      return '<div class="inv-item forge-item" data-uid="' + item.uid + '">' +
        '<div class="item-color" style="background:' + item.color + '"></div>' +
        '<div class="item-info">' +
          '<span style="color:' + item.color + '">' + item.name + '</span>' +
          (item.enhance > 0 ? ' <span class="item-enhance">+' + item.enhance + '</span>' : '') +
          '<div style="font-size:10px;color:var(--muted)">+' + item.enhance + '/' + max + '</div>' +
        '</div>' +
      '</div>';
    }).join('');
    document.getElementById('forge-list').innerHTML = html;

    document.querySelectorAll('.forge-item').forEach(function (el) {
      el.addEventListener('click', function () {
        showForgeDetail(this.dataset.uid);
      });
    });
  }

  var forgeTargetUid = null;

  function showForgeDetail(uid) {
    var s = State.get();
    var item = s.inventory.find(function (x) { return x.uid === uid; }) ||
               Object.values(s.equipped).find(function (x) { return x && x.uid === uid; });
    if (!item) return;
    forgeTargetUid = uid;

    var max = Forge.getQualityMax(item.qualityId);
    var nextLv = item.enhance + 1;
    var canForge = item.enhance < max;
    var cfg = canForge ? Forge.getForgeConfig(nextLv) : null;

    document.getElementById('forge-item-info').innerHTML =
      '<span style="color:' + item.color + '">' + item.name + '</span>' +
      (item.enhance > 0 ? ' +' + item.enhance : '');
    document.getElementById('forge-current').textContent = '+' + item.enhance + (canForge ? ' (上限 +' + max + ')' : ' (已达上限)');

    // 词缀区
    document.getElementById('forge-affixes').innerHTML = fmtAffix(item) ||
      '<div class="gem-hint">该装备无词缀</div>';

    // 洗练按钮/成本
    var needStone = CONFIG.QUALITY.find(function (x) { return x.id === item.qualityId; }) || {};
    var rs = needStone.reforgeStone || 1, rg = needStone.reforgeGold || 0;
    var btnRefine = document.getElementById('btn-refine');
    btnRefine.textContent = '洗练（' + rs + '石 + ' + rg + '铜）';
    btnRefine.disabled = !(s.currencies.stone >= rs && s.currencies.gold >= rg);
    document.getElementById('forge-refine-cost').textContent =
      '消耗 洗练石×' + rs + ' + 铜钱×' + rg.toLocaleString() + '，重掷全部词缀（类型/数值/品阶）';

    if (cfg) {
      var rate = cfg.rate;
      if (s.currencies.blessing >= 100) rate = 1.0;
      document.getElementById('forge-rate').textContent = (rate * 100).toFixed(0) + '%' + (s.currencies.blessing >= 100 ? ' (天工满)' : '');
      document.getElementById('forge-cost').textContent = cfg.iron + '×' + cfg.ironN + ' + ' + cfg.gold + '铜';
      document.getElementById('btn-enhance').disabled = false;
    } else {
      document.getElementById('forge-rate').textContent = '--';
      document.getElementById('forge-cost').textContent = '--';
      document.getElementById('btn-enhance').disabled = true;
    }

    document.getElementById('forge-detail').style.display = 'block';

    // 打孔 / 镶嵌
    var maxSockets = (item.slot === 'weapon') ? ((item.qualityId >= 5) ? 3 : 2) : 0;
    document.getElementById('forge-sockets').textContent = item.sockets.length + '/' + maxSockets;
    var btnSocket = document.getElementById('btn-socket');
    var cantSocket = item.slot !== 'weapon' || item.sockets.length >= maxSockets;
    btnSocket.disabled = cantSocket;
    var socketCost = 2000 + item.sockets.length * 3000;
    btnSocket.textContent = item.slot !== 'weapon' ? '仅武器可打孔' : (cantSocket ? '孔位已满' : '打孔（' + socketCost.toLocaleString() + '铜）');
    renderForgeGems(item);
    bindForgeGemActions();
  }

  function doEnhance() {
    if (!forgeTargetUid) return;
    var result = Forge.enhance(forgeTargetUid);
    // 添加日志
    Combat.getLog().unshift({ time: Date.now(), text: result.message });
    showForgeDetail(forgeTargetUid);
    refresh();
  }

  /* ---- 打孔 ---- */
  function doSocket() {
    if (!forgeTargetUid) return;
    var result = Forge.socket(forgeTargetUid);
    Combat.getLog().unshift({ time: Date.now(), text: result.message });
    showForgeDetail(forgeTargetUid);
    refresh();
  }

  /* ---- 洗练 ---- */
  function doRefine() {
    if (!forgeTargetUid) return;
    var result = Forge.refine(forgeTargetUid);
    Combat.getLog().unshift({ time: Date.now(), text: result.message });
    showForgeDetail(forgeTargetUid);
    refresh();
  }

  /* ---- 渲染孔位 + 宝石背包/镶嵌面板 ---- */
  function renderForgeGems(item) {
    var s = State.get();
    var el = document.getElementById('forge-gems');
    if (!item) { el.innerHTML = ''; return; }

    // 孔位视图
    var holes = '';
    if (item.sockets.length === 0) {
      holes = '<div class="gem-hint">该装备尚无孔位，点击「打孔」开孔（P0 仅武器可打孔）</div>';
    } else {
      holes = '<div class="gem-sockets">' + item.sockets.map(function (so, i) {
        var gid = item.gems ? item.gems[i] : null;
        if (!so.filled || !gid) {
          return '<span class="gem-hole empty" data-uid="' + item.uid + '" data-idx="' + i + '">空孔' + (i + 1) + '</span>';
        }
        var g = CONFIG.GEMS.find(function (x) { return x.id === gid; });
        if (!g) return '<span class="gem-hole empty">空孔' + (i + 1) + '</span>';
        return '<span class="gem-hole filled" style="border-color:' + g.color + ';color:' + g.color + '">' + g.name + ' <span class="gem-remove" data-uid="' + item.uid + '" data-idx="' + i + '" title="抠石">✕</span></span>';
      }).join('') + '</div>';
    }

    // 宝石背包
    var gems = s.gems.length === 0
      ? '<div class="gem-hint">背包无宝石，挂机击杀有概率拾得</div>'
      : '<div class="gem-bag">' + s.gems.map(function (g, i) {
          var usable = item.sockets.some(function (so) { return !so.filled; });
          return '<span class="gem-bag-item" style="color:' + g.color + '">' + g.name + ' <small>(' + (g.stat === 'atk' ? '攻' : g.stat === 'def' ? '防' : g.stat === 'hp' ? '气血' : g.stat === 'crit' ? '会心' : '身法') + '+' + g.base + ')</small>' +
            '<button class="btn-sm gem-set-btn" data-uid="' + item.uid + '" data-gid="' + g.gid + '"' + (usable ? '' : ' disabled') + '>镶嵌</button></span>';
        }).join('') + '</div>';

    var summary = Forge.getGemSummary(item);
    var sumText = Object.keys(summary).map(function (k) {
      return CONFIG.GEMS.find(function (x) { return x.id && x.stat === k; }) && (k === 'atk' ? '攻' : k === 'def' ? '防' : k === 'hp' ? '气血' : k === 'crit' ? '会心' : '身法') + '+' + summary[k];
    }).join('　') || '暂无宝石加成';

    el.innerHTML = holes + '<div class="gem-summary">宝石加成：' + sumText + '</div>' + '<div class="gem-hd">宝石背包</div>' + gems;
  }

  function bindForgeGemActions() {
    var gems = document.getElementById('forge-gems');
    // 镶嵌
    Array.prototype.forEach.call(gems.querySelectorAll('.gem-set-btn'), function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var result = Forge.insertGem(this.dataset.uid, Number(this.dataset.gid));
        Combat.getLog().unshift({ time: Date.now(), text: result.message });
        showForgeDetail(forgeTargetUid);
        refresh();
      });
    });
    // 抠石
    Array.prototype.forEach.call(gems.querySelectorAll('.gem-remove'), function (x) {
      x.addEventListener('click', function (e) {
        e.stopPropagation();
        var result = Forge.removeGem(this.dataset.uid, Number(this.dataset.idx));
        Combat.getLog().unshift({ time: Date.now(), text: result.message });
        showForgeDetail(forgeTargetUid);
        refresh();
      });
    });
  }

  /* ============ 挂机状态 ============ */
  function updateIdleStatus() {
    var s = State.get();
    var running = Idle.isRunning();
    var el = document.getElementById('map-loc');
    var btn = document.getElementById('btn-toggle-idle');
    var stopBtn = document.getElementById('btn-stop-move');
    var area = State.getCurrentArea() || CONFIG.MAPAREAS[0];
    var isField = area.type !== 'town' && !!area.monsters;
    if (stopBtn) { stopBtn.style.display = s.map.moving ? '' : 'none'; }
    if (running) {
      el.style.color = 'var(--green)';
      if (s.map.moving) {
        el.textContent = '行走中 · ' + area.name;
      } else if (isField) {
        el.textContent = '清扫「' + area.name + '」';
      } else {
        el.textContent = '在「' + area.name + '」休整';
      }
      btn.textContent = '暂停';
      btn.disabled = false;
    } else {
      el.style.color = 'var(--muted)';
      el.textContent = '已暂停';
      btn.textContent = '开始挂机';
      btn.disabled = false;
    }
  }

  /* ============ 底栏 ============ */
  function updateBottomBar() {
    var s = State.get();
    var min = Math.floor(s.stats.playTimeSec / 60);
    document.getElementById('play-time').textContent = '在线 ' + min + ' 分钟 · 击杀 ' + s.stats.totalKills + ' · 掉落 ' + s.stats.totalDrops;
  }

  /* ============ 全局刷新 ============ */
  function refresh() {
    updateTopBar();
    updateStats();
    updateEquipSlots();
    updateMap();
    updateIdleStatus();
    updateInventory();
    updateForgePanel();
    updateBottomBar();
    updateCombatLog();
  }

  /* ============ 离线结算弹窗 ============ */
  function showOffline(result) {
    if (!result) return;
    document.getElementById('offline-text').textContent =
      '离线 ' + Math.floor(result.sec / 60) + ' 分钟，获得经验 ' + result.exp.toLocaleString() + '，铜钱 ' + result.gold.toLocaleString();
    document.getElementById('offline-screen').style.display = 'flex';
  }

  /* ============ 初始化 ============ */
  function init() {
    // 出身选择
    renderProfessions();

    // 确认出身
    document.getElementById('btn-confirm-prof').addEventListener('click', function () {
      if (!selectedProf) return;
      var s = State.reset();
      s.player.professionId = selectedProf;
      var prof = CONFIG.PROFESSIONS.find(function (x) { return x.id === selectedProf; });
      s.player.stats = { str: prof.base.str, erg: prof.base.erg, spi: prof.base.spi, agi: prof.base.agi, vit: prof.base.vit };
      s.player.name = '无名' + prof.name.split(' · ')[0];

      document.getElementById('creation-screen').style.display = 'none';
      document.getElementById('game').style.display = 'flex';
      refresh();
    });

    // 离线弹窗
    document.getElementById('btn-offline-ok').addEventListener('click', function () {
      document.getElementById('offline-screen').style.display = 'none';
    });

    // 挂机开关
    document.getElementById('btn-toggle-idle').addEventListener('click', function () {
      if (Idle.isRunning()) {
        Idle.stop();
      } else {
        Idle.start();
      }
      updateIdleStatus();
    });

    // 停止移动
    var stopMoveBtn = document.getElementById('btn-stop-move');
    if (stopMoveBtn) {
      stopMoveBtn.addEventListener('click', function () {
        WorldMap.stop();
        updateMap();
        updateIdleStatus();
      });
    }

    // Tab 切换
    document.querySelectorAll('.tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        document.querySelectorAll('.tab').forEach(function (t) { t.classList.remove('active'); });
        this.classList.add('active');
        document.querySelectorAll('.tab-content').forEach(function (c) { c.classList.remove('active'); c.style.display = 'none'; });
        var target = document.getElementById('tab-' + this.dataset.tab);
        target.classList.add('active');
        target.style.display = 'block';
      });
    });

    // 强化按钮
    document.getElementById('btn-enhance').addEventListener('click', doEnhance);
    document.getElementById('btn-socket').addEventListener('click', doSocket);
    document.getElementById('btn-refine').addEventListener('click', doRefine);

    // 保存
    document.getElementById('btn-save').addEventListener('click', function () {
      Save.save();
      this.textContent = '已保存!';
      var self = this;
      setTimeout(function () { self.textContent = '手动保存'; }, 1500);
    });

    // 导出
    document.getElementById('btn-export').addEventListener('click', function () {
      var b64 = Save.exportData();
      prompt('复制存档码（也可用于导入）:', b64);
    });

    // 重置
    document.getElementById('btn-reset').addEventListener('click', function () {
      if (confirm('确定重置？所有进度将丢失!')) {
        // 先清空内存状态（professionId 置空），避免 beforeunload 自动保存把旧档写回，
        // 否则 Save.clear() 会被卸载时的 Save.save() 立即反写，重置无效
        if (State.reset) State.reset();
        Save.clear();
        location.reload();
      }
    });

    // 订阅事件
    Bus.on('expGain', function () { updateTopBar(); });
    Bus.on('levelup', function (lv) {
      Combat.getLog().unshift({ time: Date.now(), text: '✨ 升级！当前 Lv.' + lv });
      refresh();
    });
    Bus.on('goldChange', function () {
      document.getElementById('gold').textContent = State.get().currencies.gold.toLocaleString();
    });
    Bus.on('stoneChange', function () {
      if (document.getElementById('stone')) {
        document.getElementById('stone').textContent = State.get().currencies.stone;
      }
      // 洗练成本随石头变化刷新按钮可用态
      if (forgeTargetUid) updateForgePanel();
    });
    Bus.on('combatRound', function (r) {
      if (r.drop) {
        Combat.getLog().unshift({ time: Date.now(), text: '🎁 掉落 ' + r.drop.qualityName + r.drop.slotName + '!' });
      }
      if (r.stoneDrop) {
        Combat.getLog().unshift({ time: Date.now(), text: '⛏ 拾得洗练石×1' });
      }
      updateCombatLog();
      updateTopBar();
    });
    Bus.on('refineResult', function () { refresh(); });
    Bus.on('itemAdded', function () { updateInventory(); updateForgePanel(); });
    Bus.on('equipChange', function () { updateEquipSlots(); updateStats(); updateTopBar(); });
    Bus.on('forgeResult', function (r) { updateForgePanel(); });
    Bus.on('mapTravel', function () { updateMap(); updateIdleStatus(); });
    Bus.on('mapMove', function () { updateMap(); });
    Bus.on('mapChange', function () { updateMap(); updateIdleStatus(); });
    Bus.on('mapStop', function () { updateMap(); updateIdleStatus(); });
  }

  return {
    init: init,
    refresh: refresh,
    showOffline: showOffline,
    updateTopBar: updateTopBar,
    updateBottomBar: updateBottomBar,
    updateIdleStatus: updateIdleStatus,
    updateCombatLog: updateCombatLog
  };
})();
