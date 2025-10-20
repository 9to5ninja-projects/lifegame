/**
 * HOUSING SYSTEM
 * 
 * Models housing quality and its effects on:
 * - Physical health (overcrowding, sanitation, safety)
 * - Mental health (stability, privacy, comfort)
 * - Social connections (community, isolation risk)
 * - Economic burden (rent/mortgage vs income)
 * - Child development (education outcomes)
 * 
 * Integrates with:
 * - Economics: income determines affordability
 * - Relationships: housing affects social integration
 * - Health: housing conditions affect baselines
 * - Education: stable housing improves school outcomes
 */

class HousingSystem {
  constructor() {
    this.HOUSING_TYPES = {
      homeless: {
        cost: 0,
        physicalHealthMod: -15,
        mentalHealthMod: -20,
        socialIsolationRisk: 0.8,
        safetyConcern: 0.9,
        description: 'No permanent shelter'
      },
      shelter: {
        cost: 0,
        physicalHealthMod: -5,
        mentalHealthMod: -10,
        socialIsolationRisk: 0.6,
        safetyConcern: 0.5,
        description: 'Emergency/temporary shelter'
      },
      overcrowded: {
        cost: 15,
        physicalHealthMod: -8,
        mentalHealthMod: -5,
        socialIsolationRisk: 0.2,
        safetyConcern: 0.3,
        description: 'Shared space, many occupants per room'
      },
      basic_rental: {
        cost: 25,
        physicalHealthMod: 0,
        mentalHealthMod: 0,
        socialIsolationRisk: 0.1,
        safetyConcern: 0.2,
        description: 'Basic apartment/house rental'
      },
      quality_rental: {
        cost: 40,
        physicalHealthMod: 2,
        mentalHealthMod: 3,
        socialIsolationRisk: 0.05,
        safetyConcern: 0.1,
        description: 'Quality rental with amenities'
      },
      owned_home: {
        cost: 35,
        physicalHealthMod: 5,
        mentalHealthMod: 8,
        socialIsolationRisk: 0.03,
        safetyConcern: 0.05,
        description: 'Owned home with stability'
      },
      owned_quality: {
        cost: 50,
        physicalHealthMod: 8,
        mentalHealthMod: 12,
        socialIsolationRisk: 0.01,
        safetyConcern: 0.02,
        description: 'High-quality owned property'
      }
    };
  }

  /**
   * Process housing dynamics for one year
   * Called from processYearEnd()
   */
  processYearlyHousing(player) {
    // Initialize housing if needed (for backwards compatibility)
    if (!player.housing) {
      player.housing = {
        status: 'basic_rental',
        cost: 0,
        ownership: false,
        instability: false
      };
    }
    if (!player.housing.cost) {
      player.housing.cost = 0;
    }
    if (!this.HOUSING_TYPES[player.housing.status]) {
      // Convert old status to new system
      if (player.housing.status === 'homeless') {
        player.housing.status = 'homeless';
      } else if (player.housing.ownership) {
        player.housing.status = 'owned_home';
      } else {
        player.housing.status = 'basic_rental';
      }
    }
    
    // Determine affordable housing based on income
    this.updateHousingAffordability(player);
    
    // Apply housing effects to health and social
    this.applyHousingEffects(player);
    
    // Check for housing instability (eviction, foreclosure)
    this.checkHousingStability(player);
    
    // Home ownership opportunities
    if (player.demographics.age >= 25) {
      this.checkHomeOwnership(player);
    }
  }

  /**
   * Determine what housing player can afford
   */
  updateHousingAffordability(player) {
    const income = player.economics.income.current || 0;
    const resources = player.economics.resources.current || 0;
    const age = player.demographics.age;
    
    // Children live with parents
    if (age < 18) {
      // Inherit parent housing quality (estimate from birth region)
      const birthRegion = player.demographics.birthRegion || 'Unknown';
      
      if (birthRegion.includes('Nordic') || birthRegion.includes('North America - High')) {
        player.housing.status = 'quality_rental';
      } else if (birthRegion.includes('Middle Class') || birthRegion.includes('Europe')) {
        player.housing.status = 'basic_rental';
      } else if (birthRegion.includes('Sub-Saharan') || birthRegion.includes('War Zone')) {
        player.housing.status = Math.random() < 0.7 ? 'overcrowded' : 'shelter';
      } else {
        player.housing.status = 'basic_rental';
      }
      player.housing.cost = 0; // Parents pay
      return;
    }
    
    // Adults choose housing based on affordability
    // Rule: housing should be <40% of income
    const affordableHousingCost = income * 0.4;
    
    let housingType = 'homeless';
    
    if (affordableHousingCost >= 50 && resources > 100) {
      housingType = 'owned_quality';
    } else if (affordableHousingCost >= 35 && resources > 50) {
      housingType = 'owned_home';
    } else if (affordableHousingCost >= 40) {
      housingType = 'quality_rental';
    } else if (affordableHousingCost >= 25) {
      housingType = 'basic_rental';
    } else if (affordableHousingCost >= 15) {
      housingType = 'overcrowded';
    } else if (affordableHousingCost > 0 || resources > 10) {
      housingType = 'shelter';
    }
    
    // Update player housing
    player.housing.status = housingType;
    player.housing.cost = this.HOUSING_TYPES[housingType].cost;
  }

  /**
   * Apply ongoing effects of housing quality
   */
  applyHousingEffects(player) {
    const housingType = this.HOUSING_TYPES[player.housing.status] || this.HOUSING_TYPES.homeless;
    
    // Physical health effects (cumulative from environment)
    const physicalMod = housingType.physicalHealthMod;
    if (physicalMod !== 0) {
      player.health.physical.baseline = Math.max(50, Math.min(100, 
        player.health.physical.baseline + physicalMod * 0.1 // Slow accumulation
      ));
    }
    
    // Mental health effects (housing stability matters for wellbeing)
    const mentalMod = housingType.mentalHealthMod;
    if (mentalMod !== 0) {
      player.health.mental.current = Math.max(0, Math.min(100,
        player.health.mental.current + mentalMod * 0.05 // Monthly adjustment
      ));
    }
    
    // Social isolation risk (bad housing = harder to socialize)
    if (housingType.socialIsolationRisk > 0.5 && Math.random() < housingType.socialIsolationRisk * 0.1) {
      player.relationships.social.friends = Math.max(0, player.relationships.social.friends - 1);
    }
    
    // Community integration (good housing = neighborhood ties)
    if (player.housing.status === 'owned_home' || player.housing.status === 'owned_quality') {
      player.relationships.social.community = Math.min(100, player.relationships.social.community + 1);
    } else if (player.housing.status === 'homeless' || player.housing.status === 'shelter') {
      player.relationships.social.community = Math.max(0, player.relationships.social.community - 2);
    }
  }

  /**
   * Check for housing instability events
   */
  checkHousingStability(player) {
    const income = player.economics.income.current || 0;
    const housingCost = player.housing.cost || 0;
    
    // Eviction risk if can't pay rent
    if (housingCost > income * 0.5 && Math.random() < 0.15) {
      // Downgrade housing
      if (player.housing.status === 'quality_rental') {
        player.housing.status = 'basic_rental';
      } else if (player.housing.status === 'basic_rental') {
        player.housing.status = 'overcrowded';
      } else if (player.housing.status === 'overcrowded') {
        player.housing.status = 'shelter';
      } else if (player.housing.status === 'shelter') {
        player.housing.status = 'homeless';
      }
      
      // Mental health impact of eviction
      player.health.mental.current = Math.max(0, player.health.mental.current - 15);
      player.housing.instability = true;
    } else {
      player.housing.instability = false;
    }
    
    // Foreclosure risk for homeowners with debt
    if ((player.housing.status === 'owned_home' || player.housing.status === 'owned_quality') 
        && player.economics.debt > 50 
        && Math.random() < 0.05) {
      player.housing.status = 'basic_rental';
      player.health.mental.current = Math.max(0, player.health.mental.current - 25);
      player.economics.debt = Math.max(0, player.economics.debt - 30); // Debt reduced but not eliminated
    }
  }

  /**
   * Check if player can buy a home
   */
  checkHomeOwnership(player) {
    // Already own
    if (player.housing.status === 'owned_home' || player.housing.status === 'owned_quality') {
      return;
    }
    
    const income = player.economics.income.current || 0;
    const resources = player.economics.resources.current || 0;
    const age = player.demographics.age;
    
    // Requirements: stable income, savings, age 25+
    const stableIncome = income > 25 && player.economics.income.employed;
    const enoughSavings = resources > 80;
    const rightAge = age >= 25 && age < 50; // Peak homebuying years
    
    if (stableIncome && enoughSavings && rightAge && Math.random() < 0.08) {
      // Buy a home!
      player.housing.status = 'owned_home';
      player.economics.resources.current -= 60; // Down payment
      player.economics.debt += 40; // Mortgage debt
      
      // Mental health boost from homeownership
      player.health.mental.current = Math.min(100, player.health.mental.current + 10);
    }
  }

  /**
   * Get housing quality description
   */
  getHousingDescription(player) {
    // Handle uninitialized housing
    if (!player.housing || !player.housing.status) {
      return {
        status: 'unknown',
        description: 'Housing not initialized',
        cost: 0,
        stability: 'unknown',
        healthImpact: { physical: 0, mental: 0 },
        socialRisk: 0
      };
    }
    
    const housingType = this.HOUSING_TYPES[player.housing.status] || this.HOUSING_TYPES.homeless;
    return {
      status: player.housing.status || 'unknown',
      description: housingType.description,
      cost: player.housing.cost || 0,
      stability: player.housing.instability ? 'unstable' : 'stable',
      healthImpact: {
        physical: housingType.physicalHealthMod,
        mental: housingType.mentalHealthMod
      },
      socialRisk: housingType.socialIsolationRisk
    };
  }

  /**
   * Calculate housing burden (% of income spent on housing)
   */
  getHousingBurden(player) {
    const income = player.economics.income.current || 0.01; // Avoid division by zero
    const housingCost = player.housing.cost || 0;
    return (housingCost / income) * 100;
  }
}

module.exports = HousingSystem;
