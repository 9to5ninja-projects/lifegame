// Test marriage/divorce system
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

console.log('Testing Marriage/Divorce System\n');
console.log('='.repeat(70));

let marriageCount = 0;
let divorceCount = 0;
let examplesFound = 0;

let gamesRun = 0;

while (examplesFound < 3) {
  gamesRun++;
  game.createPlayer();
  
  let gameMarriages = 0;
  let gameDivorces = 0;
  let lastMarriageAge = null;
  
  // Play until death
  while (game.player.alive && game.player.age < 120) {
    const result = game.nextYear();
    
    if (result.event && result.event.name) {
      if (result.event.name.includes('Marriage')) {
        gameMarriages++;
        lastMarriageAge = game.player.age;
      }
      if (result.event.name.includes('Divorce')) {
        gameDivorces++;
      }
    }
  }
  
  // Print if there are interesting marriage/divorce patterns
  if (gameMarriages > 0 && examplesFound < 3) {
    console.log(`\n--- EXAMPLE ${examplesFound + 1} (Game #${gamesRun}) ---`);
    console.log(`Marriages: ${gameMarriages}, Divorces: ${gameDivorces}`);
    console.log(`Final age: ${game.player.age}`);
    console.log(`Final married status: ${game.player.relationships.partner.exists}`);
    if (game.player.relationships.partner.exists) {
      const duration = game.player.age - game.player.relationships.partner.since;
      console.log(`Current marriage duration: ${duration} years (started at age ${game.player.relationships.partner.since})`);
    }
    examplesFound++;
    marriageCount += gameMarriages;
    divorceCount += gameDivorces;
  }
}

console.log('\n' + '='.repeat(70));
console.log(`Results from ${gamesRun} games:`);
console.log(`Total marriages: ${marriageCount}`);
console.log(`Total divorces: ${divorceCount}`);
console.log(`Average marriages per game with marriage: ${(marriageCount / Math.min(3, gamesRun)).toFixed(1)}`);
if (divorceCount > 0) {
  console.log(`Divorce rate: ${((divorceCount / (marriageCount + divorceCount)) * 100).toFixed(1)}%`);
}
