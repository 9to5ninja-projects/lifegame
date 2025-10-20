/**
 * LIFE VARIATION ANALYSIS
 * 
 * Deep dive into individual life trajectories to identify:
 * - Are we getting the same outcomes too often?
 * - How do birth conditions cascade through life?
 * - Do systems interact realistically?
 * - What's the range of possible outcomes?
 * - Are there "rails" forcing similar paths?
 */

const MortalityGameV2 = require('../game_engine_v2_homeostatic.js');
const DeathTracer = require('../death_trace_system.js');
const birthCards = require('../birth_cards_json.json');
const familyCards = require('../family_cards_json.json');
const deathCards = require('../death_cards_json.json');

const eventCardsChildhood = require('../event_cards_childhood.json');
const eventCardsTeen = require('../event_cards_teen.json');
const eventCardsAdult = require('../event_cards_adult.json');
const eventCards = [...eventCardsChildhood, ...eventCardsTeen, ...eventCardsAdult];

// Configuration
const NUM_LIVES = 50;
const SAMPLE_AGES = [5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80];

console.log(`${'='.repeat(80)}`);
console.log('LIFE VARIATION ANALYSIS');
console.log(`Sample: ${NUM_LIVES} Nordic lives`);
console.log(`${'='.repeat(80)}\n`);

const nordicBirth = birthCards.find(b => b.name === 'Nordic Country');

// Collect snapshots at key ages
const snapshots = {};
SAMPLE_AGES.forEach(age => {
  snapshots[age] = {
    physical: [],
    mental: [],
    friends: [],
    income: [],
    resources: [],
    education: [],
    employed: [],
    housed: [],
    married: [],
    children: [],
    isolated: [],
    loneliness: [],
    socialNeeds: []
  };
});

// Track life outcomes
const outcomes = {
  ages: [],
  causes: {},
  education: {},
  maxIncome: [],
  everMarried: 0,
  hadChildren: 0,
  maxFriends: [],
  minMentalHealth: [],
  everHomeless: 0,
  everPoverty: 0,
  personalities: { introvert: 0, ambivert: 0, extrovert: 0 }
};

// Track cascade patterns
const cascades = {
  'poor_birth → low_education': 0,
  'low_education → unemployment': 0,
  'unemployment → poverty': 0,
  'poverty → poor_health': 0,
  'poor_health → isolation': 0,
  'isolation → mental_decline': 0,
  'privilege_birth → high_education': 0,
  'high_education → good_income': 0,
  'good_income → home_ownership': 0,
  'marriage → children': 0,
  'children → stable_housing': 0,
};

console.log('Simulating lives...\n');

for (let i = 0; i < NUM_LIVES; i++) {
  if ((i + 1) % 10 === 0) process.stdout.write(`\rProgress: ${i + 1}/${NUM_LIVES}`);
  
  const tracer = new DeathTracer();
  const engine = new MortalityGameV2(birthCards, familyCards, eventCards, deathCards, tracer);
  
  // Randomize family context
  const familyCard = familyCards[Math.floor(Math.random() * familyCards.length)];
  const sex = Math.random() > 0.5 ? 'male' : 'female';
  
  engine.createPlayer(nordicBirth, familyCard, { sex });
  const player = engine.player;
  
  // Track birth conditions
  const birthResources = player.relationships?.birthFamily?.resources || 50;
  const birthIncome = player.relationships?.birthFamily?.income || 30;
  const birthFamily = familyCard.name;
  
  // Track trajectory through life
  let maxFriends = 0;
  let minMentalHealth = 100;
  let maxIncome = 0;
  let everHomeless = false;
  let everPoverty = false;
  let everMarried = false;
  
  while (player.alive && player.demographics.age < 120) {
    const age = player.demographics.age;
    
    // Sample at key ages
    if (SAMPLE_AGES.includes(age)) {
      snapshots[age].physical.push(player.health.physical.current);
      snapshots[age].mental.push(player.health.mental.current);
      snapshots[age].friends.push(player.relationships?.social?.friends || 0);
      snapshots[age].income.push(player.economics?.income?.current || 0);
      snapshots[age].resources.push(player.economics?.resources?.current || 0);
      snapshots[age].education.push(player.development?.education?.level || 'none');
      snapshots[age].employed.push(player.economics?.income?.employed || false);
      snapshots[age].housed.push(player.housing?.type || 'unknown');
      snapshots[age].married.push(player.relationships?.social?.married || false);
      snapshots[age].children.push(player.relationships?.children?.length || 0);
      snapshots[age].isolated.push(player.relationships?.social?.isolation || false);
      snapshots[age].loneliness.push(player.relationships?.loneliness || 0);
      snapshots[age].socialNeeds.push(player.personality?.socialNeeds || 50);
    }
    
    // Track extremes
    const currentFriends = player.relationships?.social?.friends || 0;
    if (currentFriends > maxFriends) maxFriends = currentFriends;
    
    if (player.health.mental.current < minMentalHealth) {
      minMentalHealth = player.health.mental.current;
    }
    
    const currentIncome = player.economics?.income?.current || 0;
    if (currentIncome > maxIncome) maxIncome = currentIncome;
    
    if (player.housing?.type === 'homeless') everHomeless = true;
    if (player.economics?.resources?.current < 0) everPoverty = true;
    if (player.relationships?.social?.married) everMarried = true;
    
    engine.processYearEnd(player);
  }
  
  // Record outcomes
  outcomes.ages.push(player.demographics.age);
  
  const cause = player.causeOfDeath || 'Unknown';
  outcomes.causes[cause] = (outcomes.causes[cause] || 0) + 1;
  
  const eduLevel = player.development?.education?.level || 'none';
  outcomes.education[eduLevel] = (outcomes.education[eduLevel] || 0) + 1;
  
  outcomes.maxIncome.push(maxIncome);
  outcomes.maxFriends.push(maxFriends);
  outcomes.minMentalHealth.push(minMentalHealth);
  
  if (everMarried) outcomes.everMarried++;
  if (player.relationships?.children?.length > 0) outcomes.hadChildren++;
  if (everHomeless) outcomes.everHomeless++;
  if (everPoverty) outcomes.everPoverty++;
  
  // Personality
  const socialNeeds = player.personality?.socialNeeds || 50;
  if (socialNeeds < 33) outcomes.personalities.introvert++;
  else if (socialNeeds > 66) outcomes.personalities.extrovert++;
  else outcomes.personalities.ambivert++;
  
  // Track cascade patterns
  if (birthIncome < 30) {
    cascades['poor_birth → low_education']++;
    if (eduLevel === 'none' || eduLevel === 'primary') {
      cascades['low_education → unemployment']++;
      if (!player.economics?.income?.employed) {
        cascades['unemployment → poverty']++;
      }
    }
  }
  
  if (birthIncome > 60) {
    cascades['privilege_birth → high_education']++;
    if (eduLevel.includes('tertiary') || eduLevel.includes('bachelor')) {
      cascades['high_education → good_income']++;
      if (maxIncome > 80) {
        cascades['good_income → home_ownership']++;
      }
    }
  }
  
  if (everMarried && player.relationships?.children?.length > 0) {
    cascades['marriage → children']++;
  }
  
  if (player.health.physical.current < 50) {
    cascades['poor_health → isolation']++;
  }
  
  if (player.relationships?.social?.isolation) {
    cascades['isolation → mental_decline']++;
  }
}

console.log('\n\n');
console.log(`${'='.repeat(80)}`);
console.log('VARIATION ANALYSIS RESULTS');
console.log(`${'='.repeat(80)}\n`);

// Calculate variation metrics
function analyzeVariation(data, label) {
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const sorted = [...data].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const median = sorted[Math.floor(sorted.length * 0.5)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const stdDev = Math.sqrt(data.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / data.length);
  const cv = stdDev / mean; // Coefficient of variation
  
  console.log(`${label}:`);
  console.log(`  Range: ${min.toFixed(1)} - ${max.toFixed(1)}`);
  console.log(`  Mean: ${mean.toFixed(1)} (StdDev: ${stdDev.toFixed(1)})`);
  console.log(`  Quartiles: Q1=${q1.toFixed(1)}, Median=${median.toFixed(1)}, Q3=${q3.toFixed(1)}`);
  console.log(`  Coefficient of Variation: ${(cv * 100).toFixed(1)}% ${cv > 0.3 ? '(HIGH variation ✓)' : cv > 0.15 ? '(MODERATE variation)' : '(LOW variation ⚠️)'}`);
  console.log();
  
  return { mean, stdDev, cv, min, max, median };
}

console.log('--- LIFE OUTCOMES ---\n');
analyzeVariation(outcomes.ages, 'Age at Death');
analyzeVariation(outcomes.maxIncome, 'Maximum Income Achieved');
analyzeVariation(outcomes.maxFriends, 'Maximum Friends');
analyzeVariation(outcomes.minMentalHealth, 'Minimum Mental Health');

console.log('--- LIFE MILESTONES ---\n');
console.log(`Ever Married: ${outcomes.everMarried}/${NUM_LIVES} (${(outcomes.everMarried/NUM_LIVES*100).toFixed(1)}%)`);
console.log(`Had Children: ${outcomes.hadChildren}/${NUM_LIVES} (${(outcomes.hadChildren/NUM_LIVES*100).toFixed(1)}%)`);
console.log(`Ever Homeless: ${outcomes.everHomeless}/${NUM_LIVES} (${(outcomes.everHomeless/NUM_LIVES*100).toFixed(1)}%)`);
console.log(`Ever in Poverty: ${outcomes.everPoverty}/${NUM_LIVES} (${(outcomes.everPoverty/NUM_LIVES*100).toFixed(1)}%)`);
console.log();

console.log('--- PERSONALITY DISTRIBUTION ---\n');
console.log(`Introvert: ${outcomes.personalities.introvert}/${NUM_LIVES} (${(outcomes.personalities.introvert/NUM_LIVES*100).toFixed(1)}%)`);
console.log(`Ambivert: ${outcomes.personalities.ambivert}/${NUM_LIVES} (${(outcomes.personalities.ambivert/NUM_LIVES*100).toFixed(1)}%)`);
console.log(`Extrovert: ${outcomes.personalities.extrovert}/${NUM_LIVES} (${(outcomes.personalities.extrovert/NUM_LIVES*100).toFixed(1)}%)`);
console.log();

console.log('--- EDUCATION OUTCOMES ---\n');
const eduSorted = Object.entries(outcomes.education).sort((a, b) => b[1] - a[1]);
eduSorted.forEach(([level, count]) => {
  console.log(`  ${level}: ${count} (${(count/NUM_LIVES*100).toFixed(1)}%)`);
});
console.log();

console.log('--- SNAPSHOT VARIATION AT KEY AGES ---\n');

for (const age of [20, 40, 60, 80]) {
  if (snapshots[age].physical.length > 0) {
    console.log(`Age ${age}:`);
    const physicalStats = analyzeVariation(snapshots[age].physical, '  Physical Health');
    const mentalStats = analyzeVariation(snapshots[age].mental, '  Mental Health');
    const friendsStats = analyzeVariation(snapshots[age].friends, '  Friends');
    const resourcesStats = analyzeVariation(snapshots[age].resources, '  Resources');
    
    // Check for clustering (low variation = "rails")
    const warnings = [];
    if (physicalStats.cv < 0.15) warnings.push('Physical Health clustered');
    if (mentalStats.cv < 0.15) warnings.push('Mental Health clustered');
    if (friendsStats.cv < 0.3) warnings.push('Friends clustered');
    if (resourcesStats.cv < 0.3) warnings.push('Resources clustered');
    
    if (warnings.length > 0) {
      console.log(`  ⚠️  LOW VARIATION: ${warnings.join(', ')}`);
    }
    console.log();
  }
}

console.log('--- CASCADE ANALYSIS ---\n');
console.log('Cascade Patterns (how often do these chains occur?):');
console.log();

const cascadeEntries = Object.entries(cascades).sort((a, b) => b[1] - a[1]);
cascadeEntries.forEach(([pattern, count]) => {
  const pct = (count / NUM_LIVES * 100).toFixed(1);
  console.log(`  ${pattern}: ${count}/${NUM_LIVES} (${pct}%)`);
});

console.log(`\n${'='.repeat(80)}\n`);

console.log('RECOMMENDATIONS:\n');

// Analyze and recommend improvements
const avgCV = [
  outcomes.ages,
  outcomes.maxIncome,
  outcomes.maxFriends,
  outcomes.minMentalHealth
].map(data => {
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const stdDev = Math.sqrt(data.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / data.length);
  return stdDev / mean;
}).reduce((a, b) => a + b, 0) / 4;

if (avgCV < 0.2) {
  console.log('⚠️  LOW OVERALL VARIATION detected (CV < 20%)');
  console.log('   Lives are too similar. Consider:');
  console.log('   - Increasing randomness in events');
  console.log('   - More diverse birth circumstances');
  console.log('   - Stronger personality trait effects');
  console.log('   - More random life shocks');
} else if (avgCV > 0.5) {
  console.log('⚠️  VERY HIGH VARIATION detected (CV > 50%)');
  console.log('   Outcomes may be too chaotic. Consider:');
  console.log('   - Reducing random variance');
  console.log('   - Strengthening stabilizing factors');
} else {
  console.log('✅ GOOD VARIATION detected (CV 20-50%)');
  console.log('   Lives show realistic diversity in outcomes');
}

console.log();

// Check for generational effects
if (cascades['poor_birth → low_education'] > NUM_LIVES * 0.8) {
  console.log('⚠️  STRONG DETERMINISM: Poor birth → low education (>80%)');
  console.log('   Consider adding more upward mobility opportunities');
}

if (cascades['privilege_birth → high_education'] > NUM_LIVES * 0.8) {
  console.log('⚠️  STRONG PRIVILEGE LOCK-IN: Wealth → education (>80%)');
  console.log('   May be realistic but check if opportunities exist for exceptions');
}

console.log();
console.log('Full results exported to variation_analysis.json');

// Export detailed data
const fs = require('fs');
fs.writeFileSync('variation_analysis.json', JSON.stringify({
  outcomes,
  cascades,
  snapshots,
  analysis: {
    avgCoefficientOfVariation: avgCV,
    ageRange: [Math.min(...outcomes.ages), Math.max(...outcomes.ages)],
    incomeRange: [Math.min(...outcomes.maxIncome), Math.max(...outcomes.maxIncome)],
    friendsRange: [Math.min(...outcomes.maxFriends), Math.max(...outcomes.maxFriends)]
  }
}, null, 2));
