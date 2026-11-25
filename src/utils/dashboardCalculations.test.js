import test from 'node:test';
import assert from 'node:assert/strict';
import { SEED_PROJECTS } from '../data/seedProjects.js';
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
} from './dashboardCalculations.js';

test('filterProjects splits accurately by year and city', () => {
  const year2025 = filterProjects(SEED_PROJECTS, 2025, null);
  assert.ok(year2025.length > 0);
  assert.ok(year2025.every((p) => p.year === 2025));

  const changchun2025 = filterProjects(SEED_PROJECTS, 2025, '长春市');
  assert.equal(changchun2025.length, 1);
  assert.equal(changchun2025[0].county, '农安县');
});

test('calcQualityStats counts selfCheck and parallelCheck without rectification', () => {
  const year2025 = filterProjects(SEED_PROJECTS, 2025, null);
  const stats = calcQualityStats(year2025);
  assert.equal(stats.selfCheck.total, stats.selfCheck.passed + stats.selfCheck.failed);
  assert.equal(stats.parallelCheck.total, stats.parallelCheck.passed + stats.parallelCheck.failed);
  assert.ok(stats.selfCheck.failed > 0);
  assert.ok(stats.parallelCheck.failed > 0);
  assert.equal(stats.totalChecks, stats.selfCheck.total + stats.parallelCheck.total);
});

test('calcInvestmentStats & addSectionDisbursement support multiple disbursements in 施工中 sections', () => {
  const year2025 = filterProjects(SEED_PROJECTS, 2025, null);
  const before = calcInvestmentStats(year2025);
  assert.ok(before.totalInvestment > before.totalBidAmount);
  assert.ok(before.totalCompletedAmount <= before.totalBidAmount);
  assert.ok(before.inConstructionSections.length > 0);

  const target = before.inConstructionSections[0];
  const res = addSectionDisbursement(SEED_PROJECTS, {
    projectId: target.projectId,
    sectionId: target.sectionId,
    amount: 100,
    materialName: '补充进度款验收单.pdf',
    materialCategory: '进度款申请表',
    operator: '测试经办人',
  });
  assert.equal(res.ok, true);
  if (res.ok) {
    const after = calcInvestmentStats(filterProjects(res.projects, 2025, null));
    assert.equal(after.totalDisbursed, Math.round((before.totalDisbursed + 100) * 100) / 100);
  }

  const overRes = addSectionDisbursement(SEED_PROJECTS, {
    projectId: target.projectId,
    sectionId: target.sectionId,
    amount: target.remainingDisbursable + 50,
    materialName: '超额申请.pdf',
    materialCategory: '进度款申请表',
    operator: '测试经办人',
  });
  assert.equal(overRes.ok, false);

  const noMaterialRes = addSectionDisbursement(SEED_PROJECTS, {
    projectId: target.projectId,
    sectionId: target.sectionId,
    amount: 50,
    materialName: '   ',
    materialCategory: '进度款申请表',
    operator: '测试经办人',
  });
  assert.equal(noMaterialRes.ok, false);
});

test('calcOrganicFertilizerStats only counts engineering items inside isOrganicFertilizer sections', () => {
  const year2025 = filterProjects(SEED_PROJECTS, 2025, null);
  const baseStats = calcOrganicFertilizerStats(year2025);
  assert.ok(baseStats.totalDesignTons > 0);
  assert.ok(baseStats.totalSpreadTons > 0);
  assert.ok(baseStats.totalSpreadTons <= baseStats.totalDesignTons);

  const toggled = toggleSectionOrganicAttribute(SEED_PROJECTS, 'jl-2025-01', 'sec-2025-01-b');
  const afterStats = calcOrganicFertilizerStats(filterProjects(toggled, 2025, null));
  assert.equal(
    afterStats.totalDesignTons,
    Math.round((baseStats.totalDesignTons - 4200) * 100) / 100
  );
  assert.equal(afterStats.organicSectionCount, baseStats.organicSectionCount - 1);
});

test('calcPersonnelStats differentiates supervisor check-ins from construction no-check-in roster', () => {
  const stats = calcPersonnelStats(SEED_PROJECTS);
  assert.equal(stats.supervisor.hasCheckInData, true);
  assert.ok(stats.supervisor.actualCheckInsTotal > 0);
  assert.equal(stats.construction.hasCheckInData, false);
  assert.ok(stats.construction.totalCount > 0);
});

test('calcAcceptanceStats filters by query and computes total/pending/accepted per project', () => {
  const all2025 = calcAcceptanceStats(filterProjects(SEED_PROJECTS, 2025, null), '');
  assert.equal(all2025.totalEngineering, all2025.totalPending + all2025.totalAccepted);

  const filtered = calcAcceptanceStats(filterProjects(SEED_PROJECTS, 2025, null), '农安');
  assert.equal(filtered.rows.length, 1);
  assert.equal(filtered.rows[0].totalCount, 4);
  assert.equal(filtered.rows[0].acceptedCount, 2);
  assert.equal(filtered.rows[0].pendingCount, 2);
});

test('calcSafetySignStats, calcInProgressProjects, calcHandoverStats, and calcMapCityStats compute accurately', () => {
  const year2025 = filterProjects(SEED_PROJECTS, 2025, null);
  const safety = calcSafetySignStats(year2025);
  assert.ok(safety.totalSigns > 0);
  assert.equal(safety.byProject.length, year2025.length);

  const inProgress = calcInProgressProjects(year2025);
  assert.ok(inProgress.every((p) => p.status === '施工中'));

  const handover = calcHandoverStats(filterProjects(SEED_PROJECTS, 2023, null));
  assert.equal(handover.totalProjects, 3);
  assert.equal(handover.handedOverCount, 2);

  const mapStats = calcMapCityStats(SEED_PROJECTS);
  assert.equal(mapStats.length, 9);
});
