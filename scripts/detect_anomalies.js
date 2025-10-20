/**
 * DEATH TRACE ANOMALY DETECTOR
 * 
 * Runs traces and automatically flags suspicious patterns that might indicate
 * broken systems (e.g., if someone dies at age 8 from "old age", that's clearly wrong).
 */

const fs = require('fs');
const MortalityGameV2 = require('./game_engine_v2_homeostatic.js');
const DeathTracer = require('./death_trace_system.js');

// Load game data
const birthCards = JSON.parse(fs.readFileSync('./birth_cards_json.json', 'utf8'));
const familyCards = JSON.parse(fs.readFileSync('./family_cards_json.json', 'utf8'));
const eventCards = {
  childhood: JSON.parse(fs.readFileSync('./event_cards_childhood.json', 'utf8')),
  teen: JSON.parse(fs.readFileSync('./event_cards_teen.json', 'utf8')),
  adult: JSON.parse(fs.readFileSync('./event_cards_adult.json', 'utf8')),
};
const deathCards = JSON.parse(fs.readFileSync('./death_cards_json.json', 'utf8'));

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
  const tracer = new DeathTracer();
  const engine = new MortalityGameV2(birthCards, familyCards, eventCards, deathCards, tracer);
  
  engine.createPlayer(birthCard, familyCards[0], {
    sex: Math.random() > 0.5 ? 'male' : 'female'
  });
  
  const player = engine.player;
  let age = 0;
  
  while (player.alive && age < 150) {
    age++;
    player.demographics.age = age;
    engine.driftPlayerState(player);
    if (!player.alive) break;
  }
  
  const log = tracer.getLifeLog(player);
  const chain = tracer.traceCausalChain(player);
  
  // ============================================================================
  // ANOMALY DETECTION
  // ============================================================================
  
  // 1. Unexpected death ages (should match life expectancy curve)
  if (player.demographics.age < 10 && player.alive === false) {
    anomalies.unexpectedDeathAges.push({
      age: player.demographics.age,
      cause: player.causeOfDeath,
      expected: player.demographics.lifeExpectancy,
      reason: 'Death before age 10'
    });
  }
  
  // 2. Too many mental health crises (indicates stress multipliers too high)
  const mentalCrisisCount = log.filter(e => e.eventType.includes('MENTAL') || e.eventType.includes('CRISIS')).length;
  if (mentalCrisisCount > 30 && player.demographics.age < 40) {
    anomalies.tooManyMentalHealthCrises.push({
      age: player.demographics.age,
      crisisCount: mentalCrisisCount,
      reason: `${mentalCrisisCount} mental health events by age ${player.demographics.age}`
    });
  }
  
  // 3. No employment by age 30 (should be ~60% employed)
  const byAge30 = log.filter(e => e.age <= 30);
  const employedByAge30 = byAge30.some(e => e.economics.employed);
  if (!employedByAge30 && player.demographics.age >= 30) {
    anomalies.noEmploymentByAge30.push({
      age: player.demographics.age,
      employed: false,
      reason: 'Never employed by age 30 (should be 60%+ employed)'
    });
  }
  
  // 4. Chronic conditions at age 0-2 (should be rare)
  const earlyChronicEvents = log.filter(e => e.age <= 2 && (e.health.physical_chronic.length > 0 || e.health.mental.chronic.length > 0));
  if (earlyChronicEvents.length > 0) {
    anomalies.chronic0yearsOld.push({
      age: 0,
      conditions: earlyChronicEvents[0].health.physical_chronic.concat(earlyChronicEvents[0].health.mental.chronic),
      reason: 'Chronic conditions diagnosed at infancy (should not occur)'
    });
  }
  
  // 5. Multiple severe chronic conditions by age 25
  const atAge25 = log.find(e => e.age === 25);
  if (atAge25 && atAge25.health.physical_chronic.length > 2) {
    anomalies.multipleChronicConditions.push({
      age: 25,
      conditions: atAge25.health.physical_chronic.length,
      list: atAge25.health.physical_chronic,
      reason: `${atAge25.health.physical_chronic.length} chronic physical conditions at age 25`
    });
  }
  
  // 6. Extreme debt while young
  const maxDebtUnder30 = Math.max(...byAge30.map(e => e.economics.debt || 0));
  if (maxDebtUnder30 > 200) {
    anomalies.extremeDebtYoung.push({
      age: byAge30.find(e => e.economics.debt === maxDebtUnder30)?.age,
      debt: maxDebtUnder30,
      reason: `Debt of ${maxDebtUnder30} by age ${byAge30.find(e => e.economics.debt === maxDebtUnder30)?.age}`
    });
  }
  
  // 7. Long-term homelessness while young
  const homelessnessEvents = log.filter(e => e.housing.status === 'homeless');
  if (homelessnessEvents.length > 0) {
    const firstHomeless = homelessnessEvents[0];
    const lastHomeless = homelessnessEvents[homelessnessEvents.length - 1];
    const homelessDuration = lastHomeless.age - firstHomeless.age;
    if (homelessDuration > 10 && firstHomeless.age < 30) {
      anomalies.longTermHomelessnessYoung.push({
        startAge: firstHomeless.age,
        endAge: lastHomeless.age,
        duration: homelessDuration,
        reason: `Homeless for ${homelessDuration} years starting at age ${firstHomeless.age}`
      });
    }
  }
  
  // 8. Inconsistent states (resources decrease to 0 but alive)
  const resourceDecreasing = [];
  for (let j = 1; j < log.length; j++) {
    if (log[j].economics.resources === 0 && !log[j].eventType.startsWith('DEATH') && log[j].age > 5) {
      resourceDecreasing.push({
        age: log[j].age,
        resources: 0,
        employed: log[j].economics.employed,
        reason: 'Zero resources but still alive (should trigger homelessness/death)'
      });
    }
  }
  if (resourceDecreasing.length > 0) {
    anomalies.inconsistentStates.push({
      lifeAge: player.demographics.age,
      events: resourceDecreasing.slice(0, 3),
      reason: 'Zero resources but not dead/homeless'
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
