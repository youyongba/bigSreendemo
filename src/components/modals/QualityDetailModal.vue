<script setup>
import { computed, ref } from 'vue';
import { X } from 'lucide-vue-next';

const props = defineProps({
  isOpen: { type: Boolean, required: true },
  engineeringQuality: { type: Object, required: true },
  rectificationItems: { type: Array, default: () => [] },
});

const emit = defineEmits(['close']);

const mainTab = ref('patrol');
const patrolStatusFilter = ref('ALL');
const checkTypeFilter = ref('ALL');

const filteredPatrols = computed(() =>
  (props.engineeringQuality?.qualityPatrol?.records ?? []).filter((r) =>
    patrolStatusFilter.value === 'ALL' ? true : r.status === patrolStatusFilter.value
  )
);

const filteredChecks = computed(() =>
  (props.engineeringQuality?.checkDetailStats?.records ?? []).filter((r) =>
    checkTypeFilter.value === 'ALL' ? true : r.checkType === checkTypeFilter.value
  )
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
    <div class="w-full max-w-4xl bg-[#0E182B] border border-slate-700 rounded-lg overflow-hidden shadow-2xl">
      <header class="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-[#111F38]">
        <div>
          <h2
            id="quality-detail-title"
            class="text-sm font-semibold text-slate-100"
          >
            工程质量巡查、待整改台账与检测明细
          </h2>
          <p class="text-[11px] text-slate-400 mt-0.5">
            涵盖质量巡查记录、安全/质量待整改提示及施工自检/平行检测原始台账
          </p>
        </div>
        <button
          type="button"
          aria-label="关闭工程质量明细窗口"
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
              type="button"
              :class="[
                'px-3 py-1 text-xs rounded cursor-pointer',
                mainTab === 'patrol'
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-400 hover:text-slate-200',
              ]"
              @click="mainTab = 'patrol'"
            >
              质量巡查台账 ({{ engineeringQuality.qualityPatrol.records.length }})
            </button>
            <button
              type="button"
              :class="[
                'px-3 py-1 text-xs rounded cursor-pointer',
                mainTab === 'rectify'
                  ? 'bg-rose-600 text-white'
                  : 'text-slate-400 hover:text-slate-200',
              ]"
              @click="mainTab = 'rectify'"
            >
              待整改点位提示 ({{ rectificationItems.length }})
            </button>
            <button
              type="button"
              :class="[
                'px-3 py-1 text-xs rounded cursor-pointer',
                mainTab === 'checks'
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-400 hover:text-slate-200',
              ]"
              @click="mainTab = 'checks'"
            >
              自检/平行检测 ({{ engineeringQuality.checkDetailStats.records.length }})
            </button>
          </div>

          <div
            v-if="mainTab === 'patrol'"
            class="flex items-center gap-1 p-1 bg-[#08101E] border border-slate-800 rounded"
          >
            <button
              v-for="s in ['ALL', '待整改', '已整改']"
              :key="s"
              type="button"
              :class="[
                'px-2.5 py-1 text-xs rounded cursor-pointer',
                patrolStatusFilter === s
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-slate-200',
              ]"
              @click="patrolStatusFilter = s"
            >
              {{ s === 'ALL' ? '全部状态' : s }}
            </button>
          </div>

          <div
            v-else-if="mainTab === 'checks'"
            class="flex items-center gap-1 p-1 bg-[#08101E] border border-slate-800 rounded"
          >
            <button
              v-for="t in ['ALL', '施工自检', '平行检测']"
              :key="t"
              type="button"
              :class="[
                'px-2.5 py-1 text-xs rounded cursor-pointer',
                checkTypeFilter === t
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-slate-200',
              ]"
              @click="checkTypeFilter = t"
            >
              {{ t === 'ALL' ? '全部类型' : t }}
            </button>
          </div>
        </div>

        <!-- Tab 1: 质量巡查 -->
        <div
          v-if="mainTab === 'patrol'"
          class="max-h-[55vh] overflow-y-auto panel-scroll border border-slate-800 rounded"
        >
          <table class="w-full text-xs text-left border-collapse">
            <thead class="bg-[#111F38] text-slate-300 sticky top-0">
              <tr>
                <th class="px-3 py-2 font-medium">项目名称</th>
                <th class="px-3 py-2 font-medium">乡镇</th>
                <th class="px-3 py-2 font-medium">标段</th>
                <th class="px-3 py-2 font-medium">巡查事项</th>
                <th class="px-3 py-2 font-medium">状态</th>
                <th class="px-3 py-2 font-medium">巡查日期</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/80 bg-[#091222]">
              <tr v-if="filteredPatrols.length === 0">
                <td colspan="6" class="px-3 py-6 text-center text-slate-400">
                  暂无符合条件的质量巡查记录
                </td>
              </tr>
              <tr v-for="rec in filteredPatrols" :key="rec.id" class="hover:bg-slate-800/40">
                <td class="px-3 py-2 text-slate-200 max-w-[180px] truncate">{{ rec.projectName }}</td>
                <td class="px-3 py-2 text-slate-300">{{ rec.township }}</td>
                <td class="px-3 py-2 text-slate-400">{{ rec.sectionName }}</td>
                <td class="px-3 py-2 text-slate-200">{{ rec.title }}</td>
                <td
                  :class="[
                    'px-3 py-2 font-semibold',
                    rec.status === '已整改' ? 'text-emerald-400' : 'text-rose-400',
                  ]"
                >
                  {{ rec.status }}
                </td>
                <td class="px-3 py-2 font-mono-num text-slate-400">{{ rec.checkedAt }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Tab 2: 待整改提示 -->
        <div
          v-else-if="mainTab === 'rectify'"
          class="max-h-[55vh] overflow-y-auto panel-scroll border border-slate-800 rounded"
        >
          <table class="w-full text-xs text-left border-collapse">
            <thead class="bg-[#111F38] text-slate-300 sticky top-0">
              <tr>
                <th class="px-3 py-2 font-medium">来源</th>
                <th class="px-3 py-2 font-medium">区县 / 乡镇</th>
                <th class="px-3 py-2 font-medium">所属项目</th>
                <th class="px-3 py-2 font-medium">待整改事项</th>
                <th class="px-3 py-2 font-medium">详情说明</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/80 bg-[#091222]">
              <tr v-if="rectificationItems.length === 0">
                <td colspan="5" class="px-3 py-6 text-center text-emerald-400">
                  当前范围暂无待整改事项
                </td>
              </tr>
              <tr v-for="item in rectificationItems" :key="item.id" class="hover:bg-slate-800/40">
                <td class="px-3 py-2 text-rose-400 font-semibold">{{ item.source }}</td>
                <td class="px-3 py-2 text-slate-300">{{ item.county }} · {{ item.township }}</td>
                <td class="px-3 py-2 text-slate-200 max-w-[160px] truncate">{{ item.projectName }}</td>
                <td class="px-3 py-2 text-amber-300">{{ item.title }}</td>
                <td class="px-3 py-2 text-slate-400">{{ item.detail }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Tab 3: 自检/平行检测 -->
        <div
          v-else
          class="max-h-[55vh] overflow-y-auto panel-scroll border border-slate-800 rounded"
        >
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
              <tr v-if="filteredChecks.length === 0">
                <td colspan="6" class="px-3 py-6 text-center text-slate-400">
                  暂无符合条件的检测记录
                </td>
              </tr>
              <tr v-for="rec in filteredChecks" :key="rec.id" class="hover:bg-slate-800/40">
                <td class="px-3 py-2 text-slate-200 max-w-[180px] truncate">{{ rec.projectName }}</td>
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
                <td class="px-3 py-2 font-mono-num text-slate-400">{{ rec.checkedAt }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
