// Test sibling economic impact
const MortalityGameIntegrated = require('../game_engine_integrated.js');
const fs = require('fs');

// Load cards
const birthCards = JSON.parse(fs.readFileSync('../data/birth_cards_json.json', 'utf8'));
const familyCards = JSON.parse(fs.readFileSync('../data/family_cards_json.json', 'utf8'));
const eventCardsChildhood = JSON.parse(fs.readFileSync('../data/event_cards_childhood_v2.json', 'utf8'));
const eventCardsTeens = JSON.parse(fs.readFileSync('../data/event_cards_teen_v2.json', 'utf8'));
const eventCardsAdult = JSON.parse(fs.readFileSync('../data/event_cards_adult_v2.json', 'utf8'));
const deathCards = JSON.parse(fs.readFileSync('../data/death_cards_json.json', 'utf8'));

// Combine event cards
const allEventCards = [
  ...eventCardsChildhood,
  ...eventCardsTeens,
  ...eventCardsAdult
];

console.log(`🧑‍🤝‍🧑 SIBLING ECONOMICS TEST\n`);

const examples = {
  noSiblings: [],
  oneSibling: [],
  twoSiblings: [],
  threePlusSiblings: []
};

for (let gameNum = 0; gameNum < 100; gameNum++) {
  const game = new MortalityGameIntegrated(birthCards, familyCards, allEventCards, deathCards);
  game.createPlayer();
  
  const siblingCount = game.player.relationships.siblings.filter(s => s.alive).length;
  const initialResources = game.player.economics.resources.current;
  
  // Play through childhood (first 12 years)
  let yearsPlayed = 0;
  let totalResourceDrain = 0;
  
  while (game.player.alive && game.player.demographics.age < 12 && yearsPlayed < 12) {
    const resourceBefore = game.player.economics.resources.current;
    game.nextYear();
    const resourceAfter = game.player.economics.resources.current;
    totalResourceDrain += (resourceBefore - resourceAfter);
    yearsPlayed++;
  }
  
  const avgResourceDrainPerYear = totalResourceDrain / yearsPlayed;
  
  const record = {
    siblingCount,
    initialResources,
    resourcesAtAge12: game.player.economics.resources.current,
    totalDrain: totalResourceDrain,
    avgPerYear: avgResourceDrainPerYear
  };
  
  if (siblingCount === 0) examples.noSiblings.push(record);
  else if (siblingCount === 1) examples.oneSibling.push(record);
  else if (siblingCount === 2) examples.twoSiblings.push(record);
  else examples.threePlusSiblings.push(record);
}

console.log(`📊 RESULTS (100 games, ages 0-12):\n`);

function analyzeBracket(name, examples) {
  if (examples.length === 0) {
    console.log(`${name}: No examples`);
    return;
  }
  
  const avgDrain = examples.reduce((sum, e) => sum + e.totalDrain, 0) / examples.length;
  const avgPerYear = examples.reduce((sum, e) => sum + e.avgPerYear, 0) / examples.length;
  const avgFinal = examples.reduce((sum, e) => sum + e.resourcesAtAge12, 0) / examples.length;
  
  console.log(`${name}:`);
  console.log(`  Count: ${examples.length} games`);
  console.log(`  Avg total drain (0-12): ${avgDrain.toFixed(1)} resources`);
  console.log(`  Avg per year: ${avgPerYear.toFixed(1)} resources/year`);
  console.log(`  Avg resources at age 12: ${avgFinal.toFixed(1)}`);
  console.log();
}

analyzeBracket('💰 No Siblings', examples.noSiblings);
analyzeBracket('1️⃣ One Sibling', examples.oneSibling);
analyzeBracket('2️⃣ Two Siblings', examples.twoSiblings);
analyzeBracket('3️⃣+ Three+ Siblings', examples.threePlusSiblings);

console.log(`\n📈 IMPACT SUMMARY:`);
if (examples.oneSibling.length > 0 && examples.noSiblings.length > 0) {
  const noDiff = examples.noSiblings[0].avgPerYear;
  const oneDiff = examples.oneSibling[0].avgPerYear;
  console.log(`  One sibling costs: ~${(oneDiff - noDiff).toFixed(1)} additional resources/year`);
}

if (examples.threePlusSiblings.length > 0 && examples.noSiblings.length > 0) {
  const noDiff = examples.noSiblings[0].avgPerYear;
  const plusDiff = examples.threePlusSiblings[0].avgPerYear;
  console.log(`  3+ siblings cost: ~${(plusDiff - noDiff).toFixed(1)} additional resources/year`);
}


