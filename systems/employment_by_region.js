/**
 * Employment rates by age, gender, and region
 * Based on Eurostat and OECD data
 * 
 * Employment rates represent % of population that is employed
 * We use this to determine if someone should be employed based on their age/gender
 */

const EMPLOYMENT_RATES = {
  // Nordic: Very high employment rates across all demographics
  Nordic: {
    Female: {
      '15-24': 0.55,  // Youth: ~55% employed (many in school)
      '25-34': 0.82,  // Young adults: ~82%
      '35-49': 0.85,  // Prime working age: ~85%
      '50-64': 0.78,  // Pre-retirement: ~78%
      '65+': 0.10,    // Retired: ~10%
    },
    Male: {
      '15-24': 0.58,
      '25-34': 0.88,
      '35-49': 0.90,
      '50-64': 0.82,
      '65+': 0.12,
    },
  },
  // Developed countries
  Developed: {
    Female: {
      '15-24': 0.48,
      '25-34': 0.75,
      '35-49': 0.78,
      '50-64': 0.70,
      '65+': 0.08,
    },
    Male: {
      '15-24': 0.52,
      '25-34': 0.85,
      '35-49': 0.88,
      '50-64': 0.80,
      '65+': 0.10,
    },
  },
  // Emerging markets
  Emerging: {
    Female: {
      '15-24': 0.35,
      '25-34': 0.55,
      '35-49': 0.58,
      '50-64': 0.48,
      '65+': 0.15,
    },
    Male: {
      '15-24': 0.42,
      '25-34': 0.75,
      '35-49': 0.80,
      '50-64': 0.70,
      '65+': 0.20,
    },
  },
  // Developing countries
  Developing: {
    Female: {
      '15-24': 0.25,
      '25-34': 0.35,
      '35-49': 0.38,
      '50-64': 0.28,
      '65+': 0.10,
    },
    Male: {
      '15-24': 0.45,
      '25-34': 0.70,
      '35-49': 0.75,
      '50-64': 0.60,
      '65+': 0.15,
    },
  },
  // Fragile states
  Fragile: {
    Female: {
      '15-24': 0.15,
      '25-34': 0.20,
      '35-49': 0.22,
      '50-64': 0.15,
      '65+': 0.05,
    },
    Male: {
      '15-24': 0.35,
      '25-34': 0.55,
      '35-49': 0.60,
      '50-64': 0.45,
      '65+': 0.10,
    },
  },
};

/**
 * Get employment probability for a person based on age, gender, and region
 * @param {number} age - Person's age
 * @param {string} gender - 'M' or 'F'
 * @param {string} region - Region key (Nordic, Developed, etc.)
 * @returns {number} Probability (0-1) that person should be employed
 */
function getEmploymentProbability(age, gender, region) {
  if (age < 15) return 0;      // Children don't work
  if (age >= 75) return 0.02;  // Very few work past 75 (use base rate)

  const regionData = EMPLOYMENT_RATES[region] || EMPLOYMENT_RATES.Developing;
  const genderData = regionData[gender] || regionData.Male;

  let ageGroup;
  if (age < 25) ageGroup = '15-24';
  else if (age < 35) ageGroup = '25-34';
  else if (age < 50) ageGroup = '35-49';
  else if (age < 65) ageGroup = '50-64';
  else ageGroup = '65+';

  return genderData[ageGroup] || 0;
}

/**
 * Should this person be employed? (probabilistic determination)
 * @param {number} age
 * @param {string} gender
 * @param {string} region
 * @returns {boolean}
 */
function shouldBeEmployed(age, gender, region) {
  const probability = getEmploymentProbability(age, gender, region);
  return Math.random() < probability;
}

/**
 * Get unemployment duration penalty (affects mental health, crime risk)
 * @param {number} monthsUnemployed - How long person has been unemployed
 * @returns {number} Severity factor (1.0 = baseline)
 */
function getUnemploymentPenalty(monthsUnemployed) {
  if (monthsUnemployed < 3) return 1.0;
  if (monthsUnemployed < 6) return 1.2;
  if (monthsUnemployed < 12) return 1.5;
  if (monthsUnemployed < 24) return 1.8;
  return 2.0; // Long-term unemployment
}

module.exports = {
  EMPLOYMENT_RATES,
  getEmploymentProbability,
  shouldBeEmployed,
  getUnemploymentPenalty,
};
