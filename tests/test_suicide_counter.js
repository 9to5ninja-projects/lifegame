// Simple test: count how many suicide checks happen
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

// Track suicide outcomes
let checkCount = 0;
let suicides = 0;
let attempts = 0;
let survivedAttempts = 0;

console.log("Testing 100 lives...\n");

for (let i = 0; i < 100; i++) {
  const birthCard = birthCards[Math.floor(Math.random() * birthCards.length)];
  const familyCard = familyCards[Math.floor(Math.random() * familyCards.length)];
  
  game.createPlayer(birthCard, familyCard);
  const p = game.player;
  
  for (let year = 0; year < 100; year++) {
    // Before processYearEnd, check suicide risk
    if (p.demographics.age >= 10 && p.health.mental.suicideRisk > 0.001) {
      checkCount++;
    }
    
    const result = game.processYearEnd(p);
    
    // After processYearEnd, check results
    if (!result.alive) {
      if (result.cause === "Suicide") {
        suicides++;
        console.log(`FATAL SUICIDE! Age ${p.demographics.age}`);
      }
    }
    
    // Check if they survived a suicide attempt
    if (p.health.mental.suicideHistory && p.health.mental.suicideHistory.length > 0) {
      const lastAttempt = p.health.mental.suicideHistory[p.health.mental.suicideHistory.length - 1];
      if (lastAttempt.survived) {
        // This shouldn't accumulate - let me track it differently
      }
    }
    
    if (!result.alive) break;
  }
}

console.log(`\nTotal years with suicidal ideation (age 10+): ${checkCount}`);
console.log(`Total fatal suicides: ${suicides}`);
console.log(`Success rate: ${(suicides / checkCount * 100).toFixed(2)}%`);

// Also check how many people have attempted suicide
let totalAttempts = 0;
for (let i = 0; i < 100; i++) {
  const birthCard = birthCards[Math.floor(Math.random() * birthCards.length)];
  const familyCard = familyCards[Math.floor(Math.random() * familyCards.length)];
  
  game.createPlayer(birthCard, familyCard);
  const p = game.player;
  
  for (let year = 0; year < 100; year++) {
    const result = game.processYearEnd(p);
    if (!result.alive) break;
  }
  
  if (p.health.mental.suicideHistory && p.health.mental.suicideHistory.length > 0) {
    totalAttempts += p.health.mental.suicideHistory.length;
    console.log(`Person ${i}: ${p.health.mental.suicideHistory.length} attempt(s), ${p.health.mental.suicideHistory.filter(a => a.survived).length} survived`);
  }
}

console.log(`\nTotal attempted (survived or fatal): ${totalAttempts}`);
