// Debug: what are resource levels in poor regions?
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

console.log(`💰 RESOURCE LEVELS BY REGION\n`);

const resourcesByRegion = {};

for (let i = 0; i < 50; i++) {
  const game = new MortalityGameIntegrated(birthCards, familyCards, allEventCards, deathCards);
  game.createPlayer();
  
  const region = game.player.demographics.birthRegion;
  if (!resourcesByRegion[region]) {
    resourcesByRegion[region] = { initial: [], ages: {} };
  }
  
  resourcesByRegion[region].initial.push(game.player.economics.resources.current);
  
  // Play to age 5
  for (let age = 0; age < 5; age++) {
    game.nextYear();
    if (!resourcesByRegion[region].ages[age]) {
      resourcesByRegion[region].ages[age] = [];
    }
    resourcesByRegion[region].ages[age].push(game.player.economics.resources.current);
  }
}

console.log(`📊 AVERAGE RESOURCES BY AGE:\n`);

Object.entries(resourcesByRegion)
  .sort((a, b) => {
    const avgA = a[1].initial.reduce((s, v) => s + v, 0) / a[1].initial.length;
    const avgB = b[1].initial.reduce((s, v) => s + v, 0) / b[1].initial.length;
    return avgA - avgB;
  })
  .forEach(([region, data]) => {
    const avgInit = data.initial.reduce((s, v) => s + v, 0) / data.initial.length;
    const age5 = data.ages[4] ? data.ages[4].reduce((s, v) => s + v, 0) / data.ages[4].length : 0;
    
    console.log(`${region}:`);
    console.log(`  Age 0: ${avgInit.toFixed(1)}`);
    console.log(`  Age 5: ${age5.toFixed(1)}`);
    console.log(`  Below 20 at start: ${data.initial.filter(v => v < 20).length}%`);
    console.log();
  });
