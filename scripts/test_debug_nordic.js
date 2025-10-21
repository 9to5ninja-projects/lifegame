const GameEngine = require('../game_engine_v2_homeostatic.js');
const fs = require('fs');

// Load cards
const birthCards = JSON.parse(fs.readFileSync('../data/birth_cards_json.json', 'utf8'));
const familyCards = JSON.parse(fs.readFileSync('../data/family_cards_json.json', 'utf8'));
const allEvents = [];
const deathCards = JSON.parse(fs.readFileSync('../data/death_cards_json.json', 'utf8'));

const engine = new GameEngine(birthCards, familyCards, allEvents, deathCards);

// Create Nordic player
const nordicCard = birthCards[0]; // "Nordic Country"
const familyCard = familyCards[0];

console.log('Nordic Birth Card:', nordicCard);
console.log();

engine.createPlayer(nordicCard, familyCard, { sex: 'male' });

const player = engine.player;

console.log('Player Created:');
console.log('  birthRegion:', player.demographics.birthRegion);
console.log('  survival (at birth):', player.survival);
console.log('  physical health:', player.health.physical.current);
console.log('  mental health:', player.health.mental.current);
console.log();

// Simulate 10 years
console.log('Year-by-year tracking:');
for (let year = 0; year < 10 && player.alive; year++) {
  console.log(`\nBefore Year ${year} processYearEnd:`);
  console.log(`  Age: ${player.demographics.age}`);
  console.log(`  Survival before: ${player.survival}`);
  console.log(`  Physical health: ${player.health.physical.current}`);
  console.log(`  Mental health: ${player.health.mental.current}`);
  
  const result = engine.processYearEnd(player);
  
  console.log(`After Year ${year} processYearEnd:`);
  console.log(`  Alive: ${player.alive}`);
  console.log(`  Survival after: ${player.survival}`);
  console.log(`  Age: ${player.demographics.age}`);
  
  if (!result.alive) {
    console.log(`  Cause of death: ${player.causeOfDeath}`);
    break;
  }
}

console.log('\nFinal State:');
console.log(`  Age at death: ${player.demographics.age}`);
console.log(`  Alive: ${player.alive}`);
console.log(`  Cause: ${player.causeOfDeath}`);

