<script setup>
import { computed } from 'vue';
import PanelShell from '../PanelShell.vue';

const props = defineProps({
  stats: { type: Object, required: true },
});

const emit = defineEmits(['select-project-id']);

const maxCount = computed(() =>
  Math.max(1, ...props.stats.byProject.map((p) => p.safetySignCount))
);
</script>

<template>
  <PanelShell
    title="安全管理"
    :subtitle="`安全标牌总数 ${stats.totalSigns} 个`"
    test-id="panel-safety"
  >
    <template #right>
      <span class="text-[11px] font-mono-num text-slate-400 whitespace-nowrap shrink-0">
        均 {{ stats.avgPerProject }} 个/项目
      </span>
    </template>

    <div
      v-if="stats.byProject.length === 0"
      class="flex-1 flex items-center justify-center text-xs text-slate-400"
    >
      暂无项目安全标牌数据
    </div>
    <div
      v-else
      class="flex-1 min-h-0 flex flex-col gap-1.5 overflow-y-auto panel-scroll pr-1.5"
    >
      <button
        v-for="item in stats.byProject"
        :key="item.projectId"
        type="button"
        class="w-full text-left group px-2 py-1 rounded bg-[#091222] hover:bg-[#10203B] border border-slate-800/80 transition-colors cursor-pointer shrink-0"
        @click="emit('select-project-id', item.projectId)"
      >
        <div class="flex items-center justify-between gap-2 text-[11px]">
          <span class="text-slate-200 group-hover:text-sky-300 truncate">
            {{ item.projectName }}
          </span>
          <span class="font-bold font-mono-num text-amber-300 shrink-0">
            {{ item.safetySignCount }} 块
          </span>
        </div>
        <div class="mt-1 flex items-center gap-2">
          <div class="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
            <div
              class="h-full bg-amber-400/90 rounded-full"
              :style="{ width: `${(item.safetySignCount / maxCount) * 100}%` }"
            />
          </div>
          <span class="text-[10px] text-slate-400 font-mono-num shrink-0">
            警示{{ item.details.warning }} · 公示{{ item.details.notice }}
          </span>
        </div>
      </button>
    </div>
  </PanelShell>
</template>
