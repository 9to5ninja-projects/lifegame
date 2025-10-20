/**
 * Birth Family Cascade Testing
 * 
 * USER REQUEST: "i feel like we havent tested the birth or 2nd generation system out yet, 
 * which can play factors in old age"
 * 
 * This test examines how birth family conditions cascade through life:
 * - Does being born rich vs poor affect education, income, health, longevity?
 * - Do parent education levels influence child outcomes?
 * - Are there poverty/privilege cycles?
 * - Does family support matter in old age?
 * 
 * Methodology:
 * - Simulate 100 lives with RICH birth families (income > 60)
 * - Simulate 100 lives with POOR birth families (income < 30)
 * - Compare outcomes at ages: 20, 40, 60, 80, and death
 */

const MortalityGameV2 = require('../game_engine_v2_homeostatic.js');
const fs = require('fs');

// Load card data
const birthCards = JSON.parse(fs.readFileSync('./birth_cards_json.json', 'utf8'));
const familyCards = JSON.parse(fs.readFileSync('./family_cards_json.json', 'utf8'));
const eventCardsChildhood = JSON.parse(fs.readFileSync('./event_cards_childhood.json', 'utf8'));
const eventCardsTeen = JSON.parse(fs.readFileSync('./event_cards_teen.json', 'utf8'));
const eventCardsAdult = JSON.parse(fs.readFileSync('./event_cards_adult.json', 'utf8'));
const deathCards = JSON.parse(fs.readFileSync('./death_cards_json.json', 'utf8'));

const allEventCards = [...eventCardsChildhood, ...eventCardsTeen, ...eventCardsAdult];

// Sample ages for comparison
const SAMPLE_AGES = [20, 40, 60, 80];

console.log('='.repeat(80));
console.log('BIRTH FAMILY CASCADE ANALYSIS');
console.log('Testing how birth conditions affect life trajectories');
console.log('='.repeat(80));

// Helper to run simulations and force specific birth family income
function simulateLivesWithBirthIncome(targetIncome, sampleSize, label) {
  const results = {
    label,
    targetIncome,
    count: 0,
    lives: [],
    
    // Birth conditions
    avgBirthIncome: 0,
    avgBirthResources: 0,
    
    // Education outcomes
    educationLevels: { none: 0, primary: 0, secondary: 0, tertiary_bachelor: 0 },
    
    // Life outcomes
    avgDeathAge: 0,
    avgMaxIncome: 0,
    avgMaxFriends: 0,
    avgMinMentalHealth: 0,
    
    // Milestones
    everMarried: 0,
    hadChildren: 0,
    everPoverty: 0,
    everHomeless: 0,
    
    // Age snapshots
    snapshots: {
      20: { health: [], mental: [], friends: [], resources: [], income: [] },
      40: { health: [], mental: [], friends: [], resources: [], income: [] },
      60: { health: [], mental: [], friends: [], resources: [], income: [] },
      80: { health: [], mental: [], friends: [], resources: [], income: [] }
    }
  };
  
  // Find Nordic birth card
  const nordicBirth = birthCards.find(c => c.name.includes('Nordic'));
  
  let attempts = 0;
  const maxAttempts = sampleSize * 50; // Prevent infinite loop
  
  while (results.count < sampleSize && attempts < maxAttempts) {
    attempts++;
    
    // Random family card
    const familyCard = familyCards[Math.floor(Math.random() * familyCards.length)];
    const sex = Math.random() > 0.5 ? 'male' : 'female';
    
    const engine = new MortalityGameV2(birthCards, familyCards, allEventCards, deathCards);
    engine.disableDeathTracing(); // Performance
    engine.createPlayer(nordicBirth, familyCard, { sex });
    
    const player = engine.player;
    
    // Check if birth income matches our target
    const birthIncome = player.relationships?.birthFamily?.income || 30;
    
    // For rich group: need income > 60
    // For poor group: need income < 30
    const matchesTarget = targetIncome === 'rich' ? birthIncome > 60 : birthIncome < 30;
    
    if (!matchesTarget) continue; // Skip this life, doesn't match criteria
    
    // This life matches! Track it
    results.count++;
    results.avgBirthIncome += birthIncome;
    results.avgBirthResources += player.relationships?.birthFamily?.resources || 50;
    
    // Track through life
    let maxFriends = 0;
    let minMentalHealth = 100;
    let maxIncome = 0;
    let everPoverty = false;
    let everHomeless = false;
    let everMarried = false;
    
    while (player.alive && player.demographics.age < 120) {
      const age = player.demographics.age;
      
      // Track maximums/minimums
      maxFriends = Math.max(maxFriends, player.relationships?.social?.friends || 0);
      minMentalHealth = Math.min(minMentalHealth, player.health?.mental?.current || 100);
      maxIncome = Math.max(maxIncome, player.economics?.income?.current || 0);
      
      if (player.economics?.resources?.current < 10) everPoverty = true;
      if (player.circumstances?.housing?.status === 'homeless') everHomeless = true;
      if (player.relationships?.social?.married) everMarried = true;
      
      // Snapshot at key ages
      if (SAMPLE_AGES.includes(age)) {
        results.snapshots[age].health.push(player.health?.physical?.current || 0);
        results.snapshots[age].mental.push(player.health?.mental?.current || 0);
        results.snapshots[age].friends.push(player.relationships?.social?.friends || 0);
        results.snapshots[age].resources.push(player.economics?.resources?.current || 0);
        results.snapshots[age].income.push(player.economics?.income?.current || 0);
      }
      
      engine.processYearEnd(player);
    }
    
    // Record final outcomes
    const deathAge = player.demographics.age;
    const eduLevel = player.development?.education?.level || 'none';
    const hadChildren = (player.relationships?.children?.length || 0) > 0;
    
    results.avgDeathAge += deathAge;
    results.avgMaxIncome += maxIncome;
    results.avgMaxFriends += maxFriends;
    results.avgMinMentalHealth += minMentalHealth;
    
    if (eduLevel.includes('tertiary') || eduLevel.includes('bachelor')) {
      results.educationLevels.tertiary_bachelor++;
    } else if (eduLevel === 'secondary') {
      results.educationLevels.secondary++;
    } else if (eduLevel === 'primary') {
      results.educationLevels.primary++;
    } else {
      results.educationLevels.none++;
    }
    
    if (everMarried) results.everMarried++;
    if (hadChildren) results.hadChildren++;
    if (everPoverty) results.everPoverty++;
    if (everHomeless) results.everHomeless++;
    
    results.lives.push({
      birthIncome,
      deathAge,
      eduLevel,
      maxIncome,
      maxFriends,
      minMentalHealth,
      everMarried,
      hadChildren
    });
  }
  
  // Calculate averages
  if (results.count > 0) {
    results.avgBirthIncome /= results.count;
    results.avgBirthResources /= results.count;
    results.avgDeathAge /= results.count;
    results.avgMaxIncome /= results.count;
    results.avgMaxFriends /= results.count;
    results.avgMinMentalHealth /= results.count;
  }
  
  return results;
}

// Helper to calculate mean
function mean(arr) {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

// Helper to calculate standard deviation
function stdDev(arr) {
  if (arr.length === 0) return 0;
  const avg = mean(arr);
  const squareDiffs = arr.map(value => Math.pow(value - avg, 2));
  return Math.sqrt(mean(squareDiffs));
}

console.log('\n🔄 Simulating 100 RICH birth families (income > 60)...\n');
const richResults = simulateLivesWithBirthIncome('rich', 100, 'RICH Birth Families');

console.log('✅ Rich group complete\n');
console.log('🔄 Simulating 100 POOR birth families (income < 30)...\n');
const poorResults = simulateLivesWithBirthIncome('poor', 100, 'POOR Birth Families');

console.log('✅ Poor group complete\n');

// ============================================================================
// PRINT COMPARISON REPORT
// ============================================================================

console.log('\n' + '='.repeat(80));
console.log('BIRTH FAMILY CASCADE COMPARISON REPORT');
console.log('='.repeat(80));

console.log('\n--- BIRTH CONDITIONS ---\n');
console.log(`RICH births: Avg family income ${richResults.avgBirthIncome.toFixed(1)} (resources: ${richResults.avgBirthResources.toFixed(1)})`);
console.log(`POOR births: Avg family income ${poorResults.avgBirthIncome.toFixed(1)} (resources: ${poorResults.avgBirthResources.toFixed(1)})`);

console.log('\n--- EDUCATION OUTCOMES ---\n');
const richTertiary = ((richResults.educationLevels.tertiary_bachelor / richResults.count) * 100).toFixed(1);
const poorTertiary = ((poorResults.educationLevels.tertiary_bachelor / poorResults.count) * 100).toFixed(1);
const richSecondary = ((richResults.educationLevels.secondary / richResults.count) * 100).toFixed(1);
const poorSecondary = ((poorResults.educationLevels.secondary / poorResults.count) * 100).toFixed(1);

console.log(`RICH: ${richTertiary}% tertiary, ${richSecondary}% secondary`);
console.log(`POOR: ${poorTertiary}% tertiary, ${poorSecondary}% secondary`);
console.log(`\n📊 EDUCATION GAP: ${(richTertiary - poorTertiary).toFixed(1)}% more rich children attend university`);

console.log('\n--- LIFE OUTCOMES ---\n');
console.log(`Average Lifespan:`);
console.log(`  RICH: ${richResults.avgDeathAge.toFixed(1)} years`);
console.log(`  POOR: ${poorResults.avgDeathAge.toFixed(1)} years`);
console.log(`  📊 GAP: ${(richResults.avgDeathAge - poorResults.avgDeathAge).toFixed(1)} years longer for rich births`);

console.log(`\nMaximum Income Achieved:`);
console.log(`  RICH: ${richResults.avgMaxIncome.toFixed(1)}`);
console.log(`  POOR: ${poorResults.avgMaxIncome.toFixed(1)}`);
console.log(`  📊 GAP: ${((richResults.avgMaxIncome / poorResults.avgMaxIncome - 1) * 100).toFixed(1)}% higher for rich births`);

console.log(`\nMaximum Friends:`);
console.log(`  RICH: ${richResults.avgMaxFriends.toFixed(1)}`);
console.log(`  POOR: ${poorResults.avgMaxFriends.toFixed(1)}`);
console.log(`  📊 GAP: ${(richResults.avgMaxFriends - poorResults.avgMaxFriends).toFixed(1)} more friends for rich births`);

console.log(`\nMinimum Mental Health:`);
console.log(`  RICH: ${richResults.avgMinMentalHealth.toFixed(1)}`);
console.log(`  POOR: ${poorResults.avgMinMentalHealth.toFixed(1)}`);
console.log(`  📊 GAP: ${(richResults.avgMinMentalHealth - poorResults.avgMinMentalHealth).toFixed(1)} points better for rich births`);

console.log('\n--- LIFE MILESTONES ---\n');
console.log(`Ever Married:`);
console.log(`  RICH: ${richResults.everMarried}/${richResults.count} (${(richResults.everMarried/richResults.count*100).toFixed(1)}%)`);
console.log(`  POOR: ${poorResults.everMarried}/${poorResults.count} (${(poorResults.everMarried/poorResults.count*100).toFixed(1)}%)`);

console.log(`\nHad Children:`);
console.log(`  RICH: ${richResults.hadChildren}/${richResults.count} (${(richResults.hadChildren/richResults.count*100).toFixed(1)}%)`);
console.log(`  POOR: ${poorResults.hadChildren}/${poorResults.count} (${(poorResults.hadChildren/poorResults.count*100).toFixed(1)}%)`);

console.log(`\nEver Experienced Poverty:`);
console.log(`  RICH: ${richResults.everPoverty}/${richResults.count} (${(richResults.everPoverty/richResults.count*100).toFixed(1)}%)`);
console.log(`  POOR: ${poorResults.everPoverty}/${poorResults.count} (${(poorResults.everPoverty/poorResults.count*100).toFixed(1)}%)`);

console.log('\n--- AGE TRAJECTORY COMPARISON ---\n');

for (const age of SAMPLE_AGES) {
  const richSnap = richResults.snapshots[age];
  const poorSnap = poorResults.snapshots[age];
  
  if (richSnap.health.length === 0 || poorSnap.health.length === 0) continue;
  
  console.log(`\nAge ${age}:`);
  console.log(`  Income: RICH ${mean(richSnap.income).toFixed(1)} vs POOR ${mean(poorSnap.income).toFixed(1)} (${((mean(richSnap.income) - mean(poorSnap.income)) / mean(poorSnap.income) * 100).toFixed(1)}% gap)`);
  console.log(`  Resources: RICH ${mean(richSnap.resources).toFixed(1)} vs POOR ${mean(poorSnap.resources).toFixed(1)}`);
  console.log(`  Mental Health: RICH ${mean(richSnap.mental).toFixed(1)} vs POOR ${mean(poorSnap.mental).toFixed(1)}`);
  console.log(`  Friends: RICH ${mean(richSnap.friends).toFixed(1)} vs POOR ${mean(poorSnap.friends).toFixed(1)}`);
}

console.log('\n' + '='.repeat(80));
console.log('KEY FINDINGS:');
console.log('='.repeat(80));

const educationGap = richTertiary - poorTertiary;
const lifespanGap = richResults.avgDeathAge - poorResults.avgDeathAge;
const incomeGap = ((richResults.avgMaxIncome / poorResults.avgMaxIncome - 1) * 100);

if (educationGap > 10) {
  console.log(`\n✅ EDUCATION CASCADE: Rich births have ${educationGap.toFixed(1)}% higher university attendance`);
} else {
  console.log(`\n❌ EDUCATION CASCADE WEAK: Only ${educationGap.toFixed(1)}% gap (expected >10%)`);
}

if (lifespanGap > 2) {
  console.log(`✅ LONGEVITY CASCADE: Rich births live ${lifespanGap.toFixed(1)} years longer`);
} else {
  console.log(`❌ LONGEVITY CASCADE WEAK: Only ${lifespanGap.toFixed(1)} year gap (expected >2 years)`);
}

if (incomeGap > 20) {
  console.log(`✅ INCOME CASCADE: Rich births earn ${incomeGap.toFixed(1)}% more at peak`);
} else {
  console.log(`❌ INCOME CASCADE WEAK: Only ${incomeGap.toFixed(1)}% gap (expected >20%)`);
}

const povertyGapPercent = (poorResults.everPoverty/poorResults.count - richResults.everPoverty/richResults.count) * 100;
if (povertyGapPercent > 15) {
  console.log(`✅ POVERTY CYCLE: Poor births ${povertyGapPercent.toFixed(1)}% more likely to experience poverty`);
} else {
  console.log(`❌ POVERTY CYCLE WEAK: Only ${povertyGapPercent.toFixed(1)}% gap (expected >15%)`);
}

console.log('\n' + '='.repeat(80));

// Export detailed data
const exportData = {
  timestamp: new Date().toISOString(),
  rich: richResults,
  poor: poorResults,
  gaps: {
    education: educationGap,
    lifespan: lifespanGap,
    income: incomeGap,
    poverty: povertyGapPercent
  }
};

fs.writeFileSync('birth_cascade_analysis.json', JSON.stringify(exportData, null, 2));
console.log('\n📊 Full data exported to birth_cascade_analysis.json\n');
