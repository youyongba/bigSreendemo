<script setup>
import { computed, ref } from 'vue';
import { X } from 'lucide-vue-next';

const props = defineProps({
  isOpen: { type: Boolean, required: true },
  stats: { type: Object, required: true },
});

const emit = defineEmits(['close']);

const typeFilter = ref('ALL');
const resultFilter = ref('ALL');

const filtered = computed(() =>
  props.stats.records.filter((r) => {
    const matchType = typeFilter.value === 'ALL' || r.checkType === typeFilter.value;
    const matchRes = resultFilter.value === 'ALL' || r.result === resultFilter.value;
    return matchType && matchRes;
  })
);
</script>

<template>
  <div
    v-if="isOpen"
    role="dialog"
    aria-modal="true"
    aria-labelledby="quality-detail-title"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
  >
    <div class="w-full max-w-3xl bg-[#0E182B] border border-slate-700 rounded-lg overflow-hidden shadow-2xl">
      <header class="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-[#111F38]">
        <div>
          <h2
            id="quality-detail-title"
            class="text-sm font-semibold text-slate-100"
          >
            质量检测结果明细（施工自检 & 平行检测）
          </h2>
          <p class="text-[11px] text-slate-400 mt-0.5">
            无整改流转环节，检测总数与合格/不合格数量严格以检测结果为准
          </p>
        </div>
        <button
          type="button"
          aria-label="关闭质量检测明细窗口"
          class="p-1.5 text-slate-400 hover:text-slate-100 rounded hover:bg-slate-800 cursor-pointer"
          @click="emit('close')"
        >
          <X class="w-4 h-4" aria-hidden="true" />
        </button>
      </header>

      <div class="p-5 flex flex-col gap-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-1 p-1 bg-[#08101E] border border-slate-800 rounded">
            <button
              v-for="t in ['ALL', '施工自检', '平行检测']"
              :key="t"
              type="button"
              :class="[
                'px-2.5 py-1 text-xs rounded cursor-pointer',
                typeFilter === t
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-400 hover:text-slate-200',
              ]"
              @click="typeFilter = t"
            >
              {{ t === 'ALL' ? '全部类型' : t }}
            </button>
          </div>
          <div class="flex items-center gap-1 p-1 bg-[#08101E] border border-slate-800 rounded">
            <button
              v-for="res in ['ALL', '合格', '不合格']"
              :key="res"
              type="button"
              :class="[
                'px-2.5 py-1 text-xs rounded cursor-pointer',
                resultFilter === res
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-slate-200',
              ]"
              @click="resultFilter = res"
            >
              {{ res === 'ALL' ? '全部结果' : res }}
            </button>
          </div>
        </div>

        <div class="max-h-[55vh] overflow-y-auto panel-scroll border border-slate-800 rounded">
          <table class="w-full text-xs text-left border-collapse">
            <thead class="bg-[#111F38] text-slate-300 sticky top-0">
              <tr>
                <th class="px-3 py-2 font-medium">项目名称</th>
                <th class="px-3 py-2 font-medium">标段</th>
                <th class="px-3 py-2 font-medium">检测类型</th>
                <th class="px-3 py-2 font-medium">检测项目</th>
                <th class="px-3 py-2 font-medium">检测结果</th>
                <th class="px-3 py-2 font-medium">检测日期</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/80 bg-[#091222]">
              <tr v-if="filtered.length === 0">
                <td colspan="6" class="px-3 py-6 text-center text-slate-400">
                  暂无符合条件的检测结果记录
                </td>
              </tr>
              <tr
                v-for="rec in filtered"
                :key="rec.id"
                class="hover:bg-slate-800/40"
              >
                <td class="px-3 py-2 text-slate-200 max-w-[180px] truncate">
                  {{ rec.projectName }}
                </td>
                <td class="px-3 py-2 text-slate-400">{{ rec.sectionName }}</td>
                <td class="px-3 py-2 text-sky-300">{{ rec.checkType }}</td>
                <td class="px-3 py-2 text-slate-200">{{ rec.itemName }}</td>
                <td
                  :class="[
                    'px-3 py-2 font-semibold',
                    rec.result === '合格' ? 'text-emerald-400' : 'text-rose-400',
                  ]"
                >
                  {{ rec.result }}
                </td>
                <td class="px-3 py-2 font-mono-num text-slate-400">
                  {{ rec.checkedAt }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
