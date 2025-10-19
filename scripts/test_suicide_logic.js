// Test the suicide roll logic to understand what's happening

const suicideRisk = 0.08; // This represents 0.08%

console.log('Testing suicide roll logic:\n');
console.log(`Suicide risk: ${suicideRisk}%\n`);

// Current logic in code
console.log('Current Logic (likely buggy):');
console.log('suicideRoll = Math.random() * 100  (generates 0-100)');
console.log(`Check: if (suicideRoll < ${suicideRisk})`);
console.log(`This checks if (0-100 < 0.08) - almost always FALSE\n`);

// Run 10,000 trials with current logic
let currentLogicAttempts = 0;
for (let i = 0; i < 10000; i++) {
  const suicideRoll = Math.random() * 100;
  if (suicideRoll < suicideRisk) {
    currentLogicAttempts++;
  }
}
console.log(`10K trials with current logic: ${currentLogicAttempts} attempts (${(currentLogicAttempts/100).toFixed(2)}/100K)`);

// What SHOULD happen
console.log('\n\nCorrect Logic Option 1 (percent-to-decimal):');
console.log(`suicideRoll = Math.random() * 100  (0-100)`);
console.log(`Check: if (suicideRoll < ${suicideRisk * 100})`);
console.log(`This checks if (0-100 < 8) - approximately 8% chance\n`);

let correctLogic1Attempts = 0;
for (let i = 0; i < 10000; i++) {
  const suicideRoll = Math.random() * 100;
  if (suicideRoll < suicideRisk * 100) {  // Convert 0.08 to 8
    correctLogic1Attempts++;
  }
}
console.log(`10K trials with corrected logic: ${correctLogic1Attempts} attempts (${(correctLogic1Attempts/100).toFixed(2)}/100K)`);

// Better logic
console.log('\n\nCorrect Logic Option 2 (use 0-1 scale):');
console.log(`suicideRoll = Math.random()  (0-1)`);
console.log(`Check: if (suicideRoll < ${suicideRisk / 100})`);
console.log(`This checks if (0-1 < 0.0008) - approximately 0.08% chance\n`);

let correctLogic2Attempts = 0;
for (let i = 0; i < 10000; i++) {
  const suicideRoll = Math.random();
  if (suicideRoll < suicideRisk / 100) {  // Convert 0.08 to 0.0008
    correctLogic2Attempts++;
  }
}
console.log(`10K trials with corrected logic: ${correctLogic2Attempts} attempts (${(correctLogic2Attempts/100).toFixed(2)}/100K)`);

// What the test might be doing
console.log('\n\nPossible Bug in Test (confusing role of suicideRisk):');
console.log('If test is treating suicideRisk as already being on 0-100 scale:');
console.log(`suicideRoll = Math.random() * 100  (0-100)`);
console.log(`suicideRisk_bad = 0.08 * some_hidden_multiplier`);

// But wait - looking at test results, 4/500 over 30 years = higher than expected
// Let me check if it's cumulative
console.log('\n\nCumulative Analysis Over 30 Years:');
const baseRisk = 0.08 / 100;  // Convert to decimal
console.log(`Base annual suicide risk: ${baseRisk} (0.08%)`);
console.log(`30-year cumulative: ${(1 - Math.pow(1 - baseRisk, 30)).toFixed(6)} (${((1 - Math.pow(1 - baseRisk, 30)) * 100000).toFixed(1)}/100K)`);

// Maybe the test logic is treating suicideRisk differently?
console.log('\n\nBut test is checking: if (suicideRoll < suicideRisk)');
console.log('where suicideRoll = 0-100 and suicideRisk = 0.08');
console.log('So this should almost never fire...');
console.log('\nWait, maybe calculateSuicideRisk() is returning a different value?');
console.log('Or maybe suicideRisk is being stored in a different scale internally?');
