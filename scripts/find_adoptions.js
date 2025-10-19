// Look for adoption events
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

console.log('Searching for adoption events...\n');

let found = 0;
let gamesRun = 0;

while (found < 2) {
  gamesRun++;
  game.createPlayer();
  
  let events = [];
  
  // Play full childhood (0-18)
  while (game.player.alive && game.player.age < 18) {
    const result = game.nextYear();
    
    if (result.event && result.event.name) {
      events.push({
        age: game.player.age,
        name: result.event.name
      });
    }
  }
  
  const adoptions = events.filter(e => e.name.includes('Adopted'));
  
  if (adoptions.length > 0 && found < 2) {
    found++;
    console.log(`\n--- Example ${found} (Game #${gamesRun}) ---`);
    console.log(`Total events: ${events.length}`);
    console.log(`All events:`);
    events.forEach(e => {
      console.log(`  Age ${e.age}: ${e.name}`);
    });
  }
}

console.log(`\n\nSearched ${gamesRun} games`);
