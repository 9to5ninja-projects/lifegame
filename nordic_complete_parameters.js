/**
 * NORDIC REGION - COMPLETE PARAMETER MATRIX
 * 
 * This document outlines every parameter needed for a complete region definition.
 * Once Nordic is complete, we copy this structure and adjust weights for other regions.
 * 
 * Categories:
 * 1. Demographics & Population
 * 2. Employment & Labor
 * 3. Education
 * 4. Economics (Cost of Living & Income)
 * 5. Healthcare & Physical Health
 * 6. Mental Health & Social
 * 7. Crime & Violence
 * 8. Mortality (Disease, Accidents, Violence)
 * 9. Fertility & Reproduction
 * 10. Migration & Displacement
 */

const NORDIC_PARAMETERS = {
  // ========== 1. DEMOGRAPHICS & POPULATION ==========
  demographics: {
    lifeExpectancy: 83,           // Global average ~72, Nordic ~83
    medianAge: 41,                // Nordic aging population
    urbanization: 0.88,           // 88% urban population
    populationDensity: "low",     // But highly dispersed (small total pop)
  },

  // ========== 2. EMPLOYMENT & LABOR ==========
  employment: {
    // SEE: employment_by_region.js for age/gender-specific rates
    overallRate: 0.75,            // Overall 75% employment rate
    femaleParticipation: 0.70,    // Women slightly lower but still high
    genderWageGap: 0.85,          // Women earn 85% of male wages
    jobTurnoverRate: 0.15,        // 15% job change per year
    unemploymentBenefit: 0.60,    // Unemployment pays 60% of wage
    minWage: 0.40,                // Minimum wage as % of median
    maxWage: 4.00,                // Top earners ceiling
    unionization: 0.70,           // 70% union membership (very high)
    workWeekHours: 37.5,          // Standard work week
    paidVacationDays: 25,         // Generous vacation
    sickDaysPerYear: 12,          // Paid sick leave
    maternityLeaveDays: 480,      // ~16 months maternity (very generous)
  },

  // ========== 3. EDUCATION ==========
  education: {
    // SEE: education_system.js for stage-specific rates
    literacyRate: 0.99,           // 99% literacy
    tertiaryAttainment: 0.65,     // 65% reach university level
    averageYearsSchooling: 12.4,  // High average education
    schoolEnrollmentRate: 0.99,   // Primary enrollment ~99%
    dropoutRate: 0.02,            // Only 2% drop out before completion
    studentDebtAverage: 0.0,      // NO student debt (education free!)
    scholarshipCoverage: 1.0,     // 100% tertiary students receive support
  },

  // ========== 4. ECONOMICS (COSTS & INCOME) ==========
  // SEE: cost_of_living.js for detailed breakdown
  economics: {
    gdpPerCapita: 89000,          // In USD - very high
    incomeGiniCoefficient: 0.27,  // Low inequality (0=perfect equality, 1=complete inequality)
    povertyRate: 0.08,            // 8% below poverty line (very low)
    childPovertyRate: 0.05,       // Only 5% children in poverty
    medianHouseholdIncome: 65000, // In USD
    housingCostRatio: 0.20,       // 20% of income on housing (sustainable)
    foodCostRatio: 0.08,          // 8% on food
    taxRate: 0.42,                // 42% total tax (high but with benefits)
    socialBenefitSpending: 0.25,  // 25% of GDP to social benefits
    childBenefit: 0.20,           // Per child per year (relative units)
    elderlyPensionReplacement: 0.85, // Pensions replace 85% of pre-retirement income
  },

  // ========== 5. HEALTHCARE & PHYSICAL HEALTH ==========
  healthcare: {
    healthExpenditure: 0.10,      // 10% of GDP (very high)
    publicHealthCoverage: 1.0,    // 100% universal coverage
    lifeExpectancy: 83,           // One of highest in world
    infantMortalityRate: 2.5,     // Per 1000 live births (very low)
    maternalMortalityRate: 4,     // Per 100,000 live births (extremely low)
    medicationAccessibility: 0.95,  // 95% have access to essential meds
    surgicalWaitTime: 60,         // Days average wait for elective surgery
    preventiveCareCoverage: 0.85, // 85% get preventive screening
    obesityRate: 0.25,            // 25% obese (moderate for developed)
    smokingRate: 0.14,            // 14% current smokers (low)
    alcoholConsumption: "high",   // High but binge drinking low
    exerciseRate: 0.50,           // 50% exercise regularly
  },

  // ========== 6. MENTAL HEALTH & SOCIAL ==========
  mentalHealth: {
    depressionRate: 0.10,         // 10% diagnosed depression (high)
    suicideRate: 0.012,           // 12 per 100,000 (target we're aiming for)
    suicideMethodAccessibility: {
      firearms: 0.05,             // 5% firearm access (very low)
      poisoning: 0.90,            // 90% access to poisons/meds
      jumping: 0.30,              // 30% access (bridges, etc)
      hanging: 0.95,              // 95% access (rope available)
      interventionCoverage: 0.80, // 80% of attempts receive intervention
    },
    socialTrustIndex: 0.70,       // 70% trust others (very high)
    loneliness: 0.15,             // 15% report loneliness (low)
    divorceRate: 0.40,            // 40% of marriages end in divorce (high)
    singleParentRate: 0.25,       // 25% of households (not uncommon)
    mentalHealthCareAccess: 0.85, // 85% can access mental health services
    psychologistDensity: 25,      // Per 100,000 population (very high)
  },

  // ========== 7. CRIME & VIOLENCE ==========
  crime: {
    homicideRate: 0.9,            // Per 100,000 (very low)
    assaultRate: 50,              // Per 100,000 (moderate)
    robberyRate: 20,              // Per 100,000 (low)
    sexualAssaultRate: 40,        // Per 100,000 (relatively high - well reported)
    theftRate: 200,               // Per 100,000 (moderate)
    drugRelatedCrime: "low",      // Low drug trade
    drinkDrivingRate: 0.02,       // 2% drive under influence (low)
    prisonIncarceration: 70,      // Per 100,000 (very low)
    recidivismRate: 0.40,         // 40% reoffend (medium)
    policeViolence: "rare",       // Police killings extremely rare
  },

  // ========== 8. MORTALITY (DISEASE, ACCIDENTS, VIOLENCE) ==========
  // SEE: global_statistics_v2.js for full breakdown by age/gender
  mortality: {
    leadingCauses: [
      "Heart Disease (640/100K elderly)",
      "Cancer (600/100K elderly)",
      "Stroke (200/100K elderly)",
      "Respiratory (100/100K)",
      "Suicide (12-17/100K youth/elderly)",
      "Accidents (22/100K youth)",
      "Homicide (1/100K - very rare)",
    ],
    trafficAccidentRate: 30,      // Per 100,000 population
    occupationalInjuryRate: 5,    // Per 1000 workers (very safe)
    accidentalPoisoningRate: 5,   // Per 100,000 (low)
    naturalDisasterRisk: "low",   // Rare earthquakes/storms
  },

  // ========== 9. FERTILITY & REPRODUCTION ==========
  fertility: {
    totalFertilityRate: 1.50,     // Children per woman (below replacement)
    teenBirthRate: 4,             // Per 1000 teen females (extremely low)
    meanAgeAtFirstBirth: 30,      // Very high (many children after 30)
    childrenOutOfWedlock: 0.50,   // 50% births outside marriage (norm, not stigma)
    miscarriageRate: 0.15,        // 15% of pregnancies (normal)
    accessToContraception: 0.95,  // 95% have access
    accessToAbortion: 1.0,        // Legal and accessible
    infantMortalityRate: 2.5,     // Per 1000 live births
    childMortalityRate: 3,        // Under 5 mortality
  },

  // ========== 10. MIGRATION & DISPLACEMENT ==========
  migration: {
    netMigrationRate: 0.05,       // 5% immigration
    refugeeAcceptance: 0.03,      // 3% population are refugees/asylum
    internalDisplacementRate: 0.0, // Virtually none
    diasporaRemittances: "low",   // Low outgoing remittances
    immigrationIntegration: 0.70, // 70% successfully integrate
    languageBarrier: 0.30,        // 30% immigrants struggle with language
  },

  // ========== DERIVED STRESS FACTORS ==========
  stressFactors: {
    jobSecurityStress: 0.3,       // Low (strong labor protections)
    incomeStability: 0.9,         // High (stable jobs)
    housingSecurityStress: 0.2,   // Low (strong tenant protections)
    healthcareAccessStress: 0.05, // Minimal (universal coverage)
    educationAccessStress: 0.0,   // None (free education)
    childcareAccessStress: 0.2,   // Low (subsidized daycare)
    elderlyIsolationStress: 0.3,  // Moderate (demographic challenge)
    immigrationStress: 0.5,       // Moderate (integration challenges)
  },
};

// ========== VALIDATION CHECKLIST ==========
const VALIDATION = {
  isComplete: true, // Mark as complete when all parameters filled
  lastUpdated: "2025-10-19",
  parameters: {
    demographics: 6,      // Parameters
    employment: 13,
    education: 7,
    economics: 11,
    healthcare: 11,
    mentalHealth: 12,
    crime: 10,
    mortality: 7,
    fertility: 9,
    migration: 6,
    stressFactors: 9,
  },
  totalParameters: 101,  // Total across all categories
};

module.exports = {
  NORDIC_PARAMETERS,
  VALIDATION,
};
