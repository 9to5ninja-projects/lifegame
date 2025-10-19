// Simple one-game test
const MortalityGameIntegrated = require('./game_engine_integrated.js');
const fs = require('fs');

// Load cards
const birthCards = JSON.parse(fs.readFileSync('./birth_cards_json.json', 'utf8'));
const familyCards = JSON.parse(fs.readFileSync('./family_cards_json.json', 'utf8'));
const eventCardsChildhood = JSON.parse(fs.readFileSync('./event_cards_childhood_v2.json', 'utf8'));
const eventCardsTeens = JSON.parse(fs.readFileSync('./event_cards_teen_v2.json', 'utf8'));
const eventCardsAdult = JSON.parse(fs.readFileSync('./event_cards_adult_v2.json', 'utf8'));
const deathCards = JSON.parse(fs.readFileSync('./death_cards_json.json', 'utf8'));

// Combine event cards
const allEventCards = [
  ...eventCardsChildhood,
  ...eventCardsTeens,
  ...eventCardsAdult
];

console.log('Starting game...');
const game = new MortalityGameIntegrated(birthCards, familyCards, allEventCards, deathCards);
game.createPlayer();

console.log('Player created:', game.player.demographics.sex, 'from', game.player.demographics.birthRegion);

let yearsPlayed = 0;
const maxYears = 150;

while (game.player.alive && yearsPlayed < maxYears) {
  const result = game.nextYear();
  yearsPlayed++;
  
  if (yearsPlayed % 10 === 0) {
    console.log(`  Age ${game.player.demographics.age}: alive=${game.player.alive}`);
  }
  
  if (!result.alive) {
    console.log('Death detected at age', game.player.demographics.age);
    break;
  }
}

console.log(`\nGame complete!`);
console.log(`  Final age: ${game.player.demographics.age}`);
console.log(`  Years played: ${yearsPlayed}`);
console.log(`  Alive: ${game.player.alive}`);
console.log(`  Events: ${game.player.eventHistory.length}`);
if (game.player.causeOfDeath) {
  console.log(`  Cause of death: ${game.player.causeOfDeath.name}`);
}
