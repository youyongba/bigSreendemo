<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import * as echarts from 'echarts';
import { JILIN_GEO_JSON } from '../data/jilinGeo.js';

const props = defineProps({
  projects: { type: Array, required: true },
  cityStats: { type: Array, required: true },
  selectedYear: { type: [String, Number], required: true },
  selectedCity: { type: String, default: null },
});

const emit = defineEmits(['select-city', 'select-project']);

const chartRef = ref(null);
let chartInstance = null;
let mapRegistered = false;

const summary = computed(() => {
  const totalCount = props.projects.length;
  const totalAreaMu = props.projects.reduce((s, p) => s + p.areaMu, 0);
  const totalInvestmentYi = props.projects.reduce((s, p) => s + p.totalInvestment, 0) / 10000;
  const inProgressCount = props.projects.filter((p) => p.status === '施工中').length;
  return {
    totalCount,
    totalAreaMu: Math.round(totalAreaMu * 10) / 10,
    totalInvestmentYi: Math.round(totalInvestmentYi * 100) / 100,
    inProgressCount,
  };
});

function renderMap() {
  if (!chartInstance) return;

  const scatterData = props.projects.map((p) => ({
    name: p.name,
    value: [...p.coords, p.totalInvestment],
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

  const mapData = props.cityStats.map((c) => ({
    name: c.name,
    value: c.value,
    totalInvestment: c.totalInvestment,
    areaMu: c.areaMu,
    inProgressCount: c.inProgressCount,
    handedOverCount: c.handedOverCount,
    selected: props.selectedCity === c.name,
  }));

  const maxProjects = Math.max(1, ...props.cityStats.map((c) => c.value));

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(11, 20, 38, 0.96)',
      borderColor: '#334155',
      borderWidth: 1,
      textStyle: {
        color: '#F1F5F9',
        fontSize: 12,
      },
      formatter: (params) => {
        if (params.seriesType === 'effectScatter' || params.seriesType === 'scatter') {
          const d = params.data;
          const valArr = Array.isArray(d?.value) ? d.value : [0, 0, 0];
          return [
            `<div style="font-weight:600;margin-bottom:4px;color:#F8FAFC">${params.name}</div>`,
            `<div style="color:#94A3B8">所属区县：${d?.county ?? '-'} · 状态：<span style="color:#38BDF8">${d?.status ?? '-'}</span></div>`,
            `<div style="color:#CBD5E1;margin-top:2px">总投资：<b>${valArr[2] ?? 0}</b> 万元 · 规模：<b>${d?.areaMu ?? 0}</b> 万亩</div>`,
            `<div style="color:#94A3B8;margin-top:2px">施工进度：${d?.progressPercent ?? 0}%（点击查看标段档案）</div>`,
          ].join('');
        }
        const d = params.data;
        if (!d) return params.name ?? '';
        return [
          `<div style="font-weight:600;margin-bottom:4px;color:#F8FAFC">${params.name}</div>`,
          `<div style="color:#CBD5E1">项目数量：<b>${typeof d.value === 'number' ? d.value : 0}</b> 个（在建 ${d.inProgressCount ?? 0} · 已移交 ${d.handedOverCount ?? 0}）</div>`,
          `<div style="color:#CBD5E1">总投资额：<b>${d.totalInvestment ?? 0}</b> 万元</div>`,
          `<div style="color:#CBD5E1">建设规模：<b>${d.areaMu ?? 0}</b> 万亩</div>`,
          `<div style="color:#64748B;font-size:11px;margin-top:3px">点击地市筛选全域面板</div>`,
        ].join('');
      },
    },
    visualMap: {
      show: true,
      min: 0,
      max: maxProjects,
      left: 12,
      bottom: 12,
      itemWidth: 10,
      itemHeight: 72,
      text: ['项目多', '项目少'],
      textStyle: { color: '#94A3B8', fontSize: 10 },
      inRange: {
        color: ['#11223E', '#163963', '#1D568E', '#0284C7'],
      },
    },
    geo: {
      map: 'jilin',
      roam: true,
      zoom: 1.16,
      center: [126.4, 43.65],
      selectedMode: 'single',
      label: {
        show: true,
        color: '#CBD5E1',
        fontSize: 10,
      },
      emphasis: {
        label: {
          show: true,
          color: '#FFFFFF',
          fontWeight: 600,
        },
        itemStyle: {
          areaColor: '#0369A1',
          borderColor: '#38BDF8',
          borderWidth: 1.5,
        },
      },
      select: {
        label: {
          show: true,
          color: '#FFFFFF',
          fontWeight: 600,
        },
        itemStyle: {
          areaColor: '#0284C7',
          borderColor: '#7DD3FC',
          borderWidth: 1.8,
        },
      },
      itemStyle: {
        areaColor: '#132440',
        borderColor: '#2B4C7E',
        borderWidth: 1,
      },
    },
    series: [
      {
        name: '地市项目分布',
        type: 'map',
        geoIndex: 0,
        data: mapData,
      },
      {
        name: '高标准农田项目',
        type: 'effectScatter',
        coordinateSystem: 'geo',
        data: scatterData,
        symbolSize: 10,
        showEffectOn: 'render',
        rippleEffect: {
          brushType: 'stroke',
          scale: 2.6,
          period: 5,
        },
        zlevel: 2,
      },
    ],
  };

  chartInstance.setOption(option, true);
}

const handleResize = () => {
  chartInstance?.resize();
};

onMounted(() => {
  if (!chartRef.value) return;
  if (!mapRegistered) {
    echarts.registerMap('jilin', JILIN_GEO_JSON);
    mapRegistered = true;
  }
  chartInstance = echarts.init(chartRef.value);
  chartInstance.on('click', (params) => {
    if (params.seriesType === 'effectScatter' && params.data?.projectId) {
      const found = props.projects.find((proj) => proj.id === params.data.projectId);
      if (found) {
        emit('select-project', found);
      }
      return;
    }
    if (params.seriesType === 'map' && params.name) {
      emit('select-city', props.selectedCity === params.name ? null : params.name);
    }
  });
  renderMap();
  window.addEventListener('resize', handleResize);
});

watch(
  () => [props.projects, props.cityStats, props.selectedCity],
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
    class="flex flex-col h-full min-h-[480px] bg-[#0E182B] border border-slate-800/90 rounded-lg overflow-hidden"
  >
    <!-- Top 4-metric Summary Bar -->
    <div class="grid grid-cols-2 sm:grid-cols-4 border-b border-slate-800/90 bg-[#111F38]/75 shrink-0">
      <div class="px-4 py-2.5 border-b sm:border-b-0 sm:border-r border-slate-800/80">
        <div class="text-[11px] text-slate-400">
          {{ selectedYear === 'ALL' ? '累计项目总数' : `${selectedYear}年项目数` }}
        </div>
        <div class="mt-0.5 flex items-baseline gap-1">
          <span class="text-xl font-bold font-mono-num text-slate-50">
            {{ summary.totalCount }}
          </span>
          <span class="text-[11px] text-slate-400">个</span>
        </div>
      </div>
      <div class="px-4 py-2.5 border-b sm:border-b-0 sm:border-r border-slate-800/80">
        <div class="text-[11px] text-slate-400">建设总规模</div>
        <div class="mt-0.5 flex items-baseline gap-1">
          <span class="text-xl font-bold font-mono-num text-emerald-400">
            {{ summary.totalAreaMu }}
          </span>
          <span class="text-[11px] text-slate-400">万亩</span>
        </div>
      </div>
      <div class="px-4 py-2.5 border-r border-slate-800/80">
        <div class="text-[11px] text-slate-400">投资项目总金额</div>
        <div class="mt-0.5 flex items-baseline gap-1">
          <span class="text-xl font-bold font-mono-num text-sky-400">
            {{ summary.totalInvestmentYi }}
          </span>
          <span class="text-[11px] text-slate-400">亿元</span>
        </div>
      </div>
      <div class="px-4 py-2.5">
        <div class="text-[11px] text-slate-400">进行中项目</div>
        <div class="mt-0.5 flex items-baseline gap-1">
          <span class="text-xl font-bold font-mono-num text-amber-400">
            {{ summary.inProgressCount }}
          </span>
          <span class="text-[11px] text-slate-400">个</span>
        </div>
      </div>
    </div>

    <!-- Map Sub-header -->
    <div class="flex items-center justify-between gap-2 px-3.5 py-1.5 border-b border-slate-800/60 bg-[#0C1628] text-[11px] text-slate-400 shrink-0">
      <div class="flex items-center gap-2">
        <span class="font-medium text-slate-200">
          吉林省高标准农田空间分布图
        </span>
        <span aria-hidden="true">·</span>
        <span>
          {{ selectedCity ? `当前筛选：${selectedCity}` : '点击地市联动过滤，点击标点查看项目档案' }}
        </span>
      </div>
      <div class="flex items-center gap-3 shrink-0">
        <span class="inline-flex items-center gap-1">
          <span class="w-2 h-2 rounded-full bg-sky-400 inline-block" aria-hidden="true" />
          <span>施工中</span>
        </span>
        <span class="inline-flex items-center gap-1">
          <span class="w-2 h-2 rounded-full bg-amber-400 inline-block" aria-hidden="true" />
          <span>待验收</span>
        </span>
        <span class="inline-flex items-center gap-1">
          <span class="w-2 h-2 rounded-full bg-emerald-400 inline-block" aria-hidden="true" />
          <span>已验收/移交</span>
        </span>
      </div>
    </div>

    <!-- ECharts Map Viewport -->
    <div class="relative flex-1 min-h-[340px]">
      <div
        ref="chartRef"
        data-testid="echarts-jilin-map"
        class="w-full h-full min-h-[340px]"
      />
    </div>

    <!-- Bottom Project Quick-Access Bar -->
    <div class="border-t border-slate-800/80 bg-[#0B1424] px-3.5 py-2 shrink-0">
      <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span class="text-[11px] text-slate-400 whitespace-nowrap shrink-0">
          项目直达：
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
          {{ p.county }}({{ p.status }})
        </button>
      </div>
    </div>
  </section>
</template>
