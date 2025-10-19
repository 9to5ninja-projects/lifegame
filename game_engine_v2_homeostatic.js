// MORTALITY LOTTERY - Game Engine v2: Homeostatic State System
// Replaces simple tag-based model with rich, interconnected state
// Enables complex event chains, realistic progression, and emergent gameplay

class MortalityGameV2 {
  constructor(birthCards, familyCards, eventCards, deathCards) {
    this.birthCards = birthCards;
    this.familyCards = familyCards;
    this.eventCards = eventCards;
    this.deathCards = deathCards;
    this.player = null;
  }

  // ============================================================================
  // PHASE 1: PLAYER STATE INITIALIZATION
  // ============================================================================

  createPlayer(birthCard, familyCard, demographics = {}) {
    const sex = demographics.sex || (Math.random() > 0.5 ? "male" : "female");
    const birthYear = new Date().getFullYear();

    this.player = {
      // ========== DEMOGRAPHICS (Immutable after birth) ==========
      demographics: {
        sex: sex, // "male" | "female"
        birthYear: birthYear,
        age: 0,
        birthRegion: birthCard.name,
        ethnicity: demographics.ethnicity || null,
        lifeExpectancy: birthCard.lifeExpectancy || 73
      },

      // ========== HEALTH (Homeostatic systems) ==========
      health: {
        physical: {
          current: birthCard.effects?.statSet?.survival || 75,
          baseline: birthCard.effects?.statSet?.survival || 75,
          drift: 3, // Recovery rate per year
          chronic: [] // ["diabetes", "asthma"]
        },
        mental: {
          current: 65,
          baseline: 65,
          drift: 2,
          chronic: [] // ["depression", "ptsd", "anxiety"]
        },
        reproductive: {
          fertile: sex === "female" ? true : false,
          pregnant: false,
          childrenBorn: 0,
          menarche: sex === "female" ? false : null,
          menopause: false
        }
      },

      // ========== RELATIONSHIPS (State machine) ==========
      relationships: {
        parents: {
          mother: {
            alive: true,
            present: Math.random() > 0.1, // 90% have mother present
            relationship: 70 + Math.random() * 20
          },
          father: {
            alive: true,
            present: Math.random() > 0.25, // 75% have father present
            relationship: 60 + Math.random() * 20
          }
        },
        bestFriend: null, // Single best friend (can die)
        siblings: this.generateSiblings(),
        partner: {
          exists: false,
          married: false,
          relationship: 0,
          since: null,
          children: [] // Biologically with this partner
        },
        children: [], // All children (biological, adopted, step)
        social: {
          friends: 1,
          community: 50, // 0-100 integration into community
          isolation: false,
          married: false
        }
      },

      // ========== ECONOMICS (Homeostatic) ==========
      economics: {
        income: {
          current: 0, // Per-year income
          baseline: birthCard.effects?.resourceMod || 10,
          employed: false,
          occupation: null
        },
        resources: {
          current: Math.max(0, birthCard.effects?.resourceMod || 20),
          baseline: Math.max(0, birthCard.effects?.resourceMod || 20),
          drift: -5 // Negative = expenses exceed income (modifies yearly)
        },
        debt: 0,
        assets: [] // ["home", "vehicle"]
      },

      // ========== DEVELOPMENT (Progressive) ==========
      development: {
        education: {
          literate: false,
          yearsCompleted: 0,
          level: "none", // none, primary, secondary, tertiary, university
          inSchool: false,
          schoolQuality: 0 // 0-100, affects learning speed
        },
        skills: [], // ["farming", "trade", "music", "medicine"]
        cognitive: {
          current: 70,
          baseline: 70,
          developmentPhase: "infancy", // infancy, childhood, adolescent, adult, decline
          decline: 0 // Cognitive decline in old age
        }
      },

      // ========== CIRCUMSTANCES (State flags) ==========
      circumstances: {
        location: {
          urban: birthCard.profileTags?.includes("urban") || false,
          displaced: false,
          refugee: false,
          migrant: false,
          climate: "temperate" // Affects disease/survival
        },
        legal: {
          citizenship: true,
          documented: true,
          criminalRecord: false,
          imprisoned: false
        },
        housing: {
          status: "stable", // stable, unstable, homeless
          ownership: false,
          quality: 50 // 0-100
        },
        vulnerability: {
          disabled: false,
          elderly: false,
          dependent: true, // Age-based, initially true for children
          caregiver: false
        }
      },

      // ========== SURVIVAL & LEGACY ==========
      survival: birthCard.effects?.statSet?.survival || 75,
      alive: true,
      folded: false,
      causeOfDeath: null,
      lifeExpectancy: birthCard.lifeExpectancy || 73,

      // ========== GAME STATE ==========
      birthCards: [birthCard, familyCard],
      eventHistory: [],
      profileTags: [...(birthCard.profileTags || [])],

      // ========== AGENCY (For compatibility) ==========
      agency: 0
    };

    // Apply family card effects to initial state
    this.applyFamilyCardEffects(familyCard);

    // Apply birth card base effects
    this.applyBirthCardEffects(birthCard);

    return this.player;
  }

  // ============================================================================
  // HELPER: Generate initial siblings
  // ============================================================================
  generateSiblings() {
    const siblingCount = Math.floor(Math.random() * 5); // 0-4 siblings
    const siblings = [];

    for (let i = 0; i < siblingCount; i++) {
      const ageGap = Math.floor(Math.random() * 8) - 4; // -4 to +4 years
      siblings.push({
        age: ageGap,
        alive: Math.random() > 0.05, // 95% survival initially
        relationship: 70 + Math.random() * 20,
        sex: Math.random() > 0.5 ? "male" : "female"
      });
    }

    return siblings;
  }

  // ============================================================================
  // HELPER: Apply family card effects to base state
  // ============================================================================
  applyFamilyCardEffects(familyCard) {
    if (!familyCard.effects) return;

    // Adjust survival
    if (familyCard.effects.survivalMod) {
      this.player.health.physical.baseline += familyCard.effects.survivalMod;
      this.player.health.physical.current += familyCard.effects.survivalMod;
      this.player.survival += familyCard.effects.survivalMod;
    }

    // Adjust resources
    if (familyCard.effects.resourceMod) {
      this.player.economics.resources.current += familyCard.effects.resourceMod;
      this.player.economics.resources.baseline += familyCard.effects.resourceMod;
    }

    // Adjust relationships based on family structure
    if (familyCard.name.includes("Single")) {
      const parent = Math.random() > 0.5 ? "mother" : "father";
      const otherParent = parent === "mother" ? "father" : "mother";
      this.player.relationships.parents[otherParent].present = false;
      this.player.relationships.parents[otherParent].alive = Math.random() > 0.3;
    }

    if (familyCard.name.includes("Orphan")) {
      this.player.relationships.parents.mother.alive = false;
      this.player.relationships.parents.father.alive = false;
      this.player.health.mental.current -= 20;
      this.player.health.mental.baseline -= 10;
    }

    if (familyCard.name.includes("Abuse")) {
      this.player.health.mental.current -= 25;
      this.player.relationships.parents.mother.relationship = Math.random() * 30;
      this.player.relationships.parents.father.relationship = Math.random() * 30;
      this.player.health.mental.chronic.push("trauma");
    }

    // Clamp values
    this.clampPlayerStats();
  }

  applyBirthCardEffects(birthCard) {
    if (birthCard.profileTags) {
      this.player.circumstances.location.urban = birthCard.profileTags.includes(
        "urban"
      );
    }
  }

  clampPlayerStats() {
    this.player.health.physical.current = Math.max(
      0,
      Math.min(100, this.player.health.physical.current)
    );
    this.player.health.physical.baseline = Math.max(
      1,
      Math.min(100, this.player.health.physical.baseline)
    );
    this.player.health.mental.current = Math.max(
      0,
      Math.min(100, this.player.health.mental.current)
    );
    this.player.health.mental.baseline = Math.max(
      1,
      Math.min(100, this.player.health.mental.baseline)
    );
    this.player.survival = Math.max(1, Math.min(99, this.player.survival));
    this.player.economics.resources.current = Math.max(
      0,
      this.player.economics.resources.current
    );
  }

  // ============================================================================
  // PHASE 2: PREREQUISITE EVALUATION ENGINE
  // ============================================================================

  canEventOccur(event, player = this.player) {
    if (!event.requires) return true;
    return this.evaluateRequirements(event.requires, player);
  }

  evaluateRequirements(reqs, player) {
    if (reqs.all) {
      return reqs.all.every((req) => this.evaluateSingleRequirement(req, player));
    }
    if (reqs.any) {
      return reqs.any.some((req) => this.evaluateSingleRequirement(req, player));
    }
    return this.evaluateSingleRequirement(reqs, player);
  }

  evaluateSingleRequirement(req, player) {
    // Handle simple key-value requirements: { "demographics.sex": "female" }
    for (const [key, value] of Object.entries(req)) {
      const playerValue = this.getNestedValue(player, key);
      
      // Handle range checks (e.g., "age": "15-45")
      if (typeof value === "string" && value.includes("-")) {
        const [min, max] = value.split("-").map(Number);
        if (playerValue < min || playerValue > max) return false;
        continue;
      }

      // Handle comparison operators (e.g., "age": ">18", "resources": "<10")
      if (typeof value === "string" && value.match(/^[<>=]/)) {
        const match = value.match(/^([<>=]+)(.+)$/);
        if (!match) return false;
        const [, operator, compareValue] = match;
        const numValue = isNaN(compareValue) ? compareValue : Number(compareValue);
        if (!this.compareValues(playerValue, operator, numValue)) return false;
        continue;
      }

      // Handle array checks (e.g., "health.physical.chronic": "has diabetes")
      if (typeof value === "string" && value.startsWith("has ")) {
        const item = value.replace("has ", "");
        if (!Array.isArray(playerValue) || !playerValue.includes(item))
          return false;
        continue;
      }

      // Handle younger sibling checks
      if (typeof value === "string" && value === "has younger") {
        if (!Array.isArray(playerValue)) return false;
        const hasYounger = playerValue.some((sib) => sib.age > 0);
        if (!hasYounger) return false;
        continue;
      }

      // Direct equality
      if (playerValue !== value) return false;
    }

    return true;
  }

  getNestedValue(obj, path) {
    const keys = path.split(".");
    let value = obj;

    for (const key of keys) {
      if (value === null || value === undefined) return undefined;
      value = value[key];
    }

    return value;
  }

  compareValues(playerValue, operator, compareValue) {
    switch (operator) {
      case ">":
        return playerValue > compareValue;
      case "<":
        return playerValue < compareValue;
      case ">=":
        return playerValue >= compareValue;
      case "<=":
        return playerValue <= compareValue;
      case "==":
      case "===":
        return playerValue === compareValue;
      case "!=":
      case "!==":
        return playerValue !== compareValue;
      default:
        return false;
    }
  }

  setNestedValue(obj, path, value) {
    const keys = path.split(".");
    const lastKey = keys.pop();
    let target = obj;

    for (const key of keys) {
      if (!(key in target)) target[key] = {};
      target = target[key];
    }

    target[lastKey] = value;
  }

  // ============================================================================
  // PHASE 3: HOMEOSTATIC DRIFT SYSTEMS
  // ============================================================================

  processYearEnd(player = this.player) {
    if (!player.alive) return { alive: false };

    // 1. Age up
    player.demographics.age++;

    // 2. Drift all homeostatic systems
    this.driftHealth(player);
    this.driftEconomics(player);
    this.driftRelationships(player);
    this.processCognitiveDevelopment(player);

    // 3. Process life stage transitions
    this.processLifeStageTransitions(player);

    // 4. Recalculate survival from all states
    this.calculateSurvivalFromState(player);

    // 5. Death check
    const deathResult = this.deathCheck(player);
    if (!deathResult.alive) {
      player.alive = false;
      player.causeOfDeath = deathResult.cause;
    }

    return deathResult;
  }

  driftHealth(player) {
    const p = player;

    // Physical health: recover toward baseline, but chronic conditions limit it
    if (p.health.physical.current < p.health.physical.baseline) {
      p.health.physical.current += p.health.physical.drift;
      p.health.physical.current = Math.min(
        p.health.physical.current,
        p.health.physical.baseline
      );
    }

    // Chronic conditions lower baseline
    if (p.health.physical.chronic.includes("diabetes")) {
      p.health.physical.baseline = Math.min(p.health.physical.baseline, 60);
    }
    if (p.health.physical.chronic.includes("asthma")) {
      p.health.physical.baseline = Math.min(p.health.physical.baseline, 70);
    }

    // Mental health: recover toward baseline
    if (p.health.mental.current < p.health.mental.baseline) {
      p.health.mental.current += p.health.mental.drift;
      p.health.mental.current = Math.min(
        p.health.mental.current,
        p.health.mental.baseline
      );
    }

    // Mental health decline if untreated
    if (p.health.mental.current < 30 && !p.health.mental.chronic.includes("treated")) {
      p.health.mental.baseline = Math.max(0, p.health.mental.baseline - 0.5);
    }

    // Age-based decline after 60
    if (p.demographics.age > 60) {
      p.health.physical.baseline = Math.max(20, p.health.physical.baseline - 1);
    }

    // Age-based decline after 75
    if (p.demographics.age > 75) {
      p.health.physical.baseline = Math.max(15, p.health.physical.baseline - 2);
    }

    this.clampPlayerStats();
  }

  driftEconomics(player) {
    const p = player;

    // Calculate drift based on income vs expenses
    let baseLiving = 10;
    let childrenCost = p.relationships.children.length * 5;
    let medicalCost = p.health.physical.chronic.length * 3;
    let houseCost = p.circumstances.housing.quality / 10;

    let drift = p.economics.income.current - (baseLiving + childrenCost + medicalCost + houseCost);

    p.economics.resources.current += drift;

    // Accumulate debt if resources go negative
    if (p.economics.resources.current < 0) {
      p.economics.debt += Math.abs(p.economics.resources.current);
      p.economics.resources.current = 0;
    }

    // Resources slowly recover if you have surplus
    if (p.economics.resources.current > p.economics.resources.baseline) {
      p.economics.resources.current = Math.max(
        p.economics.resources.baseline,
        p.economics.resources.current - 2
      );
    }

    this.clampPlayerStats();
  }

  driftRelationships(player) {
    const p = player;

    // Parent relationships slowly deteriorate if they die
    if (!p.relationships.parents.mother.alive) {
      // Mother is dead
    } else if (p.demographics.age > 18) {
      // Adult relationships with parents slowly stabilize
      p.relationships.parents.mother.relationship = Math.min(
        100,
        p.relationships.parents.mother.relationship + 0.1
      );
    }

    // Sibling relationships evolve with age
    p.relationships.siblings.forEach((sib) => {
      if (sib.alive && p.demographics.age < 60) {
        sib.relationship = Math.max(0, sib.relationship - 0.5); // Slight drift apart over time
      }
    });

    // Partner relationship: if married, slight improvement; if not married but exists, slight decline
    if (p.relationships.social.married) {
      p.relationships.partner.relationship = Math.min(
        100,
        p.relationships.partner.relationship + 0.2
      );
    } else if (p.relationships.partner.exists) {
      p.relationships.partner.relationship = Math.max(
        0,
        p.relationships.partner.relationship - 0.5
      );
    }

    // Social isolation if no friends and no family support
    if (
      p.relationships.social.friends === 0 &&
      !p.relationships.social.married &&
      p.relationships.children.length === 0
    ) {
      p.relationships.social.isolation = true;
    } else {
      p.relationships.social.isolation = false;
    }
  }

  processCognitiveDevelopment(player) {
    const p = player;
    const age = p.demographics.age;

    // Update development phase
    if (age < 2) {
      p.development.cognitive.developmentPhase = "infancy";
    } else if (age < 12) {
      p.development.cognitive.developmentPhase = "childhood";
      if (!p.development.education.literate && p.development.education.inSchool) {
        // Learning to read while in school
        if (Math.random() < 0.3) {
          p.development.education.literate = true;
        }
      }
    } else if (age < 18) {
      p.development.cognitive.developmentPhase = "adolescent";
      // Sexual development
      if (
        p.demographics.sex === "female" &&
        !p.health.reproductive.menarche &&
        age >= 10 &&
        age <= 16
      ) {
        if (Math.random() < 0.15) {
          p.health.reproductive.menarche = true;
        }
      }
    } else if (age < 65) {
      p.development.cognitive.developmentPhase = "adult";
    } else {
      p.development.cognitive.developmentPhase = "decline";
      p.development.cognitive.decline += 1;
      p.development.cognitive.baseline = Math.max(
        30,
        p.development.cognitive.baseline - 0.5
      );
    }
  }

  processLifeStageTransitions(player) {
    const p = player;
    const age = p.demographics.age;

    // Age-dependent vulnerability flags
    if (age < 5) {
      p.circumstances.vulnerability.dependent = true;
    } else if (age > 65) {
      p.circumstances.vulnerability.elderly = true;
      p.circumstances.vulnerability.dependent = true;
    } else {
      p.circumstances.vulnerability.dependent = false;
    }

    // Menopause (female, around age 50)
    if (
      p.demographics.sex === "female" &&
      age >= 45 &&
      age <= 55 &&
      !p.health.reproductive.menopause &&
      Math.random() < 0.1
    ) {
      p.health.reproductive.menopause = true;
      p.health.reproductive.fertile = false;
      p.health.mental.current -= 10; // Emotional impact
    }

    // Reproductive decline
    if (p.demographics.sex === "female" && age > 40) {
      p.health.reproductive.fertile = false;
    }
  }

  calculateSurvivalFromState(player) {
    const p = player;

    let baseSurvival = p.survival;

    // Health heavily impacts survival
    if (p.health.physical.current < 30) baseSurvival -= 15;
    else if (p.health.physical.current < 50) baseSurvival -= 8;

    if (p.health.mental.current < 20) baseSurvival -= 15; // Severe depression/despair
    else if (p.health.mental.current < 40) baseSurvival -= 8;

    // Chronic conditions reduce survival
    if (p.health.physical.chronic.includes("diabetes")) baseSurvival -= 8;
    if (p.health.physical.chronic.includes("heart_disease")) baseSurvival -= 12;
    if (p.health.physical.chronic.length > 0) baseSurvival -= 3 * p.health.physical.chronic.length;

    // Economic stress
    if (p.economics.resources.current < 5) baseSurvival -= 8;
    if (p.economics.debt > 50) baseSurvival -= 10;

    // Social support buffers
    if (p.relationships.social.isolation) baseSurvival -= 12;
    if (p.relationships.social.friends === 0) baseSurvival -= 5;
    if (p.relationships.social.married) baseSurvival += 5;

    // Life circumstances
    if (p.circumstances.housing.status === "homeless") baseSurvival -= 25;
    if (p.circumstances.housing.status === "unstable") baseSurvival -= 15;
    if (p.circumstances.location.displaced) baseSurvival -= 15;
    if (p.circumstances.location.refugee) baseSurvival -= 20;

    // Disability
    if (p.circumstances.vulnerability.disabled) baseSurvival -= 10;

    // Age-based survival curves
    if (p.demographics.age < 1) baseSurvival -= 20; // Infancy is dangerous
    if (p.demographics.age >= 80) baseSurvival -= 5; // Elderly decline
    if (p.demographics.age >= 90) baseSurvival -= 10; // Very elderly

    p.survival = Math.max(1, Math.min(99, baseSurvival));
  }

  // ============================================================================
  // PHASE 4: EVENT EFFECT APPLICATION
  // ============================================================================

  applyEventEffects(event, player = this.player) {
    if (!event.effects) return;

    // Effects are an array of {path, type, value} objects
    if (!Array.isArray(event.effects)) {
      console.warn('Event effects must be an array:', event);
      return;
    }

    for (const effect of event.effects) {
      if (!effect || !effect.path) continue;
      this.applyEffect(player, effect.path, effect.value, effect.type);
    }

    this.clampPlayerStats();
  }

  applyEffect(player, path, value, type = 'modify') {
    if (!path) return;

    const current = this.getNestedValue(player, path);

    // Handle direct assignment (type: 'set')
    if (type === 'set') {
      this.setNestedValue(player, path, value);
      return;
    }

    // Handle numeric modifications (type: 'modify')
    if (type === 'modify' && typeof value === 'number' && typeof current === 'number') {
      this.setNestedValue(player, path, current + value);
      return;
    }

    // Handle boolean assignments
    if (typeof value === 'boolean') {
      this.setNestedValue(player, path, value);
      return;
    }

    // Handle array operations (type: 'add' or 'remove')
    if (type === 'add' && Array.isArray(current)) {
      if (!current.includes(value)) {
        current.push(value);
      }
      return;
    }

    if (type === 'remove' && Array.isArray(current)) {
      const idx = current.indexOf(value);
      if (idx > -1) current.splice(idx, 1);
      return;
    }

    // Direct assignment
    this.setNestedValue(player, path, value);
  }

  // ============================================================================
  // DEATH CHECK
  // ============================================================================

  deathCheck(player = this.player) {
    const roll = Math.floor(Math.random() * 100) + 1;

    if (roll > player.survival) {
      // DEATH
      const validDeaths = this.deathCards.filter((card) => {
        const [minAge, maxAge] = card.ageRange;
        return player.demographics.age >= minAge && player.demographics.age <= maxAge;
      });

      // Weight by player state (if diabetic, more likely diabetes death, etc.)
      const causeOfDeath = this.weightedDrawDeath(validDeaths, player);

      return {
        alive: false,
        roll,
        survival: player.survival,
        age: player.demographics.age,
        cause: {
          name: causeOfDeath.name,
          description: causeOfDeath.description
        }
      };
    }

    return {
      alive: true,
      roll,
      survival: player.survival,
      age: player.demographics.age
    };
  }

  weightedDrawDeath(deaths, player) {
    // Simple weighted draw for now, could be made more sophisticated
    if (deaths.length === 0) {
      return {
        name: "Unknown",
        description: "The cause of death remains unknown."
      };
    }

    const totalWeight = deaths.reduce((sum, d) => sum + (d.weight || 1), 0);
    let random = Math.random() * totalWeight;

    for (const death of deaths) {
      const weight = death.weight || 1;
      if (random < weight) return death;
      random -= weight;
    }

    return deaths[deaths.length - 1];
  }

  // ============================================================================
  // SCORING (Updated for v2)
  // ============================================================================

  calculateScore(player = this.player) {
    const yearsLived = player.demographics.age;
    const lifeExpectancy = player.lifeExpectancy;

    // Difficulty multiplier
    let multiplier = 1;
    const tags = player.profileTags;
    if (tags.includes("conflict") || tags.includes("extreme-risk")) multiplier = 5;
    else if (tags.includes("low-resource")) multiplier = 3;
    else if (tags.includes("emerging") || tags.includes("moderate-resource")) multiplier = 2;
    else if (tags.includes("high-resource")) multiplier = 1;

    let score = yearsLived * multiplier;

    // Milestones
    if (yearsLived >= 18) score += 10;
    if (yearsLived >= 60) score += 20;
    if (yearsLived >= 80) score += 50;

    // Life expectancy bonus
    const yearsOverExpectancy = yearsLived - lifeExpectancy;
    if (yearsOverExpectancy > 0) {
      score += yearsOverExpectancy * 10;
    }

    // Education bonus
    if (player.development.education.literate) score += 10;
    if (player.development.education.level === "secondary") score += 15;
    if (player.development.education.level === "tertiary") score += 30;

    // Relationship bonus
    if (player.relationships.social.married) score += 10;
    score += player.relationships.children.length * 5;

    // Caregiver bonus
    if (player.circumstances.vulnerability.caregiver) score += 15;

    // Fold penalty
    if (player.folded) {
      score = Math.floor(score * 0.7);
    }

    return Math.floor(score);
  }

  // ============================================================================
  // SUMMARY
  // ============================================================================

  getSummary(player = this.player) {
    return {
      age: player.demographics.age,
      alive: player.alive,
      folded: player.folded,
      sex: player.demographics.sex,
      causeOfDeath: player.causeOfDeath?.name || null,
      birthRegion: player.demographics.birthRegion,
      lifeExpectancy: player.lifeExpectancy,
      yearsOverUnder: player.demographics.age - player.lifeExpectancy,
      finalScore: this.calculateScore(player),
      education: player.development.education.level,
      children: player.relationships.children.length,
      married: player.relationships.social.married,
      chronicConditions: player.health.physical.chronic,
      eventHistory: player.eventHistory
    };
  }

  // ============================================================================
  // FOLD MECHANIC
  // ============================================================================

  foldLife(player = this.player) {
    if (!player.alive) {
      return { error: "Player is already dead" };
    }

    player.alive = false;
    player.folded = true;
    player.causeOfDeath = {
      name: "Voluntary Fold",
      description: "You chose to fold this life."
    };

    return {
      folded: true,
      age: player.demographics.age,
      finalScore: this.calculateScore(player)
    };
  }
}

// Export for use in Node.js or bundlers
if (typeof module !== "undefined" && module.exports) {
  module.exports = MortalityGameV2;
}
