import { JILIN_CITY_GEO_MAP } from '../data/jilinSubMaps.js';

export const JILIN_CITIES = [
  '长春市',
  '吉林市',
  '四平市',
  '辽源市',
  '通化市',
  '白山市',
  '松原市',
  '白城市',
  '延边朝鲜族自治州',
];

function roundTwo(val) {
  return Math.round(val * 100) / 100;
}

export function getCityCounties(city) {
  if (!city || !JILIN_CITY_GEO_MAP[city]) return [];
  return JILIN_CITY_GEO_MAP[city].features.map((f) => f.properties?.name).filter(Boolean);
}

export function getCountyGeoJson(city, county) {
  if (!city || !county || !JILIN_CITY_GEO_MAP[city]) return null;
  const cityGeo = JILIN_CITY_GEO_MAP[city];
  const matchedFeature = cityGeo.features.find(
    (f) => f.properties?.name === county
  );
  if (!matchedFeature) return null;
  return {
    type: 'FeatureCollection',
    features: [matchedFeature],
  };
}

export function filterProjects(projects, year, city = null, county = null) {
  return projects.filter((p) => {
    const matchYear = year === 'ALL' ? true : p.year === year;
    const matchCity = city ? p.city === city : true;
    const matchCounty = county ? p.county === county : true;
    return matchYear && matchCity && matchCounty;
  });
}

export function getProjectScheduleAlert(project) {
  if (!project || !project.hasSchedulePlan || project.plannedProgressPercent == null) {
    return {
      hasPlan: false,
      isBehind: false,
      diffPercent: 0,
      message: null,
    };
  }
  const actual = Number(project.progressPercent ?? 0);
  const planned = Number(project.plannedProgressPercent ?? 0);
  const diff = roundTwo(planned - actual);
  if (diff > 0) {
    return {
      hasPlan: true,
      isBehind: true,
      diffPercent: diff,
      message: `进度滞后提醒：实际进度 ${actual}%，低于计划进度 ${planned}%（滞后 ${diff}%）`,
    };
  }
  return {
    hasPlan: true,
    isBehind: false,
    diffPercent: 0,
    message: null,
  };
}

export function calcProjectSectionProgress(project) {
  if (!project) return [];
  return (project.sections ?? []).map((sec) => {
    const items = sec.engineeringItems ?? [];
    const totalBudget = items.reduce((s, item) => s + (item.budgetAmount ?? 0), 0);
    let progressPercent = 0;
    if (totalBudget > 0) {
      const completedBudget = items.reduce(
        (s, item) => s + (item.budgetAmount ?? 0) * Math.max(0, Math.min(1, item.completedRatio ?? 0)),
        0
      );
      progressPercent = Math.round((completedBudget / totalBudget) * 100);
    } else if (items.length > 0) {
      const avgRatio =
        items.reduce((s, item) => s + Math.max(0, Math.min(1, item.completedRatio ?? 0)), 0) /
        items.length;
      progressPercent = Math.round(avgRatio * 100);
    }
    return {
      id: sec.id,
      name: sec.name,
      contractor: sec.contractor,
      status: sec.status,
      isOrganicFertilizer: Boolean(sec.isOrganicFertilizer),
      progressPercent,
      itemCount: items.length,
    };
  });
}

function summarizeChecks(records) {
  const total = records.length;
  const passed = records.filter((r) => r.result === '合格').length;
  const failed = records.filter((r) => r.result === '不合格').length;
  const passRate = total === 0 ? 0 : Math.round((passed / total) * 1000) / 10;
  return { total, passed, failed, passRate };
}

export function calcQualityStats(projects) {
  const allRecords = [];
  for (const project of projects) {
    for (const check of project.qualityChecks ?? []) {
      allRecords.push({
        ...check,
        projectName: project.name,
        city: project.city,
        county: project.county,
      });
    }
  }

  const selfRecords = allRecords.filter((r) => r.checkType === '施工自检');
  const parallelRecords = allRecords.filter((r) => r.checkType === '平行检测');
  const selfCheck = summarizeChecks(selfRecords);
  const parallelCheck = summarizeChecks(parallelRecords);

  return {
    selfCheck,
    parallelCheck,
    totalChecks: selfCheck.total + parallelCheck.total,
    totalPassed: selfCheck.passed + parallelCheck.passed,
    totalFailed: selfCheck.failed + parallelCheck.failed,
    records: allRecords,
  };
}

export function calcEngineeringQualityStats(projects) {
  const processSelf = { uploaded: 0, supervisorApproved: 0 };
  const concealedSelf = { uploaded: 0, supervisorApproved: 0 };
  const concreteSelf = { uploaded: 0, supervisorApproved: 0 };
  const parallelCheck = {
    processPassed: 0,
    processTotal: 0,
    concealedPassed: 0,
    concealedTotal: 0,
  };
  const supervisorSideBySide = { count: 0, hours: 0, keyProcesses: 0 };
  const qualityPatrol = {
    totalPatrols: 0,
    issueCount: 0,
    pendingRectifyCount: 0,
    rectifiedCount: 0,
    records: [],
  };

  for (const project of projects) {
    const eq = project.engineeringQuality;
    if (!eq) continue;

    processSelf.uploaded += eq.processSelfCheck?.uploaded ?? 0;
    processSelf.supervisorApproved += eq.processSelfCheck?.supervisorApproved ?? 0;

    concealedSelf.uploaded += eq.concealedSelfCheck?.uploaded ?? 0;
    concealedSelf.supervisorApproved += eq.concealedSelfCheck?.supervisorApproved ?? 0;

    concreteSelf.uploaded += eq.concreteSelfCheck?.uploaded ?? 0;
    concreteSelf.supervisorApproved += eq.concreteSelfCheck?.supervisorApproved ?? 0;

    parallelCheck.processPassed += eq.parallelCheck?.processPassed ?? 0;
    parallelCheck.processTotal += eq.parallelCheck?.processTotal ?? 0;
    parallelCheck.concealedPassed += eq.parallelCheck?.concealedPassed ?? 0;
    parallelCheck.concealedTotal += eq.parallelCheck?.concealedTotal ?? 0;

    supervisorSideBySide.count += eq.supervisorSideBySide?.count ?? 0;
    supervisorSideBySide.hours += eq.supervisorSideBySide?.hours ?? 0;
    supervisorSideBySide.keyProcesses += eq.supervisorSideBySide?.keyProcesses ?? 0;

    qualityPatrol.totalPatrols += eq.qualityPatrol?.totalPatrols ?? 0;
    qualityPatrol.issueCount += eq.qualityPatrol?.issueCount ?? 0;
    qualityPatrol.pendingRectifyCount += eq.qualityPatrol?.pendingRectifyCount ?? 0;
    qualityPatrol.rectifiedCount += eq.qualityPatrol?.rectifiedCount ?? 0;

    for (const rec of eq.qualityPatrol?.records ?? []) {
      qualityPatrol.records.push({
        ...rec,
        projectId: project.id,
        projectName: project.name,
        city: project.city,
        county: project.county,
      });
    }
  }

  const selfUploadTotal = processSelf.uploaded + concealedSelf.uploaded;
  const checkDetailStats = calcQualityStats(projects);

  return {
    processSelfCheck: {
      ...processSelf,
      rate:
        processSelf.uploaded === 0
          ? 0
          : Math.round((processSelf.supervisorApproved / processSelf.uploaded) * 1000) / 10,
    },
    concealedSelfCheck: {
      ...concealedSelf,
      rate:
        concealedSelf.uploaded === 0
          ? 0
          : Math.round((concealedSelf.supervisorApproved / concealedSelf.uploaded) * 1000) / 10,
    },
    concreteSelfCheck: {
      ...concreteSelf,
      rate:
        concreteSelf.uploaded === 0
          ? 0
          : Math.round((concreteSelf.supervisorApproved / concreteSelf.uploaded) * 1000) / 10,
    },
    parallelCheck: {
      ...parallelCheck,
      totalPassed: parallelCheck.processPassed + parallelCheck.concealedPassed,
      totalCount: parallelCheck.processTotal + parallelCheck.concealedTotal,
    },
    supervisorSideBySide,
    selfUploadTotal,
    qualityPatrol,
    checkDetailStats,
  };
}

export function calcRectificationItems(projects) {
  const items = [];
  for (const project of projects) {
    for (const sp of project.safetyPoints ?? []) {
      if (sp.status === '待整改') {
        items.push({
          id: `rect-sp-${sp.id}`,
          source: '安全措施',
          projectId: project.id,
          projectName: project.name,
          city: project.city,
          county: project.county,
          township: sp.township,
          title: sp.name,
          detail: sp.detail,
          coords: sp.coords,
          status: '待整改',
        });
      }
    }

    for (const rec of project.engineeringQuality?.qualityPatrol?.records ?? []) {
      if (rec.status === '待整改') {
        const matchedTownship = (project.townships ?? []).find((t) => t.name === rec.township);
        items.push({
          id: `rect-qp-${rec.id}`,
          source: '质量巡查',
          projectId: project.id,
          projectName: project.name,
          city: project.city,
          county: project.county,
          township: rec.township,
          sectionName: rec.sectionName,
          title: rec.title,
          detail: `${rec.sectionName} · 巡查人：${rec.inspector}（${rec.checkedAt}）`,
          coords: matchedTownship?.coords ?? project.coords,
          status: '待整改',
        });
      }
    }
  }
  return items;
}

export function calcMapOverlayPoints(projects) {
  const safetyPoints = [];
  const recorderPoints = [];
  const townships = [];

  for (const project of projects) {
    for (const sp of project.safetyPoints ?? []) {
      safetyPoints.push({
        ...sp,
        projectId: project.id,
        projectName: project.name,
        city: project.city,
        county: project.county,
      });
    }
    for (const rp of project.recorderPoints ?? []) {
      recorderPoints.push({
        ...rp,
        projectId: project.id,
        projectName: project.name,
        city: project.city,
        county: project.county,
      });
    }
    for (const tw of project.townships ?? []) {
      townships.push({
        ...tw,
        projectId: project.id,
        projectName: project.name,
        city: project.city,
        county: project.county,
      });
    }
  }

  const rectificationPoints = calcRectificationItems(projects);
  const onlineRecorderCount = recorderPoints.filter((r) => r.online).length;
  const pendingSafetyCount = safetyPoints.filter((s) => s.status === '待整改').length;

  return {
    safetyPoints,
    recorderPoints,
    townships,
    rectificationPoints,
    counts: {
      safetyTotal: safetyPoints.length,
      pendingSafetyCount,
      recorderTotal: recorderPoints.length,
      onlineRecorderCount,
      townshipTotal: townships.length,
      rectificationTotal: rectificationPoints.length,
    },
  };
}

export function calcInProgressProjects(projects) {
  return projects
    .filter((p) => p.status === '施工中')
    .slice()
    .sort((a, b) => b.progressPercent - a.progressPercent);
}

export function calcInvestmentStats(projects) {
  let totalInvestment = 0;
  let totalBidAmount = 0;
  let totalDisbursed = 0;
  let totalCompletedAmount = 0;
  const inConstructionSections = [];

  for (const project of projects) {
    totalInvestment += project.totalInvestment;
    for (const sec of project.sections) {
      totalBidAmount += sec.bidAmount;
      const secDisbursed = sec.disbursements.reduce((sum, d) => sum + d.amount, 0);
      totalDisbursed += secDisbursed;

      const rawCompleted = sec.engineeringItems.reduce(
        (sum, item) => sum + item.budgetAmount * Math.max(0, Math.min(1, item.completedRatio)),
        0
      );
      totalCompletedAmount += Math.min(sec.bidAmount, rawCompleted);

      if (sec.status === '施工中') {
        inConstructionSections.push({
          projectId: project.id,
          projectName: project.name,
          city: project.city,
          sectionId: sec.id,
          sectionName: sec.name,
          contractor: sec.contractor,
          bidAmount: roundTwo(sec.bidAmount),
          disbursedAmount: roundTwo(secDisbursed),
          remainingDisbursable: roundTwo(Math.max(0, sec.bidAmount - secDisbursed)),
          disbursementCount: sec.disbursements.length,
          disbursements: sec.disbursements,
        });
      }
    }
  }

  return {
    totalInvestment: roundTwo(totalInvestment),
    totalBidAmount: roundTwo(totalBidAmount),
    totalDisbursed: roundTwo(totalDisbursed),
    totalCompletedAmount: roundTwo(totalCompletedAmount),
    disbursementRate:
      totalBidAmount === 0 ? 0 : Math.round((totalDisbursed / totalBidAmount) * 1000) / 10,
    completionRate:
      totalBidAmount === 0 ? 0 : Math.round((totalCompletedAmount / totalBidAmount) * 1000) / 10,
    inConstructionSections,
  };
}

export function addSectionDisbursement(projects, input) {
  const project = projects.find((p) => p.id === input.projectId);
  if (!project) {
    return { ok: false, error: '未找到指定项目' };
  }
  const section = project.sections.find((s) => s.id === input.sectionId);
  if (!section) {
    return { ok: false, error: '未找到指定标段' };
  }
  if (section.status !== '施工中') {
    return { ok: false, error: '仅施工中状态的标段允许填写资金拨付' };
  }
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    return { ok: false, error: '拨付金额必须大于 0 万元' };
  }
  if (!input.materialName || input.materialName.trim().length === 0) {
    return { ok: false, error: '请上传拨付佐证材料后再提交' };
  }
  if (!input.operator || input.operator.trim().length === 0) {
    return { ok: false, error: '请填写建设单位经办人' };
  }

  const currentDisbursed = section.disbursements.reduce((sum, d) => sum + d.amount, 0);
  const remaining = roundTwo(section.bidAmount - currentDisbursed);
  if (input.amount > remaining) {
    return {
      ok: false,
      error: `拨付金额超出剩余可拨付额度（当前剩余 ${remaining.toFixed(2)} 万元）`,
    };
  }

  const newRecord = {
    id: `disb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    sectionId: section.id,
    amount: roundTwo(input.amount),
    disbursedAt: input.disbursedAt ?? new Date().toISOString().slice(0, 10),
    operator: input.operator.trim(),
    materialName: input.materialName.trim(),
    materialCategory: input.materialCategory,
    remark: input.remark?.trim() || undefined,
  };

  const nextProjects = projects.map((p) => {
    if (p.id !== input.projectId) return p;
    return {
      ...p,
      sections: p.sections.map((s) => {
        if (s.id !== input.sectionId) return s;
        return {
          ...s,
          disbursements: [newRecord, ...s.disbursements],
        };
      }),
    };
  });

  return { ok: true, projects: nextProjects, newRecord };
}

export function calcSafetySignStats(projects) {
  const byProject = projects
    .map((p) => ({
      projectId: p.id,
      projectName: p.name,
      city: p.city,
      safetySignCount: p.safetySignCount,
      details: p.safetySignDetails,
    }))
    .sort((a, b) => b.safetySignCount - a.safetySignCount);

  const totalSigns = byProject.reduce((sum, item) => sum + item.safetySignCount, 0);
  const projectCount = byProject.length;
  const avgPerProject = projectCount === 0 ? 0 : Math.round((totalSigns / projectCount) * 10) / 10;

  return {
    totalSigns,
    projectCount,
    avgPerProject,
    byProject,
  };
}

function summarizeCheckInRoster(records) {
  const requiredDaysTotal = records.reduce((s, r) => s + (r.requiredDays ?? 0), 0);
  const actualCheckInsTotal = records.reduce((s, r) => s + (r.actualCheckIns ?? 0), 0);
  const todayCheckedInCount = records.filter((r) => Boolean(r.todayCheckedIn)).length;
  const attendanceRate =
    requiredDaysTotal === 0
      ? 0
      : Math.round((actualCheckInsTotal / requiredDaysTotal) * 1000) / 10;

  return {
    totalCount: records.length,
    todayCheckedInCount,
    requiredDaysTotal,
    actualCheckInsTotal,
    attendanceRate,
    hasCheckInData: true,
    records,
  };
}

export function calcPersonnelStats(projects) {
  const supervisorRecords = [];
  const constructionRecords = [];

  for (const project of projects) {
    for (const sup of project.supervisors ?? []) {
      const req = sup.requiredDays ?? 0;
      const act = sup.actualCheckIns ?? 0;
      const rate = req === 0 ? 0 : Math.round((act / req) * 1000) / 10;
      supervisorRecords.push({
        ...sup,
        projectName: project.name,
        city: project.city,
        rate,
      });
    }
    for (const worker of project.constructionStaff ?? []) {
      const req = worker.requiredDays ?? 0;
      const act = worker.actualCheckIns ?? 0;
      const rate = req === 0 ? 0 : Math.round((act / req) * 1000) / 10;
      constructionRecords.push({
        ...worker,
        projectName: project.name,
        city: project.city,
        rate,
      });
    }
  }

  return {
    supervisor: summarizeCheckInRoster(supervisorRecords),
    construction: summarizeCheckInRoster(constructionRecords),
  };
}

export function calcOrganicFertilizerStats(projects) {
  let totalDesignTons = 0;
  let totalSpreadTons = 0;
  let totalStockedTons = 0;
  let totalDesignMu = 0;
  let totalSpreadMu = 0;
  let organicSectionCount = 0;
  let organicEngineeringCount = 0;
  const byProject = [];

  for (const project of projects) {
    let pDesignTons = 0;
    let pSpreadTons = 0;
    let pStockedTons = 0;
    let pDesignMu = 0;
    let pSpreadMu = 0;
    const organicSectionNames = [];

    for (const sec of project.sections) {
      if (!sec.isOrganicFertilizer) {
        continue;
      }
      organicSectionCount += 1;
      organicSectionNames.push(sec.name);

      for (const item of sec.engineeringItems) {
        organicEngineeringCount += 1;
        pDesignTons += item.organicDesignTons ?? 0;
        pSpreadTons += item.organicSpreadTons ?? 0;
        pStockedTons += item.organicStockedTons ?? 0;
        pDesignMu += item.organicDesignMu ?? 0;
        pSpreadMu += item.organicSpreadMu ?? 0;
      }
    }

    if (organicSectionNames.length > 0) {
      totalDesignTons += pDesignTons;
      totalSpreadTons += pSpreadTons;
      totalStockedTons += pStockedTons;
      totalDesignMu += pDesignMu;
      totalSpreadMu += pSpreadMu;
      byProject.push({
        projectId: project.id,
        projectName: project.name,
        city: project.city,
        county: project.county,
        organicSectionNames,
        designTons: roundTwo(pDesignTons),
        spreadTons: roundTwo(pSpreadTons),
        stockedTons: roundTwo(pStockedTons),
        designMu: roundTwo(pDesignMu),
        spreadMu: roundTwo(pSpreadMu),
        rate: pDesignMu === 0 ? 0 : Math.round((pSpreadMu / pDesignMu) * 1000) / 10,
      });
    }
  }

  return {
    totalDesignTons: roundTwo(totalDesignTons),
    totalSpreadTons: roundTwo(totalSpreadTons),
    totalStockedTons: roundTwo(totalStockedTons),
    totalDesignMu: roundTwo(totalDesignMu),
    totalSpreadMu: roundTwo(totalSpreadMu),
    completionRate:
      totalDesignMu === 0 ? 0 : Math.round((totalSpreadMu / totalDesignMu) * 1000) / 10,
    organicSectionCount,
    organicEngineeringCount,
    byProject,
  };
}

export function calcAcceptanceStats(projects, query = '') {
  const normalized = query.trim().toLowerCase();
  const matched = normalized
    ? projects.filter(
        (p) =>
          p.name.toLowerCase().includes(normalized) ||
          p.city.toLowerCase().includes(normalized) ||
          p.county.toLowerCase().includes(normalized)
      )
    : projects;

  let totalEngineering = 0;
  let totalPending = 0;
  let totalAccepted = 0;

  const rows = matched.map((p) => {
    const items = p.sections.flatMap((s) => s.engineeringItems);
    const totalCount = items.length;
    const acceptedCount = items.filter((i) => i.acceptanceStatus === '已验收').length;
    const pendingCount = items.filter((i) => i.acceptanceStatus === '待验收').length;

    totalEngineering += totalCount;
    totalPending += pendingCount;
    totalAccepted += acceptedCount;

    return {
      projectId: p.id,
      projectName: p.name,
      city: p.city,
      county: p.county,
      totalCount,
      pendingCount,
      acceptedCount,
      rate: totalCount === 0 ? 0 : Math.round((acceptedCount / totalCount) * 1000) / 10,
    };
  });

  return {
    totalEngineering,
    totalPending,
    totalAccepted,
    overallRate:
      totalEngineering === 0 ? 0 : Math.round((totalAccepted / totalEngineering) * 1000) / 10,
    rows,
  };
}

export function calcHandoverStats(projects) {
  const handedOverCount = projects.filter((p) => p.handover.status === '已移交管护').length;
  const inProgressCount = projects.filter((p) => p.handover.status === '移交办理中').length;
  const pendingCount = projects.filter((p) => p.handover.status === '待移交').length;
  const agreementSignedCount = projects.filter((p) => p.handover.agreementSigned).length;
  const totalProjects = projects.length;

  return {
    totalProjects,
    handedOverCount,
    inProgressCount,
    pendingCount,
    agreementSignedCount,
    handoverRate:
      totalProjects === 0 ? 0 : Math.round((handedOverCount / totalProjects) * 1000) / 10,
    list: projects.map((p) => ({
      projectId: p.id,
      projectName: p.name,
      city: p.city,
      status: p.handover.status,
      custodianUnit: p.handover.custodianUnit,
      handoverDate: p.handover.handoverDate,
      agreementSigned: p.handover.agreementSigned,
    })),
  };
}

export function calcMapCityStats(projects) {
  return JILIN_CITIES.map((cityName) => {
    const cityProjects = projects.filter((p) => p.city === cityName);
    const pendingRectifyCount = calcRectificationItems(cityProjects).length;
    return {
      name: cityName,
      value: cityProjects.length,
      totalInvestment: roundTwo(cityProjects.reduce((s, p) => s + p.totalInvestment, 0)),
      areaMu: roundTwo(cityProjects.reduce((s, p) => s + p.areaMu, 0)),
      inProgressCount: cityProjects.filter((p) => p.status === '施工中').length,
      handedOverCount: cityProjects.filter((p) => p.handover.status === '已移交管护').length,
      pendingRectifyCount,
    };
  });
}

export function calcMapCountyStats(projects, city) {
  const counties = getCityCounties(city);
  return counties.map((countyName) => {
    const countyProjects = projects.filter(
      (p) => p.city === city && p.county === countyName
    );
    const pendingRectifyCount = calcRectificationItems(countyProjects).length;
    return {
      name: countyName,
      value: countyProjects.length,
      totalInvestment: roundTwo(countyProjects.reduce((s, p) => s + p.totalInvestment, 0)),
      areaMu: roundTwo(countyProjects.reduce((s, p) => s + p.areaMu, 0)),
      inProgressCount: countyProjects.filter((p) => p.status === '施工中').length,
      pendingRectifyCount,
    };
  });
}

export function filterProjectForLevel3(project, { township = 'ALL', sectionId = 'ALL', category = 'ALL' } = {}) {
  if (!project) return null;

  const filteredSections = (project.sections ?? [])
    .filter((sec) => (sectionId === 'ALL' ? true : sec.id === sectionId))
    .map((sec) => {
      const items = (sec.engineeringItems ?? []).filter((item) => {
        const matchTown = township === 'ALL' ? true : item.township === township;
        const matchCat = category === 'ALL' ? true : item.category === category;
        return matchTown && matchCat;
      });
      return {
        ...sec,
        engineeringItems: items,
      };
    });

  const filteredTownships = (project.townships ?? []).filter((tw) =>
    township === 'ALL' ? true : tw.name === township
  );
  const filteredZones = (project.projectZones ?? []).filter((z) =>
    township === 'ALL' ? true : z.township === township
  );
  const filteredSafetyPoints = (project.safetyPoints ?? []).filter((sp) =>
    township === 'ALL' ? true : sp.township === township
  );
  const filteredRecorderPoints = (project.recorderPoints ?? []).filter((rp) =>
    township === 'ALL' ? true : rp.township === township
  );

  return {
    ...project,
    sections: filteredSections,
    townships: filteredTownships,
    projectZones: filteredZones,
    safetyPoints: filteredSafetyPoints,
    recorderPoints: filteredRecorderPoints,
  };
}

export function toggleSectionOrganicAttribute(projects, projectId, sectionId) {
  return projects.map((p) => {
    if (p.id !== projectId) return p;
    return {
      ...p,
      sections: p.sections.map((s) => {
        if (s.id !== sectionId) return s;
        return {
          ...s,
          isOrganicFertilizer: !s.isOrganicFertilizer,
        };
      }),
    };
  });
}
