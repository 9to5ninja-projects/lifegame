// Test orphan and adoption system
const MortalityGameV2 = require('../game_engine_v2_homeostatic.js');
const MortalityGameIntegrated = require('../game_engine_integrated.js');
const fs = require('fs');

// Load game data
const BIRTH_CARDS = JSON.parse(fs.readFileSync('../data/birth_cards_json.json', 'utf8'));
const FAMILY_CARDS = JSON.parse(fs.readFileSync('../data/family_cards_json.json', 'utf8'));
const EVENT_CARDS = JSON.parse(fs.readFileSync('../data/event_cards_childhood_v2.json', 'utf8'))
  .concat(JSON.parse(fs.readFileSync('../data/event_cards_teen_v2.json', 'utf8')))
  .concat(JSON.parse(fs.readFileSync('../data/event_cards_adult_v2.json', 'utf8')));
const DEATH_CARDS = JSON.parse(fs.readFileSync('../data/death_cards_json.json', 'utf8'));

const game = new MortalityGameIntegrated(BIRTH_CARDS, FAMILY_CARDS, EVENT_CARDS, DEATH_CARDS);

console.log('Testing Orphan and Adoption System\n');
console.log('='.repeat(70));

let examplesFound = 0;
let gamesRun = 0;

while (examplesFound < 3) {
  gamesRun++;
  game.createPlayer();
  
  let parentDeathAge = null;
  let adoptionAge = null;
  
  // Play until death or age 18
  while (game.player.alive && game.player.age < 18) {
    const result = game.nextYear();
    
    if (result.event && result.event.name) {
      if (result.event.name.includes('Parent Dies') && !parentDeathAge) {
        parentDeathAge = game.player.age;
      }
      if (result.event.name.includes('Get Adopted') && !adoptionAge) {
        adoptionAge = game.player.age;
      }
    }
  }
  
  // Show examples of parent death + adoption or orphan status
  if (parentDeathAge !== null && examplesFound < 3) {
    examplesFound++;
    console.log(`\nExample ${examplesFound} (Game #${gamesRun}):`);
    console.log(`  Parent died at age: ${parentDeathAge}`);
    console.log(`  Orphan status: ${game.player.circumstances.vulnerability.orphan ? 'FULL ORPHAN' : (game.player.circumstances.vulnerability.halfOrphan ? 'HALF ORPHAN' : 'NOT ORPHAN')}`);
    if (adoptionAge) {
      console.log(`  Adopted at age: ${adoptionAge}`);
    } else if (game.player.alive) {
      console.log(`  Still waiting for adoption at age ${game.player.age}`);
    }
  }
}

console.log('\n' + '='.repeat(70));
console.log(`Ran ${gamesRun} games to find 3 orphan examples`);


