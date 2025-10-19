// Debug suicide risk calculation at age transition
const fs = require('fs');
const path = require('path');

const MortalityGameV2 = require('./game_engine_v2_homeostatic.js');

const birthCards = JSON.parse(fs.readFileSync('./birth_cards_json.json', 'utf8'));
const familyCards = JSON.parse(fs.readFileSync('./family_cards_json.json', 'utf8'));
const deathCards = JSON.parse(fs.readFileSync('./death_cards_json.json', 'utf8'));
const eventCards = {
  childhood: JSON.parse(fs.readFileSync('./event_cards_childhood.json', 'utf8')),
  teen: JSON.parse(fs.readFileSync('./event_cards_teen.json', 'utf8')),
  adult: JSON.parse(fs.readFileSync('./event_cards_adult.json', 'utf8'))
};

process.env.DEBUG_SUICIDE = '1';

const game = new MortalityGameV2(birthCards, familyCards, eventCards, deathCards);

// Create a very healthy youth
const birthCard = birthCards[0]; // Nordic
const familyCard = familyCards[0]; // Stable

game.createPlayer(birthCard, familyCard, { sex: "male" });
const p = game.player;

// Skip to age 5
for (let i = 0; i < 5; i++) {
  const result = game.processYearEnd(p);
  if (!result.alive) break;
}

console.log("\n=== Starting detailed tracking at age 5 ===\n");

// Now trace carefully
for (let year = 0; year < 10; year++) {
  console.log(`\nBefore year ${year + 5}:`);
  console.log(`  Age: ${p.demographics.age}`);
  console.log(`  Mental: ${p.health.mental.current.toFixed(2)}`);
  console.log(`  Suicide risk: ${p.health.mental.suicideRisk.toFixed(6)}%`);
  
  const result = game.processYearEnd(p);
  
  console.log(`After year (now age ${p.demographics.age}):`);
  console.log(`  Mental: ${p.health.mental.current.toFixed(2)}`);
  console.log(`  Suicide risk: ${p.health.mental.suicideRisk.toFixed(6)}%`);
  
  if (!result.alive) {
    console.log(`\n Died: ${result.cause}`);
    break;
  }
}
