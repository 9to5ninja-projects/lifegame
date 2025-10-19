// MORTALITY LOTTERY - Core Game Engine
// Prototype v0.1

class MortalityGame {
  constructor(birthCards, familyCards, eventCards, deathCards) {
    this.birthCards = birthCards;
    this.familyCards = familyCards;
    this.eventCards = eventCards;
    this.deathCards = deathCards;
    this.player = null;
  }

  // WEIGHTED RANDOM DRAW
  weightedDraw(cards, profileTags = []) {
    // Calculate weights, adjusting for profile compatibility
    const weighted = cards.map(card => {
      let weight = card.weight || 1;
      
      // Adjust weight based on profile compatibility
      if (card.profileCompatibility && profileTags.length > 0) {
        profileTags.forEach(tag => {
          if (card.profileCompatibility[tag]) {
            weight *= (card.profileCompatibility[tag] / 50); // Normalize
          }
        });
      }
      
      // Adjust weight based on profile-specific weights
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

    return weighted[weighted.length - 1].card; // Fallback
  }

  // INITIALIZE PLAYER WITH BIRTH ROLL
  createPlayer() {
    // Draw birth geography card
    const birthCard = this.weightedDraw(this.birthCards);
    
    // Extract profile tags from birth card
    const profileTags = birthCard.profileTags || [];
    
    // Draw family structure card (weighted by birth profile)
    const familyCard = this.weightedDraw(this.familyCards, profileTags);

    // Initialize player state
    this.player = {
      id: 'player_1',
      age: 0,
      alive: true,
      survival: 50, // Base
      resources: 0,
      agency: 0,
      profileTags: [...profileTags],
      birthCards: [birthCard, familyCard],
      eventHistory: [],
      causeOfDeath: null
    };

    // Apply birth card effects
    this.applyCardEffects(birthCard);
    
    // Apply family card effects
    this.applyCardEffects(familyCard);

    return this.player;
  }

  // APPLY CARD EFFECTS TO PLAYER
  applyCardEffects(card) {
    if (!card.effects) return;

    const effects = card.effects;

    // Set absolute stats
    if (effects.statSet) {
      Object.assign(this.player, effects.statSet);
    }

    // Apply modifiers
    if (effects.survivalMod) {
      this.player.survival += effects.survivalMod;
    }
    if (effects.resourceMod) {
      this.player.resources += effects.resourceMod;
    }
    if (effects.agencyMod) {
      this.player.agency += effects.agencyMod;
    }

    // Add tags
    if (effects.tags) {
      effects.tags.forEach(tag => {
        if (!this.player.profileTags.includes(tag)) {
          this.player.profileTags.push(tag);
        }
      });
    }

    // Clamp values
    this.player.survival = Math.max(1, Math.min(99, this.player.survival));
    this.player.resources = Math.max(0, this.player.resources);
    this.player.agency = Math.max(0, this.player.agency);
  }

  // DRAW EVENT CARDS BASED ON AGE
  drawEventCards(count = 1) {
    const age = this.player.age;
    const validEvents = this.eventCards.filter(card => {
      const [minAge, maxAge] = card.ageRange;
      return age >= minAge && age <= maxAge;
    });

    const drawnEvents = [];
    for (let i = 0; i < count; i++) {
      if (validEvents.length > 0) {
        const event = this.weightedDraw(validEvents, this.player.profileTags);
        drawnEvents.push(event);
      }
    }

    return drawnEvents;
  }

  // RESOLVE EVENT
  resolveEvent(event, choiceIndex = null) {
    // If event has choices, resolve the chosen one
    if (event.choices && choiceIndex !== null) {
      const choice = event.choices[choiceIndex];
      
      // Check requirements
      if (choice.requires) {
        if (choice.requires.resourceMin && this.player.resources < choice.requires.resourceMin) {
          return { success: false, reason: 'Insufficient resources' };
        }
        if (choice.requires.literacy && !this.player.profileTags.includes('literate')) {
          return { success: false, reason: 'Requires literacy' };
        }
      }

      // Apply choice effects
      this.applyCardEffects({ effects: choice.effects });
      
      this.player.eventHistory.push({
        age: this.player.age,
        event: event.name,
        choice: choice.text
      });

      return { success: true, choice: choice.text };
    }

    // Otherwise just apply event effects
    this.applyCardEffects(event);
    
    // Apply age-specific modifiers if they exist
    if (event.ageModifiers) {
      for (let ageRange in event.ageModifiers) {
        const [minAge, maxAge] = ageRange.split('-').map(Number);
        if (this.player.age >= minAge && this.player.age <= maxAge) {
          this.applyCardEffects({ effects: event.ageModifiers[ageRange] });
        }
      }
    }

    this.player.eventHistory.push({
      age: this.player.age,
      event: event.name
    });

    return { success: true };
  }

  // DEATH CHECK
  deathCheck() {
    const roll = Math.floor(Math.random() * 100) + 1; // 1-100
    
    if (roll > this.player.survival) {
      // Player dies
      this.player.alive = false;
      
      // Draw cause of death
      const validDeaths = this.deathCards.filter(card => {
        const [minAge, maxAge] = card.ageRange;
        return this.player.age >= minAge && this.player.age <= maxAge;
      });

      const causeOfDeath = this.weightedDraw(validDeaths, this.player.profileTags);
      this.player.causeOfDeath = causeOfDeath;

      return {
        alive: false,
        roll,
        survival: this.player.survival,
        causeOfDeath: causeOfDeath.name,
        description: causeOfDeath.description
      };
    }

    return {
      alive: true,
      roll,
      survival: this.player.survival
    };
  }

  // AGE UP
  ageUp(years = 1) {
    this.player.age += years;

    // Adjust survival based on age (simplified)
    if (this.player.age === 2) {
      this.player.survival += 5; // Survived infancy
    }
    if (this.player.age === 18) {
      this.player.survival += 3; // Survived childhood
      this.player.agency += 1; // Gain agency at adulthood
    }
    if (this.player.age >= 60) {
      this.player.survival -= 1; // Decline in old age
    }
  }

  // CALCULATE EVENT COUNT BASED ON AGE
  getEventCount() {
    if (this.player.age <= 5) return 1;
    if (this.player.age <= 12) return Math.random() < 0.5 ? 1 : 2;
    if (this.player.age <= 25) return Math.random() < 0.3 ? 2 : 3;
    if (this.player.age <= 60) return 2;
    return 3; // Elder years
  }

  // PLAY ONE YEAR
  playYear() {
    if (!this.player.alive) {
      return { error: 'Player is dead' };
    }

    // Age up
    this.ageUp(1);

    // Draw events
    const eventCount = this.getEventCount();
    const events = this.drawEventCards(eventCount);

    // Auto-resolve events without choices (for now)
    events.forEach(event => {
      if (!event.choices) {
        this.resolveEvent(event);
      }
    });

    // Death check
    const deathResult = this.deathCheck();

    return {
      age: this.player.age,
      events: events.map(e => e.name),
      survival: this.player.survival,
      resources: this.player.resources,
      agency: this.player.agency,
      deathCheck: deathResult
    };
  }

  // FOLD (QUIT VOLUNTARILY)
  foldLife() {
    if (!this.player.alive) {
      return { error: 'Player is already dead' };
    }

    this.player.alive = false;
    this.player.folded = true;
    this.player.causeOfDeath = {
      name: 'Voluntary Fold',
      description: 'You chose to fold this life and see what score you earned.'
    };

    return {
      folded: true,
      age: this.player.age,
      finalScore: this.calculateScore()
    };
  }

  // CALCULATE FINAL SCORE
  calculateScore() {
    if (!this.player) return 0;

    const yearsLived = this.player.age;
    const birthCard = this.player.birthCards[0];
    const lifeExpectancy = birthCard.lifeExpectancy || 73; // Global average fallback
    
    // Determine difficulty multiplier based on birth profile
    let multiplier = 1;
    if (this.player.profileTags.includes('conflict') || 
        this.player.profileTags.includes('extreme-risk')) {
      multiplier = 5;
    } else if (this.player.profileTags.includes('low-resource')) {
      multiplier = 3;
    } else if (this.player.profileTags.includes('emerging') || 
               this.player.profileTags.includes('moderate-resource')) {
      multiplier = 2;
    } else if (this.player.profileTags.includes('high-resource')) {
      multiplier = 1;
    }

    let score = yearsLived * multiplier;

    // Milestone bonuses
    if (this.player.age >= 18) score += 10;
    if (this.player.age >= 60) score += 20;
    if (this.player.age >= 80) score += 50;

    // Tag bonuses
    if (this.player.profileTags.includes('educated')) score += 15;
    if (this.player.profileTags.includes('literate')) score += 5;

    // Agency bonus
    score += this.player.agency * 5;

    // Life expectancy bonus/penalty
    const yearsOverExpectancy = this.player.age - lifeExpectancy;
    if (yearsOverExpectancy > 0) {
      // Massive bonus for beating your birth odds
      score += yearsOverExpectancy * 10;
    }

    // Fold penalty (lose 30% of score if you folded instead of dying naturally)
    if (this.player.folded) {
      score = Math.floor(score * 0.7);
    }

    return Math.floor(score);
  }

  // GET LIFE EXPECTANCY COMPARISON
  getLifeExpectancyStats() {
    if (!this.player) return null;

    const birthCard = this.player.birthCards[0];
    const lifeExpectancy = birthCard.lifeExpectancy || 73;
    const yearsOverUnder = this.player.age - lifeExpectancy;
    const percentOfExpectancy = Math.floor((this.player.age / lifeExpectancy) * 100);

    return {
      regionalExpectancy: lifeExpectancy,
      yearsOverUnder,
      percentOfExpectancy,
      beatTheOdds: yearsOverUnder > 0
    };
  }

  // GET GAME SUMMARY
  getSummary() {
    const lifeExpStats = this.getLifeExpectancyStats();
    
    return {
      age: this.player.age,
      alive: this.player.alive,
      folded: this.player.folded || false,
      causeOfDeath: this.player.causeOfDeath?.name || null,
      causeDescription: this.player.causeOfDeath?.description || null,
      birthProfile: this.player.birthCards[0].name,
      familyStructure: this.player.birthCards[1].name,
      eventHistory: this.player.eventHistory,
      finalScore: this.calculateScore(),
      lifeExpectancy: lifeExpStats
    };
  }
}

// EXPORT
export default MortalityGame;

// USAGE EXAMPLE:
/*
import birthCards from './data/birth-cards.json';
import familyCards from './data/family-cards.json';
import eventCards from './data/event-cards-childhood.json';
import deathCards from './data/death-cards.json';

const game = new MortalityGame(birthCards, familyCards, eventCards, deathCards);

// Start game
game.createPlayer();
console.log('Born:', game.player.birthCards[0].name);
console.log('Family:', game.player.birthCards[1].name);
console.log('Starting survival:', game.player.survival);

// Play through life
while (game.player.alive && game.player.age < 100) {
  const yearResult = game.playYear();
  console.log(`Age ${yearResult.age}:`, yearResult.events);
  
  if (!yearResult.deathCheck.alive) {
    console.log('DIED:', yearResult.deathCheck.causeOfDeath);
    break;
  }
}

// Final summary
console.log(game.getSummary());
*/