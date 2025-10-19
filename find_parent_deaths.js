// Simple test - just run games until we see parent deaths
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

console.log('Running games until we see 2 parent death examples...\n');

let examplesFound = 0;
let gamesRun = 0;

while (examplesFound < 2) {
  gamesRun++;
  game.createPlayer();
  
  const motherBirthAge = game.player.relationships.parents.mother.ageAtBirth;
  const fatherBirthAge = game.player.relationships.parents.father.ageAtBirth;
  
  let parentDeathsThisGame = 0;
  
  // Play until death
  while (game.player.alive && game.player.age < 120) {
    const result = game.nextYear();
    
    if (result.event && result.event.name && result.event.name.includes('Parent Dies')) {
      const playerAge = game.player.age;
      const motherCurrentAge = game.player.relationships.parents.mother.currentAge;
      const fatherCurrentAge = game.player.relationships.parents.father.currentAge;
      
      console.log(`\n--- EXAMPLE ${examplesFound + 1} ---`);
      console.log(`Game #${gamesRun}, Player age: ${playerAge}`);
      console.log(`Mother: Birth age ${motherBirthAge} → Current age ${motherCurrentAge} → ${game.player.relationships.parents.mother.alive ? 'ALIVE' : 'DEAD'}`);
      console.log(`Father: Birth age ${fatherBirthAge} → Current age ${fatherCurrentAge} → ${game.player.relationships.parents.father.alive ? 'ALIVE' : 'DEAD'}`);
      
      examplesFound++;
      parentDeathsThisGame++;
      
      if (examplesFound >= 2) break;
    }
  }
}

console.log(`\n\nFound 2 examples after running ${gamesRun} games.`);
