/**
 * TRACE: Log income at every stage of processYearEnd
 */

const path = require('path');
const fs = require('fs');

const rootDir = path.join(__dirname, '..');
const GameEngine = require(path.join(rootDir, 'game_engine_integrated.js'));

const birthCards = JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'birth_cards_json.json'), 'utf8'));
const familyCards = JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'family_cards_json.json'), 'utf8'));
const eventCardsData = {
  childhood: JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'event_cards_childhood.json'), 'utf8')),
  teen: JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'event_cards_teen.json'), 'utf8')),
  adult: JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'event_cards_adult.json'), 'utf8'))
};
const eventCards = [...eventCardsData.childhood, ...eventCardsData.teen, ...eventCardsData.adult];
const deathCards = JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'death_cards_json.json'), 'utf8'));

const engine = new GameEngine(birthCards, familyCards, eventCards, deathCards);
engine.createPlayer(birthCards.find(b => b.name === 'Western Europe'), familyCards[0]);
const player = engine.player;

// Patch processYearEnd to log income at each stage
const originalProcessYearEnd = engine.processYearEnd.bind(engine);
engine.processYearEnd = function(p = this.player) {
  const target = p || this.player;
  
  if (target.demographics.age >= 19 && target.demographics.age <= 26) {
    console.log(`\n[AGE ${target.demographics.age} YEAR START]`);
    console.log(`  Before processYearEnd: income=${target.economics.income.current}, resources=${target.economics.resources.current.toFixed(1)}, employed=${target.economics.income.employed}`);
    console.log(`  Chronic diseases: ${target.health.chronic.active.map(d => d.disease).join(', ') || 'none'}`);
    console.log(`  Children: ${target.relationships.children.length}, Housing quality: ${target.circumstances.housing.quality}`);
  }
  
  // Call original
  const result = originalProcessYearEnd(target);
  
  if (target.demographics.age >= 19 && target.demographics.age <= 26) {
    console.log(`  After processYearEnd: income=${target.economics.income.current}, resources=${target.economics.resources.current.toFixed(1)}, employed=${target.economics.income.employed}`);
  }
  
  return result;
};

// Run to age 15
for (let i = 0; i < 15; i++) {
  engine.nextYear();
}

// Then trace 15-26
for (let year = 0; year < 12 && player.alive; year++) {
  engine.nextYear();
}

console.log(`\nFinal - ALIVE: ${player.alive}, Age: ${player.demographics.age}`);
