const GameEngine = require('../game_engine_v2_homeostatic.js');
const fs = require('fs');

// Load cards
const birthCards = JSON.parse(fs.readFileSync('../data/birth_cards_json.json', 'utf8'));
const familyCards = JSON.parse(fs.readFileSync('../data/family_cards_json.json', 'utf8'));
const allEvents = [];
const deathCards = JSON.parse(fs.readFileSync('../data/death_cards_json.json', 'utf8'));

const engine = new GameEngine(birthCards, familyCards, allEvents, deathCards);

console.log('=== Testing 10,000 lives to find where suicides come from ===\n');

let suicideDeaths = 0;
let suicideAttempts = 0;
let totalDeaths = 0;
let deathByAge = {};

for (let i = 0; i < 10000; i++) {
  if ((i + 1) % 1000 === 0) {
    console.log(`Processed ${i + 1}/10000...`);
  }

  engine.createPlayer(birthCards[0], familyCards[0], { sex: Math.random() > 0.5 ? 'male' : 'female' });
  const player = engine.player;

  // Simulate entire life
  while (player.alive && player.demographics.age < 120) {
    // Before: store state
    const ageBefore = player.demographics.age;
    
    engine.processYearEnd(player);
    
    if (!player.alive) {
      totalDeaths++;
      
      if (!deathByAge[ageBefore]) {
        deathByAge[ageBefore] = { total: 0, suicides: 0, other: {} };
      }
      deathByAge[ageBefore].total++;
      
      if (player.causeOfDeath === 'Suicide') {
        suicideDeaths++;
        deathByAge[ageBefore].suicides++;
        if (i < 20) {  // Log first 20 for debugging
          console.log(`  Suicide at age ${ageBefore}`);
        }
      } else {
        const cause = player.causeOfDeath || 'unknown';
        deathByAge[ageBefore].other[cause] = (deathByAge[ageBefore].other[cause] || 0) + 1;
      }
      break;
    }
  }
}

const suicideRate = (suicideDeaths / 10000) * 100000;

console.log('\n=== RESULTS ===\n');
console.log(`Total lives: 10,000`);
console.log(`Total deaths: ${totalDeaths}`);
console.log(`Suicide deaths: ${suicideDeaths}`);
console.log(`Suicide rate: ${suicideRate.toFixed(1)}/100K`);
console.log(`Expected: 10-15/100K`);

console.log('\n=== SUICIDES BY AGE ===');
Object.keys(deathByAge).sort((a, b) => a - b).forEach(age => {
  const data = deathByAge[age];
  if (data.suicides > 0) {
    const pct = ((data.suicides / data.total) * 100).toFixed(1);
    console.log(`  Age ${age}: ${data.suicides}/${data.total} deaths (${pct}% of age deaths)`);
  }
});

console.log('\n=== TOP 10 DEATH CAUSES (ALL AGES) ===');
const causeStats = {};
Object.keys(deathByAge).forEach(age => {
  const data = deathByAge[age];
  Object.keys(data.other).forEach(cause => {
    causeStats[cause] = (causeStats[cause] || 0) + data.other[cause];
  });
  causeStats['Suicide'] = (causeStats['Suicide'] || 0) + data.suicides;
});

const sortedCauses = Object.entries(causeStats)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10);

sortedCauses.forEach(([cause, count]) => {
  const pct = ((count / totalDeaths) * 100).toFixed(1);
  console.log(`  ${cause}: ${count} (${pct}%)`);
});

