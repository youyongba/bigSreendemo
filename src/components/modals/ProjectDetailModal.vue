<script setup>
import { X } from 'lucide-vue-next';

defineProps({
  project: { type: Object, default: null },
});

const emit = defineEmits(['close', 'toggle-organic-attribute', 'open-disbursement']);

function sumDisbursed(sec) {
  return sec.disbursements.reduce((s, d) => s + d.amount, 0);
}
</script>

<template>
  <div
    v-if="project"
    role="dialog"
    aria-modal="true"
    aria-labelledby="project-detail-title"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
  >
    <div class="w-full max-w-3xl bg-[#0E182B] border border-slate-700 rounded-lg overflow-hidden shadow-2xl">
      <header class="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-[#111F38]">
        <div class="min-w-0">
          <h2
            id="project-detail-title"
            class="text-sm font-semibold text-slate-100 truncate"
          >
            {{ project.name }}
          </h2>
          <p class="text-[11px] text-slate-400 mt-0.5">
            {{ project.year }}年度 · {{ project.city }} / {{ project.county }} · 建设规模 {{ project.areaMu }} 万亩 · 总投资 {{ project.totalInvestment }} 万元
          </p>
        </div>
        <button
          type="button"
          aria-label="关闭项目档案弹窗"
          class="p-1.5 text-slate-400 hover:text-slate-100 rounded hover:bg-slate-800 cursor-pointer shrink-0"
          @click="emit('close')"
        >
          <X class="w-4 h-4" aria-hidden="true" />
        </button>
      </header>

      <div class="p-5 max-h-[80vh] overflow-y-auto panel-scroll flex flex-col gap-4">
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded bg-[#091222] border border-slate-800 text-xs">
          <div>
            <div class="text-[10px] text-slate-400">当前状态</div>
            <div class="font-semibold text-sky-400 mt-0.5">
              {{ project.status }} ({{ project.progressPercent }}%)
            </div>
          </div>
          <div>
            <div class="text-[10px] text-slate-400">安全标牌总数</div>
            <div class="font-mono-num font-semibold text-amber-300 mt-0.5">
              {{ project.safetySignCount }} 块（警示{{ project.safetySignDetails.warning }}/公示{{ project.safetySignDetails.notice }}/路牌{{ project.safetySignDetails.road }}/保护{{ project.safetySignDetails.protection }}）
            </div>
          </div>
          <div>
            <div class="text-[10px] text-slate-400">质量检测结果</div>
            <div class="font-mono-num font-semibold text-slate-100 mt-0.5">
              共 {{ project.qualityChecks.length }} 项（合格 {{ project.qualityChecks.filter((q) => q.result === '合格').length }}）
            </div>
          </div>
          <div>
            <div class="text-[10px] text-slate-400">移交管护状态</div>
            <div class="font-semibold text-emerald-400 mt-0.5">
              {{ project.handover.status }}
            </div>
          </div>
        </div>

        <div>
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-xs font-semibold text-slate-200">
              标段台账与工程明细（可切换标段「有机肥标段」属性）
            </h3>
            <button
              v-if="project.status === '施工中'"
              type="button"
              class="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 cursor-pointer"
              @click="emit('close'); emit('open-disbursement')"
            >
              去上传材料拨付
            </button>
          </div>

          <div class="flex flex-col gap-3">
            <div
              v-for="sec in project.sections"
              :key="sec.id"
              class="p-3 rounded bg-[#091222] border border-slate-800"
            >
              <div class="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                <div>
                  <div class="text-xs font-semibold text-slate-100">
                    {{ sec.name }}
                  </div>
                  <div class="text-[11px] text-slate-400 mt-0.5">
                    施工单位：{{ sec.contractor }} · 状态：{{ sec.status }} · 中标
                    <span class="font-mono-num text-slate-200">{{ sec.bidAmount }}</span> 万元 · 已拨
                    <span class="font-mono-num text-amber-300">{{ sumDisbursed(sec) }}</span> 万元
                  </div>
                </div>
                <button
                  type="button"
                  :class="[
                    'px-2.5 py-1 text-[11px] font-medium rounded border transition-colors cursor-pointer',
                    sec.isOrganicFertilizer
                      ? 'bg-emerald-950/70 text-emerald-300 border-emerald-600/60 hover:bg-emerald-900/70'
                      : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200',
                  ]"
                  @click="emit('toggle-organic-attribute', project.id, sec.id)"
                >
                  {{ sec.isOrganicFertilizer ? '标段属性：有机肥标段' : '标段属性：普通工程标段' }}
                </button>
              </div>

              <div class="mt-2 flex flex-col gap-1.5">
                <div
                  v-for="item in sec.engineeringItems"
                  :key="item.id"
                  class="flex flex-wrap items-center justify-between gap-2 text-[11px] py-1 border-b border-slate-800/40 last:border-b-0"
                >
                  <div class="flex items-center gap-2">
                    <span class="text-slate-200">{{ item.name }}</span>
                    <span
                      v-if="sec.isOrganicFertilizer"
                      class="text-[10px] text-emerald-400 font-mono-num"
                    >
                      [有机肥工程：设计 {{ item.organicDesignTons ?? 0 }}吨 / 播撒 {{ item.organicSpreadTons ?? 0 }}吨]
                    </span>
                  </div>
                  <div class="flex items-center gap-3 font-mono-num shrink-0">
                    <span class="text-slate-400">
                      预算 {{ item.budgetAmount }}万 · 完成 {{ Math.round(item.completedRatio * 100) }}%
                    </span>
                    <span
                      :class="
                        item.acceptanceStatus === '已验收'
                          ? 'text-emerald-400'
                          : 'text-amber-400'
                      "
                    >
                      {{ item.acceptanceStatus }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
