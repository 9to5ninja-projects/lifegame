const GameEngine = require('../game_engine_v2_homeostatic.js');
const fs = require('fs');

// Load cards
const birthCards = JSON.parse(fs.readFileSync('../data/birth_cards_json.json', 'utf8'));
const familyCards = JSON.parse(fs.readFileSync('../data/family_cards_json.json', 'utf8'));
const allEvents = [];
const deathCards = JSON.parse(fs.readFileSync('../data/death_cards_json.json', 'utf8'));

const engine = new GameEngine(birthCards, familyCards, allEvents, deathCards);

console.log('=== DEBUG: Trace suicide mechanics ===\n');

// Create a single player and run through year processing
engine.createPlayer(birthCards[0], familyCards[0], { sex: 'male' });
const player = engine.player;

console.log(`Player created: ${player.demographics.region}, age ${player.demographics.age}`);
console.log(`Initial mental health: ${player.health.mental.current}`);
console.log(`Initial survival: ${player.survival}`);

// Age to 20
player.demographics.age = 20;
console.log(`\nAged to: ${player.demographics.age}`);

// Run through a full year multiple times
for (let year = 0; year < 5 && player.alive; year++) {
  console.log(`\n--- Year ${year + 1} ---`);
  console.log(`Before: Mental=${player.health.mental.current}, Alive=${player.alive}, Survival=${player.survival}`);
  
  // Calculate suicide risk
  engine.calculateSuicideRisk(player);
  console.log(`Suicide risk after calculation: ${player.health.mental.suicideRisk}%`);
  
  if (player.demographics.age >= 15 && player.health.mental.suicideRisk > 0.05) {
    const suicideRoll = Math.random();
    const suicideThreshold = player.health.mental.suicideRisk / 100;
    console.log(`  -> Suicide check: roll=${suicideRoll.toFixed(6)}, threshold=${suicideThreshold.toFixed(6)}`);
    console.log(`  -> Would attempt? ${suicideRoll < suicideThreshold}`);
  }
  
  // Process year
  engine.processYearEnd(player);
  
  console.log(`After: Mental=${player.health.mental.current}, Alive=${player.alive}, Cause=${player.causeOfDeath || 'none'}`);
}

console.log('\n=== Check: What causes of death are actually possible? ===\n');

// Check death cards
const deathCardCauses = deathCards.map(c => c.cause || c.name || 'Unknown').filter(c => c);
console.log(`Death card causes available: ${deathCardCauses.length} types`);
deathCardCauses.forEach(c => console.log(`  - ${c}`));

console.log('\n=== Testing 100 players for suicide rate ===\n');

let suicides = 0;
let nonSuicides = 0;

for (let i = 0; i < 100; i++) {
  engine.createPlayer(birthCards[0], familyCards[0], { sex: Math.random() > 0.5 ? 'male' : 'female' });
  const p = engine.player;
  
  p.demographics.age = 20;  // Start at adult
  
  // Run one year
  engine.processYearEnd(p);
  
  if (p.causeOfDeath === 'Suicide') {
    suicides++;
    console.log(`${i+1}: SUICIDE at age ${p.demographics.age}`);
  } else if (!p.alive) {
    nonSuicides++;
    console.log(`${i+1}: ${p.causeOfDeath} at age ${p.demographics.age}`);
  }
}

console.log(`\nOut of 100: ${suicides} suicides, ${nonSuicides} other deaths`);

