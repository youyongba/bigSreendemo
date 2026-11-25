<script setup>
import PanelShell from '../PanelShell.vue';

defineProps({
  stats: { type: Object, required: true },
});

const emit = defineEmits(['select-project-id']);
</script>

<template>
  <PanelShell
    title="有机肥管理"
    subtitle="仅统计「有机肥标段」工程"
    test-id="panel-organic"
  >
    <template #right>
      <span class="text-[11px] font-mono-num text-emerald-400 whitespace-nowrap shrink-0">
        {{ stats.organicSectionCount }} 标段 · {{ stats.completionRate }}%
      </span>
    </template>

    <div class="grid grid-cols-2 gap-2 shrink-0">
      <div class="px-2 py-1.5 rounded bg-[#091222] border border-slate-800/80">
        <div class="text-[10px] text-slate-400">设计工作量</div>
        <div class="flex items-baseline justify-between gap-1">
          <span class="text-sm font-bold font-mono-num text-slate-100">
            {{ stats.totalDesignTons.toLocaleString('zh-CN') }} 吨
          </span>
          <span class="text-[10px] font-mono-num text-slate-400">
            {{ (stats.totalDesignMu / 10000).toFixed(1) }}万亩
          </span>
        </div>
      </div>

      <div class="px-2 py-1.5 rounded bg-[#091222] border border-slate-800/80">
        <div class="text-[10px] text-slate-400">播撒工作量</div>
        <div class="flex items-baseline justify-between gap-1">
          <span class="text-sm font-bold font-mono-num text-emerald-400">
            {{ stats.totalSpreadTons.toLocaleString('zh-CN') }} 吨
          </span>
          <span class="text-[10px] font-mono-num text-emerald-300/80">
            {{ (stats.totalSpreadMu / 10000).toFixed(1) }}万亩
          </span>
        </div>
      </div>
    </div>

    <div class="mt-1.5 flex-1 min-h-0 flex flex-col gap-1 overflow-y-auto panel-scroll pr-1.5">
      <div
        v-if="stats.byProject.length === 0"
        class="flex-1 flex items-center justify-center text-xs text-slate-400 text-center"
      >
        当前年份暂无「有机肥标段」工程
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
            {{ item.spreadTons }}/{{ item.designTons }}吨
          </span>
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
