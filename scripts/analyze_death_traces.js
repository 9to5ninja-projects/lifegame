/**
 * DEATH TRACE ANALYSIS
 * 
 * Demonstrates the death tracing system with multiple traces,
 * showing causal chains for different causes of death.
 */

const fs = require('fs');
const path = require('path');
const MortalityGameV2 = require('./game_engine_v2_homeostatic.js');
const DeathTracer = require('./death_trace_system.js');

// Load game data
console.log('Loading game data...');
const birthCards = JSON.parse(fs.readFileSync('./birth_cards_json.json', 'utf8'));
const familyCards = JSON.parse(fs.readFileSync('./family_cards_json.json', 'utf8'));
const eventCards = {
  childhood: JSON.parse(fs.readFileSync('./event_cards_childhood.json', 'utf8')),
  teen: JSON.parse(fs.readFileSync('./event_cards_teen.json', 'utf8')),
  adult: JSON.parse(fs.readFileSync('./event_cards_adult.json', 'utf8')),
};
const deathCards = JSON.parse(fs.readFileSync('./death_cards_json.json', 'utf8'));

// Create engine with tracer
const tracer = new DeathTracer();
const engine = new MortalityGameV2(birthCards, familyCards, eventCards, deathCards, tracer);

// Run multiple lives to show different death patterns
const numLives = 10;
const deathTraces = [];

console.log(`\nSimulating ${numLives} lives from Nordic Country...\n`);

for (let i = 0; i < numLives; i++) {
  // Pick Nordic birth card
  const birthCard = birthCards.find(b => b.name === 'Nordic Country') || birthCards[0];
  
  // Create new engine instance for each life (fresh tracer)
  const lifeTracer = new DeathTracer();
  const lifeEngine = new MortalityGameV2(birthCards, familyCards, eventCards, deathCards, lifeTracer);
  
  // Create player
  lifeEngine.createPlayer(birthCard, familyCards[0], {
    sex: Math.random() > 0.5 ? 'male' : 'female'
  });
  
  const player = lifeEngine.player;
  let age = 0;
  
  // Simulate life
  while (player.alive && age < 150) {
    age++;
    player.demographics.age = age;
    lifeEngine.driftPlayerState(player);
    
    if (!player.alive) {
      break;
    }
  }
  
  // Store trace
  const trace = lifeTracer.exportDeathTrace(player);
  deathTraces.push(trace);
  
  console.log(`Life ${i + 1}: ${player.demographics.sex} died at ${player.demographics.age} from ${player.causeOfDeath}`);
}

// ============================================================================
// ANALYZE PATTERNS
// ============================================================================

console.log('\n' + '='.repeat(80));
console.log('MORTALITY PATTERN ANALYSIS');
console.log('='.repeat(80));

const patterns = tracer.analyzeMortalityPatterns(
  deathTraces.map(t => ({
    demographics: t.player,
    causeOfDeath: t.death.context.disease || t.death.context.method || t.death.context.cause || 'Unknown'
  }))
);

console.log('\nPrimary Causes of Death:');
for (const [cause, count] of Object.entries(patterns.primaryCauses).sort((a, b) => b[1] - a[1])) {
  const percentage = ((count / deathTraces.length) * 100).toFixed(1);
  console.log(`  ${cause}: ${count} (${percentage}%)`);
}

console.log(`\nAge Statistics:`);
console.log(`  Average: ${(patterns.ageAtDeath.reduce((a, b) => a + b, 0) / patterns.ageAtDeath.length).toFixed(1)} years`);
console.log(`  Min: ${Math.min(...patterns.ageAtDeath)} years`);
console.log(`  Max: ${Math.max(...patterns.ageAtDeath)} years`);

// ============================================================================
// PRINT DETAILED TRACES FOR FIRST 3 LIVES
// ============================================================================

for (let i = 0; i < Math.min(3, deathTraces.length); i++) {
  console.log('\n\n' + '='.repeat(80));
  console.log(`LIFE #${i + 1} DETAILED TRACE`);
  console.log('='.repeat(80));
  
  const deathEvent = deathTraces[i].death;
  const player = {
    demographics: deathTraces[i].player,
    causeOfDeath: deathEvent.context.disease || deathEvent.context.method || deathEvent.context.cause
  };
  
  console.log(`\n${player.demographics.sex.toUpperCase()} - Lived ${player.demographics.age} years (Expected: ${player.demographics.lifeExpectancy})`);
  console.log(`Death: ${player.causeOfDeath}`);
  
  // Show turning points
  const causalChain = deathTraces[i].causalChain;
  if (causalChain.turningPoints.length > 0) {
    console.log('\nCritical Turning Points:');
    for (const point of causalChain.turningPoints.slice(0, 5)) {
      console.log(`  Age ${point.age}: ${point.type}${point.magnitude ? ` (magnitude: ${point.magnitude})` : ''}`);
    }
  }
  
  // Show lifetime challenges
  if (causalChain.lifetimeChallenges) {
    console.log('\nLifetime Challenges:');
    const challenges = causalChain.lifetimeChallenges;
    if (challenges.economicStruggle > 0) console.log(`  Economic Struggle: ${challenges.economicStruggle} events`);
    if (challenges.mentalHealthStruggle > 0) console.log(`  Mental Health Struggles: ${challenges.mentalHealthStruggle} events`);
    if (challenges.socialIsolation > 0) console.log(`  Social Isolation: ${challenges.socialIsolation} events`);
    if (challenges.healthCrisis > 0) console.log(`  Health Crises: ${challenges.healthCrisis} events`);
    if (challenges.employmentInstability > 0) console.log(`  Employment Instability: ${challenges.employmentInstability} events`);
  }
  
  // Show factors at death
  if (causalChain.immediateFactors) {
    console.log('\nContributing Factors at Death:');
    const factors = causalChain.immediateFactors;
    if (factors.healthFactors.length > 0) {
      console.log('  Health:');
      for (const f of factors.healthFactors) console.log(`    - ${f}`);
    }
    if (factors.economicFactors.length > 0) {
      console.log('  Economic:');
      for (const f of factors.economicFactors) console.log(`    - ${f}`);
    }
    if (factors.socialFactors.length > 0) {
      console.log('  Social:');
      for (const f of factors.socialFactors) console.log(`    - ${f}`);
    }
    if (factors.contextualFactors.length > 0) {
      console.log('  Contextual:');
      for (const f of factors.contextualFactors) console.log(`    - ${f}`);
    }
  }
  
  // Show last few events before death
  console.log('\nLast 10 Life Events:');
  const fullLog = deathTraces[i].fullLog;
  for (const event of fullLog.slice(-10)) {
    console.log(`  Age ${event.age}: ${event.eventType}`);
    if (event.eventType.startsWith('DEATH_')) {
      console.log(`    → FATAL`);
    }
  }
}

// ============================================================================
// EXPORT SUMMARY REPORT
// ============================================================================

const reportPath = './death_trace_analysis_report.json';
const report = {
  simulationMetadata: {
    numLives: numLives,
    region: 'Nordic Country',
    timestamp: new Date().toISOString(),
  },
  mortalityPatterns: patterns,
  traces: deathTraces,
};

fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(`\n>>> Full analysis exported to ${reportPath}`);

console.log('\n' + '='.repeat(80));
console.log('ANALYSIS COMPLETE');
console.log('='.repeat(80) + '\n');
