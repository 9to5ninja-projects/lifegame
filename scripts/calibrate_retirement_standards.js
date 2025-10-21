/**
 * Retirement Standard Calibration
 * 
 * ISSUE: 51-57% of Nordic retirees classified as "poverty" standard
 * This is unrealistic - Nordic welfare states should prevent most poverty
 * 
 * Investigation:
 * 1. What are actual retirement incomes vs living costs?
 * 2. Are wealth thresholds too high?
 * 3. Is pension calculation correct?
 * 4. Should we adjust classification thresholds?
 */

const MortalityGameV2 = require('../game_engine_v2_homeostatic.js');
const { RETIREMENT_LIVING_COSTS } = require('../retirement_system.js');
const fs = require('fs');

const birthCards = JSON.parse(fs.readFileSync('../data/birth_cards_json.json', 'utf8'));
const familyCards = JSON.parse(fs.readFileSync('../data/family_cards_json.json', 'utf8'));
const eventCardsChildhood = JSON.parse(fs.readFileSync('../data/event_cards_childhood.json', 'utf8'));
const eventCardsTeen = JSON.parse(fs.readFileSync('../data/event_cards_teen.json', 'utf8'));
const eventCardsAdult = JSON.parse(fs.readFileSync('../data/event_cards_adult.json', 'utf8'));
const deathCards = JSON.parse(fs.readFileSync('../data/death_cards_json.json', 'utf8'));

const allEventCards = [...eventCardsChildhood, ...eventCardsTeen, ...eventCardsAdult];

console.log('='.repeat(80));
console.log('RETIREMENT STANDARD CALIBRATION');
console.log('='.repeat(80));

function analyzeRetirementStandards(sampleSize) {
  const nordicBirth = birthCards.find(c => c.name.includes('Nordic'));
  const results = {
    age70Retirees: [],
    incomeDistribution: [],
    wealthDistribution: [],
    standardByIncome: {
      comfortable: 0,
      adequate: 0,
      struggling: 0,
      poverty: 0
    }
  };
  
  const livingCosts = RETIREMENT_LIVING_COSTS.Nordic;
  
  for (let i = 0; i < sampleSize; i++) {
    const familyCard = familyCards[Math.floor(Math.random() * familyCards.length)];
    const sex = Math.random() > 0.5 ? 'male' : 'female';
    
    const engine = new MortalityGameV2(birthCards, familyCards, allEventCards, deathCards);
    engine.disableDeathTracing();
    engine.createPlayer(nordicBirth, familyCard, { sex });
    
    const player = engine.player;
    
    while (player.alive && player.demographics.age < 120) {
      const age = player.demographics.age;
      
      if (age === 70) {
        const isRetired = player.economics?.retirement?.isRetired || false;
        
        if (isRetired) {
          const data = {
            totalIncome: player.economics?.income?.current || 0,
            employmentIncome: player.economics?.income?.employmentIncome || 0,
            pensionIncome: player.economics?.income?.pensionIncome || 0,
            benefitIncome: player.economics?.income?.benefitIncome || 0,
            wealth: player.economics?.resources?.current || 0,
            retirementStandard: player.economics?.retirement?.retirementStandard || 'unknown',
            lifetimeAvgIncome: player.economics?.retirement?.lifetimeAvgIncome || 0
          };
          
          results.age70Retirees.push(data);
          results.incomeDistribution.push(data.totalIncome);
          results.wealthDistribution.push(data.wealth);
          
          // Classify by actual income vs living costs
          if (data.totalIncome >= livingCosts.comfortable) {
            results.standardByIncome.comfortable++;
          } else if (data.totalIncome >= livingCosts.adequate) {
            results.standardByIncome.adequate++;
          } else if (data.totalIncome >= livingCosts.struggling) {
            results.standardByIncome.struggling++;
          } else {
            results.standardByIncome.poverty++;
          }
        }
      }
      
      engine.processYearEnd(player);
    }
  }
  
  return results;
}

function mean(arr) {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function median(arr) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function percentile(arr, p) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

console.log('\n🔄 Analyzing 200 Nordic lives at age 70...\n');
const results = analyzeRetirementStandards(200);

console.log('\n' + '='.repeat(80));
console.log('RETIREMENT INCOME ANALYSIS (Age 70 Retirees)');
console.log('='.repeat(80));

const avgIncome = mean(results.incomeDistribution);
const medianIncome = median(results.incomeDistribution);
const p25Income = percentile(results.incomeDistribution, 25);
const p75Income = percentile(results.incomeDistribution, 75);
const minIncome = Math.min(...results.incomeDistribution);
const maxIncome = Math.max(...results.incomeDistribution);

console.log(`\nTotal Retirement Income:`);
console.log(`  Mean: ${avgIncome.toFixed(1)}`);
console.log(`  Median: ${medianIncome.toFixed(1)}`);
console.log(`  Range: ${minIncome.toFixed(1)} - ${maxIncome.toFixed(1)}`);
console.log(`  25th percentile: ${p25Income.toFixed(1)}`);
console.log(`  75th percentile: ${p75Income.toFixed(1)}`);

const avgWealth = mean(results.wealthDistribution);
const medianWealth = median(results.wealthDistribution);

console.log(`\nAccumulated Wealth:`);
console.log(`  Mean: ${avgWealth.toFixed(1)}`);
console.log(`  Median: ${medianWealth.toFixed(1)}`);
console.log(`  Range: ${Math.min(...results.wealthDistribution).toFixed(1)} - ${Math.max(...results.wealthDistribution).toFixed(1)}`);

console.log('\n' + '='.repeat(80));
console.log('LIVING COST THRESHOLDS (Nordic)');
console.log('='.repeat(80));

const costs = RETIREMENT_LIVING_COSTS.Nordic;
console.log(`\nComfortable: ${costs.comfortable}+  (maintain good standard)`);
console.log(`Adequate:    ${costs.adequate}-${costs.comfortable}  (get by comfortably)`);
console.log(`Struggling:  ${costs.struggling}-${costs.adequate}  (tight budget)`);
console.log(`Poverty:     <${costs.struggling}  (hardship)`);

console.log('\n' + '='.repeat(80));
console.log('CLASSIFICATION BY INCOME');
console.log('='.repeat(80));

const total = results.age70Retirees.length;

console.log(`\nRetirees at Age 70: ${total}`);
console.log(`\nBy Income vs Living Costs:`);
console.log(`  Comfortable (≥${costs.comfortable}): ${results.standardByIncome.comfortable} (${(results.standardByIncome.comfortable/total*100).toFixed(1)}%)`);
console.log(`  Adequate (${costs.adequate}-${costs.comfortable}): ${results.standardByIncome.adequate} (${(results.standardByIncome.adequate/total*100).toFixed(1)}%)`);
console.log(`  Struggling (${costs.struggling}-${costs.adequate}): ${results.standardByIncome.struggling} (${(results.standardByIncome.struggling/total*100).toFixed(1)}%)`);
console.log(`  Poverty (<${costs.struggling}): ${results.standardByIncome.poverty} (${(results.standardByIncome.poverty/total*100).toFixed(1)}%)`);

console.log('\n' + '='.repeat(80));
console.log('INCOME SOURCE BREAKDOWN');
console.log('='.repeat(80));

const avgEmployment = mean(results.age70Retirees.map(r => r.employmentIncome));
const avgPension = mean(results.age70Retirees.map(r => r.pensionIncome));
const avgBenefit = mean(results.age70Retirees.map(r => r.benefitIncome));

console.log(`\nAverage Income Sources at Age 70:`);
console.log(`  Employment: ${avgEmployment.toFixed(1)} (${(avgEmployment/avgIncome*100).toFixed(1)}%)`);
console.log(`  Pension:    ${avgPension.toFixed(1)} (${(avgPension/avgIncome*100).toFixed(1)}%)`);
console.log(`  Benefits:   ${avgBenefit.toFixed(1)} (${(avgBenefit/avgIncome*100).toFixed(1)}%)`);
console.log(`  TOTAL:      ${avgIncome.toFixed(1)}`);

console.log('\n' + '='.repeat(80));
console.log('DIAGNOSIS & RECOMMENDATIONS');
console.log('='.repeat(80));

const povertyRate = results.standardByIncome.poverty / total * 100;
const comfortableRate = results.standardByIncome.comfortable / total * 100;

if (povertyRate > 10) {
  console.log(`\n⚠️  POVERTY RATE TOO HIGH: ${povertyRate.toFixed(1)}% in poverty (Nordic should be <10%)`);
  console.log(`\n   Median income: ${medianIncome.toFixed(1)}`);
  console.log(`   Poverty threshold: <${costs.struggling}`);
  console.log(`\n   RECOMMENDATION: Income levels are actually HIGH (median ${medianIncome.toFixed(1)})`);
  console.log(`   Problem is the classification thresholds are calibrated for different scale.`);
  console.log(`\n   PROPOSED FIX:`);
  console.log(`   - Lower poverty threshold from ${costs.struggling} to ${(medianIncome * 0.4).toFixed(0)} (40% of median)`);
  console.log(`   - Lower adequate threshold from ${costs.adequate} to ${(medianIncome * 0.7).toFixed(0)} (70% of median)`);
  console.log(`   - Lower comfortable threshold from ${costs.comfortable} to ${(medianIncome * 1.0).toFixed(0)} (100% of median)`);
} else {
  console.log(`\n✅ POVERTY RATE ACCEPTABLE: ${povertyRate.toFixed(1)}% in poverty`);
}

if (comfortableRate < 30) {
  console.log(`\n⚠️  COMFORTABLE RATE TOO LOW: Only ${comfortableRate.toFixed(1)}% comfortable`);
  console.log(`   Nordic welfare state should enable 50%+ comfortable retirement`);
}

// Show what distribution would be with adjusted thresholds
const adjustedThresholds = {
  poverty: medianIncome * 0.4,      // 40% of median
  struggling: medianIncome * 0.6,    // 60% of median
  adequate: medianIncome * 0.8,      // 80% of median
  comfortable: medianIncome * 1.0    // 100% of median (at/above median)
};

console.log(`\n\n='.repeat(80)}`);
console.log('ADJUSTED CLASSIFICATION (Proposed)');
console.log('='.repeat(80));

const adjusted = { comfortable: 0, adequate: 0, struggling: 0, poverty: 0 };

results.incomeDistribution.forEach(income => {
  if (income >= adjustedThresholds.comfortable) {
    adjusted.comfortable++;
  } else if (income >= adjustedThresholds.adequate) {
    adjusted.adequate++;
  } else if (income >= adjustedThresholds.struggling) {
    adjusted.struggling++;
  } else {
    adjusted.poverty++;
  }
});

console.log(`\nProposed Thresholds:`);
console.log(`  Poverty:     <${adjustedThresholds.poverty.toFixed(0)}`);
console.log(`  Struggling:  ${adjustedThresholds.poverty.toFixed(0)}-${adjustedThresholds.struggling.toFixed(0)}`);
console.log(`  Adequate:    ${adjustedThresholds.struggling.toFixed(0)}-${adjustedThresholds.adequate.toFixed(0)}`);
console.log(`  Comfortable: ≥${adjustedThresholds.comfortable.toFixed(0)}`);

console.log(`\nAdjusted Distribution:`);
console.log(`  Comfortable: ${adjusted.comfortable} (${(adjusted.comfortable/total*100).toFixed(1)}%)`);
console.log(`  Adequate:    ${adjusted.adequate} (${(adjusted.adequate/total*100).toFixed(1)}%)`);
console.log(`  Struggling:  ${adjusted.struggling} (${(adjusted.struggling/total*100).toFixed(1)}%)`);
console.log(`  Poverty:     ${adjusted.poverty} (${(adjusted.poverty/total*100).toFixed(1)}%)`);

console.log('\n' + '='.repeat(80) + '\n');

// Export
fs.writeFileSync('retirement_calibration.json', JSON.stringify({
  currentThresholds: costs,
  proposedThresholds: adjustedThresholds,
  currentDistribution: results.standardByIncome,
  adjustedDistribution: adjusted,
  incomeStats: {
    mean: avgIncome,
    median: medianIncome,
    p25: p25Income,
    p75: p75Income,
    min: minIncome,
    max: maxIncome
  },
  timestamp: new Date().toISOString()
}, null, 2));

console.log('📊 Full data exported to retirement_calibration.json\n');

