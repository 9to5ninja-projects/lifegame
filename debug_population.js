const GameEngine = require('./game_engine_v2_homeostatic.js');
const fs = require('fs');

// Load cards
const birthCards = JSON.parse(fs.readFileSync('./birth_cards_json.json', 'utf8'));
const familyCards = JSON.parse(fs.readFileSync('./family_cards_json.json', 'utf8'));
const allEvents = [];
const deathCards = JSON.parse(fs.readFileSync('./death_cards_json.json', 'utf8'));

const engine = new GameEngine(birthCards, familyCards, allEvents, deathCards);

console.log('=== DEBUG: Population Statistics ===\n');

const stats = {
  dependent: 0,
  regular: 0,
  casual: 0,
  none: 0,
  depression: 0,
  anxiety: 0,
  ptsd: 0,
  isolated: 0,
  employed: 0,
  married: 0,
  avgMental: 0,
  mentalUnder40: 0,
  mentalUnder50: 0,
  suicideAttempts: 0,
  survived: 0,
  survived30: 0
};

const samples = 1000;

for (let i = 0; i < samples; i++) {
  engine.createPlayer(birthCards[0], familyCards[0], { sex: Math.random() > 0.5 ? 'male' : 'female' });
  const p = engine.player;

  // Age to 30
  for (let age = 0; age < 30 && p.alive; age++) {
    engine.processYearEnd(p);
  }

  if (!p.alive) continue; // Skip if died

  stats.survived30++;

  // Count stats
  stats[p.addiction.stage] = (stats[p.addiction.stage] || 0) + 1;
  
  if (p.health.mental.chronic.includes('depression')) stats.depression++;
  if (p.health.mental.chronic.includes('anxiety')) stats.anxiety++;
  if (p.health.mental.chronic.includes('ptsd')) stats.ptsd++;
  
  // Track suicide attempts
  if (p.health.mental.suicideHistory.length > 0) {
    stats.suicideAttempts += p.health.mental.suicideHistory.length;
    stats.survived += p.health.mental.suicideHistory.filter(h => h.survived).length;
  }
  
  if (p.relationships.social.isolation) stats.isolated++;
  if (p.economics.income.employed) stats.employed++;
  if (p.relationships.social.married) stats.married++;
  
  stats.avgMental += p.health.mental.current;
  if (p.health.mental.current < 40) stats.mentalUnder40++;
  if (p.health.mental.current < 50) stats.mentalUnder50++;
}

console.log(`Sample size: ${samples} people starting`);
console.log(`Survived to age 30: ${stats.survived30} (${((stats.survived30/samples)*100).toFixed(1)}%)\n`);

console.log('ADDICTION STATUS:');
console.log(`  Dependent: ${stats.dependent} (${((stats.dependent/samples)*100).toFixed(1)}%)`);
console.log(`  Regular: ${stats.regular} (${((stats.regular/samples)*100).toFixed(1)}%)`);
console.log(`  Casual: ${stats.casual} (${((stats.casual/samples)*100).toFixed(1)}%)`);
console.log(`  None: ${stats.none} (${((stats.none/samples)*100).toFixed(1)}%)\n`);

console.log('MENTAL HEALTH CONDITIONS:');
console.log(`  Depression: ${stats.depression} (${((stats.depression/samples)*100).toFixed(1)}%)`);
console.log(`  Anxiety: ${stats.anxiety} (${((stats.anxiety/samples)*100).toFixed(1)}%)`);
console.log(`  PTSD: ${stats.ptsd} (${((stats.ptsd/samples)*100).toFixed(1)}%)`);
console.log(`  Suicide attempts: ${stats.suicideAttempts} total (${((stats.suicideAttempts/samples)*100).toFixed(1)}% of people)`);
console.log(`  Survived attempts: ${stats.survived} (${((stats.survived/stats.suicideAttempts)*100).toFixed(1)}% survival rate)\n`);

console.log('SOCIAL/ECONOMIC:');
console.log(`  Isolated: ${stats.isolated} (${((stats.isolated/samples)*100).toFixed(1)}%)`);
console.log(`  Employed: ${stats.employed} (${((stats.employed/samples)*100).toFixed(1)}%)`);
console.log(`  Married: ${stats.married} (${((stats.married/samples)*100).toFixed(1)}%)\n`);

console.log('MENTAL HEALTH SCORES (at age 30):');
console.log(`  Average: ${(stats.avgMental/samples).toFixed(1)}`);
console.log(`  Below 40: ${stats.mentalUnder40} (${((stats.mentalUnder40/samples)*100).toFixed(1)}%)`);
console.log(`  Below 50: ${stats.mentalUnder50} (${((stats.mentalUnder50/samples)*100).toFixed(1)}%)\n`);

console.log('KEY INSIGHT:');
console.log('These stats show what percentage of 30-year-olds have risk factors.');
console.log('High dependency rate, mental illness, or low employment would explain high suicide rates.');
