/**
 * WIDOWED RECOVERY TEST
 * Track widowed people through grief recovery and potential remarriage
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

const NUM_LIVES = 50;
const results = [];

console.log(`\n=== WIDOWED RECOVERY TEST: ${NUM_LIVES} lives ===\n`);

for (let lifeNum = 0; lifeNum < NUM_LIVES; lifeNum++) {
  const engine = new GameEngine(birthCards, familyCards, eventCards, deathCards);
  engine.createPlayer(birthCards.find(b => b.name === 'Western Europe'), familyCards[0]);
  const player = engine.player;
  
  let lifeData = {
    lifeNumber: lifeNum + 1,
    widowed: false,
    widowedAge: null,
    mentalHealthAtWidowhood: null,
    remarried: false,
    remarriageAge: null,
    mentalHealthAtRemarriage: null,
    recoveryYears: null
  };
  
  // Run full life
  while (player.alive && player.demographics.age < 150) {
    const age = player.demographics.age;
    
    // Detect widowhood
    if (player.relationships.social.widowed && !lifeData.widowed) {
      lifeData.widowed = true;
      lifeData.widowedAge = age;
      lifeData.mentalHealthAtWidowhood = player.health.mental.current;
    }
    
    // Detect remarriage
    if (player.relationships.social.married && lifeData.widowed && !lifeData.remarried && player.relationships.partner.exists) {
      // Make sure this is actually remarriage (check if it's different from previous partner)
      if (!player.relationships.partner.deathAge || player.demographics.age > player.relationships.partner.deathAge) {
        lifeData.remarried = true;
        lifeData.remarriageAge = age;
        lifeData.mentalHealthAtRemarriage = player.health.mental.current;
        lifeData.recoveryYears = age - lifeData.widowedAge;
      }
    }
    
    engine.nextYear();
  }
  
  results.push(lifeData);
  
  process.stdout.write(`\r[${lifeNum + 1}/${NUM_LIVES}] Widowed: ${lifeData.widowed ? 'Y' : 'N'}, Remarried: ${lifeData.remarried ? 'Y' : 'N'}`);
}

console.log('\n');

// Analyze results
const widowedLives = results.filter(r => r.widowed);
const remarriedLives = widowedLives.filter(r => r.remarried);

const stats = {
  totalWidowed: widowedLives.length,
  remarried: remarriedLives.length,
  remarriageRate: remarriedLives.length > 0 ? (remarriedLives.length / widowedLives.length * 100) : 0,
  avgWidowedAge: widowedLives.length > 0 ? widowedLives.reduce((sum, r) => sum + r.widowedAge, 0) / widowedLives.length : 0,
  avgMentalAtWidowhood: widowedLives.length > 0 ? widowedLives.reduce((sum, r) => sum + r.mentalHealthAtWidowhood, 0) / widowedLives.length : 0,
  avgRecoveryYears: remarriedLives.length > 0 ? remarriedLives.reduce((sum, r) => sum + r.recoveryYears, 0) / remarriedLives.length : 0,
  examples: []
};

remarriedLives.slice(0, 5).forEach(r => {
  stats.examples.push({
    lifeNum: r.lifeNumber,
    widowedAge: r.widowedAge,
    mentalAtWidowhood: r.mentalHealthAtWidowhood.toFixed(0),
    remarriageAge: r.remarriageAge,
    mentalAtRemarriage: r.mentalHealthAtRemarriage.toFixed(0),
    recoveryYears: r.recoveryYears
  });
});

console.log('='.repeat(100));
console.log('WIDOWED RECOVERY STATISTICS');
console.log('='.repeat(100));

console.log(`\nBASIC STATS:`);
console.log(`  Lives analyzed: ${NUM_LIVES}`);
console.log(`  Lives that became widowed: ${stats.totalWidowed} (${(stats.totalWidowed / NUM_LIVES * 100).toFixed(0)}%)`);
console.log(`  Widowed who remarried: ${stats.remarried} (${stats.remarriageRate.toFixed(0)}% of widowed)`);
console.log(`\nWIDOWED AVERAGES:`);
console.log(`  Average age when widowed: ${stats.avgWidowedAge.toFixed(1)}`);
console.log(`  Average mental health at widowhood: ${stats.avgMentalAtWidowhood.toFixed(0)}/100`);
console.log(`  Average recovery time to remarriage: ${stats.avgRecoveryYears.toFixed(1)} years`);

if (stats.examples.length > 0) {
  console.log('\n' + '='.repeat(100));
  console.log('REMARRIAGE EXAMPLES');
  console.log('='.repeat(100));
  console.log('\nLife# | Widowed Age | Mental@W | Remarried Age | Mental@R | Recovery Yrs');
  console.log('-'.repeat(75));
  stats.examples.forEach(ex => {
    console.log(`${ex.lifeNum.toString().padStart(5)} | ${ex.widowedAge.toString().padStart(11)} | ${ex.mentalAtWidowhood.toString().padStart(8)} | ${ex.remarriageAge.toString().padStart(12)} | ${ex.mentalAtRemarriage.toString().padStart(8)} | ${ex.recoveryYears.toString().padStart(12)}`);
  });
}

console.log('\n' + '='.repeat(100));
