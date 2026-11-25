<script setup>
import { ref } from 'vue';
import PanelShell from '../PanelShell.vue';

defineProps({
  stats: { type: Object, required: true },
});

const roleTab = ref('supervisor');
</script>

<template>
  <PanelShell title="人员履职管理" test-id="panel-personnel">
    <template #right>
      <div
        role="tablist"
        aria-label="人员类型切换"
        class="flex items-center gap-0.5 p-0.5 bg-[#08101E] border border-slate-800 rounded"
      >
        <button
          type="button"
          role="tab"
          :aria-selected="roleTab === 'supervisor'"
          :class="[
            'px-2 py-0.5 text-[11px] font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer',
            roleTab === 'supervisor'
              ? 'bg-sky-600 text-white'
              : 'text-slate-400 hover:text-slate-200',
          ]"
          @click="roleTab = 'supervisor'"
        >
          监理人员
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="roleTab === 'construction'"
          :class="[
            'px-2 py-0.5 text-[11px] font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer',
            roleTab === 'construction'
              ? 'bg-sky-600 text-white'
              : 'text-slate-400 hover:text-slate-200',
          ]"
          @click="roleTab = 'construction'"
        >
          施工人员
        </button>
      </div>
    </template>

    <div v-if="roleTab === 'supervisor'" class="flex-1 min-h-0 flex flex-col gap-1.5">
      <div class="grid grid-cols-3 gap-1.5 text-center bg-[#091222] border border-slate-800/80 rounded px-2 py-1 shrink-0">
        <div>
          <div class="text-[10px] text-slate-400">履职打卡率</div>
          <div class="text-sm font-bold font-mono-num text-emerald-400">
            {{ stats.supervisor.attendanceRate }}%
          </div>
        </div>
        <div class="border-x border-slate-800/80">
          <div class="text-[10px] text-slate-400">实打 / 应打</div>
          <div class="text-xs font-bold font-mono-num text-slate-100 mt-0.5">
            {{ stats.supervisor.actualCheckInsTotal }}/{{ stats.supervisor.requiredDaysTotal }}
          </div>
        </div>
        <div>
          <div class="text-[10px] text-slate-400">今日已打卡</div>
          <div class="text-sm font-bold font-mono-num text-sky-400">
            {{ stats.supervisor.todayCheckedInCount }}/{{ stats.supervisor.totalCount }}
          </div>
        </div>
      </div>

      <div class="flex-1 min-h-0 flex flex-col gap-1 overflow-y-auto panel-scroll pr-1.5">
        <div
          v-if="stats.supervisor.records.length === 0"
          class="text-xs text-slate-400 py-3 text-center"
        >
          暂无监理人员数据
        </div>
        <div
          v-for="sup in stats.supervisor.records"
          :key="`${sup.id}-${sup.projectName}`"
          class="flex items-center justify-between gap-2 px-2 py-1 rounded bg-[#091222] border border-slate-800/70 text-[11px] shrink-0"
        >
          <div class="min-w-0">
            <div class="flex items-center gap-1 text-slate-100">
              <span class="font-medium shrink-0">{{ sup.name }}</span>
              <span class="text-slate-500" aria-hidden="true">·</span>
              <span class="text-slate-400 truncate">{{ sup.role }}</span>
            </div>
            <div class="text-[10px] text-slate-500 truncate">
              {{ sup.projectName }}
            </div>
          </div>
          <div class="text-right shrink-0">
            <div class="font-mono-num font-semibold text-emerald-400">
              {{ sup.actualCheckIns }}/{{ sup.requiredDays }}天 ({{ sup.rate }}%)
            </div>
            <div class="text-[10px] text-slate-400 font-mono-num">
              {{ sup.todayCheckedIn ? `今日 ${sup.lastCheckInTime}` : sup.lastCheckInTime }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="flex-1 min-h-0 flex flex-col gap-1.5">
      <div class="grid grid-cols-3 gap-1.5 text-center bg-[#091222] border border-slate-800/80 rounded px-2 py-1 shrink-0">
        <div>
          <div class="text-[10px] text-slate-400">施工备案人数</div>
          <div class="text-sm font-bold font-mono-num text-slate-100">
            {{ stats.construction.totalCount }}
          </div>
        </div>
        <div class="border-x border-slate-800/80">
          <div class="text-[10px] text-slate-400">在岗备案</div>
          <div class="text-sm font-bold font-mono-num text-sky-400">
            {{ stats.construction.onDutyCount }}
          </div>
        </div>
        <div>
          <div class="text-[10px] text-slate-400">考勤打卡</div>
          <div class="text-xs font-medium text-slate-400 mt-0.5">
            无打卡数据
          </div>
        </div>
      </div>

      <div class="px-2 py-1 rounded bg-slate-900/80 border border-slate-800 text-[10px] text-slate-400 shrink-0">
        施工人员实行标段在岗备案制，仅监理采集打卡数据，施工人员无打卡记录。
      </div>

      <div class="flex-1 min-h-0 flex flex-col gap-1 overflow-y-auto panel-scroll pr-1.5">
        <div
          v-if="stats.construction.records.length === 0"
          class="text-xs text-slate-400 py-2 text-center"
        >
          暂无施工人员备案
        </div>
        <div
          v-for="worker in stats.construction.records"
          :key="`${worker.id}-${worker.projectName}`"
          class="flex items-center justify-between gap-2 px-2 py-1 rounded bg-[#091222] border border-slate-800/70 text-[11px] shrink-0"
        >
          <div class="min-w-0">
            <span class="font-medium text-slate-100">{{ worker.name }}</span>
            <span class="text-slate-500 mx-1" aria-hidden="true">·</span>
            <span class="text-slate-400">{{ worker.role }}</span>
          </div>
          <span class="text-[10px] text-slate-400 truncate max-w-[120px]">
            {{ worker.org }} · {{ worker.onDutyStatus }}
          </span>
        </div>
      </div>
    </div>
  </PanelShell>
</template>
