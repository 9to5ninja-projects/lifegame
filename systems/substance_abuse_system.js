/**
 * SUBSTANCE ABUSE SYSTEM - Addiction and overdose modeling
 * 
 * Separate from the existing addiction system, focused on:
 * - Age/gender/region-specific initiation rates
 * - Substance-specific health impacts
 * - Overdose risk and lethality
 * - Treatment outcomes by region
 * 
 * Regional framework:
 * - Nordic: 40-50/100K per year (lower due to treatment access)
 * - Developed: 60-80/100K (opioid crisis, alcohol)
 * - Emerging: 50-70/100K (diverse substances)
 * - Developing: 30-50/100K (less documented, cannabis/alcohol)
 * - Fragile: 20-40/100K (limited access to drugs, high context)
 */

const SUBSTANCES = {
  alcohol: {
    name: "Alcohol",
    initiation: {
      male: {
        "15-24": 150,    // Peak initiation age
        "25-34": 50,
        "35-44": 20,
        "45-54": 10,
        "55-64": 5,
        "65+": 2
      },
      female: {
        "15-24": 120,    // Slightly lower for females
        "25-34": 40,
        "35-44": 18,
        "45-54": 8,
        "55-64": 3,
        "65+": 1
      }
    },
    healthImpacts: {
      casual: { liver: 0.1, cancer: 0.05, mental: -1 },
      regular: { liver: 0.5, cancer: 0.15, mental: -2, physical: -1 },
      dependent: { liver: 2.0, cancer: 0.3, mental: -5, physical: -3 }
    },
    overdoseLethal: 0.02,    // 2% of overdoses lethal (rare except extreme)
    treatmentSuccess: {
      nordic: 0.60,          // 60% success rate with treatment
      developed: 0.50,
      emerging: 0.30,
      developing: 0.15,
      fragile: 0.05
    }
  },

  opioids: {
    name: "Opioids",
    initiation: {
      male: {
        "15-24": 60,     // Prescription or illicit
        "25-34": 80,     // Peak for addiction
        "35-44": 50,
        "45-54": 30,
        "55-64": 10,
        "65+": 15        // Elderly prescribed
      },
      female: {
        "15-24": 50,
        "25-34": 70,     // Similar rates
        "35-44": 45,
        "45-54": 25,
        "55-64": 8,
        "65+": 12
      }
    },
    healthImpacts: {
      casual: { overdose: 0.2, mental: -2 },
      regular: { overdose: 1.0, mental: -4, physical: -2 },
      dependent: { overdose: 5.0, mental: -6, physical: -4, infections: 1.0 }
    },
    overdoseLethal: 0.30,    // 30% of opioid overdoses lethal
    treatmentSuccess: {
      nordic: 0.40,
      developed: 0.35,
      emerging: 0.20,
      developing: 0.10,
      fragile: 0.02
    }
  },

  cannabis: {
    name: "Cannabis",
    initiation: {
      male: {
        "15-24": 200,    // Highest initiation rate
        "25-34": 80,
        "35-44": 40,
        "45-54": 20,
        "55-64": 10,
        "65+": 3
      },
      female: {
        "15-24": 150,    // Lower than males
        "25-34": 60,
        "35-44": 30,
        "45-54": 15,
        "55-64": 5,
        "65+": 1
      }
    },
    healthImpacts: {
      casual: { mental: -0.5, cognitive: -1 },
      regular: { mental: -2, cognitive: -2, respiratory: -1 },
      dependent: { mental: -4, cognitive: -3, respiratory: -2 }
    },
    overdoseLethal: 0.0,     // Cannabis overdose rarely lethal
    treatmentSuccess: {
      nordic: 0.50,
      developed: 0.45,
      emerging: 0.25,
      developing: 0.12,
      fragile: 0.05
    }
  },

  stimulants: {
    name: "Stimulants (Cocaine/Amphetamines)",
    initiation: {
      male: {
        "15-24": 80,
        "25-34": 100,    // Peak
        "35-44": 60,
        "45-54": 30,
        "55-64": 10,
        "65+": 1
      },
      female: {
        "15-24": 60,
        "25-34": 75,
        "35-44": 45,
        "45-54": 20,
        "55-64": 5,
        "65+": 0.5
      }
    },
    healthImpacts: {
      casual: { cardiac: 0.2, mental: -1 },
      regular: { cardiac: 1.0, mental: -3, physical: -2 },
      dependent: { cardiac: 3.0, mental: -5, physical: -3 }
    },
    overdoseLethal: 0.15,    // 15% of stimulant OD lethal (cardiac events)
    treatmentSuccess: {
      nordic: 0.45,
      developed: 0.40,
      emerging: 0.20,
      developing: 0.08,
      fragile: 0.02
    }
  },

  benzodiazepines: {
    name: "Benzodiazepines",
    initiation: {
      male: {
        "15-24": 20,
        "25-34": 40,
        "35-44": 50,     // Peak (often prescribed)
        "45-54": 60,     // Higher in older age
        "55-64": 50,
        "65+": 40
      },
      female: {
        "15-24": 25,
        "25-34": 50,
        "35-44": 60,     // More commonly prescribed to women
        "45-54": 70,
        "55-64": 60,
        "65+": 45
      }
    },
    healthImpacts: {
      casual: { cognitive: -1 },
      regular: { cognitive: -2, mental: -1, physical: -1 },
      dependent: { cognitive: -3, mental: -2, physical: -2, falls: 1 }
    },
    overdoseLethal: 0.05,    // 5% of benzos alone, higher in combination
    treatmentSuccess: {
      nordic: 0.55,
      developed: 0.50,
      emerging: 0.30,
      developing: 0.15,
      fragile: 0.05
    }
  }
};

// ============================================================================
// REGIONAL MODIFIERS
// ============================================================================

const REGIONAL_MODIFIERS = {
  "Nordic Country": {
    initiationMultiplier: 0.4,  // Low due to prevention/treatment
    treatmentAccess: 0.90,
    overdoseIntervention: 0.95, // Naloxone access
    regionCode: "nordic"
  },

  "Western Europe": {
    initiationMultiplier: 0.6,
    treatmentAccess: 0.85,
    overdoseIntervention: 0.90,
    regionCode: "developed"
  },

  "Japan/South Korea": {
    initiationMultiplier: 0.3,  // Very strict drug laws
    treatmentAccess: 0.80,
    overdoseIntervention: 0.85,
    regionCode: "developed"
  },

  "North America - Middle Class": {
    initiationMultiplier: 0.8,  // Opioid crisis
    treatmentAccess: 0.70,
    overdoseIntervention: 0.70,
    regionCode: "developed"
  },

  "Eastern Europe": {
    initiationMultiplier: 1.2,
    treatmentAccess: 0.50,
    overdoseIntervention: 0.30,
    regionCode: "emerging"
  },

  "Urban China": {
    initiationMultiplier: 0.5,  // Strict laws
    treatmentAccess: 0.60,
    overdoseIntervention: 0.40,
    regionCode: "emerging"
  },

  "Urban Latin America": {
    initiationMultiplier: 1.5,  // Drug transit regions
    treatmentAccess: 0.40,
    overdoseIntervention: 0.20,
    regionCode: "developing"
  },

  "Southeast Asia": {
    initiationMultiplier: 1.3,  // Heroin trade
    treatmentAccess: 0.25,
    overdoseIntervention: 0.10,
    regionCode: "developing"
  },

  "Rural India": {
    initiationMultiplier: 0.8,  // Less drug access
    treatmentAccess: 0.15,
    overdoseIntervention: 0.05,
    regionCode: "developing"
  },

  "Sub-Saharan Africa": {
    initiationMultiplier: 0.6,  // Growing but less common
    treatmentAccess: 0.10,
    overdoseIntervention: 0.02,
    regionCode: "fragile"
  }
};

// ============================================================================
// PROGRESSION STAGES
// ============================================================================

const PROGRESSION_STAGES = {
  none: {
    name: "No Use",
    riskOfInitiation: 0
  },
  
  casual: {
    name: "Casual Use",
    monthsToProgression: { min: 6, max: 24 },
    progressionChance: 0.15,   // 15% progress to regular after months
    healthPenalty: 0.1,
    deathRisk: 0.001
  },

  regular: {
    name: "Regular Use",
    monthsToProgression: { min: 3, max: 12 },
    progressionChance: 0.30,   // 30% progress to dependent after months
    healthPenalty: 0.5,
    deathRisk: 0.01
  },

  dependent: {
    name: "Substance Dependent",
    monthsToProgression: null, // No progression past dependent
    progressionChance: 0,
    healthPenalty: 1.5,
    deathRisk: 0.05            // 5% annual death risk from dependent use
  }
};

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Check if person initiates substance use this year
 * @param {number} age - Player age
 * @param {string} gender - "male" or "female"
 * @param {string} birthRegion - Region name
 * @param {object} additionalFactors - {mentalHealth, isolation, etc}
 * @returns {object} {initiates: boolean, substance: "alcohol"|"opioids"|..., stage: "casual"}
 */
function getSubstanceInitiation(age, gender, birthRegion, additionalFactors = {}) {
  const regional = REGIONAL_MODIFIERS[birthRegion];
  if (!regional) {
    return { initiates: false, substance: null, stage: null };
  }

  // Age group string
  let ageGroup;
  if (age < 15) return { initiates: false }; // Too young
  if (age < 25) ageGroup = "15-24";
  else if (age < 35) ageGroup = "25-34";
  else if (age < 45) ageGroup = "35-44";
  else if (age < 55) ageGroup = "45-54";
  else if (age < 65) ageGroup = "55-64";
  else ageGroup = "65+";

  // Calculate total initiation probability
  let totalRate = 0;
  const applicableSubstances = [];

  for (const [type, data] of Object.entries(SUBSTANCES)) {
    const rateByGender = data.initiation[gender]?.[ageGroup] || 0;
    const rate = rateByGender * regional.initiationMultiplier;

    // Risk factors increase initiation
    if (additionalFactors.mentalHealth < 40) {
      rate *= 1.5;  // Mental health issues increase risk
    }
    if (additionalFactors.isolation) {
      rate *= 1.3;
    }
    if (additionalFactors.unemployed) {
      rate *= 1.2;
    }

    totalRate += rate;
    applicableSubstances.push({ type, rate });
  }

  // Convert to probability
  const probability = totalRate / 100000;

  if (Math.random() > probability) {
    return { initiates: false, substance: null };
  }

  // Select substance by weight
  const weights = applicableSubstances.map(s => s.rate);
  const cumulative = [];
  let sum = 0;
  for (const w of weights) {
    sum += w;
    cumulative.push(sum);
  }

  const pick = Math.random() * sum;
  let selectedSubstance = "alcohol";
  for (let i = 0; i < cumulative.length; i++) {
    if (pick <= cumulative[i]) {
      selectedSubstance = applicableSubstances[i].type;
      break;
    }
  }

  return {
    initiates: true,
    substance: selectedSubstance,
    stage: "casual",
    regionCode: regional.regionCode
  };
}

/**
 * Progress substance use to next stage
 * @param {string} stage - Current stage: "casual", "regular", "dependent"
 * @param {number} monthsInStage - Months in current stage
 * @returns {string|null} - Next stage or null if no progression
 */
function getStageProgression(stage, monthsInStage) {
  if (stage === "none" || stage === "dependent") return null;

  const stageData = PROGRESSION_STAGES[stage];
  if (!stageData) return null;

  const { min, max } = stageData.monthsToProgression;
  if (monthsInStage >= min && Math.random() < stageData.progressionChance) {
    if (stage === "casual") return "regular";
    if (stage === "regular") return "dependent";
  }

  return null;
}

/**
 * Calculate health impacts from substance use
 * @param {string} substance - Substance type
 * @param {string} stage - Use stage
 * @param {string} regionCode - Region code ("nordic", "developing", etc)
 * @returns {object} - {physical, mental, cognitive, other penalties}
 */
function getSubstancePenalties(substance, stage, regionCode) {
  const substanceData = SUBSTANCES[substance];
  if (!substanceData || !substanceData.healthImpacts[stage]) {
    return {};
  }

  const impacts = substanceData.healthImpacts[stage];
  const regional = {
    nordic: 1.0,
    developed: 1.0,
    emerging: 1.2,
    developing: 1.3,
    fragile: 1.5
  };

  // Scale by region (worse in fragile states without treatment access)
  const multiplier = regional[regionCode] || 1.0;

  return {
    physical: (impacts.liver || impacts.cardiac || 0) * multiplier,
    mental: (impacts.mental || 0) * multiplier,
    cognitive: (impacts.cognitive || 0) * multiplier,
    overdose: impacts.overdose || 0,
    infections: impacts.infections || 0,
    falls: impacts.falls || 0
  };
}

/**
 * Check if overdose occurs and is fatal
 * @param {string} substance - Substance type
 * @param {string} stage - Use stage ("regular" or "dependent" for OD risk)
 * @param {string} regionCode - Region code
 * @returns {object} - {overdose: boolean, fatal: boolean}
 */
function checkOverdose(substance, stage, regionCode) {
  const substanceData = SUBSTANCES[substance];
  const stageData = PROGRESSION_STAGES[stage];
  
  if (!stageData) {
    return { overdose: false, fatal: false };
  }

  // Overdose risk increases with stage
  const overdoseRisk = {
    casual: 0.01,       // 1% annual overdose risk
    regular: 0.05,      // 5% annual
    dependent: 0.20     // 20% annual
  };

  const risk = overdoseRisk[stage] || 0;
  if (Math.random() > risk) {
    return { overdose: false, fatal: false };
  }

  // Overdose occurred - check if fatal
  const lethality = substanceData.overdoseLethal;
  const intervention = REGIONAL_MODIFIERS[Object.keys(REGIONAL_MODIFIERS).find(k => 
    REGIONAL_MODIFIERS[k].regionCode === regionCode
  )]?.overdoseIntervention || 0.5;

  const actualLethality = lethality * (1 - intervention);
  const isFatal = Math.random() < actualLethality;

  return { overdose: true, fatal: isFatal };
}

/**
 * Check treatment success
 * @param {string} substance - Substance type
 * @param {string} regionCode - Region code
 * @returns {boolean} - Treatment successful?
 */
function checkTreatmentSuccess(substance, regionCode) {
  const substanceData = SUBSTANCES[substance];
  const successRate = substanceData.treatmentSuccess[regionCode] || 0.1;
  return Math.random() < successRate;
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  SUBSTANCES,
  PROGRESSION_STAGES,
  REGIONAL_MODIFIERS,
  getSubstanceInitiation,
  getStageProgression,
  getSubstancePenalties,
  checkOverdose,
  checkTreatmentSuccess
};
