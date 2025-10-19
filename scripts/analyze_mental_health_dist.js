const GameEngine = require('../game_engine_v2_homeostatic.js');
const fs = require('fs');

// Load cards
const birthCards = JSON.parse(fs.readFileSync('./birth_cards_json.json', 'utf8'));
const familyCards = JSON.parse(fs.readFileSync('./family_cards_json.json', 'utf8'));
const allEvents = [];
const deathCards = JSON.parse(fs.readFileSync('./death_cards_json.json', 'utf8'));

const engine = new GameEngine(birthCards, familyCards, allEvents, deathCards);

console.log('=== Checking actual mental health distribution ===\n');

let mentalHealthByAge = {};
let suicideRiskByAge = {};

for (let i = 0; i < 10000; i++) {
  engine.createPlayer(birthCards[0], familyCards[0], { sex: Math.random() > 0.5 ? 'male' : 'female' });
  const p = engine.player;
  
  // Age to random adult age
  p.demographics.age = Math.floor(Math.random() * 60) + 15;  // Ages 15-74
  
  // Run some years to see mental health drift
  for (let y = 0; y < 10 && p.alive; y++) {
    engine.driftMentalHealthCrisis(p);
  }
  
  const ageGroup = Math.floor(p.demographics.age / 10) * 10;
  if (!mentalHealthByAge[ageGroup]) {
    mentalHealthByAge[ageGroup] = [];
    suicideRiskByAge[ageGroup] = [];
  }
  
  mentalHealthByAge[ageGroup].push(p.health.mental.current);
  
  engine.calculateSuicideRisk(p);
  suicideRiskByAge[ageGroup].push(p.health.mental.suicideRisk);
}

console.log('Mental Health -> Suicide Risk Distribution:\n');
console.log('Age Group | Avg MH | Min MH | Max MH | Avg Risk | Max Risk');
console.log('----------|--------|--------|--------|----------|----------');

Object.keys(mentalHealthByAge).sort((a, b) => a - b).forEach(age => {
  const mhValues = mentalHealthByAge[age];
  const risks = suicideRiskByAge[age];
  
  const avgMH = (mhValues.reduce((a, b) => a + b, 0) / mhValues.length).toFixed(1);
  const minMH = Math.min(...mhValues);
  const maxMH = Math.max(...mhValues);
  const avgRisk = (risks.reduce((a, b) => a + b, 0) / risks.length).toFixed(4);
  const maxRisk = Math.max(...risks).toFixed(4);
  
  console.log(`${age}-${age+9}     | ${avgMH.padStart(6)} | ${minMH.toString().padStart(6)} | ${maxMH.toString().padStart(6)} | ${avgRisk.padStart(8)}% | ${maxRisk.padStart(6)}%`);
});

console.log('\n=== Analysis ===');
console.log('The problem might be:');
console.log('1. People are getting mental health crises too frequently');
console.log('2. Mental health recovery is too slow');
console.log('3. Even 0.012% base is too high when everyone gets crises');
console.log('');
console.log('Real suicide attempt rate: ~0.2-0.3% per year');
console.log('Real suicide completion rate: ~0.012-0.015% per year (because attempts have low lethality)');
console.log('');
console.log('Our model: suicideRisk = annual COMPLETION probability');
console.log('So total should be around 0.012-0.015%');
