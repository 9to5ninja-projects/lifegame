// Debug: Check actual suicide risk values
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

const game = new MortalityGameV2(birthCards, familyCards, eventCards, deathCards);

console.log("=== SUICIDE RISK DEBUG ===\n");

let maxRisk = 0;
let riskAtSuicideAge = [];

const NUM_LIVES = 1000;

for (let i = 0; i < NUM_LIVES; i++) {
  const birthCard = birthCards[Math.floor(Math.random() * birthCards.length)];
  const familyCard = familyCards[Math.floor(Math.random() * familyCards.length)];

  game.createPlayer(birthCard, familyCard);
  const p = game.player;

  for (let year = 0; year < 100; year++) {
    const result = game.processYearEnd(p);

    // Track high suicide risks
    if (p.health.mental.suicideRisk > 0.001) {
      if (p.demographics.age >= 10) {
        riskAtSuicideAge.push({
          age: p.demographics.age,
          risk: p.health.mental.suicideRisk,
          married: p.relationships.social.married,
          friends: p.relationships.social.friends,
          isolation: p.relationships.social.isolation,
          mental: p.health.mental.current,
          crisis: p.health.mental.episodeDuration
        });
      }
      maxRisk = Math.max(maxRisk, p.health.mental.suicideRisk);
    }

    if (!result.alive) break;
  }
}

console.log(`Max suicide risk observed: ${maxRisk.toFixed(6)}%`);
console.log(`High-risk instances at suicide-eligible ages: ${riskAtSuicideAge.length}`);
console.log(`Threshold for suicide attempt: > 0.001%`);
console.log(`Threshold as probability: > 0.00001\n`);

if (riskAtSuicideAge.length > 0) {
  console.log("Sample high-risk cases:");
  riskAtSuicideAge.slice(0, 10).forEach(case_ => {
    console.log(`  Age ${case_.age}: Risk=${case_.risk.toFixed(6)}%, Mental=${case_.mental}, Crisis=${case_.crisis}m, Married=${case_.married}, Friends=${case_.friends}, Isolated=${case_.isolation}`);
  });
}
