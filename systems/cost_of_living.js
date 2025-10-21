/**
 * Cost of Living System
 * 
 * Models annual expenses based on:
 * - Region (Nordic countries very expensive, developing countries cheap)
 * - Family size (more people = more expenses, but some efficiencies)
 * - Age structure (children cost more in education, elderly need healthcare)
 * - Employment status (unemployed people reduce expenses, employed earn income)
 * 
 * Based on IMF, World Bank, and OECD data on PPP-adjusted costs
 */

const REGIONAL_COST_BASE = {
  // Annual cost per person (in relative units, Nordic = 1.0 baseline)
  // These represent purchasing power parity adjusted costs
  Nordic: {
    perPerson: 1.0,      // Most expensive (high taxes, services, salaries)
    description: "Expensive (Nordic social state)",
  },
  Developed: {
    perPerson: 0.9,      // High but slightly less than Nordic
    description: "High cost (developed economies)",
  },
  Emerging: {
    perPerson: 0.4,      // Moderate cost
    description: "Moderate cost (emerging markets)",
  },
  Developing: {
    perPerson: 0.2,      // Low cost
    description: "Low cost (developing countries)",
  },
  Fragile: {
    perPerson: 0.12,     // Lowest cost (subsistence level)
    description: "Very low cost (fragile states)",
  },
};

const FAMILY_STRUCTURE_MULTIPLIERS = {
  // How family size affects per-person costs
  // Economies of scale: 2 people living together cheaper per person than solo
  1: 1.2,      // Single person premium (no economies of scale, fixed costs)
  2: 1.0,      // Couple baseline
  3: 0.95,     // Slight efficiency with 3
  4: 0.90,     // Family of 4 more efficient
  5: 0.85,     // Larger family even more efficient
  6: 0.80,     // Extended family very efficient
};

const AGE_COST_MULTIPLIERS = {
  // Different age groups have different costs relative to baseline
  // Childhood 0-5: Daycare, formula, clothing
  "0-5": { baseFactor: 0.7, category: "childhood" },
  // Childhood 6-11: School, food, activities
  "6-11": { baseFactor: 0.8, category: "childhood" },
  // Adolescence 12-17: School, food, higher activity costs
  "12-17": { baseFactor: 1.0, category: "youth" },
  // Young Adult 18-25: Education, establishing independence
  "18-25": { baseFactor: 1.1, category: "adult" },
  // Prime Working Age 26-50: Peak earning, peak expenses
  "26-50": { baseFactor: 1.2, category: "adult" },
  // Pre-Retirement 51-64: Healthcare, declining income potential
  "51-64": { baseFactor: 1.1, category: "adult" },
  // Elderly 65+: Healthcare heavy, reduced food/activity
  "65+": { baseFactor: 1.3, category: "elderly" },
};

const EMPLOYMENT_INCOME_BY_REGION = {
  // Annual income for employed person by region (in relative units)
  Nordic: {
    perYear: 2.0,        // Nordic employed earns 2x the regional cost base
    description: "High wages",
  },
  Developed: {
    perYear: 1.8,
    description: "High wages",
  },
  Emerging: {
    perYear: 0.8,        // Emerging market wages are modest
    description: "Moderate wages",
  },
  Developing: {
    perYear: 0.25,       // Very low wages, high poverty
    description: "Low wages",
  },
  Fragile: {
    perYear: 0.08,       // Subsistence wages
    description: "Subsistence wages",
  },
};

const SOCIAL_BENEFITS_BY_REGION = {
  // Government support, reduced from income to get net resources
  // Nordic: High welfare, significant child benefits, unemployment insurance
  // Developing: Minimal or no safety net
  Nordic: {
    childBenefit: 0.20,           // Per child per year (~20% of cost base - generous Nordic model)
    unemploymentSupport: 0.60,    // If unemployed (welfare covers ~60% of baseline living)
    pensionAge: 67,
    pensionAmount: 1.2,           // Close to living wage (mature Nordic pensions)
  },
  Developed: {
    childBenefit: 0.10,
    unemploymentSupport: 0.35,
    pensionAge: 65,
    pensionAmount: 0.9,
  },
  Emerging: {
    childBenefit: 0.03,
    unemploymentSupport: 0.08,
    pensionAge: 65,
    pensionAmount: 0.35,
  },
  Developing: {
    childBenefit: 0.01,
    unemploymentSupport: 0.02,
    pensionAge: 60,
    pensionAmount: 0.08,
  },
  Fragile: {
    childBenefit: 0.00,
    unemploymentSupport: 0.00,
    pensionAge: 55,
    pensionAmount: 0.02,
  },
};

/**
 * Calculate annual cost of living for a household
 * @param {Array} household - Array of {age, employed} representing family members
 * @param {string} region - Region name (Nordic, Developed, etc.)
 * @returns {number} Annual cost in relative units
 */
function calculateHouseholdCost(household, region) {
  if (!household || household.length === 0) return 0;

  const regionData = REGIONAL_COST_BASE[region] || REGIONAL_COST_BASE.Developing;
  const familySize = household.length;
  const sizeMultiplier = FAMILY_STRUCTURE_MULTIPLIERS[familySize] || 0.75;

  let totalCost = 0;

  for (const member of household) {
    const age = member.age || 0;
    const ageMultiplier = getAgeCostMultiplier(age);
    const perPersonCost = regionData.perPerson * sizeMultiplier * ageMultiplier;
    totalCost += perPersonCost;
  }

  return totalCost;
}

/**
 * Calculate net annual income for a household (earnings - taxes/deductions)
 * @param {Array} household - Array of {age, employed, isRetired}
 * @param {string} region
 * @returns {number} Net annual income in relative units
 */
function calculateHouseholdIncome(household, region) {
  if (!household || household.length === 0) return 0;

  const regionIncome = EMPLOYMENT_INCOME_BY_REGION[region] || EMPLOYMENT_INCOME_BY_REGION.Developing;
  const regionBenefits = SOCIAL_BENEFITS_BY_REGION[region];
  let totalIncome = 0;

  for (const member of household) {
    if (member.isRetired && member.age >= regionBenefits.pensionAge) {
      // Pension income
      totalIncome += regionBenefits.pensionAmount;
    } else if (member.employed) {
      // Employment income
      totalIncome += regionIncome.perYear;
    } else if (member.age >= 18) {
      // Unemployed adult - may receive unemployment benefit
      totalIncome += regionBenefits.unemploymentSupport;
    }
    // Children don't work, don't receive unemployment
  }

  // Child benefits (per child)
  const childCount = household.filter((m) => m.age < 18).length;
  totalIncome += childCount * regionBenefits.childBenefit;

  return totalIncome;
}

/**
 * Calculate annual surplus/deficit for a household
 * Positive = saving, negative = accumulating debt
 * @param {Array} household
 * @param {string} region
 * @returns {number} Annual cash flow
 */
function calculateHouseholdCashFlow(household, region) {
  const income = calculateHouseholdIncome(household, region);
  const cost = calculateHouseholdCost(household, region);
  return income - cost;
}

/**
 * Get age-based cost multiplier
 * @param {number} age
 * @returns {number} Cost multiplier for this age
 */
function getAgeCostMultiplier(age) {
  if (age < 6) return AGE_COST_MULTIPLIERS["0-5"].baseFactor;
  if (age < 12) return AGE_COST_MULTIPLIERS["6-11"].baseFactor;
  if (age < 18) return AGE_COST_MULTIPLIERS["12-17"].baseFactor;
  if (age < 26) return AGE_COST_MULTIPLIERS["18-25"].baseFactor;
  if (age < 51) return AGE_COST_MULTIPLIERS["26-50"].baseFactor;
  if (age < 65) return AGE_COST_MULTIPLIERS["51-64"].baseFactor;
  return AGE_COST_MULTIPLIERS["65+"].baseFactor;
}

/**
 * Get category description for age group
 * @param {number} age
 * @returns {string}
 */
function getAgeCategory(age) {
  if (age < 6) return "Childhood (0-5)";
  if (age < 12) return "Childhood (6-11)";
  if (age < 18) return "Adolescence (12-17)";
  if (age < 26) return "Young Adult (18-25)";
  if (age < 51) return "Prime Working (26-50)";
  if (age < 65) return "Pre-Retirement (51-64)";
  return "Elderly (65+)";
}

/**
 * Determine poverty status based on resources
 * @param {number} resources - Current resources/savings
 * @param {number} annualCost - Annual household cost
 * @param {string} region
 * @returns {object} {isPoor, category, monthsOfSavings}
 */
function getPovertyStatus(resources, annualCost, region) {
  const monthsOfSavings = annualCost > 0 ? resources / (annualCost / 12) : 999;

  return {
    isPoor: resources < annualCost * 0.5, // Less than 6 months expenses
    isDestitute: resources < annualCost * 0.1, // Less than 1 month expenses
    monthsOfSavings: monthsOfSavings,
    category:
      monthsOfSavings < 0.5
        ? "Destitute"
        : monthsOfSavings < 3
          ? "Very Poor"
          : monthsOfSavings < 6
            ? "Poor"
            : monthsOfSavings < 12
              ? "Lower Class"
              : "Stable",
  };
}

module.exports = {
  REGIONAL_COST_BASE,
  FAMILY_STRUCTURE_MULTIPLIERS,
  AGE_COST_MULTIPLIERS,
  EMPLOYMENT_INCOME_BY_REGION,
  SOCIAL_BENEFITS_BY_REGION,
  calculateHouseholdCost,
  calculateHouseholdIncome,
  calculateHouseholdCashFlow,
  getAgeCostMultiplier,
  getAgeCategory,
  getPovertyStatus,
};
