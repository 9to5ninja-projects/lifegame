const GameEngine = require('../game_engine_v2_homeostatic.js');
const fs = require('fs');

// Load cards
const birthCards = JSON.parse(fs.readFileSync('../birth_cards_json.json', 'utf8'));
const familyCards = JSON.parse(fs.readFileSync('../family_cards_json.json', 'utf8'));

// Use empty event/death cards to avoid format issues
const engine = new GameEngine(birthCards, familyCards, [], []);

console.log('Creating one player at age 18...');

const birthCard = birthCards[0];
const familyCard = familyCards[0];

console.log('Birth card:', birthCard.name);
console.log('Family card:', familyCard.name);

engine.createPlayer(birthCard, familyCard, {
  sex: 'male',
  birthRegion: 'Nordic Country',
});

console.log('✓ Player created');
console.log('Age:', engine.player.demographics.age);
console.log('Employment:', engine.player.economics.income.employed);
console.log('Mental:', engine.player.health.mental.current);

console.log('\nSimulating one year...');
const result = engine.processYearEnd(engine.player);
console.log('✓ Year processed');
console.log('Result:', result);
console.log('Age now:', engine.player.demographics.age);
console.log('Employment now:', engine.player.economics.income.employed);
console.log('Mental now:', engine.player.health.mental.current);
