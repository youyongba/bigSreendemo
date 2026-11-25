<script setup>
import PanelShell from '../PanelShell.vue';

defineProps({
  stats: { type: Object, required: true },
});

const emit = defineEmits(['open-detail']);

function pct(part, total) {
  return total === 0 ? 0 : (part / total) * 100;
}
</script>

<template>
  <PanelShell
    title="质量检测"
    subtitle="无整改 · 以检测结果为准"
    test-id="panel-quality"
  >
    <template #right>
      <button
        type="button"
        class="text-[11px] font-medium text-sky-400 hover:text-sky-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        @click="emit('open-detail')"
      >
        检测明细
      </button>
    </template>

    <div class="grid grid-cols-2 gap-2 flex-1 min-h-0 items-stretch">
      <!-- 施工自检 -->
      <div class="flex flex-col justify-between gap-1.5 p-2 rounded bg-[#091222] border border-slate-800/80">
        <div class="flex items-center justify-between text-xs">
          <span class="font-semibold text-sky-300">施工自检</span>
          <span class="text-[11px] text-slate-400 font-mono-num">
            {{ stats.selfCheck.passRate }}%
          </span>
        </div>
        <div class="grid grid-cols-3 gap-1 text-center py-0.5">
          <div>
            <div class="text-[10px] text-slate-400">检测</div>
            <div class="text-sm font-bold font-mono-num text-slate-100">
              {{ stats.selfCheck.total }}
            </div>
          </div>
          <div class="border-x border-slate-800/80">
            <div class="text-[10px] text-slate-400">合格</div>
            <div class="text-sm font-bold font-mono-num text-emerald-400">
              {{ stats.selfCheck.passed }}
            </div>
          </div>
          <div>
            <div class="text-[10px] text-slate-400">不合格</div>
            <div class="text-sm font-bold font-mono-num text-rose-400">
              {{ stats.selfCheck.failed }}
            </div>
          </div>
        </div>
        <div class="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
          <div
            class="bg-emerald-500 h-full"
            :style="{ width: `${pct(stats.selfCheck.passed, stats.selfCheck.total)}%` }"
          />
          <div
            class="bg-rose-500 h-full"
            :style="{ width: `${pct(stats.selfCheck.failed, stats.selfCheck.total)}%` }"
          />
        </div>
      </div>

      <!-- 平行检测 -->
      <div class="flex flex-col justify-between gap-1.5 p-2 rounded bg-[#091222] border border-slate-800/80">
        <div class="flex items-center justify-between text-xs">
          <span class="font-semibold text-emerald-300">平行检测</span>
          <span class="text-[11px] text-slate-400 font-mono-num">
            {{ stats.parallelCheck.passRate }}%
          </span>
        </div>
        <div class="grid grid-cols-3 gap-1 text-center py-0.5">
          <div>
            <div class="text-[10px] text-slate-400">检测</div>
            <div class="text-sm font-bold font-mono-num text-slate-100">
              {{ stats.parallelCheck.total }}
            </div>
          </div>
          <div class="border-x border-slate-800/80">
            <div class="text-[10px] text-slate-400">合格</div>
            <div class="text-sm font-bold font-mono-num text-emerald-400">
              {{ stats.parallelCheck.passed }}
            </div>
          </div>
          <div>
            <div class="text-[10px] text-slate-400">不合格</div>
            <div class="text-sm font-bold font-mono-num text-rose-400">
              {{ stats.parallelCheck.failed }}
            </div>
          </div>
        </div>
        <div class="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
          <div
            class="bg-emerald-500 h-full"
            :style="{ width: `${pct(stats.parallelCheck.passed, stats.parallelCheck.total)}%` }"
          />
          <div
            class="bg-rose-500 h-full"
            :style="{ width: `${pct(stats.parallelCheck.failed, stats.parallelCheck.total)}%` }"
          />
        </div>
      </div>
    </div>

    <div class="mt-1.5 flex items-center justify-between text-[11px] text-slate-400 font-mono-num shrink-0">
      <span>合计检测 {{ stats.totalChecks }} 次</span>
      <span>
        合格 <strong class="text-emerald-400">{{ stats.totalPassed }}</strong> · 不合格
        <strong class="text-rose-400">{{ stats.totalFailed }}</strong>
      </span>
    </div>
  </PanelShell>
</template>
