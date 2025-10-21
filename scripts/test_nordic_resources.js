const GameEngine = require('../game_engine_v2_homeostatic.js');
const fs = require('fs');

const birthCards = JSON.parse(fs.readFileSync('../data/birth_cards_json.json', 'utf8'));
const familyCards = JSON.parse(fs.readFileSync('../data/family_cards_json.json', 'utf8'));
const allEvents = [];
const deathCards = JSON.parse(fs.readFileSync('../data/death_cards_json.json', 'utf8'));

const engine = new GameEngine(birthCards, familyCards, allEvents, deathCards);

// Create Nordic player
const nordicCard = birthCards[0];
const familyCard = familyCards[0];

engine.createPlayer(nordicCard, familyCard, { sex: 'male' });
const player = engine.player;

console.log('Nordic Player Resources:');
console.log(`  Birth resourceMod: ${nordicCard.effects.resourceMod}`);
console.log(`  Starting current: ${player.economics.resources.current}`);
console.log(`  Starting baseline: ${player.economics.resources.baseline}`);
console.log(`  Starting income: ${player.economics.resources.income}`);
console.log();

// Simulate 20 years
console.log('Resource tracking over 20 years:');
for (let year = 0; year < 20 && player.alive; year++) {
  if (year % 2 === 0 || year < 5) {
    const income = player.economics.resources.income || 0;
    console.log(`Year ${year} (Age ${player.demographics.age}): Resources=${player.economics.resources.current.toFixed(1)}, Income=${income.toFixed(1)}`);
  }
  
  const result = engine.processYearEnd(player);
  if (!result.alive) {
    console.log(`DIED at age ${player.demographics.age}: ${player.causeOfDeath}`);
    break;
  }
}

console.log(`\nFinal: Age ${player.demographics.age}, Resources ${player.economics.resources.current.toFixed(1)}, Alive ${player.alive}`);

