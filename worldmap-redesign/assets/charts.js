/* 大地图策划 -- 野外场景等级梯度分布 */
(function () {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var gold = style.getPropertyValue('--gold').trim();

  // [起始等级, 结束等级, 场景名] -- 与表格一致
  var scenes = [
    [1, 3, '青石镇外'], [1, 3, '荒坟野'], [6, 8, '野狼坡'], [6, 8, '落狼谷'],
    [1, 15, '十二魂冢·下'], [1, 15, '十二魂冢·上'], [10, 25, '邪魂台'], [12, 18, '清溪涧'],
    [16, 23, '洛水荒岸'], [20, 27, '妖族营地'], [20, 29, '午桥废庄'], [25, 29, '凤鸣山'],
    [27, 32, '空山寺'], [30, 30, '青石古道'], [34, 39, '寒云雪谷'], [35, 36, '冻骨雪原'],
    [36, 39, '月落镇'], [36, 42, '雪狐洞'], [36, 48, '古王陵墓·上'], [36, 48, '古王陵墓·下'],
    [36, 48, '古王墓室'], [39, 54, '妖狐部落'], [41, 46, '千狐岭'], [41, 46, '妖狐洞'],
    [46, 58, '十八盘'], [46, 60, '蛮巨人谷'], [57, 60, '江烟古渡'], [60, 65, '灵石岛'],
    [60, 65, '落星湾'], [60, 65, '平阿镇'], [60, 65, '殇阳原'], [61, 66, '厌火岛'],
    [63, 67, '滕王墓·上'], [63, 67, '滕王墓·下'], [64, 64, '斗魔台'], [66, 68, '蛮古山脉'],
    [66, 69, '鼎湖山'], [71, 73, '孟婆渡'], [71, 75, '奈何桥'], [71, 76, '幽冥古墓1-4层'],
    [73, 76, '黄泉路'], [73, 83, '云梦大泽'], [77, 79, '黑翼山'], [77, 79, '望乡台'],
    [75, 82, '东海'], [75, 85, '崂山'], [82, 86, '黔中古墟'], [83, 87, '桃源浣溪'],
    [85, 88, '炎魔废墟'], [89, 92, '焚天谷'], [90, 94, '水涌谷'], [90, 94, '月离峡'],
    [90, 95, '虎踞关'], [95, 99, '洪荒古墟']
  ];

  var yCats = scenes.map(function (s) { return s[2]; }).reverse(); // 倒序使第一个在顶
  var data = scenes.map(function (s, i) {
    return { value: [s[0], s[1], scenes.length - 1 - i], name: s[2] };
  });

  var chart = echarts.init(document.getElementById('chart-levels'), null, { renderer: 'svg' });
  chart.setOption({
    animation: false,
    tooltip: {
      appendToBody: true,
      trigger: 'item',
      formatter: function (p) {
        var v = p.value;
        return '<b>' + scenes[v[2]].name + '</b><br/>怪物等级：' + v[0] + '–' + v[1] + ' 级';
      }
    },
    grid: { left: 120, right: 40, top: 20, bottom: 44 },
    xAxis: {
      type: 'value',
      min: 0, max: 100,
      name: '怪物等级',
      nameLocation: 'middle',
      nameGap: 28,
      nameTextStyle: { color: muted },
      axisLine: { lineStyle: { color: rule } },
      axisLabel: { color: muted, interval: 9 },
      splitLine: { lineStyle: { color: rule, type: 'dashed' } }
    },
    yAxis: {
      type: 'category',
      data: yCats,
      axisLine: { lineStyle: { color: rule } },
      axisLabel: { color: muted, fontSize: 9, width: 90, overflow: 'truncate' },
      axisTick: { show: false },
      splitLine: { show: true, lineStyle: { color: rule, type: 'dashed', opacity: 0.4 } }
    },
    series: [{
      type: 'custom',
      renderItem: function (params, api) {
        var start = api.coord([api.value(0), api.value(2)]);
        var end = api.coord([api.value(1), api.value(2)]);
        var h = api.size([0, 1])[1] * 0.55;
        return {
          type: 'rect',
          shape: { x: start[0], y: start[1] - h / 2, width: end[0] - start[0], height: h, r: 2 },
          style: { fill: accent, opacity: 0.78 },
          styleEmphasis: { fill: accent2 }
        };
      },
      data: data,
      encode: { x: [0, 1], y: 2 }
    }]
  });
  window.addEventListener('resize', function () { chart.resize(); });
})();
