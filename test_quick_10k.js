const GameEngine = require('./game_engine_v2_homeostatic.js');
const fs = require('fs');

// Load cards
const birthCards = JSON.parse(fs.readFileSync('./birth_cards_json.json', 'utf8'));
const familyCards = JSON.parse(fs.readFileSync('./family_cards_json.json', 'utf8'));
const allEvents = [];
const deathCards = JSON.parse(fs.readFileSync('./death_cards_json.json', 'utf8'));

const engine = new GameEngine(birthCards, familyCards, allEvents, deathCards);

console.log('=== QUICK TEST: 10,000 LIVES, SHORT DEBUG ===\n');

let suicides = 0;
let totalDeaths = 0;
let totalYears = 0;
let suicideAttempts = 0;

for (let i = 0; i < 10000; i++) {
  engine.createPlayer(birthCards[0], familyCards[0], { sex: Math.random() > 0.5 ? 'male' : 'female' });
  const player = engine.player;

  while (player.alive && player.demographics.age < 120) {
    totalYears += 1;
    engine.processYearEnd(player);

    if (!player.alive) {
      totalDeaths += 1;
      if (player.causeOfDeath === 'Suicide') {
        suicides += 1;
        console.log(`Suicide at age ${player.demographics.age}, mental=${player.health.mental.current.toFixed(1)}`);
      } else if (player.causeOfDeath && player.causeOfDeath.includes('Overdose')) {
        console.log(`Overdose (substance abuse) at age ${player.demographics.age}`);
      } else if (player.causeOfDeath && player.causeOfDeath.includes('Accident')) {
        console.log(`Accident at age ${player.demographics.age}`);
      }
      break;
    }
  }

  // Track suicide attempts
  if (player.health.mental.suicideHistory) {
    suicideAttempts += player.health.mental.suicideHistory.length;
  }
}

const suicideRate = (suicides / 10000) * 100000;
const perYearAttempts = suicideAttempts / totalYears;

console.log('\n=== RESULTS ===');
console.log(`Simulated: 10,000 lives, ${totalYears.toLocaleString()} life-years, ${totalDeaths.toLocaleString()} deaths`);
console.log(`Suicides: ${suicides} (${suicideRate.toFixed(1)}/100K) - Expected Nordic: 10-15/100K`);
console.log(`Suicide attempts: ${suicideAttempts} total, ${perYearAttempts.toFixed(6)} per year`);
