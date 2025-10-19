const GameEngine = require('../game_engine_v2_homeostatic.js');
const fs = require('fs');

// Load cards
const birthCards = JSON.parse(fs.readFileSync('./birth_cards_json.json', 'utf8'));
const familyCards = JSON.parse(fs.readFileSync('./family_cards_json.json', 'utf8'));
const allEvents = [];
const deathCards = JSON.parse(fs.readFileSync('./death_cards_json.json', 'utf8'));

const engine = new GameEngine(birthCards, familyCards, allEvents, deathCards);

console.log('=== SUICIDE RATE TEST: 1,000,000 LIVES ===\n');
console.log('Testing full life simulation from birth to death...\n');

const startTime = Date.now();
let suicideDeaths = 0;
let totalDeaths = 0;
const suicidesByAge = {};
const suicidesByRegion = {};

for (let i = 0; i < 1000000; i++) {
  if ((i + 1) % 100000 === 0) {
    console.log(`Processed ${i + 1}/1000000 lives...`);
  }

  // Create player from Nordic (most common start)
  engine.createPlayer(birthCards[0], familyCards[0], { sex: Math.random() > 0.5 ? 'male' : 'female' });
  const player = engine.player;
  
  const region = player.demographics.region;
  if (!suicidesByRegion[region]) suicidesByRegion[region] = 0;

  // Simulate entire life
  while (player.alive && player.demographics.age < 120) {
    // Call processYearEnd which includes suicide check
    engine.processYearEnd(player);
    
    if (!player.alive) {
      totalDeaths++;
      if (player.causeOfDeath === 'Suicide') {
        suicideDeaths++;
        suicidesByRegion[region]++;
        
        const ageGroup = Math.floor(player.demographics.age / 10) * 10;
        if (!suicidesByAge[ageGroup]) suicidesByAge[ageGroup] = 0;
        suicidesByAge[ageGroup]++;
      }
      break;
    }
  }
}

const elapsedTime = (Date.now() - startTime) / 1000;
const suicideRate = (suicideDeaths / 1000000) * 100000;

console.log('\n=== RESULTS ===\n');
console.log(`Total lives simulated: 1,000,000`);
console.log(`Total deaths: ${totalDeaths}`);
console.log(`Suicide deaths: ${suicideDeaths}`);
console.log(`Suicide rate: ${suicideRate.toFixed(1)}/100K`);
console.log(`Expected (Nordic): 10-15/100K`);
console.log(`Status: ${suicideRate > 50 ? '❌ STILL 50x TOO HIGH' : suicideRate > 20 ? '❌ 2x TOO HIGH' : suicideRate > 5 ? '⚠️  NEEDS ADJUSTMENT' : '✅ IN RANGE'}`);
console.log(`\nElapsed time: ${elapsedTime.toFixed(1)}s`);

console.log('\n=== SUICIDES BY AGE GROUP ===');
Object.keys(suicidesByAge).sort((a, b) => a - b).forEach(age => {
  const count = suicidesByAge[age];
  const pct = ((count / suicideDeaths) * 100).toFixed(1);
  console.log(`  Ages ${age}-${age+9}: ${count} suicides (${pct}%)`);
});

console.log('\n=== SUICIDES BY REGION ===');
Object.keys(suicidesByRegion).forEach(region => {
  const count = suicidesByRegion[region];
  const pct = ((count / suicideDeaths) * 100).toFixed(1);
  console.log(`  ${region}: ${count} suicides (${pct}%)`);
});
