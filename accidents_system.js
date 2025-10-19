/**
 * ACCIDENTS SYSTEM - Unintentional injury deaths and disability
 * 
 * Models accidents as a major cause of death, particularly for youth.
 * Types: Falls, traffic, drowning, occupational, sports injuries, etc.
 * 
 * Regional framework:
 * - Nordic: 40-50/100K accidents (safe infrastructure, traffic safety)
 * - Developed: 50-70/100K
 * - Emerging: 80-120/100K (less safety infrastructure)
 * - Developing: 120-180/100K (poor roads, hazardous work)
 * - Fragile: 150-250/100K (minimal safety, high violence-accidents)
 */

const ACCIDENT_TYPES = {
  // Falls (most common accident)
  falls: {
    name: "Falls",
    ageGroups: {
      "0-4": 30,      // Toddler falls (high but mostly non-fatal)
      "5-14": 25,
      "15-24": 15,
      "25-34": 12,
      "35-44": 10,
      "45-54": 12,
      "55-64": 25,    // Osteoporosis, balance issues
      "65-74": 80,    // Elderly falls very common
      "75+": 150      // Hip fractures, serious falls
    },
    fatalityRate: 0.01, // 1% of falls are fatal (varies by age/severity)
    disabilityRate: 0.05 // 5% cause permanent disability
  },

  // Traffic/transport accidents
  traffic: {
    name: "Traffic Accidents",
    ageGroups: {
      "0-4": 3,
      "5-14": 8,      // Pedestrian/passenger
      "15-24": 35,    // Peak risky driving ages
      "25-34": 20,
      "35-44": 12,
      "45-54": 10,
      "55-64": 8,
      "65-74": 15,    // Elderly drivers
      "75+": 20
    },
    fatalityRate: 0.02, // 2% of accidents are fatal
    disabilityRate: 0.08,
    riskFactors: ["speeding", "alcohol", "inexperience", "elderly"]
  },

  // Drowning/water accidents
  drowning: {
    name: "Drowning",
    ageGroups: {
      "0-4": 8,       // Leading unintentional injury death in this age
      "5-14": 5,
      "15-24": 8,
      "25-34": 4,
      "35-44": 2,
      "45-54": 2,
      "55-64": 1,
      "65-74": 1,
      "75+": 1
    },
    fatalityRate: 1.0, // Always fatal if unrescued
    disabilityRate: 0.20, // Brain damage if saved
    regionalVariation: true // Higher in regions with water access
  },

  // Occupational accidents
  occupational: {
    name: "Occupational Injury",
    ageGroups: {
      "0-4": 0,
      "5-14": 0.5,
      "15-24": 8,
      "25-34": 12,
      "35-44": 10,
      "45-54": 8,
      "55-64": 5,
      "65-74": 0,
      "75+": 0
    },
    fatalityRate: 0.015, // 1.5% of workplace injuries fatal
    disabilityRate: 0.15,
    riskFactors: ["construction", "agriculture", "mining", "manufacturing"],
    regional: {
      nordic: 0.3,    // Strong safety regs, lower rate
      developed: 0.5,
      emerging: 0.8,
      developing: 1.2, // Poor safety standards
      fragile: 1.5    // Minimal enforcement
    }
  },

  // Sports/recreation injuries
  sports: {
    name: "Sports Injury",
    ageGroups: {
      "0-4": 0,
      "5-14": 20,     // Most sports injuries in youth
      "15-24": 35,    // Peak athletic engagement
      "25-34": 20,
      "35-44": 12,
      "45-54": 8,
      "55-64": 5,
      "65-74": 2,
      "75+": 0.5
    },
    fatalityRate: 0.001, // 0.1% sports injuries fatal (mostly head injuries)
    disabilityRate: 0.05 // Concussions, joint injuries
  },

  // Choking/suffocation
  choking: {
    name: "Choking/Suffocation",
    ageGroups: {
      "0-4": 6,       // Young children at risk
      "5-14": 0.5,
      "15-24": 0.2,
      "25-34": 0.1,
      "35-44": 0.1,
      "45-54": 0.2,
      "55-64": 0.3,   // Elderly risk increases
      "65-74": 0.5,
      "75+": 1
    },
    fatalityRate: 0.5, // 50% fatal if not rescued immediately
    disabilityRate: 0.10
  },

  // Fire/burns
  fire: {
    name: "Fire/Burns",
    ageGroups: {
      "0-4": 3,
      "5-14": 2,
      "15-24": 1,
      "25-34": 1,
      "35-44": 1,
      "45-54": 2,
      "55-64": 3,
      "65-74": 5,     // Elderly less mobile
      "75+": 8
    },
    fatalityRate: 0.05, // 5% of fires fatal
    disabilityRate: 0.20, // Severe scarring/mobility loss
    regional: {
      nordic: 0.2,    // Good fire safety
      developed: 0.4,
      emerging: 0.8,
      developing: 1.5,
      fragile: 2.0    // Poor housing, fire hazards
    }
  },

  // Poisoning (accidental)
  poisoning: {
    name: "Poisoning",
    ageGroups: {
      "0-4": 5,       // Accidental ingestion
      "5-14": 1,
      "15-24": 2,     // Some intentional overlap
      "25-34": 2,
      "35-44": 1,
      "45-54": 1,
      "55-64": 1,
      "65-74": 2,     // Medication errors
      "75+": 3
    },
    fatalityRate: 0.15, // 15% of poisonings fatal
    disabilityRate: 0.10,
    riskFactors: ["pesticides", "medications", "chemicals"]
  },

  // Other unintentional injuries
  other: {
    name: "Other Unintentional Injury",
    ageGroups: {
      "0-4": 5,
      "5-14": 8,
      "15-24": 10,
      "25-34": 8,
      "35-44": 6,
      "45-54": 5,
      "55-64": 4,
      "65-74": 5,
      "75+": 8
    },
    fatalityRate: 0.01,
    disabilityRate: 0.03
  }
};

// ============================================================================
// REGIONAL ACCIDENT MODIFIERS
// ============================================================================

const REGIONAL_MODIFIERS = {
  "Nordic Country": {
    incidenceMultiplier: 0.5,  // Very safe infrastructure
    medicalAccess: 0.98,       // Rapid emergency response
    fatalityReduction: 0.3,    // Good ER outcomes
    regionCode: "nordic"
  },

  "Western Europe": {
    incidenceMultiplier: 0.7,
    medicalAccess: 0.95,
    fatalityReduction: 0.25,
    regionCode: "developed"
  },

  "Japan/South Korea": {
    incidenceMultiplier: 0.6,  // Very safe cities
    medicalAccess: 0.98,
    fatalityReduction: 0.30,
    regionCode: "developed"
  },

  "North America - Middle Class": {
    incidenceMultiplier: 0.8,
    medicalAccess: 0.90,
    fatalityReduction: 0.20,
    regionCode: "developed"
  },

  "Eastern Europe": {
    incidenceMultiplier: 1.2,
    medicalAccess: 0.70,
    fatalityReduction: 0.10,
    regionCode: "emerging"
  },

  "Urban China": {
    incidenceMultiplier: 1.1,
    medicalAccess: 0.75,
    fatalityReduction: 0.12,
    regionCode: "emerging"
  },

  "Urban Latin America": {
    incidenceMultiplier: 1.5,
    medicalAccess: 0.60,
    fatalityReduction: 0.05,
    regionCode: "developing"
  },

  "Southeast Asia": {
    incidenceMultiplier: 1.8,  // Poor roads, traffic chaos
    medicalAccess: 0.45,
    fatalityReduction: 0.02,
    regionCode: "developing"
  },

  "Rural India": {
    incidenceMultiplier: 1.6,
    medicalAccess: 0.30,
    fatalityReduction: 0.01,
    regionCode: "developing"
  },

  "Sub-Saharan Africa": {
    incidenceMultiplier: 2.0,  // Very high accident rates
    medicalAccess: 0.20,       // Limited emergency care
    fatalityReduction: 0.0,    // Minimal intervention
    regionCode: "fragile"
  }
};

// ============================================================================
// DISABILITY OUTCOMES
// ============================================================================

const DISABILITY_TYPES = {
  mobility: {
    name: "Mobility Limitation",
    employmentPenalty: -0.7,    // Can still work some jobs
    physicalPenalty: -15,        // Permanent health reduction
    commonAfter: ["falls", "traffic", "occupational"]
  },

  cognitive: {
    name: "Cognitive Impairment (TBI)",
    employmentPenalty: -1.5,    // Very difficult to work
    mentalPenalty: -20,         // Significant mental health impact
    physicalPenalty: -10,
    commonAfter: ["traffic", "sports", "drowning"]
  },

  dexterity: {
    name: "Loss of Dexterity",
    employmentPenalty: -1.0,
    physicalPenalty: -8,
    commonAfter: ["occupational", "fire"]
  },

  sensory: {
    name: "Vision or Hearing Loss",
    employmentPenalty: -0.5,
    physicalPenalty: -5,
    commonAfter: ["occupational", "fire"]
  },

  chronic_pain: {
    name: "Chronic Pain Syndrome",
    employmentPenalty: -0.6,
    mentalPenalty: -5,
    physicalPenalty: -10,
    commonAfter: ["falls", "occupational", "sports"]
  }
};

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Determine if an accident occurs this year
 * @param {number} age - Player age
 * @param {string} gender - "male" or "female"
 * @param {string} birthRegion - Region name
 * @param {object} additionalFactors - {occupation, speeding, swimming, etc}
 * @returns {object} {hasAccident: boolean, type: "traffic"|"falls"|..., severity: "minor"|"moderate"|"severe"|"fatal"}
 */
function getAccidentIncidence(age, gender, birthRegion, additionalFactors = {}) {
  const regional = REGIONAL_MODIFIERS[birthRegion];
  if (!regional) {
    return { hasAccident: false, type: null, severity: null };
  }

  // Determine age group
  let ageGroup;
  if (age < 5) ageGroup = "0-4";
  else if (age < 15) ageGroup = "5-14";
  else if (age < 25) ageGroup = "15-24";
  else if (age < 35) ageGroup = "25-34";
  else if (age < 45) ageGroup = "35-44";
  else if (age < 55) ageGroup = "45-54";
  else if (age < 65) ageGroup = "55-64";
  else if (age < 75) ageGroup = "65-74";
  else ageGroup = "75+";

  // Calculate total accident probability from all types
  let totalAccidentRate = 0;
  const applicableTypes = [];

  for (const [type, data] of Object.entries(ACCIDENT_TYPES)) {
    let rate = data.ageGroups[ageGroup] || 0;

    // Apply regional multiplier
    if (data.regional) {
      rate *= data.regional[regional.regionCode] || 1;
    } else {
      rate *= regional.incidenceMultiplier;
    }

    // Apply risk factors
    if (data.riskFactors) {
      if (additionalFactors.speeding && data.riskFactors.includes("speeding")) {
        rate *= 2;
      }
      if (additionalFactors.alcohol && data.riskFactors.includes("alcohol")) {
        rate *= 1.8;
      }
      if (additionalFactors.occupation) {
        if (data.riskFactors.includes("construction") || data.riskFactors.includes("manufacturing")) {
          rate *= 1.5;
        }
      }
    }

    totalAccidentRate += rate;
    applicableTypes.push({ type, rate });
  }

  // Convert from per 100,000 to probability per year
  const probabilityPerYear = totalAccidentRate / 100000;

  // Roll the dice
  if (Math.random() > probabilityPerYear) {
    return {
      hasAccident: false,
      type: null,
      severity: null,
      incidenceRate: totalAccidentRate
    };
  }

  // Accident occurs - determine type
  const weights = applicableTypes.map(a => a.rate);
  const cumulative = [];
  let sum = 0;
  for (const w of weights) {
    sum += w;
    cumulative.push(sum);
  }

  const pick = Math.random() * sum;
  let selectedType = "other";
  for (let i = 0; i < cumulative.length; i++) {
    if (pick <= cumulative[i]) {
      selectedType = applicableTypes[i].type;
      break;
    }
  }

  const typeData = ACCIDENT_TYPES[selectedType];

  // Determine severity and whether fatal
  const severityRoll = Math.random();
  let severity = "minor";
  let isFatal = false;

  if (severityRoll < typeData.fatalityRate * (1 - regional.fatalityReduction)) {
    // Fatal accident
    severity = "fatal";
    isFatal = true;
  } else if (severityRoll < typeData.fatalityRate + typeData.disabilityRate) {
    severity = "severe"; // Non-fatal but disabling
  } else if (severityRoll < typeData.fatalityRate + typeData.disabilityRate * 2) {
    severity = "moderate";
  } else {
    severity = "minor";
  }

  return {
    hasAccident: true,
    type: selectedType,
    severity,
    isFatal,
    disabilityRate: typeData.disabilityRate,
    incidenceRate: totalAccidentRate
  };
}

/**
 * Get disability outcome from accident
 * @param {string} accidentType - Accident type
 * @param {string} severity - "minor", "moderate", "severe", "fatal"
 * @returns {object} {disabilityType, penalties}
 */
function getAccidentDisability(accidentType, severity) {
  if (severity === "minor" || severity === "fatal") {
    return { disabilityType: null, penalties: {} };
  }

  // Choose disability based on accident type
  let disabilityType = "mobility";
  
  const typeData = ACCIDENT_TYPES[accidentType];
  if (typeData.commonAfter) {
    // Pick a disability that commonly follows this type
    const common = typeData.commonAfter;
    const options = Object.keys(DISABILITY_TYPES).filter(d => common.includes(d));
    if (options.length > 0) {
      disabilityType = options[Math.floor(Math.random() * options.length)];
    }
  }

  const disData = DISABILITY_TYPES[disabilityType];
  return {
    disabilityType,
    name: disData.name,
    penalties: {
      employment: disData.employmentPenalty || 0,
      mental: disData.mentalPenalty || 0,
      physical: disData.physicalPenalty || 0
    }
  };
}

/**
 * Check if accident causes immediate death
 * @param {string} severity - "minor", "moderate", "severe", "fatal"
 * @returns {boolean}
 */
function shouldDieFromAccident(severity) {
  return severity === "fatal";
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  ACCIDENT_TYPES,
  ACCIDENT_TYPES,
  REGIONAL_MODIFIERS,
  DISABILITY_TYPES,
  getAccidentIncidence,
  getAccidentDisability,
  shouldDieFromAccident
};
