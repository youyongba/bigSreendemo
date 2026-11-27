<script setup>
import { computed, ref } from 'vue';
import { AlertTriangle, CheckCircle2 } from 'lucide-vue-next';
import PanelShell from '../PanelShell.vue';
import {
  calcProjectSectionProgress,
  getProjectScheduleAlert,
} from '../../utils/dashboardCalculations.js';

const props = defineProps({
  project: { type: Object, default: null },
});

const emit = defineEmits(['select-project']);

const viewTab = ref('zones');

const scheduleAlert = computed(() => getProjectScheduleAlert(props.project));
const sectionRows = computed(() => calcProjectSectionProgress(props.project));
const zoneRows = computed(() => props.project?.projectZones ?? []);
</script>

<template>
  <PanelShell
    title="项目进度"
    :subtitle="project ? `总体 ${project.progressPercent}%` : '暂无项目'"
    test-id="panel-progress"
  >
    <template #right>
      <div
        role="tablist"
        aria-label="项目进度维度切换"
        class="flex items-center gap-0.5 p-0.5 bg-[#08101E] border border-slate-800 rounded"
      >
        <button
          type="button"
          role="tab"
          :aria-selected="viewTab === 'zones'"
          :class="[
            'px-2 py-0.5 text-[11px] font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer',
            viewTab === 'zones'
              ? 'bg-sky-600 text-white'
              : 'text-slate-400 hover:text-slate-200',
          ]"
          @click="viewTab = 'zones'"
        >
          项目区
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="viewTab === 'sections'"
          :class="[
            'px-2 py-0.5 text-[11px] font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer',
            viewTab === 'sections'
              ? 'bg-sky-600 text-white'
              : 'text-slate-400 hover:text-slate-200',
          ]"
          @click="viewTab = 'sections'"
        >
          标段
        </button>
      </div>
    </template>

    <div
      v-if="!project"
      class="flex-1 flex items-center justify-center text-xs text-slate-400 text-center"
    >
      暂无选中项目
    </div>

    <div v-else class="flex-1 min-h-0 flex flex-col gap-1.5">
      <!-- 进度计划提醒逻辑：未设置计划不提醒；已设置计划且滞后才显示提醒 -->
      <div
        v-if="scheduleAlert.hasPlan && scheduleAlert.isBehind"
        data-testid="schedule-lag-alert"
        class="flex items-start gap-1.5 px-2 py-1.5 rounded bg-amber-950/60 border border-amber-600/50 text-[11px] text-amber-200 shrink-0"
      >
        <AlertTriangle class="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
        <span class="leading-snug">{{ scheduleAlert.message }}</span>
      </div>
      <div
        v-else-if="scheduleAlert.hasPlan && !scheduleAlert.isBehind"
        data-testid="schedule-ontrack-info"
        class="flex items-center justify-between gap-2 px-2 py-1 rounded bg-emerald-950/35 border border-emerald-700/40 text-[11px] text-emerald-300 shrink-0"
      >
        <span class="inline-flex items-center gap-1">
          <CheckCircle2 class="w-3 h-3 shrink-0" aria-hidden="true" />
          <span>按计划推进</span>
        </span>
        <span class="font-mono-num">
          实际 {{ project.progressPercent }}% / 计划 {{ project.plannedProgressPercent }}%
        </span>
      </div>
      <!-- 未设置进度计划：严格不展示滞后提醒 -->

      <!-- 项目区进度条 -->
      <div
        v-if="viewTab === 'zones'"
        class="flex-1 min-h-0 flex flex-col gap-1.5 overflow-y-auto panel-scroll pr-1"
      >
        <div
          v-if="zoneRows.length === 0"
          class="text-xs text-slate-400 py-3 text-center"
        >
          该项目暂未划分项目区
        </div>
        <button
          v-for="zone in zoneRows"
          :key="zone.id"
          type="button"
          class="w-full text-left px-2 py-1.5 rounded bg-[#091222] hover:bg-[#10203B] border border-slate-800/80 transition-colors cursor-pointer shrink-0"
          @click="emit('select-project', project)"
        >
          <div class="flex items-center justify-between gap-2 text-[11px]">
            <span class="font-medium text-slate-100 truncate">
              {{ zone.name }}
            </span>
            <span class="font-bold font-mono-num text-sky-400 shrink-0">
              {{ zone.progressPercent }}%
            </span>
          </div>
          <div class="mt-1 relative h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              class="h-full bg-gradient-to-r from-sky-500 to-emerald-400 rounded-full"
              :style="{ width: `${zone.progressPercent}%` }"
            />
          </div>
          <div class="mt-0.5 flex items-center justify-between text-[10px] text-slate-400 font-mono-num">
            <span>{{ zone.township }} · {{ zone.areaMu }}万亩</span>
            <span v-if="zone.plannedPercent != null">
              计划 {{ zone.plannedPercent }}%
            </span>
          </div>
        </button>
      </div>

      <!-- 标段进度条 -->
      <div
        v-else
        class="flex-1 min-h-0 flex flex-col gap-1.5 overflow-y-auto panel-scroll pr-1"
      >
        <button
          v-for="sec in sectionRows"
          :key="sec.id"
          type="button"
          class="w-full text-left px-2 py-1.5 rounded bg-[#091222] hover:bg-[#10203B] border border-slate-800/80 transition-colors cursor-pointer shrink-0"
          @click="emit('select-project', project)"
        >
          <div class="flex items-center justify-between gap-2 text-[11px]">
            <span class="font-medium text-slate-100 truncate">
              {{ sec.name }}
            </span>
            <span class="font-bold font-mono-num text-emerald-400 shrink-0">
              {{ sec.progressPercent }}%
            </span>
          </div>
          <div class="mt-1 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              class="h-full bg-gradient-to-r from-sky-500 to-emerald-400 rounded-full"
              :style="{ width: `${sec.progressPercent}%` }"
            />
          </div>
          <div class="mt-0.5 flex items-center justify-between text-[10px] text-slate-400">
            <span class="truncate">{{ sec.contractor }}</span>
            <span class="shrink-0 font-mono-num">{{ sec.status }} · {{ sec.itemCount }}项</span>
          </div>
        </button>
      </div>
    </div>
  </PanelShell>
</template>
