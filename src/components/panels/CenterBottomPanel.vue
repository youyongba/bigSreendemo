<script setup>
import { Banknote, ShieldCheck, Video } from 'lucide-vue-next';

defineProps({
  investmentStats: { type: Object, required: true },
  safetyStats: { type: Object, required: true },
  overlayCounts: { type: Object, required: true },
});

const emit = defineEmits(['open-disbursement']);

function formatWan(val) {
  return Number(val ?? 0).toLocaleString('zh-CN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
}
</script>

<template>
  <section
    data-testid="panel-center-bottom"
    class="bg-[#0E182B] border border-slate-800/90 rounded-lg px-3.5 py-2.5 shrink-0"
  >
    <div class="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
      <!-- 投资与资金拨付（参考高标中下） -->
      <div class="md:col-span-7 flex flex-col gap-1.5 md:border-r md:border-slate-800/80 md:pr-3">
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
            <Banknote class="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
            <span>投资与资金拨付（万元）</span>
          </div>
          <button
            type="button"
            class="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            @click="emit('open-disbursement')"
          >
            标段材料拨付录入
          </button>
        </div>

        <div class="grid grid-cols-4 gap-1.5">
          <div class="px-2 py-1 rounded bg-[#091222] border border-slate-800/80">
            <div class="text-[10px] text-slate-400">项目总投资</div>
            <div class="text-xs font-bold font-mono-num text-slate-100">
              {{ formatWan(investmentStats.totalInvestment) }}
            </div>
          </div>
          <div class="px-2 py-1 rounded bg-[#091222] border border-slate-800/80">
            <div class="text-[10px] text-slate-400">中标金额</div>
            <div class="text-xs font-bold font-mono-num text-sky-300">
              {{ formatWan(investmentStats.totalBidAmount) }}
            </div>
          </div>
          <div class="px-2 py-1 rounded bg-[#091222] border border-slate-800/80">
            <div class="text-[10px] text-slate-400">
              已拨付 ({{ investmentStats.disbursementRate }}%)
            </div>
            <div class="text-xs font-bold font-mono-num text-amber-400">
              {{ formatWan(investmentStats.totalDisbursed) }}
            </div>
          </div>
          <div class="px-2 py-1 rounded bg-[#091222] border border-slate-800/80">
            <div class="text-[10px] text-slate-400">
              已完成 ({{ investmentStats.completionRate }}%)
            </div>
            <div class="text-xs font-bold font-mono-num text-emerald-400">
              {{ formatWan(investmentStats.totalCompletedAmount) }}
            </div>
          </div>
        </div>
      </div>

      <!-- 安全措施点位、记录仪与标牌统计 -->
      <div class="md:col-span-5 flex flex-col gap-1.5">
        <div class="flex items-center justify-between text-xs font-semibold text-slate-200">
          <span class="inline-flex items-center gap-1.5">
            <ShieldCheck class="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
            <span>安全管理与设备在线</span>
          </span>
          <span class="text-[10px] font-mono-num text-slate-400">
            标牌均 {{ safetyStats.avgPerProject }} 块/项目
          </span>
        </div>

        <div class="grid grid-cols-3 gap-1.5">
          <div class="px-2 py-1 rounded bg-[#091222] border border-slate-800/80">
            <div class="text-[10px] text-slate-400">安全标牌</div>
            <div class="text-xs font-bold font-mono-num text-amber-300">
              {{ safetyStats.totalSigns }} 块
            </div>
          </div>
          <div class="px-2 py-1 rounded bg-[#091222] border border-slate-800/80">
            <div class="text-[10px] text-slate-400">安全点位</div>
            <div class="text-xs font-bold font-mono-num text-slate-100">
              {{ overlayCounts.safetyTotal }}
              <span
                v-if="overlayCounts.pendingSafetyCount > 0"
                class="text-[10px] text-rose-400"
              >
                (待改{{ overlayCounts.pendingSafetyCount }})
              </span>
            </div>
          </div>
          <div class="px-2 py-1 rounded bg-[#091222] border border-slate-800/80">
            <div class="flex items-center gap-1 text-[10px] text-slate-400">
              <Video class="w-2.5 h-2.5 text-emerald-400" aria-hidden="true" />
              <span>记录仪在线</span>
            </div>
            <div class="text-xs font-bold font-mono-num text-emerald-400">
              {{ overlayCounts.onlineRecorderCount }}/{{ overlayCounts.recorderTotal }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
