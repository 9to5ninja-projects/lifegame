const GameEngine = require('../game_engine_v2_homeostatic.js');
const fs = require('fs');

// Load cards
const birthCards = JSON.parse(fs.readFileSync('../data/birth_cards_json.json', 'utf8'));
const familyCards = JSON.parse(fs.readFileSync('../data/family_cards_json.json', 'utf8'));
const allEvents = [];
const deathCards = JSON.parse(fs.readFileSync('../data/death_cards_json.json', 'utf8'));

const engine = new GameEngine(birthCards, familyCards, allEvents, deathCards);

console.log('=== Detailed Trace of Suicides: 100 players ===\n');

let suicides = 0;
let nonsuicides = 0;
let suicideAttempts = 0;

for (let i = 0; i < 100; i++) {
  engine.createPlayer(birthCards[0], familyCards[0], { sex: 'male' });
  const p = engine.player;
  
  p.demographics.age = 20;
  
  // Run one year
  engine.processYearEnd(p);
  
  if (!p.alive && p.causeOfDeath === 'Suicide') {
    suicides++;
    console.log(`${i+1}: SUICIDE at age ${p.demographics.age}`);
  } else if (!p.alive) {
    nonsuicides++;
  }
}

console.log(`\nOut of 100: ${suicides} suicides, ${nonsuicides} other deaths, ${100 - suicides - nonsuicides} survived`);
console.log(`Suicide rate from 1-year cohort: ${suicides}% (${suicides * 1000}/100K)`);

console.log('\n=== Check: 10-year lifespan for age 20 starters ===\n');

suicides = 0;
let totalYearsLived = 0;

for (let i = 0; i < 100; i++) {
  engine.createPlayer(birthCards[0], familyCards[0], { sex: 'male' });
  const p = engine.player;
  
  p.demographics.age = 20;
  
  while (p.alive && p.demographics.age < 30) {
    engine.processYearEnd(p);
    if (p.alive) totalYearsLived++;
  }
  
  if (!p.alive && p.causeOfDeath === 'Suicide') {
    suicides++;
  }
}

console.log(`100 players starting at age 20`);
console.log(`Total years lived: ${totalYearsLived}`);
console.log(`Suicides: ${suicides}`);
console.log(`Suicide rate: ${(suicides / totalYearsLived * 100).toFixed(2)}% annually = ${(suicides / totalYearsLived * 100000).toFixed(0)}/100K`);
console.log(`Expected: ~0.012-0.015% = 120-150/100K`);

console.log('\n=== Checking if it scales linearly ===\n');

// Run test with known parameters
let totalSuicides = 0;
let totalYears = 0;

for (let ageStart = 15; ageStart <= 50; ageStart += 5) {
  let ageSuicides = 0;
  let ageYears = 0;
  
  for (let i = 0; i < 50; i++) {
    engine.createPlayer(birthCards[0], familyCards[0], { sex: 'male' });
    const p = engine.player;
    
    p.demographics.age = ageStart;
    
    // Run 10 years or until death
    for (let y = 0; y < 10 && p.alive; y++) {
      engine.processYearEnd(p);
      if (p.alive) ageYears++;
    }
    
    if (!p.alive && p.causeOfDeath === 'Suicide') {
      ageSuicides++;
    }
  }
  
  const rate = ageYears > 0 ? (ageSuicides / ageYears * 100000).toFixed(0) : '0';
  console.log(`Ages ${ageStart}-${ageStart+9}: ${ageSuicides} suicides in ${ageYears} person-years = ${rate}/100K`);
  totalSuicides += ageSuicides;
  totalYears += ageYears;
}

console.log(`\nOverall: ${totalSuicides} suicides in ${totalYears} person-years = ${(totalSuicides/totalYears*100000).toFixed(0)}/100K`);
console.log(`Expected: 120-150/100K`);

