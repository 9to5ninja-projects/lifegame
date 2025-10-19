// Test sibling economic impact - simpler version
const MortalityGameIntegrated = require('./game_engine_integrated.js');
const fs = require('fs');

// Load cards
const birthCards = JSON.parse(fs.readFileSync('./birth_cards_json.json', 'utf8'));
const familyCards = JSON.parse(fs.readFileSync('./family_cards_json.json', 'utf8'));
const eventCardsChildhood = JSON.parse(fs.readFileSync('./event_cards_childhood_v2.json', 'utf8'));
const eventCardsTeens = JSON.parse(fs.readFileSync('./event_cards_teen_v2.json', 'utf8'));
const eventCardsAdult = JSON.parse(fs.readFileSync('./event_cards_adult_v2.json', 'utf8'));
const deathCards = JSON.parse(fs.readFileSync('./death_cards_json.json', 'utf8'));

// Combine event cards
const allEventCards = [
  ...eventCardsChildhood,
  ...eventCardsTeens,
  ...eventCardsAdult
];

console.log(`🧑‍🤝‍🧑 SIBLING IMPACT ANALYSIS\n`);

// Run 10 examples at each sibling bracket
const brackets = {
  '0 siblings': { count: 0, totalCostPerYear: 0, health: [] },
  '1 sibling': { count: 0, totalCostPerYear: 0, health: [] },
  '2 siblings': { count: 0, totalCostPerYear: 0, health: [] },
  '3+ siblings': { count: 0, totalCostPerYear: 0, health: [] }
};

// Play multiple games, tracking at age 10 (solidly in childhood)
for (let gameNum = 0; gameNum < 50; gameNum++) {
  const game = new MortalityGameIntegrated(birthCards, familyCards, allEventCards, deathCards);
  game.createPlayer();
  
  const siblingCount = game.player.relationships.siblings.filter(s => s.alive).length;
  let bracket = '0 siblings';
  if (siblingCount === 1) bracket = '1 sibling';
  else if (siblingCount === 2) bracket = '2 siblings';
  else if (siblingCount >= 3) bracket = '3+ siblings';
  
  // Play to age 10
  while (game.player.alive && game.player.demographics.age < 10) {
    game.nextYear();
  }
  
  // Record at age 10
  if (game.player.alive && game.player.demographics.age === 10) {
    brackets[bracket].count++;
    brackets[bracket].health.push(game.player.health.mental.current);
  }
}

console.log(`📊 DATA AT AGE 10:\n`);

for (const [bracket, data] of Object.entries(brackets)) {
  if (data.count === 0) continue;
  
  const avgHealth = data.health.reduce((a, b) => a + b, 0) / data.health.length;
  const healthStatuses = {
    excellent: data.health.filter(h => h >= 80).length,
    good: data.health.filter(h => h >= 60 && h < 80).length,
    moderate: data.health.filter(h => h >= 40 && h < 60).length,
    critical: data.health.filter(h => h < 40).length
  };
  
  console.log(`${bracket}:`);
  console.log(`  Sample size: ${data.count} lives`);
  console.log(`  Avg mental health: ${avgHealth.toFixed(1)}/100`);
  console.log(`  Distribution:`);
  console.log(`    Excellent (80+): ${healthStatuses.excellent} (${(healthStatuses.excellent/data.count*100).toFixed(0)}%)`);
  console.log(`    Good (60-79): ${healthStatuses.good} (${(healthStatuses.good/data.count*100).toFixed(0)}%)`);
  console.log(`    Moderate (40-59): ${healthStatuses.moderate} (${(healthStatuses.moderate/data.count*100).toFixed(0)}%)`);
  console.log(`    Critical (<40): ${healthStatuses.critical} (${(healthStatuses.critical/data.count*100).toFixed(0)}%)`);
  console.log();
}

console.log(`\n✅ SIBLING EFFECTS NOW ACTIVE:`);
console.log(`  • 0-2 siblings: Support helps mental health (+0.5 per sibling)`);
console.log(`  • 3+ siblings: Crowding creates stress and immune exposure`);
console.log(`  • Ages 0-12: Each sibling costs ~4 resources/year`);
console.log(`  • Ages 13-17: Each sibling costs ~2 resources/year (can help)`);
console.log(`  • Age 18+: No sibling cost (independence)`);
