const GameEngine = require('../game_engine_v2_homeostatic.js');
const fs = require('fs');
const { getSuicideMethodsForRegion } = require('../global_statistics.js');

// Load cards
const birthCards = JSON.parse(fs.readFileSync('../data/birth_cards_json.json', 'utf8'));
const familyCards = JSON.parse(fs.readFileSync('../data/family_cards_json.json', 'utf8'));
const allEvents = [];
const deathCards = JSON.parse(fs.readFileSync('../data/death_cards_json.json', 'utf8'));

const engine = new GameEngine(birthCards, familyCards, allEvents, deathCards);

console.log('=== SUICIDE METHOD LETHALITY BY REGION ===\n');

// Check method data for each region
const regions = ['Nordic', 'Developed', 'Emerging', 'Developing', 'Fragile'];

regions.forEach(region => {
  const methodData = getSuicideMethodsForRegion(region);
  console.log(`${region}:`);
  console.log(`  Attempt-to-completion ratio: ${(methodData.baseAttemptToCompletionRatio * 100).toFixed(1)}%`);
  console.log(`  Available methods:`);
  
  methodData.methods.forEach(method => {
    const actualLethality = method.lethality * (1 - method.intervention);
    console.log(`    ${method.name.padEnd(12)} - available: ${(method.availability * 100).toFixed(0)}%, base lethality: ${(method.lethality * 100).toFixed(0)}%, with intervention: ${(actualLethality * 100).toFixed(0)}%`);
  });
  
  // Calculate average lethality (weighted by availability)
  let totalLethality = 0;
  let totalAvailability = 0;
  methodData.methods.forEach(m => {
    const actualLethality = m.lethality * (1 - m.intervention);
    totalLethality += actualLethality * m.availability;
    totalAvailability += m.availability;
  });
  const avgLethality = totalAvailability > 0 ? (totalLethality / totalAvailability * 100).toFixed(1) : '0';
  console.log(`  Average lethality (weighted by availability): ${avgLethality}%`);
  console.log();
});

console.log('\n=== Test: 1,000 suicide attempts by region ===\n');

regions.forEach(region => {
  let fatalAttempts = 0;
  
  for (let i = 0; i < 1000; i++) {
    // Find a birth card that maps to this region
    let birthCard = birthCards[0];
    if (region === 'Nordic') {
      birthCard = birthCards.find(c => c.name.includes('Nordic')) || birthCards[0];
    } else if (region === 'Developed') {
      birthCard = birthCards.find(c => c.name.includes('Western Europe') || c.name.includes('Japan')) || birthCards[1];
    } else if (region === 'Emerging') {
      birthCard = birthCards.find(c => c.name.includes('Urban China') || c.name.includes('Southeast')) || birthCards[5];
    } else if (region === 'Developing') {
      birthCard = birthCards.find(c => c.name.includes('Urban Latin') || c.name.includes('South Asia')) || birthCards[7];
    }
    
    engine.createPlayer(birthCard, familyCards[0], { sex: 'male' });
    const p = engine.player;
    p.demographics.age = 25;  // Peak suicide age
    
    // Attempt suicide
    const result = engine.attemptSuicide(p);
    if (!result.alive) {
      fatalAttempts++;
    }
  }
  
  const completionRate = (fatalAttempts / 1000 * 100).toFixed(1);
  console.log(`${region.padEnd(12)}: ${fatalAttempts} fatal out of 1000 attempts = ${completionRate}%`);
});

console.log('\n=== Expected vs Actual Completion Rates ===');
console.log('Nordic:    5% (best intervention)');
console.log('Developed: 8%');
console.log('Emerging:  15%');
console.log('Developing: 25%');
console.log('Fragile:   35% (worst services)');

