// Large test: 10,000 lives to check suicide rates
const fs = require('fs');
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

let suicides = 0;
let totalYears = 0;
let attempts = 0;
let survived = 0;

console.log("Testing 10,000 lives...");

for (let i = 0; i < 10000; i++) {
  if ((i + 1) % 1000 === 0) console.log(`  ${i + 1} lives...`);
  
  const birthCard = birthCards[Math.floor(Math.random() * birthCards.length)];
  const familyCard = familyCards[Math.floor(Math.random() * familyCards.length)];
  
  game.createPlayer(birthCard, familyCard);
  const p = game.player;
  
  for (let year = 0; year < 120; year++) {
    totalYears++;
    
    const result = game.processYearEnd(p);
    
    if (!result.alive && result.cause === "Suicide") {
      suicides++;
    }
    
    if (!result.alive) break;
  }
  
  // Count attempts
  if (p.health.mental.suicideHistory && p.health.mental.suicideHistory.length > 0) {
    attempts += p.health.mental.suicideHistory.length;
    survived += p.health.mental.suicideHistory.filter(a => a.survived).length;
  }
}

console.log(`\n=== RESULTS ===`);
console.log(`Total lifeyears: ${totalYears}`);
console.log(`Fatal suicides: ${suicides}`);
console.log(`Suicide rate: ${(suicides / totalYears * 100000).toFixed(1)} per 100K`);
console.log(`Total attempts: ${attempts}`);
console.log(`Survivedattempts: ${survived}`);
console.log(`Fatal attempts: ${attempts - survived}`);
if (attempts > 0) {
  console.log(`Success rate of attempts: ${((attempts - survived) / attempts * 100).toFixed(1)}%`);
}
