const { getGlobalBaseline, getAdjustedProbability, AGE_BRACKETS } = require('../global_statistics_v2.js');

console.log('=== GLOBAL STATISTICS V2: SIMPLIFIED 4-BRACKET SYSTEM ===\n');

console.log('Age Brackets:');
Object.values(AGE_BRACKETS).forEach(bracket => {
  console.log(`  ${bracket.name}: ages ${bracket.min}-${bracket.max}`);
});

console.log('\n=== SUICIDE RATES BY AGE/GENDER ===\n');

const causes = ['suicide', 'homicide', 'trafficAccident', 'overdose', 'heartDisease'];
const regions = ['Nordic', 'Developed', 'Emerging', 'Developing', 'Fragile'];

console.log('SUICIDE RATES (Global baseline + Regional multiplier):\n');

const testAges = { childhood: 3, youth: 15, adult: 40, elderly: 75 };

Object.entries(testAges).forEach(([stage, age]) => {
  console.log(`${stage.toUpperCase()} (age ${age}):`);
  
  // Male
  const maleSuicide = getGlobalBaseline('suicide', age, 'male');
  console.log(`  Male baseline: ${maleSuicide.toFixed(4)}% (${(maleSuicide * 1000).toFixed(0)}/100K)`);
  
  regions.forEach(region => {
    const adjusted = getAdjustedProbability('suicide', age, 'male', region);
    console.log(`    ${region.padEnd(12)}: ${adjusted.toFixed(4)}% (${(adjusted * 1000).toFixed(0)}/100K)`);
  });
  
  // Female
  const femaleSuicide = getGlobalBaseline('suicide', age, 'female');
  console.log(`  Female baseline: ${femaleSuicide.toFixed(4)}% (${(femaleSuicide * 1000).toFixed(0)}/100K)`);
  
  regions.forEach(region => {
    const adjusted = getAdjustedProbability('suicide', age, 'female', region);
    console.log(`    ${region.padEnd(12)}: ${adjusted.toFixed(4)}% (${(adjusted * 1000).toFixed(0)}/100K)`);
  });
  
  console.log();
});

console.log('\n=== MAJOR CAUSES BY LIFE STAGE (Nordic Region) ===\n');

['suicide', 'homicide', 'trafficAccident', 'overdose', 'heartDisease', 'cancer'].forEach(cause => {
  console.log(`${cause.padEnd(20)}:`);
  
  Object.entries(testAges).forEach(([stage, age]) => {
    const rate = getAdjustedProbability(cause, age, 'male', 'Nordic');
    if (rate > 0.001) {
      console.log(`  ${stage.padEnd(12)}: ${rate.toFixed(4)}% (${(rate * 1000).toFixed(0)}/100K)`);
    }
  });
  
  console.log();
});
