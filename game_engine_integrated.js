// MORTALITY LOTTERY - Integrated Game Engine v2.0
// Combines v2.0 homeostatic state system with v1.0 playability
// Primary: game_engine_v2_homeostatic.js (state + logic)
// Compatibility: v1.0 API for existing UI/tests

// Load v2 engine if in Node environment
let MortalityGameV2;
if (typeof require !== 'undefined' && typeof module !== 'undefined') {
  try {
    MortalityGameV2 = require('./game_engine_v2_homeostatic.js');
  } catch (e) {
    // Browser environment - assume MortalityGameV2 is already loaded
  }
}

class MortalityGameIntegrated {
  constructor(birthCards, familyCards, eventCards, deathCards) {
    // Initialize v2.0 engine
    this.v2Engine = new MortalityGameV2(birthCards, familyCards, eventCards, deathCards);
    this.birthCards = birthCards;
    this.familyCards = familyCards;
    this.eventCards = eventCards;
    this.deathCards = deathCards;
    this.player = null;
  }

  // ============================================================================
  // API: Create Player (wrapper around v2 engine)
  // ============================================================================
  createPlayer(birthCard = null, familyCard = null, demographics = {}) {
    // Random draw if not specified
    if (!birthCard) {
      birthCard = this.weightedDraw(this.birthCards);
    }
    if (!familyCard) {
      familyCard = this.weightedDraw(this.familyCards);
    }

    // Use v2.0 engine to create player with full state
    this.player = this.v2Engine.createPlayer(birthCard, familyCard, demographics);

    // Store reference in this for compatibility
    this.v2Engine.player = this.player;

    return this.player;
  }

  // ============================================================================
  // API: Weighted Draw (from v1.0 for compatibility)
  // ============================================================================
  weightedDraw(cards, profileTags = []) {
    const weighted = cards.map(card => {
      let weight = card.weight || 1;

      if (card.profileCompatibility && profileTags.length > 0) {
        profileTags.forEach(tag => {
          if (card.profileCompatibility[tag]) {
            weight *= (card.profileCompatibility[tag] / 50);
          }
        });
      }

      if (card.profileWeights && profileTags.length > 0) {
        profileTags.forEach(tag => {
          if (card.profileWeights[tag]) {
            weight = card.profileWeights[tag];
          }
        });
      }

      return { card, weight };
    });

    const totalWeight = weighted.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;

    for (let item of weighted) {
      if (random < item.weight) {
        return item.card;
      }
      random -= item.weight;
    }

    return weighted[weighted.length - 1].card;
  }

  // ============================================================================
  // API: Next Year (main gameplay loop)
  // ============================================================================
  nextYear() {
    if (!this.player || !this.player.alive) {
      return { alive: false, event: null, death: null };
    }

    // NOTE: Do NOT age here - processYearEnd handles aging for v2 state
    // But we do need to sync the two age fields
    // this.player.age is v1.0 compat field, player.demographics.age is v2.0 source of truth

    // Process yearly systems (drift, development, aging, etc.)
    this.v2Engine.processYearEnd(this.player);

    // Sync age from v2.0 source
    this.player.age = this.player.demographics.age;

    // Check for death
    if (!this.player.alive) {
      return {
        alive: false,
        event: null,
        death: {
          cause: this.player.causeOfDeath,
          age: this.player.age
        }
      };
    }

    // Draw event for this year
    const event = this.drawEvent(this.player);

    if (event) {
      // Apply event effects
      this.v2Engine.applyEventEffects(event, this.player);

      // Track event
      this.player.eventHistory.push({
        age: this.player.age,
        event: event.name,
        id: event.id
      });
    }

    // Update v1.0 compatibility fields for UI
    this.updateCompatibilityFields();

    return {
      alive: true,
      event: event ? {
        name: event.name,
        description: event.description,
        id: event.id
      } : null
    };
  }

  // ============================================================================
  // HELPER: Draw event for this year
  // ============================================================================
  drawEvent(player = this.player) {
    // Filter events by age range
    let availableEvents = this.eventCards.filter(event => {
      const inRange = player.age >= event.ageRange[0] && player.age <= event.ageRange[1];
      return inRange;
    });

    // Filter by prerequisites
    availableEvents = availableEvents.filter(event => 
      this.v2Engine.canEventOccur(event, player)
    );

    if (availableEvents.length === 0) {
      return null;
    }

    // Weighted draw
    return this.weightedDraw(availableEvents, player.profileTags);
  }

  // ============================================================================
  // API: Fold (quit voluntarily)
  // ============================================================================
  foldLife() {
    if (!this.player) return null;

    this.player.folded = true;
    this.player.alive = false;

    // Calculate score with fold penalty
    return this.calculateScore();
  }

  // ============================================================================
  // API: Calculate Score (with fold penalty)
  // ============================================================================
  calculateScore() {
    if (!this.player) return 0;

    const birthCard = this.player.birthCards[0];
    const multiplier = birthCard.difficultyMultiplier || 1;

    // Base score: age × difficulty
    let score = this.player.age * multiplier;

    // Milestone bonuses
    if (this.player.age >= 18) score += 10;
    if (this.player.age >= 60) score += 20;
    if (this.player.age >= 80) score += 30;

    // Life expectancy bonus: +10 per year over expectancy
    const yearsOver = Math.max(0, this.player.age - this.player.lifeExpectancy);
    score += yearsOver * 10;

    // Event bonuses (optional: per event)
    score += Math.floor(this.player.eventHistory.length / 5);

    // Fold penalty: -30%
    if (this.player.folded) {
      score *= 0.7;
    }

    return Math.floor(score);
  }

  // ============================================================================
  // API: Get Summary (for display/debugging)
  // ============================================================================
  getSummary() {
    if (!this.player) return null;

    const birthCard = this.player.birthCards[0];

    return {
      // Demographics
      age: this.player.age,
      birthRegion: this.player.demographics.birthRegion,
      sex: this.player.demographics.sex,
      lifeExpectancy: this.player.lifeExpectancy,

      // Health
      physicalHealth: this.player.health.physical.current,
      mentalHealth: this.player.health.mental.current,
      fertile: this.player.health.reproductive.fertile,

      // Economics
      income: this.player.economics.income.current,
      resources: this.player.economics.resources.current,
      debt: this.player.economics.debt,

      // Relationships
      parentStatus: {
        motherAlive: this.player.relationships.parents.mother.alive,
        fatherAlive: this.player.relationships.parents.father.alive
      },
      partnered: this.player.relationships.partner.exists,
      childrenCount: this.player.relationships.children.length,
      friendCount: this.player.relationships.social.friends,

      // Development
      literate: this.player.development.education.literate,
      educationLevel: this.player.development.education.level,

      // Game state
      alive: this.player.alive,
      folded: this.player.folded,
      causeOfDeath: this.player.causeOfDeath,
      eventCount: this.player.eventHistory.length,
      score: this.calculateScore()
    };
  }

  // ============================================================================
  // HELPER: Update v1.0 compatibility fields
  // Ensures UI rendering old stats doesn't break
  // ============================================================================
  updateCompatibilityFields() {
    if (!this.player) return;

    // Map v2.0 state to v1.0 fields for UI compatibility
    this.player.survival = Math.floor(this.player.health.physical.current);
    this.player.resources = Math.floor(this.player.economics.resources.current);
    this.player.agency = Math.floor(this.player.relationships.social.community / 10); // Scale down to 0-10

    // Maintain profileTags from birth
    this.player.profileTags = [...(this.player.birthCards[0].profileTags || [])];
  }

  // ============================================================================
  // DEBUG: Get full state (for testing)
  // ============================================================================
  getFullState() {
    return this.player;
  }

  // ============================================================================
  // DEBUG: Run simulation (N games)
  // ============================================================================
  runSimulation(games = 1000, onProgress = null) {
    const results = {
      totalGames: games,
      totalYears: 0,
      averageAge: 0,
      maxAge: 0,
      minAge: 999,
      deathCauses: {},
      foldRate: 0,
      scoreDistribution: []
    };

    let folds = 0;
    let scores = [];

    for (let i = 0; i < games; i++) {
      // Create new player
      this.createPlayer();

      // Play until death
      while (this.player.alive && this.player.age < 150) {
        this.nextYear();
      }

      // Record results
      const score = this.calculateScore();
      if (typeof this.player.age === 'number') {
        results.totalYears += this.player.age;
        results.maxAge = Math.max(results.maxAge, this.player.age);
        results.minAge = Math.min(results.minAge, this.player.age);
      }
      scores.push(score || 0);

      if (this.player.folded) folds++;
      
      // Extract cause of death as string
      let causeName = 'Unknown';
      if (this.player.causeOfDeath) {
        if (typeof this.player.causeOfDeath === 'string') {
          causeName = this.player.causeOfDeath;
        } else if (typeof this.player.causeOfDeath === 'object' && this.player.causeOfDeath.cause) {
          causeName = this.player.causeOfDeath.cause;
        }
        results.deathCauses[causeName] = (results.deathCauses[causeName] || 0) + 1;
      }

      // Progress callback
      if (onProgress && i % Math.max(1, Math.floor(games / 10)) === 0) {
        onProgress(i + 1, games);
      }
    }

    results.averageAge = games > 0 ? Math.floor(results.totalYears / games) : 0;
    results.foldRate = games > 0 ? (folds / games * 100).toFixed(2) : 0;
    results.scoreDistribution = {
      min: scores.length > 0 ? Math.min(...scores.filter(s => typeof s === 'number')) : 0,
      max: scores.length > 0 ? Math.max(...scores.filter(s => typeof s === 'number')) : 0,
      avg: scores.length > 0 ? Math.floor(scores.filter(s => typeof s === 'number').reduce((a, b) => a + b, 0) / scores.length) : 0
    };

    return results;
  }
}

// ============================================================================
// Export for use in browser or Node
// ============================================================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MortalityGameIntegrated;
}
