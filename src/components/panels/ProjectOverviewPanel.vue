<script setup>
import { ref, watch } from 'vue';
import { ChevronDown, ExternalLink } from 'lucide-vue-next';
import PanelShell from '../PanelShell.vue';

const props = defineProps({
  projects: { type: Array, required: true },
  activeProjectId: { type: String, default: null },
});

const emit = defineEmits(['select-project-id', 'open-project-detail']);

const openSection = ref('basic');

const activeProject = ref(null);

watch(
  () => [props.projects, props.activeProjectId],
  () => {
    const found =
      props.projects.find((p) => p.id === props.activeProjectId) ??
      props.projects[0] ??
      null;
    activeProject.value = found;
  },
  { immediate: true, deep: true }
);

function toggleAccordion(key) {
  openSection.value = openSection.value === key ? null : key;
}

const ACCORDION_ITEMS = [
  { key: 'basic', title: '项目基本信息' },
  { key: 'scale', title: '建设规模与资金构成' },
  { key: 'units', title: '参建主体单位' },
  { key: 'towns', title: '覆盖乡镇与项目区' },
];
</script>

<template>
  <PanelShell
    title="项目概况"
    :subtitle="activeProject ? `${activeProject.city} · ${activeProject.county}` : '暂无匹配项目'"
    test-id="panel-project-overview"
  >
    <template #right>
      <button
        v-if="activeProject"
        type="button"
        class="inline-flex items-center gap-1 text-[11px] font-medium text-sky-400 hover:text-sky-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        @click="emit('open-project-detail', activeProject)"
      >
        <span>完整档案</span>
        <ExternalLink class="w-3 h-3" aria-hidden="true" />
      </button>
    </template>

    <!-- 项目切换下拉 -->
    <div class="mb-1.5 shrink-0">
      <label for="left-project-switcher" class="sr-only">切换当前查看项目</label>
      <select
        id="left-project-switcher"
        data-testid="project-switcher"
        :value="activeProject?.id ?? ''"
        :disabled="projects.length === 0"
        class="w-full px-2.5 py-1 text-xs font-medium bg-[#08101E] text-slate-100 border border-slate-700/80 rounded focus:outline-none focus:border-sky-500 cursor-pointer"
        @change="emit('select-project-id', $event.target.value)"
      >
        <option v-if="projects.length === 0" value="">
          当前筛选条件下暂无项目
        </option>
        <option
          v-for="proj in projects"
          :key="proj.id"
          :value="proj.id"
        >
          {{ proj.name }}（{{ proj.status }}）
        </option>
      </select>
    </div>

    <div
      v-if="!activeProject"
      class="flex-1 flex items-center justify-center text-xs text-slate-400"
    >
      请选择年份或区域查看项目概况
    </div>

    <!-- 手风琴项目概况 -->
    <div
      v-else
      class="flex-1 min-h-0 flex flex-col gap-1 overflow-y-auto panel-scroll pr-1"
    >
      <div
        v-for="item in ACCORDION_ITEMS"
        :key="item.key"
        class="rounded border border-slate-800/90 bg-[#091222] shrink-0 overflow-hidden"
      >
        <button
          type="button"
          :data-testid="`accordion-trigger-${item.key}`"
          :aria-expanded="openSection === item.key"
          class="w-full flex items-center justify-between px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 hover:bg-[#10203B] transition-colors cursor-pointer"
          @click="toggleAccordion(item.key)"
        >
          <span>{{ item.title }}</span>
          <ChevronDown
            :class="[
              'w-3.5 h-3.5 text-slate-400 transition-transform duration-150',
              openSection === item.key ? 'rotate-180 text-sky-400' : '',
            ]"
            aria-hidden="true"
          />
        </button>

        <div
          v-if="openSection === item.key"
          :data-testid="`accordion-body-${item.key}`"
          class="px-2.5 pb-2 pt-1 border-t border-slate-800/70 text-[11px] text-slate-300 space-y-1"
        >
          <template v-if="item.key === 'basic'">
            <div class="flex justify-between gap-2">
              <span class="text-slate-400 shrink-0">项目编号</span>
              <span class="font-mono-num text-slate-200 truncate">
                {{ activeProject.overview?.code ?? activeProject.id }}
              </span>
            </div>
            <div class="flex justify-between gap-2">
              <span class="text-slate-400 shrink-0">建设工期</span>
              <span class="font-mono-num text-slate-200">
                {{ activeProject.overview?.startDate ?? '-' }} ~ {{ activeProject.plannedEndDate }}
              </span>
            </div>
            <div class="flex justify-between gap-2">
              <span class="text-slate-400 shrink-0">当前阶段</span>
              <span class="text-sky-300 truncate">{{ activeProject.currentPhase }}</span>
            </div>
            <p class="text-[10px] leading-relaxed text-slate-400 pt-0.5">
              {{ activeProject.overview?.summary }}
            </p>
          </template>

          <template v-else-if="item.key === 'scale'">
            <div class="grid grid-cols-2 gap-1.5">
              <div class="px-2 py-1 rounded bg-[#08101E] border border-slate-800/70">
                <div class="text-[10px] text-slate-400">建设总规模</div>
                <div class="font-mono-num font-bold text-emerald-400">
                  {{ activeProject.areaMu }} 万亩
                </div>
              </div>
              <div class="px-2 py-1 rounded bg-[#08101E] border border-slate-800/70">
                <div class="text-[10px] text-slate-400">项目总投资</div>
                <div class="font-mono-num font-bold text-sky-400">
                  {{ activeProject.totalInvestment.toLocaleString('zh-CN') }} 万元
                </div>
              </div>
              <div class="px-2 py-1 rounded bg-[#08101E] border border-slate-800/70">
                <div class="text-[10px] text-slate-400">中央财政预算</div>
                <div class="font-mono-num text-slate-200">
                  {{ (activeProject.overview?.centralBudget ?? 0).toLocaleString('zh-CN') }} 万元
                </div>
              </div>
              <div class="px-2 py-1 rounded bg-[#08101E] border border-slate-800/70">
                <div class="text-[10px] text-slate-400">地方配套资金</div>
                <div class="font-mono-num text-slate-200">
                  {{ (activeProject.overview?.localFunding ?? 0).toLocaleString('zh-CN') }} 万元
                </div>
              </div>
            </div>
          </template>

          <template v-else-if="item.key === 'units'">
            <div class="flex justify-between gap-2">
              <span class="text-slate-400 shrink-0">建设单位</span>
              <span class="text-slate-200 truncate">
                {{ activeProject.overview?.constructionUnit ?? '-' }}
              </span>
            </div>
            <div class="flex justify-between gap-2">
              <span class="text-slate-400 shrink-0">设计单位</span>
              <span class="text-slate-200 truncate">
                {{ activeProject.overview?.designUnit ?? '-' }}
              </span>
            </div>
            <div class="flex justify-between gap-2">
              <span class="text-slate-400 shrink-0">监理机构</span>
              <span class="text-slate-200 truncate">
                {{ activeProject.overview?.superviseOrg ?? '-' }}
              </span>
            </div>
            <div class="flex justify-between gap-2">
              <span class="text-slate-400 shrink-0">标段划分</span>
              <span class="font-mono-num text-sky-300">
                共 {{ activeProject.sections?.length ?? 0 }} 个标段
              </span>
            </div>
          </template>

          <template v-else-if="item.key === 'towns'">
            <div class="flex flex-wrap gap-1.5">
              <span
                v-for="tw in activeProject.townships ?? []"
                :key="tw.id"
                class="px-1.5 py-0.5 rounded bg-[#08101E] border border-slate-800 text-[10px] text-slate-300 font-mono-num"
              >
                {{ tw.name }} · {{ tw.areaMu }}万亩 ({{ tw.progressPercent }}%)
              </span>
            </div>
          </template>
        </div>
      </div>
    </div>
  </PanelShell>
</template>
