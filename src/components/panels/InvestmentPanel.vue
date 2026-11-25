<script setup>
import PanelShell from '../PanelShell.vue';

defineProps({
  stats: { type: Object, required: true },
});

const emit = defineEmits(['open-disbursement']);

function formatWan(val) {
  return val.toLocaleString('zh-CN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
}
</script>

<template>
  <PanelShell
    title="投资与资金管理"
    subtitle="单位：万元"
    test-id="panel-investment"
  >
    <template #right>
      <button
        type="button"
        class="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        @click="emit('open-disbursement')"
      >
        上传材料拨付
      </button>
    </template>

    <div class="grid grid-cols-2 gap-1.5 shrink-0">
      <div class="px-2 py-1.5 rounded bg-[#091222] border border-slate-800/80">
        <div class="text-[10px] text-slate-400">投资项目总金额</div>
        <div class="text-sm font-bold font-mono-num text-slate-100">
          {{ formatWan(stats.totalInvestment) }}
        </div>
      </div>
      <div class="px-2 py-1.5 rounded bg-[#091222] border border-slate-800/80">
        <div class="text-[10px] text-slate-400">施工单位中标金额</div>
        <div class="text-sm font-bold font-mono-num text-sky-300">
          {{ formatWan(stats.totalBidAmount) }}
        </div>
      </div>
      <div class="px-2 py-1.5 rounded bg-[#091222] border border-slate-800/80">
        <div class="text-[10px] text-slate-400">已拨付金额</div>
        <div class="flex items-baseline justify-between gap-1">
          <span class="text-sm font-bold font-mono-num text-amber-400">
            {{ formatWan(stats.totalDisbursed) }}
          </span>
          <span class="text-[10px] font-mono-num text-slate-400">
            {{ stats.disbursementRate }}%
          </span>
        </div>
      </div>
      <div class="px-2 py-1.5 rounded bg-[#091222] border border-slate-800/80">
        <div class="text-[10px] text-slate-400">已完成金额</div>
        <div class="flex items-baseline justify-between gap-1">
          <span class="text-sm font-bold font-mono-num text-emerald-400">
            {{ formatWan(stats.totalCompletedAmount) }}
          </span>
          <span class="text-[10px] font-mono-num text-slate-400">
            {{ stats.completionRate }}%
          </span>
        </div>
      </div>
    </div>

    <div class="mt-2 grid grid-cols-2 gap-2 text-[10px] text-slate-400 shrink-0">
      <div>
        <div class="flex justify-between mb-0.5">
          <span>拨付率</span>
          <span class="font-mono-num text-amber-300">{{ stats.disbursementRate }}%</span>
        </div>
        <div class="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            class="h-full bg-amber-400 rounded-full"
            :style="{ width: `${Math.min(100, stats.disbursementRate)}%` }"
          />
        </div>
      </div>
      <div>
        <div class="flex justify-between mb-0.5">
          <span>产值完成率</span>
          <span class="font-mono-num text-emerald-300">{{ stats.completionRate }}%</span>
        </div>
        <div class="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            class="h-full bg-emerald-500 rounded-full"
            :style="{ width: `${Math.min(100, stats.completionRate)}%` }"
          />
        </div>
      </div>
    </div>
  </PanelShell>
</template>
