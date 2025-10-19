/**
 * GLOBAL STATISTICS BY AGE BRACKET & GENDER
 * 
 * Simplified into 4 life stages: Childhood (0-5), Youth (6-17), Adult (18-64), Elderly (65+)
 * WHO, CDC, World Bank data compiled into baseline probabilities
 * 
 * Regional multipliers are then applied on top of these baselines
 * Example: Suicide baseline adult male = 0.020% (200/100K)
 *          Nordic multiplier = 0.7 (lower due to better mental health services)
 *          Result = 0.020% * 0.7 = 0.014% actual risk
 */

const AGE_BRACKETS = {
  CHILDHOOD: { min: 0, max: 5, name: "Childhood (0-5)" },
  YOUTH: { min: 6, max: 17, name: "Youth (6-17)" },
  ADULT: { min: 18, max: 64, name: "Adult (18-64)" },
  ELDERLY: { min: 65, max: 150, name: "Elderly (65+)" }
};

function getAgeBracket(age) {
  if (age < 6) return AGE_BRACKETS.CHILDHOOD;
  if (age < 18) return AGE_BRACKETS.YOUTH;
  if (age < 65) return AGE_BRACKETS.ADULT;
  return AGE_BRACKETS.ELDERLY;
}

// ============================================================================
// GLOBAL STATISTICS BY AGE BRACKET & GENDER
// ============================================================================
// Format: Per 100,000 population per year
// Causes include: suicide, homicide, accident, disease, etc.

const GLOBAL_STATISTICS = {
  suicide: {
    male: {
      childhood: 1,        // Ages 0-5: Rare
      youth: 18,           // Ages 6-17: Peak adolescence
      adult: 18,           // Ages 18-64: Sustained high
      elderly: 25          // Ages 65+: Peak elderly
    },
    female: {
      childhood: 0.5,
      youth: 5,            // Much lower than males
      adult: 6,
      elderly: 8
    }
  },

  homicide: {
    male: {
      childhood: 2,
      youth: 35,           // Peak violent crime ages
      adult: 16,
      elderly: 3
    },
    female: {
      childhood: 1.5,
      youth: 8,
      adult: 4,
      elderly: 1
    }
  },

  trafficAccident: {
    male: {
      childhood: 4,
      youth: 22,           // Risky driving behavior
      adult: 14,
      elderly: 18          // Frailty increases severity
    },
    female: {
      childhood: 3,
      youth: 8,
      adult: 6,
      elderly: 10
    }
  },

  overdose: {
    male: {
      childhood: 0.2,
      youth: 12,           // Opioid crisis ages
      adult: 18,           // Peak
      elderly: 2
    },
    female: {
      childhood: 0.1,
      youth: 8,
      adult: 10,
      elderly: 1
    }
  },

  heartDisease: {
    male: {
      childhood: 0.3,
      youth: 1,
      adult: 50,           // Rising sharply
      elderly: 800         // Major cause in elderly
    },
    female: {
      childhood: 0.2,
      youth: 0.5,
      adult: 15,           // Lower than males until menopause
      elderly: 500
    }
  },

  cancer: {
    male: {
      childhood: 2,
      youth: 3,
      adult: 80,
      elderly: 650
    },
    female: {
      childhood: 1.5,
      youth: 2.5,
      adult: 70,           // Often breast/reproductive
      elderly: 500
    }
  },

  respiratory: {
    male: {
      childhood: 1.5,
      youth: 2,
      adult: 30,
      elderly: 300
    },
    female: {
      childhood: 1,
      youth: 1.5,
      adult: 20,
      elderly: 200
    }
  },

  diarrheal: {
    male: {
      childhood: 50,       // Children vulnerable in low-resource
      youth: 2,
      adult: 1,
      elderly: 10
    },
    female: {
      childhood: 45,
      youth: 1.5,
      adult: 0.8,
      elderly: 8
    }
  },

  malaria: {
    male: {
      childhood: 20,       // Children have least immunity
      youth: 8,
      adult: 5,
      elderly: 2
    },
    female: {
      childhood: 18,
      youth: 6,
      adult: 8,            // Pregnant women at higher risk
      elderly: 1.5
    }
  },

  maternalDeath: {
    // Female only, fertile ages
    female: {
      childhood: 0,        // Ages 0-5: None
      youth: 0.2,          // Ages 6-17: Rare (very young pregnancy)
      adult: 30,           // Ages 18-64: ~300 per 100K live births
      elderly: 0           // Ages 65+: None
    }
  },

  malnutrition: {
    male: {
      childhood: 40,       // Children most vulnerable
      youth: 3,
      adult: 1,
      elderly: 8
    },
    female: {
      childhood: 35,
      youth: 2,
      adult: 0.8,
      elderly: 6
    }
  }
};

// ============================================================================
// SUICIDE METHOD AVAILABILITY & LETHALITY BY REGION
// ============================================================================

const SUICIDE_METHODS = {
  "Nordic": {
    methods: [
      { name: "poisoning", availability: 0.9, lethality: 0.25, intervention: 0.8 },
      { name: "overdose", availability: 0.8, lethality: 0.20, intervention: 0.85 },
      { name: "hanging", availability: 0.7, lethality: 0.60, intervention: 0.5 },
      { name: "firearm", availability: 0.05, lethality: 0.90, intervention: 0.3 },
      { name: "jumping", availability: 0.3, lethality: 0.70, intervention: 0.4 }
    ]
  },

  "Developed": {
    methods: [
      { name: "poisoning", availability: 0.85, lethality: 0.30, intervention: 0.7 },
      { name: "overdose", availability: 0.75, lethality: 0.25, intervention: 0.8 },
      { name: "hanging", availability: 0.8, lethality: 0.65, intervention: 0.45 },
      { name: "firearm", availability: 0.35, lethality: 0.95, intervention: 0.2 },
      { name: "jumping", availability: 0.4, lethality: 0.75, intervention: 0.3 }
    ]
  },

  "Emerging": {
    methods: [
      { name: "poisoning", availability: 0.7, lethality: 0.40, intervention: 0.5 },
      { name: "overdose", availability: 0.6, lethality: 0.30, intervention: 0.6 },
      { name: "hanging", availability: 0.9, lethality: 0.70, intervention: 0.3 },
      { name: "firearm", availability: 0.4, lethality: 0.95, intervention: 0.15 },
      { name: "jumping", availability: 0.5, lethality: 0.80, intervention: 0.2 },
      { name: "pesticide", availability: 0.8, lethality: 0.50, intervention: 0.4 }
    ]
  },

  "Developing": {
    methods: [
      { name: "pesticide", availability: 0.9, lethality: 0.60, intervention: 0.2 },
      { name: "hanging", availability: 0.95, lethality: 0.75, intervention: 0.2 },
      { name: "poisoning", availability: 0.5, lethality: 0.45, intervention: 0.3 },
      { name: "firearm", availability: 0.3, lethality: 0.95, intervention: 0.1 },
      { name: "jumping", availability: 0.4, lethality: 0.85, intervention: 0.15 },
      { name: "drowning", availability: 0.6, lethality: 0.80, intervention: 0.1 }
    ]
  },

  "Fragile": {
    methods: [
      { name: "firearm", availability: 0.7, lethality: 0.95, intervention: 0.05 },
      { name: "hanging", availability: 0.95, lethality: 0.80, intervention: 0.1 },
      { name: "pesticide", availability: 0.85, lethality: 0.70, intervention: 0.1 },
      { name: "poisoning", availability: 0.4, lethality: 0.50, intervention: 0.2 },
      { name: "jumping", availability: 0.3, lethality: 0.85, intervention: 0.05 },
      { name: "drowning", availability: 0.5, lethality: 0.85, intervention: 0.05 }
    ]
  }
};

// ============================================================================
// REGIONAL MULTIPLIERS
// ============================================================================

const REGIONAL_MULTIPLIERS = {
  "Nordic": {
    suicide: 0.7,
    homicide: 0.3,
    trafficAccident: 0.6,
    overdose: 0.4,
    heartDisease: 0.8,
    cancer: 0.8,
    respiratory: 0.6,
    diarrheal: 0.05,
    malaria: 0.0,
    maternalDeath: 0.2,
    malnutrition: 0.05
  },

  "Developed": {
    suicide: 0.8,
    homicide: 0.4,
    trafficAccident: 0.7,
    overdose: 0.6,
    heartDisease: 0.9,
    cancer: 0.9,
    respiratory: 0.7,
    diarrheal: 0.05,
    malaria: 0.0,
    maternalDeath: 0.3,
    malnutrition: 0.1
  },

  "Emerging": {
    suicide: 1.0,
    homicide: 1.5,
    trafficAccident: 1.2,
    overdose: 0.8,
    heartDisease: 1.2,
    cancer: 1.1,
    respiratory: 1.3,
    diarrheal: 2.0,
    malaria: 0.5,
    maternalDeath: 2.0,
    malnutrition: 1.5
  },

  "Developing": {
    suicide: 1.1,
    homicide: 2.0,
    trafficAccident: 1.5,
    overdose: 0.5,
    heartDisease: 0.7,
    cancer: 0.8,
    respiratory: 2.0,
    diarrheal: 5.0,
    malaria: 3.0,
    maternalDeath: 8.0,
    malnutrition: 5.0
  },

  "Fragile": {
    suicide: 1.2,
    homicide: 4.0,
    trafficAccident: 2.0,
    overdose: 0.3,
    heartDisease: 0.5,
    cancer: 0.5,
    respiratory: 3.0,
    diarrheal: 8.0,
    malaria: 5.0,
    maternalDeath: 15.0,
    malnutrition: 10.0
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

  const bracket = getAgeBracket(age);
  const bracketKey = bracket.name.split(" ")[0].toLowerCase(); // "Childhood" -> "childhood"
  
  const ratePerHundredK = genderStats[bracketKey] || 0;
  // Convert per 100K to probability: 20 per 100K = 20/100000 = 0.0002
  return ratePerHundredK / 100000;
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
 * @returns {object} - Object with methods array
 */
function getSuicideMethodsForRegion(region) {
  return SUICIDE_METHODS[region] || SUICIDE_METHODS["Developing"];
}

module.exports = {
  AGE_BRACKETS,
  getAgeBracket,
  GLOBAL_STATISTICS,
  REGIONAL_MULTIPLIERS,
  SUICIDE_METHODS,
  getGlobalBaseline,
  getAdjustedProbability,
  getSuicideMethodsForRegion
};
