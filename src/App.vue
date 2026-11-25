<script setup>
import { computed, ref } from 'vue';
import { SEED_PROJECTS } from './data/seedProjects.js';
import {
  addSectionDisbursement,
  calcAcceptanceStats,
  calcHandoverStats,
  calcInProgressProjects,
  calcInvestmentStats,
  calcMapCityStats,
  calcOrganicFertilizerStats,
  calcPersonnelStats,
  calcQualityStats,
  calcSafetySignStats,
  filterProjects,
  toggleSectionOrganicAttribute,
} from './utils/dashboardCalculations.js';
import TopBar from './components/TopBar.vue';
import JilinMapPanel from './components/JilinMapPanel.vue';
import QualityPanel from './components/panels/QualityPanel.vue';
import ProgressPanel from './components/panels/ProgressPanel.vue';
import InvestmentPanel from './components/panels/InvestmentPanel.vue';
import SafetyPanel from './components/panels/SafetyPanel.vue';
import PersonnelPanel from './components/panels/PersonnelPanel.vue';
import OrganicPanel from './components/panels/OrganicPanel.vue';
import AcceptancePanel from './components/panels/AcceptancePanel.vue';
import HandoverPanel from './components/panels/HandoverPanel.vue';
import DisbursementModal from './components/modals/DisbursementModal.vue';
import ProjectDetailModal from './components/modals/ProjectDetailModal.vue';
import QualityDetailModal from './components/modals/QualityDetailModal.vue';

const projects = ref(SEED_PROJECTS);
const selectedYear = ref(2025);
const selectedCity = ref(null);
const acceptanceQuery = ref('');

const isDisbursementOpen = ref(false);
const isQualityDetailOpen = ref(false);
const selectedProjectId = ref(null);

const yearProjects = computed(() =>
  filterProjects(projects.value, selectedYear.value, null)
);

const scopedProjects = computed(() =>
  filterProjects(projects.value, selectedYear.value, selectedCity.value)
);

const qualityStats = computed(() => calcQualityStats(scopedProjects.value));
const inProgressProjects = computed(() => calcInProgressProjects(scopedProjects.value));
const investmentStats = computed(() => calcInvestmentStats(scopedProjects.value));
const safetyStats = computed(() => calcSafetySignStats(scopedProjects.value));
const personnelStats = computed(() => calcPersonnelStats(scopedProjects.value));
const organicStats = computed(() => calcOrganicFertilizerStats(scopedProjects.value));
const acceptanceStats = computed(() =>
  calcAcceptanceStats(scopedProjects.value, acceptanceQuery.value)
);
const handoverStats = computed(() => calcHandoverStats(scopedProjects.value));
const mapCityStats = computed(() => calcMapCityStats(yearProjects.value));

const selectedProject = computed(
  () => projects.value.find((p) => p.id === selectedProjectId.value) ?? null
);

function handleSelectYear(yr) {
  selectedYear.value = yr;
  selectedCity.value = null;
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
      :selected-year="selectedYear"
      :selected-city="selectedCity"
      @select-year="handleSelectYear"
      @clear-city="selectedCity = null"
      @open-disbursement="isDisbursementOpen = true"
    />

    <main class="flex-1 min-h-0 p-3 grid grid-cols-1 xl:grid-cols-12 gap-2.5 overflow-y-auto xl:overflow-hidden">
      <!-- Left Column: 左一 ~ 左四 -->
      <div class="xl:col-span-3 flex flex-col xl:grid xl:grid-rows-4 gap-2.5 min-h-0 xl:h-full">
        <QualityPanel
          :stats="qualityStats"
          @open-detail="isQualityDetailOpen = true"
        />
        <ProgressPanel
          :projects="inProgressProjects"
          @select-project="(p) => (selectedProjectId = p.id)"
        />
        <InvestmentPanel
          :stats="investmentStats"
          @open-disbursement="isDisbursementOpen = true"
        />
        <SafetyPanel
          :stats="safetyStats"
          @select-project-id="(id) => (selectedProjectId = id)"
        />
      </div>

      <!-- Center Column: 吉林省 ECharts 地图 -->
      <div class="xl:col-span-6 flex flex-col min-h-[480px] xl:min-h-0 xl:h-full">
        <JilinMapPanel
          :projects="scopedProjects"
          :city-stats="mapCityStats"
          :selected-year="selectedYear"
          :selected-city="selectedCity"
          @select-city="(c) => (selectedCity = c)"
          @select-project="(p) => (selectedProjectId = p.id)"
        />
      </div>

      <!-- Right Column: 右一 ~ 右四 -->
      <div class="xl:col-span-3 flex flex-col xl:grid xl:grid-rows-4 gap-2.5 min-h-0 xl:h-full">
        <PersonnelPanel :stats="personnelStats" />
        <OrganicPanel
          :stats="organicStats"
          @select-project-id="(id) => (selectedProjectId = id)"
        />
        <AcceptancePanel
          :stats="acceptanceStats"
          :query="acceptanceQuery"
          @update:query="(q) => (acceptanceQuery = q)"
          @select-project-id="(id) => (selectedProjectId = id)"
        />
        <HandoverPanel
          :stats="handoverStats"
          @select-project-id="(id) => (selectedProjectId = id)"
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
      :project="selectedProject"
      @close="selectedProjectId = null"
      @toggle-organic-attribute="handleToggleOrganicAttribute"
      @open-disbursement="isDisbursementOpen = true"
    />

    <QualityDetailModal
      :is-open="isQualityDetailOpen"
      :stats="qualityStats"
      @close="isQualityDetailOpen = false"
    />
  </div>
</template>
