const {
  FERTILITY_BY_AGE_REGION,
  CONTRACEPTION_BY_REGION,
  CHILD_SURVIVAL_RATES,
  getFertilityProbability,
  generatePregnancyComplications,
  childSurvivesMonth,
  getChildDeathCause,
} = require('../fertility_system.js');

console.log('=== FERTILITY SYSTEM TEST ===\n');

// Test 1: Fertility rates by region
console.log('Fertility rates (% chance of conception per year, with typical contraception use):\n');
const ages = [18, 25, 30, 35, 40];
const regions = ['Nordic', 'Developed', 'Emerging', 'Developing', 'Fragile'];

for (const age of ages) {
  process.stdout.write(`Age ${age}: `);
  for (const region of regions) {
    const fert = (getFertilityProbability(age, region, true) * 100).toFixed(1);
    process.stdout.write(`${region.padEnd(12)} ${fert.padStart(5)}%  `);
  }
  console.log();
}

// Test 2: Total fertility rate calculation
console.log('\n=== TOTAL FERTILITY RATE (children per woman lifetime) ===\n');
for (const region of regions) {
  let tfr = 0;
  for (let age = 15; age < 50; age++) {
    const fert = getFertilityProbability(age, region, true);
    tfr += fert; // Sum probability over reproductive years
  }
  console.log(`${region.padEnd(12)}: ${tfr.toFixed(2)} children per woman`);
}

// Test 3: Pregnancy complications
console.log('\n=== PREGNANCY COMPLICATIONS ===\n');
for (const region of regions) {
  let complicationsCount = 0;
  const sampleSize = 1000;
  
  for (let i = 0; i < sampleSize; i++) {
    const result = generatePregnancyComplications(region);
    if (result.hasComplications) complicationsCount++;
  }
  
  const rate = ((complicationsCount / sampleSize) * 100).toFixed(1);
  console.log(`${region.padEnd(12)}: ${rate.padStart(5)}% pregnancies have complications`);
}

// Test 4: Infant survival
console.log('\n=== INFANT MORTALITY & CHILD SURVIVAL ===\n');
for (const region of regions) {
  const rates = CHILD_SURVIVAL_RATES[region];
  const infantMort = (1 - rates.first1Year) * 1000;
  const childMort = (1 - rates.first5Years) * 1000;
  
  console.log(`${region.padEnd(12)}: Infant mortality ${infantMort.toFixed(1)}/1000, Under-5 mortality ${childMort.toFixed(1)}/1000`);
}

// Test 5: Child death causes
console.log('\n=== TOP CAUSES OF CHILD DEATH ===\n');
console.log('Nordic (age 1-12 months):');
{
  const causes = {};
  for (let i = 0; i < 10000; i++) {
    const cause = getChildDeathCause(6, 'Nordic'); // Age 6 months
    causes[cause] = (causes[cause] || 0) + 1;
  }
  
  const sorted = Object.entries(causes)
    .map(([cause, count]) => [cause, ((count / 10000) * 100).toFixed(1)])
    .sort((a, b) => b[1] - a[1]);
  
  for (const [cause, pct] of sorted) {
    console.log(`  ${cause.padEnd(15)}: ${pct.padStart(5)}%`);
  }
}

console.log('\nFragile (age 1-12 months):');
{
  const causes = {};
  for (let i = 0; i < 10000; i++) {
    const cause = getChildDeathCause(6, 'Fragile');
    causes[cause] = (causes[cause] || 0) + 1;
  }
  
  const sorted = Object.entries(causes)
    .map(([cause, count]) => [cause, ((count / 10000) * 100).toFixed(1)])
    .sort((a, b) => b[1] - a[1]);
  
  for (const [cause, pct] of sorted) {
    console.log(`  ${cause.padEnd(15)}: ${pct.padStart(5)}%`);
  }
}

console.log('\n=== CONTRACEPTIVE EFFECTIVENESS ===\n');
for (const region of regions) {
  const contra = CONTRACEPTION_BY_REGION[region];
  const usage = (contra.usage * 100).toFixed(0);
  const effectiveness = (contra.effectiveness * 100).toFixed(0);
  console.log(`${region.padEnd(12)}: ${usage.padStart(3)}% usage, ${effectiveness.padStart(3)}% effective when used`);
}
