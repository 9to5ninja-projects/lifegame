/**
 * TEST: Better job tenure tracking - count actual job tenures, not state changes
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

// Run 5 lives and analyze job tenures
const results = [];

for (let life = 0; life < 5; life++) {
  const engine = new GameEngine(birthCards, familyCards, eventCards, deathCards);
  engine.createPlayer(birthCards.find(b => b.name === 'Western Europe'), familyCards[0]);
  const player = engine.player;
  
  let jobTenures = []; // List of tenure lengths
  let currentTenureStart = null;
  let previousEmployed = false;
  
  // Run life
  while (player.alive && player.demographics.age < 100) {
    engine.nextYear();
    
    const age = player.demographics.age;
    const employed = player.economics.income.employed;
    
    // Detect job start (unemployed→employed or age 15 if employed)
    if (employed && !previousEmployed) {
      currentTenureStart = age;
    }
    
    // Detect job end (employed→unemployed)
    if (!employed && previousEmployed && currentTenureStart !== null) {
      const tenure = age - currentTenureStart;
      jobTenures.push({ startAge: currentTenureStart, endAge: age, tenure });
      currentTenureStart = null;
    }
    
    previousEmployed = employed;
  }
  
  // If ended while employed, count that tenure
  if (previousEmployed && currentTenureStart !== null) {
    const tenure = player.demographics.age - currentTenureStart;
    jobTenures.push({ startAge: currentTenureStart, endAge: player.demographics.age, tenure });
  }
  
  const avgTenure = jobTenures.length > 0 ? jobTenures.reduce((sum, j) => sum + j.tenure, 0) / jobTenures.length : 0;
  
  results.push({
    lifeNumber: life + 1,
    lifespan: player.demographics.age,
    jobCount: jobTenures.length,
    avgTenure: avgTenure,
    jobTenures: jobTenures
  });
}

console.log('\n=== EMPLOYMENT TENURE ANALYSIS ===\n');
console.log('Life | Age | Jobs | Avg Tenure | Tenures');
console.log('-'.repeat(80));

for (const r of results) {
  const tenuresList = r.jobTenures.map(j => `${j.tenure}yr`).join(', ');
  console.log(`  ${r.lifeNumber}  | ${r.lifespan.toString().padStart(3)} | ${r.jobCount.toString().padStart(4)} | ${r.avgTenure.toFixed(1).padStart(10)} | ${tenuresList}`);
}

const avgTenureOverall = results.reduce((sum, r) => sum + r.avgTenure, 0) / results.length;
const avgJobCount = results.reduce((sum, r) => sum + r.jobCount, 0) / results.length;

console.log('\n' + '='.repeat(80));
console.log(`Average job count: ${avgJobCount.toFixed(1)} (realistic: 6-10 jobs per lifetime)`);
console.log(`Average tenure: ${avgTenureOverall.toFixed(1)} years (target: 5-8 years)`);
