const GameEngine = require('../game_engine_v2_homeostatic.js');
const fs = require('fs');

// Load cards
const birthCards = JSON.parse(fs.readFileSync('./birth_cards_json.json', 'utf8'));
const familyCards = JSON.parse(fs.readFileSync('./family_cards_json.json', 'utf8'));
const allEvents = [];
const deathCards = JSON.parse(fs.readFileSync('./death_cards_json.json', 'utf8'));

const engine = new GameEngine(birthCards, familyCards, allEvents, deathCards);

console.log('=== Test: Nordic-only 100K lives ===\n');

let nordicSuicides = 0;
let totalNordicDeaths = 0;

for (let i = 0; i < 100000; i++) {
  if ((i + 1) % 10000 === 0) {
    console.log(`Processed ${i + 1}/100000...`);
  }

  // Use ONLY Nordic card
  engine.createPlayer(birthCards[0], familyCards[0], { sex: Math.random() > 0.5 ? 'male' : 'female' });
  const player = engine.player;

  while (player.alive && player.demographics.age < 120) {
    engine.processYearEnd(player);
  }
  
  totalNordicDeaths++;
  if (player.causeOfDeath === 'Suicide') {
    nordicSuicides++;
  }
}

const nordicRate = (nordicSuicides / 100000) * 100000;
console.log(`\nNordic: ${nordicSuicides} suicides in 100K lives = ${nordicRate.toFixed(1)}/100K`);
console.log(`Expected: 10-15/100K`);

console.log('\n=== Test: Mixed regions 100K lives ===\n');

let mixedSuicides = 0;

for (let i = 0; i < 100000; i++) {
  if ((i + 1) % 10000 === 0) {
    console.log(`Processed ${i + 1}/100000...`);
  }

  // Use random birth card
  const card = birthCards[Math.floor(Math.random() * birthCards.length)];
  engine.createPlayer(card, familyCards[0], { sex: Math.random() > 0.5 ? 'male' : 'female' });
  const player = engine.player;

  while (player.alive && player.demographics.age < 120) {
    engine.processYearEnd(player);
  }
  
  if (player.causeOfDeath === 'Suicide') {
    mixedSuicides++;
  }
}

const mixedRate = (mixedSuicides / 100000) * 100000;
console.log(`\nMixed regions: ${mixedSuicides} suicides in 100K lives = ${mixedRate.toFixed(1)}/100K`);
console.log(`Weighted average should be ~15-20/100K depending on region mix`);

console.log('\n=== Birth card distribution ===');
birthCards.forEach((card, i) => {
  console.log(`${i}: ${card.name} (weight: ${card.weight})`);
});
