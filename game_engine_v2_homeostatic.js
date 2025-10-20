// MORTALITY LOTTERY - Game Engine v2: Homeostatic State System
// Replaces simple tag-based model with rich, interconnected state
// Enables complex event chains, realistic progression, and emergent gameplay

const { getGlobalBaseline, getAdjustedProbability, getSuicideMethodsForRegion } = require('./global_statistics_v2.js');
const { shouldBeEmployed, getUnemploymentPenalty } = require('./employment_by_region.js');
const { calculateHouseholdCost, calculateHouseholdIncome, calculateHouseholdCashFlow, getPovertyStatus } = require('./cost_of_living.js');
const { getEducationStage, shouldAttendEducation, getEducationCost, getStressFromIncome } = require('./education_system.js');
const { getCancerIncidence, getStageProgression, getCancerPenalties, shouldDieFromCancer, checkRemission } = require('./cancer_system.js');
const { getAccidentIncidence, getAccidentDisability, shouldDieFromAccident } = require('./accidents_system.js');
const { getSubstanceInitiation, getStageProgression: getSubstanceStageProgression, getSubstancePenalties, checkOverdose, checkTreatmentSuccess } = require('./substance_abuse_system.js');
const DeathTracer = require('./death_trace_system.js');

class MortalityGameV2 {
  constructor(birthCards, familyCards, eventCards, deathCards, tracer = null) {
    this.birthCards = birthCards;
    this.familyCards = familyCards;
    this.eventCards = eventCards;
    this.deathCards = deathCards;
    this.player = null;
    this.deathTracer = tracer || new DeathTracer(); // Enable death tracing by default
  }

  /**
   * Enable or replace the death tracer
   */
  setDeathTracer(tracer) {
    this.deathTracer = tracer;
  }

  /**
   * Disable death tracing (for performance)
   */
  disableDeathTracing() {
    this.deathTracer = null;
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

  // Get regional starting wealth variation (Phase 2A calibration)
  // Poorest regions: 2-5 resources, middle: 10-15, wealthy: 20-30
  getRegionalWealthRange(birthCardName) {
    const wealthMap = {
      // Poorest (subsistence)
      "Sub-Saharan Africa": { min: 2, max: 8 },
      "Rural South Asia": { min: 3, max: 10 },
      "Active War Zone": { min: 1, max: 5 },
      "Fragile/Post-Conflict State": { min: 2, max: 8 },
      
      // Middle income (developing)
      "Urban South Asia": { min: 8, max: 15 },
      "Urban Latin America": { min: 10, max: 18 },
      "Southeast Asia": { min: 8, max: 15 },
      "Urban Sub-Saharan Africa": { min: 8, max: 12 },
      "Rural Latin America": { min: 5, max: 12 },
      "Middle East - Stable": { min: 10, max: 18 },
      
      // Upper middle (developed)
      "Eastern Europe": { min: 12, max: 22 },
      "Urban China": { min: 15, max: 25 },
      "Rural Southeast Asia": { min: 8, max: 15 },
      "Japan/South Korea": { min: 20, max: 30 },
      
      // Wealthy (high development)
      "North America - Middle Class": { min: 20, max: 35 },
      "Western Europe": { min: 22, max: 35 },
      "Nordic Country": { min: 25, max: 40 }
    };
    
    return wealthMap[birthCardName] || { min: 12, max: 20 }; // Default middle
  }

  // Get random wealth value in regional range
  getRegionalWealth(birthCardName) {
    const range = this.getRegionalWealthRange(birthCardName);
    return Math.max(0, range.min + Math.floor(Math.random() * (range.max - range.min + 1)));
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
          // Mental health baseline varies by age - children born with clean slate
          // Ages 0-5: 88 (healthy childhood baseline)
          // Ages 6-11: 82 (pre-adolescence, still resilient)
          // Ages 12-17: 75 (adolescence, mental health onset period)
          // Ages 18+: 65 (adult baseline with more vulnerability)
          current: this.getMentalHealthBaseline(0), // Age 0 at birth
          baseline: this.getMentalHealthBaseline(0),
          drift: 4, // Recover 4 points per year toward baseline (faster recovery)
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
        },

        // ========== CANCER SYSTEM ==========
        cancer: {
          active: false, // Currently diagnosed with cancer
          type: null, // "breast", "lung", "colon", "prostate", "cervical", "liver", "pancreas", "ovarian"
          stage: 0, // 1-4, or 0 if no active cancer
          yearsSinceDiagnosis: 0, // Years since diagnosis
          inRemission: false, // In remission but not cured
          remissionYears: 0, // Years in remission (resets to 0 if recurrence)
          treatmentAccess: false, // Can access treatment
          hasRecurred: false, // Has cancer recurred before
          complications: [], // ["metastasis", "treatmentToxicity", "recurrence"]
          lastStageProgression: 0, // Last year stage progressed
          history: [] // [{type, stage, yearsSinceDiagnosis, outcome}]
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
          occupation: null,
          unemploymentMonths: 0, // Months spent unemployed
          lastEmploymentChange: 0 // Age when employment status last changed
        },
        resources: {
          // Regional wealth variation for Phase 2A calibration
          current: this.getRegionalWealth(birthCard.name),
          baseline: this.getRegionalWealth(birthCard.name),
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
          schoolQuality: 0, // 0-100, affects learning speed
          stages: [], // Track education stages: [{stage: "primary", completed: true, years: 6}]
          cost: 0, // Annual education cost
          stress: 0, // Stress from being in school
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

    // Initialize death tracing if enabled
    if (this.deathTracer) {
      this.deathTracer.initializeLifeLog(this.player);
    }

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

    // Set initial employment status based on age/gender/region
    this.player.economics.income.employed = shouldBeEmployed(
      this.player.demographics.age,
      this.player.demographics.sex,
      this.mapRegionForStatistics(this.player.demographics.birthRegion)
    );

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

    // 1a. Update mental health baseline as they age (childhood resilience → adolescent vulnerability → adult baseline)
    const newBaseline = this.getMentalHealthBaseline(player.demographics.age);
    if (newBaseline !== player.health.mental.baseline) {
      player.health.mental.baseline = newBaseline;
      // Gradually move toward new baseline (don't shock them with huge changes)
      player.health.mental.current = Math.max(
        newBaseline - 20, // Allow some variance from baseline
        Math.min(100, player.health.mental.current + (newBaseline - player.health.mental.baseline) * 0.5)
      );
    }

    // 1b. Age parents
    if (player.relationships.parents.mother.ageAtBirth !== null) {
      player.relationships.parents.mother.currentAge = 
        player.relationships.parents.mother.ageAtBirth + player.demographics.age;
    }
    if (player.relationships.parents.father.ageAtBirth !== null) {
      player.relationships.parents.father.currentAge = 
        player.relationships.parents.father.ageAtBirth + player.demographics.age;
    }

    // 1c. Update employment status based on age/gender/region and random turnover
    this.updateEmploymentStatus(player);

    // 1d. Update education status (compulsory until 16, optional after)
    this.updateEducationStatus(player);

    // 2. Drift all homeostatic systems
    this.driftHealth(player);
    this.driftCancer(player);
    // TODO: Fix accidents system - currently 100x too lethal
    // this.driftAccidents(player);
    this.driftEconomics(player);
    this.driftMentalHealthCrisis(player);
    this.driftAddiction(player);
    // TODO: Fix substance abuse system - overdose rate too high
    // this.driftSubstanceAbuse(player);
    const crimeResult = this.driftCrimeRisk(player);
    if (crimeResult && crimeResult.cause === "incarceration") {
      // Crime result will be processed in death check if needed
    }
    this.driftIsolation(player);
    this.driftRelationships(player);
    this.processCognitiveDevelopment(player);

    // 3. Apply events (15% chance per year)
    const appliedEvent = this.processPossibleEvent(player);
    player.lastEvent = appliedEvent; // Track for testing/debugging

    // 4. Process life stage transitions
    this.processLifeStageTransitions(player);

    // 5. Recalculate survival from all states
    this.calculateSurvivalFromState(player);

    // 6. Death check
    const deathResult = this.deathCheck(player);
    if (!deathResult.alive) {
      player.alive = false;
      player.causeOfDeath = deathResult.cause;
      
      // Log death to tracer (non-suicide deaths)
      if (this.deathTracer && deathResult.cause !== 'Suicide') {
        this.deathTracer.logEvent(player, `DEATH_${deathResult.cause.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`, {
          cause: deathResult.cause,
          age: player.demographics.age,
          roll: deathResult.roll,
          survival: deathResult.survival
        });
      }
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

  // ============================================================================
  // CANCER DRIFT - Annual cancer progression and diagnosis
  // ============================================================================
  
  driftCancer(player) {
    const p = player;
    const cancer = p.health.cancer;

    // Determine if player has treatment access
    const hasAccess = this.getRegionalModifiers()[p.demographics.birthRegion]?.treatmentAccess > 0.5 || false;
    cancer.treatmentAccess = hasAccess;

    // ===== CANCER DIAGNOSIS =====
    // Check for new cancer diagnosis (only if not already diagnosed)
    if (!cancer.active && !cancer.inRemission) {
      // Age 15+: cancer can develop
      if (p.demographics.age >= 15) {
        const additionalFactors = {
          smoking: p.addiction.substance === "tobacco" || p.addiction.history.some(h => h.substance === "tobacco"),
          alcohol: p.addiction.substance === "alcohol" || p.addiction.history.some(h => h.substance === "alcohol"),
          chronic: p.health.physical.chronic
        };

        const diagnosis = getCancerIncidence(
          p.demographics.age,
          p.demographics.sex,
          p.demographics.birthRegion,
          additionalFactors
        );

        if (diagnosis.hasCancer) {
          // NEW CANCER DIAGNOSED
          cancer.active = true;
          cancer.type = diagnosis.type;
          cancer.stage = diagnosis.initialStage;
          cancer.yearsSinceDiagnosis = 0;
          cancer.inRemission = false;
          cancer.treatmentAccess = hasAccess;

          // Track in history
          cancer.history.push({
            type: diagnosis.type,
            stage: diagnosis.initialStage,
            yearDiagnosed: p.demographics.age,
            outcome: "active"
          });

          // Initial mental health hit from diagnosis
          p.health.mental.current = Math.max(10, p.health.mental.current - 10);
        }
      }
    }

    // ===== CANCER PROGRESSION =====
    if (cancer.active) {
      cancer.yearsSinceDiagnosis += 1;

      // Check for stage progression
      const progression = getStageProgression(
        cancer.stage,
        cancer.yearsSinceDiagnosis,
        this.getRegionCode(p.demographics.birthRegion),
        false
      );

      if (progression.progressive && progression.nextStage > cancer.stage) {
        // STAGE ADVANCEMENT
        cancer.stage = progression.nextStage;
        cancer.lastStageProgression = p.demographics.age;

        // Mental health impact from progression
        const mentalImpact = {
          1: -2,
          2: -5,
          3: -8,
          4: -15 // Devastating news
        };
        p.health.mental.current = Math.max(5, p.health.mental.current + (mentalImpact[cancer.stage] || -5));
      }

      // Apply penalties from cancer this year
      const penalties = getCancerPenalties(
        cancer.stage,
        this.getRegionCode(p.demographics.birthRegion),
        hasAccess
      );

      // Physical health decline
      p.health.physical.current = Math.max(5, p.health.physical.current + penalties.physical);
      p.health.physical.baseline = Math.max(10, p.health.physical.baseline + penalties.physical * 0.3);

      // Mental health decline (but not below existential crisis level)
      p.health.mental.current = Math.max(10, p.health.mental.current + penalties.mental);

      // Employment impact (reduces income for advanced stages)
      if (cancer.stage >= 2) {
        const employmentPenalty = penalties.employment * -1; // Convert to income reduction
        p.economics.income.current = Math.max(0, p.economics.income.current + employmentPenalty);
      }

      // Fertility impact (reduced but not eliminated)
      if (cancer.stage >= 2 && p.health.reproductive.fertile) {
        p.health.reproductive.fertile = Math.random() > Math.abs(penalties.fertility);
      }

      // Check for remission (stage 1-2 only)
      if (cancer.stage <= 2 && hasAccess) {
        if (checkRemission(cancer.stage, this.getRegionCode(p.demographics.birthRegion), true)) {
          cancer.active = false;
          cancer.inRemission = true;
          cancer.remissionYears = 0;

          // Mental health boost from remission
          p.health.mental.current = Math.min(100, p.health.mental.current + 15);

          // Update history
          if (cancer.history.length > 0) {
            cancer.history[cancer.history.length - 1].outcome = "remission";
          }
        }
      }

      // Stage 4: Check for cancer-related death this year
      if (cancer.stage === 4) {
        if (shouldDieFromCancer(4, this.getRegionCode(p.demographics.birthRegion), p.demographics.age, hasAccess)) {
          p.alive = false;
          p.causeOfDeath = `Cancer (${cancer.type})`;
          cancer.history[cancer.history.length - 1].outcome = "death";
          return;
        }
      }
    }

    // ===== REMISSION & RECURRENCE =====
    if (cancer.inRemission) {
      cancer.remissionYears += 1;

      // Risk of recurrence increases over time (but rare in first 5 years)
      if (cancer.remissionYears > 5) {
        // Small chance of recurrence per year after 5 years
        if (Math.random() < 0.03) {
          // CANCER RECURS
          cancer.inRemission = false;
          cancer.active = true;
          cancer.hasRecurred = true;
          cancer.stage = Math.min(4, cancer.stage + 1); // Usually returns at higher stage
          cancer.yearsSinceDiagnosis = 0;

          // Mental health crisis
          p.health.mental.current = Math.max(10, p.health.mental.current - 20);

          // Track recurrence
          cancer.history.push({
            type: cancer.type,
            stage: cancer.stage,
            yearDiagnosed: p.demographics.age,
            outcome: "recurrence"
          });
        }
      }
    }
  }

  // Helper: Get region code from birth region name
  getRegionCode(birthRegion) {
    const mapping = {
      "Nordic Country": "nordic",
      "Western Europe": "developed",
      "Japan/South Korea": "developed",
      "North America - Middle Class": "developed",
      "Eastern Europe": "emerging",
      "Urban China": "emerging",
      "Urban Latin America": "developing",
      "Southeast Asia": "developing",
      "Rural India": "developing",
      "Sub-Saharan Africa": "fragile"
    };
    return mapping[birthRegion] || "developing";
  }

  // Helper: Get regional modifiers
  getRegionalModifiers() {
    return {
      "Nordic Country": { treatmentAccess: 0.95 },
      "Western Europe": { treatmentAccess: 0.95 },
      "Japan/South Korea": { treatmentAccess: 0.98 },
      "North America - Middle Class": { treatmentAccess: 0.90 },
      "Eastern Europe": { treatmentAccess: 0.70 },
      "Urban China": { treatmentAccess: 0.80 },
      "Urban Latin America": { treatmentAccess: 0.50 },
      "Southeast Asia": { treatmentAccess: 0.35 },
      "Rural India": { treatmentAccess: 0.15 },
      "Sub-Saharan Africa": { treatmentAccess: 0.10 }
    };
  }

  // ============================================================================
  // ACCIDENTS DRIFT - Annual accident incidence and disability outcomes
  // ============================================================================

  driftAccidents(player) {
    const p = player;

    // Initialize accidents tracking if needed
    if (!p.health.accidents) {
      p.health.accidents = {
        history: [],
        currentDisabilities: [],
        totalAccidents: 0
      };
    }

    const accidents = p.health.accidents;

    // Check for accident occurrence (age dependent, lower for very young/old)
    const accidentChance = getAccidentIncidence(
      p.demographics.age,
      p.demographics.sex,
      p.demographics.birthRegion
    );

    if (accidentChance.hasAccident && Math.random() < accidentChance.probability) {
      // ACCIDENT OCCURS
      const type = accidentChance.type;
      accidents.totalAccidents += 1;

      // Check if accident is fatal
      if (shouldDieFromAccident(
        type,
        p.demographics.age,
        p.demographics.sex,
        p.demographics.birthRegion
      )) {
        p.alive = false;
        p.causeOfDeath = `Accident (${type})`;
        accidents.history.push({
          type: type,
          age: p.demographics.age,
          fatal: true,
          year: p.demographics.age
        });
        return;
      }

      // Non-fatal accident: check for disability
      const disability = getAccidentDisability(
        type,
        p.demographics.age,
        p.demographics.sex,
        p.demographics.birthRegion
      );

      if (disability.hasDisability) {
        // Add new disability
        const newDisability = {
          type: disability.disabilityType,
          severity: disability.severity, // "minor", "moderate", "severe"
          yearAcquired: p.demographics.age,
          mobilityImpaired: disability.mobilityImpaired,
          recoveryRate: disability.recoveryRate // How much recovers per year
        };

        accidents.currentDisabilities.push(newDisability);
        p.health.physical.disability = true;

        // Physical health impact
        const healthImpact = {
          minor: -5,
          moderate: -15,
          severe: -30
        };
        p.health.physical.current = Math.max(10, p.health.physical.current + (healthImpact[disability.severity] || -10));

        // Mental health impact from disability
        p.health.mental.current = Math.max(10, p.health.mental.current + (healthImpact[disability.severity] * 0.5));

        // If mobility impaired, increase isolation risk
        if (disability.mobilityImpaired) {
          p.relationships.social.isolation = true;
        }
      }

      // Track accident in history
      accidents.history.push({
        type: type,
        age: p.demographics.age,
        fatal: false,
        disability: disability.hasDisability,
        disabilityType: disability.disabilityType || null,
        severity: disability.severity || null
      });
    }

    // Process disability recovery/improvement over time
    if (accidents.currentDisabilities && accidents.currentDisabilities.length > 0) {
      for (let i = accidents.currentDisabilities.length - 1; i >= 0; i--) {
        const disability = accidents.currentDisabilities[i];

        // Some disabilities improve slightly each year
        if (disability.recoveryRate && disability.recoveryRate > 0) {
          if (Math.random() < disability.recoveryRate) {
            // Partial recovery
            if (disability.severity === "severe") {
              disability.severity = "moderate";
            } else if (disability.severity === "moderate") {
              disability.severity = "minor";
            } else if (disability.severity === "minor") {
              // Remove minor disability
              accidents.currentDisabilities.splice(i, 1);
              // Physical recovery
              p.health.physical.current = Math.min(100, p.health.physical.current + 3);
            }
          }
        }
      }

      // If no disabilities left, update physical disability status
      if (accidents.currentDisabilities.length === 0) {
        p.health.physical.disability = false;
        p.relationships.social.isolation = false;
      }
    }
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
    let aliveSliblings = 0; // Define at function level, not just in if block
    
    if (p.demographics.age < 18 && p.relationships.siblings && p.relationships.siblings.length > 0) {
      aliveSliblings = p.relationships.siblings.filter(s => s.alive).length;
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
    }    let childrenCost = p.relationships.children.length * 5;
    let medicalCost = p.health.physical.chronic.length * 3;
    let houseCost = p.circumstances.housing.quality / 10;

    // ===== RESOURCE DRIFT BY LIFE STAGE =====
    let drift = 0;

    if (p.demographics.age < 18) {
      // CHILDHOOD (0-17): Resources are family-provided, don't degrade much
      // Baseline is set at birth based on region + family structure
      // Only loses resources if siblings die (fewer people sharing) or parent dies (income drop)
      // Otherwise maintains family baseline
      
      // Small drift only from sibling costs - they share family pool
      // This accounts for larger families having slightly tighter budgets
      if (aliveSliblings > 3) {
        drift = -1; // Large families have very slight resource drain
      } else if (aliveSliblings === 0) {
        drift = 1; // Only child gets slight advantage (more per capita)
      }
      // Otherwise: drift = 0, maintains baseline
      
    } else {
      // ADULTHOOD (18+): Resources depend on personal income vs expenses
      drift = p.economics.income.current - (baseLiving + childrenCost + medicalCost + houseCost);
    }

    p.economics.resources.current += drift;

    // STARVATION RISK: If resources critically low, immediate health impact
    // This models malnutrition/starvation deaths (71/sec globally)
    // For children, this should only happen if family is in extreme poverty (baseline < 5)
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

    // Accumulate debt if resources go negative (mainly adults)
    if (p.economics.resources.current < 0) {
      p.economics.debt += Math.abs(p.economics.resources.current);
      p.economics.resources.current = 0;
    }

    // For children: maintain baseline (family-provided)
    // For adults: resources slowly recover if surplus
    if (p.demographics.age < 18) {
      // Children stay at baseline (family provides)
      p.economics.resources.current = Math.max(
        Math.max(1, p.economics.resources.baseline - 2), // Slightly below baseline is OK
        Math.min(p.economics.resources.baseline + 2, p.economics.resources.current)
      );
    } else if (p.economics.resources.current > p.economics.resources.baseline) {
      // Adults: recover slowly if surplus
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
    
    // ===== SIMULATE LIFE STRESS without explicit events =====
    // Real life includes hardship, setbacks, bad luck that we can't model with events
    // Add annual random stress based on circumstances
    const stressFactors = [];
    
    // Employment stress: Unemployment is highly stressful (especially adults)
    // But only applies occasionally - most months are not crisis months
    if (!p.economics.income.employed && p.demographics.age >= 18 && Math.random() < 0.3) {
      stressFactors.push(1.5);  // 30% chance of unemployment stress
      
      // Long-term unemployment adds more stress
      if (p.economics.income.unemploymentMonths >= 12 && Math.random() < 0.4) {
        stressFactors.push(1.5);  // Extra stress after 1 year (40% chance)
      } else if (p.economics.income.unemploymentMonths >= 6 && Math.random() < 0.2) {
        stressFactors.push(0.5);  // Extra stress after 6 months (20% chance)
      }
    }
    
    // Poverty is stressful - based on actual resources vs baseline
    // If resources < 50% of baseline, occasional stress
    if (p.economics.resources.current < p.economics.resources.baseline * 0.5 && Math.random() < 0.4) {
      stressFactors.push(1);  // Moderate poverty stress (40% chance)
    }
    
    // Destitution (resources < 10% of baseline)
    if (p.economics.resources.current < p.economics.resources.baseline * 0.1 && Math.random() < 0.6) {
      stressFactors.push(2);  // Severe stress (60% chance)
    }
    
    // Social isolation is stressful - but only if not married
    if (p.relationships.social.isolation && !p.relationships.social.married && Math.random() < 0.3) {
      stressFactors.push(0.8);  // Isolation stress (30% chance)
    }
    
    // Health problems are stressful - but chronic conditions are manageable
    if (p.health.physical.current < 40 && Math.random() < 0.3) {
      stressFactors.push(0.5);  // Acute health stress (30% chance)
    }
    if (p.health.physical.chronic.length > 0 && Math.random() < 0.1) {
      stressFactors.push(0.3);  // Chronic illness stress (10% chance - ongoing but managed)
    }
    
    // Debt is stressful (for adults) - but only occasionally
    if (p.demographics.age >= 18 && p.economics.debt > 0 && Math.random() < 0.2) {
      const debtStress = Math.min(1.5, p.economics.debt / 100);  // Smaller stress values
      stressFactors.push(debtStress);
    }
    
    // Apply accumulated stress
    if (stressFactors.length > 0) {
      const totalStress = stressFactors.reduce((a, b) => a + b, 0);
      // Random stress - usually small amounts (mental health is resilient)
      const stress = Math.random() * Math.min(totalStress, 1.5);  // Much smaller max impact
      p.health.mental.current = Math.max(5, p.health.mental.current - stress);
    }
    
    // Track episode duration
    if (p.health.mental.current < p.health.mental.baseline - 10) {
      p.health.mental.episodeDuration += 1;
    } else {
      p.health.mental.episodeDuration = 0;
    }

    // Formation of chronic conditions based on duration and severity
    // Depression: 6+ months at < 35 (lowered from 12m<30 for earlier detection)
    if (p.health.mental.current < 35 && p.health.mental.episodeDuration >= 6) {
      if (!p.health.mental.chronic.includes("depression")) {
        p.health.mental.chronic.push("depression");
      }
    }

    // Anxiety: 4+ months of low mental health (lowered from 6m<25)
    if (p.health.mental.episodeDuration >= 4 && p.health.mental.current < 35) {
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
    
    // Get global baseline suicide risk for this age/gender (WHO data)
    const region = this.mapRegionForStatistics(p.demographics.birthRegion);
    const baseline = getAdjustedProbability("suicide", p.demographics.age, p.demographics.sex, region);
    
    let suicideRisk = baseline;

    // ===== MENTAL HEALTH CRISIS FACTORS =====
    // ACUTE CRISIS: Low mental health indicates current episode
    if (p.health.mental.current < 20) {
      suicideRisk *= 1.8;  // Severe crisis
    } else if (p.health.mental.current < 35) {
      suicideRisk *= 1.2;  // Moderate crisis
    } else if (p.health.mental.current < 50) {
      suicideRisk *= 1.05; // Mild crisis
    }

    // Duration of low mental health (vulnerability accumulation)
    if (p.health.mental.episodeDuration >= 12 && p.health.mental.current < 40) {
      suicideRisk *= 1.5;  // Chronic low mood
    } else if (p.health.mental.episodeDuration >= 6 && p.health.mental.current < 40) {
      suicideRisk *= 1.2;
    }

    // ===== RELATIONSHIP & COMMUNITY STRENGTH =====
    // Calculate total protective support from relationships
    let communityStrength = this.calculateCommunityStrength(player);
    
    // Community strength ranges 0-1 (0=isolated, 1=strong support network)
    // Convert to suicide risk multiplier: 
    // - Strong community (0.8+): 0.5x risk (50% protection)
    // - Moderate (0.5-0.8): 0.7x risk (30% protection)
    // - Weak (0.2-0.5): 1.0x risk (no change)
    // - Isolated (<0.2): 1.3x risk (30% increased risk)
    
    if (communityStrength >= 0.8) {
      suicideRisk *= 0.5;
    } else if (communityStrength >= 0.5) {
      suicideRisk *= 0.7;
    } else if (communityStrength < 0.2) {
      suicideRisk *= 1.3;
    }
    // else 0.2-0.5: stays same (1.0x)

    // Prior suicide attempts (sensitization)
    if (p.health.mental.suicideHistory.length > 0) {
      const multiplier = 1.0 + (p.health.mental.suicideHistory.length * 0.8);
      suicideRisk *= multiplier;
    }

    // Substance abuse co-occurrence
    if (p.addiction.stage === "dependent") {
      suicideRisk *= 2.5;
    } else if (p.addiction.stage === "regular") {
      suicideRisk *= 1.5;
    }

    // Chronic mental illness (untreated)
    if (p.health.mental.chronic.includes("depression") && p.health.mental.treatmentStatus === "none") {
      suicideRisk *= 1.6;
    }
    if (p.health.mental.chronic.includes("anxiety") && p.health.mental.treatmentStatus === "none") {
      suicideRisk *= 1.3;
    }
    if (p.health.mental.chronic.includes("ptsd") && p.health.mental.treatmentStatus === "none") {
      suicideRisk *= 2.0;
    }

    // Treatment protective factors
    if (p.health.mental.treatmentStatus === "medicated") {
      suicideRisk *= 0.6;
    }
    if (p.health.mental.treatmentStatus === "therapy") {
      suicideRisk *= 0.5;
    }
    if (p.health.mental.treatmentStatus === "hospitalized") {
      suicideRisk *= 0.3;
    }

    // Cap and convert to percentage
    p.health.mental.suicideRisk = Math.max(0.0001, Math.min(2.0, suicideRisk * 100));

    // Log mental health crisis if severe
    if (this.deathTracer) {
      if (p.health.mental.current < 20) {
        this.deathTracer.logMentalHealthCrisis(player, 'severe', 
          `Mental health at critical level (${Math.round(p.health.mental.current)}). Episode duration: ${p.health.mental.episodeDuration} months`);
      } else if (p.health.mental.current < 35) {
        this.deathTracer.logMentalHealthCrisis(player, 'moderate',
          `Mental health crisis developing (${Math.round(p.health.mental.current)}). Chronic conditions: ${p.health.mental.chronic.join(', ') || 'none'}`);
      }
    }
  }

  // Calculate weighted community/relationship strength (0-1 scale)
  // Family (most important) → Friends → Employment/Community
  calculateCommunityStrength(player) {
    const p = player;
    let strength = 0;

    // ===== FAMILY BONDS (weighted 50%) =====
    let familyScore = 0;
    
    // Spouse/partner is strongest family bond
    if (p.relationships.partner.exists && p.relationships.social.married) {
      familyScore += 0.4; // Strong marital bond
    } else if (p.relationships.partner.exists) {
      familyScore += 0.25; // Partnership without marriage
    }
    
    // Children (creates mutual care responsibility)
    if (p.relationships.children.length > 0) {
      familyScore += 0.3 * Math.min(1, p.relationships.children.length / 3); // Cap at 0.3 for 3+ kids
    }
    
    // Parents/siblings still living (especially important for young people)
    if (p.demographics.age < 25) {
      if (p.relationships.parents.mother.alive || p.relationships.parents.father.alive) {
        familyScore += 0.2;
      }
      if (p.relationships.siblings && p.relationships.siblings.length > 0) {
        familyScore += 0.15;
      }
    }
    
    // Cap family score at 1.0
    familyScore = Math.min(1.0, familyScore);
    strength += familyScore * 0.5; // Family is 50% of total community strength

    // ===== FRIENDS (weighted 30%) =====
    let friendScore = 0;
    
    const friendCount = p.relationships.social.friends || 0;
    if (friendCount >= 5) {
      friendScore = 1.0; // Strong friend network
    } else if (friendCount >= 3) {
      friendScore = 0.7; // Moderate friend network
    } else if (friendCount >= 1) {
      friendScore = 0.3; // One or two friends
    }
    // else 0 friends = 0 score
    
    strength += friendScore * 0.3; // Friends are 30% of total

    // ===== EMPLOYMENT / COMMUNITY (weighted 20%) =====
    let communityScore = 0;
    
    // Employment creates social structure and community
    if (p.economics.income.employed) {
      communityScore += 0.5; // Regular social interaction through work
    }
    
    // Reduce community score if unemployed (isolation increases)
    if (!p.economics.income.employed && p.demographics.age >= 18) {
      communityScore -= 0.2;
    }
    
    // Community engagement (in events, groups, etc)
    // This is represented by lack of isolation state
    if (!p.relationships.social.isolation) {
      communityScore += 0.3;
    } else {
      communityScore -= 0.2;
    }
    
    // Clamp to 0-1
    communityScore = Math.max(0, Math.min(1, communityScore));
    strength += communityScore * 0.2; // Community is 20% of total

    // Final strength score is 0-1
    // 0 = completely isolated (0 family, 0 friends, unemployed, isolated)
    // 1 = strong support (married + kids + friends + employed)
    return Math.max(0, Math.min(1, strength));
  }

  attemptSuicide(player) {
    const p = player;

    // Get region-specific method availability and lethality
    const region = this.mapRegionForStatistics(p.demographics.birthRegion);
    const methodData = getSuicideMethodsForRegion(region);
    
    // Select method based on regional availability
    // Available methods weighted by their availability
    const availableMethods = methodData.methods.filter(m => Math.random() < m.availability);
    if (availableMethods.length === 0) {
      // Fallback to most available method
      availableMethods.push(methodData.methods[0]);
    }
    
    const method = availableMethods[Math.floor(Math.random() * availableMethods.length)];

    // Calculate actual lethality with intervention chance factored in
    // Lethality is the base success rate, intervention reduces it
    const actualLethality = method.lethality * (1 - method.intervention);

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
      // Log death by suicide
      if (this.deathTracer) {
        this.deathTracer.logDeathBySuicide(player, method.name, {
          mentalHealth: p.health.mental.current,
          suicideRisk: p.health.mental.suicideRisk,
        });
      }
      return { alive: false, cause: "Suicide", method: method.name };
    } else {
      // Survivor: psychological trauma, physical injury, hospitalization
      p.health.mental.current = Math.max(10, p.health.mental.current - 20);
      p.health.physical.current = Math.max(10, p.health.physical.current - 15);
      p.health.mental.chronic.push("ptsd");
      p.health.mental.treatmentStatus = "hospitalized"; // Automatic hospitalization
      p.economics.debt += 20; // Medical costs
      
      // Log survived attempt
      if (this.deathTracer) {
        this.deathTracer.logSuicideAttempt(player, true, method.name, {
          mentalHealth: p.health.mental.current,
          ptsaAcquired: true,
        });
      }
      
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
    let useChance = 0.008; // 0.8% base (8x increase from 0.1% for ~4% prevalence target)

    // Mental health self-medication risk
    if (p.health.mental.current < 30) useChance += 0.015; // Increased from 0.003

    // Isolation
    if (p.relationships.social.isolation) useChance += 0.01; // Increased from 0.002

    // Trauma history
    if (p.health.mental.chronic.includes("ptsd")) useChance += 0.01; // Increased from 0.002

    // Age factor (peak risk 15-30)
    if (p.demographics.age >= 15 && p.demographics.age <= 30) useChance += 0.008; // Increased from 0.002

    // Unemployment/economic desperation
    if (!p.economics.income.employed && p.economics.resources.current < 5) useChance += 0.01; // Increased from 0.002

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
  // SUBSTANCE ABUSE SYSTEM - Separate from addiction (comprehensive drug use model)
  // ============================================================================

  driftSubstanceAbuse(player) {
    const p = player;

    // Initialize substance abuse tracking if needed
    if (!p.health.substanceAbuse) {
      p.health.substanceAbuse = {
        activeSubstances: [],
        history: [],
        totalOverdoses: 0
      };
    }

    const substance = p.health.substanceAbuse;

    // Check for new substance initiation (age 12-50, highest risk 18-30)
    const initiationChance = getSubstanceInitiation(
      p.demographics.age,
      p.demographics.sex,
      p.demographics.birthRegion
    );

    if (initiationChance.initiates) {
      // Check if already using this substance
      const alreadyUsing = substance.activeSubstances.some(s => s.name === initiationChance.substance);

      if (!alreadyUsing && p.demographics.age >= 12 && p.demographics.age <= 50) {
        // NEW SUBSTANCE INITIATION
        const newSubstance = {
          name: initiationChance.substance,
          stage: "casual",
          monthsActive: 0,
          initiationAge: p.demographics.age,
          yearsSinceInitiation: 0
        };

        substance.activeSubstances.push(newSubstance);

        // Initial mental health consequence (experimental phase)
        p.health.mental.current = Math.max(10, p.health.mental.current - 2);
      }
    }

    // Process each active substance
    if (substance.activeSubstances && substance.activeSubstances.length > 0) {
      for (let i = substance.activeSubstances.length - 1; i >= 0; i--) {
        const sub = substance.activeSubstances[i];
        sub.monthsActive += 1;
        sub.yearsSinceInitiation = sub.monthsActive / 12;

        // Progression through stages (casual → regular → dependent)
        const progression = getSubstanceStageProgression(
          sub.name,
          sub.stage,
          sub.yearsSinceInitiation,
          p.demographics.birthRegion
        );

        if (progression.progress) {
          sub.stage = progression.nextStage;
          sub.monthsActive = 0; // Reset progression counter

          // Mental health impact from escalation
          const mentalImpact = {
            "casual": -1,
            "regular": -5,
            "dependent": -15
          };
          p.health.mental.current = Math.max(10, p.health.mental.current + (mentalImpact[sub.stage] || -5));
        }

        // Apply penalties from substance use at this stage
        const penalties = getSubstancePenalties(
          sub.name,
          sub.stage,
          p.demographics.birthRegion
        );

        // Physical health decline
        p.health.physical.current = Math.max(10, p.health.physical.current + penalties.physical);

        // Mental health decline
        p.health.mental.current = Math.max(10, p.health.mental.current + penalties.mental);

        // Employment impact (reduced income for regular/dependent stages)
        if (sub.stage === "regular" || sub.stage === "dependent") {
          const employmentPenalty = penalties.employment * -1;
          p.economics.income.current = Math.max(0, p.economics.income.current + employmentPenalty);
        }

        // Overdose risk check (increases dramatically at dependent stage)
        if (sub.stage === "dependent") {
          const overdoseChance = checkOverdose(
            sub.name,
            sub.yearsSinceInitiation,
            p.demographics.birthRegion
          );

          if (overdoseChance.overdoses && Math.random() < overdoseChance.probability) {
            substance.totalOverdoses += 1;

            // Check if overdose is fatal
            if (overdoseChance.fatal) {
              p.alive = false;
              p.causeOfDeath = `Overdose (${sub.name})`;
              substance.history.push({
                substance: sub.name,
                stage: sub.stage,
                fatal: true,
                ageAtDeath: p.demographics.age,
                yearActive: sub.yearsSinceInitiation
              });
              return;
            } else {
              // Non-fatal overdose: medical intervention, hospitalization
              p.health.physical.current = Math.max(10, p.health.physical.current - 25);
              p.health.mental.current = Math.max(10, p.health.mental.current - 10);
              p.health.mental.chronic.push("ptsd");
              p.health.mental.treatmentStatus = "hospitalized";
              p.economics.debt += 30; // Medical costs
            }
          }
        }

        // Treatment attempt (if dependent and conditions favorable)
        if (sub.stage === "dependent") {
          // Treatment success varies by region and substance
          const treatmentSuccess = checkTreatmentSuccess(
            sub.name,
            p.demographics.birthRegion,
            p.health.mental.treatmentStatus
          );

          if (treatmentSuccess.succeeds && Math.random() < treatmentSuccess.probability) {
            // RECOVERY: Remove substance from active list
            substance.history.push({
              substance: sub.name,
              stage: sub.stage,
              recovered: true,
              ageAtRecovery: p.demographics.age,
              yearActive: sub.yearsSinceInitiation
            });

            substance.activeSubstances.splice(i, 1);

            // Mental health boost from recovery
            p.health.mental.current = Math.min(100, p.health.mental.current + 20);

            // Continue to next substance in loop
            continue;
          }
        }
      }
    }

    // Overall substance abuse burden (more substances = more impact)
    if (substance.activeSubstances.length > 1) {
      // Polydrug use has additional mental health impact
      p.health.mental.current = Math.max(10, p.health.mental.current - (substance.activeSubstances.length * 2));

      // Polydrug use also increases isolation
      p.relationships.social.isolation = true;
    }
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

    // Crime rates vary DRAMATICALLY by age and pathway
    // Street crime (poverty): Peak 18-35
    // White-collar crime (fraud/embezzlement): Peak 35-55
    // Overall WHO estimate: ~140 per 100,000 (varies by country 20-300)

    let crimeRisk = 0; // Will be calculated by pathway
    let crimePath = "none"; // Track which pathway person follows

    // PATHWAY 1: STREET CRIME (theft, burglary, assault) - driven by poverty + age
    if (p.demographics.age >= 15 && p.demographics.age <= 40) {
      // Peak crime age: 18-35
      let streetCrimeRisk = 0.004; // 0.4% base (increased from 0.15% to reach 140/100K target)
      
      // Economic desperation is primary driver
      if (p.economics.resources.current < 0) {
        streetCrimeRisk += 0.06; // Severe desperation (multiplied 7.5x)
      } else if (p.economics.resources.current < 5) {
        streetCrimeRisk += 0.03; // Moderate desperation (multiplied 7.5x)
      }

      // Mental health and substance abuse strongly correlate
      if (p.health.mental.current < 25) streetCrimeRisk += 0.02; // Multiplied 3.3x
      if (p.addiction.stage === "dependent") streetCrimeRisk += 0.025; // Multiplied 3.1x

      // PROTECTIVE FACTORS reduce street crime risk significantly
      // Education is powerful protective: university-educated rarely commit street crime
      if (p.development.education.level === "university") {
        streetCrimeRisk *= 0.1; // 90% reduction
      } else if (p.development.education.level === "secondary") {
        streetCrimeRisk *= 0.5; // 50% reduction
      }

      // Employment and stable relationships protect
      if (p.economics.income.current > 10) {
        streetCrimeRisk *= 0.7; // Employed people less likely
      }
      if (p.relationships.social.married) {
        streetCrimeRisk *= 0.6; // Married people less likely
      }

      crimeRisk = streetCrimeRisk;
      crimePath = "street_crime";
    }
    
    // PATHWAY 2: WHITE-COLLAR CRIME (fraud, embezzlement, tax evasion) - driven by opportunity
    // Requires education + access to systems of value
    else if (p.demographics.age >= 30 && p.demographics.age <= 60) {
      let whiteCollarRisk = 0;

      // White-collar opportunity requires education and employment
      if (p.development.education.level === "university" && p.economics.income.current > 15) {
        whiteCollarRisk = 0.002; // 0.2% base for educated employed (multiplied 2.5x)
        
        // Access to larger sums increases temptation
        if (p.economics.income.current > 30) {
          whiteCollarRisk += 0.001; // Multiplied 2.5x
        }

        // Financial stress even among wealthy can trigger fraud
        if (p.economics.debt > 50) {
          whiteCollarRisk += 0.0015; // Multiplied 3x
        }

        // Mental health crisis affects judgment
        if (p.health.mental.current < 30) {
          whiteCollarRisk += 0.001; // Multiplied 3.3x
        }

        crimePath = "white_collar_crime";
      }

      crimeRisk = whiteCollarRisk;
    }

    // Prior convictions DRAMATICALLY increase reoffense risk (stronger effect)
    crimeRisk += p.legal.convictionCount * 0.006;

    // Incarceration history - once convicted, much higher recidivism
    if (p.legal.imprisonmentHistory.length > 0) {
      crimeRisk += 0.003;
    }

    // Crime check - only commit if risk calculation is non-zero
    if (crimeRisk > 0 && Math.random() * 100 < crimeRisk * 100) {
      return this.commitCrime(player, crimePath);
    }

    // Post-incarceration reoffense risk decay
    if (p.legal.reoffenseRisk > 0) {
      p.legal.reoffenseRisk = Math.max(0, p.legal.reoffenseRisk - 5); // Decays ~5%/year
    }
  }

  commitCrime(player, crimePath = "street_crime") {
    const p = player;

    // Different detection rates by crime type
    let detectionChance = 0.4; // Base: 40% for street crime
    let crimeType = "felony";

    if (crimePath === "white_collar_crime") {
      // White-collar: harder to detect initially but more severe when caught
      detectionChance = 0.25; // 25% chance of detection (audits, investigations)
      crimeType = "fraud";
    } else if (p.demographics.age < 18) {
      // Juveniles more likely caught
      detectionChance += 0.2;
    }

    const isDetected = Math.random() < detectionChance;

    if (!isDetected) {
      // Undetected crime: gain resources/money, guilt stress
      if (crimePath === "white_collar_crime") {
        p.economics.resources.current += 20; // Larger fraud gains
        p.economics.debt -= 10; // Reduces debt through fraud
      } else {
        p.economics.resources.current += 5; // Smaller street crime gains
      }
      p.health.mental.current = Math.max(10, p.health.mental.current - 3);
      return null;
    }

    // Detected: arrest and conviction probability
    let convictionChance = 0.65; // Standard 65% detection → conviction rate
    if (crimePath === "white_collar_crime") {
      convictionChance = 0.45; // White-collar crimes harder to convict (better lawyers)
    }
    
    const isConvicted = Math.random() < convictionChance;

    if (!isConvicted) {
      // Arrested but not convicted: legal fees, stress
      p.economics.debt += 10;
      p.health.mental.current = Math.max(10, p.health.mental.current - 5);
      return null;
    }

    // CONVICTED: Incarceration (length varies by type)
    let sentence = this.calculateSentence(player, crimePath); // 1-10 years for street, 2-8 for white-collar
    
    p.legal.convictionCount += 1;
    p.legal.criminalRecord = true;
    p.legal.currentlyImprisoned = true;
    p.legal.imprisonmentEndAge = p.demographics.age + sentence;
    
    p.legal.imprisonmentHistory.push({
      age: p.demographics.age,
      duration: sentence,
      crime: crimeType
    });

    // Immediate effects of conviction and imprisonment
    p.economics.income.current = 0; // No income while imprisoned
    p.economics.debt += 15; // Legal fees
    p.health.mental.current = Math.max(10, p.health.mental.current - 30); // Trauma
    p.health.mental.chronic.push("ptsd");
    
    // Isolation locked in
    p.relationships.social.isolation = true;

    return { message: "Convicted and imprisoned", sentence, cause: "incarceration" };
  }

  getRegionalJusticeFramework(birthRegion) {
    // Regional sentencing severity varies widely by justice system
    // Data from UN, World Prison Brief, Sentencing Project
    
    const frameworks = {
      // Nordic/Northern Europe: Rehabilitation-focused, shorter sentences
      "Nordic Country": { severity: 0.5, typeNames: ["theft", "burglary", "assault"] },
      
      // North America: Moderate-to-high, some very harsh sentencing
      "North America - Middle Class": { severity: 1.0, typeNames: ["theft", "burglary", "assault", "drug possession"] },
      "North America - Poor": { severity: 1.1, typeNames: ["theft", "burglary", "assault", "drug possession"] },
      
      // UK/Ireland: Moderate
      "UK - Middle Class": { severity: 0.8, typeNames: ["theft", "burglary", "assault"] },
      
      // Eastern Europe: Higher severity
      "Eastern Europe": { severity: 1.2, typeNames: ["theft", "burglary", "assault", "drug dealing"] },
      
      // Middle East: Variable, some very harsh (corporal punishment, amputation)
      "Middle East - Stable": { severity: 1.5, typeNames: ["theft", "burglary", "assault", "drug dealing"] },
      
      // Sub-Saharan Africa: Mixed, often harsh
      "Sub-Saharan Africa": { severity: 1.3, typeNames: ["theft", "burglary", "assault", "armed robbery"] },
      "Rural Sub-Saharan Africa": { severity: 1.4, typeNames: ["theft", "burglary", "assault", "armed robbery"] },
      
      // South Asia: Moderate-to-high
      "Rural South Asia": { severity: 1.2, typeNames: ["theft", "burglary", "assault"] },
      "Urban South Asia": { severity: 1.1, typeNames: ["theft", "burglary", "assault", "drug dealing"] },
      
      // Southeast Asia: Moderate-to-high, some very harsh (drugs especially)
      "Southeast Asia": { severity: 1.3, typeNames: ["theft", "burglary", "assault", "drug dealing"] },
      
      // Latin America: Variable, often moderate-to-high
      "Urban Latin America": { severity: 1.2, typeNames: ["theft", "burglary", "assault", "armed robbery"] },
      "Rural Latin America": { severity: 1.1, typeNames: ["theft", "burglary", "assault"] },
      
      // China: Moderate, but very harsh for serious crimes
      "Urban China": { severity: 1.3, typeNames: ["theft", "burglary", "assault", "drug dealing"] },
      
      // War zones: Often minimal justice system or very harsh
      "Active War Zone": { severity: 2.0, typeNames: ["theft", "burglary", "assault", "armed robbery", "conflict-related"] }
    };
    
    return frameworks[birthRegion] || frameworks["North America - Middle Class"];
  }

  calculateSentence(player, crimePath = "street_crime") {
    const priorConvictions = player.legal.convictionCount;
    const region = player.demographics.birthRegion;
    const framework = this.getRegionalJusticeFramework(region);
    const severity = framework.severity;
    
    if (crimePath === "white_collar_crime") {
      // White-collar: typically shorter sentences, less affected by regional severity
      // Wealthy individuals often get lighter sentences across systems
      const baseSentence = 2 + Math.floor(Math.random() * 6); // 2-8 years base
      const adjustedSentence = Math.max(1, Math.floor(baseSentence / severity)); // Divide by severity (lighter in strict systems)
      const escalatedSentence = Math.min(15, adjustedSentence + priorConvictions);
      return escalatedSentence;
    } else {
      // Street crime: varies significantly by region and severity
      let baseSentence;
      
      if (severity <= 0.5) {
        // Nordic: 1-5 years base (rehabilitation model)
        baseSentence = 1 + Math.floor(Math.random() * 4);
      } else if (severity <= 0.8) {
        // Moderate: 2-8 years base
        baseSentence = 2 + Math.floor(Math.random() * 6);
      } else if (severity <= 1.2) {
        // High: 3-12 years base
        baseSentence = 3 + Math.floor(Math.random() * 9);
      } else if (severity <= 1.5) {
        // Very high: 5-20 years (can include corporal punishment)
        baseSentence = 5 + Math.floor(Math.random() * 15);
      } else {
        // Extreme (war zones): 10-25 years or capital punishment
        baseSentence = 10 + Math.floor(Math.random() * 15);
      }
      
      // Prior convictions escalate sentence
      const escalatedSentence = baseSentence + priorConvictions * 2;
      return Math.min(25, escalatedSentence); // Cap at 25 years for practical reasons
    }
  }

  // ============================================================================
  // SOCIAL ISOLATION CASCADE
  // ============================================================================

  driftIsolation(player) {
    const p = player;

    let isolationFactors = 0;

    // ===== RELATIONSHIP STATUS - Psychological isolation basis =====
    // Loneliness isn't just about missing people, it's psychological state
    // Can be lonely in a crowd, or connected despite poor health
    
    // No romantic partner (psychological loneliness core factor)
    if (!p.relationships.partner.exists && p.demographics.age >= 18) {
      isolationFactors += 0.8;  // Significant factor - not paired
    }
    
    // Partner exists but relationship is poor (emotional disconnect)
    if (p.relationships.partner.exists && p.relationships.partner.relationship < 30) {
      isolationFactors += 0.6;  // Poor connection to primary relationship
    }
    
    // Very few friends (social network collapse)
    if (p.relationships.social.friends === 0) {
      isolationFactors += 1.0;  // Complete social network absence
    } else if (p.relationships.social.friends === 1) {
      isolationFactors += 0.5;  // Minimal social support
    }
    
    // Parent loss (especially significant for young people)
    if (p.demographics.age < 25 && !p.relationships.parents.mother.alive && !p.relationships.parents.father.alive) {
      isolationFactors += 0.7;  // Both parents lost = psychological isolation
    }

    // ===== CIRCUMSTANTIAL ISOLATION FACTORS =====
    
    // Unemployment > 12 months (loss of social structure)
    if (!p.economics.income.employed && p.demographics.age >= 18) {
      isolationFactors += 0.7;
    }

    // Disability/illness limiting mobility
    if (p.circumstances.vulnerability.disabled) {
      isolationFactors += 0.6;
    }

    // Mental health crisis amplifies isolation (feedback loop)
    if (p.health.mental.current < 30) {
      isolationFactors += 0.5;  // Crisis makes you withdraw
    } else if (p.health.mental.current < 40) {
      isolationFactors += 0.3;  // Mild crisis
    }

    // Incarceration (forced isolation)
    if (p.legal.currentlyImprisoned) {
      p.relationships.social.isolation = true;
      return;
    }

    // Substance abuse active (social withdrawal)
    if (p.addiction.stage === "dependent") {
      isolationFactors += 0.6;
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
      // Mental health degradation from isolation
      p.health.mental.baseline = Math.max(30, p.health.mental.baseline - 1);
      // Physical health degradation (loneliness has physiological effects)
      p.health.physical.baseline = Math.max(35, p.health.physical.baseline - 0.5);
      // Suicide risk increase (isolation is strong risk factor)
      p.health.mental.suicideRisk += 0.4;  // Increased from 0.3
      // Economic impact (lost job networking)
      p.economics.income.current = Math.max(0, p.economics.income.current - 1);
    }

    // ===== RECOVERY FROM ISOLATION =====
    
    // Marriage/partnership provides strong protection
    if (p.relationships.social.married && p.relationships.partner.relationship >= 60) {
      p.relationships.social.isolation = false;
      isolationFactors -= 1;
    }
    
    // Good friend network recovery
    if (p.relationships.social.friends >= 4) {
      isolationFactors -= 0.8;
      if (isolationFactors < 1.5) {
        p.relationships.social.isolation = false;
      }
    }
    
    // Employment provides social structure
    if (p.economics.income.employed && p.demographics.age >= 18) {
      isolationFactors -= 0.5;
    }
    
    // Improvement in mental health helps
    if (p.health.mental.current > 60) {
      isolationFactors -= 0.3;
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

  // Update employment status based on age, gender, region, and random job turnover
  updateEmploymentStatus(player) {
    const p = player;
    const age = p.demographics.age;
    const gender = p.demographics.sex;
    const region = this.mapRegionForStatistics(p.demographics.birthRegion);

    // Get expected employment probability for this age/gender/region
    const employmentProbability = shouldBeEmployed(age, gender, region);

    // 85% of people stay in their current employment status
    // 15% have turnover (employed→unemployed or unemployed→employed)
    const turnoverRate = 0.15;
    const hasTurnover = Math.random() < turnoverRate;

    if (hasTurnover) {
      // Job transition: flip status with probability
      p.economics.income.employed = employmentProbability;
      if (employmentProbability) {
        p.economics.income.lastEmploymentChange = age;
        p.economics.income.unemploymentMonths = 0;
      } else {
        p.economics.income.unemploymentMonths = 0; // Just became unemployed
      }
    } else {
      // No turnover: stick with structural employment rate
      p.economics.income.employed = employmentProbability;
    }

    // Track unemployment duration
    if (!p.economics.income.employed) {
      p.economics.income.unemploymentMonths = (p.economics.income.unemploymentMonths || 0) + 12;
    } else {
      p.economics.income.unemploymentMonths = 0;
    }
  }

  // Update education status based on age and region
  updateEducationStatus(player) {
    const p = player;
    const age = p.demographics.age;
    const region = this.mapRegionForStatistics(p.demographics.birthRegion);

    // Get education stage for this age
    const stage = getEducationStage(age);

    // Before age 6, no formal education
    if (age < 6) {
      p.development.education.inSchool = false;
      p.development.education.cost = 0;
      return;
    }

    // Check if should attend (compulsory ages 6-15 in most regions)
    const shouldAttend = shouldAttendEducation(
      age,
      region,
      p.economics.resources.current + p.economics.resources.baseline, // Estimate family resources
      p.development.education.level
    );

    p.development.education.inSchool = shouldAttend.shouldAttend;
    p.development.education.cost = shouldAttend.cost || 0;

    // If attending, chance to complete stage
    if (shouldAttend.shouldAttend && age >= 18) {
      // Post-secondary: can drop out or complete
      const completionRate = 0.85; // 85% of those who attend post-secondary complete
      if (Math.random() < completionRate) {
        p.development.education.yearsCompleted = (p.development.education.yearsCompleted || 0) + 1;
        if (p.development.education.yearsCompleted >= 4) {
          p.development.education.level = "tertiary_bachelor";
        }
      } else {
        p.development.education.inSchool = false; // Drop out
      }
    } else if (shouldAttend.shouldAttend && age >= 12 && age < 18) {
      // Secondary school: automatic progression, no dropout
      p.development.education.yearsCompleted = Math.min(6, age - 11);
      p.development.education.level = "secondary";
    } else if (shouldAttend.shouldAttend && age >= 6 && age < 12) {
      // Primary school: automatic progression
      p.development.education.yearsCompleted = Math.min(6, age - 5);
      p.development.education.level = "primary";
    }
  }

  // Get mental health baseline for a given age
  // Returns the optimal mental health for someone at this age (clean slate for children, declining through adulthood)
  getMentalHealthBaseline(age) {
    if (age < 6) return 88;    // Ages 0-5: Children born with clean slate, very resilient
    if (age < 12) return 82;   // Ages 6-11: Pre-adolescence, still resilient
    if (age < 18) return 75;   // Ages 12-17: Adolescence, mental health onset period, higher risk
    return 65;                  // Ages 18+: Adult baseline
  }

  mapRegionForStatistics(birthRegion) {
    // Map birth card region to global statistics category
    // Returns one of: "Nordic", "Developed", "Emerging", "Developing", "Fragile"
    
    if (!birthRegion) return "Developing"; // Default fallback
    
    const region = birthRegion.toLowerCase();
    
    if (region.includes('nordic') || region.includes('denmark') || region.includes('norway') || region.includes('sweden') || region.includes('finland')) {
      return "Nordic";
    }
    
    if (region.includes('western europe') || region.includes('japan') || region.includes('korea') || region.includes('australia') || region.includes('canada') || region.includes('usa') || region.includes('north america') || region.includes('new zealand')) {
      return "Developed";
    }
    
    if (region.includes('eastern europe') || region.includes('urban china') || region.includes('urban latin america') || region.includes('southeast asia') || region.includes('middle east')) {
      return "Emerging";
    }
    
    if (region.includes('rural') || region.includes('south asia') || region.includes('sub-saharan')) {
      return "Developing";
    }
    
    // Default to Fragile for unrecognized regions or explicitly marked
    if (region.includes('fragile') || region.includes('war') || region.includes('refugee')) {
      return "Fragile";
    }
    
    return "Developing"; // Default fallback
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
    
    // IMPORTANT: Update player.survival for death check to use
    // This ensures death rolls use current state, not just initial birth card
    p.survival = Math.max(0, Math.min(100, baseSurvival));

    // Suicide risk (major mortality factor for teens/young adults)
    // Note: suicideRisk is stored as a PERCENTAGE (0.01% to 2%)
    // Only applies to age 10+ (early adolescence) - matches real-world suicide statistics
    if (p.demographics.age >= 10 && p.health.mental.suicideRisk > 0.001) {
      // Roll for suicide attempt (0-1 scale probability, comparing against percentage converted to probability)
      const suicideRoll = Math.random();  // 0-1
      // suicideRisk is in percentage (e.g., 0.0126), convert to probability: 0.0126 / 100 = 0.000126
      const suicideThreshold = p.health.mental.suicideRisk / 100;
      if (suicideRoll < suicideThreshold) {
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

    // ========================================================================
    // REGIONAL SURVIVAL MULTIPLIERS (LIFELONG - region is constant factor)
    // ========================================================================
    // Region affects infrastructure, healthcare, conflict, disease burden
    // This is a PERSISTENT multiplier that applies throughout entire life
    let regionMultiplier = 1.0; // Default baseline
    if (p.demographics.birthRegion) {
      const region = p.demographics.birthRegion.toLowerCase();
      
      // Nordic countries: best healthcare, lowest conflict, excellent infrastructure
      if (region.includes('nordic')) {
        regionMultiplier = 1.35; // +35% survival boost throughout life
      }
      // Developed Asia: excellent healthcare, low disease burden, very safe
      else if (region.includes('japan') || region.includes('korea')) {
        regionMultiplier = 1.32; // +32% survival boost
      }
      // Western Europe: excellent healthcare, stable, low conflict
      else if (region.includes('europe') && !region.includes('eastern')) {
        regionMultiplier = 1.28; // +28% survival boost
      }
      // North America: good healthcare, stable, low disease burden
      else if (region.includes('north america') || region.includes('america - middle')) {
        regionMultiplier = 1.20; // +20% survival boost
      }
      // Eastern Europe: decent healthcare, some instability
      else if (region.includes('eastern')) {
        regionMultiplier = 1.12; // +12% survival boost
      }
      // Urban China/Latin America: moderate healthcare, industrializing
      else if ((region.includes('china') || region.includes('latin')) && region.includes('urban')) {
        regionMultiplier = 1.08; // +8% survival boost (urban areas better)
      }
      // Southeast Asia: basic healthcare, disease-endemic
      else if (region.includes('southeast')) {
        regionMultiplier = 0.95; // -5% survival penalty (endemic diseases)
      }
      // South Asia: poor healthcare, high disease burden, poverty
      else if (region.includes('south asia')) {
        regionMultiplier = 0.85; // -15% survival penalty
      }
      // Sub-Saharan Africa: poorest healthcare, high disease, malaria/HIV endemic
      else if (region.includes('sub-saharan') || region.includes('saharan')) {
        regionMultiplier = 0.75; // -25% survival penalty (disease-endemic, poor care)
      }
      // Middle East stable: basic healthcare, some stability
      else if (region.includes('middle east - stable')) {
        regionMultiplier = 1.05; // +5% survival boost
      }
      // War zones: active conflict, disrupted healthcare, violence
      else if (region.includes('war') || region.includes('conflict')) {
        regionMultiplier = 0.60; // -40% survival penalty (active combat)
      }
      // Fragile/post-conflict: unstable, rebuilding healthcare
      else if (region.includes('fragile') || region.includes('post-conflict')) {
        regionMultiplier = 0.80; // -20% survival penalty
      }
    }

    // Apply region multiplier to baseSurvival
    baseSurvival *= regionMultiplier;

    // Minimum survival: guarantee reasonable odds at every age
    // Very young/very old get baseline floor, region boost applied above
    let minSurvival = 20; // Default minimum
    if (p.demographics.age <= 5) minSurvival = 30; // Infants: higher baseline (now with region boost)
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

  // ============================================================================
  // EVENT SYSTEM INTEGRATION
  // ============================================================================

  evaluatePrerequisite(prereq, player = this.player) {
    // Check if a prerequisite condition is met
    // prereq is like: "relationships.partner.exists": true or { operator: "<=", value: 50 }
    
    if (!prereq) return true;
    
    for (const [path, condition] of Object.entries(prereq)) {
      const value = this.getNestedValue(player, path);
      
      // Simple boolean/value match
      if (typeof condition === 'boolean' || typeof condition === 'string' || typeof condition === 'number') {
        if (value !== condition) return false;
      }
      // Operator-based conditions (for numeric comparisons)
      else if (typeof condition === 'object' && condition !== null && condition.operator) {
        const { operator, value: compareValue } = condition;
        switch(operator) {
          case '<': if (!(value < compareValue)) return false; break;
          case '<=': if (!(value <= compareValue)) return false; break;
          case '>': if (!(value > compareValue)) return false; break;
          case '>=': if (!(value >= compareValue)) return false; break;
          case '==': if (!(value === compareValue)) return false; break;
          case '!=': if (!(value !== compareValue)) return false; break;
          default: return false;
        }
      }
    }
    
    return true;
  }

  getAvailableEvents(player = this.player) {
    // Get all events that are available for this player this year
    if (!this.eventCards || !Array.isArray(this.eventCards)) return [];
    
    const available = [];
    
    for (const event of this.eventCards) {
      // Check age range
      if (event.ageRange) {
        const [minAge, maxAge] = event.ageRange;
        if (player.demographics.age < minAge || player.demographics.age > maxAge) {
          continue;
        }
      }
      
      // Check prerequisites
      if (event.requires) {
        if (!this.evaluatePrerequisite(event.requires, player)) {
          continue;
        }
      }
      
      // This event is available
      available.push(event);
    }
    
    return available;
  }

  selectRandomEvent(player = this.player) {
    // Select a random event weighted by event weight (or return null if none available)
    const available = this.getAvailableEvents(player);
    
    if (available.length === 0) return null;
    
    // Weighted random selection
    const totalWeight = available.reduce((sum, e) => sum + (e.weight || 1), 0);
    let roll = Math.random() * totalWeight;
    
    for (const event of available) {
      const weight = event.weight || 1;
      if (roll < weight) return event;
      roll -= weight;
    }
    
    return available[available.length - 1]; // Fallback
  }

  processPossibleEvent(player = this.player) {
    // Each year, 15% chance an event occurs (can be tuned)
    const EVENT_CHANCE = 0.15;
    
    if (Math.random() > EVENT_CHANCE) return null;
    
    const event = this.selectRandomEvent(player);
    if (!event) return null;
    
    // Apply the event
    this.applyEventEffects(event, player);
    
    return event;
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
    // If player already dead (e.g., suicide, overdose), respect that
    if (!player.alive) {
      // Format the cause consistently
      const cause = player.causeOfDeath;
      if (typeof cause === 'object' && cause.name) {
        return { alive: false, cause: cause.name };
      }
      return { alive: false, cause: cause || "unknown" };
    }

    const roll = Math.floor(Math.random() * 100) + 1;

    if (roll > player.survival) {
      // DEATH
      // Filter deaths by age range AND exclude "Suicide" (only happens via suicide attempt mechanism)
      const validDeaths = this.deathCards.filter((card) => {
        const [minAge, maxAge] = card.ageRange;
        return player.demographics.age >= minAge && 
               player.demographics.age <= maxAge && 
               card.name !== "Suicide"; // Suicide handled separately via calculateSuicideRisk
      });

      // Weight by player state (if diabetic, more likely diabetes death, etc.)
      const causeOfDeath = this.weightedDrawDeath(validDeaths, player);

      return {
        alive: false,
        roll,
        survival: player.survival,
        age: player.demographics.age,
        cause: causeOfDeath.name
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
    // Death is the result of circumstances, not random
    // Weight causes based on player state to create causal chains
    
    if (deaths.length === 0) {
      return {
        name: "Unknown",
        description: "The cause of death remains unknown."
      };
    }

    // Start with base weights
    let weights = new Map();
    deaths.forEach(d => {
      weights.set(d.name, d.weight || 1);
    });

    // ===== AMPLIFY DEATH CAUSES based on player circumstances =====
    
    // Poverty chain: malnutrition → disease → preventable death
    if (player.economics.resources.current < 0) {
      weights.set("Malnutrition/Starvation", (weights.get("Malnutrition/Starvation") || 1) * 3);
      weights.set("Diarrheal Disease", (weights.get("Diarrheal Disease") || 1) * 2.5);
      weights.set("Lack of Medical Care", (weights.get("Lack of Medical Care") || 1) * 2.5);
      weights.set("Preventable Disease", (weights.get("Preventable Disease") || 1) * 2);
    } else if (player.economics.resources.current < 5) {
      weights.set("Malnutrition/Starvation", (weights.get("Malnutrition/Starvation") || 1) * 1.8);
      weights.set("Diarrheal Disease", (weights.get("Diarrheal Disease") || 1) * 1.5);
      weights.set("Lack of Medical Care", (weights.get("Lack of Medical Care") || 1) * 1.5);
    }

    // Poor health chain: chronic conditions increase risk of related causes
    if (player.health.physical.chronic.length > 0) {
      weights.set("Heart Disease", (weights.get("Heart Disease") || 1) * 2);
      weights.set("Stroke", (weights.get("Stroke") || 1) * 2);
      weights.set("Kidney Failure", (weights.get("Kidney Failure") || 1) * 1.5);
    }
    
    if (player.health.physical.chronic.includes("diabetes")) {
      weights.set("Heart Disease", (weights.get("Heart Disease") || 1) * 3);
      weights.set("Kidney Failure", (weights.get("Kidney Failure") || 1) * 3);
      weights.set("Stroke", (weights.get("Stroke") || 1) * 2);
    }

    if (player.health.physical.chronic.includes("asthma")) {
      weights.set("Pneumonia", (weights.get("Pneumonia") || 1) * 2.5);
      weights.set("Respiratory Failure", (weights.get("Respiratory Failure") || 1) * 2);
    }

    // Mental health chain: depression/untreated crisis increases risky behavior deaths (accidents, overdose)
    // NOTE: Suicide is NOT selected here - it only happens via calculateSuicideRisk/attemptSuicide mechanism
    // This prevents random selection of suicide as a death cause
    if (player.demographics.age >= 12) {
      if (player.health.mental.current < 20) {
        weights.set("Accident", (weights.get("Accident") || 1) * 2); // Risky behavior
        weights.set("Overdose", (weights.get("Overdose") || 1) * 2);
      } else if (player.health.mental.current < 30) {
        weights.set("Accident", (weights.get("Accident") || 1) * 1.3);
      }
    } else {
      // For young children (age < 12): accidents might increase with poor mental state
      if (player.health.mental.current < 30) {
        weights.set("Accident", (weights.get("Accident") || 1) * 1.5); // Neglect/poor attention
      }
    }

    // Addiction chain: substance abuse increases overdose, accident, disease risk
    if (player.addiction.stage === "dependent") {
      weights.set("Overdose", (weights.get("Overdose") || 1) * 10);
      weights.set("Liver Cirrhosis", (weights.get("Liver Cirrhosis") || 1) * 5);
      weights.set("Accident", (weights.get("Accident") || 1) * 3);
      weights.set("Pneumonia", (weights.get("Pneumonia") || 1) * 1.5); // Immune suppression
    } else if (player.addiction.stage === "regular") {
      weights.set("Overdose", (weights.get("Overdose") || 1) * 3);
      weights.set("Accident", (weights.get("Accident") || 1) * 1.5);
    }

    // Cancer chain: active cancer dramatically increases cancer-related death risk
    if (player.health.cancer.active) {
      weights.set("Cancer", (weights.get("Cancer") || 1) * 15); // Massive amplification
      // Remove unlikely causes when cancer is active
      weights.delete("Accident");
      weights.delete("Overdose");
    }

    // Incarceration chain: violence, disease in prisons
    if (player.legal.currentlyImprisoned) {
      weights.set("Violence (Homicide)", (weights.get("Violence (Homicide)") || 1) * 3);
      weights.set("Tuberculosis", (weights.get("Tuberculosis") || 1) * 2);
      weights.set("Suicide", (weights.get("Suicide") || 1) * 2);
    }

    // ===== REGION-BASED DEATH PATTERNS =====
    // Real-world mortality causes vary dramatically by region
    if (player.demographics.birthRegion) {
      const region = player.demographics.birthRegion.toLowerCase();
      
      // HIGH-INCOME REGIONS: Nordic, Europe, North America, Japan, Korea
      // Deaths: Heart Disease (35-40%), Cancer (25-30%), Stroke (8-10%), Respiratory (5%)
      if (region.includes('nordic') || region.includes('western europe') || 
          region.includes('north america') || region.includes('japan') || 
          region.includes('korea')) {
        // Amplify chronic disease deaths
        weights.set("Heart Disease", (weights.get("Heart Disease") || 1) * 2.5);
        weights.set("Cancer", (weights.get("Cancer") || 1) * 2);
        weights.set("Stroke", (weights.get("Stroke") || 1) * 1.8);
        weights.set("Dementia/Alzheimer's", (weights.get("Dementia/Alzheimer's") || 1) * 1.5);
        // Suppress infectious/poverty causes
        weights.set("Diarrheal Disease", (weights.get("Diarrheal Disease") || 1) * 0.1);
        weights.set("Malaria", (weights.get("Malaria") || 1) * 0.01); // Virtually non-existent
        weights.set("Malnutrition/Starvation", (weights.get("Malnutrition/Starvation") || 1) * 0.05);
        // Remove armed conflict
        weights.delete("Violence (Armed Conflict)");
      }
      // UPPER-MIDDLE-INCOME: Eastern Europe, Urban China, Middle East (stable)
      // Mixed: Heart Disease (25-30%), Stroke (10%), Respiratory (10%), Diarrheal (8%)
      else if (region.includes('eastern europe') || region.includes('urban china') || 
               region.includes('middle east - stable')) {
        weights.set("Heart Disease", (weights.get("Heart Disease") || 1) * 1.8);
        weights.set("Stroke", (weights.get("Stroke") || 1) * 1.5);
        weights.set("Diarrheal Disease", (weights.get("Diarrheal Disease") || 1) * 1.2);
        weights.set("Pneumonia", (weights.get("Pneumonia") || 1) * 1.3);
        weights.delete("Violence (Armed Conflict)");
      }
      // LOWER-MIDDLE-INCOME: Urban Latin America, Southeast Asia, Urban areas
      // Deaths: Heart Disease (20%), Stroke (8%), Diarrheal (12%), Respiratory (15%)
      else if (region.includes('urban latin') || region.includes('southeast') || 
               region.includes('urban')) {
        weights.set("Heart Disease", (weights.get("Heart Disease") || 1) * 1.3);
        weights.set("Stroke", (weights.get("Stroke") || 1) * 1.2);
        weights.set("Diarrheal Disease", (weights.get("Diarrheal Disease") || 1) * 1.5);
        weights.set("Pneumonia", (weights.get("Pneumonia") || 1) * 1.8);
        weights.set("Malaria", (weights.get("Malaria") || 1) * 0.5); // Less common in urban
        weights.delete("Violence (Armed Conflict)"); // Remove unless specified otherwise
      }
      // LOW-INCOME REGIONS: Sub-Saharan, South Asia, Rural areas
      // Deaths: Diarrheal (20-25%), Respiratory (15-20%), Malaria (10-15%), Malnutrition (8-12%)
      else if (region.includes('sub-saharan') || region.includes('south asia') || 
               region.includes('rural')) {
        weights.set("Diarrheal Disease", (weights.get("Diarrheal Disease") || 1) * 2.5);
        weights.set("Pneumonia", (weights.get("Pneumonia") || 1) * 2);
        weights.set("Malaria", (weights.get("Malaria") || 1) * 2.5);
        weights.set("Malnutrition/Starvation", (weights.get("Malnutrition/Starvation") || 1) * 2);
        weights.set("Lack of Medical Care", (weights.get("Lack of Medical Care") || 1) * 2);
        // Suppress chronic diseases (less common due to early mortality)
        weights.set("Heart Disease", (weights.get("Heart Disease") || 1) * 0.5);
        weights.set("Cancer", (weights.get("Cancer") || 1) * 0.4);
        weights.delete("Violence (Armed Conflict)"); // Remove unless war zone
      }
      
      // FRAGILE/CONFLICT STATES: Override with conflict patterns
      if (region.includes('war zone')) {
        // War zones: 30-50% of deaths from armed conflict
        weights.set("Violence (Armed Conflict)", (weights.get("Violence (Armed Conflict)") || 1) * 8);
        weights.set("Lack of Medical Care", (weights.get("Lack of Medical Care") || 1) * 3);
        // Everything else suppressed
        weights.forEach((val, key) => {
          if (key !== "Violence (Armed Conflict)" && key !== "Lack of Medical Care") {
            weights.set(key, val * 0.3);
          }
        });
      } else if (region.includes('fragile') || region.includes('post-conflict')) {
        // Fragile states: 5-10% armed conflict, otherwise disease-heavy
        weights.set("Violence (Armed Conflict)", (weights.get("Violence (Armed Conflict)") || 1) * 1.5);
        weights.set("Diarrheal Disease", (weights.get("Diarrheal Disease") || 1) * 1.5);
        weights.set("Pneumonia", (weights.get("Pneumonia") || 1) * 1.5);
      }
    }

    // Age-dependent causes
    if (player.demographics.age < 5) {
      weights.set("Congenital Birth Defect", (weights.get("Congenital Birth Defect") || 1) * 3);
      weights.set("Childhood Accident", (weights.get("Childhood Accident") || 1) * 2);
      weights.set("Diarrheal Disease", (weights.get("Diarrheal Disease") || 1) * 2);
    }

    if (player.demographics.age > 70) {
      weights.set("Heart Disease", (weights.get("Heart Disease") || 1) * 4);
      weights.set("Stroke", (weights.get("Stroke") || 1) * 3);
      weights.set("Cancer", (weights.get("Cancer") || 1) * 2);
      weights.set("Pneumonia", (weights.get("Pneumonia") || 1) * 1.5);
    }

    // Social isolation increases risky behavior
    if (player.relationships.social.isolation && player.demographics.age >= 18) {
      weights.set("Suicide", (weights.get("Suicide") || 1) * 2);
      weights.set("Accident", (weights.get("Accident") || 1) * 1.5);
      weights.set("Overdose", (weights.get("Overdose") || 1) * 1.5);
    }

    // Draw weighted death
    const totalWeight = Array.from(weights.values()).reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;

    for (const death of deaths) {
      const weight = weights.get(death.name) || 1;
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
