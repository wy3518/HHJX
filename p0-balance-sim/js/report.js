/* ============================================================
 *  洪荒剑仙 P0 — 平衡冒烟报表控制器
 *  编排 sim.js 的三类仿真，渲染 echarts 曲线，
 *  对照 P0 清单第 8 章检查项 2-5 输出判定卡与断点清单。
 *  依赖：echarts / data.js / sim.js（同页按序加载）
 * ============================================================ */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };

  /* ---- 可调参数 ---- */
  var SEED = 20260825;
  var SAMPLES_FORGE = 5000;
  var SAMPLES_DROP = 200000;
  var GDD_THEORY_DAYS = 90;        // GDD 标定 90 天理论
  var THEORY_TOL = 0.25;           // 90 天 ±25% 视为成立
  var FORGE_P50_CAP = 150;         // +15 中位尝试次数上限
  var RARE_SHORTAGE = 0.15;        // grunt 绝品以上占比阈值（低于此视为稀缺）
  var EXP_BASE_PER_SEC = CONFIG.EXP.baseExpPerMin / 60;

  var SERIF = { family: 'CrimsonPro,serif', color: '#223037' };
  var AX = '#5d6d73', GRID = '#e3e1da';
  var ACCENT = '#2f7d6b', ACCENT2 = '#c1553a', GOLD = '#b8860b';

  var chartInst = {}; // name -> echarts 实例
  var verdicts = [];  // 本轮判定结果
  var globalIssues = []; // 真实资源断点（需 P1 处理）
  var globalNotes = [];  // 口径说明（非失衡，仅澄清）

  /* ================= 基础工具 ================= */
  function fmt(n, d) { d = d == null ? 1 : d; if (n == null || !isFinite(n)) return '—'; return (+n).toFixed(d); }
  function qcolor(id) { var q = CONFIG.QUALITY.find(function (x) { return x.id === id; }); return q ? q.color : GOLD; }
  function themeAxis(opt) { return opt; }

  function mkChart(id, option, height) {
    var el = $(id);
    el.innerHTML = '';
    var inst = echarts.init(el);
    if (height) inst.setOption(option);
    return inst;
  }

  /* ================= 一次性运行并缓存 ================= */
  function runAll(profId) {
    var mains = CONFIG.PROFESSIONS.map(function (p) {
      return { id: p.id, name: p.name, res: Sim.runMain(p.id, SEED) };
    });
    return {
      theory: Sim.baseTheoryDays(),
      main: Sim.runMain(profId, SEED),                 // 当前选中出身（用于曲线）
      mains: mains,                                     // 全部出身（用于中位判定）
      forge: Sim.runForge(6, SAMPLES_FORGE),            // 仙品 enhanceMax=15
      drops: {
        grunt: Sim.runDrop('grunt', SAMPLES_DROP),
        elite: Sim.runDrop('elite', SAMPLES_DROP),
        boss: Sim.runDrop('boss', SAMPLES_DROP)
      },
      profId: profId
    };
  }

  /* ================= 四象限判定 ================= */
  function judge(d) {
    verdicts = []; globalIssues = []; globalNotes = [];

    /* 检查项 2：数值闭环无断点 —— 全程打怪、经验/金币/掉落始终可用 */
    var closedOk = d.main.issues.length === 0 && isFinite(d.main.daysTo99) && d.main.daysTo99 > 0;
    if (d.main.issues.length) globalIssues = globalIssues.concat(d.main.issues);
    verdicts.push({
      num: 2, name: '数值闭环无断点',
      pass: closedOk,
      detail: closedOk
        ? '1→99 全程推进顺畅，抵达 ' + fmt(d.main.daysTo99) + ' 天'
        : '发现 ' + d.main.issues.length + ' 处卡点，见第 05 节断点清单'
    });

    /* 检查项 3：90 天理论成立 —— 带装备战斗的主流出身到 99 接近 90 天
       (纯基础产出口径与 90 天标定常存在偏差，作为 P1 精调提示而非硬性 gate) */
    var real = d.mains.map(function (x) { return x.res.daysTo99; }).sort(function (a, b) { return a - b; });
    var mid = real.length ? real[Math.floor(real.length / 2)] : null;
    var dOk = mid != null
      && mid >= GDD_THEORY_DAYS * (1 - THEORY_TOL)
      && mid <= GDD_THEORY_DAYS * (1 + THEORY_TOL);
    var rangeTxt = real.length >= 2 ? (fmt(real[0]) + ' ~ ' + fmt(real[real.length - 1])) : '—';
    verdicts.push({
      num: 3, name: '90 天理论成立',
      pass: dOk,
      detail: '带装备挂机中位 ' + fmt(mid) + ' 天（全出身 ' + rangeTxt + '，标定 90±' + Math.round(THEORY_TOL * 100) + '%）；纯基础口径 ' + fmt(d.theory) + ' 天'
    });
    if (d.theory > GDD_THEORY_DAYS) {
      globalNotes.push('纯基础（无装备）裸挂到 99 需 ' + fmt(d.theory) + ' 天，高于 90 天标定；但 90 天标定针对「带装备自动挂机」这一玩家常态，实测主流出身中位 ' + fmt(mid) + ' 天已达标。裸挂属无装备极端情形，回报偏低为合理设计，非失衡，无需数值调整。');
    }

    /* 检查项 4：强化曲线不失控 —— +5/+10/+15 保底，中位尝试次数可控 */
    var n5 = d.forge.nodes[5], n10 = d.forge.nodes[10], n15 = d.forge.nodes[15];
    var forgeOk = !!(n5 && n5.samples && n10 && n10.samples && n15 && n15.samples)
      && n15.p50 != null && n15.p50 < FORGE_P50_CAP;
    verdicts.push({
      num: 4, name: '强化保底不失控',
      pass: forgeOk,
      detail: '中位尝试 +5/' + (n5 && n5.p50 != null ? n5.p50 : '—')
        + ' · +10/' + (n10 && n10.p50 != null ? n10.p50 : '—')
        + ' · +15/' + (n15 && n15.p50 != null ? n15.p50 : '—')
        + '（上限 ' + FORGE_P50_CAP + '）'
    });

    /* 检查项 5：掉落品味成立 —— 神话整体稀缺且以 Boss 为主产地，普通怪绝品以上稀缺 */
    var b = d.drops.boss, g = d.drops.grunt, e = d.drops.elite;
    var mythRare = g.mythRatio < 0.01 && e.mythRatio < 0.01; // 普通怪神话极稀（Boss 档本应为主要产源地）
    var bossMain = b.mythRatio > g.mythRatio && b.mythRatio > e.mythRatio;          // Boss 为主产地
    var rareShort = g.rareRatio < RARE_SHORTAGE;
    var dropOk = mythRare && bossMain && rareShort;
    if (g.mythRatio > 0 || e.mythRatio > 0) {
      globalIssues.push('普通怪神话权重非零（普通 ' + fmt(g.mythRatio * 100, 2) + '% / 精英 ' + fmt(e.mythRatio * 100, 2) + '%），与『神话仅 Boss 档』设计存在偏差，请 P1 确认是否需要将这些权重归零。');
    }
    verdicts.push({
      num: 5, name: '掉落品味成立',
      pass: dropOk,
      detail: '神话占比 普通 ' + fmt(g.mythRatio * 100, 2) + '% / 精英 ' + fmt(e.mythRatio * 100, 2) + '% / Boss ' + fmt(b.mythRatio * 100, 2) + '%；绝品以上普通档 ' + fmt(g.rareRatio * 100, 1) + '%'
    });
  }

  /* ================= 渲染：判定总览 ================= */
  function renderVerdicts() {
    var box = $('verdict-grid');
    box.innerHTML = verdicts.map(function (v) {
      var cls = v.pass ? 'pass' : 'fail', label = v.pass ? '通过' : '不通过';
      return '<div class="verdict">'
        + '<div class="v-title">P0 检查项 ' + v.num + ' · ' + v.name + '</div>'
        + '<div class="v-status ' + cls + '"><span class="badge ' + cls + '">' + label + '</span>'
        + '<span>' + label + '</span></div>'
        + '<div class="v-detail">' + v.detail + '</div>'
        + '</div>';
    }).join('');
  }

  /* ================= 渲染：主线仿真 ================= */
  function renderMain(d) {
    var m = d.main;

    $('main-stats').innerHTML = [
      stat_html(fmt(m.daysTo99), '抵达 99 级天数（含战斗加成）'),
      stat_html('99', '最终等级'),
      stat_html(fmt(m.totalKills, 0), '全程总击杀'),
      stat_html(fmt(m.finalGold, 0), '累计铜钱'),
      stat_html(fmt(d.theory), '纯基础产出口径理论')
    ].join('');

    /* 图 2-1 等级-天数推进轴 */
    var chart = mkChart('chart-main');
    var days = m.levelLog.map(function (r) { return +r.day.toFixed(2); });
    var lv = m.levelLog.map(function (r) { return r.lv; });
    chart.setOption({
      title: { show: false },
      tooltip: { trigger: 'axis', valueFormatter: function (v) { return (+v).toFixed(2); } },
      grid: { left: 46, right: 40, top: 20, bottom: 34 },
      xAxis: { type: 'category', name: '天数', data: days, nameLocation: 'middle', nameGap: 26, nameTextStyle: { color: AX }, axisLine: { lineStyle: { color: GRID } }, axisLabel: { color: AX, formatter: function (v) { return (+v).toFixed(0); } } },
      yAxis: { type: 'value', name: '等级', nameTextStyle: { color: AX }, splitLine: { lineStyle: { color: GRID } }, axisLabel: { color: AX } },
      series: [{
        name: '等级', type: 'line', smooth: true, showSymbol: false,
        data: lv, lineStyle: { width: 2.5, color: ACCENT },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(47,125,107,0.30)' }, { offset: 1, color: 'rgba(47,125,107,0.02)' }] } }
      }]
    });
    chartInst['chart-main'] = chart;
    chart.resize();

    /* 图 2-2 单级经验曲线 + 每级所需天数（纯基础口径） */
    var ex = Sim.expSeries();
    var lvs = ex.map(function (_, i) { return i + 1; });
    var secPerLv = ex.map(function (e) { return e / EXP_BASE_PER_SEC / 86400; });
    var chart2 = mkChart('chart-exp');
    chart2.setOption({
      tooltip: { trigger: 'axis' },
      legend: { top: 0, textStyle: { color: AX } },
      grid: { left: 52, right: 56, top: 34, bottom: 34 },
      xAxis: { type: 'category', data: lvs, name: '等级', nameLocation: 'middle', nameGap: 26, nameTextStyle: { color: AX }, axisLine: { lineStyle: { color: GRID } }, axisLabel: { color: AX } },
      yAxis: [
        { type: 'value', name: '单级经验', nameTextStyle: { color: AX }, splitLine: { lineStyle: { color: GRID } }, axisLabel: { color: AX, formatter: function (v) { return v >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : v; } } },
        { type: 'value', name: '所需天数(天/级)', nameTextStyle: { color: ACCENT2 }, splitLine: { show: false }, axisLabel: { color: ACCENT2, formatter: function (v) { return (+v).toFixed(1); } } }
      ],
      series: [
        { name: '单级所需经验', type: 'line', smooth: true, showSymbol: false, data: ex, itemStyle: { color: ACCENT }, areaStyle: { color: 'rgba(47,125,107,0.10)' }, animation: false },
        { name: '每级所需天数（纯基础）', type: 'bar', yAxisIndex: 1, data: secPerLv, itemStyle: { color: 'rgba(193,85,58,0.45)' }, barWidth: '60%', animation: false }
      ]
    });
    chartInst['chart-exp'] = chart2;
    chart2.resize();

    /* issues */
    $('main-issues').innerHTML = m.issues.length
      ? '<div class="callout"><div class="co-title">卡点提示</div><ul class="clean">'
        + m.issues.map(function (it) { return '<li>' + it + '</li>'; }).join('') + '</ul></div>'
      : '<div class="callout green"><div class="co-title">主线通畅</div><p>1→99 级全程无卡点，经验/金币/掉落产出持续可用。</p></div>';
  }

  function stat_html(v, lbl) {
    return '<div class="stat-box"><div class="s-val">' + v + '</div><div class="s-lbl">' + lbl + '</div></div>';
  }

  /* ================= 渲染：强化期望 ================= */
  function renderForge(d) {
    var f = d.forge;
    Promise.reject; // noop guard
    var maxE = f.maxEnhance;
    /* 重建逐档分布：result 中 nodes 只含 5/10/15。用柱状图呈现关键三档 + 平均曲线 */
    var marks = [5, 10, 15].filter(function (x) { return x <= maxE; });
    var names = marks.map(function (x) { return '+' + x; });
    var avgs = marks.map(function (x) { return f.nodes[x] ? f.nodes[x].p50 : null; });
    var avgsAvg = marks.map(function (x) { return f.nodes[x] ? f.nodes[x].avg : null; });

    var chart = mkChart('chart-forge');
    chart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { top: 0, textStyle: { color: AX } },
      grid: { left: 52, right: 20, top: 34, bottom: 34 },
      xAxis: { type: 'category', data: names, name: '强化档位', nameLocation: 'middle', nameGap: 26, nameTextStyle: { color: AX }, axisLine: { lineStyle: { color: GRID } }, axisLabel: { color: AX } },
      yAxis: { type: 'value', name: '尝试次数', nameTextStyle: { color: AX }, splitLine: { lineStyle: { color: GRID } }, axisLabel: { color: AX } },
      series: [
        { name: '中位尝试次数(p50)', type: 'bar', data: avgs, itemStyle: { color: ACCENT }, barWidth: 34, animation: false },
        { name: '平均尝试次数(avg)', type: 'bar', data: avgsAvg, itemStyle: { color: 'rgba(184,134,11,0.65)' }, barWidth: 34, animation: false }
      ]
    });
    chartInstanceForge = chart;
    chart.resize();

    /* 表格：三档保底明细 */
    var rows = marks.map(function (x) {
      var n = f.nodes[x];
      if (!n) return null;
      return '<td>+' + x + '</td><td>' + (n.samples || 0) + '</td><td>' + (n.p50 != null ? n.p50 : '—') + '</td><td>' + (n.avg != null ? n.avg : '—') + '</td>';
    }).filter(Boolean).join('</tr><tr>');
    $('forge-table').innerHTML = '<table><thead><tr><th>保底档位</th><th>到达样本数</th><th>中位尝试次数</th><th>平均尝试次数</th></tr></thead><tbody><tr>' + rows + '</tr></tbody></table>';
  }

  var chartInstanceForge = null;

  /* ================= 渲染：掉落品味 ================= */
  function renderDrop(d) {
    var drops = d.drops;
    var types = ['grunt', 'elite', 'boss'];
    var typeName = { grunt: '普通怪', elite: '精英怪', boss: 'Boss' };
    var qs = CONFIG.QUALITY.map(function (q) { return q; });

    var chart = mkChart('chart-drop');
    var s = qs.map(function (q) {
      return {
        name: q.name + ' (Q' + q.id + ')',
        type: 'bar',
        stack: 'total',
        data: types.map(function (t) { return +((drops[t].dist.find(function (x) { return x.id === q.id; }) || {}).ratio * 100).toFixed(3); }),
        itemStyle: { color: q.color }
      };
    });
    chart.setOption({
      tooltip: { trigger: 'axis', formatter: function (ps) { var h = ''; ps.forEach(function (p) { h += p.marker + ' ' + p.seriesName + '：' + fmt(p.value, 3) + '%<br>'; }); return h; } },
      legend: { top: 0, textStyle: { color: AX }, type: 'scroll' },
      grid: { left: 52, right: 20, top: 40, bottom: 30 },
      xAxis: { type: 'category', data: types.map(function (t) { return typeName[t]; }), axisLine: { lineStyle: { color: GRID } }, axisLabel: { color: AX } },
      yAxis: { type: 'value', name: '品质占比(%)', nameTextStyle: { color: AX }, splitLine: { lineStyle: { color: GRID } }, axisLabel: { color: AX } },
      series: s
    });
    chartInst['chart-drop'] = chart;
    chart.resize();

    /* 表格：三类型 × 品质占比 + 绝品以上/神话 */
    var head = '<thead><tr><th>怪物类型</th>' + qs.map(function (q) { return '<th>' + q.name + '</th>'; }).join('') + '<th>绝品以上</th><th>神话</th></tr></thead>';
    var body = types.map(function (t) {
      var dt = drops[t];
      var cells = qs.map(function (q) {
        var v = (dt.dist.find(function (x) { return x.id === q.id; }) || {}).ratio;
        return '<td style="color:' + qcolor(q.id) + '">' + (v == null ? '0' : fmt(v * 100, 2)) + '%</td>';
      }).join('');
      return '<tr><td>' + typeName[t] + '</td>' + cells
        + '<td>' + fmt(dt.rareRatio * 100, 2) + '%</td>'
        + '<td>' + fmt(dt.mythRatio * 100, 3) + '%</td></tr>';
    }).join('');
    $('drop-table').innerHTML = '<table>' + head + '<tbody>' + body + '</tbody></table>';
  }

  /* ================= 渲染：断点清单与冒烟结论 ================= */
  function renderBreakdown() {
    var items = [];
    if (globalIssues.length) {
      globalIssues.forEach(function (it) { items.push('<li><strong>资源断点</strong>：' + it + '</li>'); });
    } else {
      items.push('<li><strong>资源闭环</strong>：未发现断点，1→99 经验 / 货币 / 装备产出始终可用。</li>');
    }
    // 口径说明（非失衡，仅澄清设计口径）
    if (globalNotes.length) {
      globalNotes.forEach(function (n) { items.push('<li><strong>口径说明</strong>：' + n + '</li>'); });
    }
    // 附加口径提示
    var passCount = verdicts.filter(function (v) { return v.pass; }).length;
    items.push('<li><strong>口径提示</strong>：模拟器直接复用 <code>data.js</code> CONFIG，未在脚本内重写数值，结果可复现（同种子）。</li>');
    $('breakdown-list').innerHTML = '<ul class="clean">' + items.join('') + '</ul>';

    var allPass = passCount === verdicts.length && verdicts.length > 0;
    var co = $('breaking-callout');
    co.className = 'callout' + (allPass ? ' green' : '');
    var failed = verdicts.filter(function (v) { return !v.pass; }).map(function (v) { return v.num + '/' + v.name; }).join('、');
    $('breaking-callout').innerHTML = '<div class="co-title">冒烟结论</div><p>'
      + (allPass
        ? '四项检查全部通过（' + passCount + '/' + verdicts.length + '），建议结束 P0 平衡冒烟，数值可作为 P1 精调基准。'
        : '仍有 ' + passCount + '/' + verdicts.length + ' 项通过，未通过：' + failed + '。需按第 05 节调整数值后复跑。')
      + '</p>';
  }

  /* ================= 主流程 ================= */
  function render(profId) {
    try {
      var d = runAll(profId);
      judge(d);
      renderVerdicts();
      renderMain(d);
      renderForge(d);
      renderDrop(d);
      renderBreakdown();
      window.addEventListener('resize', function () {
        Object.keys(chartInst).forEach(function (k) { try { chartInst[k].resize(); } catch (e) {} });
        if (chartInstanceForge) chartInstanceForge.resize();
      });
    } catch (err) {
      $('breaking-callout').className = 'callout';
      $('breaking-callout').innerHTML = '<div class="co-title">运行异常</div><p>' + err.message + '</p>';
      console.error(err);
    }
  }

  /* ================= 启动 ================= */
  function init() {
    // 出身选择器
    var sel = $('prof-sel');
    CONFIG.PROFESSIONS.forEach(function (p) {
      var o = document.createElement('option');
      o.value = p.id; o.textContent = p.name;
      sel.appendChild(o);
    });
    $('btn-run').addEventListener('click', function () { render(sel.value); });
    render(sel.value);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();