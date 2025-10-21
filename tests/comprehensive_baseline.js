/**
 * COMPREHENSIVE BASELINE: 20 Western Europe lives to get real statistics
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

const lives = [];
const NUM_LIVES = 20;

console.log(`\n=== COMPREHENSIVE BASELINE: ${NUM_LIVES} WESTERN EUROPE LIVES ===\n`);

for (let lifeNum = 0; lifeNum < NUM_LIVES; lifeNum++) {
  const engine = new GameEngine(birthCards, familyCards, eventCards, deathCards);
  engine.createPlayer(birthCards.find(b => b.name === 'Western Europe'), familyCards[0]);
  const player = engine.player;
  
  let marriages = 0;
  let children = 0;
  let jobChanges = 0;
  let lastTargetTenure = null;
  let deathCause = null;
  let crisisCount = 0;
  
  // Run full life
  while (player.alive && player.demographics.age < 150) {
    engine.nextYear();
    
    // Track marriages (detect when married status changes to true)
    if (player.relationships.social.married && (marriages === 0 || player.relationships.partner.since === player.demographics.age)) {
      marriages++;
    }
    
    // Track children births
    children = player.relationships.children?.length || 0;
    
    // Track job tenure changes
    const currentTenure = player.economics.income.targetJobTenure;
    if (currentTenure !== lastTargetTenure && player.demographics.age >= 18) {
      jobChanges++;
    }
    lastTargetTenure = currentTenure;
    
    // Track health crises
    if (player.health.crises) {
      crisisCount = Object.keys(player.health.crises).length;
    }
  }
  
  deathCause = player.causeOfDeath || 'Unknown';
  
  lives.push({
    lifeNumber: lifeNum + 1,
    age: player.demographics.age,
    deathCause,
    marriages,
    children,
    jobChanges,
    crisisCount,
    sex: player.demographics.sex,
    education: player.development.education.level
  });
  
  process.stdout.write(`\r[${lifeNum + 1}/${NUM_LIVES}] Age: ${player.demographics.age}, Marriages: ${marriages}, Children: ${children}, Jobs: ${jobChanges}`);
}

console.log('\n');

// Calculate statistics
const stats = {
  avgAge: lives.reduce((sum, l) => sum + l.age, 0) / lives.length,
  minAge: Math.min(...lives.map(l => l.age)),
  maxAge: Math.max(...lives.map(l => l.age)),
  totalMarriages: lives.reduce((sum, l) => sum + l.marriages, 0),
  avgMarriages: lives.reduce((sum, l) => sum + l.marriages, 0) / lives.length,
  totalChildren: lives.reduce((sum, l) => sum + l.children, 0),
  avgChildren: lives.reduce((sum, l) => sum + l.children, 0) / lives.length,
  totalJobChanges: lives.reduce((sum, l) => sum + l.jobChanges, 0),
  avgJobChanges: lives.reduce((sum, l) => sum + l.jobChanges, 0) / lives.length,
  totalCrises: lives.reduce((sum, l) => sum + l.crisisCount, 0),
  avgCrises: lives.reduce((sum, l) => sum + l.crisisCount, 0) / lives.length
};

console.log('='.repeat(80));
console.log('STATISTICAL SUMMARY');
console.log('='.repeat(80));

console.log(`\nLONGEVITY:`);
console.log(`  Average age: ${stats.avgAge.toFixed(1)} (Expected: 82)`);
console.log(`  Min age: ${stats.minAge}, Max age: ${stats.maxAge}`);

console.log(`\nRELATIONSHIPS:`);
console.log(`  Total marriages: ${stats.totalMarriages} (${(stats.totalMarriages / NUM_LIVES * 100).toFixed(0)}% of lives)`);
console.log(`  Avg marriages per life: ${stats.avgMarriages.toFixed(2)}`);
console.log(`  Total children born: ${stats.totalChildren}`);
console.log(`  Avg children per life: ${stats.avgChildren.toFixed(2)} (Target: 1-2)`);
console.log(`  Children per marriage: ${(stats.totalChildren / stats.totalMarriages).toFixed(2)}`);

console.log(`\nEMPLOYMENT:`);
console.log(`  Total job changes: ${stats.totalJobChanges}`);
console.log(`  Avg job changes per life: ${stats.avgJobChanges.toFixed(1)} (Target: 6-10 jobs/lifetime)`);

console.log(`\nHEALTH CRISES:`);
console.log(`  Total crises: ${stats.totalCrises}`);
console.log(`  Avg crises per life: ${stats.avgCrises.toFixed(2)}`);

// Show death causes
console.log(`\nDEATH CAUSES:`);
const deathCauses = {};
lives.forEach(l => {
  deathCauses[l.deathCause] = (deathCauses[l.deathCause] || 0) + 1;
});
Object.entries(deathCauses).sort((a, b) => b[1] - a[1]).forEach(([cause, count]) => {
  console.log(`  ${cause}: ${count} (${(count / NUM_LIVES * 100).toFixed(0)}%)`);
});

console.log('\n' + '='.repeat(80));
console.log('INDIVIDUAL LIFE DATA');
console.log('='.repeat(80) + '\n');

console.log('# | Age | Cause | Mar | Kid | Jobs | Crises | Sex | Education');
console.log('-'.repeat(80));

lives.forEach((l, i) => {
  const cause = l.deathCause.substring(0, 20).padEnd(20);
  console.log(`${(i+1).toString().padStart(2)} | ${l.age.toString().padStart(3)} | ${cause} | ${l.marriages} | ${l.children} | ${l.jobChanges.toString().padStart(4)} | ${l.crisisCount} | ${l.sex[0]} | ${l.education}`);
});

console.log('\n' + '='.repeat(80));
console.log(`Results saved to: E:\\lifegame\\analysis\\comprehensive_baseline_${NUM_LIVES}lives.json`);

// Save detailed results
fs.writeFileSync(
  path.join(rootDir, 'analysis', `comprehensive_baseline_${NUM_LIVES}lives.json`),
  JSON.stringify({ stats, lives }, null, 2),
  'utf8'
);
