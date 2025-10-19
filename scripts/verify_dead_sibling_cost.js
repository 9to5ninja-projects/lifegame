// Verify: dead siblings don't cost resources
const MortalityGameIntegrated = require('./game_engine_integrated.js');
const fs = require('fs');

// Load cards
const birthCards = JSON.parse(fs.readFileSync('./birth_cards_json.json', 'utf8'));
const familyCards = JSON.parse(fs.readFileSync('./family_cards_json.json', 'utf8'));
const eventCardsChildhood = JSON.parse(fs.readFileSync('./event_cards_childhood_v2.json', 'utf8'));
const eventCardsTeens = JSON.parse(fs.readFileSync('./event_cards_teen_v2.json', 'utf8'));
const eventCardsAdult = JSON.parse(fs.readFileSync('./event_cards_adult_v2.json', 'utf8'));
const deathCards = JSON.parse(fs.readFileSync('./death_cards_json.json', 'utf8'));

// Combine event cards
const allEventCards = [
  ...eventCardsChildhood,
  ...eventCardsTeens,
  ...eventCardsAdult
];

console.log(`📊 VERIFY: DEAD SIBLINGS DON'T INCUR COSTS\n`);

// Play 5 games where siblings die early
for (let gameNum = 0; gameNum < 5; gameNum++) {
  const game = new MortalityGameIntegrated(birthCards, familyCards, allEventCards, deathCards);
  game.createPlayer();
  
  const startingSiblings = game.player.relationships.siblings.filter(s => s.alive).length;
  
  // Mark a sibling as dead manually
  if (game.player.relationships.siblings.length > 0) {
    game.player.relationships.siblings[0].alive = false;
  }
  
  const deadSiblingCount = game.player.relationships.siblings.filter(s => !s.alive).length;
  const aliveSiblingCount = game.player.relationships.siblings.filter(s => s.alive).length;
  
  console.log(`Game ${gameNum + 1}:`);
  console.log(`  Starting siblings: ${startingSiblings}`);
  console.log(`  Dead: ${deadSiblingCount}, Alive: ${aliveSiblingCount}`);
  
  // Play one year and watch costs
  const resourcesBefore = game.player.economics.resources.current;
  
  // Manually call drift to see the cost calculation
  game.v2Engine.driftEconomics(game.player);
  
  const resourcesAfter = game.player.economics.resources.current;
  const cost = resourcesBefore - resourcesAfter;
  
  console.log(`  Resources: ${resourcesBefore.toFixed(1)} → ${resourcesAfter.toFixed(1)}`);
  console.log(`  Cost this year: ${cost.toFixed(1)}`);
  console.log(`  Expected cost: ${aliveSiblingCount * 4} (${aliveSiblingCount} siblings × 4/year)`);
  console.log();
}

console.log(`✅ MECHANICS WORKING IF:`);
console.log(`  • Dead siblings show in 'alive' filter but not counted in costs`);
console.log(`  • Cost calculation only includes alive siblings`);
