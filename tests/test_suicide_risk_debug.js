// Debug suicide risk calculation
const fs = require('fs');
const path = require('path');

const MortalityGameV2 = require('./game_engine_v2_homeostatic.js');
const { getAdjustedProbability } = require('./global_statistics_v2.js');

const birthCards = JSON.parse(fs.readFileSync('./birth_cards_json.json', 'utf8'));
const familyCards = JSON.parse(fs.readFileSync('./family_cards_json.json', 'utf8'));
const deathCards = JSON.parse(fs.readFileSync('./death_cards_json.json', 'utf8'));
const eventCards = {
  childhood: JSON.parse(fs.readFileSync('./event_cards_childhood.json', 'utf8')),
  teen: JSON.parse(fs.readFileSync('./event_cards_teen.json', 'utf8')),
  adult: JSON.parse(fs.readFileSync('./event_cards_adult.json', 'utf8'))
};

const game = new MortalityGameV2(birthCards, familyCards, eventCards, deathCards);

console.log("=== SUICIDE RISK DEBUG ===\n");

// Create a healthy youth
const birthCard = birthCards[0]; // Nordic
const familyCard = familyCards[0]; // Stable

game.createPlayer(birthCard, familyCard, { sex: "male" });
const p = game.player;

console.log(`Player: Age ${p.demographics.age}, Region: ${p.demographics.birthRegion}`);
console.log(`Initial mental health: ${p.health.mental.current}/${p.health.mental.baseline}`);
console.log(`Initial suicide risk: ${p.health.mental.suicideRisk}\n`);

// Process years and watch suicide risk develop
for (let year = 0; year < 30; year++) {
  console.log(`Year ${year}: Age ${p.demographics.age}, Mental=${p.health.mental.current.toFixed(1)}, Risk=${p.health.mental.suicideRisk.toFixed(6)}%`);
  
  const result = game.processYearEnd(p);
  
  if (!result.alive) {
    console.log(`\nDied at age ${p.demographics.age}: ${result.cause}`);
    break;
  }
}
