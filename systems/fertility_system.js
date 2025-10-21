/**
 * Fertility & Childbirth System
 * 
 * Models:
 * - Fertility probability by age, gender, region
 * - Pregnancy tracking and complications
 * - Birth outcomes and infant survival
 * - Family planning and contraception
 * - Maternal health effects
 * 
 * Nordic: 1.5 TFR (children per woman), low teen births, low mortality
 * Fragile: 4.5+ TFR (children per woman), high teen births, high mortality
 */

// Fertility rates by age and region (% of women who conceive in a given year)
const FERTILITY_BY_AGE_REGION = {
  Nordic: {
    "15-19": 0.02,    // Very low teen pregnancy (strong contraception use)
    "20-24": 0.15,    // Starting families
    "25-29": 0.20,    // Peak fertility
    "30-34": 0.15,    // Still fertile but many done
    "35-39": 0.08,    // Declining
    "40-44": 0.02,    // Rare
    "45-49": 0.00,    // Effectively zero
  },
  Developed: {
    "15-19": 0.05,
    "20-24": 0.18,
    "25-29": 0.22,
    "30-34": 0.16,
    "35-39": 0.10,
    "40-44": 0.03,
    "45-49": 0.00,
  },
  Emerging: {
    "15-19": 0.15,
    "20-24": 0.30,
    "25-29": 0.28,
    "30-34": 0.20,
    "35-39": 0.12,
    "40-44": 0.05,
    "45-49": 0.01,
  },
  Developing: {
    "15-19": 0.30,
    "20-24": 0.40,
    "25-29": 0.35,
    "30-34": 0.25,
    "35-39": 0.15,
    "40-44": 0.08,
    "45-49": 0.02,
  },
  Fragile: {
    "15-19": 0.50,    // Very high teen pregnancy
    "20-24": 0.55,    // Peak fertility
    "25-29": 0.50,    // Women still having kids
    "30-34": 0.40,
    "35-39": 0.25,
    "40-44": 0.12,
    "45-49": 0.05,
  },
};

// Contraceptive use and effectiveness
const CONTRACEPTION_BY_REGION = {
  Nordic: {
    usage: 0.85,      // 85% of sexually active women use contraception
    effectiveness: 0.95, // Modern methods very reliable
  },
  Developed: {
    usage: 0.75,
    effectiveness: 0.92,
  },
  Emerging: {
    usage: 0.50,
    effectiveness: 0.80,
  },
  Developing: {
    usage: 0.30,
    effectiveness: 0.70,
  },
  Fragile: {
    usage: 0.10,
    effectiveness: 0.60,
  },
};

// Pregnancy complications by region
const PREGNANCY_COMPLICATIONS = {
  Nordic: {
    gestationalDiabetes: 0.05,    // 5% develop gestational diabetes
    preeclampsia: 0.03,           // 3% develop preeclampsia
    miscarriage: 0.15,            // 15% miscarriage rate (natural)
    prematureBirth: 0.06,         // 6% deliver before 37 weeks
    cSectionRate: 0.20,           // 20% C-section delivery
    pregnancyDeathRate: 0.000004, // 4 per 100,000 pregnancies (extremely low)
  },
  Developed: {
    gestationalDiabetes: 0.07,
    preeclampsia: 0.05,
    miscarriage: 0.15,
    prematureBirth: 0.09,
    cSectionRate: 0.25,
    pregnancyDeathRate: 0.000010,
  },
  Emerging: {
    gestationalDiabetes: 0.08,
    preeclampsia: 0.08,
    miscarriage: 0.18,
    prematureBirth: 0.12,
    cSectionRate: 0.15,
    pregnancyDeathRate: 0.00004,
  },
  Developing: {
    gestationalDiabetes: 0.10,
    preeclampsia: 0.12,
    miscarriage: 0.20,
    prematureBirth: 0.15,
    cSectionRate: 0.10,
    pregnancyDeathRate: 0.0002,
  },
  Fragile: {
    gestationalDiabetes: 0.12,
    preeclampsia: 0.15,
    miscarriage: 0.25,
    prematureBirth: 0.20,
    cSectionRate: 0.05,
    pregnancyDeathRate: 0.0005,  // 500 per 100,000 pregnancies!
  },
};

// Infant and child survival by age
const CHILD_SURVIVAL_RATES = {
  Nordic: {
    atBirth: 0.975,         // 97.5% survive birth and first week
    first28Days: 0.997,     // 99.7% survive first month
    first1Year: 0.9975,     // 99.75% survival first year (2.5 per 1000 infant mortality)
    first5Years: 0.999,     // 99.9% survival by age 5 (1 per 1000 childhood mortality)
  },
  Developed: {
    atBirth: 0.97,
    first28Days: 0.995,
    first1Year: 0.995,      // ~5 per 1000 infant mortality
    first5Years: 0.998,     // ~3 per 1000 childhood mortality
  },
  Emerging: {
    atBirth: 0.95,
    first28Days: 0.985,
    first1Year: 0.975,      // ~25 per 1000 infant mortality
    first5Years: 0.990,     // ~35 per 1000 childhood mortality
  },
  Developing: {
    atBirth: 0.92,
    first28Days: 0.97,
    first1Year: 0.94,       // ~60 per 1000 infant mortality
    first5Years: 0.96,      // ~100 per 1000 childhood mortality
  },
  Fragile: {
    atBirth: 0.88,
    first28Days: 0.93,
    first1Year: 0.88,       // ~120 per 1000 infant mortality
    first5Years: 0.85,      // ~150+ per 1000 childhood mortality
  },
};

// Causes of childhood death by region and age
const CHILDHOOD_DEATH_CAUSES = {
  Nordic: {
    "0-1mo": {
      prematurity: 0.30,
      birthDefects: 0.25,
      infection: 0.15,
      asphyxia: 0.20,
      other: 0.10,
    },
    "1-12mo": {
      infection: 0.35,
      accident: 0.20,
      prematurity: 0.15,
      birthDefects: 0.15,
      sids: 0.10,
      other: 0.05,
    },
    "1-5y": {
      accident: 0.45,
      infection: 0.25,
      malignancy: 0.10,
      birthDefects: 0.10,
      other: 0.10,
    },
  },
  Fragile: {
    "0-1mo": {
      prematurity: 0.20,
      birthDefects: 0.10,
      infection: 0.40,
      asphyxia: 0.15,
      other: 0.15,
    },
    "1-12mo": {
      infection: 0.50,
      malnutrition: 0.15,
      prematurity: 0.10,
      birthDefects: 0.10,
      diarrheal: 0.10,
      other: 0.05,
    },
    "1-5y": {
      infection: 0.35,
      malnutrition: 0.25,
      accident: 0.15,
      diarrheal: 0.15,
      malaria: 0.05,
      other: 0.05,
    },
  },
};

/**
 * Get fertility probability for a woman of given age in region
 * Takes into account contraceptive use
 * @param {number} age
 * @param {string} region
 * @param {boolean} usingContraception
 * @returns {number} Probability 0-1 of conceiving this year
 */
function getFertilityProbability(age, region, usingContraception = true) {
  const fertilities = FERTILITY_BY_AGE_REGION[region] || FERTILITY_BY_AGE_REGION.Developing;
  
  let ageGroup;
  if (age < 20) ageGroup = "15-19";
  else if (age < 25) ageGroup = "20-24";
  else if (age < 30) ageGroup = "25-29";
  else if (age < 35) ageGroup = "30-34";
  else if (age < 40) ageGroup = "35-39";
  else if (age < 45) ageGroup = "40-44";
  else ageGroup = "45-49";
  
  let baseFertility = fertilities[ageGroup] || 0;
  
  if (usingContraception) {
    const contraception = CONTRACEPTION_BY_REGION[region] || CONTRACEPTION_BY_REGION.Developing;
    const effectiveness = contraception.effectiveness;
    baseFertility = baseFertility * (1 - effectiveness);
  }
  
  return Math.min(1, baseFertility);
}

/**
 * Check if pregnancy complications occur
 * @param {string} region
 * @returns {object} {hasComplications: boolean, complications: [list]}
 */
function generatePregnancyComplications(region) {
  const complications = PREGNANCY_COMPLICATIONS[region] || PREGNANCY_COMPLICATIONS.Developing;
  const hasComplications = {
    gestationalDiabetes: Math.random() < complications.gestationalDiabetes,
    preeclampsia: Math.random() < complications.preeclampsia,
    prematureBirth: Math.random() < complications.prematureBirth,
    cSectionNeeded: Math.random() < complications.cSectionRate,
  };
  
  const list = Object.entries(hasComplications)
    .filter(([key, val]) => val)
    .map(([key]) => key);
  
  return {
    hasComplications: list.length > 0,
    complications: list,
    maternalDeathRisk: complications.pregnancyDeathRate,
  };
}

/**
 * Check if infant/child survives given their age and region
 * @param {number} ageInMonths
 * @param {string} region
 * @param {object} conditions - {premature: bool, lowBirthWeight: bool, infection: bool}
 * @returns {boolean} Alive or dead
 */
function childSurvivesMonth(ageInMonths, region, conditions = {}) {
  const survival = CHILD_SURVIVAL_RATES[region] || CHILD_SURVIVAL_RATES.Developing;
  
  let survivalRate = 0.99; // Base: 99% survive any given month
  
  if (ageInMonths === 0) {
    survivalRate = survival.atBirth;
  } else if (ageInMonths <= 1) {
    survivalRate = survival.first28Days;
  } else if (ageInMonths <= 12) {
    survivalRate = 0.9975; // Approximate linear over first year
  } else if (ageInMonths <= 60) {
    survivalRate = 0.998; // Very safe after first year
  } else {
    survivalRate = 0.9995; // Older children very safe
  }
  
  // Apply risk modifiers
  if (conditions.premature) survivalRate *= 0.85;
  if (conditions.lowBirthWeight) survivalRate *= 0.90;
  if (conditions.infection) survivalRate *= 0.70;
  
  return Math.random() < survivalRate;
}

/**
 * Get cause of death for deceased child
 * @param {number} ageInMonths
 * @param {string} region
 * @returns {string} Cause of death
 */
function getChildDeathCause(ageInMonths, region) {
  let ageGroup;
  if (ageInMonths <= 1) ageGroup = "0-1mo";
  else if (ageInMonths <= 12) ageGroup = "1-12mo";
  else ageGroup = "1-5y";
  
  const causes = CHILDHOOD_DEATH_CAUSES[region]?.[ageGroup] ||
    CHILDHOOD_DEATH_CAUSES.Developing[ageGroup];
  
  const roll = Math.random();
  let cumulative = 0;
  
  for (const [cause, probability] of Object.entries(causes)) {
    cumulative += probability;
    if (roll < cumulative) return cause;
  }
  
  return "other";
}

module.exports = {
  FERTILITY_BY_AGE_REGION,
  CONTRACEPTION_BY_REGION,
  PREGNANCY_COMPLICATIONS,
  CHILD_SURVIVAL_RATES,
  CHILDHOOD_DEATH_CAUSES,
  getFertilityProbability,
  generatePregnancyComplications,
  childSurvivesMonth,
  getChildDeathCause,
};
