/**
 * GLOBAL STATISTICS BY AGE/GENDER
 * 
 * WHO, CDC, World Bank data compiled into baseline probabilities
 * These are "per 100,000 population per year" converted to decimal probabilities
 * 
 * Regional multipliers are then applied on top of these baselines
 * Example: Suicide baseline age 20 male = 0.025% (250/100K)
 *          Nordic multiplier = 0.8 (lower due to better mental health services)
 *          Result = 0.025% * 0.8 = 0.020% actual risk
 */

const GLOBAL_STATISTICS = {
  // ========================================================================
  // SUICIDE RATES by age/gender (WHO, CDC data)
  // ========================================================================
  // Global average: ~10-15 per 100K annually
  // Age distribution peaks: 15-24 (especially males), 75+ (especially males)
  // Male:Female ratio approximately 3-4:1
  
  suicide: {
    // Format: age range in years as key
    // Values are per 100K population per year
    male: {
      "5-14": 2,
      "15-24": 28,    // Peak youth suicide
      "25-34": 22,
      "35-44": 20,
      "45-54": 18,
      "55-64": 15,
      "65-74": 18,
      "75+": 25       // Peak elderly suicide
    },
    female: {
      "5-14": 1,
      "15-24": 8,     // Much lower than males
      "25-34": 7,
      "35-44": 7,
      "45-54": 7,
      "55-64": 6,
      "65-74": 7,
      "75+": 6
    }
  },

  // ========================================================================
  // HOMICIDE RATES by age/gender
  // ========================================================================
  // Global average: ~8-10 per 100K (much higher in certain regions)
  // Peak ages: 15-35, especially males
  
  homicide: {
    male: {
      "5-14": 3,
      "15-24": 35,    // Peak homicide age
      "25-34": 28,
      "35-44": 12,
      "45-54": 6,
      "55-64": 4,
      "65-74": 3,
      "75+": 2
    },
    female: {
      "5-14": 2,
      "15-24": 8,
      "25-34": 5,
      "35-44": 4,
      "45-54": 3,
      "55-64": 2,
      "65-74": 2,
      "75+": 1
    }
  },

  // ========================================================================
  // TRAFFIC ACCIDENT DEATHS by age/gender
  // ========================================================================
  // Leading cause of death for ages 5-29 in developed countries
  
  trafficAccident: {
    male: {
      "5-14": 8,
      "15-24": 25,    // Risky driving behavior
      "25-34": 18,
      "35-44": 12,
      "45-54": 10,
      "55-64": 8,
      "65-74": 12,
      "75+": 20       // Frailty increases severity
    },
    female: {
      "5-14": 5,
      "15-24": 8,
      "25-34": 6,
      "35-44": 5,
      "45-54": 5,
      "55-64": 4,
      "65-74": 8,
      "75+": 12
    }
  },

  // ========================================================================
  // OVERDOSE DEATHS by age/gender
  // ========================================================================
  // Rising significantly globally, especially in developed countries
  
  overdose: {
    male: {
      "5-14": 0.5,
      "15-24": 15,    // Opioid crisis ages
      "25-34": 20,    // Peak
      "35-44": 15,
      "45-54": 12,
      "55-64": 6,
      "65-74": 2,
      "75+": 1
    },
    female: {
      "5-14": 0.2,
      "15-24": 10,
      "25-34": 12,
      "35-44": 8,
      "45-54": 5,
      "55-64": 2,
      "65-74": 1,
      "75+": 0.5
    }
  },

  // ========================================================================
  // HEART DISEASE MORTALITY by age/gender
  // ========================================================================
  // Leading cause of death overall in developed countries
  // Increases sharply with age
  
  heartDisease: {
    male: {
      "5-14": 0.5,
      "15-24": 2,
      "25-34": 5,
      "35-44": 25,
      "45-54": 80,
      "55-64": 200,
      "65-74": 600,
      "75+": 1800
    },
    female: {
      "5-14": 0.3,
      "15-24": 1,
      "25-34": 2,
      "35-44": 8,
      "45-54": 30,
      "55-64": 100,
      "65-74": 400,
      "75+": 1200
    }
  },

  // ========================================================================
  // CANCER MORTALITY by age/gender
  // ========================================================================
  // Second leading cause in developed countries
  
  cancer: {
    male: {
      "5-14": 3,
      "15-24": 5,
      "25-34": 12,
      "35-44": 60,
      "45-54": 150,
      "55-64": 300,
      "65-74": 700,
      "75+": 1000
    },
    female: {
      "5-14": 2,
      "15-24": 4,
      "25-34": 10,
      "35-44": 50,
      "45-54": 120,
      "55-64": 250,
      "65-74": 550,
      "75+": 800
    }
  },

  // ========================================================================
  // RESPIRATORY DISEASE by age/gender
  // ========================================================================
  
  respiratory: {
    male: {
      "5-14": 2,
      "15-24": 3,
      "25-34": 5,
      "35-44": 15,
      "45-54": 50,
      "55-64": 120,
      "65-74": 300,
      "75+": 600
    },
    female: {
      "5-14": 1.5,
      "15-24": 2,
      "25-34": 3,
      "35-44": 10,
      "45-54": 35,
      "55-64": 90,
      "65-74": 250,
      "75+": 450
    }
  },

  // ========================================================================
  // DIARRHEAL DISEASE & INFECTIOUS (Developing countries marker)
  // ========================================================================
  // Very low in developed, significant in low-resource
  
  diarrheal: {
    male: {
      "5-14": 5,      // Children vulnerable in low-resource settings
      "15-24": 2,
      "25-34": 1,
      "35-44": 1,
      "45-54": 1,
      "55-64": 1.5,
      "65-74": 3,
      "75+": 10       // Elderly dehydration risk
    },
    female: {
      "5-14": 4,
      "15-24": 1.5,
      "25-34": 0.8,
      "35-44": 0.8,
      "45-54": 0.8,
      "55-64": 1,
      "65-74": 2,
      "75+": 8
    }
  },

  // ========================================================================
  // MALARIA (Tropical regions, very regional)
  // ========================================================================
  
  malaria: {
    male: {
      "5-14": 15,     // Children have least immunity
      "15-24": 8,
      "25-34": 5,
      "35-44": 4,
      "45-54": 3,
      "55-64": 2,
      "65-74": 1,
      "75+": 1
    },
    female: {
      "5-14": 13,
      "15-24": 6,
      "25-34": 10,    // Pregnant women at high risk (not modeled separately)
      "35-44": 6,
      "45-54": 3,
      "55-64": 2,
      "65-74": 1,
      "75+": 1
    }
  },

  // ========================================================================
  // MATERNAL MORTALITY (Female only, fertile ages)
  // ========================================================================
  // Global: ~287 per 100K live births, affects ages 15-49
  // Converted to annual risk as percentage of female population
  
  maternalDeath: {
    female: {
      "15-24": 5,     // Young, higher risk
      "25-34": 4,     // Peak childbearing
      "35-44": 6,     // Advanced maternal age risk
      "45-49": 3      // Perimenopause
    }
  },

  // ========================================================================
  // POVERTY/MALNUTRITION (Resource-dependent)
  // ========================================================================
  // Mainly affects low-resource regions
  
  malnutrition: {
    male: {
      "5-14": 20,     // Children most vulnerable
      "15-24": 5,
      "25-34": 3,
      "35-44": 2,
      "45-54": 2,
      "55-64": 2,
      "65-74": 5,
      "75+": 15       // Elderly living alone, poor
    },
    female: {
      "5-14": 18,
      "15-24": 4,
      "25-34": 2,
      "35-44": 1.5,
      "45-54": 1.5,
      "55-64": 2,
      "65-74": 4,
      "75+": 12
    }
  }
};

// ============================================================================
// SUICIDE METHOD AVAILABILITY & LETHALITY BY REGION
// ============================================================================
// Method availability and success rates vary dramatically by region
// This determines what methods are available and how lethal they are

const SUICIDE_METHODS = {
  "Nordic": {
    // Nordic: Low firearms, good intervention systems, high healthcare access
    methods: [
      { name: "poisoning", availability: 0.9, lethality: 0.25, intervention: 0.8 },    // Best intervention
      { name: "overdose", availability: 0.8, lethality: 0.20, intervention: 0.85 },    // Reversible
      { name: "hanging", availability: 0.7, lethality: 0.60, intervention: 0.5 },      // Less lethal with intervention
      { name: "firearm", availability: 0.05, lethality: 0.90, intervention: 0.3 },     // Rare access
      { name: "jumping", availability: 0.3, lethality: 0.70, intervention: 0.4 }       // High cities
    ],
    baseAttemptToCompletionRatio: 0.05   // 5% of attempts are fatal (good services)
  },

  "Developed": {
    // Developed: Moderate firearms, good intervention, strong healthcare
    methods: [
      { name: "poisoning", availability: 0.85, lethality: 0.30, intervention: 0.7 },
      { name: "overdose", availability: 0.75, lethality: 0.25, intervention: 0.8 },
      { name: "hanging", availability: 0.8, lethality: 0.65, intervention: 0.45 },
      { name: "firearm", availability: 0.35, lethality: 0.95, intervention: 0.2 },     // Moderate access
      { name: "jumping", availability: 0.4, lethality: 0.75, intervention: 0.3 }
    ],
    baseAttemptToCompletionRatio: 0.08
  },

  "Emerging": {
    // Emerging: Mixed method access, moderate intervention, variable healthcare
    methods: [
      { name: "poisoning", availability: 0.7, lethality: 0.40, intervention: 0.5 },
      { name: "overdose", availability: 0.6, lethality: 0.30, intervention: 0.6 },
      { name: "hanging", availability: 0.9, lethality: 0.70, intervention: 0.3 },      // Common, high lethality
      { name: "firearm", availability: 0.4, lethality: 0.95, intervention: 0.15 },
      { name: "jumping", availability: 0.5, lethality: 0.80, intervention: 0.2 },
      { name: "pesticide", availability: 0.8, lethality: 0.50, intervention: 0.4 }    // Agricultural access
    ],
    baseAttemptToCompletionRatio: 0.15   // 15% of attempts fatal
  },

  "Developing": {
    // Developing: Limited intervention, poor healthcare, more lethal methods common
    methods: [
      { name: "pesticide", availability: 0.9, lethality: 0.60, intervention: 0.2 },   // Highly lethal
      { name: "hanging", availability: 0.95, lethality: 0.75, intervention: 0.2 },
      { name: "poisoning", availability: 0.5, lethality: 0.45, intervention: 0.3 },
      { name: "firearm", availability: 0.3, lethality: 0.95, intervention: 0.1 },
      { name: "jumping", availability: 0.4, lethality: 0.85, intervention: 0.15 },
      { name: "drowning", availability: 0.6, lethality: 0.80, intervention: 0.1 }
    ],
    baseAttemptToCompletionRatio: 0.25   // 25% of attempts fatal
  },

  "Fragile": {
    // Fragile: Minimal intervention, lethal methods, chaotic healthcare
    methods: [
      { name: "firearm", availability: 0.7, lethality: 0.95, intervention: 0.05 },    // Weapon access
      { name: "hanging", availability: 0.95, lethality: 0.80, intervention: 0.1 },
      { name: "pesticide", availability: 0.85, lethality: 0.70, intervention: 0.1 },
      { name: "poisoning", availability: 0.4, lethality: 0.50, intervention: 0.2 },
      { name: "jumping", availability: 0.3, lethality: 0.85, intervention: 0.05 },
      { name: "drowning", availability: 0.5, lethality: 0.85, intervention: 0.05 }
    ],
    baseAttemptToCompletionRatio: 0.35   // 35% of attempts fatal (poor services)
  }
};

// ============================================================================
// REGIONAL MULTIPLIERS
// ============================================================================
// Applied on top of global baseline statistics
// Values < 1.0 mean lower risk, > 1.0 mean higher risk
// Different causes have different regional factors

const REGIONAL_MULTIPLIERS = {
  "Nordic": {
    suicide: 0.7,              // Better mental health services
    homicide: 0.3,             // Very safe
    trafficAccident: 0.6,      // Good roads, enforcement
    overdose: 0.4,             // Less opioid crisis
    heartDisease: 0.8,         // Good healthcare access
    cancer: 0.8,               // Early detection
    respiratory: 0.6,          // Clean air, healthcare
    diarrheal: 0.1,            // Excellent sanitation
    malaria: 0.0,              // No malaria
    maternalDeath: 0.2,        // Excellent obstetric care
    malnutrition: 0.05         // Welfare state
  },

  "Developed": {
    suicide: 0.8,
    homicide: 0.4,
    trafficAccident: 0.7,
    overdose: 0.6,
    heartDisease: 0.9,
    cancer: 0.9,
    respiratory: 0.7,
    diarrheal: 0.1,
    malaria: 0.0,
    maternalDeath: 0.3,
    malnutrition: 0.1
  },

  "Emerging": {
    suicide: 1.0,              // Global baseline
    homicide: 1.5,             // Moderate violence
    trafficAccident: 1.2,      // Worse infrastructure
    overdose: 0.8,
    heartDisease: 1.2,         // Less preventive care
    cancer: 1.1,               // Later detection
    respiratory: 1.3,          // Pollution
    diarrheal: 2.0,            // Sanitation issues
    malaria: 0.5,              // Some endemic areas
    maternalDeath: 2.0,        // Limited obstetric access
    malnutrition: 1.5
  },

  "Developing": {
    suicide: 1.1,
    homicide: 2.0,             // Higher violence
    trafficAccident: 1.5,      // Poor infrastructure
    overdose: 0.5,
    heartDisease: 0.7,         // Less prevalence, premature death
    cancer: 0.8,               // Less prevalence, premature death
    respiratory: 2.0,          // Heavy pollution, less healthcare
    diarrheal: 5.0,            // Major sanitation issues
    malaria: 3.0,              // Endemic malaria
    maternalDeath: 8.0,        // Minimal obstetric care
    malnutrition: 5.0          // Significant hunger
  },

  "Fragile": {
    suicide: 1.2,
    homicide: 4.0,             // High violence/conflict
    trafficAccident: 2.0,      // Dangerous conditions
    overdose: 0.3,
    heartDisease: 0.5,         // High mortality at younger ages
    cancer: 0.5,               // High mortality at younger ages
    respiratory: 3.0,          // Poor air quality, no healthcare
    diarrheal: 8.0,            // Severe sanitation crisis
    malaria: 5.0,              // Endemic, no treatment access
    maternalDeath: 15.0,       // Minimal maternal care
    malnutrition: 10.0         // Severe hunger/famine
  }
};

/**
 * Get the global baseline statistic for a cause/age/gender combination
 * @param {string} cause - The cause name (e.g., "suicide", "homicide")
 * @param {number} age - Player age
 * @param {string} gender - "male" or "female"
 * @returns {number} - Annual probability as percentage (e.g., 0.028 for 0.028%)
 */
function getGlobalBaseline(cause, age, gender) {
  if (!GLOBAL_STATISTICS[cause]) {
    console.warn(`Unknown cause: ${cause}`);
    return 0;
  }

  const stats = GLOBAL_STATISTICS[cause];
  const genderStats = stats[gender];
  
  if (!genderStats) {
    return 0;
  }

  // Find matching age bracket
  for (const bracket of Object.keys(genderStats)) {
    const [min, max] = bracket.split("-").map(x => x === "+" ? Infinity : parseInt(x));
    if (age >= min && age <= max) {
      // Convert per 100K to percentage: 28 per 100K = 0.028%
      return genderStats[bracket] / 100000 * 100;
    }
  }

  return 0;
}

/**
 * Get adjusted probability with regional multiplier applied
 * @param {string} cause - Cause name
 * @param {number} age - Player age
 * @param {string} gender - "male" or "female"
 * @param {string} region - Region name (e.g., "Nordic", "Developing")
 * @returns {number} - Final probability percentage
 */
function getAdjustedProbability(cause, age, gender, region) {
  const baseline = getGlobalBaseline(cause, age, gender);
  const multiplier = REGIONAL_MULTIPLIERS[region]?.[cause] || 1.0;
  return baseline * multiplier;
}

/**
 * Get suicide method data for a region
 * @param {string} region - Region name (e.g., "Nordic", "Developing")
 * @returns {object} - Object with methods array and attempt-to-completion ratio
 */
function getSuicideMethodsForRegion(region) {
  return SUICIDE_METHODS[region] || SUICIDE_METHODS["Developing"];
}

module.exports = {
  GLOBAL_STATISTICS,
  REGIONAL_MULTIPLIERS,
  SUICIDE_METHODS,
  getGlobalBaseline,
  getAdjustedProbability,
  getSuicideMethodsForRegion
};
