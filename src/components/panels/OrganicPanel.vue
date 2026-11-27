<script setup>
import PanelShell from '../PanelShell.vue';

defineProps({
  stats: { type: Object, required: true },
});

const emit = defineEmits(['select-project-id']);

function formatNum(val) {
  return Number(val ?? 0).toLocaleString('zh-CN');
}
</script>

<template>
  <PanelShell
    title="有机肥管理"
    subtitle="项目维度 · 有机肥标段统计"
    test-id="panel-organic"
  >
    <template #right>
      <span class="text-[11px] font-mono-num text-emerald-400 whitespace-nowrap shrink-0">
        {{ stats.organicSectionCount }} 标段 · {{ stats.completionRate }}%
      </span>
    </template>

    <div class="grid grid-cols-3 gap-1.5 shrink-0">
      <div class="px-2 py-1 rounded bg-[#091222] border border-slate-800/80">
        <div class="text-[10px] text-slate-400">设计工作量</div>
        <div class="text-xs font-bold font-mono-num text-slate-100 mt-0.5">
          {{ formatNum(stats.totalDesignMu) }} 亩
        </div>
      </div>

      <div class="px-2 py-1 rounded bg-[#091222] border border-slate-800/80">
        <div class="text-[10px] text-slate-400">播撒工作量</div>
        <div class="text-xs font-bold font-mono-num text-emerald-400 mt-0.5">
          {{ formatNum(stats.totalSpreadTons) }} 吨
        </div>
      </div>

      <div class="px-2 py-1 rounded bg-[#091222] border border-slate-800/80">
        <div class="text-[10px] text-slate-400">入库数量</div>
        <div class="text-xs font-bold font-mono-num text-sky-400 mt-0.5">
          {{ formatNum(stats.totalStockedTons) }} 吨
        </div>
      </div>
    </div>

    <div class="mt-1.5 flex-1 min-h-0 flex flex-col gap-1 overflow-y-auto panel-scroll pr-1.5">
      <div
        v-if="stats.byProject.length === 0"
        class="flex-1 flex items-center justify-center text-xs text-slate-400 text-center"
      >
        当前条件下暂无「有机肥标段」工程
      </div>
      <button
        v-for="item in stats.byProject"
        :key="item.projectId"
        type="button"
        class="w-full text-left group px-2 py-1 rounded bg-[#091222] hover:bg-[#10203B] border border-slate-800/75 transition-colors cursor-pointer shrink-0"
        @click="emit('select-project-id', item.projectId)"
      >
        <div class="flex items-center justify-between gap-2 text-[11px]">
          <span class="text-slate-200 group-hover:text-emerald-300 truncate">
            {{ item.projectName }}
          </span>
          <span class="font-mono-num text-emerald-400 shrink-0">
            {{ item.rate }}%
          </span>
        </div>
        <div class="mt-0.5 flex items-center justify-between gap-2 text-[10px] font-mono-num text-slate-400">
          <span>设计 {{ formatNum(item.designMu) }}亩</span>
          <span>播撒 {{ formatNum(item.spreadTons) }}吨</span>
          <span class="text-sky-300">入库 {{ formatNum(item.stockedTons) }}吨</span>
        </div>
        <div class="mt-1 h-1 bg-slate-800 rounded-full overflow-hidden">
          <div
            class="h-full bg-emerald-500 rounded-full"
            :style="{ width: `${Math.min(100, item.rate)}%` }"
          />
        </div>
      </button>
    </div>
  </PanelShell>
</template>
