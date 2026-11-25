<script setup>
import { Search, X } from 'lucide-vue-next';
import PanelShell from '../PanelShell.vue';

defineProps({
  stats: { type: Object, required: true },
  query: { type: String, required: true },
});

const emit = defineEmits(['update:query', 'select-project-id']);
</script>

<template>
  <PanelShell
    title="验收管理"
    :subtitle="`工程 ${stats.totalEngineering} · 验收率 ${stats.overallRate}%`"
    test-id="panel-acceptance"
  >
    <div class="flex items-center gap-2 mb-1.5 shrink-0">
      <div class="relative flex-1 min-w-0">
        <label for="acceptance-project-search" class="sr-only">
          查询项目验收工程数量
        </label>
        <Search
          class="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none"
          aria-hidden="true"
        />
        <input
          id="acceptance-project-search"
          type="text"
          :value="query"
          placeholder="查询项目 / 县区..."
          class="w-full pl-6 pr-6 py-1 text-[11px] bg-[#08101E] text-slate-100 placeholder:text-slate-500 border border-slate-700/80 rounded focus:outline-none focus:border-sky-500"
          @input="emit('update:query', $event.target.value)"
        />
        <button
          v-if="query"
          type="button"
          aria-label="清空验收查询"
          class="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
          @click="emit('update:query', '')"
        >
          <X class="w-3 h-3" aria-hidden="true" />
        </button>
      </div>
      <div class="flex items-center gap-2 text-[11px] font-mono-num shrink-0">
        <span class="text-slate-300">总{{ stats.totalEngineering }}</span>
        <span class="text-amber-400">待{{ stats.totalPending }}</span>
        <span class="text-emerald-400">已{{ stats.totalAccepted }}</span>
      </div>
    </div>

    <div class="flex-1 min-h-0 overflow-y-auto panel-scroll pr-1.5">
      <div
        v-if="stats.rows.length === 0"
        class="text-xs text-slate-400 py-4 text-center"
      >
        未查询到匹配项目的验收记录
      </div>
      <table v-else class="w-full text-[11px] border-collapse">
        <thead class="sticky top-0 bg-[#0E182B]">
          <tr class="text-slate-400 border-b border-slate-800 text-left">
            <th class="pb-1 font-medium">项目名称</th>
            <th class="pb-1 font-medium text-right w-10">总数</th>
            <th class="pb-1 font-medium text-right w-10">待验</th>
            <th class="pb-1 font-medium text-right w-10">已验</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-800/60">
          <tr
            v-for="row in stats.rows"
            :key="row.projectId"
            class="hover:bg-slate-800/40"
          >
            <td class="py-1 pr-2 max-w-[130px]">
              <button
                type="button"
                class="text-left text-slate-200 hover:text-sky-300 truncate block w-full cursor-pointer"
                :title="row.projectName"
                @click="emit('select-project-id', row.projectId)"
              >
                {{ row.projectName }}
              </button>
            </td>
            <td class="py-1 text-right font-mono-num text-slate-200">
              {{ row.totalCount }}
            </td>
            <td class="py-1 text-right font-mono-num text-amber-400">
              {{ row.pendingCount }}
            </td>
            <td class="py-1 text-right font-mono-num text-emerald-400">
              {{ row.acceptedCount }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </PanelShell>
</template>
