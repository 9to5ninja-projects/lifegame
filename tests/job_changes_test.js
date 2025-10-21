/**
 * TEST: Track job CHANGES to measure tenure improvement
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

// Run 5 lives and count job changes
const results = [];

for (let life = 0; life < 5; life++) {
  const engine = new GameEngine(birthCards, familyCards, eventCards, deathCards);
  engine.createPlayer(birthCards.find(b => b.name === 'Western Europe'), familyCards[0]);
  const player = engine.player;
  
  let jobChanges = 0;
  let previousTarget = 0;
  let lastTargetChange = 0;
  let jobChangeAges = [];
  
  // Run life
  while (player.alive && player.demographics.age < 100) {
    engine.nextYear();
    
    // Detect job change by target tenure change
    const currentTarget = player.economics.income.targetJobTenure || 0;
    if (currentTarget !== previousTarget && player.demographics.age >= 18) {
      jobChanges++;
      jobChangeAges.push(player.demographics.age);
      lastTargetChange = player.demographics.age;
    }
    previousTarget = currentTarget;
  }
  
  results.push({
    lifeNumber: life + 1,
    lifespan: player.demographics.age,
    jobChanges: jobChanges,
    jobChangeAges: jobChangeAges,
    avgTenure: jobChanges > 0 ? Math.round((player.demographics.age - 18) / jobChanges * 10) / 10 : 0
  });
}

console.log('\n=== EMPLOYMENT TENURE IMPROVEMENT CHECK ===\n');
console.log('Life | Age | Jobs | Avg Tenure | Job Changes At');
console.log('-'.repeat(70));

for (const r of results) {
  const jobsList = r.jobChangeAges.join(', ');
  console.log(`  ${r.lifeNumber}  | ${r.lifespan.toString().padStart(3)} | ${r.jobChanges.toString().padStart(4)} | ${r.avgTenure.toString().padStart(10)} | ${jobsList}`);
}

const avgTenureOverall = results.reduce((sum, r) => sum + r.avgTenure, 0) / results.length;
console.log('\n' + '='.repeat(70));
console.log(`Average tenure across 5 lives: ${avgTenureOverall.toFixed(1)} years (Target: 5-8 years)`);
