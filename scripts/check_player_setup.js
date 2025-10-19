const GameEngine = require('../game_engine_v2_homeostatic.js');
const fs = require('fs');

// Load cards
const birthCards = JSON.parse(fs.readFileSync('./birth_cards_json.json', 'utf8'));
const familyCards = JSON.parse(fs.readFileSync('./family_cards_json.json', 'utf8'));
const allEvents = [];
const deathCards = JSON.parse(fs.readFileSync('./death_cards_json.json', 'utf8'));

const engine = new GameEngine(birthCards, familyCards, allEvents, deathCards);

console.log('=== Check: Where are the 1M suicides coming from? ===\n');

// Create several players with birthCards[0] (Nordic) and check one full lifespan each
let totalSuicides = 0;
let totalDeaths = 0;

for (let i = 0; i < 100; i++) {
  engine.createPlayer(birthCards[0], familyCards[0], { sex: 'male' });
  const p = engine.player;
  
  // Check player setup
  if (i === 0) {
    console.log(`Player creation:
    Card: ${birthCards[0].name}
    Region: ${p.demographics.region}
    Birth Region: ${p.demographics.birthRegion}
    Survival at birth: ${p.survival}
    Mental Health baseline: ${p.health.mental.baseline}
    Age: ${p.demographics.age}
    \n`);
  }
  
  // Run full life
  while (p.alive && p.demographics.age < 120) {
    engine.processYearEnd(p);
  }
  
  totalDeaths++;
  if (p.causeOfDeath === 'Suicide') {
    totalSuicides++;
    console.log(`Suicide at age ${p.demographics.age}, cause: ${p.causeOfDeath}`);
  }
}

console.log(`\n100 Nordic lives: ${totalSuicides} suicides (${totalSuicides * 1000}/100K)`);
console.log(`Expected: 10-15/100K`);

console.log('\n=== Testing with mixed birth cards ===\n');

totalSuicides = 0;
totalDeaths = 0;

for (let i = 0; i < 100; i++) {
  // Pick random birth card
  const card = birthCards[Math.floor(Math.random() * birthCards.length)];
  engine.createPlayer(card, familyCards[0], { sex: 'male' });
  const p = engine.player;
  
  // Run full life
  while (p.alive && p.demographics.age < 120) {
    engine.processYearEnd(p);
  }
  
  totalDeaths++;
  if (p.causeOfDeath === 'Suicide') {
    totalSuicides++;
  }
}

console.log(`100 mixed-region lives: ${totalSuicides} suicides (${totalSuicides * 1000}/100K)`);
console.log(`Expected varies by region`);
