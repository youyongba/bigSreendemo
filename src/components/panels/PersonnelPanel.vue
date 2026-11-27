<script setup>
import { computed, ref } from 'vue';
import PanelShell from '../PanelShell.vue';

const props = defineProps({
  stats: { type: Object, required: true },
});

const roleTab = ref('supervisor');

const activeRoster = computed(() =>
  roleTab.value === 'supervisor' ? props.stats.supervisor : props.stats.construction
);
</script>

<template>
  <PanelShell title="人员管理" subtitle="监理 & 施工履职打卡" test-id="panel-personnel">
    <template #right>
      <div
        role="tablist"
        aria-label="人员类型切换"
        class="flex items-center gap-0.5 p-0.5 bg-[#08101E] border border-slate-800 rounded"
      >
        <button
          type="button"
          role="tab"
          data-testid="personnel-tab-supervisor"
          :aria-selected="roleTab === 'supervisor'"
          :class="[
            'px-2 py-0.5 text-[11px] font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer',
            roleTab === 'supervisor'
              ? 'bg-sky-600 text-white'
              : 'text-slate-400 hover:text-slate-200',
          ]"
          @click="roleTab = 'supervisor'"
        >
          监理打卡
        </button>
        <button
          type="button"
          role="tab"
          data-testid="personnel-tab-construction"
          :aria-selected="roleTab === 'construction'"
          :class="[
            'px-2 py-0.5 text-[11px] font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer',
            roleTab === 'construction'
              ? 'bg-sky-600 text-white'
              : 'text-slate-400 hover:text-slate-200',
          ]"
          @click="roleTab = 'construction'"
        >
          施工打卡
        </button>
      </div>
    </template>

    <div class="flex-1 min-h-0 flex flex-col gap-1.5">
      <div class="grid grid-cols-3 gap-1.5 text-center bg-[#091222] border border-slate-800/80 rounded px-2 py-1 shrink-0">
        <div>
          <div class="text-[10px] text-slate-400">履职打卡率</div>
          <div class="text-sm font-bold font-mono-num text-emerald-400">
            {{ activeRoster.attendanceRate }}%
          </div>
        </div>
        <div class="border-x border-slate-800/80">
          <div class="text-[10px] text-slate-400">实打 / 应打</div>
          <div class="text-xs font-bold font-mono-num text-slate-100 mt-0.5">
            {{ activeRoster.actualCheckInsTotal }}/{{ activeRoster.requiredDaysTotal }}
          </div>
        </div>
        <div>
          <div class="text-[10px] text-slate-400">今日已打卡</div>
          <div class="text-sm font-bold font-mono-num text-sky-400">
            {{ activeRoster.todayCheckedInCount }}/{{ activeRoster.totalCount }}
          </div>
        </div>
      </div>

      <div class="flex-1 min-h-0 flex flex-col gap-1 overflow-y-auto panel-scroll pr-1.5">
        <div
          v-if="activeRoster.records.length === 0"
          class="text-xs text-slate-400 py-3 text-center"
        >
          {{ roleTab === 'supervisor' ? '暂无监理人员打卡数据' : '暂无施工人员打卡数据' }}
        </div>
        <div
          v-for="person in activeRoster.records"
          :key="`${person.id}-${person.projectName}`"
          class="flex items-center justify-between gap-2 px-2 py-1 rounded bg-[#091222] border border-slate-800/70 text-[11px] shrink-0"
        >
          <div class="min-w-0">
            <div class="flex items-center gap-1 text-slate-100">
              <span class="font-medium shrink-0">{{ person.name }}</span>
              <span class="text-slate-500" aria-hidden="true">·</span>
              <span class="text-slate-400 truncate">{{ person.role }}</span>
            </div>
            <div class="text-[10px] text-slate-500 truncate">
              {{ person.projectName }}{{ person.sectionName ? ` (${person.sectionName})` : '' }}
            </div>
          </div>
          <div class="text-right shrink-0">
            <div class="font-mono-num font-semibold text-emerald-400">
              {{ person.actualCheckIns }}/{{ person.requiredDays }}天 ({{ person.rate }}%)
            </div>
            <div class="text-[10px] text-slate-400 font-mono-num">
              {{ person.todayCheckedIn ? `今日 ${person.lastCheckInTime}` : person.lastCheckInTime }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </PanelShell>
</template>
