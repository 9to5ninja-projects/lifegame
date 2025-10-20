/**
 * DEATH TRACE ANOMALY DETECTOR
 * 
 * Runs traces and automatically flags suspicious patterns that might indicate
 * broken systems (e.g., if someone dies at age 8 from "old age", that's clearly wrong).
 */

const fs = require('fs');
const path = require('path');
const MortalityGameV2 = require(path.join(__dirname, '../game_engine_v2_homeostatic.js'));
const DeathTracer = require(path.join(__dirname, '../death_trace_system.js'));

// Load game data
const birthCards = JSON.parse(fs.readFileSync(path.join(__dirname, '../birth_cards_json.json'), 'utf8'));
const familyCards = JSON.parse(fs.readFileSync(path.join(__dirname, '../family_cards_json.json'), 'utf8'));
const eventCards = {
  childhood: JSON.parse(fs.readFileSync(path.join(__dirname, '../event_cards_childhood.json'), 'utf8')),
  teen: JSON.parse(fs.readFileSync(path.join(__dirname, '../event_cards_teen.json'), 'utf8')),
  adult: JSON.parse(fs.readFileSync(path.join(__dirname, '../event_cards_adult.json'), 'utf8')),
};
const deathCards = JSON.parse(fs.readFileSync(path.join(__dirname, '../death_cards_json.json'), 'utf8'));

// Configuration
const NUM_LIVES = 50;
const ANOMALY_REPORT = './anomaly_report.txt';

// Track anomalies
const anomalies = {
  unexpectedDeathAges: [],
  tooManyMentalHealthCrises: [],
  noEmploymentByAge30: [],
  chronic0yearsOld: [],
  multipleChronicConditions: [],
  extremeDebtYoung: [],
  longTermHomelessnessYoung: [],
  inconsistentStates: [],
};

console.log(`Running ${NUM_LIVES} lives with anomaly detection...\n`);

for (let i = 0; i < NUM_LIVES; i++) {
  const birthCard = birthCards.find(b => b.name === 'Nordic Country') || birthCards[0];
  const engine = new MortalityGameV2(birthCards, familyCards, eventCards, deathCards, null);
  // Disable tracing for speed
  engine.disableDeathTracing();
  
  engine.createPlayer(birthCard, familyCards[0], {
    sex: Math.random() > 0.5 ? 'male' : 'female'
  });
  
  const player = engine.player;
  let age = 0;
  
  while (player.alive && age < 150) {
    age++;
    player.demographics.age = age;
    engine.processYearEnd(player);
    
    if (!player.alive) {
      break;
    }
  }
  
  // ============================================================================
  // ANOMALY DETECTION (no tracing needed - direct state checks)
  // ============================================================================
  
  // 1. Unexpected death ages (should match life expectancy curve)
  if (player.demographics.age < 10 && !player.alive) {
    anomalies.unexpectedDeathAges.push({
      age: player.demographics.age,
      cause: player.causeOfDeath,
      expected: player.demographics.lifeExpectancy,
      reason: 'Death before age 10'
    });
  }
  
  // 2. Multiple chronic conditions by age 25
  if (player.demographics.age >= 25 && player.demographics.age < 26) {
    const totalChronic = (player.health.physical.chronic.length || 0) + (player.health.mental.chronic.length || 0);
    if (totalChronic > 2) {
      anomalies.multipleChronicConditions.push({
        age: player.demographics.age,
        conditions: totalChronic,
        list: [...(player.health.physical.chronic || []), ...(player.health.mental.chronic || [])],
        reason: `${totalChronic} chronic conditions at age 25`
      });
    }
  }
  
  // 3. Extreme debt while young
  if (player.demographics.age < 30 && player.economics.debt > 200) {
    anomalies.extremeDebtYoung.push({
      age: player.demographics.age,
      debt: player.economics.debt,
      reason: `Debt of ${player.economics.debt} at age ${player.demographics.age}`
    });
  }
  
  // 4. Never employed by age 30
  if (player.demographics.age >= 30 && !player.economics.income.employed) {
    // Check if ever employed (this is a simple check - ideally would track employment history)
    anomalies.noEmploymentByAge30.push({
      age: player.demographics.age,
      employed: false,
      reason: 'Not employed at age 30 (should have worked sometime)'
    });
  }
  
  // 5. Zero resources but still alive at young age
  if (player.demographics.age < 30 && player.economics.resources.current === 0 && player.alive) {
    anomalies.inconsistentStates.push({
      age: player.demographics.age,
      resources: 0,
      employed: player.economics.income.employed,
      reason: 'Zero resources but still alive'
    });
  }
  
  // Progress indicator
  if ((i + 1) % 10 === 0) {
    console.log(`Processed ${i + 1}/${NUM_LIVES} lives...`);
  }
}

// ============================================================================
// GENERATE REPORT
// ============================================================================

let report = '';
report += `DEATH TRACE ANOMALY REPORT\n`;
report += `Generated: ${new Date().toISOString()}\n`;
report += `Analyzed: ${NUM_LIVES} lives\n`;
report += `\n${'='.repeat(80)}\n\n`;

let totalAnomalies = 0;

// Report each anomaly type
if (anomalies.unexpectedDeathAges.length > 0) {
  report += `ANOMALY: UNEXPECTED DEATH AGES (${anomalies.unexpectedDeathAges.length})\n`;
  report += `Expected: Rare deaths before age 10\n`;
  report += `Found: ${anomalies.unexpectedDeathAges.length} people\n\n`;
  for (const anom of anomalies.unexpectedDeathAges.slice(0, 5)) {
    report += `  Age ${anom.age}: ${anom.cause}\n`;
  }
  report += `\n`;
  totalAnomalies += anomalies.unexpectedDeathAges.length;
}

if (anomalies.tooManyMentalHealthCrises.length > 0) {
  report += `ANOMALY: TOO MANY MENTAL HEALTH CRISES (${anomalies.tooManyMentalHealthCrises.length})\n`;
  report += `Expected: <10 mental health events by age 40\n`;
  report += `Threshold: 30+ events triggered alert\n`;
  report += `Found: ${anomalies.tooManyMentalHealthCrises.length} people\n\n`;
  const avgCrises = anomalies.tooManyMentalHealthCrises.reduce((a, b) => a + b.crisisCount, 0) / anomalies.tooManyMentalHealthCrises.length;
  report += `  Average crises: ${avgCrises.toFixed(1)}\n\n`;
  totalAnomalies += anomalies.tooManyMentalHealthCrises.length;
}

if (anomalies.noEmploymentByAge30.length > 0) {
  const pct = ((anomalies.noEmploymentByAge30.length / NUM_LIVES) * 100).toFixed(1);
  report += `ANOMALY: NEVER EMPLOYED BY AGE 30 (${anomalies.noEmploymentByAge30.length} = ${pct}%)\n`;
  report += `Expected: ~40% unemployment rate by age 30\n`;
  report += `Found: ${pct}% never worked\n\n`;
  report += `  → Employment system may be BROKEN (13.7% rate too low)\n\n`;
  totalAnomalies += anomalies.noEmploymentByAge30.length;
}

if (anomalies.chronic0yearsOld.length > 0) {
  report += `ANOMALY: CHRONIC CONDITIONS AT AGE 0 (${anomalies.chronic0yearsOld.length})\n`;
  report += `Expected: 0 cases\n`;
  report += `Found: ${anomalies.chronic0yearsOld.length}\n\n`;
  for (const anom of anomalies.chronic0yearsOld.slice(0, 3)) {
    report += `  Conditions: ${anom.conditions.join(', ')}\n`;
  }
  report += `\n  → Health system may be initializing bad values\n\n`;
  totalAnomalies += anomalies.chronic0yearsOld.length;
}

if (anomalies.multipleChronicConditions.length > 0) {
  report += `ANOMALY: 3+ CHRONIC CONDITIONS BY AGE 25 (${anomalies.multipleChronicConditions.length})\n`;
  report += `Expected: Rare\n`;
  report += `Found: ${anomalies.multipleChronicConditions.length}\n\n`;
  const avg = anomalies.multipleChronicConditions.reduce((a, b) => a + b.conditions, 0) / anomalies.multipleChronicConditions.length;
  report += `  Average: ${avg.toFixed(1)} conditions\n\n`;
  totalAnomalies += anomalies.multipleChronicConditions.length;
}

if (anomalies.extremeDebtYoung.length > 0) {
  report += `ANOMALY: EXTREME DEBT BY AGE 30 (${anomalies.extremeDebtYoung.length})\n`;
  report += `Expected: 0-50 resources of debt\n`;
  report += `Found: ${anomalies.extremeDebtYoung.length} people with >200 debt\n\n`;
  for (const anom of anomalies.extremeDebtYoung.slice(0, 3)) {
    report += `  Age ${anom.age}: ${anom.debt} debt\n`;
  }
  report += `\n`;
  totalAnomalies += anomalies.extremeDebtYoung.length;
}

if (anomalies.longTermHomelessnessYoung.length > 0) {
  report += `ANOMALY: LONG-TERM HOMELESSNESS WHILE YOUNG (${anomalies.longTermHomelessnessYoung.length})\n`;
  report += `Expected: Rare/short-term\n`;
  report += `Found: ${anomalies.longTermHomelessnessYoung.length}\n\n`;
  for (const anom of anomalies.longTermHomelessnessYoung.slice(0, 3)) {
    report += `  Age ${anom.startAge}-${anom.endAge}: ${anom.duration} years homeless\n`;
  }
  report += `\n`;
  totalAnomalies += anomalies.longTermHomelessnessYoung.length;
}

if (anomalies.inconsistentStates.length > 0) {
  report += `ANOMALY: INCONSISTENT STATES (${anomalies.inconsistentStates.length})\n`;
  report += `Expected: 0\n`;
  report += `Found: ${anomalies.inconsistentStates.length} people with 0 resources but alive\n\n`;
  report += `  → Logic error in survival calculation or resource management\n\n`;
  totalAnomalies += anomalies.inconsistentStates.length;
}

report += `\n${'='.repeat(80)}\n`;
report += `TOTAL ANOMALIES DETECTED: ${totalAnomalies}\n`;
report += `\nSUMMARY:\n`;
report += `- Most critical: Employment system (${anomalies.noEmploymentByAge30.length} never employed by 30)\n`;
report += `- Mental health: ${anomalies.tooManyMentalHealthCrises.length} people with extreme crisis frequency\n`;
report += `- Death quality: ${anomalies.unexpectedDeathAges.length} deaths before age 10\n`;

// Save report
fs.writeFileSync(ANOMALY_REPORT, report);
console.log(`\n✓ Anomaly report saved to: ${ANOMALY_REPORT}\n`);
console.log(report);
