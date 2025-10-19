// Test: Simulate suicide rolls to understand probability
console.log("=== SUICIDE ROLL SIMULATION ===\n");

const NUM_TRIALS = 100000;
const thresholds = [0.000126, 0.000227, 0.004198, 0.004741];  // Various thresholds

console.log(`Simulating ${NUM_TRIALS} suicide rolls...\n`);

for (const threshold of thresholds) {
  let successes = 0;
  let rolls = [];
  
  for (let i = 0; i < NUM_TRIALS; i++) {
    const roll = Math.random();
    if (roll < threshold) {
      successes++;
      if (rolls.length < 10) rolls.push(roll);
    }
  }
  
  const expected = NUM_TRIALS * threshold;
  console.log(`Threshold: ${threshold.toFixed(6)}`);
  console.log(`  Expected successes: ~${expected.toFixed(1)}`);
  console.log(`  Actual successes: ${successes}`);
  console.log(`  Rate: 1 in ${(NUM_TRIALS / successes).toFixed(0)}`);
  if (rolls.length > 0) {
    console.log(`  Example successful rolls: ${rolls.map(r => r.toFixed(6)).join(', ')}`);
  }
  console.log();
}
