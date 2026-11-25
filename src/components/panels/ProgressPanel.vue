<script setup>
import PanelShell from '../PanelShell.vue';

defineProps({
  projects: { type: Array, required: true },
});

const emit = defineEmits(['select-project']);
</script>

<template>
  <PanelShell
    title="进行中项目进度"
    :subtitle="`共 ${projects.length} 个在建`"
    test-id="panel-progress"
  >
    <div
      v-if="projects.length === 0"
      class="flex-1 flex items-center justify-center text-xs text-slate-400 text-center"
    >
      当前筛选条件下暂无施工中项目
    </div>
    <div
      v-else
      class="flex-1 min-h-0 flex flex-col gap-1.5 overflow-y-auto panel-scroll pr-1.5"
    >
      <button
        v-for="p in projects"
        :key="p.id"
        type="button"
        class="w-full text-left group px-2 py-1.5 rounded bg-[#091222] hover:bg-[#10203B] border border-slate-800/80 transition-colors cursor-pointer shrink-0"
        @click="emit('select-project', p)"
      >
        <div class="flex items-center justify-between gap-2">
          <span class="text-xs font-medium text-slate-100 group-hover:text-sky-300 truncate">
            {{ p.name }}
          </span>
          <span class="text-xs font-bold font-mono-num text-sky-400 shrink-0">
            {{ p.progressPercent }}%
          </span>
        </div>
        <div class="mt-1 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
          <div
            class="h-full bg-gradient-to-r from-sky-500 to-emerald-400 rounded-full"
            :style="{ width: `${p.progressPercent}%` }"
          />
        </div>
        <div class="mt-0.5 flex items-center justify-between gap-2 text-[10px] text-slate-400">
          <span class="truncate">{{ p.currentPhase }}</span>
          <span class="font-mono-num shrink-0">{{ p.plannedEndDate }}</span>
        </div>
      </button>
    </div>
  </PanelShell>
</template>
