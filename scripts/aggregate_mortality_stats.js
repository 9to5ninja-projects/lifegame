/**
 * MORTALITY STATISTICS AGGREGATOR
 * 
 * Runs multiple simulations and aggregates death statistics
 * to understand actual patterns before tuning
 */

const path = require('path');
const fs = require('fs');
const MortalityGameV2 = require(path.join(__dirname, '../game_engine_v2_homeostatic.js'));
const DeathTracer = require(path.join(__dirname, '../death_trace_system.js'));

// Load game data
const birthCards = JSON.parse(fs.readFileSync(path.join(__dirname, '../birth_cards_json.json'), 'utf8'));
const familyCards = JSON.parse(fs.readFileSync(path.join(__dirname, '../family_cards_json.json'), 'utf8'));
const eventCards = JSON.parse(fs.readFileSync(path.join(__dirname, '../event_cards_childhood.json'), 'utf8'));
const deathCards = JSON.parse(fs.readFileSync(path.join(__dirname, '../death_cards_json.json'), 'utf8'));

// Configuration
const NUM_LIVES = 100;

console.log(`Running ${NUM_LIVES} life simulations for Nordic Country...\n`);

const stats = {
  totalLives: 0,
  ages: [],
  causes: {},
  ageByDecade: {
    '0-9': 0,
    '10-19': 0,
    '20-29': 0,
    '30-39': 0,
    '40-49': 0,
    '50-59': 0,
    '60-69': 0,
    '70-79': 0,
    '80-89': 0,
    '90+': 0
  }
};

const nordicBirth = birthCards.find(b => b.name === 'Nordic Country');

for (let i = 0; i < NUM_LIVES; i++) {
  const tracer = new DeathTracer();
  const engine = new MortalityGameV2(birthCards, familyCards, eventCards, deathCards, tracer);
  
  engine.createPlayer(nordicBirth, familyCards[0], {
    sex: Math.random() > 0.5 ? 'male' : 'female'
  });
  
  const player = engine.player;
  
  while (player.alive && player.demographics.age < 120) {
    engine.processYearEnd(player);
  }
  
  stats.totalLives++;
  stats.ages.push(player.demographics.age);
  
  // Get death cause
  const deathLog = tracer.getLifeLog(player);
  const deathEvent = deathLog.find(e => e.eventType && e.eventType.startsWith('DEATH_'));
  const cause = deathEvent && deathEvent.context ? deathEvent.context.cause : 'Unknown';
  
  stats.causes[cause] = (stats.causes[cause] || 0) + 1;
  
  // Age bucket
  const age = player.demographics.age;
  if (age < 10) stats.ageByDecade['0-9']++;
  else if (age < 20) stats.ageByDecade['10-19']++;
  else if (age < 30) stats.ageByDecade['20-29']++;
  else if (age < 40) stats.ageByDecade['30-39']++;
  else if (age < 50) stats.ageByDecade['40-49']++;
  else if (age < 60) stats.ageByDecade['50-59']++;
  else if (age < 70) stats.ageByDecade['60-69']++;
  else if (age < 80) stats.ageByDecade['70-79']++;
  else if (age < 90) stats.ageByDecade['80-89']++;
  else stats.ageByDecade['90+']++;
  
  if ((i + 1) % 10 === 0) {
    process.stdout.write(`Progress: ${i + 1}/${NUM_LIVES}\r`);
  }
}

console.log('\n');
console.log('='.repeat(80));
console.log('MORTALITY STATISTICS (Nordic Country, N=' + NUM_LIVES + ')');
console.log('='.repeat(80));
console.log();

// Age statistics
stats.ages.sort((a, b) => a - b);
const avgAge = stats.ages.reduce((a, b) => a + b, 0) / stats.ages.length;
const medianAge = stats.ages[Math.floor(stats.ages.length / 2)];
const minAge = stats.ages[0];
const maxAge = stats.ages[stats.ages.length - 1];

console.log('AGE AT DEATH:');
console.log(`  Average: ${avgAge.toFixed(1)} years`);
console.log(`  Median: ${medianAge} years`);
console.log(`  Range: ${minAge} - ${maxAge} years`);
console.log(`  Standard deviation: ${Math.sqrt(stats.ages.map(x => Math.pow(x - avgAge, 2)).reduce((a, b) => a + b) / stats.ages.length).toFixed(1)} years`);
console.log();

console.log('AGE DISTRIBUTION:');
Object.entries(stats.ageByDecade).forEach(([decade, count]) => {
  const pct = (count / stats.totalLives * 100).toFixed(1);
  const bar = '█'.repeat(Math.floor(count / 2));
  console.log(`  ${decade.padEnd(8)}: ${count.toString().padStart(2)} (${pct.padStart(5)}%) ${bar}`);
});
console.log();

console.log('TOP CAUSES OF DEATH:');
const sortedCauses = Object.entries(stats.causes)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 15);

sortedCauses.forEach(([cause, count]) => {
  const pct = (count / stats.totalLives * 100).toFixed(1);
  const bar = '█'.repeat(Math.floor(count / 2));
  console.log(`  ${cause.padEnd(35)}: ${count.toString().padStart(2)} (${pct.padStart(5)}%) ${bar}`);
});

console.log();
console.log('='.repeat(80));
console.log('REAL-WORLD COMPARISON (Nordic/Scandinavian countries):');
console.log('='.repeat(80));
console.log('Life expectancy: ~83 years (We got: ' + avgAge.toFixed(1) + ')');
console.log('Top causes (real):');
console.log('  1. Heart disease (~25%)');
console.log('  2. Cancer (~25%)');
console.log('  3. Stroke (~10%)');
console.log('  4. Dementia (~8%)');
console.log('  5. Respiratory diseases (~5%)');
console.log('  Traffic deaths: ~0.3% of all deaths (~3-5 per 100k population/year)');
console.log('  Diabetes deaths: ~1-2%');
console.log('  HIV deaths: <0.1%');
console.log();

// Export for further analysis
fs.writeFileSync(
  path.join(__dirname, '../mortality_stats.json'),
  JSON.stringify(stats, null, 2)
);

console.log('Full statistics exported to mortality_stats.json');
