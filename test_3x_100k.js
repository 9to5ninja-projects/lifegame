const GameEngine = require('./game_engine_v2_homeostatic.js');
const fs = require('fs');

// Load cards
const birthCards = JSON.parse(fs.readFileSync('./birth_cards_json.json', 'utf8'));
const familyCards = JSON.parse(fs.readFileSync('./family_cards_json.json', 'utf8'));
const allEvents = [];
const deathCards = JSON.parse(fs.readFileSync('./death_cards_json.json', 'utf8'));

function runTest(testNum) {
  const engine = new GameEngine(birthCards, familyCards, allEvents, deathCards);

  let suicides = 0;
  let overdoses = 0;
  let totalDeaths = 0;
  const causeBreakdown = {};

  for (let i = 0; i < 100000; i++) {
    engine.createPlayer(birthCards[0], familyCards[0], { sex: Math.random() > 0.5 ? 'male' : 'female' });
    const player = engine.player;

    while (player.alive && player.demographics.age < 120) {
      engine.processYearEnd(player);
      if (!player.alive) {
        totalDeaths += 1;
        const cause = player.causeOfDeath || 'Unknown';
        causeBreakdown[cause] = (causeBreakdown[cause] || 0) + 1;

        if (cause === 'Suicide') {
          suicides += 1;
        } else if (cause && cause.includes('Overdose')) {
          overdoses += 1;
        }
        break;
      }
    }
  }

  const suicideRate = (suicides / 100000) * 100000;
  const overdoseRate = (overdoses / 100000) * 100000;

  console.log(`\n=== TEST ${testNum}: 100,000 LIVES ===`);
  console.log(`Suicides: ${suicides} (${suicideRate.toFixed(1)}/100K) - Target: 10-15/100K`);
  console.log(`Overdoses: ${overdoses} (${overdoseRate.toFixed(1)}/100K)`);
  console.log(`Total Deaths: ${totalDeaths}`);
  
  console.log(`\nTop causes:`);
  Object.entries(causeBreakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .forEach(([cause, count]) => {
      const pct = ((count / totalDeaths) * 100).toFixed(1);
      console.log(`  ${cause}: ${count} (${pct}%)`);
    });

  return { suicideRate, overdoseRate };
}

console.log('=== 3x EMPIRICAL TESTS: 100K LIVES EACH ===');
console.log('Running 3 independent simulations to check consistency...\n');

const results = [];
for (let t = 1; t <= 3; t++) {
  results.push(runTest(t));
}

console.log(`\n=== CONSISTENCY ANALYSIS ===`);
const suicideRates = results.map(r => r.suicideRate);
const avg = suicideRates.reduce((a, b) => a + b) / suicideRates.length;
const min = Math.min(...suicideRates);
const max = Math.max(...suicideRates);
const variance = max - min;
const variancePct = (variance / avg) * 100;

console.log(`Suicide rates: ${suicideRates.map(r => r.toFixed(1)).join(', ')} /100K`);
console.log(`Average: ${avg.toFixed(1)}/100K`);
console.log(`Range: ${min.toFixed(1)} - ${max.toFixed(1)}/100K`);
console.log(`Variance: ${variance.toFixed(1)}/100K (${variancePct.toFixed(0)}% of average)`);

if (variancePct < 20) {
  console.log(`✅ CONSISTENT - proceed with analysis`);
} else if (variancePct < 50) {
  console.log(`⚠️  MODERATE VARIANCE - acceptable randomness`);
} else {
  console.log(`❌ HIGH VARIANCE - check for bugs`);
}

if (avg > 30) {
  console.log(`\n⚠️  SUICIDE RATE IS 3x TOO HIGH (${avg.toFixed(1)} vs target 10-15)`);
} else if (avg < 5) {
  console.log(`\n⚠️  SUICIDE RATE IS TOO LOW (${avg.toFixed(1)} vs target 10-15)`);
} else {
  console.log(`\n✅ SUICIDE RATE IN RANGE (${avg.toFixed(1)}, target 10-15)`);
}
