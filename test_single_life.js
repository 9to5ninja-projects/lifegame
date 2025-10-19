// Debug: Test a single life cycle
const fs = require('fs');
const path = require('path');

const MortalityGameV2 = require('./game_engine_v2_homeostatic.js');

const birthCards = JSON.parse(fs.readFileSync('./birth_cards_json.json', 'utf8'));
const familyCards = JSON.parse(fs.readFileSync('./family_cards_json.json', 'utf8'));
const deathCards = JSON.parse(fs.readFileSync('./death_cards_json.json', 'utf8'));
const eventCards = {
  childhood: JSON.parse(fs.readFileSync('./event_cards_childhood.json', 'utf8')),
  teen: JSON.parse(fs.readFileSync('./event_cards_teen.json', 'utf8')),
  adult: JSON.parse(fs.readFileSync('./event_cards_adult.json', 'utf8'))
};

const game = new MortalityGameV2(birthCards, familyCards, eventCards, deathCards);

console.log("=== SINGLE LIFE DEBUG ===\n");

const birthCard = birthCards[0];
const familyCard = familyCards[0];

console.log(`Birth Card: ${birthCard.name}`);
console.log(`Family Card: ${familyCard.name}`);

game.createPlayer(birthCard, familyCard);
const p = game.player;

console.log(`\nPlayer created: Age ${p.demographics.age}, Survival: ${p.survival}`);
console.log(`Health: ${p.health.physical.current}/${p.health.physical.baseline}`);
console.log(`Alive: ${p.alive}`);
console.log(`Expected: survival > roll for survival, roll is 1-100\n`);

// Process a few years
for (let year = 0; year < 5; year++) {
  console.log(`--- Year ${year} (Age ${p.demographics.age}) ---`);
  console.log(`Before: Survival ${p.survival}, Alive: ${p.alive}`);
  
  const result = game.processYearEnd(p);
  
  console.log(`After: Age ${p.demographics.age}, Survival ${p.survival}, Alive: ${result.alive}, Result: ${JSON.stringify(result)}`);
  
  if (!result.alive) {
    console.log(`\nDied at age ${p.demographics.age} from ${result.cause}`);
    break;
  }
  console.log();
}
