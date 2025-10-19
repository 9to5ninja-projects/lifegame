const {
  EDUCATION_COSTS_BY_REGION,
  ATTENDANCE_RATES,
  COMPLETION_RATES,
  EMPLOYMENT_TIER_BY_EDUCATION,
  getEducationStage,
  getEducationCost,
  shouldAttendEducation,
  getEmploymentTierFromEducation,
  getStressFromIncome,
} = require('../education_system.js');

console.log('=== EDUCATION SYSTEM TEST ===\n');

// Test 1: Education costs by region
console.log('Education costs per year by region and stage:\n');
const regions = ['Nordic', 'Developed', 'Emerging', 'Developing', 'Fragile'];
const stages = ['preschool', 'primary', 'secondary', 'tertiary'];

for (const stage of stages) {
  process.stdout.write(`${stage.padEnd(12)}: `);
  for (const region of regions) {
    const cost = getEducationCost(12, stage, region);
    process.stdout.write(`${region.padEnd(12)} ${cost.toFixed(3).padStart(6)}  `);
  }
  console.log();
}

console.log('\n=== ATTENDANCE & COMPLETION RATES ===\n');

// Test 2: Attendance by region (% who attend each stage)
for (const stage of stages) {
  console.log(`\n${stage.toUpperCase()}:`);
  for (const region of regions) {
    const attend = (ATTENDANCE_RATES[region][stage] * 100).toFixed(1);
    const complete = (COMPLETION_RATES[region][stage] * 100).toFixed(1);
    console.log(
      `  ${region.padEnd(12)}: ${attend.padStart(5)}% attend, ${complete.padStart(5)}% complete`
    );
  }
}

console.log('\n=== EMPLOYMENT TIER OUTCOMES ===\n');

// Test 3: Education → Employment tier
const educationLevels = [
  'none',
  'primary',
  'secondary',
  'secondary_vocational',
  'tertiary_technical',
  'tertiary_bachelor',
  'tertiary_advanced',
];

console.log('Education level → Employment tier & wage range:\n');
for (const eduLevel of educationLevels) {
  const tier = getEmploymentTierFromEducation(eduLevel);
  const wageRange = `${tier.minWage.toFixed(2)}-${tier.maxWage.toFixed(2)}`;
  console.log(`  ${eduLevel.padEnd(22)}: Tier ${tier.tier}, Wage ${wageRange.padStart(9)}`);
}

console.log('\n=== STRESS-INCOME RATIO ===\n');

// Test 4: Income/expense ratio stress curve
const ratios = [0.25, 0.5, 0.75, 1.0, 1.2, 1.5, 2.0, 3.0, 5.0];
console.log('Income/Cost ratio → Stress multiplier:\n');
for (const ratio of ratios) {
  const stress = getStressFromIncome(ratio * 100, 100); // Income, costs
  const status =
    ratio < 0.5
      ? 'Destitute'
      : ratio < 0.8
        ? 'Struggling'
        : ratio < 1.0
          ? 'Tight'
          : ratio < 1.2
            ? 'OK'
            : ratio < 1.5
              ? 'Comfortable'
              : ratio < 2.0
                ? 'Secure'
                : 'Wealthy';
  console.log(
    `  Ratio ${(ratio * 1).toFixed(2).padStart(4)}: Stress ${stress.toFixed(2).padStart(4)} (${status.padEnd(12)})`
  );
}

console.log('\n=== EDUCATION PATH SIMULATION ===\n');

// Test 5: Model a child's path through education system
console.log('Simulated education paths by region:\n');

const familyResources = 20; // Middle-class family

for (const region of regions) {
  console.log(`\n${region}:`);

  let completedStages = [];
  let totalCost = 0;

  for (const age of [5, 8, 12, 15, 18, 20]) {
    const stage = getEducationStage(age);

    if (stage === 'none') continue;

    const decision = shouldAttendEducation(age, region, familyResources, '');

    if (decision.shouldAttend) {
      const cost = decision.cost;
      totalCost += cost;
      completedStages.push(stage);

      const completion = Math.random() < COMPLETION_RATES[region][stage];
      const status = completion ? '✓ COMPLETED' : '✗ DROPPED OUT';

      console.log(
        `  Age ${age}: ${stage.padEnd(10)} - Cost: ${cost.toFixed(2)}, ${status}`
      );

      if (!completion) break; // Dropout, stops education
    } else {
      console.log(`  Age ${age}: ${stage.padEnd(10)} - NOT ATTENDED (not affordable/not typical)`);
    }
  }

  console.log(`  Total education cost: ${totalCost.toFixed(2)}`);
  console.log(`  Final education: ${completedStages[completedStages.length - 1] || 'none'}`);
}

console.log('\n=== LIFETIME EARNINGS POTENTIAL ===\n');

// Test 6: Earnings potential by education
console.log('Expected lifetime earnings by education (Nordic region):\n');

const regionWages = {
  Nordic: { base: 2.0, lifespan: 45 }, // Years 20-65
  Fragile: { base: 0.08, lifespan: 30 }, // Shorter working life
};

for (const eduLevel of ['secondary', 'tertiary_bachelor', 'tertiary_advanced']) {
  const tier = getEmploymentTierFromEducation(eduLevel);
  const nordicWage = tier.maxWage; // Use top of range
  const fragileWage = tier.minWage * 0.5; // Much lower

  const nordicLifetime = nordicWage * regionWages.Nordic.lifespan;
  const fragileLifetime = fragileWage * regionWages.Fragile.lifespan;

  console.log(
    `${eduLevel.padEnd(22)}: Nordic ${nordicLifetime.toFixed(1).padStart(6)}, Fragile ${fragileLifetime.toFixed(1).padStart(6)}`
  );
}

console.log('\n=== EDUCATION AS STRESS BUFFER ===\n');

// Test 7: How education changes stress outcomes
console.log('Same income, different education context:\n');

const income = 1.5;
const costs = 1.0;

console.log(`Income/Costs ratio: ${income / costs} (comfortable)\n`);
console.log(`Direct stress from income: ${getStressFromIncome(income, costs).toFixed(2)}`);
console.log('But:');
console.log('- Education provides structure & purpose (+social connection)');
console.log('- Employment prospects improve with education');
console.log('- Reduces future stress about job security');
console.log('- Model: education adjusts baseline stress down by +2 points');
