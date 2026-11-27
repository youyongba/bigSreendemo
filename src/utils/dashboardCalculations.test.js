import test from 'node:test';
import assert from 'node:assert/strict';
import { SEED_PROJECTS } from '../data/seedProjects.js';
import {
  addSectionDisbursement,
  calcAcceptanceStats,
  calcEngineeringQualityStats,
  calcHandoverStats,
  calcInProgressProjects,
  calcInvestmentStats,
  calcMapCityStats,
  calcMapCountyStats,
  calcMapOverlayPoints,
  calcOrganicFertilizerStats,
  calcPersonnelStats,
  calcProjectSectionProgress,
  calcQualityStats,
  calcRectificationItems,
  calcSafetySignStats,
  filterProjectForLevel3,
  filterProjects,
  getCountyGeoJson,
  getProjectScheduleAlert,
  toggleSectionOrganicAttribute,
} from './dashboardCalculations.js';

test('filterProjects splits accurately by year, city, and county', () => {
  const year2025 = filterProjects(SEED_PROJECTS, 2025, null);
  assert.ok(year2025.length > 0);
  assert.ok(year2025.every((p) => p.year === 2025));

  const changchun2025 = filterProjects(SEED_PROJECTS, 2025, '长春市');
  assert.equal(changchun2025.length, 1);
  assert.equal(changchun2025[0].county, '农安县');

  const countyOnly = filterProjects(SEED_PROJECTS, 2025, '长春市', '农安县');
  assert.equal(countyOnly.length, 1);
});

test('getCountyGeoJson extracts single-county boundary for Level 3 map', () => {
  const geo = getCountyGeoJson('长春市', '农安县');
  assert.ok(geo);
  assert.equal(geo.type, 'FeatureCollection');
  assert.equal(geo.features.length, 1);
  assert.equal(geo.features[0].properties.name, '农安县');

  const missing = getCountyGeoJson('长春市', '不存在的县');
  assert.equal(missing, null);
});

test('getProjectScheduleAlert shows NO reminder when no schedule plan is set and alerts when behind plan', () => {
  const dunhua = SEED_PROJECTS.find((p) => p.id === 'jl-2025-06');
  assert.equal(dunhua.hasSchedulePlan, false);
  const dunhuaAlert = getProjectScheduleAlert(dunhua);
  assert.equal(dunhuaAlert.hasPlan, false);
  assert.equal(dunhuaAlert.isBehind, false);
  assert.equal(dunhuaAlert.message, null);

  const nongan = SEED_PROJECTS.find((p) => p.id === 'jl-2025-01');
  assert.equal(nongan.hasSchedulePlan, true);
  const nonganAlert = getProjectScheduleAlert(nongan);
  assert.equal(nonganAlert.hasPlan, true);
  assert.equal(nonganAlert.isBehind, true);
  assert.ok(nonganAlert.diffPercent > 0);
  assert.ok(nonganAlert.message.includes('进度滞后提醒'));

  const fuyu = SEED_PROJECTS.find((p) => p.id === 'jl-2025-03');
  const fuyuAlert = getProjectScheduleAlert(fuyu);
  assert.equal(fuyuAlert.hasPlan, true);
  assert.equal(fuyuAlert.isBehind, false);
  assert.equal(fuyuAlert.message, null);

  const sectionProgress = calcProjectSectionProgress(nongan);
  assert.equal(sectionProgress.length, 2);
  assert.ok(sectionProgress[0].progressPercent > 0);
});

test('calcEngineeringQualityStats aggregates self checks, parallel checks, side-by-side, and patrols', () => {
  const year2025 = filterProjects(SEED_PROJECTS, 2025, null);
  const eq = calcEngineeringQualityStats(year2025);
  assert.ok(eq.processSelfCheck.uploaded >= eq.processSelfCheck.supervisorApproved);
  assert.ok(eq.concealedSelfCheck.uploaded >= eq.concealedSelfCheck.supervisorApproved);
  assert.ok(eq.concreteSelfCheck.uploaded >= eq.concreteSelfCheck.supervisorApproved);
  assert.equal(eq.selfUploadTotal, eq.processSelfCheck.uploaded + eq.concealedSelfCheck.uploaded);
  assert.ok(eq.parallelCheck.processPassed <= eq.parallelCheck.processTotal);
  assert.ok(eq.supervisorSideBySide.count > 0);
  assert.ok(eq.qualityPatrol.totalPatrols > 0);
  assert.ok(eq.qualityPatrol.pendingRectifyCount > 0);
});

test('calcRectificationItems & calcMapOverlayPoints detect safety, recorder, township, and rectification markers', () => {
  const changchun2025 = filterProjects(SEED_PROJECTS, 2025, '长春市');
  const rectItems = calcRectificationItems(changchun2025);
  assert.ok(rectItems.length > 0);
  assert.ok(rectItems.every((r) => r.status === '待整改'));

  const overlay = calcMapOverlayPoints(changchun2025);
  assert.ok(overlay.counts.safetyTotal > 0);
  assert.ok(overlay.counts.onlineRecorderCount > 0);
  assert.ok(overlay.counts.townshipTotal > 0);
  assert.ok(overlay.counts.rectificationTotal > 0);
});

test('calcPersonnelStats computes check-in data for BOTH supervisor and construction teams', () => {
  const stats = calcPersonnelStats(SEED_PROJECTS);
  assert.equal(stats.supervisor.hasCheckInData, true);
  assert.ok(stats.supervisor.actualCheckInsTotal > 0);
  assert.equal(stats.construction.hasCheckInData, true);
  assert.ok(stats.construction.actualCheckInsTotal > 0);
  assert.ok(stats.construction.attendanceRate > 0);
});

test('calcOrganicFertilizerStats includes designMu, spreadTons, spreadMu, and stockedTons at project level', () => {
  const year2025 = filterProjects(SEED_PROJECTS, 2025, null);
  const baseStats = calcOrganicFertilizerStats(year2025);
  assert.ok(baseStats.totalDesignMu > 0);
  assert.ok(baseStats.totalSpreadTons > 0);
  assert.ok(baseStats.totalStockedTons > 0);
  assert.ok(baseStats.byProject[0].stockedTons > 0);
  assert.ok(baseStats.byProject[0].designMu > 0);

  const toggled = toggleSectionOrganicAttribute(SEED_PROJECTS, 'jl-2025-01', 'sec-2025-01-b');
  const afterStats = calcOrganicFertilizerStats(filterProjects(toggled, 2025, null));
  assert.equal(
    afterStats.totalDesignTons,
    Math.round((baseStats.totalDesignTons - 4200) * 100) / 100
  );
  assert.equal(afterStats.organicSectionCount, baseStats.organicSectionCount - 1);
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
});

test('filterProjectForLevel3 scopes townships, sections, and categories accurately', () => {
  const nongan = SEED_PROJECTS.find((p) => p.id === 'jl-2025-01');
  const scoped = filterProjectForLevel3(nongan, { township: '合隆镇' });
  assert.equal(scoped.townships.length, 1);
  assert.equal(scoped.townships[0].name, '合隆镇');
  assert.ok(scoped.sections.flatMap((s) => s.engineeringItems).every((i) => i.township === '合隆镇'));
});

test('calcQualityStats, calcAcceptanceStats, calcHandoverStats, calcMapCountyStats compute accurately', () => {
  const year2025 = filterProjects(SEED_PROJECTS, 2025, null);
  const q = calcQualityStats(year2025);
  assert.equal(q.totalChecks, q.selfCheck.total + q.parallelCheck.total);

  const acc = calcAcceptanceStats(year2025, '农安');
  assert.equal(acc.rows.length, 1);
  assert.equal(acc.rows[0].totalCount, 4);

  const handover = calcHandoverStats(filterProjects(SEED_PROJECTS, 2023, null));
  assert.equal(handover.totalProjects, 3);
  assert.equal(handover.handedOverCount, 2);

  const mapStats = calcMapCityStats(SEED_PROJECTS);
  assert.equal(mapStats.length, 9);

  const countyStats = calcMapCountyStats(year2025, '长春市');
  assert.ok(countyStats.some((c) => c.name === '农安县' && c.value === 1));
  assert.ok(calcSafetySignStats(year2025).totalSigns > 0);
  assert.ok(calcInProgressProjects(year2025).every((p) => p.status === '施工中'));
});
