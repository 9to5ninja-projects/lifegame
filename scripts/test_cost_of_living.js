const {
  calculateHouseholdCost,
  calculateHouseholdIncome,
  calculateHouseholdCashFlow,
  getPovertyStatus,
} = require('../cost_of_living.js');

console.log('=== COST OF LIVING TEST ===\n');

// Test 1: Single adult employed
console.log('Test 1: Single adult, age 30, employed, Nordic');
const household1 = [{ age: 30, employed: true, isRetired: false }];
const cost1 = calculateHouseholdCost(household1, 'Nordic');
const income1 = calculateHouseholdIncome(household1, 'Nordic');
const flow1 = calculateHouseholdCashFlow(household1, 'Nordic');
console.log(`  Cost: ${cost1.toFixed(2)}`);
console.log(`  Income: ${income1.toFixed(2)}`);
console.log(`  Cash flow: ${flow1.toFixed(2)}`);
console.log(`  Status: ${getPovertyStatus(flow1 > 0 ? 36 : 0, cost1, 'Nordic').category}\n`);

// Test 2: Single adult unemployed
console.log('Test 2: Single adult, age 30, unemployed, Nordic');
const household2 = [{ age: 30, employed: false, isRetired: false }];
const cost2 = calculateHouseholdCost(household2, 'Nordic');
const income2 = calculateHouseholdIncome(household2, 'Nordic');
const flow2 = calculateHouseholdCashFlow(household2, 'Nordic');
console.log(`  Cost: ${cost2.toFixed(2)}`);
console.log(`  Income (unemployment benefit): ${income2.toFixed(2)}`);
console.log(`  Cash flow: ${flow2.toFixed(2)}`);
console.log(`  Status: Unemployed, can't sustain\n`);

// Test 3: Family: 2 adults (1 employed) + 2 children
console.log('Test 3: Family - 2 adults (1 employed) + 2 children, Nordic');
const household3 = [
  { age: 32, employed: true, isRetired: false },
  { age: 30, employed: false, isRetired: false },
  { age: 5, employed: false, isRetired: false },
  { age: 3, employed: false, isRetired: false },
];
const cost3 = calculateHouseholdCost(household3, 'Nordic');
const income3 = calculateHouseholdIncome(household3, 'Nordic');
const flow3 = calculateHouseholdCashFlow(household3, 'Nordic');
console.log(`  Cost: ${cost3.toFixed(2)}`);
console.log(`  Income: ${income3.toFixed(2)} (1 worker + child benefits)`);
console.log(`  Cash flow: ${flow3.toFixed(2)}`);
const status3 = getPovertyStatus(flow3 * 6, cost3, 'Nordic'); // Assume 6 months savings
console.log(`  6-month savings status: ${status3.category}\n`);

// Test 4: Compare regions - same family, different region
console.log('Test 4: Same family in different regions (2 adults, 2 children, 1 employed)');
const testHousehold = [
  { age: 32, employed: true, isRetired: false },
  { age: 30, employed: false, isRetired: false },
  { age: 5, employed: false, isRetired: false },
  { age: 3, employed: false, isRetired: false },
];

const regions = ['Nordic', 'Developed', 'Emerging', 'Developing', 'Fragile'];
for (const region of regions) {
  const cost = calculateHouseholdCost(testHousehold, region);
  const income = calculateHouseholdIncome(testHousehold, region);
  const flow = calculateHouseholdCashFlow(testHousehold, region);
  const ratio = flow / cost;
  console.log(
    `  ${region.padEnd(12)}: Cost ${cost.toFixed(2)}, Income ${income.toFixed(2)}, Ratio ${ratio.toFixed(2)}`
  );
}
console.log();

// Test 5: Impact of family size
console.log('Test 5: Impact of family size (adults only, all employed, Nordic)');
for (let size = 1; size <= 6; size++) {
  const household = Array(size).fill(null).map(() => ({ age: 30, employed: true, isRetired: false }));
  const cost = calculateHouseholdCost(household, 'Nordic');
  const income = calculateHouseholdIncome(household, 'Nordic');
  const perPersonCost = cost / size;
  const perPersonIncome = income / size;
  console.log(
    `  ${size} people: Cost ${cost.toFixed(2)} (${perPersonCost.toFixed(2)}/person), Income ${income.toFixed(2)} (${perPersonIncome.toFixed(2)}/person)`
  );
}
console.log();

// Test 6: Elderly with pension
console.log('Test 6: Elderly couple with pensions, Nordic');
const household6 = [
  { age: 70, isRetired: true, employed: false },
  { age: 68, isRetired: true, employed: false },
];
const cost6 = calculateHouseholdCost(household6, 'Nordic');
const income6 = calculateHouseholdIncome(household6, 'Nordic');
const flow6 = calculateHouseholdCashFlow(household6, 'Nordic');
console.log(`  Cost: ${cost6.toFixed(2)}`);
console.log(`  Income (2 pensions): ${income6.toFixed(2)}`);
console.log(`  Cash flow: ${flow6.toFixed(2)}`);
console.log(`  Status: ${getPovertyStatus(flow6 > 0 ? 24 : 0, cost6, 'Nordic').category}\n`);

// Test 7: Compare Nordic vs Fragile - same scenarios
console.log('Test 7: Nordic vs Fragile - young unemployed mother with child');
const mother = [
  { age: 22, employed: false, isRetired: false },
  { age: 2, employed: false, isRetired: false },
];

console.log('  Nordic:');
const nordicCost = calculateHouseholdCost(mother, 'Nordic');
const nordicIncome = calculateHouseholdIncome(mother, 'Nordic');
const nordicFlow = calculateHouseholdCashFlow(mother, 'Nordic');
console.log(`    Cost: ${nordicCost.toFixed(2)}, Income: ${nordicIncome.toFixed(2)}, Flow: ${nordicFlow.toFixed(2)}`);

console.log('  Fragile:');
const fragileCost = calculateHouseholdCost(mother, 'Fragile');
const fragileIncome = calculateHouseholdIncome(mother, 'Fragile');
const fragileFlow = calculateHouseholdCashFlow(mother, 'Fragile');
console.log(`    Cost: ${fragileCost.toFixed(2)}, Income: ${fragileIncome.toFixed(2)}, Flow: ${fragileFlow.toFixed(2)}`);
console.log(`  Nordic mother gets: ${nordicIncome.toFixed(2)} for ${nordicCost.toFixed(2)} cost`);
console.log(`  Fragile mother gets: ${fragileIncome.toFixed(2)} for ${fragileCost.toFixed(2)} cost`);
