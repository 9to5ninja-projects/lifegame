const GameEngine = require('../game_engine_v2_homeostatic.js');
const fs = require('fs');

// Load cards
const birthCards = JSON.parse(fs.readFileSync('../birth_cards_json.json', 'utf8'));
const familyCards = JSON.parse(fs.readFileSync('../family_cards_json.json', 'utf8'));
const eventCards = JSON.parse(fs.readFileSync('../event_cards_adult.json', 'utf8'));
const deathCards = JSON.parse(fs.readFileSync('../death_cards_json.json', 'utf8'));

const engine = new GameEngine(birthCards, familyCards, eventCards, deathCards);

console.log('=== EMPLOYMENT & STRESS TEST ===\n');
console.log('Testing Nordic births with realistic employment and stress patterns\n');

// Test 1: Single birth, ages through life
const birthCard = birthCards.find(c => c.name.includes('Nordic')) || birthCards[0];
const familyCard = familyCards[0];

engine.createPlayer(birthCard, familyCard, { sex: 'M', birthRegion: 'Nordic Country' });
const p1 = engine.player;

console.log('Individual life trajectory:\n');
const milestones = [0, 15, 18, 25, 30, 40, 50, 60, 65, 75];

for (const targetAge of milestones) {
  // Simulate to target age
  while (p1.demographics.age < targetAge) {
    engine.processYearEnd(p1);
  }

  const employed = p1.economics.income.employed ? 'Yes' : 'No';
  const unemployMonths = p1.economics.income.unemploymentMonths || 0;
  const resources = p1.economics.resources.current.toFixed(1);
  const mentalHealth = p1.health.mental.current.toFixed(0);
  const mentalBaseline = p1.health.mental.baseline.toFixed(0);
  const stress = (p1.health.mental.baseline - p1.health.mental.current).toFixed(1);

  console.log(`Age ${targetAge.toString().padStart(2)}: Employed=${employed} (${unemployMonths}mo), Resources=${resources.padStart(5)}, Mental=${mentalHealth.padStart(3)}/${mentalBaseline.padStart(3)} (stress=${stress.padStart(4)})`);
}

console.log('\n=== EMPLOYMENT DISTRIBUTION BY AGE ===\n');

// Test 2: 1000 people at each age, check employment rate
const ages = [15, 18, 25, 30, 40, 50, 60, 65, 70];
for (const age of ages) {
  let employed = 0;
  const count = 100;

  for (let i = 0; i < count; i++) {
    engine.createPlayer(birthCard, familyCard, { sex: Math.random() > 0.5 ? 'M' : 'F', birthRegion: 'Nordic Country', age: age });
    if (engine.player.economics.income.employed) employed++;
  }

  const rate = ((employed / count) * 100).toFixed(1);
  console.log(`Age ${age.toString().padStart(2)}: ${rate.padStart(5)}% employed (${employed}/${count})`);
}

console.log('\n=== STRESS & MENTAL HEALTH BY EMPLOYMENT STATUS ===\n');

// Test 3: Compare mental health of employed vs unemployed at different ages
const testAges = [20, 30, 40];
for (const age of testAges) {
  console.log(`Age ${age}:`);

  let employedMentalHealth = [];
  let unemployedMentalHealth = [];

  for (let i = 0; i < 50; i++) {
    engine.createPlayer(birthCard, familyCard, { sex: 'M', birthRegion: 'Nordic Country', age: age });
    const p = engine.player;

    // Simulate 5 years to let employment and stress settle
    for (let y = 0; y < 5; y++) {
      engine.processYearEnd(p);
    }

    if (p.economics.income.employed) {
      employedMentalHealth.push(p.health.mental.current);
    } else {
      unemployedMentalHealth.push(p.health.mental.current);
    }
  }

  const empAvg = (employedMentalHealth.reduce((a, b) => a + b, 0) / employedMentalHealth.length).toFixed(1);
  const empMin = Math.min(...employedMentalHealth).toFixed(0);
  const empMax = Math.max(...employedMentalHealth).toFixed(0);

  const uneAvg = (unemployedMentalHealth.reduce((a, b) => a + b, 0) / unemployedMentalHealth.length).toFixed(1);
  const uneMin = Math.min(...unemployedMentalHealth).toFixed(0);
  const uneMax = Math.max(...unemployedMentalHealth).toFixed(0);

  console.log(`  Employed:   Avg ${empAvg.padStart(5)} (${empMin.padStart(2)}-${empMax.padStart(2)}) - n=${employedMentalHealth.length}`);
  console.log(`  Unemployed: Avg ${uneAvg.padStart(5)} (${uneMin.padStart(2)}-${uneMax.padStart(2)}) - n=${unemployedMentalHealth.length}`);
  console.log();
}
