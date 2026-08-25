/* P0 清单 —— 经验曲线可视化 */
(function () {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();

  // exp(n) = round(45 * n^2.4)，n = 目标等级
  function expFor(lv) { return Math.round(45 * Math.pow(lv, 2.4)); }

  var levels = [];           // 2..99 到达该级所需的经验
  var totalUpTo = [];        // 累计到该级所需总经验
  var minutesTo = [];        // 累积挂机分钟数（1000 经验/分钟）
  var daysCum = [];          // 累积天数
  var cum = 0;
  var lvAxis = ['1级'];
  for (var lv = 2; lv <= 99; lv++) {
    var e = expFor(lv);
    levels.push(e);
    cum += e;
    totalUpTo.push(cum);
    minutesTo.push(Math.ceil(cum / 1000));
    daysCum.push(+(cum / 1000 / 60 / 24).toFixed(1));
    lvAxis.push(lv + '级');
  }
  // 只在若干关键等级标注
  var keyMarks = [2, 10, 20, 30, 40, 50, 60, 70, 80, 90, 99];
  var labelRaw = new Array(98).join(' ').split(' ');
  keyMarks.forEach(function (lv) {
    var i = lv - 2;
    if (i >= 0) labelRaw[i] = lv + '级';
  });
  var realAxis = [];
  for (var i = 0; i < 98; i++) realAxis.push(i === 0 ? '2级' : '');

  var L99 = expFor(99);
  var total = cumulative(99);
  function cumulative(k) { var s = 0; for (var n = 2; n <= k; n++) s += expFor(n); return s; }

  var chart = echarts.init(document.getElementById('chart-exp'), null, { renderer: 'svg' });
  chart.setOption({
    animation: false,
    tooltip: {
      appendToBody: true,
      trigger: 'axis',
      axisPointer: { type: 'cross', label: { backgroundColor: ink } },
      formatter: function (ps) {
        var p = ps[0];
        var lv = p.axisValue;
        var idx = lv - 2;
        var per = idx >= 0 ? levels[idx] : null;
        var cumv = idx >= 0 ? totalUpTo[idx] : 0;
        if (lv === 1) per = expFor(1), cumv = expFor(1);
        var days = Math.ceil((cumv) / 1000 / 60 / 24);
        return '目标等级 <b>' + lv + '</b><br/>单级经验: <b>' + fmt(per) + '</b><br/>累计经验: <b>' + fmt(cumv) + '</b><br/>纯挂机累计: 约 <b>' + days + ' 天</b>';
      }
    },
    legend: { data: ['单级所需经验', '累计经验(右轴)'], textStyle: { color: ink }, top: 0 },
    grid: { left: 64, right: 64, top: 42, bottom: 34 },
    xAxis: {
      type: 'category',
      data: realAxis,
      axisLine: { lineStyle: { color: rule } },
      axisLabel: { color: muted, interval: function (i, val) { return keyMarks.indexOf(i + 2) > -1; } },
      name: '到达该级',
      nameLocation: 'middle',
      nameGap: 28,
      nameTextStyle: { color: muted }
    },
    yAxis: [
      {
        type: 'value',
        name: '单级经验（万）',
        nameTextStyle: { color: muted },
        axisLabel: { color: muted, formatter: function (v) { return (v / 10000).toFixed(0); } },
        splitLine: { lineStyle: { color: rule } }
      },
      {
        type: 'value',
        name: '累计（亿）',
        nameTextStyle: { color: muted },
        axisLabel: { color: muted, formatter: function (v) { return (v / 100000000).toFixed(1); } },
        splitLine: { show: false }
      }
    ],
    series: [
      {
        name: '单级所需经验',
        type: 'line',
        data: levels,
        smooth: true,
        symbol: 'none',
        lineStyle: { width: 3, color: accent },
        areaStyle: { color: accent, opacity: 0.10 },
        markPoint: {
          symbolSize: 44,
          data: [
            { coord: [97, levels[97]], value: '99级卡点' },
            { coord: [8, levels[8]], value: '前10级陡升' }
          ].map(function (m) {
            var lv = m.coord[0] + 2;
            return { coord: m.coord, value: m.value, itemStyle: { color: accent2 }, label: { color: '#fff', fontSize: 10, formatter: m.value } };
          })
        }
      },
      {
        name: '累计经验(右轴)',
        type: 'line',
        yAxisIndex: 1,
        data: totalUpTo,
        smooth: true,
        symbol: 'none',
        lineStyle: { width: 2, color: accent2, type: 'dashed' }
      }
    ]
  });
  window.addEventListener('resize', function () { chart.resize(); });

  function fmt(v) {
    if (v >= 100000000) return (v / 100000000).toFixed(2) + '亿';
    if (v >= 10000) return (v / 10000).toFixed(1) + '万';
    return String(v);
  }
})();