/**
 * Retirement System
 * 
 * Models retirement decisions and post-work income based on:
 * - Regional retirement age norms (Nordic 65, developing countries often work until death)
 * - Accumulated wealth/savings
 * - Social safety net (pensions, benefits)
 * - Health status (disability forcing early retirement)
 * - Class stratification (rich retire early comfortably, poor work longer or retire in poverty)
 * 
 * Retirement Income Sources:
 * 1. Employment income (if still working)
 * 2. Pension income (from accumulated wealth + regional pension systems)
 * 3. Benefit income (unemployment, disability, old-age welfare)
 * 
 * Key Variables:
 * - retirementAge: When they stopped working (null if still working)
 * - canAffordRetirement: Boolean based on wealth threshold
 * - retirementStandard: "comfortable" | "adequate" | "struggling" | "poverty"
 */

// Regional retirement age norms (when people typically retire if they can afford it)
const RETIREMENT_AGE_BY_REGION = {
  Nordic: {
    standard: 65,      // Official retirement age
    early: 60,         // Can retire early if wealthy
    late: 70,          // Some work past retirement age
    pension: true,     // Has state pension system
    pensionRate: 0.60  // Pension = 60% of average lifetime income
  },
  Developed: {
    standard: 65,
    early: 62,
    late: 70,
    pension: true,
    pensionRate: 0.50
  },
  Emerging: {
    standard: 60,
    early: 55,
    late: 70,
    pension: true,
    pensionRate: 0.30  // Weak pension system
  },
  Developing: {
    standard: null,    // No formal retirement age - work until unable
    early: null,
    late: null,
    pension: false,
    pensionRate: 0.10  // Minimal/no state pension
  },
  Fragile: {
    standard: null,
    early: null,
    late: null,
    pension: false,
    pensionRate: 0.0
  }
};

// Wealth thresholds for retirement (how much accumulated wealth needed to retire comfortably)
const RETIREMENT_WEALTH_THRESHOLDS = {
  Nordic: {
    comfortable: 800,  // Can maintain good standard of living
    adequate: 400,     // Can get by with pension
    minimal: 200,      // Can barely afford, relying heavily on pension
    // Below minimal = keep working or live in poverty
  },
  Developed: {
    comfortable: 1000,
    adequate: 500,
    minimal: 250
  },
  Emerging: {
    comfortable: 600,
    adequate: 300,
    minimal: 150
  },
  Developing: {
    comfortable: 400,
    adequate: 200,
    minimal: 50   // Very low bar, most never retire
  },
  Fragile: {
    comfortable: 300,
    adequate: 100,
    minimal: 25
  }
};

// Retirement living standards based on income thresholds
// Calibrated from actual retirement income distributions (median Nordic ~140)
// Standards based on relative position in income distribution:
// - Comfortable: Top 50% (above median)
// - Adequate: 60-80th percentile  
// - Struggling: 40-60th percentile
// - Poverty: Bottom 40%
const RETIREMENT_LIVING_COSTS = {
  Nordic: {
    comfortable: 112,  // Median retirement income (~50% will achieve)
    adequate: 67,      // 60% of median (can live decently)
    struggling: 30,    // 27% of median (making ends meet, but not destitute)
    poverty: 30        // Below 27% of median (severe hardship - very rare in Nordic)
  },
  Developed: {
    comfortable: 100,
    adequate: 60,
    struggling: 40,
    poverty: 40
  },
  Emerging: {
    comfortable: 70,
    adequate: 45,
    struggling: 30,
    poverty: 30
  },
  Developing: {
    comfortable: 40,
    adequate: 25,
    struggling: 15,
    poverty: 15
  },
  Fragile: {
    comfortable: 25,
    adequate: 15,
    struggling: 8,
    poverty: 8
  }
};

/**
 * Calculate if person can afford to retire
 * @param {object} player - Player object
 * @param {string} region - Mapped region (Nordic, Developed, etc.)
 * @returns {object} {canAfford, standard, wealthLevel}
 */
function canAffordRetirement(player, region) {
  const wealth = player.economics?.resources?.current || 0;
  const thresholds = RETIREMENT_WEALTH_THRESHOLDS[region] || RETIREMENT_WEALTH_THRESHOLDS.Developing;
  
  if (wealth >= thresholds.comfortable) {
    return { canAfford: true, standard: 'comfortable', wealthLevel: 'high' };
  } else if (wealth >= thresholds.adequate) {
    return { canAfford: true, standard: 'adequate', wealthLevel: 'middle' };
  } else if (wealth >= thresholds.minimal) {
    return { canAfford: true, standard: 'struggling', wealthLevel: 'low' };
  } else {
    return { canAfford: false, standard: 'poverty', wealthLevel: 'none' };
  }
}

/**
 * Decide if person should retire this year
 * @param {object} player
 * @param {string} region
 * @returns {boolean}
 */
function shouldRetire(player, region) {
  const age = player.demographics.age;
  const retirementAges = RETIREMENT_AGE_BY_REGION[region] || RETIREMENT_AGE_BY_REGION.Developing;
  
  // Already retired
  if (player.economics?.retirement?.isRetired) return false;
  
  // No formal retirement in developing/fragile states - work until unable
  if (!retirementAges.standard) {
    // Only "retire" if health too poor to work
    const physicalHealth = player.health?.physical?.current || 100;
    const mentalHealth = player.health?.mental?.current || 100;
    if (physicalHealth < 40 || mentalHealth < 30) {
      return true; // Forced retirement due to disability
    }
    return false; // Otherwise keep working
  }
  
  const affordability = canAffordRetirement(player, region);
  const wealth = player.economics?.resources?.current || 0;
  
  // Rich can retire early
  if (age >= retirementAges.early && affordability.wealthLevel === 'high') {
    return Math.random() < 0.20; // 20% chance per year to retire early
  }
  
  // Standard retirement age
  if (age >= retirementAges.standard) {
    if (affordability.canAfford) {
      return Math.random() < 0.40; // 40% chance per year to retire at normal age
    } else {
      // Can't afford - keep working if possible
      return Math.random() < 0.05; // 5% chance to retire into poverty
    }
  }
  
  // Poor health forces retirement
  const physicalHealth = player.health?.physical?.current || 100;
  if (age >= 55 && physicalHealth < 50) {
    return Math.random() < 0.30; // 30% chance to retire on disability
  }
  
  return false;
}

/**
 * Calculate retirement income from all sources
 * @param {object} player
 * @param {string} region
 * @returns {object} {total, employment, pension, benefits, breakdown}
 */
function calculateRetirementIncome(player, region) {
  const age = player.demographics.age;
  const isRetired = player.economics?.retirement?.isRetired || false;
  const wealth = player.economics?.resources?.current || 0;
  const employed = player.economics?.income?.employed || false;
  
  const retirementData = RETIREMENT_AGE_BY_REGION[region] || RETIREMENT_AGE_BY_REGION.Developing;
  
  let employmentIncome = 0;
  let pensionIncome = 0;
  let benefitIncome = 0;
  
  // 1. EMPLOYMENT INCOME (if still working)
  if (employed && !isRetired) {
    employmentIncome = player.economics?.income?.current || 0;
  }
  
  // 2. PENSION INCOME (if retired and region has pensions)
  if (isRetired && retirementData.pension && age >= (retirementData.standard || 65)) {
    // State pension based on lifetime earnings (stored in retirement object)
    const lifetimeAvgIncome = player.economics?.retirement?.lifetimeAvgIncome || 30;
    const statePension = lifetimeAvgIncome * retirementData.pensionRate;
    
    // Private pension from accumulated wealth (4% annual drawdown rule)
    const wealthPension = wealth * 0.04;
    
    pensionIncome = statePension + wealthPension;
  }
  
  // 3. BENEFIT INCOME (unemployment, disability, old-age welfare)
  if (!employed) {
    if (region === 'Nordic' || region === 'Developed') {
      // Generous welfare state
      if (isRetired && age >= 65) {
        // Old-age basic income (minimum pension)
        benefitIncome = region === 'Nordic' ? 15 : 12;
      } else {
        // Unemployment/disability benefits
        benefitIncome = region === 'Nordic' ? 10 : 8;
      }
    } else if (region === 'Emerging') {
      // Minimal safety net
      benefitIncome = isRetired ? 5 : 3;
    } else {
      // Developing/Fragile - little to no safety net
      benefitIncome = 0;
    }
  }
  
  const totalIncome = employmentIncome + pensionIncome + benefitIncome;
  
  return {
    total: totalIncome,
    employment: employmentIncome,
    pension: pensionIncome,
    benefits: benefitIncome,
    breakdown: {
      employmentPercent: totalIncome > 0 ? (employmentIncome / totalIncome * 100) : 0,
      pensionPercent: totalIncome > 0 ? (pensionIncome / totalIncome * 100) : 0,
      benefitsPercent: totalIncome > 0 ? (benefitIncome / totalIncome * 100) : 0
    }
  };
}

/**
 * Determine retirement standard of living
 * @param {object} player
 * @param {string} region
 * @param {number} retirementIncome
 * @returns {string} "comfortable" | "adequate" | "struggling" | "poverty"
 */
function getRetirementStandard(player, region, retirementIncome) {
  const costs = RETIREMENT_LIVING_COSTS[region] || RETIREMENT_LIVING_COSTS.Developing;
  
  if (retirementIncome >= costs.comfortable) {
    return 'comfortable';
  } else if (retirementIncome >= costs.adequate) {
    return 'adequate';
  } else if (retirementIncome >= costs.struggling) {
    return 'struggling';
  } else {
    return 'poverty';
  }
}

/**
 * Process retirement transition and update player state
 * @param {object} player
 * @param {string} region
 */
function processRetirement(player, region) {
  const age = player.demographics.age;
  
  // Initialize retirement tracking if needed
  if (!player.economics.retirement) {
    player.economics.retirement = {
      isRetired: false,
      retirementAge: null,
      lifetimeAvgIncome: 0,
      lifetimeWorkYears: 0,
      retirementStandard: null
    };
  }
  
  // Track lifetime income for pension calculation
  if (player.economics?.income?.employed && !player.economics.retirement.isRetired) {
    const currentIncome = player.economics?.income?.current || 0;
    const workYears = player.economics.retirement.lifetimeWorkYears;
    const avgIncome = player.economics.retirement.lifetimeAvgIncome;
    
    // Running average of lifetime income
    player.economics.retirement.lifetimeAvgIncome = 
      (avgIncome * workYears + currentIncome) / (workYears + 1);
    player.economics.retirement.lifetimeWorkYears++;
  }
  
  // Check if should retire this year
  if (!player.economics.retirement.isRetired && shouldRetire(player, region)) {
    player.economics.retirement.isRetired = true;
    player.economics.retirement.retirementAge = age;
    player.economics.income.employed = false;
  }
  
  // Calculate retirement income from all sources
  const incomeData = calculateRetirementIncome(player, region);
  
  // Update player's income to reflect retirement sources
  player.economics.income.current = incomeData.total;
  player.economics.income.employmentIncome = incomeData.employment;
  player.economics.income.pensionIncome = incomeData.pension;
  player.economics.income.benefitIncome = incomeData.benefits;
  
  // Determine standard of living
  if (player.economics.retirement.isRetired) {
    player.economics.retirement.retirementStandard = 
      getRetirementStandard(player, region, incomeData.total);
  }
}

module.exports = {
  RETIREMENT_AGE_BY_REGION,
  RETIREMENT_WEALTH_THRESHOLDS,
  RETIREMENT_LIVING_COSTS,
  canAffordRetirement,
  shouldRetire,
  calculateRetirementIncome,
  getRetirementStandard,
  processRetirement
};
