const GameEngine = require('./game_engine_v2_homeostatic.js');
const fs = require('fs');

// Load cards
const birthCards = JSON.parse(fs.readFileSync('./birth_cards_json.json', 'utf8'));
const familyCards = JSON.parse(fs.readFileSync('./family_cards_json.json', 'utf8'));
const allEvents = [];
const deathCards = JSON.parse(fs.readFileSync('./death_cards_json.json', 'utf8'));

const engine = new GameEngine(birthCards, familyCards, allEvents, deathCards);

console.log('=== DEBUG: Single Life Simulation ===\n');

// Create one player
engine.createPlayer(birthCards[0], familyCards[0], { sex: 'male' });
const player = engine.player;

console.log('Birth Region:', player.demographics.birthRegion);
console.log('Starting mental health:', player.health.mental.current);
console.log('Starting physical health:', player.health.physical.current);
console.log('Starting isolation:', player.relationships.social.isolation);
console.log('');

// Simulate life year by year with detailed logging
for (let year = 0; year < 30; year++) {
  const oldMental = player.health.mental.current;
  const oldPhysical = player.health.physical.current;
  const oldIncome = player.economics.income.current;

  // Manually call drift methods to trace
  try {
    engine.driftMentalHealthCrisis(player);
    engine.driftHealth(player);
    engine.driftCancer(player);
    engine.driftAccidents(player);
    engine.driftEconomics(player);
    engine.driftAddiction(player);
    engine.driftSubstanceAbuse(player);
    engine.driftCrimeRisk(player);
  } catch (err) {
    console.error('ERROR in drift methods:', err.message);
    console.error(err.stack);
    break;
  }

  const mentalDelta = player.health.mental.current - oldMental;
  const physicalDelta = player.health.physical.current - oldPhysical;
  const incomeDelta = player.economics.income.current - oldIncome;

  console.log(`Age ${player.demographics.age}: Mental ${oldMental}->${player.health.mental.current} (${mentalDelta > 0 ? '+' : ''}${mentalDelta}), ` +
    `Phys ${oldPhysical}->${player.health.physical.current} (${physicalDelta > 0 ? '+' : ''}${physicalDelta}), ` +
    `Suicide Risk: ${player.health.mental.suicideRisk.toFixed(6)}`, 
    player.health.mental.current < 40 ? '⚠️ CRISIS' : '');

  // Check if player triggers suicide
  if (player.demographics.age >= 10 && player.health.mental.suicideRisk > 0.001) {
    const suicideRoll = Math.random();
    const suicideThreshold = player.health.mental.suicideRisk / 100;
    console.log(`  -> Suicide check: roll=${suicideRoll.toFixed(6)}, threshold=${suicideThreshold.toFixed(6)} => ${suicideRoll < suicideThreshold ? 'ATTEMPT' : 'no attempt'}`);
  }

  player.demographics.age += 1;

  if (!player.alive) {
    console.log(`\nDeath at age ${player.demographics.age}: ${player.causeOfDeath}`);
    break;
  }
}

console.log('\n=== Final State ===');
console.log('Accidents:', player.health.accidents);
console.log('Substance Abuse:', player.health.substanceAbuse);
