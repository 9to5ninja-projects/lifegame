/**
 * CRISIS TRACKING TEST
 * Verify health crises are being recorded and tracked correctly
 */

const path = require('path');
const fs = require('fs');

const rootDir = path.join(__dirname, '..');
const GameEngine = require(path.join(rootDir, 'game_engine_integrated.js'));

const birthCards = JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'birth_cards_json.json'), 'utf8'));
const familyCards = JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'family_cards_json.json'), 'utf8'));
const eventCardsData = {
  childhood: JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'event_cards_childhood.json'), 'utf8')),
  teen: JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'event_cards_teen.json'), 'utf8')),
  adult: JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'event_cards_adult.json'), 'utf8'))
};
const eventCards = [...eventCardsData.childhood, ...eventCardsData.teen, ...eventCardsData.adult];
const deathCards = JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'death_cards_json.json'), 'utf8'));

const NUM_LIVES = 10;
const results = [];

console.log(`\n=== CRISIS TRACKING TEST: ${NUM_LIVES} lives ===\n`);

for (let lifeNum = 0; lifeNum < NUM_LIVES; lifeNum++) {
  const engine = new GameEngine(birthCards, familyCards, eventCards, deathCards);
  engine.createPlayer(birthCards.find(b => b.name === 'Western Europe'), familyCards[0]);
  const player = engine.player;
  
  let crisisLog = [];
  let deathCause = null;
  
  // Run full life
  while (player.alive && player.demographics.age < 150) {
    engine.nextYear();
    
    // Check if any crises this year
    if (player.health?.crises && Object.keys(player.health.crises).length > 0) {
      for (const [crisisName, crisisData] of Object.entries(player.health.crises)) {
        // Only log if we haven't seen this before
        if (!crisisLog.some(c => c.crisis === crisisName && c.age === crisisData.lastAge)) {
          crisisLog.push({
            age: crisisData.lastAge,
            crisis: crisisName,
            outcome: crisisData.lastOutcome
          });
        }
      }
    }
  }
  
  deathCause = player.causeOfDeath || 'Unknown';
  
  results.push({
    lifeNumber: lifeNum + 1,
    age: player.demographics.age,
    deathCause,
    totalCrises: Object.keys(player.health?.crises || {}).length,
    crisisList: crisisLog.sort((a, b) => a.age - b.age),
    hadCrisis: Object.keys(player.health?.crises || {}).length > 0
  });
  
  process.stdout.write(`\r[${lifeNum + 1}/${NUM_LIVES}] Age: ${player.demographics.age}, Crises: ${Object.keys(player.health?.crises || {}).length}`);
}

console.log('\n');

// Calculate statistics
const crisisStats = {
  totalLivesWithCrisis: results.filter(r => r.hadCrisis).length,
  totalCrises: results.reduce((sum, r) => sum + r.totalCrises, 0),
  crisisTypes: {}
};

results.forEach(r => {
  r.crisisList.forEach(crisis => {
    crisisStats.crisisTypes[crisis.crisis] = (crisisStats.crisisTypes[crisis.crisis] || 0) + 1;
  });
});

console.log('='.repeat(80));
console.log('CRISIS TRACKING RESULTS');
console.log('='.repeat(80));

console.log(`\nTotal lives analyzed: ${NUM_LIVES}`);
console.log(`Lives with at least one crisis: ${crisisStats.totalLivesWithCrisis} (${(crisisStats.totalLivesWithCrisis / NUM_LIVES * 100).toFixed(0)}%)`);
console.log(`Total crises recorded: ${crisisStats.totalCrises}`);

if (crisisStats.totalCrises > 0) {
  console.log(`\nCrisis breakdown:`);
  Object.entries(crisisStats.crisisTypes).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });
}

console.log('\n' + '='.repeat(80));
console.log('INDIVIDUAL CRISIS DETAILS');
console.log('='.repeat(80) + '\n');

results.forEach((r, i) => {
  console.log(`Life ${r.lifeNumber}: Age ${r.age}, Death: ${r.deathCause}`);
  if (r.crisisList.length > 0) {
    r.crisisList.forEach(crisis => {
      console.log(`  └─ Age ${crisis.age}: ${crisis.crisis} (${crisis.outcome})`);
    });
  } else {
    console.log(`  └─ No crises recorded`);
  }
});

console.log('\n' + '='.repeat(80));
console.log('Results saved to: E:\\lifegame\\analysis\\crisis_tracking_test_results.json');
console.log('='.repeat(80));

// Save results
fs.writeFileSync(
  path.join(rootDir, 'analysis', `crisis_tracking_test_results.json`),
  JSON.stringify(results, null, 2),
  'utf8'
);
