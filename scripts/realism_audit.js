/**
 * Realism Audit Script
 * 
 * Validates simulation outputs against real-world statistics.
 * Flags deviations >20% from expected values.
 * 
 * Usage: node scripts/realism_audit.js [--region=Nordic] [--sample-size=100]
 */

const MortalityGameV2 = require('../game_engine_v2_homeostatic.js');
const DeathTracer = require('../death_trace_system.js');
const birthCards = require('../birth_cards_json.json');
const familyCards = require('../family_cards_json.json');
const deathCards = require('../death_cards_json.json');

// Event cards
const eventCardsChildhood = require('../event_cards_childhood.json');
const eventCardsTeen = require('../event_cards_teen.json');
const eventCardsAdult = require('../event_cards_adult.json');
const eventCards = [...eventCardsChildhood, ...eventCardsTeen, ...eventCardsAdult];

// Parse command line arguments
const args = process.argv.slice(2);
let REGION = 'Nordic Country';
let SAMPLE_SIZE = 500; // Increased default for statistical accuracy

for (const arg of args) {
  if (arg.startsWith('--region=')) {
    REGION = arg.split('=')[1];
  } else if (arg.startsWith('--sample-size=')) {
    SAMPLE_SIZE = parseInt(arg.split('=')[1]);
  }
}

// Real-world statistics by region
const REAL_WORLD_DATA = {
  'Nordic Country': {
    lifeExpectancy: { value: 83, tolerance: 0.15 }, // ±15%
    causes: {
      'Heart Disease': { value: 0.25, tolerance: 0.25 }, // 25% ±25% = 18.75-31.25%
      'Cancer': { value: 0.25, tolerance: 0.25 },
      'Stroke': { value: 0.10, tolerance: 0.30 },
      'Dementia/Alzheimer\'s': { value: 0.08, tolerance: 0.30 },
      'Respiratory diseases': { value: 0.05, tolerance: 0.40 },
      'Diabetes Complications': { value: 0.015, tolerance: 0.50 }, // 1-2%
      'Traffic Accident': { value: 0.003, tolerance: 2.0 }, // 0.3%, high tolerance due to small %
      'Infectious Disease (HIV/TB)': { value: 0.001, tolerance: 5.0 }, // <0.1%
      'HIV/AIDS': { value: 0.001, tolerance: 5.0 },
      'Malaria': { value: 0.0, tolerance: 0.0 }, // Should not exist
    },
    maternalMortality: { value: 0.0004, tolerance: 0.5 }, // ~4 per 10,000 births
    infantMortality: { value: 0.002, tolerance: 0.3 }, // ~0.2% (2 per 1000)
    employmentRate: { value: 0.75, tolerance: 0.15 }, // ~75% employment for adults
    povertyRate: { value: 0.05, tolerance: 0.40 }, // ~5% poverty
  },
  'Western Europe': {
    lifeExpectancy: { value: 81, tolerance: 0.15 },
    causes: {
      'Heart Disease': { value: 0.26, tolerance: 0.25 },
      'Cancer': { value: 0.26, tolerance: 0.25 },
      'Stroke': { value: 0.11, tolerance: 0.30 },
    },
    maternalMortality: { value: 0.0007, tolerance: 0.5 },
    infantMortality: { value: 0.004, tolerance: 0.3 },
    employmentRate: { value: 0.70, tolerance: 0.15 },
  },
  'Sub-Saharan Africa': {
    lifeExpectancy: { value: 62, tolerance: 0.20 },
    causes: {
      'Infectious Disease (HIV/TB)': { value: 0.30, tolerance: 0.30 },
      'Malaria': { value: 0.08, tolerance: 0.40 },
      'Maternal Death (Childbirth)': { value: 0.04, tolerance: 0.40 },
    },
    maternalMortality: { value: 0.05, tolerance: 0.40 }, // ~500 per 10,000 births
    infantMortality: { value: 0.055, tolerance: 0.30 }, // ~5.5%
    employmentRate: { value: 0.65, tolerance: 0.20 },
    povertyRate: { value: 0.40, tolerance: 0.30 },
  }
};

// Statistics collection
const stats = {
  totalLives: 0,
  ages: [],
  causes: {},
  maternalDeaths: 0,
  totalBirths: 0,
  infantDeaths: 0,
  employmentByAge: {},
  povertyByAge: {},
  isolationRate: 0,
  avgFriends: 0,
};

console.log(`\n${'='.repeat(80)}`);
console.log(`REALISM AUDIT - ${REGION}`);
console.log(`Sample Size: ${SAMPLE_SIZE} lives`);
console.log(`${'='.repeat(80)}\n`);

console.log('Running simulations...\n');

const birthCard = birthCards.find(b => b.name === REGION);
if (!birthCard) {
  console.error(`ERROR: Region "${REGION}" not found in birth cards.`);
  process.exit(1);
}

// Run simulations
for (let i = 0; i < SAMPLE_SIZE; i++) {
  if ((i + 1) % 10 === 0) {
    process.stdout.write(`\rProgress: ${i + 1}/${SAMPLE_SIZE}`);
  }
  
  const tracer = new DeathTracer();
  const engine = new MortalityGameV2(birthCards, familyCards, eventCards, deathCards, tracer);
  
  engine.createPlayer(birthCard, familyCards[0], {
    sex: Math.random() > 0.5 ? 'male' : 'female'
  });
  
  const player = engine.player;
  
  // Track employment and poverty over lifetime
  while (player.alive && player.demographics.age < 120) {
    const age = player.demographics.age;
    
    // Sample employment at adult ages
    if (age >= 25 && age <= 65) {
      if (!stats.employmentByAge[age]) stats.employmentByAge[age] = { employed: 0, total: 0 };
      stats.employmentByAge[age].total++;
      if (player.economics?.income?.employed) {
        stats.employmentByAge[age].employed++;
      }
    }
    
    // Track poverty
    if (age >= 18) {
      if (!stats.povertyByAge[age]) stats.povertyByAge[age] = { poverty: 0, total: 0 };
      stats.povertyByAge[age].total++;
      if (player.economics?.resources?.current < 0) {
        stats.povertyByAge[age].poverty++;
      }
    }
    
    engine.processYearEnd(player);
  }
  
  stats.totalLives++;
  stats.ages.push(player.demographics.age);
  
  // Death cause
  const deathLog = tracer.getLifeLog(player);
  const deathEvent = deathLog.find(e => e.eventType && e.eventType.startsWith('DEATH_'));
  const cause = deathEvent && deathEvent.context ? deathEvent.context.cause : 'Unknown';
  stats.causes[cause] = (stats.causes[cause] || 0) + 1;
  
  // Social isolation at death
  if (player.relationships?.social?.isolation) {
    stats.isolationRate++;
  }
  stats.avgFriends += (player.relationships?.social?.friends || 0);
  
  // Infant mortality (death before age 1)
  if (player.demographics.age < 1) {
    stats.infantDeaths++;
  }
  
  // Maternal mortality (track if we add births in future)
  // For now, we'll estimate from death cards
}

console.log('\n\n');

// Calculate metrics
const avgAge = stats.ages.reduce((a, b) => a + b, 0) / stats.totalLives;
const sortedAges = [...stats.ages].sort((a, b) => a - b);
const medianAge = sortedAges[Math.floor(sortedAges.length / 2)];
const stdDev = Math.sqrt(stats.ages.reduce((sq, n) => sq + Math.pow(n - avgAge, 2), 0) / stats.totalLives);

// Employment rate (average across adult years)
let totalEmployed = 0, totalAdults = 0;
for (const age in stats.employmentByAge) {
  totalEmployed += stats.employmentByAge[age].employed;
  totalAdults += stats.employmentByAge[age].total;
}
const employmentRate = totalAdults > 0 ? totalEmployed / totalAdults : 0;

// Poverty rate
let totalPoverty = 0, totalPovertyChecks = 0;
for (const age in stats.povertyByAge) {
  totalPoverty += stats.povertyByAge[age].poverty;
  totalPovertyChecks += stats.povertyByAge[age].total;
}
const povertyRate = totalPovertyChecks > 0 ? totalPoverty / totalPovertyChecks : 0;

// Infant mortality rate
const infantMortalityRate = stats.infantDeaths / stats.totalLives;

// Social metrics
const isolationRate = stats.isolationRate / stats.totalLives;
const avgFriends = stats.avgFriends / stats.totalLives;

// Get real-world expectations
const realWorld = REAL_WORLD_DATA[REGION] || REAL_WORLD_DATA['Nordic Country'];

console.log(`${'='.repeat(80)}`);
console.log('AUDIT RESULTS');
console.log(`${'='.repeat(80)}\n`);

// Helper function to check if value is within tolerance
function checkMetric(name, simValue, realValue, tolerance, unit = '') {
  const lowerBound = realValue * (1 - tolerance);
  const upperBound = realValue * (1 + tolerance);
  const isValid = simValue >= lowerBound && simValue <= upperBound;
  const deviation = Math.abs((simValue - realValue) / realValue);
  
  const status = isValid ? '✅ PASS' : '❌ FAIL';
  const deviationPct = (deviation * 100).toFixed(1);
  
  console.log(`${status} ${name}`);
  console.log(`   Simulated: ${simValue.toFixed(2)}${unit}`);
  console.log(`   Expected:  ${realValue.toFixed(2)}${unit} (±${(tolerance * 100).toFixed(0)}%)`);
  console.log(`   Range:     ${lowerBound.toFixed(2)}-${upperBound.toFixed(2)}${unit}`);
  console.log(`   Deviation: ${deviationPct}%\n`);
  
  return { name, simValue, realValue, deviation, isValid, tolerance };
}

const results = [];

// Life expectancy
console.log('--- LIFE EXPECTANCY ---\n');
results.push(checkMetric(
  'Life Expectancy',
  avgAge,
  realWorld.lifeExpectancy.value,
  realWorld.lifeExpectancy.tolerance,
  ' years'
));

// Causes of death
console.log('--- CAUSES OF DEATH ---\n');
for (const causeName in realWorld.causes) {
  const realData = realWorld.causes[causeName];
  const simCount = stats.causes[causeName] || 0;
  const simRate = simCount / stats.totalLives;
  
  results.push(checkMetric(
    causeName,
    simRate,
    realData.value,
    realData.tolerance,
    ''
  ));
}

// Other metrics
console.log('--- OTHER METRICS ---\n');

if (realWorld.infantMortality) {
  results.push(checkMetric(
    'Infant Mortality Rate',
    infantMortalityRate,
    realWorld.infantMortality.value,
    realWorld.infantMortality.tolerance,
    ''
  ));
}

if (realWorld.employmentRate) {
  results.push(checkMetric(
    'Employment Rate (age 25-65)',
    employmentRate,
    realWorld.employmentRate.value,
    realWorld.employmentRate.tolerance,
    ''
  ));
}

if (realWorld.povertyRate) {
  results.push(checkMetric(
    'Poverty Rate',
    povertyRate,
    realWorld.povertyRate.value,
    realWorld.povertyRate.tolerance,
    ''
  ));
}

// Summary
console.log(`${'='.repeat(80)}`);
console.log('SUMMARY');
console.log(`${'='.repeat(80)}\n`);

const passed = results.filter(r => r.isValid).length;
const failed = results.filter(r => !r.isValid).length;
const passRate = (passed / results.length * 100).toFixed(1);

console.log(`Total Checks: ${results.length}`);
console.log(`Passed: ${passed} (${passRate}%)`);
console.log(`Failed: ${failed}\n`);

if (failed > 0) {
  console.log('Failed Checks:');
  results.filter(r => !r.isValid).forEach(r => {
    console.log(`  - ${r.name}: ${(r.deviation * 100).toFixed(1)}% deviation (tolerance: ±${(r.tolerance * 100).toFixed(0)}%)`);
  });
  console.log();
}

// Additional insights
console.log('--- ADDITIONAL INSIGHTS ---\n');
console.log(`Social Isolation Rate: ${(isolationRate * 100).toFixed(1)}%`);
console.log(`Average Friends at Death: ${avgFriends.toFixed(1)}`);
console.log(`Life Expectancy Std Dev: ${stdDev.toFixed(1)} years`);
console.log(`Median Age: ${medianAge} years\n`);

// Top causes of death
console.log('Top 10 Causes of Death:');
const sortedCauses = Object.entries(stats.causes)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10);

sortedCauses.forEach(([cause, count], idx) => {
  const pct = (count / stats.totalLives * 100).toFixed(1);
  console.log(`  ${idx + 1}. ${cause}: ${count} (${pct}%)`);
});

console.log(`\n${'='.repeat(80)}`);

// Exit with appropriate code
process.exit(failed > 0 ? 1 : 0);
