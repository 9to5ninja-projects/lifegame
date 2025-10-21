const GameEngine = require('./game_engine_v2_homeostatic.js');
const fs = require('fs');

// Load cards
const birthCards = JSON.parse(fs.readFileSync('./birth_cards_json.json', 'utf8'));
const familyCards = JSON.parse(fs.readFileSync('./family_cards_json.json', 'utf8'));
const allEvents = [];
const deathCards = JSON.parse(fs.readFileSync('./death_cards_json.json', 'utf8'));

const engine = new GameEngine(birthCards, familyCards, allEvents, deathCards);

console.log('=== DEATH CAUSES: Ages 0-30 ===\n');

const causes = {};
let count = 0;

for (let i = 0; i < 1000; i++) {
  engine.createPlayer(birthCards[0], familyCards[0], { sex: Math.random() > 0.5 ? 'male' : 'female' });
  const p = engine.player;

  while (p.alive && p.demographics.age < 30) {
    engine.processYearEnd(p);
  }

  if (!p.alive) {
    const cause = p.causeOfDeath || 'Unknown';
    causes[cause] = (causes[cause] || 0) + 1;
    count++;
  }
}

console.log(`Total deaths: ${count}/1000 (${((count/1000)*100).toFixed(1)}%)\n`);

console.log('TOP CAUSES:');
Object.entries(causes)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 15)
  .forEach(([cause, deaths]) => {
    const pct = ((deaths / count) * 100).toFixed(1);
    console.log(`  ${cause}: ${deaths} (${pct}%)`);
  });
