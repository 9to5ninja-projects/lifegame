// Test regional marriage age realism
const MortalityGameV2 = require('./game_engine_v2_homeostatic.js');
const MortalityGameIntegrated = require('./game_engine_integrated.js');
const fs = require('fs');

// Load game data
const BIRTH_CARDS = JSON.parse(fs.readFileSync('./birth_cards_json.json', 'utf8'));
const FAMILY_CARDS = JSON.parse(fs.readFileSync('./family_cards_json.json', 'utf8'));
const EVENT_CARDS = JSON.parse(fs.readFileSync('./event_cards_childhood_v2.json', 'utf8'))
  .concat(JSON.parse(fs.readFileSync('./event_cards_teen_v2.json', 'utf8')))
  .concat(JSON.parse(fs.readFileSync('./event_cards_adult_v2.json', 'utf8')));
const DEATH_CARDS = JSON.parse(fs.readFileSync('./death_cards_json.json', 'utf8'));

const game = new MortalityGameIntegrated(BIRTH_CARDS, FAMILY_CARDS, EVENT_CARDS, DEATH_CARDS);

console.log('Testing Regional Marriage Age Realism\n');
console.log('='.repeat(70));

let examplesFound = 0;
let gamesRun = 0;

while (examplesFound < 5) {
  gamesRun++;
  game.createPlayer();
  
  const birthRegion = game.player.demographics.birthRegion;
  let marriageAge = null;
  
  // Play until death
  while (game.player.alive && game.player.age < 120) {
    const result = game.nextYear();
    
    if (result.event && result.event.name && result.event.name.includes('Marriage/Partnership') && !marriageAge) {
      marriageAge = game.player.age;
      break; // Stop after first marriage to show pattern
    }
  }
  
  if (marriageAge !== null && examplesFound < 5) {
    examplesFound++;
    console.log(`\nExample ${examplesFound}: ${birthRegion}`);
    console.log(`  Marriage age: ${marriageAge}`);
  }
}

console.log('\n' + '='.repeat(70));
console.log(`Ran ${gamesRun} games to find 5 marriage examples`);
console.log('Expected patterns:');
console.log('  Nordic: marriages 25-35 (high probability peak at 31)');
console.log('  North America: marriages 22-35 (peak at 28)');
console.log('  Latin America: marriages 18-30 (peak at 25)');
console.log('  Sub-Saharan Africa: marriages 16-25 (peak at 19)');
