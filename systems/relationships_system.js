/**
 * RELATIONSHIPS SYSTEM
 * 
 * Manages social connections throughout life:
 * - Friend network (acquaintances → close friends)
 * - Family bonds (parents, siblings, children)
 * - Romantic relationships (dating, marriage)
 * - Social activities and community integration
 * 
 * Realistic factors:
 * - Age-based friendship difficulty (harder to make friends as you age)
 * - Population density (urban anonymity vs rural community)
 * - Mental health isolation spirals with intervention/grace events
 * - Regional social norms (Nordic tight communities, low density)
 * 
 * Addresses CRITICAL BUG: 100% of deaths have "no social connections"
 * Root cause: friends can only decrease, never increase
 */

class RelationshipsSystem {
  constructor() {
    this.initialized = true;
    
    // Age-based friendship difficulty multipliers (research-backed)
    this.ageDifficultyMultipliers = {
      0: 1.0,    // Childhood: effortless (parents arrange)
      12: 1.0,   // Adolescence: peak socialization (school)
      18: 0.9,   // Young adult: still easy (university/work)
      25: 0.7,   // Adult: getting harder (established routines)
      35: 0.5,   // Mid-adult: much harder (busy with family/career)
      45: 0.4,   // Middle age: social circles mostly set
      55: 0.3,   // Pre-retirement: very hard to make new friends
      65: 0.4,   // Retirement: slight increase (more free time)
      75: 0.3,   // Elderly: mobility/health limits
    };
    
    // Population density social modifiers
    this.densityModifiers = {
      'Nordic': { density: 'low', community: 1.3, anonymity: 0.7 },           // Low density, tight community
      'Rural': { density: 'low', community: 1.4, anonymity: 0.6 },            // Tight-knit
      'Western Europe': { density: 'medium', community: 1.0, anonymity: 1.0 }, // Balanced
      'Urban': { density: 'high', community: 0.8, anonymity: 1.5 },           // More opportunities but anonymity
      'Sub-Saharan': { density: 'variable', community: 1.2, anonymity: 0.8 }, // Strong community ties
    };
  }
  
  /**
   * Helper: Add a friend and maintain friendsData array
   */
  addFriend(player) {
    if (!player.relationships.social) return;
    
    // Initialize friendsData if needed
    if (!player.relationships.social.friendsData) {
      player.relationships.social.friendsData = [];
    }
    
    // Add to count
    player.relationships.social.friends = Math.min(20, player.relationships.social.friends + 1);
    
    // Add to friendsData
    player.relationships.social.friendsData.push({
      strength: 50 + Math.random() * 40,  // New friends: 50-90 strength
      yearsKnown: 0
    });
  }
  
  /**
   * Helper: Remove a friend and maintain friendsData array
   */
  /**
   * Helper: Remove a friend and maintain friendsData array
   */
  removeFriend(player) {
    if (!player.relationships.social) return;
    
    // Initialize friendsData if needed
    if (!player.relationships.social.friendsData) {
      player.relationships.social.friendsData = [];
    }
    
    if (player.relationships.social.friends > 0) {
      player.relationships.social.friends = Math.max(0, player.relationships.social.friends - 1);
      
      // Remove a random friend from friendsData
      if (player.relationships.social.friendsData.length > 0) {
        const idx = Math.floor(Math.random() * player.relationships.social.friendsData.length);
        player.relationships.social.friendsData.splice(idx, 1);
      }
    }
  }

  getAgeDifficulty(age) {
    // Find the bracket
    const brackets = Object.keys(this.ageDifficultyMultipliers)
      .map(k => parseInt(k))
      .sort((a, b) => a - b);
    
    let applicable = brackets[0];
    for (const bracket of brackets) {
      if (age >= bracket) applicable = bracket;
      else break;
    }
    
    return this.ageDifficultyMultipliers[applicable];
  }
  
  /**
   * Get population density modifier for region
   */
  getDensityModifier(birthRegion) {
    const region = birthRegion || 'Western Europe';
    
    // Match region to density profile
    if (region.includes('Nordic')) return this.densityModifiers['Nordic'];
    if (region.includes('Rural') || region.includes('Sub-Saharan')) return this.densityModifiers['Rural'];
    if (region.includes('Urban') || region.includes('City')) return this.densityModifiers['Urban'];
    
    return this.densityModifiers['Western Europe']; // Default
  }

  /**
   * Process all relationship dynamics for one year
   * Called from processYearEnd()
   */
  processYearlyRelationships(player) {
    // Age-based relationship dynamics
    if (player.demographics.age < 5) {
      this.updateEarlyChildhood(player);
    } else if (player.demographics.age < 12) {
      this.updateChildhood(player);
    } else if (player.demographics.age < 18) {
      this.updateAdolescence(player);
    } else if (player.demographics.age < 30) {
      this.updateYoungAdult(player);
    } else if (player.demographics.age < 60) {
      this.updateAdult(player);
    } else {
      this.updateElderly(player);
    }

    // Update all relationship lifecycles: children age/die, partner ages/dies, friends drift/die, parents age/die
    this.updateRelationshipLifecycles(player);
    
    // Update sibling relationships
    this.updateSiblings(player);
    
    // Calculate overall social health
    this.calculateSocialHealth(player);
  }

  /**
   * Early childhood (0-4): Family-centered
   */
  updateEarlyChildhood(player) {
    // Build bonds with present parents
    if (player.relationships.parents.mother.present) {
      player.relationships.parents.mother.relationship += 2;
    }
    if (player.relationships.parents.father.present) {
      player.relationships.parents.father.relationship += 1.5;
    }

    // Very few peer friendships, family is world
    player.relationships.social.friends = Math.min(2, player.relationships.social.friends);
    player.relationships.social.community = 30; // Low, family-centered
  }

  /**
   * Childhood (5-11): School introduces peers
   */
  updateChildhood(player) {
    // School = friend opportunities
    if (player.development.education.level === 'primary') {
      // Make friends naturally in school
      const makeFriendChance = 0.3; // 30% per year
      if (Math.random() < makeFriendChance) {
        player.relationships.social.friends = Math.min(8, player.relationships.social.friends + 1);
      }
    }

    // Maintain parent bonds
    if (player.relationships.parents.mother.present && player.relationships.parents.mother.alive) {
      player.relationships.parents.mother.relationship += 1;
    }
    if (player.relationships.parents.father.present && player.relationships.parents.father.alive) {
      player.relationships.parents.father.relationship += 0.5;
    }

    // Community through parents
    player.relationships.social.community = Math.min(60, player.relationships.social.community + 5);
  }

  /**
   * Adolescence (12-17): Peer focus, parent tension
   */
  updateAdolescence(player) {
    // School = strong friend opportunities
    if (player.development.education.level === 'secondary') {
      const makeFriendChance = 0.4; // 40% per year (peak socialization)
      if (Math.random() < makeFriendChance) {
        player.relationships.social.friends = Math.min(12, player.relationships.social.friends + 1);
      }
    }

    // Natural parent tension during teens
    if (player.relationships.parents.mother.present) {
      player.relationships.parents.mother.relationship -= 2;
    }
    if (player.relationships.parents.father.present) {
      player.relationships.parents.father.relationship -= 3;
    }

    // Community integration grows
    player.relationships.social.community = Math.min(70, player.relationships.social.community + 3);
  }

  /**
   * Young Adult (18-29): Formation of life partnerships
   */
  updateYoungAdult(player) {
    const ageDifficulty = this.getAgeDifficulty(player.demographics.age);
    const densityMod = this.getDensityModifier(player.demographics.birthRegion);
    
    // DEBUG: Trace friend-making at ages 18-25
    if (player.demographics.age >= 18 && player.demographics.age <= 25) {
      console.log(`[FRIENDS AGE ${player.demographics.age}] employed=${player.economics.income.employed}, ageDiff=${ageDifficulty.toFixed(2)}, densityComm=${densityMod.community.toFixed(2)}, current friends=${player.relationships.social.friends}`);
    }
    
    // Employment = work friends (still relatively easy in 20s)
    if (player.economics.income.employed) {
      const workFriendChance = 0.25 * ageDifficulty * densityMod.community;
      if (Math.random() < workFriendChance) {
        this.addFriend(player);
        if (player.demographics.age >= 18 && player.demographics.age <= 25) {
          console.log(`[FRIENDS AGE ${player.demographics.age}] Made work friend! chance=${workFriendChance.toFixed(3)}, now ${player.relationships.social.friends} friends`);
        }
      }
    } else {
      // Unemployment: Higher friend loss for prolonged unemployment (>12 months)
      // But not so aggressive - only 5% chance to lose one, and only if unemployed 1+ year
      if (player.economics.income.unemploymentMonths > 12 && Math.random() < 0.05) {
        this.removeFriend(player);
        if (player.demographics.age >= 18 && player.demographics.age <= 25 && player.relationships.social.friends > 0) {
          console.log(`[FRIENDS AGE ${player.demographics.age}] Lost friend due to prolonged unemployment (${player.economics.income.unemploymentMonths} months)`);
        }
      }
    }

    // University = massive friend opportunities (peak socialization)
    if (player.development.education.level === 'tertiary_bachelor' || player.development.education.level === 'tertiary') {
      const universityFriendChance = 0.5 * densityMod.community; // 50% base
      if (Math.random() < universityFriendChance) {
        player.relationships.social.friends = Math.min(20, player.relationships.social.friends + 2);
      }
      player.relationships.social.community = Math.min(80, player.relationships.social.community + 5);
    }

    // Romantic relationship formation (if not partnered)
    if (!player.relationships.partner.exists && player.health.mental.current > 40) {
      const meetPartnerChance = 0.15; // 15% per year
      if (Math.random() < meetPartnerChance) {
        this.formPartnership(player);
      }
    }
    
    // Marriage progression: Partners may marry after 2+ years together
    if (player.relationships.partner.exists && !player.relationships.social.married) {
      const yearsTogether = player.demographics.age - player.relationships.partner.since;
      if (yearsTogether >= 2) {
        const marriageChance = 0.25; // 25% per year after 2 years
        if (Math.random() < marriageChance) {
          player.relationships.social.married = true;
          player.health.mental.current = Math.min(100, player.health.mental.current + 5);
        }
      }
    }
    
    // Children: Married couples may have children (if fertile)
    if (player.relationships.social.married && player.demographics.age >= 20 && player.demographics.age <= 45) {
      // Check fertility - chronic diseases reduce but don't eliminate fertility
      // Default: fully fertile unless explicitly made infertile (menopause)
      let isFertile = player.health.reproductive?.fertile !== false;
      
      // If has chronic diseases, they reduce fertility chance but don't eliminate it
      const hasChronicDisease = player.health.chronic?.active?.length > 0;
      let diseaseFertilityPenalty = 0;
      if (hasChronicDisease) {
        // Each chronic disease reduces fertility chance by 15-20%
        diseaseFertilityPenalty = player.health.chronic.active.length * 0.2;
      }
      
      if (isFertile) {
        const existingChildren = player.relationships.children?.length || 0;
        if (existingChildren < 4) { // Max 4 children
          let childChance = 0.15; // 15% per year base
          // Apply disease fertility penalty
          childChance = Math.max(0.02, childChance * (1 - diseaseFertilityPenalty)); // Minimum 2% even with diseases
          
          if (Math.random() < childChance) {
            if (!player.relationships.children) player.relationships.children = [];
            player.relationships.children.push({
              age: 0,
              sex: Math.random() > 0.5 ? 'male' : 'female',
              born: player.demographics.age
            });
            // Mental/physical impact of childbirth
            player.health.physical.current = Math.max(0, player.health.physical.current - 5);
            player.health.mental.current = Math.max(20, player.health.mental.current - 10); // Initial stress
          }
        }
      }
    }

    // Reconcile with parents (if alive)
    if (player.demographics.age > 22) {
      if (player.relationships.parents.mother.alive) {
        player.relationships.parents.mother.relationship += 3;
      }
      if (player.relationships.parents.father.alive) {
        player.relationships.parents.father.relationship += 2;
      }
    }
  }

  /**
   * Adult (30-59): Maintenance phase with age-based difficulty
   */
  updateAdult(player) {
    const ageDifficulty = this.getAgeDifficulty(player.demographics.age);
    const densityMod = this.getDensityModifier(player.demographics.birthRegion);
    
    // WIDOWED STATUS: Grief recovery and potential remarriage
    if (player.relationships.social.widowed) {
      this.processWidowedStatus(player);
    }
    
    // Education-based friend opportunities continue into adulthood
    if (player.development.education.level === 'tertiary_bachelor' || player.development.education.level === 'tertiary') {
      const universityFriendChance = 0.3 * densityMod.community; // Slightly lower than young adult (0.5)
      if (Math.random() < universityFriendChance) {
        player.relationships.social.friends = Math.min(20, player.relationships.social.friends + 1);
      }
      player.relationships.social.community = Math.min(80, player.relationships.social.community + 3);
    }
    
    // Work friends (age makes it harder)
    if (player.economics.income.employed) {
      const workFriendChance = 0.25 * ageDifficulty * densityMod.community;
      if (Math.random() < workFriendChance) {
        player.relationships.social.friends = Math.min(15, player.relationships.social.friends + 1);
      }
    }
    
    // Community friends (hobbies, volunteering, neighbors)
    // Requires decent mental health AND gets harder with age
    if (player.health.mental.current > 50) {
      const communityFriendChance = 0.15 * ageDifficulty * densityMod.community;
      if (Math.random() < communityFriendChance) {
        player.relationships.social.friends = Math.min(15, player.relationships.social.friends + 1);
        player.relationships.social.community = Math.min(90, player.relationships.social.community + 1);
      }
    }
    
    // **INTERVENTION/GRACE EVENTS** - Break isolation spirals
    // Realistic: community programs, workplace social, chance encounters, therapy success
    if (player.relationships.social.friends <= 1 && player.relationships.social.isolation) {
      const interventionChance = 0.08 * densityMod.community; // 8% base, higher in tight communities
      if (Math.random() < interventionChance) {
        // Life-changing intervention
        player.relationships.social.friends += 2;
        player.relationships.social.community += 15;
        player.health.mental.current = Math.min(100, player.health.mental.current + 10);
        player.relationships.social.isolation = false;
        // Note: Could add event logging here for narrative
      }
    }

    // Parent relationship maintenance
    if (player.relationships.parents.mother.alive) {
      player.relationships.parents.mother.relationship += 1;
    }
    if (player.relationships.parents.father.alive) {
      player.relationships.parents.father.relationship += 1;
    }

    // Natural friend attrition (life gets busy, people move)
    // But less attrition in tight communities
    const attritionRate = 0.03 / densityMod.community;
    if (Math.random() < attritionRate) {
      player.relationships.social.friends = Math.max(0, player.relationships.social.friends - 1);
    }

    // Marriage gives community boost and partner's friends
    if (player.relationships.social.married) {
      player.relationships.social.community = Math.min(85, player.relationships.social.community + 2);
      // Partner's social network (harder to integrate as you age)
      if (Math.random() < (0.1 * ageDifficulty)) {
        player.relationships.social.friends = Math.min(15, player.relationships.social.friends + 1);
      }
    }

    // Children give community connections (school, activities)
    if (player.relationships.children.length > 0) {
      player.relationships.social.community = Math.min(90, player.relationships.social.community + 3);
      
      // Parent friends (meet through kids) - increased from 20% to 30%
      if (Math.random() < 0.3) {
        player.relationships.social.friends = Math.min(12, player.relationships.social.friends + 1);
      }
    }
  }

  /**
   * Elderly (60+): Network shrinkage but depth
   */
  updateElderly(player) {
    // WIDOWED STATUS: Grief recovery and isolation risk for elderly
    if (player.relationships.social.widowed) {
      this.processWidowedStatus(player);
      // Elderly widows/widowers have higher isolation risk
      if (player.relationships.social.friends < 2) {
        player.relationships.social.isolation = true;
      }
    }
    
    // Retirement reduces work-based friendships
    if (!player.economics.income.employed && player.demographics.age >= 65) {
      if (Math.random() < 0.08) { // 8% per year
        player.relationships.social.friends = Math.max(0, player.relationships.social.friends - 1);
      }
    }

    // Friends die (age-related mortality)
    const friendMortalityRate = 0.02 * Math.pow(1.08, player.demographics.age - 60); // Exponential increase
    if (Math.random() < friendMortalityRate && player.relationships.social.friends > 0) {
      player.relationships.social.friends = Math.max(0, player.relationships.social.friends - 1);
      // Death of friend = mental health impact
      player.health.mental.current = Math.max(0, player.health.mental.current - 5);
    }

    // Grandchildren give renewed connections
    if (player.relationships.children.length > 0 && player.demographics.age >= 50) {
      // Assume some children have kids
      const grandchildChance = 0.1 * player.relationships.children.length;
      if (Math.random() < grandchildChance) {
        player.relationships.social.community = Math.min(70, player.relationships.social.community + 2);
        player.health.mental.current = Math.min(100, player.health.mental.current + 3);
      }
    }

    // Strong family bonds become more valuable
    if (player.relationships.parents.mother.alive || player.relationships.parents.father.alive) {
      // Caregiver role
      player.relationships.social.community += 1;
    }
  }

  /**
   * Update all relationship lifecycles: children, partner, friends, parents
   */
  updateRelationshipLifecycles(player) {
    // Update children: age them, check for death, apply health impacts
    this.updateChildren(player);
    
    // Update partner: age, health deterioration, relationship drift, mortality
    this.updatePartner(player);
    
    // Update friends: relationship drift, natural attrition, mortality
    this.updateFriends(player);
    
    // Update parents: age, mortality
    this.updateParents(player);
  }

  /**
   * Age children and handle mortality
   */
  updateChildren(player) {
    if (!player.relationships.children || player.relationships.children.length === 0) return;

    const region = player.demographics.birthRegion;
    
    for (let i = player.relationships.children.length - 1; i >= 0; i--) {
      const child = player.relationships.children[i];
      
      // Age the child each year
      child.age++;
      
      // Check child mortality based on age and region
      const childMortalityRate = this.getChildMortalityRate(child.age, region, player);
      
      if (Math.random() < childMortalityRate) {
        // Child dies
        player.relationships.children.splice(i, 1);
        
        // Major mental health impact
        player.health.mental.current = Math.max(0, player.health.mental.current - 25);
        
        // Economic impact (loss of potential future support)
        player.economics.resources.current = Math.max(-1000, player.economics.resources.current - 50);
        
        // Note: Could trigger grief event in event system
      }
    }
  }

  /**
   * Get child mortality rate by age and region (realistic rates)
   */
  getChildMortalityRate(age, region, player) {
    // Mortality rates per year by age (from WHO/World Bank data)
    const baseMortality = {
      Nordic: {
        "0-1": 0.003,    // 3 per 1000
        "1-5": 0.0005,   // 0.5 per 1000
        "5-10": 0.0002,  // 0.2 per 1000
        "10-18": 0.0003  // 0.3 per 1000
      },
      Developed: {
        "0-1": 0.005,    // 5 per 1000
        "1-5": 0.001,    // 1 per 1000
        "5-10": 0.0005,
        "10-18": 0.0008
      },
      Emerging: {
        "0-1": 0.025,    // 25 per 1000
        "1-5": 0.008,    // 8 per 1000
        "5-10": 0.004,
        "10-18": 0.006
      },
      Developing: {
        "0-1": 0.060,    // 60 per 1000
        "1-5": 0.025,    // 25 per 1000
        "5-10": 0.012,
        "10-18": 0.015
      },
      Fragile: {
        "0-1": 0.120,    // 120 per 1000
        "1-5": 0.060,    // 60 per 1000
        "5-10": 0.040,
        "10-18": 0.050
      }
    };
    
    const regionRates = baseMortality[region] || baseMortality.Developing;
    let ageGroup = "10-18";
    
    if (age < 1) ageGroup = "0-1";
    else if (age < 5) ageGroup = "1-5";
    else if (age < 10) ageGroup = "5-10";
    
    let rate = regionRates[ageGroup];
    
    // Apply parental factors
    if (player.health.physical.current < 30) {
      // Parent illness → worse child care
      rate *= 1.5;
    }
    if (player.economics.resources.current < -100) {
      // Extreme poverty
      rate *= 2.0;
    }
    
    return Math.min(0.5, rate); // Cap at 50% per year
  }

  /**
   * Update partner: age, health, relationship drift, mortality
   */
  updatePartner(player) {
    if (!player.relationships.partner.exists) return;
    
    const partner = player.relationships.partner;
    
    // Age partner
    if (!partner.ageAtUnion) partner.ageAtUnion = player.demographics.age;
    const yearsPartner = player.demographics.age - partner.ageAtUnion;
    partner.currentAge = (partner.ageAtUnion || 25) + yearsPartner;
    
    // Relationship drift (positive if stable, negative if stressed)
    const stressFactor = player.health.mental.current < 40 ? -2 : 0;
    const healthFactor = player.health.physical.current < 30 ? -1 : 0;
    const economicFactor = player.economics.resources.current < -500 ? -2 : 1;
    
    const drift = stressFactor + healthFactor + economicFactor + (Math.random() - 0.5);
    partner.relationship = Math.max(0, Math.min(100, partner.relationship + drift));
    
    // Partnership dissolution if relationship drops too low
    if (partner.relationship < 10) {
      player.relationships.partner.exists = false;
      player.relationships.social.married = false;
      player.relationships.social.divorced = true;
      
      // Divorce impacts: mental health hit, but less severe than death
      player.health.mental.current = Math.max(0, player.health.mental.current - 15);
      
      // Social community may reduce (depending on community support)
      player.relationships.social.community = Math.max(0, player.relationships.social.community - 10);
      
      // Economic cost: legal fees, asset division, etc
      player.economics.resources.current = Math.max(-500, player.economics.resources.current - 20);
      
      // Track divorce event
      if (!player.eventHistory) player.eventHistory = [];
      player.eventHistory.push({
        age: player.demographics.age,
        type: 'divorce',
        yearsMarried: player.demographics.age - partner.ageAtUnion,
        impact: {
          mental: -15,
          resources: -20
        }
      });
      
      return;
    }
    
    // Partner mortality based on age
    const partnerMortalityRate = this.getPartnerMortalityRate(partner.currentAge);
    if (Math.random() < partnerMortalityRate) {
      // ========== PARTNER DEATH: WIDOWED EFFECTS ==========
      player.relationships.partner.exists = false;
      player.relationships.social.married = false;
      player.relationships.social.widowed = true;
      player.relationships.partner.deathAge = partner.currentAge;
      
      // 1. MENTAL HEALTH IMPACT
      // Based on relationship strength and duration
      const impactFactor = partner.relationship / 100;
      const yearsPartner = player.demographics.age - partner.ageAtUnion;
      const durationFactor = Math.min(1, yearsPartner / 20); // Cap impact at 20 years together
      const mentalImpact = 30 * impactFactor * (0.5 + 0.5 * durationFactor); // 15-30 hit
      
      player.health.mental.current = Math.max(0, player.health.mental.current - mentalImpact);
      
      // 2. PHYSICAL HEALTH IMPACT (grief affects body)
      player.health.physical.current = Math.max(0, player.health.physical.current - 15);
      
      // 3. SOCIAL ISOLATION RISK
      // Widows/widowers are at high risk of isolation
      player.relationships.social.isolation = true;
      player.relationships.social.community = Math.max(0, player.relationships.social.community - 20);
      
      // 4. ECONOMIC IMPACTS
      // Loss of partner's income (if any) and potential caregiving costs if partner was ill
      if (!player.economics.spousalIncome) {
        // Partner was contributing some income
        const lostIncome = 5 + Math.random() * 10; // 5-15 resources lost
        player.economics.income.current = Math.max(0, player.economics.income.current - lostIncome);
      }
      
      // 5. CAREGIVING ROLE TRANSITIONS
      // If partner died young (before 70) with children, parenting becomes sole responsibility
      if (player.relationships.children && player.relationships.children.length > 0) {
        const childCount = player.relationships.children.length;
        const youngChildren = player.relationships.children.filter(c => c.age < 18).length;
        
        if (youngChildren > 0) {
          // Single parent penalty: more physical/mental stress
          player.health.physical.current = Math.max(0, player.health.physical.current - (3 * youngChildren));
          player.health.mental.current = Math.max(0, player.health.mental.current - (5 * youngChildren));
          
          // Increased resource cost for childcare (no partner help)
          player.economics.resources.current = Math.max(-500, player.economics.resources.current - (8 * youngChildren));
          
          // Mark caregiver role intensification
          player.relationships.caregivingRole = 'sole_parent';
        }
      }
      
      // 6. GRIEF EVENTS
      // Track that major life event occurred (can trigger storyline/event)
      if (!player.eventHistory) player.eventHistory = [];
      player.eventHistory.push({
        age: player.demographics.age,
        type: 'spouse_death',
        partnerAge: partner.currentAge,
        yearsTogether: yearsPartner,
        impact: {
          mental: -mentalImpact,
          physical: -15,
          isolation: 'increased'
        }
      });
    }
  }

  /**
   * Get partner mortality rate by age
   */
  getPartnerMortalityRate(age) {
    if (age < 40) return 0.002;  // 0.2% per year
    if (age < 50) return 0.003;  // 0.3%
    if (age < 60) return 0.008;  // 0.8%
    if (age < 70) return 0.020;  // 2%
    if (age < 80) return 0.05;   // 5%
    return 0.15; // 15% at 80+
  }

  /**
   * Update friends: relationship drift, attrition, mortality
   */
  updateFriends(player) {
    if (!player.relationships.social) return;
    
    const friendCount = player.relationships.social.friends || 0;
    if (friendCount <= 0) return; // No friends to process
    
    // Natural friend relationship drift
    // Friends fade with age, isolation, or poor mental health
    const ageEffect = player.demographics.age > 50 ? -0.5 : 0;
    const isolationEffect = player.relationships.social.isolation ? -1.5 : 0;
    const mentalHealthEffect = player.health.mental.current < 40 ? -1 : 0;
    
    const driftPerFriend = ageEffect + isolationEffect + mentalHealthEffect + (Math.random() - 0.5) * 0.5;
    
    // **CRITICAL FIX**: Synchronize friendsData with friend count
    // If friend count != friendsData length, create/adjust friendsData to match
    if (!player.relationships.social.friendsData) {
      player.relationships.social.friendsData = [];
    }
    
    // Rebuild friendsData if count mismatch (friends were added/removed without syncing)
    if (player.relationships.social.friendsData.length !== friendCount) {
      const currentCount = player.relationships.social.friendsData.length;
      if (currentCount < friendCount) {
        // Friends were added: create new entries
        for (let i = currentCount; i < friendCount; i++) {
          player.relationships.social.friendsData.push({
            strength: 50 + Math.random() * 40,  // New friends: medium strength
            yearsKnown: 0
          });
        }
      } else if (currentCount > friendCount) {
        // Friends were removed: trim data array
        player.relationships.social.friendsData = player.relationships.social.friendsData.slice(0, friendCount);
      }
    }
    
    // Update each friend
    let activeFriends = 0;
    for (let i = player.relationships.social.friendsData.length - 1; i >= 0; i--) {
      const friend = player.relationships.social.friendsData[i];
      friend.strength += driftPerFriend;
      friend.yearsKnown++;
      
      // Friendship attrition (life happens)
      // High rates only if isolated or low mental health
      const isolationFactor = player.relationships.social.isolation ? 2.0 : 1.0;
      const mentalHealthFactor = player.health.mental.current < 40 ? 1.5 : 1.0;
      const baseAttritionRate = 0.02; // Reduced from 0.05 - was too aggressive
      const attritionRate = baseAttritionRate * isolationFactor * mentalHealthFactor + (0.01 * (friend.yearsKnown / 20)); 
      
      if (Math.random() < attritionRate) {
        player.relationships.social.friendsData.splice(i, 1);
        continue;
      }
      
      // Friend death (low probability but increases with age)
      const friendAge = 25 + friend.yearsKnown + (Math.random() * 30);
      const friendMortalityRate = this.getParentMortalityRate(friendAge) * 0.5;
      if (Math.random() < friendMortalityRate) {
        player.relationships.social.friendsData.splice(i, 1);
        // Minor mental health impact
        player.health.mental.current = Math.max(0, player.health.mental.current - 3);
        continue;
      }
      
      activeFriends++;
    }
    
    // Update friend count based on remaining active friends
    player.relationships.social.friends = Math.max(0, activeFriends);
  }

  /**
   * Update parent ages and handle parent mortality
   */
  updateParents(player) {
    // Mother
    if (player.relationships.parents.mother.alive) {
      const motherAge = player.relationships.parents.mother.ageAtBirth + player.demographics.age;
      player.relationships.parents.mother.currentAge = motherAge;

      // Age-based mortality (simplified)
      const mortalityRate = this.getParentMortalityRate(motherAge);
      if (Math.random() < mortalityRate) {
        player.relationships.parents.mother.alive = false;
        this.handleParentDeath(player, 'mother');
      }
    }

    // Father
    if (player.relationships.parents.father.alive) {
      const fatherAge = player.relationships.parents.father.ageAtBirth + player.demographics.age;
      player.relationships.parents.father.currentAge = fatherAge;

      const mortalityRate = this.getParentMortalityRate(fatherAge);
      if (Math.random() < mortalityRate) {
        player.relationships.parents.father.alive = false;
        this.handleParentDeath(player, 'father');
      }
    }
  }

  /**
   * Get simplified parent mortality rate by age
   */
  getParentMortalityRate(age) {
    if (age < 50) return 0.001; // 0.1% per year
    if (age < 60) return 0.005; // 0.5%
    if (age < 70) return 0.015; // 1.5%
    if (age < 80) return 0.04;  // 4%
    if (age < 90) return 0.10;  // 10%
    return 0.20; // 20% per year at 90+
  }

  /**
   * Handle impact of parent death
   */
  handleParentDeath(player, parent) {
    const relationship = player.relationships.parents[parent].relationship;
    
    // Mental health impact (stronger for closer relationships)
    const impactBase = 20;
    const impactScaled = impactBase * (relationship / 100);
    player.health.mental.current = Math.max(0, player.health.mental.current - impactScaled);

    // Younger = more impact
    if (player.demographics.age < 25) {
      player.health.mental.current = Math.max(0, player.health.mental.current - 10);
    }

    // Note: This could trigger temporal grief effect if integrated with event system
  }

  /**
   * Update sibling relationships
   */
  updateSiblings(player) {
    if (!player.relationships.siblings || player.relationships.siblings.length === 0) return;

    for (let sibling of player.relationships.siblings) {
      // Siblings age together
      if (sibling.alive) {
        // Natural relationship maintenance/drift
        const drift = (Math.random() - 0.5) * 2; // -1 to +1
        sibling.relationship = Math.max(0, Math.min(100, sibling.relationship + drift));

        // Sibling mortality (simplified)
        const siblingAge = sibling.ageDifference + player.demographics.age;
        const mortalityRate = this.getParentMortalityRate(siblingAge) * 0.8; // Slightly lower than parents
        if (Math.random() < mortalityRate) {
          sibling.alive = false;
          // Grief impact
          player.health.mental.current = Math.max(0, player.health.mental.current - 15);
        }
      }
    }
  }

  /**
   * Form romantic partnership
   */
  formPartnership(player) {
    player.relationships.partner.exists = true;
    player.relationships.partner.relationship = 70 + Math.random() * 20; // 70-90 starting
    player.relationships.partner.since = player.demographics.age;
    
    // Mental health boost
    player.health.mental.current = Math.min(100, player.health.mental.current + 10);
    
    // Community integration
    player.relationships.social.community = Math.min(90, player.relationships.social.community + 5);

    // May marry after a few years (handled elsewhere or in events)
  }

  /**
   * Calculate overall social health score with personality-based needs
   * Separates "alone" (neutral) from "lonely" (distressed)
   */
  calculateSocialHealth(player) {
    // Initialize personality trait if not set (0-100 scale)
    if (!player.personality) {
      player.personality = {};
    }
    if (player.personality.socialNeeds === undefined) {
      // Distribute: ~25% introvert (0-33), ~50% ambivert (34-66), ~25% extrovert (67-100)
      const roll = Math.random() * 100;
      player.personality.socialNeeds = roll;
    }
    
    // Calculate ACTUAL social fulfillment (0-100)
    let socialFulfillment = 0;
    
    // Friend count contributes differently based on quality
    const friendCount = player.relationships.social.friends || 0;
    if (friendCount === 0) {
      socialFulfillment += 0;
    } else if (friendCount <= 2) {
      // 1-2 close friends: Quality > quantity
      socialFulfillment += friendCount * 20; // 20-40 points
    } else if (friendCount <= 5) {
      // 3-5 friends: Good balance
      socialFulfillment += 40 + (friendCount - 2) * 5; // 45-55 points
    } else {
      // 6+ friends: Diminishing returns
      socialFulfillment += 55 + Math.min(10, (friendCount - 5) * 2); // 55-65 points max
    }
    
    // Partner relationship (0-25 points)
    if (player.relationships.partner.exists) {
      socialFulfillment += (player.relationships.partner.relationship / 100) * 25;
    }
    
    // Family connections (0-10 points)
    let familyAlive = 0;
    if (player.relationships.parents.mother.alive) familyAlive++;
    if (player.relationships.parents.father.alive) familyAlive++;
    familyAlive += player.relationships.children.length;
    if (player.relationships.siblings) {
      familyAlive += player.relationships.siblings.filter(s => s.alive).length;
    }
    socialFulfillment += Math.min(10, familyAlive * 2);
    
    // Community integration (0-5 points) - background social fabric
    socialFulfillment += (player.relationships.social.community / 100) * 5;
    
    // Cap at 100
    socialFulfillment = Math.min(100, socialFulfillment);
    
    // Calculate LONELINESS = gap between needs and fulfillment
    // Negative = needs not met (lonely), Positive = needs exceeded (content/social)
    const socialBalance = socialFulfillment - player.personality.socialNeeds;
    
    // Store metrics
    player.relationships.socialHealthScore = socialFulfillment;
    player.relationships.socialBalance = socialBalance;
    player.relationships.loneliness = Math.max(0, -socialBalance); // 0-100, higher = more lonely
    
    // Determine isolation: Lonely + distressed (not just "alone")
    // Introverts with 0 friends and low needs = NOT isolated
    // Extroverts with 5 friends but high needs = MIGHT BE isolated
    if (player.relationships.loneliness > 30 && socialFulfillment < 40) {
      player.relationships.social.isolation = true;
    } else if (player.relationships.loneliness < 15 || socialFulfillment > 50) {
      player.relationships.social.isolation = false;
    }
    // Ambiguous cases: don't change status
    
    // Mental health effects based on loneliness (not just friend count!)
    const lonelinessImpact = player.relationships.loneliness / 10; // 0-10 points
    
    if (player.relationships.loneliness > 50) {
      // Severe loneliness = mental health decline (downward spiral)
      player.health.mental.current = Math.max(0, player.health.mental.current - lonelinessImpact * 0.5);
    } else if (player.relationships.loneliness > 30) {
      // Moderate loneliness = mild decline
      player.health.mental.current = Math.max(0, player.health.mental.current - 1);
    } else if (player.relationships.loneliness < 10 && socialFulfillment > 60) {
      // Well-connected = mental health boost
      player.health.mental.current = Math.min(100, player.health.mental.current + 1);
    }
    
    // Mental health also affects ability to socialize (feedback loop)
    // Low mental health makes it harder to maintain relationships
    if (player.health.mental.current < 30 && friendCount > 0) {
      // Risk of losing friends when severely depressed
      if (Math.random() < 0.05) { // 5% chance per year
        player.relationships.social.friends = Math.max(0, friendCount - 1);
      }
    }

    return socialFulfillment;
  }

  /**
   * Handle widowed status: grief recovery and potential remarriage
   * Called from youth/adult relationship updates when player is widowed
   */
  processWidowedStatus(player) {
    if (!player.relationships.social.widowed) return;
    
    // Grief recovery over time
    const yearsSinceWidowed = player.demographics.age - (player.relationships.partner.deathAge || 0);
    
    // 1. GRADUAL MENTAL HEALTH RECOVERY
    // Recovery takes 2-5 years depending on support system
    const supportScore = (player.relationships.social.friends / 10) + 
                        (player.relationships.social.community / 50) +
                        (player.relationships.children.length > 0 ? 1 : 0); // Children provide purpose
    
    const recoveryRate = 0.05 + (supportScore * 0.02); // 5-15% recovery per year
    if (yearsSinceWidowed < 5) {
      player.health.mental.current = Math.min(100, player.health.mental.current + recoveryRate);
    }
    
    // 2. SOCIAL ISOLATION RECOVERY
    // Build new friendships, re-engage with community
    if (yearsSinceWidowed >= 2 && player.relationships.social.isolation) {
      const isolationBreakChance = 0.15 + (supportScore * 0.05); // 15-35% to break isolation
      if (Math.random() < isolationBreakChance) {
        player.relationships.social.isolation = false;
        player.relationships.social.community = Math.min(70, player.relationships.social.community + 10);
        player.health.mental.current = Math.min(100, player.health.mental.current + 5);
      }
    }
    
    // 3. POTENTIAL REMARRIAGE (for adults under 70 with decent mental health)
    if (player.demographics.age >= 40 && player.demographics.age < 70 && 
        yearsSinceWidowed >= 2 && 
        player.health.mental.current > 50) {
      
      // Remarriage chance increases with social engagement
      const remarriageChance = 0.05 * (player.relationships.social.friends / 5);
      
      if (Math.random() < remarriageChance) {
        // Remarry
        player.relationships.partner.exists = true;
        player.relationships.social.married = true;
        player.relationships.social.widowed = false; // No longer widowed
        player.relationships.partner.ageAtUnion = player.demographics.age;
        player.relationships.partner.since = player.demographics.age;
        player.relationships.partner.relationship = 60; // Start at moderate (not like first marriage)
        
        // Mental health boost from remarriage
        player.health.mental.current = Math.min(100, player.health.mental.current + 10);
        
        // Track remarriage event
        if (!player.eventHistory) player.eventHistory = [];
        player.eventHistory.push({
          age: player.demographics.age,
          type: 'remarriage',
          yearsSinceWidowed: yearsSinceWidowed,
          impact: { mental: 10 }
        });
      }
    }
  }

  /**
   * Get a summary of social connections for debugging/display
   */
  getSocialSummary(player) {
    const friendCount = player.relationships.social.friends || 0;
    const hasPartner = player.relationships.partner.exists;
    const married = player.relationships.social.married;
    const motherAlive = player.relationships.parents.mother.alive;
    const fatherAlive = player.relationships.parents.father.alive;
    const children = player.relationships.children.length;
    const socialHealth = player.relationships.socialHealthScore || 0;
    const socialNeeds = player.personality?.socialNeeds || 50;
    const loneliness = player.relationships.loneliness || 0;
    
    // Personality type
    let personalityType = 'ambivert';
    if (socialNeeds < 33) personalityType = 'introvert';
    else if (socialNeeds > 66) personalityType = 'extrovert';

    return {
      friends: friendCount,
      partner: hasPartner ? (married ? 'married' : 'dating') : 'none',
      parents: `${motherAlive ? 'M' : ''}${fatherAlive ? 'F' : ''}`,
      children: children,
      community: player.relationships.social.community,
      socialHealth: socialHealth.toFixed(1),
      socialNeeds: socialNeeds.toFixed(0),
      loneliness: loneliness.toFixed(1),
      personality: personalityType,
      isolated: player.relationships.social.isolation
    };
  }
}

module.exports = RelationshipsSystem;
