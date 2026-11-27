<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import * as echarts from 'echarts';
import { AlertTriangle, ChevronRight } from 'lucide-vue-next';
import { JILIN_GEO_JSON } from '../data/jilinGeo.js';
import { JILIN_CITY_GEO_MAP } from '../data/jilinSubMaps.js';
import {
  calcMapCountyStats,
  calcMapOverlayPoints,
  getCountyGeoJson,
} from '../utils/dashboardCalculations.js';

const props = defineProps({
  projects: { type: Array, required: true },
  cityStats: { type: Array, required: true },
  selectedYear: { type: [String, Number], required: true },
  activeLevel: { type: Number, required: true }, // 1 | 2 | 3
  selectedCity: { type: String, default: null },
  selectedCounty: { type: String, default: null },
});

const emit = defineEmits([
  'select-city',
  'select-county',
  'select-project',
  'go-level',
  'open-rectify-detail',
]);

const chartRef = ref(null);
let chartInstance = null;
const registeredMaps = new Set();

const showSafetyPoints = ref(true);
const showRecorderPoints = ref(true);
const showTownships = ref(true);
const showRectifyPoints = ref(true);

const overlay = computed(() => calcMapOverlayPoints(props.projects));

const summary = computed(() => {
  const totalCount = props.projects.length;
  const totalAreaMu = props.projects.reduce((s, p) => s + p.areaMu, 0);
  const totalInvestmentYi =
    props.projects.reduce((s, p) => s + p.totalInvestment, 0) / 10000;
  const inProgressCount = props.projects.filter((p) => p.status === '施工中').length;
  return {
    totalCount,
    totalAreaMu: Math.round(totalAreaMu * 10) / 10,
    totalInvestmentYi: Math.round(totalInvestmentYi * 100) / 100,
    inProgressCount,
  };
});

function ensureMapRegistered() {
  if (!registeredMaps.has('jilin')) {
    echarts.registerMap('jilin', JILIN_GEO_JSON);
    registeredMaps.add('jilin');
  }

  if (props.activeLevel === 2 && props.selectedCity && JILIN_CITY_GEO_MAP[props.selectedCity]) {
    const key = `city-${props.selectedCity}`;
    if (!registeredMaps.has(key)) {
      echarts.registerMap(key, JILIN_CITY_GEO_MAP[props.selectedCity]);
      registeredMaps.add(key);
    }
    return key;
  }

  if (props.activeLevel === 3 && props.selectedCity && props.selectedCounty) {
    const key = `county-${props.selectedCity}-${props.selectedCounty}`;
    if (!registeredMaps.has(key)) {
      const countyGeo = getCountyGeoJson(props.selectedCity, props.selectedCounty);
      if (countyGeo) {
        echarts.registerMap(key, countyGeo);
        registeredMaps.add(key);
        return key;
      }
    } else {
      return key;
    }
  }

  return 'jilin';
}

function renderMap() {
  if (!chartInstance) return;
  const mapName = ensureMapRegistered();
  const isProvince = props.activeLevel === 1;
  const isCity = props.activeLevel === 2;
  const isCounty = props.activeLevel === 3;

  let mapData = [];
  if (isProvince) {
    mapData = props.cityStats.map((c) => ({
      name: c.name,
      value: c.value,
      totalInvestment: c.totalInvestment,
      areaMu: c.areaMu,
      inProgressCount: c.inProgressCount,
      pendingRectifyCount: c.pendingRectifyCount,
    }));
  } else if (isCity && props.selectedCity) {
    mapData = calcMapCountyStats(props.projects, props.selectedCity);
  } else if (isCounty && props.selectedCounty) {
    mapData = [
      {
        name: props.selectedCounty,
        value: props.projects.length,
        totalInvestment: summary.value.totalInvestmentYi * 10000,
        areaMu: summary.value.totalAreaMu,
        pendingRectifyCount: overlay.value.rectificationPoints.length,
      },
    ];
  }

  const maxProjects = Math.max(1, ...mapData.map((m) => m.value ?? 0));

  const projectScatter = props.projects.map((p) => ({
    name: p.name,
    value: [...p.coords, p.totalInvestment],
    kind: 'project',
    projectId: p.id,
    city: p.city,
    county: p.county,
    status: p.status,
    areaMu: p.areaMu,
    progressPercent: p.progressPercent,
    itemStyle: {
      color:
        p.status === '施工中'
          ? '#38BDF8'
          : p.status === '待验收'
            ? '#F59E0B'
            : '#10B981',
      borderColor: '#08101E',
      borderWidth: 1.5,
    },
  }));

  const safetyScatter = showSafetyPoints.value
    ? overlay.value.safetyPoints.map((sp) => ({
        name: sp.name,
        value: [...sp.coords, 1],
        kind: 'safety',
        township: sp.township,
        status: sp.status,
        detail: sp.detail,
        projectName: sp.projectName,
        itemStyle: {
          color: sp.status === '待整改' ? '#F43F5E' : '#FBBF24',
          borderColor: '#08101E',
          borderWidth: 1.2,
        },
      }))
    : [];

  const recorderScatter = showRecorderPoints.value
    ? overlay.value.recorderPoints.map((rp) => ({
        name: rp.name,
        value: [...rp.coords, 1],
        kind: 'recorder',
        township: rp.township,
        online: rp.online,
        deviceCode: rp.deviceCode,
        projectName: rp.projectName,
        itemStyle: {
          color: rp.online ? '#2DD4BF' : '#64748B',
          borderColor: '#08101E',
          borderWidth: 1.2,
        },
      }))
    : [];

  const townshipScatter =
    (isCity || isCounty) && showTownships.value
      ? overlay.value.townships.map((tw) => ({
          name: tw.name,
          value: [...tw.coords, tw.areaMu],
          kind: 'township',
          county: tw.county,
          areaMu: tw.areaMu,
          progressPercent: tw.progressPercent,
          itemStyle: {
            color: '#A78BFA',
            borderColor: '#08101E',
            borderWidth: 1.5,
          },
        }))
      : [];

  const rectifyScatter =
    (isCity || isCounty) && showRectifyPoints.value
      ? overlay.value.rectificationPoints.map((rect) => ({
          name: `${rect.township} · ${rect.title}`,
          value: [...rect.coords, 1],
          kind: 'rectify',
          source: rect.source,
          detail: rect.detail,
          county: rect.county,
          township: rect.township,
          itemStyle: {
            color: '#F43F5E',
            borderColor: '#FFE4E6',
            borderWidth: 1.5,
          },
        }))
      : [];

  const series = [
    {
      name: isProvince ? '地市分布' : isCity ? '区县分布' : '县域边界',
      type: 'map',
      geoIndex: 0,
      data: mapData,
    },
    {
      name: '项目节点',
      type: 'scatter',
      coordinateSystem: 'geo',
      symbol: 'circle',
      symbolSize: isProvince ? 10 : 12,
      data: projectScatter,
      zlevel: 2,
    },
    {
      name: '安全措施点位',
      type: 'scatter',
      coordinateSystem: 'geo',
      symbol: 'triangle',
      symbolSize: 10,
      data: safetyScatter,
      zlevel: 3,
    },
    {
      name: '记录仪在线点位',
      type: 'scatter',
      coordinateSystem: 'geo',
      symbol: 'rect',
      symbolSize: 8,
      data: recorderScatter,
      zlevel: 3,
    },
  ];

  if (isCity || isCounty) {
    series.push({
      name: '乡镇点位',
      type: 'scatter',
      coordinateSystem: 'geo',
      symbol: 'pin',
      symbolSize: 18,
      label: {
        show: true,
        formatter: '{b}',
        position: 'top',
        color: '#E2E8F0',
        fontSize: 10,
        backgroundColor: 'rgba(8, 16, 30, 0.78)',
        padding: [2, 4],
        borderRadius: 3,
      },
      data: townshipScatter,
      zlevel: 4,
    });

    if (rectifyScatter.length > 0) {
      series.push({
        name: '待整改提示点位',
        type: 'effectScatter',
        coordinateSystem: 'geo',
        symbolSize: 12,
        showEffectOn: 'render',
        rippleEffect: {
          brushType: 'stroke',
          scale: 3.2,
          period: 4,
        },
        data: rectifyScatter,
        zlevel: 5,
      });
    }
  }

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(11, 20, 38, 0.96)',
      borderColor: '#334155',
      borderWidth: 1,
      textStyle: { color: '#F1F5F9', fontSize: 12 },
      formatter: (params) => {
        const d = params.data;
        if (!d) return params.name ?? '';

        if (d.kind === 'project') {
          const valArr = Array.isArray(d.value) ? d.value : [0, 0, 0];
          return [
            `<div style="font-weight:600;color:#F8FAFC;margin-bottom:3px">${params.name}</div>`,
            `<div style="color:#94A3B8">所属区县：${d.county} · 状态：<span style="color:#38BDF8">${d.status}</span></div>`,
            `<div style="color:#CBD5E1">总投资：<b>${valArr[2]}</b> 万元 · 规模：<b>${d.areaMu}</b> 万亩</div>`,
            `<div style="color:#94A3B8">施工进度：${d.progressPercent}%</div>`,
          ].join('');
        }
        if (d.kind === 'safety') {
          return [
            `<div style="font-weight:600;color:#FBBF24;margin-bottom:3px">安全措施点位 · ${params.name}</div>`,
            `<div style="color:#CBD5E1">乡镇：${d.township} · 状态：<span style="color:${d.status === '待整改' ? '#F43F5E' : '#10B981'}">${d.status}</span></div>`,
            `<div style="color:#94A3B8">${d.detail}</div>`,
          ].join('');
        }
        if (d.kind === 'recorder') {
          return [
            `<div style="font-weight:600;color:#2DD4BF;margin-bottom:3px">记录仪点位 · ${params.name}</div>`,
            `<div style="color:#CBD5E1">设备编码：${d.deviceCode} · 状态：${d.online ? '在线回传' : '离线'}</div>`,
            `<div style="color:#94A3B8">所属乡镇：${d.township}</div>`,
          ].join('');
        }
        if (d.kind === 'township') {
          return [
            `<div style="font-weight:600;color:#A78BFA;margin-bottom:3px">${d.county} · ${params.name}</div>`,
            `<div style="color:#CBD5E1">建设规模：<b>${d.areaMu}</b> 万亩 · 进度：<b>${d.progressPercent}%</b></div>`,
          ].join('');
        }
        if (d.kind === 'rectify') {
          return [
            `<div style="font-weight:600;color:#FB7185;margin-bottom:3px">待整改提示 · ${d.source}</div>`,
            `<div style="color:#F8FAFC">${params.name}</div>`,
            `<div style="color:#CBD5E1">${d.detail}</div>`,
          ].join('');
        }

        return [
          `<div style="font-weight:600;color:#F8FAFC;margin-bottom:3px">${params.name}</div>`,
          `<div style="color:#CBD5E1">项目数量：<b>${d.value ?? 0}</b> 个</div>`,
          `<div style="color:#CBD5E1">总投资：<b>${d.totalInvestment ?? 0}</b> 万元 · <b>${d.areaMu ?? 0}</b> 万亩</div>`,
          d.pendingRectifyCount > 0
            ? `<div style="color:#FB7185;margin-top:2px">待整改提醒：${d.pendingRectifyCount} 项</div>`
            : `<div style="color:#64748B;font-size:11px;margin-top:2px">${isProvince ? '点击下钻至地市二级' : isCity ? '点击进入县级三级地图' : '县域内详细点位视图'}</div>`,
        ].join('');
      },
    },
    visualMap: {
      show: !isCounty,
      min: 0,
      max: maxProjects,
      left: 12,
      bottom: 12,
      itemWidth: 10,
      itemHeight: 64,
      text: ['项目多', '项目少'],
      textStyle: { color: '#94A3B8', fontSize: 10 },
      inRange: {
        color: ['#11223E', '#163963', '#1D568E', '#0284C7'],
      },
    },
    geo: {
      map: mapName,
      roam: true,
      layoutCenter: ['50%', '50%'],
      layoutSize: isCounty ? '88%' : '94%',
      label: {
        show: true,
        color: '#CBD5E1',
        fontSize: isCounty ? 12 : 10,
      },
      emphasis: {
        label: { show: true, color: '#FFFFFF', fontWeight: 600 },
        itemStyle: {
          areaColor: '#0369A1',
          borderColor: '#38BDF8',
          borderWidth: 1.5,
        },
      },
      itemStyle: {
        areaColor: '#132440',
        borderColor: '#2B4C7E',
        borderWidth: isCounty ? 1.5 : 1,
      },
    },
    series,
  };

  chartInstance.setOption(option, true);
}

const handleResize = () => {
  chartInstance?.resize();
};

onMounted(() => {
  if (!chartRef.value) return;
  chartInstance = echarts.init(chartRef.value);
  chartInstance.on('click', (params) => {
    const d = params.data;
    if (d?.kind === 'project' && d.projectId) {
      const found = props.projects.find((proj) => proj.id === d.projectId);
      if (found) {
        emit('select-project', found);
      }
      return;
    }
    if (d?.kind === 'rectify') {
      emit('open-rectify-detail');
      return;
    }
    if (params.seriesType === 'map' && params.name) {
      if (props.activeLevel === 1) {
        emit('select-city', params.name);
      } else if (props.activeLevel === 2) {
        emit('select-county', params.name);
      }
    }
  });
  renderMap();
  window.addEventListener('resize', handleResize);
});

watch(
  () => [
    props.projects,
    props.cityStats,
    props.activeLevel,
    props.selectedCity,
    props.selectedCounty,
    showSafetyPoints.value,
    showRecorderPoints.value,
    showTownships.value,
    showRectifyPoints.value,
  ],
  () => {
    renderMap();
  },
  { deep: true }
);

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  chartInstance?.dispose();
  chartInstance = null;
});
</script>

<template>
  <section
    data-testid="jilin-map-panel"
    class="flex flex-col flex-1 min-h-[380px] bg-[#0E182B] border border-slate-800/90 rounded-lg overflow-hidden"
  >
    <!-- Top 4-metric Summary Bar -->
    <div class="grid grid-cols-2 sm:grid-cols-4 border-b border-slate-800/90 bg-[#111F38]/75 shrink-0">
      <div class="px-3.5 py-2 border-b sm:border-b-0 sm:border-r border-slate-800/80">
        <div class="text-[11px] text-slate-400">
          {{ selectedYear === 'ALL' ? '累计项目总数' : `${selectedYear}年项目数` }}
        </div>
        <div class="mt-0.5 flex items-baseline gap-1">
          <span class="text-lg font-bold font-mono-num text-slate-50">
            {{ summary.totalCount }}
          </span>
          <span class="text-[11px] text-slate-400">个</span>
        </div>
      </div>
      <div class="px-3.5 py-2 border-b sm:border-b-0 sm:border-r border-slate-800/80">
        <div class="text-[11px] text-slate-400">建设总规模</div>
        <div class="mt-0.5 flex items-baseline gap-1">
          <span class="text-lg font-bold font-mono-num text-emerald-400">
            {{ summary.totalAreaMu }}
          </span>
          <span class="text-[11px] text-slate-400">万亩</span>
        </div>
      </div>
      <div class="px-3.5 py-2 border-r border-slate-800/80">
        <div class="text-[11px] text-slate-400">投资项目总金额</div>
        <div class="mt-0.5 flex items-baseline gap-1">
          <span class="text-lg font-bold font-mono-num text-sky-400">
            {{ summary.totalInvestmentYi }}
          </span>
          <span class="text-[11px] text-slate-400">亿元</span>
        </div>
      </div>
      <div class="px-3.5 py-2">
        <div class="text-[11px] text-slate-400">进行中项目</div>
        <div class="mt-0.5 flex items-baseline gap-1">
          <span class="text-lg font-bold font-mono-num text-amber-400">
            {{ summary.inProgressCount }}
          </span>
          <span class="text-[11px] text-slate-400">个</span>
        </div>
      </div>
    </div>

    <!-- Breadcrumb & Layer Toggles -->
    <div class="flex flex-wrap items-center justify-between gap-2 px-3.5 py-1.5 border-b border-slate-800/60 bg-[#0C1628] text-[11px] shrink-0">
      <div class="flex items-center gap-1 text-slate-300">
        <button
          type="button"
          :class="[
            'hover:text-sky-300 transition-colors cursor-pointer',
            activeLevel === 1 ? 'font-semibold text-sky-400' : 'text-slate-400',
          ]"
          @click="emit('go-level', 1)"
        >
          吉林省（一级）
        </button>
        <template v-if="activeLevel >= 2 && selectedCity">
          <ChevronRight class="w-3 h-3 text-slate-500" aria-hidden="true" />
          <button
            type="button"
            :class="[
              'hover:text-sky-300 transition-colors cursor-pointer',
              activeLevel === 2 ? 'font-semibold text-sky-400' : 'text-slate-400',
            ]"
            @click="emit('go-level', 2)"
          >
            {{ selectedCity }}（二级）
          </button>
        </template>
        <template v-if="activeLevel === 3 && selectedCounty">
          <ChevronRight class="w-3 h-3 text-slate-500" aria-hidden="true" />
          <span class="font-semibold text-emerald-400">
            {{ selectedCounty }}（三级县域）
          </span>
        </template>
      </div>

      <!-- 图层打点开关 -->
      <div class="flex flex-wrap items-center gap-2 shrink-0">
        <button
          type="button"
          :class="[
            'inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] transition-colors cursor-pointer',
            showSafetyPoints
              ? 'bg-amber-950/60 border-amber-600/60 text-amber-300'
              : 'bg-slate-900 border-slate-700 text-slate-500',
          ]"
          @click="showSafetyPoints = !showSafetyPoints"
        >
          <span class="w-2 h-2 rounded-full bg-amber-400" aria-hidden="true" />
          <span>安全措施点位 ({{ overlay.counts.safetyTotal }})</span>
        </button>

        <button
          type="button"
          :class="[
            'inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] transition-colors cursor-pointer',
            showRecorderPoints
              ? 'bg-teal-950/60 border-teal-600/60 text-teal-300'
              : 'bg-slate-900 border-slate-700 text-slate-500',
          ]"
          @click="showRecorderPoints = !showRecorderPoints"
        >
          <span class="w-2 h-2 rounded-sm bg-teal-400" aria-hidden="true" />
          <span>记录仪在线 ({{ overlay.counts.onlineRecorderCount }})</span>
        </button>

        <button
          v-if="activeLevel >= 2"
          type="button"
          :class="[
            'inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] transition-colors cursor-pointer',
            showTownships
              ? 'bg-violet-950/60 border-violet-600/60 text-violet-300'
              : 'bg-slate-900 border-slate-700 text-slate-500',
          ]"
          @click="showTownships = !showTownships"
        >
          <span class="w-2 h-2 rounded-full bg-violet-400" aria-hidden="true" />
          <span>乡镇 ({{ overlay.counts.townshipTotal }})</span>
        </button>

        <button
          v-if="activeLevel >= 2 && overlay.counts.rectificationTotal > 0"
          type="button"
          :class="[
            'inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] transition-colors cursor-pointer',
            showRectifyPoints
              ? 'bg-rose-950/70 border-rose-500/70 text-rose-300'
              : 'bg-slate-900 border-slate-700 text-slate-500',
          ]"
          @click="showRectifyPoints = !showRectifyPoints"
        >
          <span class="w-2 h-2 rounded-full bg-rose-500" aria-hidden="true" />
          <span>待整改 ({{ overlay.counts.rectificationTotal }})</span>
        </button>
      </div>
    </div>

    <!-- 二级/三级页面：有待整改数据时主动提示 -->
    <div
      v-if="activeLevel >= 2 && overlay.rectificationPoints.length > 0"
      data-testid="map-rectify-alert"
      class="flex items-center justify-between gap-2 px-3.5 py-1.5 bg-rose-950/65 border-b border-rose-600/50 text-[11px] text-rose-200 shrink-0"
    >
      <div class="flex items-center gap-1.5 min-w-0">
        <AlertTriangle class="w-3.5 h-3.5 text-rose-400 shrink-0" aria-hidden="true" />
        <span class="truncate">
          待整改提示：当前区域存在 <strong>{{ overlay.rectificationPoints.length }}</strong> 处待整改点位
          （{{ overlay.rectificationPoints.map((r) => `${r.township}:${r.title}`).slice(0, 2).join('；') }}）
        </span>
      </div>
      <button
        type="button"
        class="text-rose-300 hover:text-white underline whitespace-nowrap shrink-0 cursor-pointer"
        @click="emit('open-rectify-detail')"
      >
        查看整改台账
      </button>
    </div>

    <!-- ECharts Map Viewport -->
    <div class="relative flex-1 min-h-[260px]">
      <div
        ref="chartRef"
        data-testid="echarts-jilin-map"
        class="w-full h-full min-h-[260px]"
      />
    </div>

    <!-- Bottom Quick Access Bar -->
    <div class="border-t border-slate-800/80 bg-[#0B1424] px-3.5 py-1.5 shrink-0">
      <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span class="text-[11px] text-slate-400 whitespace-nowrap shrink-0">
          {{ activeLevel === 1 ? '重点项目：' : activeLevel === 2 ? `${selectedCity}项目：` : `${selectedCounty}项目：` }}
        </span>
        <span v-if="projects.length === 0" class="text-[11px] text-slate-500">
          当前筛选条件下暂无项目
        </span>
        <button
          v-for="p in projects"
          :key="p.id"
          type="button"
          class="text-[11px] font-medium text-sky-300 hover:text-sky-200 hover:underline transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          @click="emit('select-project', p)"
        >
          {{ p.county }} · {{ p.name.replace(/^\d+年/, '') }}
        </button>
      </div>
    </div>
  </section>
</template>
