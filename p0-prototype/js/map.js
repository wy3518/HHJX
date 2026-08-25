/* ============================================================
 *  洪荒剑仙 P0 - 大世界总览寻路引擎（B 方案）
 *  三界大世界所有场景（主城/野外/洞穴/魂境）通过 MAPAREAS.exits
 *  邻接表连通。点击总览标点直接 travelTo，step() 每秒沿路径
 *  跨场景逐段传送，直达目标区域。不再依赖网格坐标逐格移动。
 *  idle.js 每秒调用 WorldMap.step() 驱动。
 * ============================================================ */

var WorldMap = (function () {

  function get() { return State.get().map; }

  function getArea(id) {
    return CONFIG.MAPAREAS.find(function (a) { return a.id === id; });
  }

  /* ---- BFS：求从 fromAreaId 到 toAreaId 的分段路径 ----
   * 基于 exits 邻接表，返回 [{from, via, to}]，via 为传送门 id；
   * from 为起点区域，to 为上一段到达的区域；不可达返回 null。
   */
  function findSegments(fromAreaId, toAreaId) {
    if (fromAreaId === toAreaId) return [];
    var queue = [{ area: fromAreaId, segs: [] }];
    var visited = {};
    visited[fromAreaId] = true;
    while (queue.length) {
      var cur = queue.shift();
      var area = getArea(cur.area);
      if (!area || !area.exits) continue;
      for (var i = 0; i < area.exits.length; i++) {
        var ex = area.exits[i];
        if (!ex.to || visited[ex.to]) continue;
        var segs = cur.segs.concat([{ from: area.id, via: ex.id, to: ex.to }]);
        if (ex.to === toAreaId) return segs;
        visited[ex.to] = true;
        queue.push({ area: ex.to, segs: segs });
      }
    }
    return null;
  }

  /* ---- 规划前往目标区域的路径并开始自动寻路 ----
   * 同一目标已在途则视为成功；已在目标区域返回 false。
   */
  function travelTo(areaId) {
    var m = get();
    if (areaId === m.areaId) return false;
    if (m.travel && m.travel.to === areaId && m.moving) return true;
    var segs = findSegments(m.areaId, areaId);
    if (!segs || segs.length === 0) return false;
    m.travel = { to: areaId, segments: segs };
    m.moving = true;
    Bus.emit('mapTravel', { to: areaId });
    return true;
  }

  /* ---- 停止寻路（原地停留） ---- */
  function stop() {
    var m = get();
    m.routeExitId = null;
    m.travel = null;
    m.moving = false;
    Bus.emit('mapStop');
  }

  /* ---- 切换场景：走完一段，续程或抵达 ---- */
  function doTransfer(area, exit, startIdx) {
    var s = State.get();
    var m = s.map;
    var nextArea = getArea(exit.to);
    if (!nextArea) { m.travel = null; m.moving = false; return; }

    m.areaId = exit.to;
    m.routeExitId = null;
    markVisited(exit.to);

    // 续程：travel 内还有以新区域为起点的下一段则继续走
    var arrive = true;
    var segs = m.travel && m.travel.segments;
    if (segs && segs.length) {
      for (var i = startIdx + 1; i < segs.length; i++) {
        if (segs[i].from === m.areaId) { arrive = false; break; }
      }
    }
    m.moving = !arrive;
    if (arrive) m.travel = null;

    Bus.emit('mapChange', { from: area.name, to: nextArea.name, arrive: arrive });
  }

  /* ---- 每秒驱动：沿 travel 路径跨场景走一段 ---- */
  function step() {
    var m = get();
    if (!m.travel || !m.moving) { m.moving = false; m.travel = null; return; }

    var area = getArea(m.areaId);
    if (!area || !area.exits) { m.travel = null; m.moving = false; return; }

    var segs = m.travel.segments || [];
    // 找到以当前区域为起点的下一段
    var startIdx = -1, via = null;
    for (var i = 0; i < segs.length; i++) {
      if (segs[i].from === m.areaId) { startIdx = i; via = segs[i].via; break; }
    }
    if (startIdx === -1) { m.travel = null; m.moving = false; return; }  // 已抵达目标

    var exit = area.exits.find(function (e) { return e.id === via; });
    if (!exit) { m.travel = null; m.moving = false; return; }

    doTransfer(area, exit, startIdx);
  }

  /* ---- 探索度（0-1）：城镇恒为1；野外按击杀不同怪物种数/目标 ---- */
  function getExploreProgress(areaId) {
    var s = State.get();
    var a = getArea(areaId) || getArea(s.map.areaId);
    if (!a || a.type === 'town' || !a.exploreGoal) return 1;
    var ex = s.map.explored[a.id];
    var n = ex && ex.killed ? Object.keys(ex.killed).length : 0;
    return Math.min(1, n / a.exploreGoal);
  }

  /* ---- 是否已到达过某区域 ---- */
  function hasReached(areaId) {
    var s = State.get();
    if (s.map.areaId === areaId) return true;
    var ex = s.map.explored[areaId];
    return !!(ex && (ex.visited || (ex.killed && Object.keys(ex.killed).length > 0)));
  }

  /* ---- 标记已到达某区域 ---- */
  function markVisited(areaId) {
    var s = State.get();
    s.map.explored[areaId] = s.map.explored[areaId] || { killed: {}, visited: false };
    s.map.explored[areaId].visited = true;
  }

  /* ---- (兼容)标记初始城镇已到达 ---- */
  function initDefault() {
    var s = State.get();
    markVisited(s.map.areaId);
  }

  return {
    travelTo: travelTo,
    stop: stop,
    step: step,
    findSegments: findSegments,
    getArea: getArea,
    getExploreProgress: getExploreProgress,
    hasReached: hasReached,
    markVisited: markVisited,
    initDefault: initDefault
  };
})();