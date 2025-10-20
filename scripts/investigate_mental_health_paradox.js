/**
 * Mental Health Paradox Investigation
 * 
 * FINDING: Poor births show BETTER minimum mental health (38.3) than rich births (32.7)
 * This is counterintuitive - we expect poverty to worsen mental health.
 * 
 * Hypotheses to test:
 * 1. Survivor bias: Poor births die younger, removing worst mental health cases
 * 2. Stress/expectations: Rich families have higher pressure/expectations
 * 3. Social support: Poor communities have stronger social networks
 * 4. Mental health treatment access: Rich get diagnosed/treated more (lower "floor")
 * 5. Substance abuse: Rich have more access to harmful substances
 * 
 * Method:
 * - Track mental health trajectory throughout life for rich vs poor
 * - Check if rich have more mental health crises
 * - See if poor die before hitting lowest points
 * - Examine stress factors and social support differences
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

console.log('='.repeat(80));
console.log('MENTAL HEALTH PARADOX INVESTIGATION');
console.log('Why do poor births have BETTER minimum mental health than rich births?');
console.log('='.repeat(80));

// Track detailed mental health trajectories
function simulateWithMentalHealthTracking(targetIncome, sampleSize, label) {
  const nordicBirth = birthCards.find(c => c.name.includes('Nordic'));
  const results = {
    label,
    lives: [],
    
    // Mental health stats
    avgMinMentalHealth: 0,
    mentalHealthCrises: 0, // Count of times below 30
    suicides: 0,
    avgDeathAge: 0,
    
    // Age-specific mental health
    mentalHealthByAge: {},
    
    // Contributing factors
    avgStress: 0,
    avgSocialSupport: 0,
    chronicMentalIllness: 0,
    
    // Early death tracking
    diedBefore40: 0,
    diedBefore60: 0
  };
  
  // Initialize age buckets
  for (let age = 0; age <= 100; age += 10) {
    results.mentalHealthByAge[age] = [];
  }
  
  let attempts = 0;
  const maxAttempts = sampleSize * 50;
  
  while (results.lives.length < sampleSize && attempts < maxAttempts) {
    attempts++;
    
    const familyCard = familyCards[Math.floor(Math.random() * familyCards.length)];
    const sex = Math.random() > 0.5 ? 'male' : 'female';
    
    const engine = new MortalityGameV2(birthCards, familyCards, allEventCards, deathCards);
    engine.disableDeathTracing();
    engine.createPlayer(nordicBirth, familyCard, { sex });
    
    const player = engine.player;
    const birthIncome = player.relationships?.birthFamily?.income || 30;
    
    const matchesTarget = targetIncome === 'rich' ? birthIncome > 60 : birthIncome < 30;
    if (!matchesTarget) continue;
    
    // Track this life
    const lifeData = {
      birthIncome,
      mentalHealthHistory: [],
      minMentalHealth: 100,
      crisisCount: 0,
      deathAge: 0,
      causeOfDeath: null,
      hadChronicMentalIllness: false,
      avgFriends: 0,
      avgLoneliness: 0
    };
    
    let friendsSum = 0;
    let lonelinessSum = 0;
    let yearsAlive = 0;
    
    while (player.alive && player.demographics.age < 120) {
      const age = player.demographics.age;
      const mentalHealth = player.health?.mental?.current || 100;
      const friends = player.relationships?.social?.friends || 0;
      const loneliness = player.personality?.loneliness || 0;
      
      lifeData.mentalHealthHistory.push({ age, mentalHealth });
      lifeData.minMentalHealth = Math.min(lifeData.minMentalHealth, mentalHealth);
      
      // Track crisis episodes
      if (mentalHealth < 30) {
        lifeData.crisisCount++;
      }
      
      // Sample mental health by age bucket
      const ageBucket = Math.floor(age / 10) * 10;
      if (results.mentalHealthByAge[ageBucket]) {
        results.mentalHealthByAge[ageBucket].push(mentalHealth);
      }
      
      // Track chronic conditions
      if (player.health?.mental?.chronic?.length > 0) {
        lifeData.hadChronicMentalIllness = true;
      }
      
      friendsSum += friends;
      lonelinessSum += loneliness;
      yearsAlive++;
      
      engine.processYearEnd(player);
    }
    
    lifeData.deathAge = player.demographics.age;
    lifeData.causeOfDeath = player.causeOfDeath;
    lifeData.avgFriends = friendsSum / yearsAlive;
    lifeData.avgLoneliness = lonelinessSum / yearsAlive;
    
    // Aggregate stats
    results.avgMinMentalHealth += lifeData.minMentalHealth;
    results.mentalHealthCrises += lifeData.crisisCount;
    results.avgDeathAge += lifeData.deathAge;
    
    if (lifeData.causeOfDeath === 'Suicide') results.suicides++;
    if (lifeData.hadChronicMentalIllness) results.chronicMentalIllness++;
    if (lifeData.deathAge < 40) results.diedBefore40++;
    if (lifeData.deathAge < 60) results.diedBefore60++;
    
    results.avgSocialSupport += lifeData.avgFriends;
    
    results.lives.push(lifeData);
  }
  
  // Calculate averages
  const n = results.lives.length;
  if (n > 0) {
    results.avgMinMentalHealth /= n;
    results.avgDeathAge /= n;
    results.avgSocialSupport /= n;
  }
  
  return results;
}

// Helper for stats
function mean(arr) {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function stdDev(arr) {
  if (arr.length === 0) return 0;
  const avg = mean(arr);
  return Math.sqrt(mean(arr.map(x => Math.pow(x - avg, 2))));
}

console.log('\n🔄 Analyzing 50 RICH births...\n');
const richResults = simulateWithMentalHealthTracking('rich', 50, 'RICH');

console.log('🔄 Analyzing 50 POOR births...\n');
const poorResults = simulateWithMentalHealthTracking('poor', 50, 'POOR');

console.log('\n' + '='.repeat(80));
console.log('MENTAL HEALTH COMPARISON');
console.log('='.repeat(80));

console.log('\n--- MINIMUM MENTAL HEALTH (The Paradox) ---\n');
console.log(`RICH: ${richResults.avgMinMentalHealth.toFixed(1)} (lowest point in life)`);
console.log(`POOR: ${poorResults.avgMinMentalHealth.toFixed(1)} (lowest point in life)`);
console.log(`📊 PARADOX: Poor births have ${(poorResults.avgMinMentalHealth - richResults.avgMinMentalHealth).toFixed(1)} points BETTER minimum mental health`);

console.log('\n--- MENTAL HEALTH CRISES ---\n');
console.log(`RICH: ${richResults.mentalHealthCrises} total crisis episodes (mental health < 30)`);
console.log(`POOR: ${poorResults.mentalHealthCrises} total crisis episodes`);
console.log(`Average per person:`);
console.log(`  RICH: ${(richResults.mentalHealthCrises / richResults.lives.length).toFixed(1)} crises`);
console.log(`  POOR: ${(poorResults.mentalHealthCrises / poorResults.lives.length).toFixed(1)} crises`);

console.log('\n--- CHRONIC MENTAL ILLNESS ---\n');
console.log(`RICH: ${richResults.chronicMentalIllness}/${richResults.lives.length} (${(richResults.chronicMentalIllness/richResults.lives.length*100).toFixed(1)}%) had chronic mental illness`);
console.log(`POOR: ${poorResults.chronicMentalIllness}/${poorResults.lives.length} (${(poorResults.chronicMentalIllness/poorResults.lives.length*100).toFixed(1)}%) had chronic mental illness`);

console.log('\n--- SUICIDE RATES ---\n');
console.log(`RICH: ${richResults.suicides}/${richResults.lives.length} (${(richResults.suicides/richResults.lives.length*100).toFixed(1)}%) died by suicide`);
console.log(`POOR: ${poorResults.suicides}/${poorResults.lives.length} (${(poorResults.suicides/poorResults.lives.length*100).toFixed(1)}%) died by suicide`);

console.log('\n--- SURVIVOR BIAS HYPOTHESIS ---\n');
console.log(`Deaths before age 40:`);
console.log(`  RICH: ${richResults.diedBefore40}/${richResults.lives.length} (${(richResults.diedBefore40/richResults.lives.length*100).toFixed(1)}%)`);
console.log(`  POOR: ${poorResults.diedBefore40}/${poorResults.lives.length} (${(poorResults.diedBefore40/poorResults.lives.length*100).toFixed(1)}%)`);
console.log(`Deaths before age 60:`);
console.log(`  RICH: ${richResults.diedBefore60}/${richResults.lives.length} (${(richResults.diedBefore60/richResults.lives.length*100).toFixed(1)}%)`);
console.log(`  POOR: ${poorResults.diedBefore60}/${poorResults.lives.length} (${(poorResults.diedBefore60/poorResults.lives.length*100).toFixed(1)}%)`);
console.log(`Average lifespan:`);
console.log(`  RICH: ${richResults.avgDeathAge.toFixed(1)} years`);
console.log(`  POOR: ${poorResults.avgDeathAge.toFixed(1)} years`);

console.log('\n--- SOCIAL SUPPORT HYPOTHESIS ---\n');
console.log(`Average number of friends:`);
console.log(`  RICH: ${richResults.avgSocialSupport.toFixed(1)}`);
console.log(`  POOR: ${poorResults.avgSocialSupport.toFixed(1)}`);

console.log('\n--- MENTAL HEALTH TRAJECTORY BY AGE ---\n');
for (let age = 0; age <= 100; age += 10) {
  const richMH = richResults.mentalHealthByAge[age];
  const poorMH = poorResults.mentalHealthByAge[age];
  
  if (richMH.length === 0 || poorMH.length === 0) continue;
  
  const richAvg = mean(richMH);
  const poorAvg = mean(poorMH);
  const richSD = stdDev(richMH);
  const poorSD = stdDev(poorMH);
  
  console.log(`Age ${age}:`);
  console.log(`  RICH: ${richAvg.toFixed(1)} (±${richSD.toFixed(1)}) [n=${richMH.length}]`);
  console.log(`  POOR: ${poorAvg.toFixed(1)} (±${poorSD.toFixed(1)}) [n=${poorMH.length}]`);
  console.log(`  Difference: ${(poorAvg - richAvg).toFixed(1)} ${poorAvg > richAvg ? '(poor better)' : '(rich better)'}`);
}

console.log('\n' + '='.repeat(80));
console.log('HYPOTHESIS TESTING');
console.log('='.repeat(80));

// Test survivor bias
const earlyDeathGap = (poorResults.diedBefore60 / poorResults.lives.length) - (richResults.diedBefore60 / richResults.lives.length);
if (earlyDeathGap > 0.10) {
  console.log('\n✅ SURVIVOR BIAS CONFIRMED: Poor births die earlier (by ${(earlyDeathGap*100).toFixed(1)}%), removing worst mental health cases before they hit rock bottom');
} else {
  console.log('\n❌ SURVIVOR BIAS WEAK: Early death gap only ${(earlyDeathGap*100).toFixed(1)}%, not enough to explain paradox');
}

// Test social support
if (poorResults.avgSocialSupport > richResults.avgSocialSupport) {
  console.log(`✅ SOCIAL SUPPORT HYPOTHESIS: Poor have MORE friends (${(poorResults.avgSocialSupport - richResults.avgSocialSupport).toFixed(1)} more), providing better protection`);
} else {
  console.log(`❌ SOCIAL SUPPORT WEAK: Rich actually have ${(richResults.avgSocialSupport - poorResults.avgSocialSupport).toFixed(1)} more friends`);
}

// Test crisis frequency
const crisisRate = (poorResults.mentalHealthCrises / poorResults.lives.length) - (richResults.mentalHealthCrises / richResults.lives.length);
if (crisisRate < -1) {
  console.log(`✅ RICH STRESS HYPOTHESIS: Rich experience ${Math.abs(crisisRate).toFixed(1)} MORE crises per person (higher expectations/pressure)`);
} else if (crisisRate > 1) {
  console.log(`❌ POOR STRESS REALITY: Poor experience ${crisisRate.toFixed(1)} MORE crises per person`);
} else {
  console.log(`⚠️ CRISIS RATES SIMILAR: Difference of ${crisisRate.toFixed(1)} crises per person`);
}

console.log('\n' + '='.repeat(80));

// Export data
fs.writeFileSync('mental_health_paradox_analysis.json', JSON.stringify({
  rich: richResults,
  poor: poorResults,
  timestamp: new Date().toISOString()
}, null, 2));

console.log('\n📊 Full data exported to mental_health_paradox_analysis.json\n');
