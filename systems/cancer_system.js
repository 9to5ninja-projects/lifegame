/**
 * CANCER SYSTEM - Complete disease progression model
 * 
 * Cancer is a slow-burn disease that:
 * - Comes at any age but primarily affects adults/elderly
 * - Has different incidence rates by gender, type, and region
 * - Stages 1-4 with multi-year progression
 * - Applies escalating penalties (physical, mental, employment, fertility)
 * - Results in slow decline to game over with regional treatment variations
 * 
 * Regional framework:
 * - Nordic: High incidence (350-400/100K, aging population), 90% detected early (stage 1-2), 70-80% survive 5-year
 * - Developed: High incidence (300-350/100K), 75% detected early, 60-70% survive 5-year
 * - Emerging: Moderate incidence (150-200/100K), 40% detected early, 35-45% survive 5-year
 * - Developing: Lower incidence (100-150/100K, earlier death from other causes), 15% detected early, 15-25% survive 5-year
 * - Fragile: Low incidence (80-120/100K, high early mortality), 5% detected early, 5-15% survive 5-year
 */

// ============================================================================
// CANCER TYPES WITH GENDER-SPECIFIC RATES
// ============================================================================
// All rates per 100,000 population per year (WHO data)

const CANCER_TYPES = {
  // Most common cancers with gender specification
  breast: {
    name: "Breast Cancer",
    primaryGender: "female", // Can occur in males but rare
    ageGroups: {
      "18-24": 0.5,
      "25-34": 5,
      "35-44": 25,
      "45-54": 75,
      "55-64": 100,
      "65-74": 120,
      "75+": 110
    },
    maleModifier: 0.01 // 1% of female rate in males
  },
  
  lung: {
    name: "Lung Cancer",
    primaryGender: "both",
    ageGroups: {
      "18-24": 0.1,
      "25-34": 1,
      "35-44": 8,
      "45-54": 35,
      "55-64": 85,
      "65-74": 150,
      "75+": 180
    },
    maleModifier: 1.5, // Males have higher rates (smoking patterns)
    riskFactors: ["smoking", "pollution", "occupational"]
  },
  
  colon: {
    name: "Colorectal Cancer",
    primaryGender: "both",
    ageGroups: {
      "18-24": 0.1,
      "25-34": 1,
      "35-44": 5,
      "45-54": 30,
      "55-64": 70,
      "65-74": 90,
      "75+": 100
    }
  },
  
  prostate: {
    name: "Prostate Cancer",
    primaryGender: "male",
    ageGroups: {
      "18-24": 0,
      "25-34": 0.1,
      "35-44": 3,
      "45-54": 35,
      "55-64": 90,
      "65-74": 200,
      "75+": 300
    }
  },
  
  cervical: {
    name: "Cervical Cancer",
    primaryGender: "female",
    ageGroups: {
      "18-24": 0,
      "25-34": 8,
      "35-44": 15,
      "45-54": 12,
      "55-64": 8,
      "65-74": 5,
      "75+": 3
    },
    preventable: true, // HPV vaccine + screening
    screeningReduces: 0.7 // Good screening cuts incidence by 70%
  },
  
  liver: {
    name: "Liver Cancer",
    primaryGender: "both",
    ageGroups: {
      "18-24": 0.2,
      "25-34": 1,
      "35-44": 5,
      "45-54": 15,
      "55-64": 20,
      "65-74": 18,
      "75+": 12
    },
    riskFactors: ["hepatitis_b", "hepatitis_c", "alcohol", "cirrhosis"],
    maleModifier: 2 // Much more common in males
  },
  
  pancreas: {
    name: "Pancreatic Cancer",
    primaryGender: "both",
    ageGroups: {
      "18-24": 0,
      "25-34": 0.2,
      "35-44": 1,
      "45-54": 8,
      "55-64": 18,
      "65-74": 25,
      "75+": 20
    },
    poorPrognosis: true // Very bad 5-year survival
  },
  
  ovarian: {
    name: "Ovarian Cancer",
    primaryGender: "female",
    ageGroups: {
      "18-24": 0,
      "25-34": 2,
      "35-44": 8,
      "45-54": 15,
      "55-64": 18,
      "65-74": 15,
      "75+": 10
    }
  }
};

// ============================================================================
// REGIONAL CANCER INCIDENCE MODIFIERS
// ============================================================================
// Applied AFTER age-based rates to account for:
// - Healthcare access affecting screening/detection
// - Environmental factors
// - Behavioral factors
// - Development status

const REGIONAL_MODIFIERS = {
  "Nordic Country": {
    incidenceMultiplier: 1.2, // High incidence due to aging population
    screeningAccess: 0.95, // 95% have access to screening
    earlyDetectionRate: 0.85, // 85% diagnosed at stage 1-2
    treatmentAccess: 0.95, // 95% can access treatment
    regionCode: "nordic"
  },
  
  "Western Europe": {
    incidenceMultiplier: 1.1,
    screeningAccess: 0.90,
    earlyDetectionRate: 0.80,
    treatmentAccess: 0.95,
    regionCode: "developed"
  },
  
  "Japan/South Korea": {
    incidenceMultiplier: 1.15, // Aging population
    screeningAccess: 0.98,
    earlyDetectionRate: 0.88,
    treatmentAccess: 0.98,
    regionCode: "developed"
  },
  
  "North America - Middle Class": {
    incidenceMultiplier: 1.05,
    screeningAccess: 0.85,
    earlyDetectionRate: 0.75,
    treatmentAccess: 0.90,
    regionCode: "developed"
  },
  
  "Eastern Europe": {
    incidenceMultiplier: 0.95,
    screeningAccess: 0.60,
    earlyDetectionRate: 0.45,
    treatmentAccess: 0.70,
    regionCode: "emerging"
  },
  
  "Urban China": {
    incidenceMultiplier: 0.8,
    screeningAccess: 0.70,
    earlyDetectionRate: 0.50,
    treatmentAccess: 0.80,
    regionCode: "emerging"
  },
  
  "Urban Latin America": {
    incidenceMultiplier: 0.7,
    screeningAccess: 0.45,
    earlyDetectionRate: 0.30,
    treatmentAccess: 0.50,
    regionCode: "developing"
  },
  
  "Southeast Asia": {
    incidenceMultiplier: 0.6,
    screeningAccess: 0.30,
    earlyDetectionRate: 0.20,
    treatmentAccess: 0.35,
    regionCode: "developing"
  },
  
  "Rural India": {
    incidenceMultiplier: 0.4,
    screeningAccess: 0.10,
    earlyDetectionRate: 0.08,
    treatmentAccess: 0.15,
    regionCode: "developing"
  },
  
  "Sub-Saharan Africa": {
    incidenceMultiplier: 0.35,
    screeningAccess: 0.05,
    earlyDetectionRate: 0.05,
    treatmentAccess: 0.10,
    regionCode: "fragile"
  }
};

// ============================================================================
// CANCER STAGE PROGRESSION & SURVIVAL
// ============================================================================

const CANCER_STAGES = {
  1: {
    name: "Stage I (Localized)",
    description: "Cancer confined to original site. Most treatable.",
    yearToProgress: { min: 2, max: 5 }, // Years before progressing to stage 2
    fifthYearSurvival: {
      nordic: 0.85,
      developed: 0.80,
      emerging: 0.50,
      developing: 0.30,
      fragile: 0.15
    },
    penalties: {
      physical: -2, // Per year, baseline degradation
      mental: -1,
      employment: 0, // Can still work in stage 1
      fertility: 0
    }
  },
  
  2: {
    name: "Stage II (Regional)",
    description: "Cancer spread to nearby lymph nodes/tissues.",
    yearToProgress: { min: 1, max: 3 },
    fifthYearSurvival: {
      nordic: 0.70,
      developed: 0.60,
      emerging: 0.30,
      developing: 0.15,
      fragile: 0.08
    },
    penalties: {
      physical: -4,
      mental: -2,
      employment: -0.5, // Reduced work capacity
      fertility: -0.3 // Reduced fertility due to treatment
    }
  },
  
  3: {
    name: "Stage III (Advanced)",
    description: "Cancer spread to distant lymph nodes or tissues.",
    yearToProgress: { min: 1, max: 2 },
    fifthYearSurvival: {
      nordic: 0.45,
      developed: 0.35,
      emerging: 0.15,
      developing: 0.07,
      fragile: 0.03
    },
    penalties: {
      physical: -6,
      mental: -3,
      employment: -1.5, // Often cannot work
      fertility: -0.6 // Largely infertile during treatment
    }
  },
  
  4: {
    name: "Stage IV (Metastatic)",
    description: "Cancer spread to distant organs. Incurable, palliative care.",
    yearToProgress: { min: 0.5, max: 1.5 }, // Quick progression to death
    fifthYearSurvival: {
      nordic: 0.10,
      developed: 0.07,
      emerging: 0.02,
      developing: 0.01,
      fragile: 0.005
    },
    penalties: {
      physical: -10, // Severe decline
      mental: -5, // Existential crisis
      employment: -5, // Cannot work
      fertility: -1 // Biological death imminent
    }
  }
};

// ============================================================================
// CANCER-SPECIFIC COMPLICATIONS
// ============================================================================

const COMPLICATIONS = {
  // By stage and treatment response
  metastasis: {
    stage: [3, 4],
    probability: { stage3: 0.3, stage4: 0.8 },
    effect: "accelerates progression and increases mortality"
  },
  
  treatmentToxicity: {
    stage: [1, 2, 3],
    probability: { stage1: 0.05, stage2: 0.15, stage3: 0.30 },
    effect: "heart damage, kidney damage, or secondary cancer 15+ years later"
  },
  
  remission: {
    stage: [1, 2],
    probability: { stage1: 0.50, stage2: 0.25 }, // With Nordic treatment access
    effect: "cancer goes dormant, but can recur (5-15 years later)"
  },
  
  recurrence: {
    probability: 0.30, // Per year after remission
    effect: "cancer returns, usually at higher stage"
  }
};

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Determine if a person develops cancer this year
 * @param {number} age - Player age
 * @param {string} gender - "male" or "female"
 * @param {string} birthRegion - Region name
 * @param {object} additionalFactors - {smoking, alcohol, chronic: ["diabetes"], etc.}
 * @returns {object} {hasCancer: boolean, type: "breast"|"lung"|..., incidenceRate: number}
 */
function getCancerIncidence(age, gender, birthRegion, additionalFactors = {}) {
  const regional = REGIONAL_MODIFIERS[birthRegion];
  if (!regional) {
    return { hasCancer: false, type: null, incidenceRate: 0 };
  }

  // Determine age group
  let ageGroup;
  if (age < 25) ageGroup = "18-24";
  else if (age < 35) ageGroup = "25-34";
  else if (age < 45) ageGroup = "35-44";
  else if (age < 55) ageGroup = "45-54";
  else if (age < 65) ageGroup = "55-64";
  else if (age < 75) ageGroup = "65-74";
  else ageGroup = "75+";

  // Calculate total probability from all applicable cancer types
  let totalIncidenceRate = 0;
  const applicableCancers = [];

  for (const [type, data] of Object.entries(CANCER_TYPES)) {
    // Check if applicable to this gender
    if (data.primaryGender !== "both" && data.primaryGender !== gender) {
      // Skip unless it's a rare cross-gender case
      if (data.primaryGender === "female" && gender === "male") {
        // Prostate is male-only, breast is rare in males
        if (type === "breast") {
          // ~1% of breast cancer rate for males
          const rate = (data.ageGroups[ageGroup] || 0) * (data.maleModifier || 0.01);
          totalIncidenceRate += rate;
          applicableCancers.push({ type, rate });
        }
      }
      continue;
    }

    // Get base rate for this age group
    let rate = data.ageGroups[ageGroup] || 0;
    
    // Apply gender modifier if specified
    if (data.maleModifier && gender === "male") {
      rate *= data.maleModifier;
    }

    // Apply screening reduction (if applicable and good access)
    if (data.preventable && regional.screeningAccess > 0.7) {
      rate *= (1 - data.screeningReduces * regional.screeningAccess);
    }

    // Apply risk factors
    if (data.riskFactors) {
      if (additionalFactors.smoking && data.riskFactors.includes("smoking")) {
        rate *= 3; // Smoking 3x increases lung cancer
      }
      if (additionalFactors.alcohol && data.riskFactors.includes("alcohol")) {
        rate *= 1.5; // Alcohol increases liver cancer
      }
      if (additionalFactors.chronic?.includes("hepatitis_b") && data.riskFactors.includes("hepatitis_b")) {
        rate *= 2;
      }
    }

    totalIncidenceRate += rate;
    applicableCancers.push({ type, rate });
  }

  // Apply regional multiplier
  totalIncidenceRate *= regional.incidenceMultiplier;

  // Convert from per 100,000 to probability (assume per year)
  // 100/100,000 = 0.001 = 0.1% chance per year
  const probabilityPerYear = totalIncidenceRate / 100000;

  // Roll the dice
  const roll = Math.random();
  if (roll > probabilityPerYear) {
    return {
      hasCancer: false,
      type: null,
      incidenceRate: totalIncidenceRate,
      probabilityPerYear
    };
  }

  // Player develops cancer - pick which type weighted by rates
  const weights = applicableCancers.map(c => c.rate);
  const cumulative = [];
  let sum = 0;
  for (const w of weights) {
    sum += w;
    cumulative.push(sum);
  }

  const pick = Math.random() * sum;
  let selectedType = "lung"; // Default fallback
  for (let i = 0; i < cumulative.length; i++) {
    if (pick <= cumulative[i]) {
      selectedType = applicableCancers[i].type;
      break;
    }
  }

  // Determine initial stage at diagnosis
  const detectionRoll = Math.random();
  let initialStage = 1;
  if (detectionRoll > regional.earlyDetectionRate) {
    // Late detection
    initialStage = Math.random() < 0.5 ? 2 : 3; // Usually stage 2-3 if not caught early
  }

  return {
    hasCancer: true,
    type: selectedType,
    initialStage,
    incidenceRate: totalIncidenceRate,
    probabilityPerYear,
    regional: regional.regionCode
  };
}

/**
 * Get stage progression for this year
 * @param {number} currentStage - Current cancer stage (1-4)
 * @param {number} yearsSinceDiagnosis - Years since diagnosis
 * @param {string} region - Region code
 * @param {boolean} inRemission - If cancer is in remission
 * @returns {object} {nextStage, remainingYears, progression, complications}
 */
function getStageProgression(currentStage, yearsSinceDiagnosis, region, inRemission = false) {
  if (currentStage === 4) {
    // Stage 4 always progresses - this year could be the last
    // Calculate probability of death this year
    const stageData = CANCER_STAGES[4];
    const survivalRate = stageData.fifthYearSurvival[region] || 0.01;
    const mortalityThisYear = 1 / (survivalRate * 5); // Rough approximation
    
    return {
      nextStage: 4,
      stillProgressing: true,
      deathRiskThisYear: Math.min(0.8, mortalityThisYear),
      complications: ["metastasis", "organ_failure", "pain_crisis"]
    };
  }

  if (inRemission) {
    // Check if cancer recurs
    if (Math.random() < COMPLICATIONS.recurrence.probability) {
      return {
        nextStage: currentStage + 1,
        remissionEnded: true,
        recurrence: true,
        complications: ["recurrence"]
      };
    }
    return {
      nextStage: currentStage,
      stillInRemission: true,
      complications: []
    };
  }

  const stageData = CANCER_STAGES[currentStage];
  const { min, max } = stageData.yearToProgress;
  const yearsUntilProgression = min + Math.random() * (max - min);

  if (yearsSinceDiagnosis >= yearsUntilProgression) {
    // Advance to next stage
    const nextStage = Math.min(4, currentStage + 1);
    
    // Check for complications during progression
    const complications = [];
    if (Math.random() < 0.1) complications.push("treatmentToxicity");
    if (currentStage === 2 && Math.random() < 0.2) complications.push("metastasis");

    return {
      nextStage,
      progressive: true,
      yearsSinceDiagnosis,
      yearsUntilProgression,
      complications
    };
  }

  // Still in current stage
  return {
    nextStage: currentStage,
    progressive: false,
    yearsSinceDiagnosis,
    yearsUntilProgression: yearsUntilProgression - yearsSinceDiagnosis,
    complications: []
  };
}

/**
 * Calculate penalty values for this stage
 * @param {number} stage - Cancer stage (1-4)
 * @param {string} region - Region code ("nordic", "developed", "emerging", "developing", "fragile")
 * @param {boolean} hasAccess - Whether player has treatment access
 * @returns {object} {physical, mental, employment, fertility}
 */
function getCancerPenalties(stage, region, hasAccess = true) {
  const basePenalties = CANCER_STAGES[stage].penalties;
  
  // Treatment access modifies penalties slightly
  if (hasAccess) {
    // Treatment reduces physical decline
    return {
      physical: basePenalties.physical * 0.8,
      mental: basePenalties.mental * 0.9, // Treatment helps mental health slightly
      employment: basePenalties.employment * 0.7, // Access to accommodations
      fertility: basePenalties.fertility * 0.9 // Better treatment options
    };
  } else {
    // No treatment access increases penalties
    return {
      physical: basePenalties.physical * 1.2,
      mental: basePenalties.mental * 1.5,
      employment: basePenalties.employment * 1.3,
      fertility: basePenalties.fertility * 1.2
    };
  }
}

/**
 * Check if cancer results in death this year
 * @param {number} stage - Cancer stage
 * @param {string} region - Region code
 * @param {number} playerAge - Player age
 * @param {boolean} hasAccess - Treatment access
 * @returns {boolean} Should player die from cancer?
 */
function shouldDieFromCancer(stage, region, playerAge, hasAccess = true) {
  const stageData = CANCER_STAGES[stage];
  const survivalRate = stageData.fifthYearSurvival[region] || 0.01;
  
  // Stage 4 is very lethal
  if (stage === 4) {
    // Convert 5-year survival to annual mortality
    // If 10% survive 5 years: (1 - 0.1)^(1/5) = 84.5% die annually
    const annualMortality = 1 - Math.pow(survivalRate, 1/5);
    return Math.random() < annualMortality;
  }
  
  // Stage 1-3 are less lethal but still serious
  // Very small chance of death from complications
  if (stage === 3) {
    // ~5% annual mortality from complications
    return Math.random() < 0.05;
  }
  
  return false;
}

/**
 * Check if player might achieve remission
 * @param {number} stage - Cancer stage
 * @param {string} region - Region code
 * @param {boolean} hasAccess - Treatment access
 * @returns {boolean} Can achieve remission?
 */
function checkRemission(stage, region, hasAccess = true) {
  if (!hasAccess) return false; // No remission without treatment
  if (stage > 2) return false; // Late-stage cancer doesn't remit
  
  // Stage 1-2 with treatment can achieve remission
  if (stage === 1) {
    // 50-70% remission rate for early-stage cancer
    const remissionRate = {
      nordic: 0.70,
      developed: 0.65,
      emerging: 0.40,
      developing: 0.25,
      fragile: 0.10
    };
    return Math.random() < (remissionRate[region] || 0.30);
  }
  
  if (stage === 2) {
    // 30-50% remission rate
    const remissionRate = {
      nordic: 0.50,
      developed: 0.45,
      emerging: 0.25,
      developing: 0.15,
      fragile: 0.05
    };
    return Math.random() < (remissionRate[region] || 0.20);
  }
  
  return false;
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  CANCER_TYPES,
  CANCER_STAGES,
  REGIONAL_MODIFIERS,
  COMPLICATIONS,
  getCancerIncidence,
  getStageProgression,
  getCancerPenalties,
  shouldDieFromCancer,
  checkRemission
};
