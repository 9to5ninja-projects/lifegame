const GameEngine = require('../game_engine_v2_homeostatic.js');
const fs = require('fs');

const birthCards = JSON.parse(fs.readFileSync('./birth_cards_json.json', 'utf8'));
const familyCards = JSON.parse(fs.readFileSync('./family_cards_json.json', 'utf8'));
const allEvents = [];
const deathCards = JSON.parse(fs.readFileSync('./death_cards_json.json', 'utf8'));

const engine = new GameEngine(birthCards, familyCards, allEvents, deathCards);

// Test all 4 regions
const regions = {
  'Nordic': birthCards[0],
  'Developed': birthCards[3],  // North America Middle Class
  'Developing': birthCards[6], // Urban China
  'Fragile': birthCards[12] // Rural Sub-Saharan Africa
};

Object.entries(regions).forEach(([label, card]) => {
  console.log(`\n${label} Region (${card.name}):`);
  console.log(`  Birth survival: ${card.effects.statSet.survival}`);
  console.log(`  Resources mod: ${card.effects.resourceMod}`);
  
  engine.createPlayer(card, familyCards[0]);
  const p = engine.player;
  
  console.log(`  Player created: survival=${p.survival}, resources=${p.economics.resources.current}`);
  
  // Track what happens at key ages
  for (let year = 0; year < 20 && p.alive; year++) {
    if (year % 5 === 0 || p.demographics.age === 5 || p.demographics.age === 6) {
      const baseHealth = p.health.physical.current;
      const before = p.survival;
      
      engine.processYearEnd(p);
      
      if (p.demographics.age === 6) {
        console.log(`  Age 6: survival ${before} → ${p.survival} (health=${p.health.physical.current}, resources=${p.economics.resources.current})`);
      }
      
      if (!p.alive) {
        console.log(`  DIED at age ${p.demographics.age}: ${p.causeOfDeath}`);
        break;
      }
    } else {
      engine.processYearEnd(p);
      if (!p.alive) break;
    }
  }
  
  if (p.alive) {
    console.log(`  Survived to age ${p.demographics.age}`);
  }
});
