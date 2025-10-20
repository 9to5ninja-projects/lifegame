/**
 * TEMPORAL EFFECTS SYSTEM
 * 
 * Handles time-based event impacts with duration, decay, and residual effects.
 * This is the foundation for realistic event modeling.
 * 
 * Key Concepts:
 * - Events have IMMEDIATE impact + DURATION + DECAY pattern
 * - Effects can be temporary, permanent, or leave residual scars
 * - Multiple effects can stack and interact
 * 
 * Example Use Cases:
 * - Job loss: -20 mental health, recovers over 6 months if re-employed
 * - Parent death: -40 mental health, linear recovery over 2 years, -5 permanent scar
 * - Marriage: +20 mental health while married, -30 on divorce
 * - Chronic disease: -10 initial, -2 per year cumulative (worsening)
 */

class TemporalEffectsSystem {
  constructor() {
    // Active effects tracker: Map<playerId, Array<ActiveEffect>>
    this.activeEffects = new Map();
  }

  /**
   * Apply an event with temporal effects
   * @param {Object} player - The player object
   * @param {Object} eventEffect - Effect configuration
   * @returns {Object} - Result of applying effect
   */
  applyEffect(player, eventEffect) {
    const playerId = this.getPlayerId(player);
    
    if (!this.activeEffects.has(playerId)) {
      this.activeEffects.set(playerId, []);
    }

    const effect = {
      id: this.generateEffectId(),
      name: eventEffect.name,
      startAge: player.demographics.age,
      
      // Impact configuration
      immediate: eventEffect.immediate || {},        // Applied instantly
      duration: eventEffect.duration || 0,           // Months effect lasts (0 = permanent)
      decayType: eventEffect.decayType || 'none',   // 'none', 'linear', 'exponential', 'step'
      residual: eventEffect.residual || {},          // Permanent effect after recovery
      
      // Conditional effects
      condition: eventEffect.condition || null,      // Function to check if still active
      
      // Current state
      monthsActive: 0,
      isActive: true,
      
      // Metadata
      category: eventEffect.category || 'general',   // 'mental', 'physical', 'economic', 'social'
      source: eventEffect.source || 'event'          // Track what caused this
    };

    // Apply immediate effects
    this.applyImmediateEffect(player, effect.immediate);

    // Add to active effects
    this.activeEffects.get(playerId).push(effect);

    return {
      success: true,
      effectId: effect.id,
      immediate: effect.immediate
    };
  }

  /**
   * Process all active effects (called each year)
   * @param {Object} player - The player object
   */
  processEffects(player) {
    const playerId = this.getPlayerId(player);
    const effects = this.activeEffects.get(playerId) || [];
    
    const modifications = {
      mentalHealth: 0,
      physicalHealth: 0,
      resources: 0,
      income: 0,
      socialConnections: 0
    };

    // Process each active effect
    for (const effect of effects) {
      if (!effect.isActive) continue;

      effect.monthsActive += 12; // One year passed

      // Check if effect has expired
      if (effect.duration > 0 && effect.monthsActive >= effect.duration) {
        // Effect ending - apply residual if any
        this.applyResidualEffect(player, effect.residual);
        effect.isActive = false;
        continue;
      }

      // Check conditional effects (e.g., "while married")
      if (effect.condition && !effect.condition(player)) {
        effect.isActive = false;
        continue;
      }

      // Calculate current effect strength based on decay
      const currentStrength = this.calculateDecayedStrength(effect);
      
      // Accumulate modifications
      if (effect.immediate.mentalHealthMod) {
        modifications.mentalHealth += effect.immediate.mentalHealthMod * currentStrength;
      }
      if (effect.immediate.physicalHealthMod) {
        modifications.physicalHealth += effect.immediate.physicalHealthMod * currentStrength;
      }
      if (effect.immediate.resourceMod) {
        modifications.resources += effect.immediate.resourceMod * currentStrength;
      }
      if (effect.immediate.incomeMod) {
        modifications.income += effect.immediate.incomeMod * currentStrength;
      }
    }

    // Clean up inactive effects
    this.activeEffects.set(
      playerId,
      effects.filter(e => e.isActive)
    );

    return modifications;
  }

  /**
   * Calculate effect strength based on decay type
   * @param {Object} effect - The effect configuration
   * @returns {number} - Strength multiplier (0-1)
   */
  calculateDecayedStrength(effect) {
    if (effect.duration === 0) return 1.0; // Permanent effects don't decay

    const progress = effect.monthsActive / effect.duration; // 0-1

    switch (effect.decayType) {
      case 'none':
        return 1.0; // Full strength until expiration

      case 'linear':
        return Math.max(0, 1 - progress); // Straight line decay

      case 'exponential':
        // Fast recovery initially, then slows down
        return Math.exp(-3 * progress); // e^(-3x) gives nice curve

      case 'step':
        // Maintains full strength, then drops to zero
        return progress < 0.9 ? 1.0 : 0.0;

      case 'inverse':
        // Gets worse over time (for chronic conditions)
        return Math.min(2.0, 1 + progress);

      default:
        return 1.0;
    }
  }

  /**
   * Apply immediate effect to player stats
   * @param {Object} player - The player object
   * @param {Object} immediate - Immediate effect modifiers
   */
  applyImmediateEffect(player, immediate) {
    if (immediate.mentalHealthMod) {
      player.health.mental.current = Math.max(
        0,
        Math.min(100, player.health.mental.current + immediate.mentalHealthMod)
      );
    }

    if (immediate.physicalHealthMod) {
      player.health.physical.current = Math.max(
        0,
        Math.min(100, player.health.physical.current + immediate.physicalHealthMod)
      );
    }

    if (immediate.resourceMod) {
      player.economics.resources.current += immediate.resourceMod;
    }

    if (immediate.incomeMod) {
      player.economics.income.current += immediate.incomeMod;
    }
  }

  /**
   * Apply residual effect (permanent scar after recovery)
   * @param {Object} player - The player object
   * @param {Object} residual - Residual effect modifiers
   */
  applyResidualEffect(player, residual) {
    if (!residual || Object.keys(residual).length === 0) return;

    if (residual.mentalHealthBaseline) {
      player.health.mental.baseline = Math.max(
        0,
        player.health.mental.baseline + residual.mentalHealthBaseline
      );
    }

    if (residual.physicalHealthBaseline) {
      player.health.physical.baseline = Math.max(
        0,
        player.health.physical.baseline + residual.physicalHealthBaseline
      );
    }
  }

  /**
   * Get all active effects for a player
   * @param {Object} player - The player object
   * @returns {Array} - List of active effects
   */
  getActiveEffects(player) {
    const playerId = this.getPlayerId(player);
    return (this.activeEffects.get(playerId) || []).filter(e => e.isActive);
  }

  /**
   * Cancel a specific effect
   * @param {Object} player - The player object
   * @param {string} effectId - Effect ID or name to cancel
   */
  cancelEffect(player, effectId) {
    const playerId = this.getPlayerId(player);
    const effects = this.activeEffects.get(playerId) || [];
    
    for (const effect of effects) {
      if (effect.id === effectId || effect.name === effectId) {
        effect.isActive = false;
      }
    }
  }

  /**
   * Clear all effects for a player (used on death or reset)
   * @param {Object} player - The player object
   */
  clearEffects(player) {
    const playerId = this.getPlayerId(player);
    this.activeEffects.delete(playerId);
  }

  /**
   * Generate unique effect ID
   * @returns {string} - Unique ID
   */
  generateEffectId() {
    return `effect_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get consistent player ID
   * @param {Object} player - The player object
   * @returns {string} - Player ID
   */
  getPlayerId(player) {
    if (!player._temporalEffectsId) {
      player._temporalEffectsId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    return player._temporalEffectsId;
  }
}

// ============================================================================
// EFFECT TEMPLATES - Common temporal patterns
// ============================================================================

const EffectTemplates = {
  // Temporary shock with recovery
  jobLoss: {
    name: 'Job Loss',
    category: 'economic',
    immediate: { 
      mentalHealthMod: -20,
      incomeMod: -15
    },
    duration: 6, // months
    decayType: 'linear', // Recovers linearly if re-employed
    residual: {
      mentalHealthBaseline: -2 // Slight permanent anxiety
    }
  },

  // Permanent loss with slow recovery
  parentDeath: {
    name: 'Parent Death',
    category: 'social',
    immediate: {
      mentalHealthMod: -40
    },
    duration: 24, // 2 years to process grief
    decayType: 'exponential', // Fast initial recovery, then slows
    residual: {
      mentalHealthBaseline: -5 // Permanent grief scar
    }
  },

  // Conditional effect (active while condition true)
  marriage: {
    name: 'Marriage',
    category: 'social',
    immediate: {
      mentalHealthMod: 20
    },
    duration: 0, // Permanent while married
    condition: (player) => player.relationships.married,
    decayType: 'none'
  },

  // Worsening over time
  chronicIllness: {
    name: 'Chronic Illness',
    category: 'physical',
    immediate: {
      physicalHealthMod: -10
    },
    duration: 0, // Permanent
    decayType: 'inverse', // Gets worse over time
    residual: {}
  },

  // Education - permanent benefit
  universityCompletion: {
    name: 'University Degree',
    category: 'education',
    immediate: {
      mentalHealthMod: 10,
      incomeMod: 15
    },
    duration: 0, // Permanent
    decayType: 'none'
  },

  // Short-term boost
  promotion: {
    name: 'Job Promotion',
    category: 'economic',
    immediate: {
      mentalHealthMod: 15,
      incomeMod: 10
    },
    duration: 6, // months
    decayType: 'step', // Maintains full effect, then normalizes
    residual: {
      incomeMod: 5 // Keep higher salary
    }
  }
};

module.exports = {
  TemporalEffectsSystem,
  EffectTemplates
};
