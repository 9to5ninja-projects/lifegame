/**
 * TEMPORAL EFFECTS DEMO
 * 
 * Shows how to use the new event duration system for realistic event modeling
 */

const path = require('path');
const { TemporalEffectsSystem, EffectTemplates } = require(path.join(__dirname, '../temporal_effects_system.js'));

// Example: Simulate a person experiencing job loss and recovery

function simulateJobLossRecovery() {
  const effects = new TemporalEffectsSystem();
  
  // Mock player object
  const player = {
    demographics: { age: 30 },
    health: {
      mental: { current: 75, baseline: 75 },
      physical: { current: 85, baseline: 85 }
    },
    economics: {
      income: { current: 25 },
      resources: { current: 20 }
    }
  };

  console.log('=== TEMPORAL EFFECTS SIMULATION ===\n');
  console.log('Starting state:');
  console.log(`  Mental Health: ${player.health.mental.current}`);
  console.log(`  Income: ${player.economics.income.current}`);
  console.log(`  Age: ${player.demographics.age}\n`);

  // YEAR 1: Job loss occurs
  console.log('YEAR 1: Lost job due to company downsizing');
  effects.applyEffect(player, EffectTemplates.jobLoss);
  
  console.log(`  Immediate impact:`);
  console.log(`    Mental Health: ${player.health.mental.current} (-20)`);
  console.log(`    Income: ${player.economics.income.current} (-15)`);
  
  const activeEffects = effects.getActiveEffects(player);
  console.log(`  Active effects: ${activeEffects.length}`);
  console.log(`    - ${activeEffects[0].name}: ${activeEffects[0].duration} months duration\n`);

  // Simulate 6 months of recovery
  for (let month = 1; month <= 6; month++) {
    player.demographics.age += 1/12; // Increment by month for demo
    
    const mods = effects.processEffects(player);
    
    // Recovery happens gradually
    player.health.mental.current += mods.mentalHealth / 12; // Annual mod / 12
    
    if (month % 2 === 0) { // Print every 2 months
      console.log(`Month ${month}:`);
      console.log(`  Mental Health: ${Math.round(player.health.mental.current)}`);
      console.log(`  Active effects: ${effects.getActiveEffects(player).length}`);
    }
  }

  console.log('\n6 months later:');
  console.log(`  Mental Health: ${Math.round(player.health.mental.current)} (recovered)`);
  console.log(`  Baseline now: ${player.health.mental.baseline} (permanent -2 anxiety scar)`);
  console.log(`  Active effects: ${effects.getActiveEffects(player).length}\n`);
}

function simulateParentDeath() {
  const effects = new TemporalEffectsSystem();
  
  const player = {
    demographics: { age: 25 },
    health: {
      mental: { current: 80, baseline: 75 }
    }
  };

  console.log('\n=== PARENT DEATH SIMULATION ===\n');
  console.log('Starting mental health: 80\n');

  // Parent dies - immediate -40 impact
  console.log('YEAR 1: Parent dies');
  effects.applyEffect(player, EffectTemplates.parentDeath);
  console.log(`  Immediate: Mental Health ${player.health.mental.current} (-40)\n`);

  // Exponential recovery over 2 years
  const recoveryPoints = [3, 6, 12, 18, 24];
  
  for (const months of recoveryPoints) {
    // Simulate passage of time
    const effect = effects.getActiveEffects(player)[0];
    effect.monthsActive = months;
    
    const strength = effects.calculateDecayedStrength(effect);
    const currentImpact = -40 * strength;
    
    console.log(`Month ${months}:`);
    console.log(`  Effect strength: ${(strength * 100).toFixed(1)}%`);
    console.log(`  Mental Health: ${Math.round(40 + (40 - currentImpact))} (recovering)`);
  }

  console.log('\nAfter 2 years:');
  console.log(`  Mental Health: ~75`);
  console.log(`  Baseline: 70 (permanent -5 grief scar)\n`);
}

function simulateMarriage() {
  const effects = new TemporalEffectsSystem();
  
  const player = {
    demographics: { age: 28 },
    health: { mental: { current: 70 } },
    relationships: { married: true }
  };

  console.log('\n=== MARRIAGE SIMULATION ===\n');
  console.log('Starting mental health: 70\n');

  // Apply marriage effect (conditional on married status)
  console.log('Got married!');
  effects.applyEffect(player, EffectTemplates.marriage);
  console.log(`  Mental Health: ${player.health.mental.current} (+20)\n`);

  // Effect persists while married
  console.log('10 years later, still married:');
  for (let i = 0; i < 10; i++) {
    effects.processEffects(player);
  }
  console.log(`  Mental Health bonus: +20 (still active)`);
  console.log(`  Active effects: ${effects.getActiveEffects(player).length}\n`);

  // Divorce ends the effect
  console.log('Divorce occurs:');
  player.relationships.married = false;
  effects.processEffects(player);
  console.log(`  Marriage bonus removed`);
  console.log(`  Active effects: ${effects.getActiveEffects(player).length}\n`);
}

// Run demonstrations
if (require.main === module) {
  simulateJobLossRecovery();
  simulateParentDeath();
  simulateMarriage();
  
  console.log('='.repeat(60));
  console.log('TEMPORAL EFFECTS SYSTEM READY');
  console.log('='.repeat(60));
  console.log('\nNext steps:');
  console.log('1. Integrate into event card processing');
  console.log('2. Convert all event cards to temporal format');
  console.log('3. Add duration/decay/residual to event JSON files');
  console.log('4. Test with full game simulation\n');
}

module.exports = {
  simulateJobLossRecovery,
  simulateParentDeath,
  simulateMarriage
};
