/**
 * Late-Life Income Inversion Investigation
 * 
 * FINDING: At age 60+, poor births earn MORE income than rich births
 * Age 60: Rich 63.8 vs Poor 67.9 (-6%)
 * Age 80: Rich 7.6 vs Poor 10.5 (-27%)
 * 
 * Hypothesis: Rich retire earlier with savings, poor work longer out of necessity
 * 
 * Test: Track employment status and income source at ages 60, 70, 80
 */

const MortalityGameV2 = require('../game_engine_v2_homeostatic.js');
const fs = require('fs');

const birthCards = JSON.parse(fs.readFileSync('./birth_cards_json.json', 'utf8'));
const familyCards = JSON.parse(fs.readFileSync('./family_cards_json.json', 'utf8'));
const eventCardsChildhood = JSON.parse(fs.readFileSync('./event_cards_childhood.json', 'utf8'));
const eventCardsTeen = JSON.parse(fs.readFileSync('./event_cards_teen.json', 'utf8'));
const eventCardsAdult = JSON.parse(fs.readFileSync('./event_cards_adult.json', 'utf8'));
const deathCards = JSON.parse(fs.readFileSync('./death_cards_json.json', 'utf8'));

const allEventCards = [...eventCardsChildhood, ...eventCardsTeen, ...eventCardsAdult];

console.log('='.repeat(80));
console.log('LATE-LIFE INCOME INVERSION INVESTIGATION');
console.log('='.repeat(80));

function simulateWithEmploymentTracking(targetIncome, sampleSize, label) {
  const nordicBirth = birthCards.find(c => c.name.includes('Nordic'));
  const results = {
    label,
    lives: [],
    snapshots: {
      60: { employed: 0, unemployed: 0, income: [], resources: [] },
      70: { employed: 0, unemployed: 0, income: [], resources: [] },
      80: { employed: 0, unemployed: 0, income: [], resources: [] }
    }
  };
  
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
    
    const lifeData = {
      birthIncome,
      deathAge: 0,
      employmentHistory: {}
    };
    
    while (player.alive && player.demographics.age < 120) {
      const age = player.demographics.age;
      
      // Track at key ages
      if ([60, 70, 80].includes(age)) {
        const snapshot = {
          age,
          employed: player.economics?.income?.employed || false,
          income: player.economics?.income?.current || 0,
          resources: player.economics?.resources?.current || 0,
          unemploymentMonths: player.economics?.income?.unemploymentMonths || 0
        };
        
        lifeData.employmentHistory[age] = snapshot;
        
        // Aggregate
        if (snapshot.employed) {
          results.snapshots[age].employed++;
        } else {
          results.snapshots[age].unemployed++;
        }
        results.snapshots[age].income.push(snapshot.income);
        results.snapshots[age].resources.push(snapshot.resources);
      }
      
      engine.processYearEnd(player);
    }
    
    lifeData.deathAge = player.demographics.age;
    results.lives.push(lifeData);
  }
  
  return results;
}

function mean(arr) {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

console.log('\n🔄 Tracking 100 RICH births through retirement years...\n');
const richResults = simulateWithEmploymentTracking('rich', 100, 'RICH');

console.log('🔄 Tracking 100 POOR births through retirement years...\n');
const poorResults = simulateWithEmploymentTracking('poor', 100, 'POOR');

console.log('\n' + '='.repeat(80));
console.log('EMPLOYMENT & INCOME BY AGE');
console.log('='.repeat(80));

for (const age of [60, 70, 80]) {
  console.log(`\n--- AGE ${age} ---\n`);
  
  const richSnap = richResults.snapshots[age];
  const poorSnap = poorResults.snapshots[age];
  
  const richTotal = richSnap.employed + richSnap.unemployed;
  const poorTotal = poorSnap.employed + poorSnap.unemployed;
  
  const richEmploymentRate = richTotal > 0 ? (richSnap.employed / richTotal * 100) : 0;
  const poorEmploymentRate = poorTotal > 0 ? (poorSnap.employed / poorTotal * 100) : 0;
  
  console.log(`Employment Status:`);
  console.log(`  RICH: ${richSnap.employed}/${richTotal} employed (${richEmploymentRate.toFixed(1)}%)`);
  console.log(`  POOR: ${poorSnap.employed}/${poorTotal} employed (${poorEmploymentRate.toFixed(1)}%)`);
  console.log(`  📊 GAP: ${(poorEmploymentRate - richEmploymentRate).toFixed(1)}% more poor still working`);
  
  const richAvgIncome = mean(richSnap.income);
  const poorAvgIncome = mean(poorSnap.income);
  
  console.log(`\nAverage Income:`);
  console.log(`  RICH: ${richAvgIncome.toFixed(1)}`);
  console.log(`  POOR: ${poorAvgIncome.toFixed(1)}`);
  console.log(`  📊 ${poorAvgIncome > richAvgIncome ? 'INVERSION' : 'Normal'}: ${poorAvgIncome > richAvgIncome ? 'Poor earn MORE' : 'Rich earn more'} (${((poorAvgIncome - richAvgIncome) / richAvgIncome * 100).toFixed(1)}% difference)`);
  
  const richAvgResources = mean(richSnap.resources);
  const poorAvgResources = mean(poorSnap.resources);
  
  console.log(`\nAccumulated Resources (Wealth):`);
  console.log(`  RICH: ${richAvgResources.toFixed(1)}`);
  console.log(`  POOR: ${poorAvgResources.toFixed(1)}`);
  console.log(`  📊 Rich have ${((richAvgResources - poorAvgResources) / poorAvgResources * 100).toFixed(1)}% more wealth`);
}

console.log('\n' + '='.repeat(80));
console.log('KEY FINDINGS');
console.log('='.repeat(80));

const age60RichEmployed = (richResults.snapshots[60].employed / (richResults.snapshots[60].employed + richResults.snapshots[60].unemployed) * 100);
const age60PoorEmployed = (poorResults.snapshots[60].employed / (poorResults.snapshots[60].employed + poorResults.snapshots[60].unemployed) * 100);

if (age60PoorEmployed > age60RichEmployed + 5) {
  console.log(`\n✅ HYPOTHESIS CONFIRMED: At age 60, ${(age60PoorEmployed - age60RichEmployed).toFixed(1)}% more poor still working`);
  console.log(`   Rich can afford to retire early, poor must work longer for income`);
} else {
  console.log(`\n❌ HYPOTHESIS REJECTED: Employment rates similar at age 60`);
}

const age80RichIncome = mean(richResults.snapshots[80].income);
const age80PoorIncome = mean(poorResults.snapshots[80].income);

if (age80PoorIncome > age80RichIncome) {
  console.log(`\n⚠️ INCOME INVERSION AT AGE 80: Poor earn ${((age80PoorIncome / age80RichIncome - 1) * 100).toFixed(1)}% MORE`);
  console.log(`   This suggests Nordic unemployment benefits might be providing income to poor non-workers`);
  console.log(`   while rich retirees show $0 income (living off accumulated wealth)`);
} else {
  console.log(`\n✅ INCOME NORMAL AT AGE 80: Rich earn more as expected`);
}

const age80RichWealth = mean(richResults.snapshots[80].resources);
const age80PoorWealth = mean(poorResults.snapshots[80].resources);

console.log(`\n📊 WEALTH GAP PERSISTS: Despite income inversion, rich have ${((age80RichWealth / age80PoorWealth - 1) * 100).toFixed(1)}% more accumulated wealth`);
console.log(`   Income ≠ Wealth. Rich living off savings, poor relying on benefits/work.`);

console.log('\n' + '='.repeat(80));
console.log('\nRECOMMENDATION:');
console.log('  Add retirement/pension system to track:');
console.log('  - Employment income (wages)');
console.log('  - Pension income (from accumulated wealth)');  
console.log('  - Benefit income (unemployment/welfare)');
console.log('  This will show true income sources and fix the inversion artifact.');
console.log('='.repeat(80) + '\n');

// Export
fs.writeFileSync('late_life_income_analysis.json', JSON.stringify({
  rich: richResults,
  poor: poorResults,
  timestamp: new Date().toISOString()
}, null, 2));

console.log('📊 Full data exported to late_life_income_analysis.json\n');
