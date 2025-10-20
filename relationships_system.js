/**
 * RELATIONSHIPS SYSTEM
 * 
 * Manages social connections throughout life:
 * - Friend network (acquaintances → close friends)
 * - Family bonds (parents, siblings, children)
 * - Romantic relationships (dating, marriage)
 * - Social activities and community integration
 * 
 * Addresses CRITICAL BUG: 100% of deaths have "no social connections"
 * Root cause: friends can only decrease, never increase
 */

class RelationshipsSystem {
  constructor() {
    this.initialized = true;
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

    // Update parent ages and mortality
    this.updateParents(player);
    
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
    if (player.development.education.currentLevel === 'primary') {
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
    if (player.development.education.currentLevel === 'secondary') {
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
    // Employment = work friends
    if (player.economics.income.employed) {
      const workFriendChance = 0.25;
      if (Math.random() < workFriendChance) {
        player.relationships.social.friends = Math.min(15, player.relationships.social.friends + 1);
      }
    } else {
      // Unemployment reduces friend opportunities
      if (player.economics.income.unemploymentMonths > 6 && Math.random() < 0.1) {
        player.relationships.social.friends = Math.max(0, player.relationships.social.friends - 1);
      }
    }

    // University = massive friend opportunities
    if (player.development.education.currentLevel === 'university') {
      const universityFriendChance = 0.5; // 50% per year
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
   * Adult (30-59): Maintenance phase
   */
  updateAdult(player) {
    // Work friends (slower accumulation)
    if (player.economics.income.employed) {
      const workFriendChance = 0.15;
      if (Math.random() < workFriendChance) {
        player.relationships.social.friends = Math.min(15, player.relationships.social.friends + 1);
      }
    }

    // Parent relationship maintenance
    if (player.relationships.parents.mother.alive) {
      player.relationships.parents.mother.relationship += 1;
    }
    if (player.relationships.parents.father.alive) {
      player.relationships.parents.father.relationship += 1;
    }

    // Natural friend attrition (people move, drift apart)
    if (Math.random() < 0.05) { // 5% per year
      player.relationships.social.friends = Math.max(0, player.relationships.social.friends - 1);
    }

    // Marriage gives community boost
    if (player.relationships.social.married) {
      player.relationships.social.community = Math.min(85, player.relationships.social.community + 2);
    }

    // Children give community connections (school, activities)
    if (player.relationships.children.length > 0) {
      player.relationships.social.community = Math.min(90, player.relationships.social.community + 3);
      
      // Parent friends (meet through kids)
      if (Math.random() < 0.2) {
        player.relationships.social.friends = Math.min(12, player.relationships.social.friends + 1);
      }
    }
  }

  /**
   * Elderly (60+): Network shrinkage but depth
   */
  updateElderly(player) {
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
   * Calculate overall social health score
   * Used to determine isolation and mental health effects
   */
  calculateSocialHealth(player) {
    let socialScore = 0;

    // Friend count (0-40 points)
    const friendCount = player.relationships.social.friends || 0;
    socialScore += Math.min(40, friendCount * 4);

    // Partner relationship (0-30 points)
    if (player.relationships.partner.exists) {
      socialScore += (player.relationships.partner.relationship / 100) * 30;
    }

    // Family connections (0-20 points)
    let familyAlive = 0;
    if (player.relationships.parents.mother.alive) familyAlive++;
    if (player.relationships.parents.father.alive) familyAlive++;
    familyAlive += player.relationships.children.length;
    if (player.relationships.siblings) {
      familyAlive += player.relationships.siblings.filter(s => s.alive).length;
    }
    socialScore += Math.min(20, familyAlive * 4);

    // Community integration (0-10 points)
    socialScore += (player.relationships.social.community / 100) * 10;

    // Store social health score (0-100)
    player.relationships.socialHealthScore = socialScore;

    // Update isolation flag based on score
    if (socialScore < 20) {
      player.relationships.social.isolation = true;
    } else if (socialScore > 40) {
      player.relationships.social.isolation = false;
    }
    // Between 20-40 = ambiguous, don't change

    // Mental health boost from social connections
    if (socialScore > 60) {
      // Strong social network = mental health buffer
      player.health.mental.current = Math.min(100, player.health.mental.current + 1);
    } else if (socialScore < 20) {
      // Isolation = mental health drain
      player.health.mental.current = Math.max(0, player.health.mental.current - 2);
    }

    return socialScore;
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

    return {
      friends: friendCount,
      partner: hasPartner ? (married ? 'married' : 'dating') : 'none',
      parents: `${motherAlive ? 'M' : ''}${fatherAlive ? 'F' : ''}`,
      children: children,
      community: player.relationships.social.community,
      socialHealth: socialHealth.toFixed(1),
      isolated: player.relationships.social.isolation
    };
  }
}

module.exports = RelationshipsSystem;
