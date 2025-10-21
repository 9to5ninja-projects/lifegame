// Find long marriages/divorces
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

console.log('Finding long-lived people with marriage/divorce...\n');

let examplesFound = 0;
let gamesRun = 0;

while (examplesFound < 3) {
  gamesRun++;
  game.createPlayer();
  
  let events = [];
  
  // Play until death
  while (game.player.alive && game.player.age < 120) {
    const result = game.nextYear();
    
    if (result.event && result.event.name) {
      events.push({
        age: game.player.age,
        name: result.event.name
      });
    }
  }
  
  // Print if lived 50+ years OR had multiple marriages/divorces
  const age = game.player.age;
  const marriageEvents = events.filter(e => e.name.includes('Marriage') || e.name.includes('Divorce'));
  
  if ((age >= 50 || marriageEvents.length > 1) && examplesFound < 3) {
    console.log(`\n--- EXAMPLE ${examplesFound + 1} (Game #${gamesRun}) ---`);
    console.log(`Lived to age: ${age}`);
    console.log(`Marriage/Divorce events: ${marriageEvents.length}`);
    marriageEvents.forEach(e => {
      console.log(`  Age ${e.age}: ${e.name}`);
    });
    examplesFound++;
  }
}

console.log(`\nSearched ${gamesRun} games to find 3 examples`);


