/**
 * Quick debug: Check friend counts in simulated lives
 */

const path = require('path');
const fs = require('fs');
const MortalityGameV2 = require(path.join(__dirname, '../game_engine_v2_homeostatic.js'));

const birthCards = JSON.parse(fs.readFileSync(path.join(__dirname, '../birth_cards_json.json'), 'utf8'));
const familyCards = JSON.parse(fs.readFileSync(path.join(__dirname, '../family_cards_json.json'), 'utf8'));
const eventCards = JSON.parse(fs.readFileSync(path.join(__dirname, '../event_cards_childhood.json'), 'utf8'));
const deathCards = JSON.parse(fs.readFileSync(path.join(__dirname, '../death_cards_json.json'), 'utf8'));

const engine = new MortalityGameV2(birthCards, familyCards, eventCards, deathCards);
const nordicBirth = birthCards.find(b => b.name === 'Nordic Country');

console.log('Running 5 lives to check friend counts...\n');

for (let i = 0; i < 5; i++) {
  engine.createPlayer(nordicBirth, familyCards[0], { sex: 'female' });
  const player = engine.player;
  
  let age = 0;
  while (player.alive && age < 100) {
    engine.processYearEnd(player);
    age++;
  }
  
  const finalSocial = engine.relationshipsSystem.getSocialSummary(player);
  console.log(`Life ${i+1}: Died at ${age}, Friends=${finalSocial.friends}, Social Health=${finalSocial.socialHealth}, Isolated=${finalSocial.isolated}`);
}
