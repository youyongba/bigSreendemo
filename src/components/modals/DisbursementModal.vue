<script setup>
import { computed, ref, watch } from 'vue';
import { FileUp, X } from 'lucide-vue-next';

const props = defineProps({
  isOpen: { type: Boolean, required: true },
  sections: { type: Array, required: true },
  onSubmit: { type: Function, required: true },
});

const emit = defineEmits(['close']);

const CATEGORIES = [
  '进度款申请表',
  '监理工程量审核单',
  '财务拨付凭证',
  '竣工结算初审单',
];

const selectedSectionKey = ref('');
const amount = ref('');
const materialCategory = ref('进度款申请表');
const materialName = ref('');
const operator = ref('建设单位财务专办');
const remark = ref('');
const errorMsg = ref('');
const successMsg = ref('');
const fileInputRef = ref(null);

watch(
  () => [props.isOpen, props.sections],
  () => {
    if (props.isOpen && props.sections.length > 0 && !selectedSectionKey.value) {
      selectedSectionKey.value = `${props.sections[0].projectId}::${props.sections[0].sectionId}`;
    }
  },
  { immediate: true }
);

const activeSection = computed(
  () =>
    props.sections.find((s) => `${s.projectId}::${s.sectionId}` === selectedSectionKey.value) ??
    props.sections[0]
);

function handleFileChange(e) {
  const file = e.target.files?.[0];
  if (file) {
    materialName.value = file.name;
    errorMsg.value = '';
  }
}

function handleSectionChange(val) {
  selectedSectionKey.value = val;
  errorMsg.value = '';
  successMsg.value = '';
}

function handleFormSubmit() {
  errorMsg.value = '';
  successMsg.value = '';
  if (!activeSection.value) {
    errorMsg.value = '当前筛选年份下暂无施工中标段';
    return;
  }
  const parsedAmount = Number(amount.value);
  const result = props.onSubmit({
    projectId: activeSection.value.projectId,
    sectionId: activeSection.value.sectionId,
    amount: parsedAmount,
    materialName: materialName.value,
    materialCategory: materialCategory.value,
    operator: operator.value,
    remark: remark.value,
  });
  if (!result.ok) {
    errorMsg.value = result.error ?? '提交失败，请检查输入';
    return;
  }
  successMsg.value = `已成功向「${activeSection.value.sectionName}」拨付 ${parsedAmount} 万元（累计第 ${
    activeSection.value.disbursementCount + 1
  } 次拨付）`;
  amount.value = '';
  materialName.value = '';
  remark.value = '';
}
</script>

<template>
  <div
    v-if="isOpen"
    role="dialog"
    aria-modal="true"
    aria-labelledby="disbursement-modal-title"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
  >
    <div class="w-full max-w-2xl bg-[#0E182B] border border-slate-700 rounded-lg overflow-hidden shadow-2xl">
      <header class="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-[#111F38]">
        <div>
          <h2
            id="disbursement-modal-title"
            class="text-sm font-semibold text-slate-100"
          >
            施工中标段拨付材料上传与资金拨付
          </h2>
          <p class="text-[11px] text-slate-400 mt-0.5">
            建设单位在施工状态标段中上传佐证材料并填写拨付金额，支持同一标段多次拨付
          </p>
        </div>
        <button
          type="button"
          aria-label="关闭拨付录入窗口"
          class="p-1.5 text-slate-400 hover:text-slate-100 rounded hover:bg-slate-800 cursor-pointer"
          @click="emit('close')"
        >
          <X class="w-4 h-4" aria-hidden="true" />
        </button>
      </header>

      <div class="p-5 max-h-[82vh] overflow-y-auto panel-scroll">
        <div
          v-if="sections.length === 0"
          class="py-10 text-center text-sm text-slate-400"
        >
          当前年份/区域筛选下暂无处于「施工中」状态的标段，请切换至 2025年、2026年 或 全部年份。
        </div>
        <form v-else class="flex flex-col gap-4" @submit.prevent="handleFormSubmit">
          <div>
            <label
              for="disbursement-section-select"
              class="block text-xs font-medium text-slate-300 mb-1"
            >
              选择施工中标段
            </label>
            <select
              id="disbursement-section-select"
              :value="`${activeSection.projectId}::${activeSection.sectionId}`"
              class="w-full px-3 py-2 text-xs bg-[#08101E] text-slate-100 border border-slate-700 rounded focus:outline-none focus:border-sky-500"
              @change="handleSectionChange($event.target.value)"
            >
              <option
                v-for="s in sections"
                :key="`${s.projectId}::${s.sectionId}`"
                :value="`${s.projectId}::${s.sectionId}`"
              >
                {{ s.projectName }} — {{ s.sectionName }}（剩余可拨 {{ s.remainingDisbursable }} 万元）
              </option>
            </select>
          </div>

          <div class="grid grid-cols-4 gap-2 p-2.5 rounded bg-[#091222] border border-slate-800 text-xs">
            <div>
              <div class="text-[10px] text-slate-400">中标金额</div>
              <div class="font-mono-num font-semibold text-slate-100">
                {{ activeSection.bidAmount }} 万元
              </div>
            </div>
            <div>
              <div class="text-[10px] text-slate-400">累计已拨付</div>
              <div class="font-mono-num font-semibold text-amber-400">
                {{ activeSection.disbursedAmount }} 万元
              </div>
            </div>
            <div>
              <div class="text-[10px] text-slate-400">剩余可拨付</div>
              <div class="font-mono-num font-semibold text-emerald-400">
                {{ activeSection.remainingDisbursable }} 万元
              </div>
            </div>
            <div>
              <div class="text-[10px] text-slate-400">历史拨付次数</div>
              <div class="font-mono-num font-semibold text-sky-400">
                {{ activeSection.disbursementCount }} 次
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                for="disbursement-amount-input"
                class="block text-xs font-medium text-slate-300 mb-1"
              >
                本次拨付金额（万元）
              </label>
              <input
                id="disbursement-amount-input"
                v-model="amount"
                type="number"
                step="0.01"
                min="0.01"
                :placeholder="`最大可填 ${activeSection.remainingDisbursable}`"
                class="w-full px-3 py-2 text-xs font-mono-num bg-[#08101E] text-slate-100 border border-slate-700 rounded focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label
                for="disbursement-category-select"
                class="block text-xs font-medium text-slate-300 mb-1"
              >
                拨付材料类型
              </label>
              <select
                id="disbursement-category-select"
                v-model="materialCategory"
                class="w-full px-3 py-2 text-xs bg-[#08101E] text-slate-100 border border-slate-700 rounded focus:outline-none focus:border-sky-500"
              >
                <option v-for="c in CATEGORIES" :key="c" :value="c">
                  {{ c }}
                </option>
              </select>
            </div>
          </div>

          <div>
            <label
              for="disbursement-material-name"
              class="block text-xs font-medium text-slate-300 mb-1"
            >
              上传拨付材料（必填）
            </label>
            <div class="flex flex-col sm:flex-row gap-2">
              <input
                id="disbursement-material-name"
                v-model="materialName"
                type="text"
                placeholder="请点击右侧选择文件上传，或填写材料编号文件名"
                class="flex-1 px-3 py-2 text-xs bg-[#08101E] text-slate-100 border border-slate-700 rounded focus:outline-none focus:border-sky-500"
              />
              <button
                type="button"
                class="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-sky-200 bg-sky-900/50 hover:bg-sky-800/60 border border-sky-700/60 rounded cursor-pointer whitespace-nowrap shrink-0"
                @click="fileInputRef?.click()"
              >
                <FileUp class="w-3.5 h-3.5" aria-hidden="true" />
                <span>选择文件</span>
              </button>
              <input
                ref="fileInputRef"
                type="file"
                class="hidden"
                @change="handleFileChange"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                for="disbursement-operator-input"
                class="block text-xs font-medium text-slate-300 mb-1"
              >
                建设单位经办人
              </label>
              <input
                id="disbursement-operator-input"
                v-model="operator"
                type="text"
                class="w-full px-3 py-2 text-xs bg-[#08101E] text-slate-100 border border-slate-700 rounded focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label
                for="disbursement-remark-input"
                class="block text-xs font-medium text-slate-300 mb-1"
              >
                拨付说明（选填）
              </label>
              <input
                id="disbursement-remark-input"
                v-model="remark"
                type="text"
                placeholder="如：三期工程量进度款"
                class="w-full px-3 py-2 text-xs bg-[#08101E] text-slate-100 border border-slate-700 rounded focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div
            v-if="errorMsg"
            role="alert"
            class="px-3 py-2 text-xs text-rose-300 bg-rose-950/60 border border-rose-700/60 rounded"
          >
            {{ errorMsg }}
          </div>

          <div
            v-if="successMsg"
            role="status"
            class="px-3 py-2 text-xs text-emerald-300 bg-emerald-950/60 border border-emerald-700/60 rounded"
          >
            {{ successMsg }}
          </div>

          <div class="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              class="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded cursor-pointer"
              @click="emit('close')"
            >
              关闭
            </button>
            <button
              type="submit"
              class="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded cursor-pointer"
            >
              确认提交拨付
            </button>
          </div>

          <div class="pt-3 border-t border-slate-800">
            <div class="text-xs font-medium text-slate-300 mb-2">
              本标段历史拨付台账（共 {{ activeSection.disbursements.length }} 笔）
            </div>
            <div class="flex flex-col gap-1.5 max-h-36 overflow-y-auto panel-scroll pr-1.5">
              <div
                v-for="d in activeSection.disbursements"
                :key="d.id"
                class="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded bg-[#091222] border border-slate-800 text-[11px]"
              >
                <div class="min-w-0">
                  <div class="text-slate-200 truncate">
                    {{ d.materialCategory }} · {{ d.materialName }}
                  </div>
                  <div class="text-[10px] text-slate-500">
                    {{ d.disbursedAt }} · 经办：{{ d.operator }}
                  </div>
                </div>
                <span class="font-mono-num font-bold text-amber-400 shrink-0">
                  +{{ d.amount }} 万元
                </span>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
