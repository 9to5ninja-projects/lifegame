const GameEngine = require('./game_engine_v2_homeostatic.js');
const fs = require('fs');

// Load cards
const birthCards = JSON.parse(fs.readFileSync('./birth_cards_json.json', 'utf8'));
const familyCards = JSON.parse(fs.readFileSync('./family_cards_json.json', 'utf8'));
const allEvents = [];
const deathCards = JSON.parse(fs.readFileSync('./death_cards_json.json', 'utf8'));

const engine = new GameEngine(birthCards, familyCards, allEvents, deathCards);

console.log('=== TRACE: Single Life Ages 0-20 ===\n');

engine.createPlayer(birthCards[0], familyCards[0], { sex: 'male' });
const player = engine.player;

console.log(`Birth Region: ${player.demographics.birthRegion}`);
console.log(`Starting mental health: ${player.health.mental.current}\n`);

for (let year = 0; year < 35 && player.alive; year++) {
  const oldMental = player.health.mental.current;
  
  engine.processYearEnd(player);

  const mentalDelta = player.health.mental.current - oldMental;

  if (mentalDelta !== 0 || year % 2 === 0) {
    console.log(`Age ${player.demographics.age}: Mental ${oldMental.toFixed(1)}→${player.health.mental.current.toFixed(1)} ` +
      `(${mentalDelta > 0 ? '+' : ''}${mentalDelta.toFixed(1)}), ` +
      `Baseline: ${player.health.mental.baseline.toFixed(1)}`);
  }

  if (!player.alive) {
    console.log(`\nDied at age ${player.demographics.age}: ${player.causeOfDeath}`);
    break;
  }
}

console.log(`\n\nAt age ${player.demographics.age}:`);
console.log(`Mental health current: ${player.health.mental.current.toFixed(1)}`);
console.log(`Mental health baseline: ${player.health.mental.baseline.toFixed(1)}`);
console.log(`Addiction: ${player.addiction.stage}`);
console.log(`Chronic conditions: ${player.health.mental.chronic.join(', ') || 'none'}`);
