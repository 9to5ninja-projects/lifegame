/**
 * Education System
 * 
 * Models education progression, costs, and impact on:
 * - Employment opportunities (tier 1-5)
 * - Lifetime earnings potential
 * - Stress levels (school can be stressful, but education reduces future stress)
 * - Regional access and costs
 * 
 * Education stages:
 * - Preschool (0-5): Optional, affects early development
 * - Primary (6-11): Universal in Nordic/Developed, limited in Fragile
 * - Secondary (12-17): High school, increasing specialization
 * - Tertiary (18+): College/university, vocational training
 */

const EDUCATION_STAGES = {
  preschool: { ages: [0, 5], description: "Preschool" },
  primary: { ages: [6, 11], description: "Primary School" },
  secondary: { ages: [12, 17], description: "Secondary School" },
  tertiary: { ages: [18, 25], description: "Tertiary Education" },
};

// Annual costs per student by region and education stage
const EDUCATION_COSTS_BY_REGION = {
  Nordic: {
    preschool: 0.05,      // Public daycare heavily subsidized
    primary: 0.0,         // Free public school
    secondary: 0.0,       // Free public school
    tertiary: 0.02,       // Heavily subsidized university
  },
  Developed: {
    preschool: 0.15,      // Private daycare expensive
    primary: 0.03,        // Mix of public (free) and private
    secondary: 0.05,      // Public mostly free, private expensive
    tertiary: 0.15,       // University tuition moderate
  },
  Emerging: {
    preschool: 0.08,
    primary: 0.05,        // Some fees even for public school
    secondary: 0.10,      // Secondary school fees increase
    tertiary: 0.25,       // University quite expensive
  },
  Developing: {
    preschool: 0.03,      // Minimal daycare access
    primary: 0.08,        // School fees, uniforms, books
    secondary: 0.15,      // Many drop out due to cost
    tertiary: 0.50,       // Tertiary extremely expensive/rare
  },
  Fragile: {
    preschool: 0.01,      // Minimal access
    primary: 0.10,        // School fees, very limited
    secondary: 0.20,      // Most don't attend
    tertiary: 0.80,       // University rare, very expensive
  },
};

// Attendance rates by region and stage (what % actually attend?)
const ATTENDANCE_RATES = {
  Nordic: {
    preschool: 0.95,      // Most use daycare/preschool
    primary: 0.99,        // Compulsory
    secondary: 0.98,      // Compulsory
    tertiary: 0.65,       // ~65% go to university
  },
  Developed: {
    preschool: 0.80,
    primary: 0.98,        // Mostly compulsory
    secondary: 0.95,      // Most attend
    tertiary: 0.60,
  },
  Emerging: {
    preschool: 0.40,
    primary: 0.90,
    secondary: 0.75,      // Many drop out
    tertiary: 0.35,
  },
  Developing: {
    preschool: 0.10,
    primary: 0.70,        // Many don't complete primary
    secondary: 0.40,      // Most don't attend
    tertiary: 0.08,
  },
  Fragile: {
    preschool: 0.02,
    primary: 0.50,        // Many don't attend or drop out
    secondary: 0.15,
    tertiary: 0.02,
  },
};

// Completion rates (given attendance, what % finish the stage?)
const COMPLETION_RATES = {
  Nordic: {
    primary: 0.99,
    secondary: 0.97,
    tertiary: 0.90,       // 90% of tertiary students complete
  },
  Developed: {
    primary: 0.98,
    secondary: 0.92,
    tertiary: 0.85,
  },
  Emerging: {
    primary: 0.80,
    secondary: 0.70,
    tertiary: 0.75,       // Those who start often complete
  },
  Developing: {
    primary: 0.60,
    secondary: 0.50,
    tertiary: 0.70,
  },
  Fragile: {
    primary: 0.40,
    secondary: 0.30,
    tertiary: 0.60,
  },
};

// Employment tier mapping by education level
// Tier 1 = Unskilled/informal work
// Tier 2 = Skilled trades, service
// Tier 3 = Clerical, technical
// Tier 4 = Professional, management
// Tier 5 = Highly skilled, specialized
const EMPLOYMENT_TIER_BY_EDUCATION = {
  none: { tier: 1, minWage: 0.1, maxWage: 0.3 },
  primary: { tier: 1, minWage: 0.15, maxWage: 0.4 },
  secondary: { tier: 2, minWage: 0.4, maxWage: 1.0 },
  secondary_vocational: { tier: 2, minWage: 0.45, maxWage: 1.2 },
  tertiary_technical: { tier: 3, minWage: 0.8, maxWage: 1.6 },
  tertiary_bachelor: { tier: 4, minWage: 1.2, maxWage: 2.5 },
  tertiary_advanced: { tier: 5, minWage: 1.8, maxWage: 4.0 },
};

// Stress during education
const EDUCATION_STRESS = {
  preschool: 0,        // Shouldn't cause stress
  primary: 0.5,        // Mild, normal childhood
  secondary: 1.5,      // Moderate - adolescent stress + academics
  tertiary: 2.0,       // Higher stress - exams, future uncertainty, debt risk
};

// Mental health effects of being IN education vs working
// School can be stressful BUT it provides structure, purpose, social connection
// We model net effect as slightly positive (benefits > costs for most)
const EDUCATION_MENTAL_BASELINE_ADJUSTMENT = 2; // +2 to baseline while in school

/**
 * Get current education stage for an age
 * @param {number} age
 * @returns {string} "preschool" | "primary" | "secondary" | "tertiary" | "none"
 */
function getEducationStage(age) {
  if (age >= 0 && age <= 5) return "preschool";
  if (age >= 6 && age <= 11) return "primary";
  if (age >= 12 && age <= 17) return "secondary";
  if (age >= 18 && age <= 25) return "tertiary";
  return "none";
}

/**
 * Get annual education cost for a student
 * @param {number} age
 * @param {string} stage - "preschool" | "primary" | "secondary" | "tertiary"
 * @param {string} region
 * @returns {number} Annual cost in relative units
 */
function getEducationCost(age, stage, region) {
  const regionCosts = EDUCATION_COSTS_BY_REGION[region] || EDUCATION_COSTS_BY_REGION.Developing;
  return regionCosts[stage] || 0;
}

/**
 * Should this person attend education given age, region, family resources?
 * @param {number} age
 * @param {string} region
 * @param {number} familyResources - Available household resources
 * @param {number} educationLevel - Current education level ("none", "primary", "secondary", "tertiary_bachelor", etc.)
 * @returns {object} {shouldAttend, isCompulsory, canAfford}
 */
function shouldAttendEducation(age, region, familyResources, educationLevel) {
  const stage = getEducationStage(age);
  
  if (stage === "none") {
    return { shouldAttend: false, isCompulsory: false, canAfford: false };
  }

  // Check if stage is compulsory
  const isCompulsory = age >= 6 && age <= 16; // Standard compulsory age

  // Get attendance rate for this region/stage
  const attendanceRates = ATTENDANCE_RATES[region] || ATTENDANCE_RATES.Developing;
  const baseAttendanceRate = attendanceRates[stage] || 0;

  // Get cost
  const cost = getEducationCost(age, stage, region);

  // Check affordability
  const canAfford = familyResources >= cost * 2; // Need 2x cost to be "safe"

  // Decision logic
  let shouldAttend = false;

  if (isCompulsory) {
    // Compulsory age: most attend unless family in severe poverty
    shouldAttend = familyResources >= cost || Math.random() < baseAttendanceRate;
  } else {
    // Optional: depends on base rate and affordability
    shouldAttend = Math.random() < baseAttendanceRate && canAfford;
  }

  return {
    shouldAttend,
    isCompulsory,
    canAfford,
    cost,
    baseAttendanceRate,
    stage,
  };
}

/**
 * Determine education tier achieved
 * Based on highest stage completed + additional qualifications
 * @param {object} educationHistory - {stages: [{stage, completed, year}], region}
 * @returns {string} Education tier key
 */
function getEducationTier(educationHistory) {
  if (!educationHistory || !educationHistory.stages) {
    return "none";
  }

  // Work backwards from highest education
  const completed = educationHistory.stages.filter(s => s.completed).map(s => s.stage);

  if (completed.includes("tertiary_advanced")) return "tertiary_advanced";
  if (completed.includes("tertiary_bachelor")) return "tertiary_bachelor";
  if (completed.includes("tertiary_technical")) return "tertiary_technical";
  if (completed.includes("secondary_vocational")) return "secondary_vocational";
  if (completed.includes("secondary")) return "secondary";
  if (completed.includes("primary")) return "primary";

  return "none";
}

/**
 * Get employment tier potential based on education
 * @param {string} educationTier
 * @returns {object} {tier, minWage, maxWage, description}
 */
function getEmploymentTierFromEducation(educationTier) {
  return EMPLOYMENT_TIER_BY_EDUCATION[educationTier] || EMPLOYMENT_TIER_BY_EDUCATION.none;
}

/**
 * Stress/income ratio: as income increases, baseline stress reduces
 * This models that financial security reduces life stress
 * @param {number} income - Annual income
 * @param {number} costs - Annual expenses
 * @returns {number} Stress multiplier (>1 = stressful, <1 = reduces stress)
 */
function getStressFromIncome(income, costs) {
  const ratio = income / costs;

  if (ratio < 0.5) return 2.5;    // Severe stress: can't afford basics
  if (ratio < 0.8) return 1.8;    // High stress: struggling
  if (ratio < 1.0) return 1.2;    // Moderate stress: barely making it
  if (ratio < 1.2) return 1.0;    // Baseline stress
  if (ratio < 1.5) return 0.9;    // Slight relief
  if (ratio < 2.0) return 0.8;    // Comfortable
  if (ratio < 3.0) return 0.7;    // Very comfortable
  return 0.6;                     // Wealthy - low stress
}

module.exports = {
  EDUCATION_STAGES,
  EDUCATION_COSTS_BY_REGION,
  ATTENDANCE_RATES,
  COMPLETION_RATES,
  EMPLOYMENT_TIER_BY_EDUCATION,
  EDUCATION_STRESS,
  EDUCATION_MENTAL_BASELINE_ADJUSTMENT,
  getEducationStage,
  getEducationCost,
  shouldAttendEducation,
  getEducationTier,
  getEmploymentTierFromEducation,
  getStressFromIncome,
};
