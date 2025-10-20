const { getGlobalBaseline, getAdjustedProbability } = require('./global_statistics_v2.js');

console.log('=== SUICIDE BASELINE TEST ===\n');

// Test Nordic male youth
const youthBaseline = getGlobalBaseline('suicide', 16, 'male');
console.log(`Global baseline (male, age 16): ${youthBaseline}`);
console.log(`  = 18 per 100K = 0.00018`);
console.log(`  Actual: ${youthBaseline}\n`);

// Test with regional multiplier
const youthAdjusted = getAdjustedProbability('suicide', 16, 'male', 'Nordic');
console.log(`With Nordic multiplier (0.7):`);
console.log(`  Expected: 0.00018 * 0.7 = 0.000126`);
console.log(`  Actual: ${youthAdjusted}\n`);

// Convert to percentage
const asPercentage = youthAdjusted * 100;
console.log(`As percentage: ${asPercentage}%`);

// Threshold for suicide check
const threshold = asPercentage / 100;
console.log(`Suicide threshold for roll: ${threshold}`);
console.log(`Random roll needs to be < ${threshold} (${(threshold * 1000000).toFixed(0)}/1M chance)\n`);

// Test if this makes sense
const suicidesPerYear = 100000 * threshold;
console.log(`Expected suicides per 100K person-years: ${suicidesPerYear.toFixed(1)}`);
console.log(`(But this is BEFORE applying any multipliers!)\n`);

// Now test adult male
const adultBaseline = getGlobalBaseline('suicide', 35, 'male');
const adultAdjusted = getAdjustedProbability('suicide', 35, 'male', 'Nordic');

console.log(`ADULT (age 35, male, Nordic):`);
console.log(`  Baseline: ${adultBaseline}`);
console.log(`  Adjusted: ${adultAdjusted}`);
console.log(`  As %: ${adultAdjusted * 100}%`);
console.log(`  Threshold: ${(adultAdjusted * 100) / 100}`);
