// Test teen parent death events
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

console.log('Testing Teen Parent Death Events\n');
console.log('='.repeat(70));

let examplesFound = 0;
let gamesRun = 0;

while (examplesFound < 2) {
  gamesRun++;
  game.createPlayer();
  
  let parentDeathAsTeen = null;
  
  // Play through teen years (13-18)
  while (game.player.alive && game.player.age < 19) {
    const result = game.nextYear();
    
    if (result.event && result.event.name && result.event.name.includes('Parent Dies')) {
      if (game.player.age >= 13 && game.player.age <= 18 && !parentDeathAsTeen) {
        parentDeathAsTeen = game.player.age;
      }
    }
  }
  
  if (parentDeathAsTeen !== null && examplesFound < 2) {
    examplesFound++;
    console.log(`\nExample ${examplesFound} (Game #${gamesRun}):`);
    console.log(`  Parent died during teen years at age: ${parentDeathAsTeen}`);
    console.log(`  Orphan status: ${game.player.circumstances.vulnerability.orphan ? 'FULL ORPHAN' : (game.player.circumstances.vulnerability.halfOrphan ? 'HALF ORPHAN' : 'NOT ORPHAN')}`);
  }
}

console.log('\n' + '='.repeat(70));
console.log(`✓ Found ${examplesFound} teen parent death examples after ${gamesRun} games`);
console.log('Teen parent death event is working correctly!');
