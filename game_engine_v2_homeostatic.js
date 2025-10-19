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
  // REALISTIC DEMOGRAPHICS DATA
  // ============================================================================

  // Regional marriage age statistics (UN/World Bank data)
  getMarriageAgeStats(birthCardName) {
    const stats = {
      "Nordic Country": { median: 31, min: 22, max: 45 },
      "Western Europe": { median: 30, min: 22, max: 45 },
      "Japan/South Korea": { median: 31, min: 25, max: 45 },
      "North America - Middle Class": { median: 28, min: 20, max: 45 },
      "Eastern Europe": { median: 26, min: 20, max: 40 },
      "Urban China": { median: 27, min: 23, max: 42 },
      "Urban Latin America": { median: 25, min: 18, max: 38 },
      "Southeast Asia": { median: 23, min: 15, max: 35 },
      "Rural India": { median: 21, min: 14, max: 32 },
      "Sub-Saharan Africa": { median: 19, min: 12, max: 30 },
      "Middle East / North Africa": { median: 22, min: 15, max: 35 },
      "Rural Southeast Asia": { median: 21, min: 12, max: 32 }
    };
    return stats[birthCardName] || { median: 24, min: 18, max: 40 }; // Default fallback
  }

  // Calculate marriage probability for given age and region
  getMarriageProbabilityAtAge(birthCardName, age) {
    const stats = this.getMarriageAgeStats(birthCardName);
    const { median, min, max } = stats;
    
    // Outside realistic range = 0% probability
    if (age < min || age > max) return 0;
    
    // Gaussian-ish curve centered on median
    const distanceFromMedian = Math.abs(age - median);
    const maxDistance = Math.max(median - min, max - median);
    const probability = Math.pow(1 - (distanceFromMedian / maxDistance), 2);
    
    return Math.max(0, probability);
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
          chronic: [], // ["depression", "ptsd", "anxiety", "bipolar"]
          episodeDuration: 0, // Months in current episode
          treatmentStatus: "none", // "none" | "medicated" | "therapy" | "hospitalized"
          suicideRisk: 0, // 0-100, separate tracking
          lastCrisisAge: null, // When last acute crisis occurred
          suicideHistory: [] // [{age, method, survived}]
        },
        reproductive: {
          fertile: sex === "female" ? true : false,
          pregnant: false,
          childrenBorn: 0,
          menarche: sex === "female" ? false : null,
          menopause: false
        }
      },

      // ========== ADDICTION SYSTEM ==========
      addiction: {
        substance: null, // "alcohol", "opioids", "cannabis", "stimulants", null
        stage: "none", // "none" | "casual" | "regular" | "dependent"
        monthsDuration: 0,
        frequencyPerMonth: 0,
        treatmentStatus: "none", // "none" | "inpatient" | "outpatient" | "recovered"
        craving: 0, // 0-100
        history: [] // [{substance, stagedSince, yearsActive}]
      },

      // ========== CRIME/LEGAL SYSTEM ==========
      legal: {
        citizenship: true,
        documented: true,
        criminalRecord: false,
        convictionCount: 0,
        imprisonmentHistory: [], // [{age, duration, crime}]
        currentlyImprisoned: false,
        imprisonmentEndAge: null,
        reoffenseRisk: 0 // 0-100, reset after time out of prison
      },

      // ========== RELATIONSHIPS (State machine) ==========
      relationships: {
        parents: {
          mother: {
            alive: true,
            present: Math.random() > 0.1, // 90% have mother present
            ageAtBirth: 15 + Math.floor(Math.random() * 35), // 15-50 years old at player birth
            currentAge: null, // Set after birth age is known
            relationship: 70 + Math.random() * 20
          },
          father: {
            alive: true,
            present: Math.random() > 0.25, // 75% have father present
            ageAtBirth: 18 + Math.floor(Math.random() * 40), // 18-58 years old at player birth
            currentAge: null, // Set after birth age is known
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
        housing: {
          status: "stable", // stable, unstable, homeless
          ownership: false,
          quality: 50 // 0-100
        },
        vulnerability: {
          disabled: false,
          elderly: false,
          dependent: true, // Age-based, initially true for children
          caregiver: false,
          orphan: false, // Both parents dead
          halfOrphan: false // One parent dead
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

    // Initialize parent current ages (same as age at birth initially since player is age 0)
    this.player.relationships.parents.mother.currentAge = this.player.relationships.parents.mother.ageAtBirth;
    this.player.relationships.parents.father.currentAge = this.player.relationships.parents.father.ageAtBirth;

    return this.player;
  }

  // ============================================================================
  // HELPER: Generate initial siblings
  // Based on regional demographics (UN data on average children per woman)
  // ============================================================================
  generateSiblings() {
    const birthRegion = this.player?.demographics?.birthRegion || "North America - Middle Class";
    
    // Average family sizes by region (UN World Population data)
    const familySizes = {
      "Nordic Country": { avg: 1.4, max: 4 },
      "Western Europe": { avg: 1.5, max: 4 },
      "Japan/South Korea": { avg: 1.1, max: 3 },
      "North America - Middle Class": { avg: 1.9, max: 5 },
      "Eastern Europe": { avg: 1.4, max: 4 },
      "Urban China": { avg: 1.3, max: 2 }, // One-child policy legacy
      "Urban Latin America": { avg: 1.8, max: 5 },
      "Southeast Asia": { avg: 2.3, max: 6 },
      "Urban South Asia": { avg: 2.1, max: 7 },
      "Rural South Asia": { avg: 3.8, max: 12 },
      "Rural Sub-Saharan Africa": { avg: 5.2, max: 15 },
      "Urban Sub-Saharan Africa": { avg: 3.1, max: 10 },
      "Middle East / North Africa": { avg: 2.9, max: 10 },
      "Sub-Saharan Africa": { avg: 4.7, max: 14 },
      "Active War Zone": { avg: 3.5, max: 12 }
    };

    const stats = familySizes[birthRegion] || familySizes["North America - Middle Class"];
    
    // Generate sibling count using Poisson-like distribution around regional average
    let siblingCount = Math.max(0, Math.round(stats.avg + (Math.random() - 0.5) * 2));
    siblingCount = Math.min(siblingCount, stats.max); // Cap at regional maximum
    
    const siblings = [];
    let playerBirthOrder = Math.floor(Math.random() * (siblingCount + 1)); // 0 = oldest, siblingCount = youngest

    for (let i = 0; i < siblingCount; i++) {
      // Age gap: if player is oldest, all siblings are younger
      // if player is youngest, all siblings are older
      // if player is middle, mix of older and younger
      let ageGap;
      
      if (i < playerBirthOrder) {
        // Older siblings
        ageGap = -(Math.floor(Math.random() * 6) + 1); // 1-6 years older
      } else if (i >= playerBirthOrder) {
        // Younger siblings
        ageGap = Math.floor(Math.random() * 6) + 1; // 1-6 years younger
      }

      // Age-appropriate survival rates (higher child mortality in poor regions)
      let survivalRate = 0.95;
      if (["Rural Sub-Saharan Africa", "Sub-Saharan Africa", "Rural South Asia", "Active War Zone"].includes(birthRegion)) {
        survivalRate = 0.85; // 15% infant/child mortality in high-mortality regions
      } else if (["Urban South Asia", "Southeast Asia", "Urban Sub-Saharan Africa"].includes(birthRegion)) {
        survivalRate = 0.90;
      }

      siblings.push({
        age: ageGap,
        alive: Math.random() < survivalRate,
        relationship: 70 + Math.random() * 20,
        sex: Math.random() > 0.5 ? "male" : "female",
        birthOrder: i // 0 = oldest, increasing for younger
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

  clampPlayerStats(player = this.player) {
    const p = player;
    p.health.physical.current = Math.max(
      0,
      Math.min(100, p.health.physical.current)
    );
    p.health.physical.baseline = Math.max(
      1,
      Math.min(100, p.health.physical.baseline)
    );
    p.health.mental.current = Math.max(
      0,
      Math.min(100, p.health.mental.current)
    );
    p.health.mental.baseline = Math.max(
      1,
      Math.min(100, p.health.mental.baseline)
    );
    p.survival = Math.max(1, Math.min(99, p.survival));
    p.economics.resources.current = Math.max(
      0,
      p.economics.resources.current
    );

    // Update orphan status based on parent state
    const motherAlive = p.relationships.parents.mother.alive;
    const fatherAlive = p.relationships.parents.father.alive;
    
    if (!motherAlive && !fatherAlive) {
      p.circumstances.vulnerability.orphan = true;
      p.circumstances.vulnerability.halfOrphan = false;
    } else if (!motherAlive || !fatherAlive) {
      p.circumstances.vulnerability.halfOrphan = true;
      p.circumstances.vulnerability.orphan = false;
    } else {
      p.circumstances.vulnerability.orphan = false;
      p.circumstances.vulnerability.halfOrphan = false;
    }
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

      // Handle parent death eligibility: "relationships.parents.mother.canDie": true
      // A parent can only die if they're alive AND statistically plausible for their age
      if (key === "relationships.parents.mother.canDie" || key === "relationships.parents.father.canDie") {
        const parent = key.includes("mother") ? player.relationships.parents.mother : player.relationships.parents.father;
        const parentDead = !parent.alive;
        
        // Get survival odds for parent's current age
        const survivalOdds = this.getParentSurvivalOdds(parent.currentAge);
        const mortalityOdds = 1 - survivalOdds; // Probability parent dies this year
        
        // If value is true, parent can die only if:
        // - Parent is alive, AND
        // - We pass the mortality probability check (probabilistic)
        if (value === true) {
          if (parentDead || Math.random() > mortalityOdds) return false;
        } else if (value === false) {
          // Parent cannot die if already dead OR if we fail the mortality check
          if (!parentDead && Math.random() <= mortalityOdds) return false;
        }
        continue;
      }

      // Handle divorce eligibility: "relationships.partner.canDivorce": true
      // Marriage can only end if married AND probabilistically (based on duration)
      if (key === "relationships.partner.canDivorce") {
        const partner = player.relationships.partner;
        const isMarried = partner.exists && partner.married;
        
        if (!isMarried) return false; // Can't divorce if not married
        
        // Calculate marriage duration
        const marriageDuration = player.demographics.age - (partner.since || player.demographics.age);
        
        // Get survival odds for marriage (complement = divorce odds)
        const survivalOdds = this.getMarriageSurvivalOdds(marriageDuration);
        const divorceOdds = 1 - survivalOdds; // Probability divorce happens this year
        
        // If value is true, divorce can happen only if:
        // - Marriage exists AND
        // - We pass the divorce probability check (probabilistic)
        if (value === true) {
          if (!isMarried || Math.random() > divorceOdds) return false;
        } else if (value === false) {
          // Divorce cannot happen if not married OR if we fail the divorce check
          if (isMarried && Math.random() <= divorceOdds) return false;
        }
        continue;
      }

      // Handle marriage eligibility: "relationships.partner.canMarry": true
      // Can only marry at realistic age for region, AND not already married
      if (key === "relationships.partner.canMarry") {
        const partner = player.relationships.partner;
        const isAlreadyMarried = partner.exists && partner.married;
        
        if (isAlreadyMarried) return false; // Can't marry twice
        
        // Get marriage probability for this age and region
        const marriageProbability = this.getMarriageProbabilityAtAge(
          player.demographics.birthRegion,
          player.demographics.age
        );
        
        // If value is true, can marry only if:
        // - Not already married, AND
        // - Age is within realistic range for region AND probabilistically
        if (value === true) {
          if (marriageProbability === 0 || Math.random() > marriageProbability) return false;
        } else if (value === false) {
          // Cannot marry if already married OR if in an age where marriage is realistic
          if (!isAlreadyMarried && Math.random() <= marriageProbability) return false;
        }
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
    player.age = player.demographics.age; // Keep in sync

    // 1b. Age parents
    if (player.relationships.parents.mother.ageAtBirth !== null) {
      player.relationships.parents.mother.currentAge = 
        player.relationships.parents.mother.ageAtBirth + player.demographics.age;
    }
    if (player.relationships.parents.father.ageAtBirth !== null) {
      player.relationships.parents.father.currentAge = 
        player.relationships.parents.father.ageAtBirth + player.demographics.age;
    }

    // 2. Drift all homeostatic systems
    this.driftHealth(player);
    this.driftEconomics(player);
    this.driftMentalHealthCrisis(player);
    this.driftAddiction(player);
    const crimeResult = this.driftCrimeRisk(player);
    if (crimeResult && crimeResult.cause === "incarceration") {
      // Crime result will be processed in death check if needed
    }
    this.driftIsolation(player);
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

    // FAMILY CROWDING: Multiple siblings during childhood affects mental health
    // Crowded households create stress, but siblings can also provide support
    if (p.demographics.age < 18 && p.relationships.siblings && p.relationships.siblings.length > 0) {
      const aliveSliblings = p.relationships.siblings.filter(s => s.alive).length;
      
      if (aliveSliblings >= 3) {
        // 3+ siblings: household is very crowded
        // Mental health slight decline (stress), but also more immune exposure
        p.health.mental.current = Math.max(
          0,
          p.health.mental.current - (0.3 * aliveSliblings)
        );
        // But shared illness exposure helps build immunity
        p.health.physical.baseline = Math.max(
          40,
          p.health.physical.baseline - (0.2 * aliveSliblings)
        );
      } else if (aliveSliblings === 1 || aliveSliblings === 2) {
        // 1-2 siblings: moderate benefit
        // Social support from siblings helps mental health
        p.health.mental.current = Math.min(
          100,
          p.health.mental.current + (0.5 * aliveSliblings)
        );
      }
    }

    this.clampPlayerStats(player);
  }

  driftEconomics(player) {
    const p = player;

    // Calculate drift based on income vs expenses
    let baseLiving = 10;
    
    // SIBLINGS: Up to age 18, siblings create household burden
    // Vulnerability increases for youngest children (last born)
    // Older siblings can contribute to household
    let siblingCost = 0;
    let vulnerabilityFromBirthOrder = 0;
    
    if (p.demographics.age < 18 && p.relationships.siblings && p.relationships.siblings.length > 0) {
      const aliveSliblings = p.relationships.siblings.filter(s => s.alive).length;
      const totalSiblings = p.relationships.siblings.length;
      
      // Determine player's birth order relative to alive siblings
      const olderSiblings = p.relationships.siblings.filter(s => s.alive && s.age < 0).length;
      const playerBirthOrder = olderSiblings; // 0 = oldest
      const isYoungest = playerBirthOrder === totalSiblings - 1 || totalSiblings === 0;
      
      if (p.demographics.age < 12) {
        // Young years: each sibling costs 4 resources/year (food, care, housing)
        siblingCost = aliveSliblings * 4;
        
        // Youngest child in large family has increased vulnerability
        // (parents prioritize oldest for limited resources)
        if (isYoungest && aliveSliblings >= 5) {
          vulnerabilityFromBirthOrder = 0.15; // 15% additional mortality risk
        } else if (isYoungest && aliveSliblings >= 3) {
          vulnerabilityFromBirthOrder = 0.08; // 8% additional mortality risk
        }
      } else {
        // Teen years: siblings cost less (2) - they can contribute
        siblingCost = aliveSliblings * 2;
        
        // Older siblings can help reduce burden
        if (olderSiblings >= 2) {
          siblingCost = Math.max(0, siblingCost - 1); // Oldest siblings help
        }
      }
    }
    
    let childrenCost = p.relationships.children.length * 5;
    let medicalCost = p.health.physical.chronic.length * 3;
    let houseCost = p.circumstances.housing.quality / 10;

    let drift = p.economics.income.current - (baseLiving + siblingCost + childrenCost + medicalCost + houseCost);

    p.economics.resources.current += drift;

    // STARVATION RISK: If resources critically low, immediate health impact
    // This models malnutrition/starvation deaths (71/sec globally)
    if (p.economics.resources.current < 0 && p.demographics.age < 18) {
      const starvationIntensity = Math.abs(p.economics.resources.current);
      
      // Physical health degradation from starvation
      p.health.physical.current = Math.max(
        5, // Don't go below 5 to avoid automatic death
        p.health.physical.current - (starvationIntensity * 0.5)
      );
      
      // Additional vulnerability for youngest in large families
      if (vulnerabilityFromBirthOrder > 0) {
        p.survival = Math.max(1, p.survival - (starvationIntensity * vulnerabilityFromBirthOrder));
      }
    }

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

    this.clampPlayerStats(player);
  }

  // ============================================================================
  // MENTAL HEALTH CRISIS & SUICIDE MECHANICS
  // ============================================================================

  driftMentalHealthCrisis(player) {
    const p = player;
    
    // Track episode duration
    if (p.health.mental.current < p.health.mental.baseline - 10) {
      p.health.mental.episodeDuration += 1;
    } else {
      p.health.mental.episodeDuration = 0;
    }

    // Formation of chronic conditions based on duration and severity
    // Depression: 12+ months at < 30
    if (p.health.mental.current < 30 && p.health.mental.episodeDuration >= 12) {
      if (!p.health.mental.chronic.includes("depression")) {
        p.health.mental.chronic.push("depression");
      }
    }

    // Anxiety: Two crises within 12 months
    if (p.health.mental.episodeDuration >= 6 && p.health.mental.current < 25) {
      if (!p.health.mental.chronic.includes("anxiety")) {
        p.health.mental.chronic.push("anxiety");
      }
    }

    // Permanent baseline reduction from chronic untreated illness
    if (p.health.mental.current < 30 && p.health.mental.treatmentStatus === "none" && p.health.mental.episodeDuration >= 24) {
      p.health.mental.baseline = Math.max(40, p.health.mental.baseline - 1);
    }

    // Baseline reduction for those with chronic depression
    if (p.health.mental.chronic.includes("depression") && p.health.mental.treatmentStatus === "none") {
      p.health.mental.baseline = Math.max(35, p.health.mental.baseline - 0.5);
    }

    // Calculate suicide risk annually
    this.calculateSuicideRisk(player);
  }

  calculateSuicideRisk(player) {
    const p = player;
    let suicideRisk = 0.01; // Base 0.01% risk

    // Mental health factors (primary risk)
    if (p.health.mental.current < 10) suicideRisk += 2.0;
    else if (p.health.mental.current < 20) suicideRisk += 1.0;
    else if (p.health.mental.current < 30) suicideRisk += 0.3;
    else if (p.health.mental.current < 40) suicideRisk += 0.1;

    // Duration of low mental health (vulnerability accumulation)
    if (p.health.mental.episodeDuration >= 12 && p.health.mental.current < 30) {
      suicideRisk += 0.5;
    } else if (p.health.mental.episodeDuration >= 6 && p.health.mental.current < 30) {
      suicideRisk += 0.3;
    }

    // Social isolation
    if (p.relationships.social.isolation && p.relationships.social.friends === 0) {
      suicideRisk += 0.3;
    }
    // Protective factor: marriage/partnership
    if (p.relationships.social.married) {
      suicideRisk = Math.max(0, suicideRisk - 0.2);
    }

    // Prior suicide attempts (sensitization)
    suicideRisk += p.health.mental.suicideHistory.length * 0.5;

    // Substance abuse co-occurrence (powerful risk multiplier)
    if (p.addiction.stage === "dependent") {
      suicideRisk += 0.8;
    } else if (p.addiction.stage === "regular") {
      suicideRisk += 0.3;
    }

    // Chronic mental illness (untreated)
    if (p.health.mental.chronic.includes("depression") && p.health.mental.treatmentStatus === "none") {
      suicideRisk += 0.6;
    }
    if (p.health.mental.chronic.includes("anxiety") && p.health.mental.treatmentStatus === "none") {
      suicideRisk += 0.3;
    }
    if (p.health.mental.chronic.includes("ptsd") && p.health.mental.treatmentStatus === "none") {
      suicideRisk += 0.5;
    }

    // Age factors (peak teen/young adult risk)
    if (p.demographics.age >= 15 && p.demographics.age <= 24) {
      suicideRisk += 0.2;
    } else if (p.demographics.age >= 65) {
      suicideRisk += 0.1;
    } else if (p.demographics.age >= 80) {
      suicideRisk += 0.3;
    }

    // Treatment protective factors
    if (p.health.mental.treatmentStatus === "medicated") {
      suicideRisk -= 0.4;
    }
    if (p.health.mental.treatmentStatus === "therapy") {
      suicideRisk -= 0.5;
    }
    if (p.health.mental.treatmentStatus === "hospitalized") {
      suicideRisk -= 0.7;
    }

    // Cap at realistic range (0.01% to 3% annually)
    p.health.mental.suicideRisk = Math.max(0.01, Math.min(3.0, suicideRisk));
  }

  attemptSuicide(player) {
    const p = player;

    // Determine method (affects lethality)
    const methods = [
      { name: "firearm", lethality: 0.85 },
      { name: "poisoning", lethality: 0.35 },
      { name: "hanging", lethality: 0.70 },
      { name: "jumping", lethality: 0.80 },
      { name: "overdose", lethality: 0.50 }
    ];

    // Method access varies by region (simplified: everyone has some access)
    const method = methods[Math.floor(Math.random() * methods.length)];

    // Emergency access/intervention probability (varies by region/development)
    // Higher in developed nations, lower in low-resource settings
    const interventionChance = 0.3; // 30% chance of intervention/survival
    const actualLethality = method.lethality * (1 - interventionChance);

    // Determine if attempt is fatal
    const roll = Math.random();
    const isFatal = roll < actualLethality;

    // Record attempt
    p.health.mental.suicideHistory.push({
      age: p.demographics.age,
      method: method.name,
      survived: !isFatal
    });

    if (isFatal) {
      return { alive: false, cause: "suicide", method: method.name };
    } else {
      // Survivor: psychological trauma, physical injury, hospitalization
      p.health.mental.current = Math.max(10, p.health.mental.current - 20);
      p.health.physical.current = Math.max(10, p.health.physical.current - 15);
      p.health.mental.chronic.push("ptsd");
      p.health.mental.treatmentStatus = "hospitalized"; // Automatic hospitalization
      p.economics.debt += 20; // Medical costs
      
      return { alive: true, cause: "suicide_attempt_survived", method: method.name };
    }
  }

  // ============================================================================
  // ADDICTION SYSTEM
  // ============================================================================

  driftAddiction(player) {
    const p = player;

    if (p.addiction.stage === "none") {
      // Check for initial substance use triggers
      this.checkSubstanceUseTriggers(player);
      return;
    }

    // Track months in addiction
    p.addiction.monthsDuration += 1;

    // Progression to next stage
    if (p.addiction.stage === "casual") {
      // Casual use: 20% chance to escalate after 12 months
      if (p.addiction.monthsDuration >= 12 && Math.random() < 0.20) {
        p.addiction.stage = "regular";
        p.addiction.monthsDuration = 0;
        p.addiction.frequencyPerMonth = 4; // Weekly use
      }
    } else if (p.addiction.stage === "regular") {
      // Regular use: 40% chance to escalate after 6 months, 60% if stress spike
      const escalateChance = p.health.mental.current < 40 ? 0.60 : 0.40;
      if (p.addiction.monthsDuration >= 6 && Math.random() < escalateChance) {
        p.addiction.stage = "dependent";
        p.addiction.monthsDuration = 0;
        p.addiction.frequencyPerMonth = 20; // Near daily use
      }
    } else if (p.addiction.stage === "dependent") {
      // Health degradation from addiction
      const healthCost = this.getAddictionHealthCost(p.addiction.substance);
      p.health.physical.baseline = Math.max(20, p.health.physical.baseline - healthCost.physical);
      p.health.mental.baseline = Math.max(25, p.health.mental.baseline - healthCost.mental);

      // Overdose risk (varies by substance and treatment status)
      if (p.addiction.treatmentStatus === "none") {
        const overdoseRisk = this.getOverdoseRisk(p.addiction.substance);
        if (Math.random() * 100 < overdoseRisk) {
          return { alive: false, cause: "overdose", substance: p.addiction.substance };
        }
      }

      // Economic impact: funding addiction
      if (p.economics.resources.current > 0) {
        const addictionCost = this.getAddictionEconomicCost(p.addiction.substance);
        p.economics.resources.current -= addictionCost;
        p.addiction.craving = Math.max(0, p.addiction.craving - 5); // Using reduces craving
      } else {
        p.addiction.craving = Math.min(100, p.addiction.craving + 10); // No use increases craving
      }

      // Crime risk increases when can't afford addiction
      if (p.economics.resources.current < 0) {
        p.legal.reoffenseRisk += 1;
      }
    }

    // Recovery attempts
    if (p.addiction.treatmentStatus === "inpatient") {
      if (Math.random() < 0.30) { // 30% recovery chance/year
        p.addiction.stage = "none";
        p.addiction.substance = null;
        p.addiction.monthsDuration = 0;
        p.addiction.treatmentStatus = "recovered";
      }
    } else if (p.addiction.treatmentStatus === "outpatient") {
      if (Math.random() < 0.15) { // 15% recovery chance/year
        p.addiction.stage = "none";
        p.addiction.substance = null;
        p.addiction.monthsDuration = 0;
        p.addiction.treatmentStatus = "recovered";
      }
    }
  }

  checkSubstanceUseTriggers(player) {
    const p = player;
    let useChance = 0.001; // 0.1% base

    // Mental health self-medication risk
    if (p.health.mental.current < 30) useChance += 0.003;

    // Isolation
    if (p.relationships.social.isolation) useChance += 0.002;

    // Trauma history
    if (p.health.mental.chronic.includes("ptsd")) useChance += 0.002;

    // Age factor (peak risk 15-30)
    if (p.demographics.age >= 15 && p.demographics.age <= 30) useChance += 0.002;

    // Unemployment/economic desperation
    if (!p.economics.income.employed && p.economics.resources.current < 5) useChance += 0.002;

    // Determine substance if use is initiated
    if (Math.random() < useChance) {
      const substances = ["alcohol", "cannabis", "opioids", "stimulants"];
      const substance = substances[Math.floor(Math.random() * substances.length)];
      
      p.addiction.substance = substance;
      p.addiction.stage = "casual";
      p.addiction.monthsDuration = 0;
      p.addiction.frequencyPerMonth = 1;
      
      // Record in history
      p.addiction.history.push({
        substance,
        stagedSince: p.demographics.age,
        yearsActive: 0
      });
    }
  }

  getAddictionHealthCost(substance) {
    const costs = {
      alcohol: { physical: 1.5, mental: 0.8 },
      opioids: { physical: 1.2, mental: 1.0 },
      cannabis: { physical: 0.3, mental: 0.5 },
      stimulants: { physical: 2.0, mental: 1.5 }
    };
    return costs[substance] || { physical: 0.5, mental: 0.5 };
  }

  getOverdoseRisk(substance) {
    const risks = {
      alcohol: 0.5, // 0.5% annual risk
      opioids: 1.5, // 1.5% annual risk (highest)
      cannabis: 0.0, // ~0% lethal overdose
      stimulants: 1.0 // 1% annual risk
    };
    return risks[substance] || 0.3;
  }

  getAddictionEconomicCost(substance) {
    const costs = {
      alcohol: 2,
      opioids: 3,
      cannabis: 1,
      stimulants: 2.5
    };
    return costs[substance] || 2;
  }

  // ============================================================================
  // CRIME & INCARCERATION SYSTEM
  // ============================================================================

  driftCrimeRisk(player) {
    const p = player;

    // Skip if already imprisoned
    if (p.legal.currentlyImprisoned) {
      // Imprisoned person eventually released
      if (p.demographics.age >= p.legal.imprisonmentEndAge) {
        p.legal.currentlyImprisoned = false;
        // Post-release: high reoffense risk initially
        p.legal.reoffenseRisk = 70;
        // Isolation increases post-release
        p.relationships.social.isolation = true;
        p.relationships.social.friends = Math.max(0, p.relationships.social.friends - 2);
        // Income penalty
        p.economics.income.current = Math.max(0, p.economics.income.current * 0.5);
      }
      return;
    }

    let crimeRisk = 0.001; // 0.1% base

    // Economic desperation (ages 15-35)
    if (p.demographics.age >= 15 && p.demographics.age <= 35) {
      if (p.economics.resources.current < 0) crimeRisk += 0.012;
      else if (p.economics.resources.current < 5) crimeRisk += 0.005;
    }

    // Mental health/substance abuse
    if (p.health.mental.current < 25) crimeRisk += 0.003;
    if (p.addiction.stage === "dependent") crimeRisk += 0.010;

    // Prior convictions (criminal justice involvement)
    crimeRisk += p.legal.convictionCount * 0.003;

    // Education (protective factor)
    if (p.development.education.level === "university") {
      crimeRisk -= 0.001;
    }

    // Incarceration history increases reoffense risk
    if (p.legal.imprisonmentHistory.length > 0) {
      crimeRisk += 0.003;
    }

    // Crime check
    if (Math.random() * 100 < crimeRisk * 100) {
      return this.commitCrime(player);
    }

    // Post-incarceration reoffense risk decay
    if (p.legal.reoffenseRisk > 0) {
      p.legal.reoffenseRisk = Math.max(0, p.legal.reoffenseRisk - 5); // Decays ~5%/year
    }
  }

  commitCrime(player) {
    const p = player;

    // Determine if crime is detected
    const detectionChance = 0.4 + (p.demographics.age < 18 ? 0.2 : 0); // Younger = more likely caught
    const isDetected = Math.random() < detectionChance;

    if (!isDetected) {
      // Undetected crime: small resource gain, increased paranoia/mental stress
      p.economics.resources.current += 5;
      p.health.mental.current = Math.max(10, p.health.mental.current - 3);
      return null;
    }

    // Detected: arrest and conviction probability
    const convictionChance = 0.65; // 65% detection → conviction rate
    const isConvicted = Math.random() < convictionChance;

    if (!isConvicted) {
      // Arrested but not convicted: legal fees, stress
      p.economics.debt += 10;
      p.health.mental.current = Math.max(10, p.health.mental.current - 5);
      return null;
    }

    // CONVICTED: Incarceration
    const sentence = this.calculateSentence(player); // 1-10 years
    
    p.legal.convictionCount += 1;
    p.legal.criminalRecord = true;
    p.legal.currentlyImprisoned = true;
    p.legal.imprisonmentEndAge = p.demographics.age + sentence;
    
    p.legal.imprisonmentHistory.push({
      age: p.demographics.age,
      duration: sentence,
      crime: "felony"
    });

    // Immediate effects
    p.economics.income.current = 0; // No income while imprisoned
    p.economics.debt += 15; // Legal fees
    p.health.mental.current = Math.max(10, p.health.mental.current - 30); // Trauma
    p.health.mental.chronic.push("ptsd");
    
    // Isolation locked in
    p.relationships.social.isolation = true;

    return { message: "Convicted and imprisoned", sentence, cause: "incarceration" };
  }

  calculateSentence(player) {
    // 1-10 year sentences, varies by prior record
    const baseMax = 10;
    const priorConvictions = player.legal.convictionCount;
    
    const maxSentence = Math.min(baseMax, 5 + priorConvictions);
    return 1 + Math.floor(Math.random() * maxSentence);
  }

  // ============================================================================
  // SOCIAL ISOLATION CASCADE
  // ============================================================================

  driftIsolation(player) {
    const p = player;

    let isolationFactors = 0;

    // Unemployment > 12 months
    if (!p.economics.income.employed) {
      isolationFactors += 1;
    }

    // Disability/illness limiting mobility
    if (p.circumstances.vulnerability.disabled) {
      isolationFactors += 1;
    }

    // Mental health crisis
    if (p.health.mental.current < 30) {
      isolationFactors += 0.5;
    }

    // Incarceration
    if (p.legal.currentlyImprisoned) {
      p.relationships.social.isolation = true;
      return;
    }

    // Substance abuse active
    if (p.addiction.stage === "dependent") {
      isolationFactors += 0.5;
    }

    // Friend loss (death, moving, breakup)
    if (p.relationships.social.friends > 0 && Math.random() < 0.05) {
      p.relationships.social.friends = Math.max(0, p.relationships.social.friends - 1);
    }

    // Check if isolation threshold is crossed
    if (isolationFactors >= 1.5) {
      p.relationships.social.isolation = true;
    }

    // Isolation consequences
    if (p.relationships.social.isolation) {
      // Mental health degradation
      p.health.mental.baseline = Math.max(30, p.health.mental.baseline - 1);
      // Physical health degradation
      p.health.physical.baseline = Math.max(35, p.health.physical.baseline - 0.5);
      // Suicide risk increase
      p.health.mental.suicideRisk += 0.3;
      // Economic impact (lost job networking)
      p.economics.income.current = Math.max(0, p.economics.income.current - 1);
    }

    // Recovery from isolation
    if (p.relationships.social.married) {
      p.relationships.social.isolation = false;
      isolationFactors -= 1;
    }
    if (p.economics.income.employed) {
      isolationFactors -= 0.5;
    }
    if (p.relationships.social.friends >= 3) {
      isolationFactors -= 0.5;
    }
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

    // Suicide risk (major mortality factor for teens/young adults)
    if (p.health.mental.suicideRisk > 1.5) {
      // Roll for suicide attempt
      const suicideRoll = Math.random() * 100;
      if (suicideRoll < p.health.mental.suicideRisk) {
        const suicideResult = this.attemptSuicide(player);
        if (!suicideResult.alive) {
          p.alive = false;
          p.causeOfDeath = suicideResult.cause;
          return; // Early return after suicide
        }
      }
    }

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
    // NOTE: First few years are dangerous but not instant death
    if (p.demographics.age >= 0 && p.demographics.age <= 2) baseSurvival -= 5; // Early infancy
    if (p.demographics.age >= 80) baseSurvival -= 5; // Elderly decline
    if (p.demographics.age >= 90) baseSurvival -= 10; // Very elderly

    // Minimum survival: guarantee reasonable odds at every age
    // Very young/very old get higher floor to avoid instant deaths
    let minSurvival = 20; // Default minimum
    if (p.demographics.age <= 5) minSurvival = 40; // Infants need higher odds
    if (p.demographics.age >= 100) minSurvival = 10; // Extreme age

    p.survival = Math.max(minSurvival, Math.min(99, baseSurvival));
  }

  // ============================================================================
  // PHASE 4: EVENT EFFECT APPLICATION
  // ============================================================================

  // Calculate parent survival probability based on age
  // Returns true if parent should survive this year
  // Used in event prerequisites to make parent death age-appropriate
  getParentSurvivalOdds(parentAge) {
    if (!parentAge || parentAge < 35) return 0.99; // Too young to die of age
    if (parentAge < 50) return 0.98;  // 2% annual mortality
    if (parentAge < 60) return 0.97;  // 3% annual mortality
    if (parentAge < 70) return 0.95;  // 5% annual mortality
    if (parentAge < 80) return 0.90;  // 10% annual mortality
    if (parentAge < 90) return 0.80;  // 20% annual mortality
    return 0.60; // 40% annual mortality at 90+
  }

  // Calculate divorce/separation probability based on marriage duration
  // Returns true if couple should divorce this year (probabilistic)
  // Global average divorce rate ~50%, but varies by region
  getMarriageSurvivalOdds(marriageDuration) {
    if (!marriageDuration || marriageDuration < 1) return 0.98;  // 2% divorce rate year 1
    if (marriageDuration < 3) return 0.96;  // 4% divorce rate years 1-3 (peak)
    if (marriageDuration < 5) return 0.95;  // 5% divorce rate years 3-5
    if (marriageDuration < 10) return 0.97; // 3% divorce rate years 5-10
    return 0.98; // 2% divorce rate after 10 years (more stable)
  }

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

    // SPECIAL: Kill a random sibling (for sibling death events)
    if (path === 'relationships.siblings.kill_random' && value === true) {
      const aliveSiblings = player.relationships.siblings.filter(s => s.alive);
      if (aliveSiblings.length > 0) {
        const randomSibling = aliveSiblings[Math.floor(Math.random() * aliveSiblings.length)];
        randomSibling.alive = false;
      }
      return;
    }

    const current = this.getNestedValue(player, path);

    // Handle special placeholder values
    if (value === 'current_age') {
      value = player.demographics.age;
    }

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
