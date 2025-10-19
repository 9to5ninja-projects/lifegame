const { shouldBeEmployed } = require('../employment_by_region.js');

console.log('=== EMPLOYMENT RATES TEST ===\n');

// Direct test of employment function
const ages = [12, 15, 18, 22, 25, 30, 40, 50, 60, 65, 70];
const region = 'Nordic';

console.log('Employment probability by age (Nordic, Male):\n');
for (const age of ages) {
  const prob = shouldBeEmployed(age, 'M', region) ? 'yes' : 'no';
  console.log(`Age ${age.toString().padStart(2)}: ${prob}`);
}

console.log('\n=== DISTRIBUTION TEST ===\n');
console.log('100 samples per age:');

for (const age of ages) {
  let count = 0;
  for (let i = 0; i < 100; i++) {
    if (shouldBeEmployed(age, Math.random() > 0.5 ? 'M' : 'F', region)) {
      count++;
    }
  }
  const pct = ((count / 100) * 100).toFixed(1);
  console.log(`Age ${age.toString().padStart(2)}: ${pct.padStart(5)}%`);
}
