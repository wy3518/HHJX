(function () {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();
  var red = style.getPropertyValue('--red').trim();

  var fontCN = '"Noto Serif SC","Source Han Serif SC","STZhongsong","SimSun",serif';

  // ---------- Mermaid 初始化（暗色主题） ----------
  if (window.mermaid) {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      securityLevel: 'loose',
      themeVariables: {
        background: bg2,
        primaryColor: '#241d15',
        primaryTextColor: ink,
        primaryBorderColor: accent,
        lineColor: muted,
        secondaryColor: '#1d2420',
        tertiaryColor: '#211b15',
        textColor: ink,
        mainBkg: '#241d15',
        nodeBorder: accent,
        clusterBkg: '#1b1611',
        clusterBorder: rule,
        edgeLabelBackground: bg2,
        fontFamily: fontCN,
        fontSize: '14px'
      }
    });
    mermaid.run({ querySelector: '.mermaid' });
  }

  // ---------- 图 15-1 升级经验曲线 ----------
  var expEl = document.getElementById('chart-exp');
  if (expEl) {
    var levels = [];
    var exps = [];
    for (var n = 1; n <= 99; n++) {
      levels.push(n);
      exps.push(Math.round(45 * Math.pow(n, 2.4)));
    }
    var chartExp = echarts.init(expEl, null, { renderer: 'svg' });
    chartExp.setOption({
      animation: false,
      textStyle: { fontFamily: fontCN },
      grid: { left: 70, right: 30, top: 30, bottom: 50 },
      tooltip: {
        trigger: 'axis',
        appendToBody: true,
        backgroundColor: '#241d15',
        borderColor: accent,
        textStyle: { color: ink, fontFamily: fontCN },
        formatter: function (p) {
          return '等级 ' + p[0].axisValue + '<br/>单级经验需求：' + p[0].value.toLocaleString();
        }
      },
      xAxis: {
        type: 'category',
        name: '等级',
        nameTextStyle: { color: muted },
        data: levels,
        axisLabel: { color: muted, interval: 9 },
        axisLine: { lineStyle: { color: rule } },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'log',
        logBase: 10,
        name: '经验（对数轴）',
        nameTextStyle: { color: muted },
        axisLabel: {
          color: muted,
          formatter: function (v) {
            return v >= 10000 ? (v / 10000) + '万' : v;
          }
        },
        splitLine: { lineStyle: { color: rule, opacity: 0.5 } }
      },
      series: [{
        type: 'line',
        data: exps,
        smooth: true,
        symbol: 'none',
        lineStyle: { color: accent, width: 2.5 },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: accent + '55' },
              { offset: 1, color: accent + '00' }
            ]
          }
        },
        markPoint: {
          symbol: 'circle',
          symbolSize: 8,
          itemStyle: { color: accent2 },
          label: {
            show: true,
            color: ink,
            fontFamily: fontCN,
            formatter: function (p) {
              return p.coord[1] >= 10000 ? (p.coord[1] / 10000).toFixed(1) + '万' : p.coord[1];
            }
          },
          data: [{ coord: [19, exps[19]] }, { coord: [49, exps[49]] }, { coord: [79, exps[79]] }, { coord: [98, exps[98]] }]
        }
      }]
    });
    window.addEventListener('resize', function () { chartExp.resize(); });
  }

  // ---------- 图 15-2 强化成功率与消耗 ----------
  var enhEl = document.getElementById('chart-enhance');
  if (enhEl) {
    var enhLv = [];
    var enhRate = [];
    var enhCost = [];
    var rateTable = { 6: 90, 7: 80, 8: 70, 9: 55, 10: 45, 11: 35, 12: 25, 13: 18, 14: 12, 15: 8 };
    for (var l = 6; l <= 15; l++) {
      enhLv.push('+' + l);
      enhRate.push(rateTable[l]);
      enhCost.push(Math.round(4 * Math.pow(l, 1.6)));
    }
    var chartEnh = echarts.init(enhEl, null, { renderer: 'svg' });
    chartEnh.setOption({
      animation: false,
      textStyle: { fontFamily: fontCN },
      grid: { left: 60, right: 60, top: 40, bottom: 45 },
      legend: {
        data: ['成功率', '单次玄铁消耗'],
        textStyle: { color: muted, fontFamily: fontCN },
        top: 0
      },
      tooltip: {
        trigger: 'axis',
        appendToBody: true,
        backgroundColor: '#241d15',
        borderColor: accent,
        textStyle: { color: ink, fontFamily: fontCN },
        formatter: function (ps) {
          var s = ps[0].axisValue + ' 强化';
          ps.forEach(function (p) {
            s += '<br/>' + p.marker + p.seriesName + '：' + p.value + (p.seriesName === '成功率' ? '%' : ' 块玄铁');
          });
          return s;
        }
      },
      xAxis: {
        type: 'category',
        data: enhLv,
        axisLabel: { color: muted },
        axisLine: { lineStyle: { color: rule } },
        axisTick: { show: false }
      },
      yAxis: [
        {
          type: 'value',
          name: '成功率 %',
          nameTextStyle: { color: muted },
          max: 100,
          axisLabel: { color: muted },
          splitLine: { lineStyle: { color: rule, opacity: 0.5 } }
        },
        {
          type: 'value',
          name: '玄铁（块）',
          nameTextStyle: { color: muted },
          axisLabel: { color: muted },
          splitLine: { show: false }
        }
      ],
      series: [
        {
          name: '成功率',
          type: 'bar',
          data: enhRate,
          barWidth: '45%',
          itemStyle: {
            color: function (p) {
              return p.value >= 50 ? accent : red;
            },
            borderRadius: [3, 3, 0, 0]
          }
        },
        {
          name: '单次玄铁消耗',
          type: 'line',
          yAxisIndex: 1,
          data: enhCost,
          smooth: true,
          symbol: 'circle',
          symbolSize: 7,
          lineStyle: { color: accent2, width: 2.5 },
          itemStyle: { color: accent2 }
        }
      ]
    });
    window.addEventListener('resize', function () { chartEnh.resize(); });
  }

  // ---------- 图 15-3 掉落品质概率 ----------
  var dropEl = document.getElementById('chart-drop');
  if (dropEl) {
    var qualities = ['凡品', '良品', '上品', '珍品', '绝品', '仙品', '神话'];
    var tiers = {
      '普通秘境': [55, 32, 9.5, 2.8, 0.6, 0.1, 0.01],
      '精英秘境': [38, 35, 18, 6.5, 2, 0.45, 0.05],
      '章节 Boss': [18, 25, 28, 18, 7.5, 3, 0.5]
    };
    var tierNames = Object.keys(tiers);
    var dropSeries = tierNames.map(function (t, i) {
      return {
        name: t,
        type: 'bar',
        data: tiers[t],
        barWidth: '22%',
        itemStyle: { color: [accent + 'cc', accent2 + 'cc', red + 'cc'][i], borderRadius: [3, 3, 0, 0] }
      };
    });
    var chartDrop = echarts.init(dropEl, null, { renderer: 'svg' });
    chartDrop.setOption({
      animation: false,
      textStyle: { fontFamily: fontCN },
      grid: { left: 55, right: 25, top: 40, bottom: 45 },
      legend: {
        data: tierNames,
        textStyle: { color: muted, fontFamily: fontCN },
        top: 0
      },
      tooltip: {
        trigger: 'axis',
        appendToBody: true,
        backgroundColor: '#241d15',
        borderColor: accent,
        textStyle: { color: ink, fontFamily: fontCN },
        valueFormatter: function (v) { return v + '%'; }
      },
      xAxis: {
        type: 'category',
        data: qualities,
        axisLabel: { color: ink },
        axisLine: { lineStyle: { color: rule } },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        name: '概率 %',
        nameTextStyle: { color: muted },
        axisLabel: { color: muted },
        splitLine: { lineStyle: { color: rule, opacity: 0.5 } }
      },
      series: dropSeries
    });
    window.addEventListener('resize', function () { chartDrop.resize(); });
  }

  // ---------- 图 7-1 连招加成点伤害分布 ----------
  var comboEl = document.getElementById('chart-combo');
  if (comboEl) {
    var comboHits = [];
    var comboDmg = [];
    var bonusPointList = [7, 10, 15, 20, 27, 35];
    var bonusPoints = {};
    for (var b = 0; b < bonusPointList.length; b++) bonusPoints[bonusPointList[b]] = true;
    for (var h = 1; h <= 40; h++) {
      comboHits.push('第' + h + '段');
      // 基础伤害模拟：每段约 30-50%，加成点 200%
      var base = 35 + (h % 5) * 3;
      comboDmg.push(bonusPoints[h] ? base * 2 : base);
    }
    var chartCombo = echarts.init(comboEl, null, { renderer: 'svg' });
    chartCombo.setOption({
      animation: false,
      textStyle: { fontFamily: fontCN },
      grid: { left: 50, right: 25, top: 35, bottom: 40 },
      tooltip: {
        trigger: 'axis',
        appendToBody: true,
        backgroundColor: '#241d15',
        borderColor: accent,
        textStyle: { color: ink, fontFamily: fontCN },
        formatter: function (p) {
          var v = p[0].value;
          return p[0].name + '<br/>伤害倍率：' + v + '%' + (v >= 60 ? '  ★ 加成点 ×2' : '');
        }
      },
      xAxis: {
        type: 'category',
        data: comboHits,
        axisLabel: { color: muted, interval: 1, fontSize: 10 },
        axisLine: { lineStyle: { color: rule } },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        name: '伤害 %',
        nameTextStyle: { color: muted },
        axisLabel: { color: muted },
        splitLine: { lineStyle: { color: rule, opacity: 0.5 } }
      },
      series: [{
        type: 'bar',
        data: comboDmg,
        barWidth: '60%',
        itemStyle: {
          color: function (p) {
            return p.value >= 60 ? accent : accent2 + '88';
          },
          borderRadius: [3, 3, 0, 0]
        },
        markLine: {
          symbol: 'none',
          silent: true,
          lineStyle: { color: accent, type: 'dashed', opacity: 0.6 },
          data: [{ yAxis: 70, label: { formatter: '加成点 ×2', color: accent, fontSize: 11 } }]
        }
      }]
    });
    window.addEventListener('resize', function () { chartCombo.resize(); });
  }
})();
