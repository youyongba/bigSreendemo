<script setup>
import { computed, ref, watch } from 'vue';
import { SEED_PROJECTS } from './data/seedProjects.js';
import {
  addSectionDisbursement,
  calcAcceptanceStats,
  calcEngineeringQualityStats,
  calcHandoverStats,
  calcInvestmentStats,
  calcMapCityStats,
  calcMapOverlayPoints,
  calcOrganicFertilizerStats,
  calcPersonnelStats,
  calcRectificationItems,
  calcSafetySignStats,
  filterProjectForLevel3,
  filterProjects,
  toggleSectionOrganicAttribute,
} from './utils/dashboardCalculations.js';
import TopBar from './components/TopBar.vue';
import JilinMapPanel from './components/JilinMapPanel.vue';
import ProjectOverviewPanel from './components/panels/ProjectOverviewPanel.vue';
import ProgressPanel from './components/panels/ProgressPanel.vue';
import QualityPanel from './components/panels/QualityPanel.vue';
import CenterBottomPanel from './components/panels/CenterBottomPanel.vue';
import PersonnelPanel from './components/panels/PersonnelPanel.vue';
import OrganicPanel from './components/panels/OrganicPanel.vue';
import AcceptancePanel from './components/panels/AcceptancePanel.vue';
import HandoverPanel from './components/panels/HandoverPanel.vue';
import DisbursementModal from './components/modals/DisbursementModal.vue';
import ProjectDetailModal from './components/modals/ProjectDetailModal.vue';
import QualityDetailModal from './components/modals/QualityDetailModal.vue';

const projects = ref(SEED_PROJECTS);
const selectedYear = ref(2025);
const activeRole = ref('province'); // 'province' | 'city' | 'county'
const activeLevel = ref(1); // 1 | 2 | 3
const selectedCity = ref(null);
const selectedCounty = ref(null);
const activeOverviewProjectId = ref(null);

const level3Filters = ref({
  township: 'ALL',
  sectionId: 'ALL',
  category: 'ALL',
});

const acceptanceQuery = ref('');
const isDisbursementOpen = ref(false);
const isQualityDetailOpen = ref(false);
const detailModalProjectId = ref(null);

const yearProjects = computed(() =>
  filterProjects(projects.value, selectedYear.value, null, null)
);

// 一级/二级/三级对应的区域项目列表（未做三级乡镇/标段细分前）
const regionProjects = computed(() => {
  if (activeLevel.value === 1) {
    return yearProjects.value;
  }
  if (activeLevel.value === 2) {
    return filterProjects(projects.value, selectedYear.value, selectedCity.value, null);
  }
  return filterProjects(
    projects.value,
    selectedYear.value,
    selectedCity.value,
    selectedCounty.value
  );
});

// 保持左一选中的项目在当前区域列表内
watch(
  regionProjects,
  (list) => {
    if (list.length === 0) {
      activeOverviewProjectId.value = null;
      return;
    }
    if (!list.some((p) => p.id === activeOverviewProjectId.value)) {
      activeOverviewProjectId.value = list[0].id;
    }
  },
  { immediate: true }
);

// 重置三级细粒度筛选当切换项目或退出三级时
watch(activeOverviewProjectId, () => {
  level3Filters.value = { township: 'ALL', sectionId: 'ALL', category: 'ALL' };
});

const activeOverviewProjectRaw = computed(
  () =>
    regionProjects.value.find((p) => p.id === activeOverviewProjectId.value) ??
    regionProjects.value[0] ??
    null
);

// 最终供各面板统计的 scopedProjects（三级页面下根据顶部筛选条件精确过滤）
const scopedProjects = computed(() => {
  if (activeLevel.value < 3) {
    return regionProjects.value;
  }
  const target = activeOverviewProjectRaw.value;
  if (!target) return [];
  const filtered = filterProjectForLevel3(target, level3Filters.value);
  return filtered ? [filtered] : [];
});

const activeOverviewProject = computed(() => {
  if (activeLevel.value === 3) {
    return scopedProjects.value[0] ?? null;
  }
  return activeOverviewProjectRaw.value;
});

const townshipOptions = computed(() =>
  (activeOverviewProjectRaw.value?.townships ?? []).map((t) => t.name)
);

const sectionOptions = computed(() =>
  (activeOverviewProjectRaw.value?.sections ?? []).map((s) => ({
    id: s.id,
    name: s.name,
  }))
);

const categoryOptions = computed(() => {
  const cats = new Set();
  for (const sec of activeOverviewProjectRaw.value?.sections ?? []) {
    for (const item of sec.engineeringItems ?? []) {
      if (item.category) cats.add(item.category);
    }
  }
  return Array.from(cats);
});

const engineeringQualityStats = computed(() =>
  calcEngineeringQualityStats(scopedProjects.value)
);
const rectificationItems = computed(() =>
  calcRectificationItems(scopedProjects.value)
);
const investmentStats = computed(() =>
  calcInvestmentStats(scopedProjects.value)
);
const safetyStats = computed(() => calcSafetySignStats(scopedProjects.value));
const overlayCounts = computed(
  () => calcMapOverlayPoints(scopedProjects.value).counts
);
const personnelStats = computed(() => calcPersonnelStats(scopedProjects.value));
const organicStats = computed(() =>
  calcOrganicFertilizerStats(scopedProjects.value)
);
const acceptanceStats = computed(() =>
  calcAcceptanceStats(scopedProjects.value, acceptanceQuery.value)
);
const handoverStats = computed(() => calcHandoverStats(scopedProjects.value));
const mapCityStats = computed(() => calcMapCityStats(yearProjects.value));

const detailModalProject = computed(
  () => projects.value.find((p) => p.id === detailModalProjectId.value) ?? null
);

function handleSelectRole(role) {
  activeRole.value = role;
  if (role === 'province') {
    activeLevel.value = 1;
    selectedCity.value = null;
    selectedCounty.value = null;
  } else if (role === 'city') {
    const fallbackProject = activeOverviewProjectRaw.value ?? yearProjects.value[0];
    if (!selectedCity.value && fallbackProject) {
      selectedCity.value = fallbackProject.city;
    }
    selectedCounty.value = null;
    activeLevel.value = 2;
  } else if (role === 'county') {
    const fallbackProject = activeOverviewProjectRaw.value ?? yearProjects.value[0];
    if (fallbackProject) {
      selectedCity.value = selectedCity.value ?? fallbackProject.city;
      selectedCounty.value = selectedCounty.value ?? fallbackProject.county;
    }
    activeLevel.value = 3;
  }
}

function handleSelectYear(yr) {
  selectedYear.value = yr;
  level3Filters.value = { township: 'ALL', sectionId: 'ALL', category: 'ALL' };
  const nextYearList = filterProjects(projects.value, yr, null, null);
  if (activeLevel.value === 2 && selectedCity.value) {
    const hasCity = nextYearList.some((p) => p.city === selectedCity.value);
    if (!hasCity) {
      selectedCity.value = nextYearList[0]?.city ?? null;
    }
  } else if (activeLevel.value === 3) {
    const hasCounty = nextYearList.some(
      (p) => p.city === selectedCity.value && p.county === selectedCounty.value
    );
    if (!hasCounty && nextYearList[0]) {
      selectedCity.value = nextYearList[0].city;
      selectedCounty.value = nextYearList[0].county;
    }
  }
}

function handleMapSelectCity(cityName) {
  selectedCity.value = cityName;
  selectedCounty.value = null;
  activeLevel.value = 2;
  activeRole.value = 'city';
}

function handleMapSelectCounty(countyName) {
  const hasProjectsInCounty = filterProjects(
    projects.value,
    selectedYear.value,
    selectedCity.value,
    countyName
  ).length > 0;
  selectedCounty.value = countyName;
  activeLevel.value = 3;
  activeRole.value = 'county';
  if (!hasProjectsInCounty) {
    // 若所点击区县暂无本年份项目，依然保留县域边界地图展示
    activeOverviewProjectId.value = null;
  }
}

function handleGoLevel(level) {
  if (level === 1) {
    handleSelectRole('province');
  } else if (level === 2 && selectedCity.value) {
    handleSelectRole('city');
  }
}

function handleSelectProjectFromMap(project) {
  if (!project) return;
  activeOverviewProjectId.value = project.id;
  detailModalProjectId.value = project.id;
}

function handleUpdateLevel3Filter(key, val) {
  level3Filters.value = {
    ...level3Filters.value,
    [key]: val,
  };
}

function handleResetLevel3Filters() {
  level3Filters.value = { township: 'ALL', sectionId: 'ALL', category: 'ALL' };
}

function handleAddDisbursement(input) {
  const result = addSectionDisbursement(projects.value, input);
  if (result.ok) {
    projects.value = result.projects;
    return { ok: true };
  }
  return { ok: false, error: result.error };
}

function handleToggleOrganicAttribute(projectId, sectionId) {
  projects.value = toggleSectionOrganicAttribute(projects.value, projectId, sectionId);
}
</script>

<template>
  <div class="min-h-screen xl:h-screen flex flex-col bg-[#08101E] text-slate-100 xl:overflow-hidden">
    <TopBar
      :active-role="activeRole"
      :active-level="activeLevel"
      :selected-year="selectedYear"
      :selected-city="selectedCity"
      :selected-county="selectedCounty"
      :level3-projects="regionProjects"
      :active-project-id="activeOverviewProjectId"
      :township-options="townshipOptions"
      :section-options="sectionOptions"
      :category-options="categoryOptions"
      :level3-filters="level3Filters"
      @select-role="handleSelectRole"
      @select-year="handleSelectYear"
      @go-back-province="handleGoLevel(1)"
      @go-back-city="handleGoLevel(2)"
      @open-disbursement="isDisbursementOpen = true"
      @select-project-id="(id) => (activeOverviewProjectId = id)"
      @update-level3-filter="handleUpdateLevel3Filter"
      @reset-level3-filters="handleResetLevel3Filters"
    />

    <main class="flex-1 min-h-0 p-2.5 grid grid-cols-1 xl:grid-cols-12 gap-2.5 overflow-y-auto xl:overflow-hidden">
      <!-- Left Column: 左一 项目概况手风琴, 左二 项目进度, 左三 工程质量（无农田规划区、无预警信息） -->
      <div class="xl:col-span-3 flex flex-col xl:grid xl:grid-rows-[minmax(0,1.08fr)_minmax(0,0.9fr)_minmax(0,1.22fr)] gap-2.5 min-h-0 xl:h-full">
        <ProjectOverviewPanel
          :projects="regionProjects"
          :active-project-id="activeOverviewProjectId"
          @select-project-id="(id) => (activeOverviewProjectId = id)"
          @open-project-detail="(p) => (detailModalProjectId = p.id)"
        />
        <ProgressPanel
          :project="activeOverviewProject"
          @select-project="(p) => (detailModalProjectId = p.id)"
        />
        <QualityPanel
          :stats="engineeringQualityStats"
          @open-detail="isQualityDetailOpen = true"
        />
      </div>

      <!-- Center Column: 中间地图 + 中下 -->
      <div class="xl:col-span-6 flex flex-col gap-2.5 min-h-[540px] xl:min-h-0 xl:h-full">
        <JilinMapPanel
          :projects="scopedProjects"
          :city-stats="mapCityStats"
          :selected-year="selectedYear"
          :active-level="activeLevel"
          :selected-city="selectedCity"
          :selected-county="selectedCounty"
          @select-city="handleMapSelectCity"
          @select-county="handleMapSelectCounty"
          @select-project="handleSelectProjectFromMap"
          @go-level="handleGoLevel"
          @open-rectify-detail="isQualityDetailOpen = true"
        />
        <CenterBottomPanel
          :investment-stats="investmentStats"
          :safety-stats="safetyStats"
          :overlay-counts="overlayCounts"
          @open-disbursement="isDisbursementOpen = true"
        />
      </div>

      <!-- Right Column: 右一 ~ 右四 -->
      <div class="xl:col-span-3 flex flex-col xl:grid xl:grid-rows-4 gap-2.5 min-h-0 xl:h-full">
        <PersonnelPanel :stats="personnelStats" />
        <OrganicPanel
          :stats="organicStats"
          @select-project-id="(id) => (detailModalProjectId = id)"
        />
        <AcceptancePanel
          :stats="acceptanceStats"
          :query="acceptanceQuery"
          @update:query="(q) => (acceptanceQuery = q)"
          @select-project-id="(id) => (detailModalProjectId = id)"
        />
        <HandoverPanel
          :stats="handoverStats"
          @select-project-id="(id) => (detailModalProjectId = id)"
        />
      </div>
    </main>

    <DisbursementModal
      :is-open="isDisbursementOpen"
      :sections="investmentStats.inConstructionSections"
      :on-submit="handleAddDisbursement"
      @close="isDisbursementOpen = false"
    />

    <ProjectDetailModal
      :project="detailModalProject"
      @close="detailModalProjectId = null"
      @toggle-organic-attribute="handleToggleOrganicAttribute"
      @open-disbursement="isDisbursementOpen = true"
    />

    <QualityDetailModal
      :is-open="isQualityDetailOpen"
      :engineering-quality="engineeringQualityStats"
      :rectification-items="rectificationItems"
      @close="isQualityDetailOpen = false"
    />
  </div>
</template>
