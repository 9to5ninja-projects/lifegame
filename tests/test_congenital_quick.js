// Quick test: Check if congenital conditions are working
const fs = require('fs');
const MortalityGameV2 = require('./game_engine_v2_homeostatic.js');
const { checkCongenitalCondition, CONGENITAL_CONDITIONS } = require('./health_crisis_system.js');

const birthCards = JSON.parse(fs.readFileSync('./birth_cards_json.json', 'utf8'));
const familyCards = JSON.parse(fs.readFileSync('./family_cards_json.json', 'utf8'));
const deathCards = JSON.parse(fs.readFileSync('./death_cards_json.json', 'utf8'));
const eventCards = {
  childhood: JSON.parse(fs.readFileSync('./event_cards_childhood.json', 'utf8')),
  teen: JSON.parse(fs.readFileSync('./event_cards_teen.json', 'utf8')),
  adult: JSON.parse(fs.readFileSync('./event_cards_adult.json', 'utf8'))
};

const game = new MortalityGameV2(birthCards, familyCards, eventCards, deathCards);

console.log("CONGENITAL CONDITION TEST - Direct Function");
console.log("=".repeat(60));

// Test the function directly first
console.log("\n1. Testing checkCongenitalCondition directly");
console.log("-".repeat(60));

const testPlayer = {
  demographics: { sex: 'male', age: 0 },
  health: {}
};

const conditions = ["Nordic", "Developing", "Fragile"];

for (const region of conditions) {
  let hits = 0;
  for (let i = 0; i < 1000; i++) {
    const result = checkCongenitalCondition(testPlayer, region, 30);
    if (result.hasCondition) {
      hits++;
      if (hits === 1) {
        console.log(`${region}: Found ${result.condition}`);
      }
    }
  }
  console.log(`  ${region}: ${hits}/1000 births (${(hits/10).toFixed(1)}%)`);
}

console.log("\n2. Creating 100 players to test congenital assignment");
console.log("-".repeat(60));

let congenitalCount = 0;
const conditionCounts = {};

for (let i = 0; i < 100; i++) {
  const birthCard = birthCards[Math.floor(Math.random() * birthCards.length)];
  const familyCard = familyCards[Math.floor(Math.random() * familyCards.length)];
  
  game.createPlayer(birthCard, familyCard);
  const player = game.player;
  
  if (player.health.congenital.hasCondition) {
    congenitalCount++;
    const cond = player.health.congenital.condition;
    conditionCounts[cond] = (conditionCounts[cond] || 0) + 1;
  }
}

console.log(`Players with congenital conditions: ${congenitalCount}/100`);
if (congenitalCount > 0) {
  console.log("Conditions assigned:");
  Object.entries(conditionCounts).forEach(([cond, count]) => {
    console.log(`  ${cond}: ${count}`);
  });
}

console.log("\nCONGENITAL_CONDITIONS object structure check:");
console.log(`Object keys: ${Object.keys(CONGENITAL_CONDITIONS).join(", ")}`);
console.log(`Example (cerebralPalsy):`);
console.log(`  prevalence.Nordic: ${CONGENITAL_CONDITIONS.cerebralPalsy?.prevalence?.Nordic}`);
console.log(`  prevalence.Fragile: ${CONGENITAL_CONDITIONS.cerebralPalsy?.prevalence?.Fragile}`);
