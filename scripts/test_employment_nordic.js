const GameEngine = require('../game_engine_v2_homeostatic.js');
const fs = require('fs');

// Load cards
const birthCards = JSON.parse(fs.readFileSync('../birth_cards_json.json', 'utf8'));
const familyCards = JSON.parse(fs.readFileSync('../family_cards_json.json', 'utf8'));

// Use empty event/death cards to avoid format issues
const engine = new GameEngine(birthCards, familyCards, [], []);

console.log('=== EMPLOYMENT & STRESS TEST (NORDIC) ===\n');

// Simple test: Create people at different ages and see employment distribution
console.log('Employment rates by age (Nordic region):\n');

const ages = [12, 15, 18, 22, 25, 30, 40, 50, 60, 65, 70];
for (const targetAge of ages) {
  let employed = 0;
  let unemployed = 0;
  let unemployMonths = [];
  let mentalHealth = [];

  for (let i = 0; i < 100; i++) {
    const birthCard = birthCards[0];
    const familyCard = familyCards[0];
    
    engine.createPlayer(birthCard, familyCard, {
      sex: Math.random() > 0.5 ? 'male' : 'female',
      birthRegion: 'Nordic Country',
    });
    
    // Age them to target age
    while (engine.player.demographics.age < targetAge) {
      engine.processYearEnd(engine.player);
    }

    if (engine.player.economics.income.employed) {
      employed++;
    } else {
      unemployed++;
      unemployMonths.push(engine.player.economics.income.unemploymentMonths || 0);
    }
    
    mentalHealth.push(engine.player.health.mental.current);
  }

  const empRate = ((employed / 100) * 100).toFixed(1);
  const uneMonthAvg = unemployMonths.length > 0 
    ? (unemployMonths.reduce((a,b) => a+b, 0) / unemployMonths.length).toFixed(0)
    : 'N/A';
  const mentalAvg = (mentalHealth.reduce((a,b) => a+b, 0) / mentalHealth.length).toFixed(1);
  
  console.log(`Age ${targetAge.toString().padStart(2)}: ${empRate.padStart(5)}% employed | Avg mental health: ${mentalAvg.padStart(5)}`);
}

console.log('\n=== STRESS & UNEMPLOYMENT EFFECT ===\n');

// Compare employed vs unemployed at age 35
console.log('Mental health comparison at age 35:');

let employedMentalHealth = [];
let unemployedMentalHealth = [];
let unemployedDuration = [];

for (let i = 0; i < 200; i++) {
  const birthCard = birthCards[0];
  const familyCard = familyCards[0];
  
  engine.createPlayer(birthCard, familyCard, {
    sex: Math.random() > 0.5 ? 'male' : 'female',
    birthRegion: 'Nordic Country',
  });
  
  // Age to 35
  while (engine.player.demographics.age < 35) {
    engine.processYearEnd(engine.player);
  }

  if (engine.player.economics.income.employed) {
    employedMentalHealth.push(engine.player.health.mental.current);
  } else {
    unemployedMentalHealth.push(engine.player.health.mental.current);
    unemployedDuration.push(engine.player.economics.income.unemploymentMonths || 0);
  }
}

const empAvg = (employedMentalHealth.reduce((a,b)=>a+b,0) / employedMentalHealth.length).toFixed(1);
const empMin = Math.min(...employedMentalHealth);
const empMax = Math.max(...employedMentalHealth);

const uneAvg = unemployedMentalHealth.length > 0 
  ? (unemployedMentalHealth.reduce((a,b)=>a+b,0) / unemployedMentalHealth.length).toFixed(1)
  : 'N/A';
const uneMin = unemployedMentalHealth.length > 0 ? Math.min(...unemployedMentalHealth) : 'N/A';
const uneMax = unemployedMentalHealth.length > 0 ? Math.max(...unemployedMentalHealth) : 'N/A';

console.log(`  Employed (n=${employedMentalHealth.length}):   Avg ${empAvg.padStart(5)}, Range ${empMin}-${empMax}`);
console.log(`  Unemployed (n=${unemployedMentalHealth.length}): Avg ${uneAvg.padStart(5)}, Range ${uneMin}-${uneMax}`);

if (unemployedDuration.length > 0) {
  const duAvg = (unemployedDuration.reduce((a,b)=>a+b,0) / unemployedDuration.length).toFixed(0);
  console.log(`  Avg unemployment duration: ${duAvg} months`);
}

console.log('\n=== REAL LIFE TRAJECTORY ===\n');
console.log('One individual life span:');

const birthCard = birthCards[0];
const familyCard = familyCards[0];
engine.createPlayer(birthCard, familyCard, {
  sex: 'male',
  birthRegion: 'Nordic Country',
});

const milestones = [18, 25, 30, 40, 50, 60, 65, 70, 80];
for (const age of milestones) {
  while (engine.player.demographics.age < age) {
    engine.processYearEnd(engine.player);
  }

  const emp = engine.player.economics.income.employed ? 'Yes' : 'No ';
  const mental = engine.player.health.mental.current.toFixed(0);
  const base = engine.player.health.mental.baseline.toFixed(0);
  const resources = engine.player.economics.resources.current.toFixed(1);
  
  console.log(`Age ${age.toString().padStart(2)}: Employed=${emp}, Mental=${mental}/${base}, Resources=${resources}`);
}
