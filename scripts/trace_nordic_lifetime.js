const GameEngine = require('../game_engine_v2_homeostatic.js');
const fs = require('fs');

// Load cards
const birthCards = JSON.parse(fs.readFileSync('../data/birth_cards_json.json', 'utf8'));
const familyCards = JSON.parse(fs.readFileSync('../data/family_cards_json.json', 'utf8'));
const allEvents = [];
const deathCards = JSON.parse(fs.readFileSync('../data/death_cards_json.json', 'utf8'));

const engine = new GameEngine(birthCards, familyCards, allEvents, deathCards);

console.log('=== Trace: Single lifetime, show suicide attempts ===\n');

engine.createPlayer(birthCards[0], familyCards[0], { sex: 'male' });  // Nordic
const p = engine.player;

let suicideAttempts = 0;
let suicideDeaths = 0;

while (p.alive && p.demographics.age < 80) {
  const ageStart = p.demographics.age;
  
  // Before processing year
  const { getAdjustedProbability } = require('../global_statistics.js');
  const baseline = getAdjustedProbability("suicide", p.demographics.age, p.demographics.sex, engine.mapRegionForStatistics(p.demographics.birthRegion));
  
  engine.processYearEnd(p);
  
  if (!p.alive && p.causeOfDeath === 'Suicide') {
    suicideDeaths++;
    console.log(`Age ${ageStart}: SUICIDE - baseline was ${baseline.toFixed(6)}%, risk was ${p.health.mental.suicideRisk}.toFixed(6)}%`);
  }
  
  if (p.alive) p.demographics.age++;
}

console.log(`\n${p.demographics.region} person lived ${p.demographics.age} years`);
console.log(`Suicides: ${suicideDeaths}, Cause of death: ${p.causeOfDeath}`);

// Now run 100 complete lifetimes and tally
console.log('\n=== 100 Nordic complete lifetimes ===\n');

let totalSuicides = 0;
let totalPersonYears = 0;

for (let i = 0; i < 100; i++) {
  engine.createPlayer(birthCards[0], familyCards[0], { sex: Math.random() > 0.5 ? 'male' : 'female' });
  const player = engine.player;
  
  while (player.alive && player.demographics.age < 120) {
    engine.processYearEnd(player);
    if (player.alive) totalPersonYears++;
  }
  
  if (player.causeOfDeath === 'Suicide') {
    totalSuicides++;
  }
}

const suicideRate = totalPersonYears > 0 ? (totalSuicides / totalPersonYears * 100000).toFixed(1) : '0';
console.log(`100 lives: ${totalSuicides} suicides in ${totalPersonYears} person-years`);
console.log(`Rate: ${suicideRate}/100K`);
console.log(`Expected Nordic: 10-15/100K`);

