/**
 * Retirement System Test
 * 
 * Tests how retirement works for rich vs poor births:
 * - When do they retire?
 * - What's their income in retirement (employment vs pension vs benefits)?
 * - What standard of living do they maintain?
 * - Class stratification in old age
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
console.log('RETIREMENT SYSTEM TEST');
console.log('Rich vs Poor: When, How, and at What Standard?');
console.log('='.repeat(80));

function simulateRetirement(targetIncome, sampleSize, label) {
  const nordicBirth = birthCards.find(c => c.name.includes('Nordic'));
  const results = {
    label,
    lives: [],
    
    // Retirement timing
    avgRetirementAge: 0,
    retiredEarly: 0,    // Before 63
    retiredStandard: 0, // 63-67
    retiredLate: 0,     // After 67
    neverRetired: 0,
    
    // Retirement standard
    comfortable: 0,
    adequate: 0,
    struggling: 0,
    poverty: 0,
    
    // Income sources at age 70 (typical retirement)
    age70: {
      avgTotalIncome: 0,
      avgEmploymentIncome: 0,
      avgPensionIncome: 0,
      avgBenefitIncome: 0,
      avgWealth: 0,
      count: 0
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
      retirementAge: null,
      retirementStandard: null,
      age70Snapshot: null
    };
    
    while (player.alive && player.demographics.age < 120) {
      const age = player.demographics.age;
      
      // Capture retirement age
      if (player.economics?.retirement?.isRetired && !lifeData.retirementAge) {
        lifeData.retirementAge = player.economics.retirement.retirementAge;
        lifeData.retirementStandard = player.economics.retirement.retirementStandard;
      }
      
      // Snapshot at age 70 (typical retirement age)
      if (age === 70) {
        lifeData.age70Snapshot = {
          totalIncome: player.economics?.income?.current || 0,
          employmentIncome: player.economics?.income?.employmentIncome || 0,
          pensionIncome: player.economics?.income?.pensionIncome || 0,
          benefitIncome: player.economics?.income?.benefitIncome || 0,
          wealth: player.economics?.resources?.current || 0,
          isRetired: player.economics?.retirement?.isRetired || false,
          retirementStandard: player.economics?.retirement?.retirementStandard || null
        };
      }
      
      engine.processYearEnd(player);
    }
    
    // Final retirement info
    if (!lifeData.retirementAge && player.economics?.retirement?.isRetired) {
      lifeData.retirementAge = player.economics.retirement.retirementAge;
      lifeData.retirementStandard = player.economics.retirement.retirementStandard;
    }
    
    // Aggregate
    if (lifeData.retirementAge) {
      results.avgRetirementAge += lifeData.retirementAge;
      
      if (lifeData.retirementAge < 63) results.retiredEarly++;
      else if (lifeData.retirementAge <= 67) results.retiredStandard++;
      else results.retiredLate++;
      
      if (lifeData.retirementStandard === 'comfortable') results.comfortable++;
      else if (lifeData.retirementStandard === 'adequate') results.adequate++;
      else if (lifeData.retirementStandard === 'struggling') results.struggling++;
      else if (lifeData.retirementStandard === 'poverty') results.poverty++;
    } else {
      results.neverRetired++;
    }
    
    if (lifeData.age70Snapshot) {
      results.age70.avgTotalIncome += lifeData.age70Snapshot.totalIncome;
      results.age70.avgEmploymentIncome += lifeData.age70Snapshot.employmentIncome;
      results.age70.avgPensionIncome += lifeData.age70Snapshot.pensionIncome;
      results.age70.avgBenefitIncome += lifeData.age70Snapshot.benefitIncome;
      results.age70.avgWealth += lifeData.age70Snapshot.wealth;
      results.age70.count++;
    }
    
    results.lives.push(lifeData);
  }
  
  // Calculate averages
  const retiredCount = results.lives.length - results.neverRetired;
  if (retiredCount > 0) {
    results.avgRetirementAge /= retiredCount;
  }
  
  if (results.age70.count > 0) {
    results.age70.avgTotalIncome /= results.age70.count;
    results.age70.avgEmploymentIncome /= results.age70.count;
    results.age70.avgPensionIncome /= results.age70.count;
    results.age70.avgBenefitIncome /= results.age70.count;
    results.age70.avgWealth /= results.age70.count;
  }
  
  return results;
}

console.log('\n🔄 Simulating 100 RICH births...\n');
const richResults = simulateRetirement('rich', 100, 'RICH');

console.log('🔄 Simulating 100 POOR births...\n');
const poorResults = simulateRetirement('poor', 100, 'POOR');

console.log('\n' + '='.repeat(80));
console.log('RETIREMENT COMPARISON: RICH vs POOR');
console.log('='.repeat(80));

console.log('\n--- RETIREMENT TIMING ---\n');

const richRetiredPct = ((richResults.lives.length - richResults.neverRetired) / richResults.lives.length * 100);
const poorRetiredPct = ((poorResults.lives.length - poorResults.neverRetired) / poorResults.lives.length * 100);

console.log(`Ever Retired:`);
console.log(`  RICH: ${richResults.lives.length - richResults.neverRetired}/${richResults.lives.length} (${richRetiredPct.toFixed(1)}%)`);
console.log(`  POOR: ${poorResults.lives.length - poorResults.neverRetired}/${poorResults.lives.length} (${poorRetiredPct.toFixed(1)}%)`);

if (richResults.avgRetirementAge > 0 && poorResults.avgRetirementAge > 0) {
  console.log(`\nAverage Retirement Age:`);
  console.log(`  RICH: ${richResults.avgRetirementAge.toFixed(1)} years`);
  console.log(`  POOR: ${poorResults.avgRetirementAge.toFixed(1)} years`);
  console.log(`  📊 Rich retire ${(poorResults.avgRetirementAge - richResults.avgRetirementAge).toFixed(1)} years ${richResults.avgRetirementAge < poorResults.avgRetirementAge ? 'EARLIER' : 'later'}`);
}

console.log(`\nRetirement Timing Distribution:`);
console.log(`  RICH: Early (<63): ${richResults.retiredEarly}, Standard (63-67): ${richResults.retiredStandard}, Late (>67): ${richResults.retiredLate}`);
console.log(`  POOR: Early (<63): ${poorResults.retiredEarly}, Standard (63-67): ${poorResults.retiredStandard}, Late (>67): ${poorResults.retiredLate}`);

console.log('\n--- RETIREMENT STANDARD OF LIVING ---\n');

console.log(`Comfortable Retirement:`);
console.log(`  RICH: ${richResults.comfortable}/${richResults.lives.length - richResults.neverRetired} (${(richResults.comfortable/(richResults.lives.length - richResults.neverRetired)*100).toFixed(1)}%)`);
console.log(`  POOR: ${poorResults.comfortable}/${poorResults.lives.length - poorResults.neverRetired} (${(poorResults.comfortable/(poorResults.lives.length - poorResults.neverRetired)*100).toFixed(1)}%)`);

console.log(`\nAdequate Retirement:`);
console.log(`  RICH: ${richResults.adequate}/${richResults.lives.length - richResults.neverRetired} (${(richResults.adequate/(richResults.lives.length - richResults.neverRetired)*100).toFixed(1)}%)`);
console.log(`  POOR: ${poorResults.adequate}/${poorResults.lives.length - poorResults.neverRetired} (${(poorResults.adequate/(poorResults.lives.length - poorResults.neverRetired)*100).toFixed(1)}%)`);

console.log(`\nStruggling Retirement:`);
console.log(`  RICH: ${richResults.struggling}/${richResults.lives.length - richResults.neverRetired} (${(richResults.struggling/(richResults.lives.length - richResults.neverRetired)*100).toFixed(1)}%)`);
console.log(`  POOR: ${poorResults.struggling}/${poorResults.lives.length - poorResults.neverRetired} (${(poorResults.struggling/(poorResults.lives.length - poorResults.neverRetired)*100).toFixed(1)}%)`);

console.log(`\nPoverty in Retirement:`);
console.log(`  RICH: ${richResults.poverty}/${richResults.lives.length - richResults.neverRetired} (${(richResults.poverty/(richResults.lives.length - richResults.neverRetired)*100).toFixed(1)}%)`);
console.log(`  POOR: ${poorResults.poverty}/${poorResults.lives.length - poorResults.neverRetired} (${(poorResults.poverty/(poorResults.lives.length - poorResults.neverRetired)*100).toFixed(1)}%)`);

console.log('\n--- INCOME SOURCES AT AGE 70 ---\n');

console.log(`Total Income:`);
console.log(`  RICH: ${richResults.age70.avgTotalIncome.toFixed(1)}`);
console.log(`  POOR: ${poorResults.age70.avgTotalIncome.toFixed(1)}`);
console.log(`  📊 Rich have ${((richResults.age70.avgTotalIncome / poorResults.age70.avgTotalIncome - 1) * 100).toFixed(1)}% ${richResults.age70.avgTotalIncome > poorResults.age70.avgTotalIncome ? 'MORE' : 'LESS'} total income`);

console.log(`\nIncome Breakdown:`);
console.log(`  RICH:`);
console.log(`    Employment: ${richResults.age70.avgEmploymentIncome.toFixed(1)} (${(richResults.age70.avgEmploymentIncome/richResults.age70.avgTotalIncome*100).toFixed(1)}%)`);
console.log(`    Pension:    ${richResults.age70.avgPensionIncome.toFixed(1)} (${(richResults.age70.avgPensionIncome/richResults.age70.avgTotalIncome*100).toFixed(1)}%)`);
console.log(`    Benefits:   ${richResults.age70.avgBenefitIncome.toFixed(1)} (${(richResults.age70.avgBenefitIncome/richResults.age70.avgTotalIncome*100).toFixed(1)}%)`);

console.log(`  POOR:`);
console.log(`    Employment: ${poorResults.age70.avgEmploymentIncome.toFixed(1)} (${(poorResults.age70.avgEmploymentIncome/poorResults.age70.avgTotalIncome*100).toFixed(1)}%)`);
console.log(`    Pension:    ${poorResults.age70.avgPensionIncome.toFixed(1)} (${(poorResults.age70.avgPensionIncome/poorResults.age70.avgTotalIncome*100).toFixed(1)}%)`);
console.log(`    Benefits:   ${poorResults.age70.avgBenefitIncome.toFixed(1)} (${(poorResults.age70.avgBenefitIncome/poorResults.age70.avgTotalIncome*100).toFixed(1)}%)`);

console.log(`\nAccumulated Wealth:`);
console.log(`  RICH: ${richResults.age70.avgWealth.toFixed(1)}`);
console.log(`  POOR: ${poorResults.age70.avgWealth.toFixed(1)}`);
console.log(`  📊 Rich have ${((richResults.age70.avgWealth / poorResults.age70.avgWealth - 1) * 100).toFixed(1)}% more accumulated wealth`);

console.log('\n' + '='.repeat(80));
console.log('KEY FINDINGS');
console.log('='.repeat(80));

const earlyRetireGap = richResults.retiredEarly - poorResults.retiredEarly;
if (earlyRetireGap > 10) {
  console.log(`\n✅ CLASS STRATIFICATION: ${earlyRetireGap} more rich retire early (wealth enables choice)`);
}

const comfortableGap = (richResults.comfortable/(richResults.lives.length - richResults.neverRetired) - poorResults.comfortable/(poorResults.lives.length - poorResults.neverRetired)) * 100;
if (comfortableGap > 20) {
  console.log(`✅ RETIREMENT QUALITY GAP: ${comfortableGap.toFixed(1)}% more rich have comfortable retirement`);
}

const pensionGap = richResults.age70.avgPensionIncome - poorResults.age70.avgPensionIncome;
if (pensionGap > 5) {
  console.log(`✅ PENSION INEQUALITY: Rich get ${pensionGap.toFixed(1)} more pension income (accumulated wealth + lifetime earnings)`);
}

const benefitGap = poorResults.age70.avgBenefitIncome - richResults.age70.avgBenefitIncome;
if (benefitGap > 3) {
  console.log(`✅ WELFARE DEPENDENCY: Poor rely ${benefitGap.toFixed(1)} more on benefits (Nordic safety net)`);
}

console.log('\n' + '='.repeat(80) + '\n');

// Export
fs.writeFileSync('retirement_analysis.json', JSON.stringify({
  rich: richResults,
  poor: poorResults,
  timestamp: new Date().toISOString()
}, null, 2));

console.log('📊 Full data exported to retirement_analysis.json\n');
