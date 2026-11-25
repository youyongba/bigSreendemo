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

export function filterProjects(projects, year, city) {
  return projects.filter((p) => {
    const matchYear = year === 'ALL' ? true : p.year === year;
    const matchCity = city ? p.city === city : true;
    return matchYear && matchCity;
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
    for (const check of project.qualityChecks) {
      allRecords.push({
        ...check,
        projectName: project.name,
        city: project.city,
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

export function calcInProgressProjects(projects) {
  return projects
    .filter((p) => p.status === '施工中')
    .slice()
    .sort((a, b) => b.progressPercent - a.progressPercent);
}

function roundTwo(val) {
  return Math.round(val * 100) / 100;
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

      // 高标已完成金额逻辑：标段下各工程按完成比例核定产值，封顶不超过标段中标金额
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

export function calcPersonnelStats(projects) {
  const supervisorRecords = [];
  const constructionRecords = [];

  for (const project of projects) {
    for (const sup of project.supervisors) {
      const rate =
        sup.requiredDays === 0 ? 0 : Math.round((sup.actualCheckIns / sup.requiredDays) * 1000) / 10;
      supervisorRecords.push({
        ...sup,
        projectName: project.name,
        city: project.city,
        rate,
      });
    }
    for (const worker of project.constructionStaff) {
      constructionRecords.push({
        ...worker,
        projectName: project.name,
        city: project.city,
      });
    }
  }

  const requiredDaysTotal = supervisorRecords.reduce((s, r) => s + r.requiredDays, 0);
  const actualCheckInsTotal = supervisorRecords.reduce((s, r) => s + r.actualCheckIns, 0);
  const todayCheckedInCount = supervisorRecords.filter((r) => r.todayCheckedIn).length;
  const attendanceRate =
    requiredDaysTotal === 0
      ? 0
      : Math.round((actualCheckInsTotal / requiredDaysTotal) * 1000) / 10;

  const onDutyCount = constructionRecords.filter((r) => r.onDutyStatus === '在岗备案').length;
  const pendingCount = constructionRecords.filter((r) => r.onDutyStatus === '待进场').length;

  return {
    supervisor: {
      totalCount: supervisorRecords.length,
      todayCheckedInCount,
      requiredDaysTotal,
      actualCheckInsTotal,
      attendanceRate,
      hasCheckInData: true,
      records: supervisorRecords,
    },
    construction: {
      totalCount: constructionRecords.length,
      onDutyCount,
      pendingCount,
      hasCheckInData: false,
      records: constructionRecords,
    },
  };
}

export function calcOrganicFertilizerStats(projects) {
  let totalDesignTons = 0;
  let totalSpreadTons = 0;
  let totalDesignMu = 0;
  let totalSpreadMu = 0;
  let organicSectionCount = 0;
  let organicEngineeringCount = 0;
  const byProject = [];

  for (const project of projects) {
    let pDesignTons = 0;
    let pSpreadTons = 0;
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
        pDesignMu += item.organicDesignMu ?? 0;
        pSpreadMu += item.organicSpreadMu ?? 0;
      }
    }

    if (organicSectionNames.length > 0) {
      totalDesignTons += pDesignTons;
      totalSpreadTons += pSpreadTons;
      totalDesignMu += pDesignMu;
      totalSpreadMu += pSpreadMu;
      byProject.push({
        projectId: project.id,
        projectName: project.name,
        city: project.city,
        organicSectionNames,
        designTons: roundTwo(pDesignTons),
        spreadTons: roundTwo(pSpreadTons),
        designMu: roundTwo(pDesignMu),
        spreadMu: roundTwo(pSpreadMu),
        rate: pDesignTons === 0 ? 0 : Math.round((pSpreadTons / pDesignTons) * 1000) / 10,
      });
    }
  }

  return {
    totalDesignTons: roundTwo(totalDesignTons),
    totalSpreadTons: roundTwo(totalSpreadTons),
    totalDesignMu: roundTwo(totalDesignMu),
    totalSpreadMu: roundTwo(totalSpreadMu),
    completionRate:
      totalDesignTons === 0 ? 0 : Math.round((totalSpreadTons / totalDesignTons) * 1000) / 10,
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
    return {
      name: cityName,
      value: cityProjects.length,
      totalInvestment: roundTwo(cityProjects.reduce((s, p) => s + p.totalInvestment, 0)),
      areaMu: roundTwo(cityProjects.reduce((s, p) => s + p.areaMu, 0)),
      inProgressCount: cityProjects.filter((p) => p.status === '施工中').length,
      handedOverCount: cityProjects.filter((p) => p.handover.status === '已移交管护').length,
    };
  });
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
