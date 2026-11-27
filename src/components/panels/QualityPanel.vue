<script setup>
import PanelShell from '../PanelShell.vue';

defineProps({
  stats: { type: Object, required: true },
});

const emit = defineEmits(['open-detail']);
</script>

<template>
  <PanelShell
    title="工程质量"
    :subtitle="`自检上传 ${stats.selfUploadTotal} · 旁站 ${stats.supervisorSideBySide.count}次`"
    test-id="panel-quality"
  >
    <template #right>
      <button
        type="button"
        class="text-[11px] font-medium text-sky-400 hover:text-sky-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        @click="emit('open-detail')"
      >
        巡查/检测明细
      </button>
    </template>

    <div class="flex-1 min-h-0 flex flex-col gap-1.5 overflow-y-auto panel-scroll pr-1">
      <!-- 1. 自检上报与监理审核合格：工序自检 / 隐蔽工程 / 混凝土 -->
      <div class="rounded bg-[#091222] border border-slate-800/80 p-2 shrink-0">
        <div class="flex items-center justify-between text-[11px] mb-1">
          <span class="font-semibold text-sky-300">施工自检（上报 / 监理审核合格）</span>
          <span class="text-[10px] font-mono-num text-slate-400">
            工序+隐蔽上传 <strong class="text-slate-100">{{ stats.selfUploadTotal }}</strong>
          </span>
        </div>
        <div class="grid grid-cols-3 gap-1.5 text-center">
          <div class="px-1.5 py-1 rounded bg-[#08101E] border border-slate-800/70">
            <div class="text-[10px] text-slate-400">工序自检</div>
            <div class="text-xs font-bold font-mono-num mt-0.5">
              <span class="text-slate-100">{{ stats.processSelfCheck.uploaded }}</span>
              <span class="text-slate-500 mx-0.5">/</span>
              <span class="text-emerald-400">{{ stats.processSelfCheck.supervisorApproved }}</span>
            </div>
          </div>
          <div class="px-1.5 py-1 rounded bg-[#08101E] border border-slate-800/70">
            <div class="text-[10px] text-slate-400">隐蔽工程</div>
            <div class="text-xs font-bold font-mono-num mt-0.5">
              <span class="text-slate-100">{{ stats.concealedSelfCheck.uploaded }}</span>
              <span class="text-slate-500 mx-0.5">/</span>
              <span class="text-emerald-400">{{ stats.concealedSelfCheck.supervisorApproved }}</span>
            </div>
          </div>
          <div class="px-1.5 py-1 rounded bg-[#08101E] border border-slate-800/70">
            <div class="text-[10px] text-slate-400">混凝土</div>
            <div class="text-xs font-bold font-mono-num mt-0.5">
              <span class="text-slate-100">{{ stats.concreteSelfCheck.uploaded }}</span>
              <span class="text-slate-500 mx-0.5">/</span>
              <span class="text-emerald-400">{{ stats.concreteSelfCheck.supervisorApproved }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. 平行检测合格数量 & 监理旁站 -->
      <div class="grid grid-cols-2 gap-1.5 shrink-0">
        <div class="rounded bg-[#091222] border border-slate-800/80 p-2">
          <div class="text-[11px] font-semibold text-emerald-300 mb-1">
            平行检测合格数
          </div>
          <div class="flex items-center justify-between text-[11px]">
            <span class="text-slate-400">工序</span>
            <span class="font-mono-num font-semibold text-emerald-400">
              {{ stats.parallelCheck.processPassed }}/{{ stats.parallelCheck.processTotal }}
            </span>
          </div>
          <div class="flex items-center justify-between text-[11px] mt-0.5">
            <span class="text-slate-400">隐蔽工程</span>
            <span class="font-mono-num font-semibold text-emerald-400">
              {{ stats.parallelCheck.concealedPassed }}/{{ stats.parallelCheck.concealedTotal }}
            </span>
          </div>
        </div>

        <div class="rounded bg-[#091222] border border-slate-800/80 p-2">
          <div class="text-[11px] font-semibold text-amber-300 mb-1">
            监理旁站（项目维）
          </div>
          <div class="flex items-center justify-between text-[11px]">
            <span class="text-slate-400">旁站次数</span>
            <span class="font-mono-num font-semibold text-slate-100">
              {{ stats.supervisorSideBySide.count }} 次
            </span>
          </div>
          <div class="flex items-center justify-between text-[11px] mt-0.5">
            <span class="text-slate-400">累计时长</span>
            <span class="font-mono-num font-semibold text-sky-300">
              {{ stats.supervisorSideBySide.hours }} 小时
            </span>
          </div>
        </div>
      </div>

      <!-- 3. 质量巡查（参考高标质量巡查） -->
      <div class="rounded bg-[#091222] border border-slate-800/80 p-2 shrink-0">
        <div class="flex items-center justify-between text-[11px] mb-1">
          <span class="font-semibold text-slate-200">质量巡查</span>
          <span class="text-[10px] text-slate-400">参考高标巡查闭环</span>
        </div>
        <div class="grid grid-cols-4 gap-1 text-center">
          <div>
            <div class="text-[10px] text-slate-400">巡查数</div>
            <div class="text-xs font-bold font-mono-num text-slate-100">
              {{ stats.qualityPatrol.totalPatrols }}
            </div>
          </div>
          <div>
            <div class="text-[10px] text-slate-400">问题数</div>
            <div class="text-xs font-bold font-mono-num text-sky-300">
              {{ stats.qualityPatrol.issueCount }}
            </div>
          </div>
          <div>
            <div class="text-[10px] text-slate-400">待整改</div>
            <div
              :class="[
                'text-xs font-bold font-mono-num',
                stats.qualityPatrol.pendingRectifyCount > 0
                  ? 'text-rose-400'
                  : 'text-slate-400',
              ]"
            >
              {{ stats.qualityPatrol.pendingRectifyCount }}
            </div>
          </div>
          <div>
            <div class="text-[10px] text-slate-400">已整改</div>
            <div class="text-xs font-bold font-mono-num text-emerald-400">
              {{ stats.qualityPatrol.rectifiedCount }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </PanelShell>
</template>
