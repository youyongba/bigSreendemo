<script setup>
import { onBeforeUnmount, ref } from 'vue';
import { Banknote, CircleDot, RotateCcw, Square, Video } from 'lucide-vue-next';

const props = defineProps({
  activeRole: { type: String, required: true }, // 'province' | 'city' | 'county'
  activeLevel: { type: Number, required: true }, // 1 | 2 | 3
  selectedYear: { type: [String, Number], required: true },
  selectedCity: { type: String, default: null },
  selectedCounty: { type: String, default: null },
  level3Projects: { type: Array, default: () => [] },
  activeProjectId: { type: String, default: null },
  townshipOptions: { type: Array, default: () => [] },
  sectionOptions: { type: Array, default: () => [] },
  categoryOptions: { type: Array, default: () => [] },
  level3Filters: { type: Object, required: true },
});

const emit = defineEmits([
  'select-role',
  'select-year',
  'go-back-province',
  'go-back-city',
  'open-disbursement',
  'select-project-id',
  'update-level3-filter',
  'reset-level3-filters',
]);

const ROLE_OPTIONS = [
  { value: 'province', label: '省级角色（一级）' },
  { value: 'city', label: '市级角色（二级）' },
  { value: 'county', label: '县级角色（三级）' },
];

const YEAR_OPTIONS = [
  { value: 'ALL', label: '全部年份' },
  { value: 2023, label: '2023年' },
  { value: 2024, label: '2024年' },
  { value: 2025, label: '2025年' },
  { value: 2026, label: '2026年' },
];

// 录屏状态
const isRecording = ref(false);
const recordSeconds = ref(0);
const recordNotice = ref('');
let mediaRecorder = null;
let activeStream = null;
let recordedChunks = [];
let recordTimer = null;

function formatDuration(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2, '0');
  const s = String(sec % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function cleanupRecording() {
  if (recordTimer) {
    clearInterval(recordTimer);
    recordTimer = null;
  }
  if (activeStream) {
    activeStream.getTracks().forEach((t) => t.stop());
    activeStream = null;
  }
  isRecording.value = false;
}

async function toggleScreenRecording() {
  recordNotice.value = '';
  if (isRecording.value && mediaRecorder) {
    mediaRecorder.stop();
    return;
  }

  if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
    recordNotice.value = '当前浏览器环境不支持屏幕录制接口';
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: 30 },
      audio: false,
    });
    activeStream = stream;
    recordedChunks = [];

    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm';
    mediaRecorder = new MediaRecorder(stream, { mimeType });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `吉农全档录屏_${new Date().toISOString().slice(0, 10)}.webm`;
      a.click();
      URL.revokeObjectURL(url);
      cleanupRecording();
      recordNotice.value = '录屏已保存为 .webm 视频文件';
    };

    stream.getVideoTracks()[0]?.addEventListener('ended', () => {
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      } else {
        cleanupRecording();
      }
    });

    recordSeconds.value = 0;
    isRecording.value = true;
    mediaRecorder.start(500);
    recordTimer = setInterval(() => {
      recordSeconds.value += 1;
    }, 1000);
  } catch {
    cleanupRecording();
    recordNotice.value = '已取消屏幕共享或浏览器未授予录屏权限';
  }
}

onBeforeUnmount(() => {
  cleanupRecording();
});
</script>

<template>
  <header class="bg-[#0B1426] border-b border-slate-800 shrink-0">
    <!-- 主顶栏 -->
    <div class="flex flex-wrap items-center justify-between gap-3 px-4 py-2">
      <!-- Zone 1: 品牌名称 + 角色视角切换 -->
      <div class="flex items-center gap-3 min-w-0 shrink-0">
        <div class="flex items-baseline gap-2">
          <h1 class="text-lg font-bold tracking-wider text-slate-50 whitespace-nowrap shrink-0">
            吉农全档
          </h1>
          <span class="hidden md:inline text-xs font-medium text-slate-400 whitespace-nowrap shrink-0">
            吉林省高标准农田建设全档案大屏
          </span>
        </div>

        <!-- 角色层级切换 -->
        <div
          role="group"
          aria-label="管理角色层级切换"
          class="flex items-center gap-0.5 p-0.5 bg-[#08101E] border border-slate-800 rounded-md"
        >
          <button
            v-for="role in ROLE_OPTIONS"
            :key="role.value"
            type="button"
            :data-testid="`role-btn-${role.value}`"
            :aria-pressed="activeRole === role.value"
            :class="[
              'px-2.5 py-1 text-[11px] font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer',
              activeRole === role.value
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70',
            ]"
            @click="emit('select-role', role.value)"
          >
            {{ role.label }}
          </button>
        </div>
      </div>

      <!-- Zone 2: 年份拆分 -->
      <nav
        aria-label="项目年份拆分"
        class="flex items-center gap-1 p-0.5 bg-[#08101E] border border-slate-800 rounded-md"
      >
        <button
          v-for="opt in YEAR_OPTIONS"
          :key="String(opt.value)"
          type="button"
          :aria-pressed="selectedYear === opt.value"
          :class="[
            'px-2.5 py-1 text-[11px] font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer',
            selectedYear === opt.value
              ? 'bg-sky-600 text-white'
              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70',
          ]"
          @click="emit('select-year', opt.value)"
        >
          {{ opt.label }}
        </button>
      </nav>

      <!-- Zone 3: 区域返回 + 标段拨付 + 录屏功能 -->
      <div class="flex items-center gap-2 shrink-0">
        <button
          v-if="activeLevel === 3 && selectedCity"
          type="button"
          class="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-sky-300 bg-sky-950/60 border border-sky-700/50 rounded-md hover:bg-sky-900/60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          @click="emit('go-back-city')"
        >
          <RotateCcw class="w-3 h-3" aria-hidden="true" />
          <span>返回{{ selectedCity }}</span>
        </button>
        <button
          v-if="activeLevel >= 2"
          type="button"
          class="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-sky-300 bg-sky-950/60 border border-sky-700/50 rounded-md hover:bg-sky-900/60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          @click="emit('go-back-province')"
        >
          <RotateCcw class="w-3 h-3" aria-hidden="true" />
          <span>返回全省</span>
        </button>

        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          @click="emit('open-disbursement')"
        >
          <Banknote class="w-3.5 h-3.5" aria-hidden="true" />
          <span>标段拨付录入</span>
        </button>

        <!-- 录屏功能按钮（全层级保留，三级页重点保留） -->
        <button
          type="button"
          data-testid="screen-record-btn"
          :class="[
            'inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer',
            isRecording
              ? 'bg-rose-600 border-rose-500 text-white hover:bg-rose-500'
              : 'bg-[#111F38] border-slate-700 text-slate-200 hover:border-sky-500 hover:text-sky-300',
          ]"
          @click="toggleScreenRecording"
        >
          <Square v-if="isRecording" class="w-3 h-3 fill-current" aria-hidden="true" />
          <CircleDot v-if="isRecording" class="w-3 h-3 text-rose-200" aria-hidden="true" />
          <Video v-else class="w-3.5 h-3.5 text-sky-400" aria-hidden="true" />
          <span>
            {{ isRecording ? `停止录屏 (${formatDuration(recordSeconds)})` : '开始录屏' }}
          </span>
        </button>
      </div>
    </div>

    <!-- 录屏提示消息 -->
    <div
      v-if="recordNotice"
      class="px-4 py-1 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-[11px] text-amber-300"
    >
      <span>{{ recordNotice }}</span>
      <button
        type="button"
        class="text-slate-400 hover:text-slate-200 cursor-pointer"
        @click="recordNotice = ''"
      >
        关闭提示
      </button>
    </div>

    <!-- 三级页面顶部筛选栏（参考高标三级页） -->
    <div
      v-if="activeLevel === 3"
      data-testid="level3-filter-bar"
      class="px-4 py-1.5 bg-[#091223] border-t border-slate-800/90 flex flex-wrap items-center justify-between gap-2 text-xs"
    >
      <div class="flex flex-wrap items-center gap-2.5">
        <span class="text-[11px] font-semibold text-sky-300 whitespace-nowrap shrink-0">
          县级档案筛选（{{ selectedCity }} · {{ selectedCounty }}）：
        </span>

        <div class="flex items-center gap-1.5">
          <label for="l3-project" class="text-[11px] text-slate-400 whitespace-nowrap">项目</label>
          <select
            id="l3-project"
            :value="activeProjectId ?? ''"
            class="px-2 py-0.5 text-[11px] bg-[#08101E] text-slate-100 border border-slate-700 rounded focus:outline-none focus:border-sky-500 max-w-[200px]"
            @change="emit('select-project-id', $event.target.value)"
          >
            <option v-for="proj in level3Projects" :key="proj.id" :value="proj.id">
              {{ proj.name }}
            </option>
          </select>
        </div>

        <div class="flex items-center gap-1.5">
          <label for="l3-township" class="text-[11px] text-slate-400 whitespace-nowrap">乡镇</label>
          <select
            id="l3-township"
            :value="level3Filters.township"
            class="px-2 py-0.5 text-[11px] bg-[#08101E] text-slate-100 border border-slate-700 rounded focus:outline-none focus:border-sky-500"
            @change="emit('update-level3-filter', 'township', $event.target.value)"
          >
            <option value="ALL">全部乡镇</option>
            <option v-for="tw in townshipOptions" :key="tw" :value="tw">
              {{ tw }}
            </option>
          </select>
        </div>

        <div class="flex items-center gap-1.5">
          <label for="l3-section" class="text-[11px] text-slate-400 whitespace-nowrap">标段</label>
          <select
            id="l3-section"
            :value="level3Filters.sectionId"
            class="px-2 py-0.5 text-[11px] bg-[#08101E] text-slate-100 border border-slate-700 rounded focus:outline-none focus:border-sky-500 max-w-[180px]"
            @change="emit('update-level3-filter', 'sectionId', $event.target.value)"
          >
            <option value="ALL">全部标段</option>
            <option v-for="sec in sectionOptions" :key="sec.id" :value="sec.id">
              {{ sec.name }}
            </option>
          </select>
        </div>

        <div class="flex items-center gap-1.5">
          <label for="l3-category" class="text-[11px] text-slate-400 whitespace-nowrap">工程类型</label>
          <select
            id="l3-category"
            :value="level3Filters.category"
            class="px-2 py-0.5 text-[11px] bg-[#08101E] text-slate-100 border border-slate-700 rounded focus:outline-none focus:border-sky-500"
            @change="emit('update-level3-filter', 'category', $event.target.value)"
          >
            <option value="ALL">全部工程</option>
            <option v-for="cat in categoryOptions" :key="cat" :value="cat">
              {{ cat }}
            </option>
          </select>
        </div>
      </div>

      <button
        type="button"
        class="px-2 py-0.5 text-[11px] text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        @click="emit('reset-level3-filters')"
      >
        重置筛选
      </button>
    </div>
  </header>
</template>
