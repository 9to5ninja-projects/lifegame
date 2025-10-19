const GameEngine = require('../game_engine_v2_homeostatic.js');
const fs = require('fs');

// Load cards
const birthCards = JSON.parse(fs.readFileSync('./birth_cards_json.json', 'utf8'));
const familyCards = JSON.parse(fs.readFileSync('./family_cards_json.json', 'utf8'));
const allEvents = [];
const deathCards = JSON.parse(fs.readFileSync('./death_cards_json.json', 'utf8'));

const engine = new GameEngine(birthCards, familyCards, allEvents, deathCards);

console.log('=== Debug: Check birthRegion and statistics mapping ===\n');

// Create a few players and check
for (let i = 0; i < 5; i++) {
  const card = birthCards[i % birthCards.length];
  engine.createPlayer(card, familyCards[0], { sex: 'male' });
  const p = engine.player;
  
  const statRegion = engine.mapRegionForStatistics(p.demographics.birthRegion);
  
  console.log(`Player ${i+1}:`);
  console.log(`  Birth card: ${card.name}`);
  console.log(`  birthRegion field: ${p.demographics.birthRegion}`);
  console.log(`  Mapped to statistics: ${statRegion}`);
  console.log(`  Age: ${p.demographics.age}, Sex: ${p.demographics.sex}`);
  
  // Calculate suicide risk and show the baseline
  p.demographics.age = 20;  // Test age
  
  const { getGlobalBaseline, getAdjustedProbability } = require('../global_statistics.js');
  const baseline = getGlobalBaseline("suicide", 20, "male");
  const adjusted = getAdjustedProbability("suicide", 20, "male", statRegion);
  
  engine.calculateSuicideRisk(p);
  
  console.log(`  Global baseline (age 20 male): ${baseline.toFixed(6)}%`);
  console.log(`  Regional adjusted (${statRegion}): ${adjusted.toFixed(6)}%`);
  console.log(`  Engine calculated suicideRisk: ${p.health.mental.suicideRisk.toFixed(6)}%`);
  console.log();
}
