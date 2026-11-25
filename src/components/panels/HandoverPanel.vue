<script setup>
import PanelShell from '../PanelShell.vue';

defineProps({
  stats: { type: Object, required: true },
});

const emit = defineEmits(['select-project-id']);

function getStatusColor(status) {
  if (status === '已移交管护') return 'text-emerald-400';
  if (status === '移交办理中') return 'text-sky-400';
  return 'text-amber-400';
}
</script>

<template>
  <PanelShell
    title="移交管护"
    :subtitle="`共 ${stats.totalProjects} 个项目`"
    test-id="panel-handover"
  >
    <template #right>
      <span class="text-[11px] font-mono-num text-emerald-400 whitespace-nowrap shrink-0">
        移交率 {{ stats.handoverRate }}%
      </span>
    </template>

    <div class="grid grid-cols-3 gap-1.5 text-center bg-[#091222] border border-slate-800/80 rounded px-2 py-1 mb-1.5 shrink-0">
      <div>
        <div class="text-[10px] text-slate-400">已移交管护</div>
        <div class="text-sm font-bold font-mono-num text-emerald-400">
          {{ stats.handedOverCount }}
        </div>
      </div>
      <div class="border-x border-slate-800/80">
        <div class="text-[10px] text-slate-400">移交办理中</div>
        <div class="text-sm font-bold font-mono-num text-sky-400">
          {{ stats.inProgressCount }}
        </div>
      </div>
      <div>
        <div class="text-[10px] text-slate-400">待移交</div>
        <div class="text-sm font-bold font-mono-num text-amber-400">
          {{ stats.pendingCount }}
        </div>
      </div>
    </div>

    <div class="flex-1 min-h-0 flex flex-col gap-1 overflow-y-auto panel-scroll pr-1.5">
      <div
        v-if="stats.list.length === 0"
        class="text-xs text-slate-400 py-3 text-center"
      >
        暂无移交管护项目
      </div>
      <button
        v-for="item in stats.list"
        :key="item.projectId"
        type="button"
        class="w-full text-left flex items-center justify-between gap-2 px-2 py-1 rounded bg-[#091222] hover:bg-[#10203B] border border-slate-800/75 text-[11px] transition-colors cursor-pointer shrink-0"
        @click="emit('select-project-id', item.projectId)"
      >
        <div class="min-w-0">
          <div class="text-slate-200 truncate">{{ item.projectName }}</div>
          <div class="text-[10px] text-slate-500 truncate">
            {{ item.custodianUnit ? `管护主体：${item.custodianUnit}` : '尚未指定管护主体' }}
          </div>
        </div>
        <span :class="['font-medium shrink-0', getStatusColor(item.status)]">
          {{ item.status }}
        </span>
      </button>
    </div>
  </PanelShell>
</template>
