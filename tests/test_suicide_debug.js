// Debug script to understand suicide rate calculation
const fs = require('fs');
const path = require('path');

const MortalityGameV2 = require('./game_engine_v2_homeostatic.js');
const { getAdjustedProbability, getAgeBracket } = require('./global_statistics_v2.js');

const birthCards = JSON.parse(fs.readFileSync('./birth_cards_json.json', 'utf8'));
const familyCards = JSON.parse(fs.readFileSync('./family_cards_json.json', 'utf8'));
const deathCards = JSON.parse(fs.readFileSync('./death_cards_json.json', 'utf8'));
const eventCards = {
  childhood: JSON.parse(fs.readFileSync('./event_cards_childhood.json', 'utf8')),
  teen: JSON.parse(fs.readFileSync('./event_cards_teen.json', 'utf8')),
  adult: JSON.parse(fs.readFileSync('./event_cards_adult.json', 'utf8'))
};

console.log("=== SUICIDE CALCULATION DEBUG ===\n");

// Test 1: What is baseline suicide risk for different ages?
console.log("BASELINE SUICIDE RISKS (by age, no multipliers):");
console.log("Age 15, Male, Nordic:");
const base15M = getAdjustedProbability("suicide", 15, "male", "Nordic");
console.log(`  Probability: ${base15M}`);
console.log(`  Per 100K: ${(base15M * 100000).toFixed(1)}`);
console.log(`  Per year out of 1M: ${Math.round(base15M * 1000000)}`);

console.log("\nAge 25, Male, Nordic:");
const base25M = getAdjustedProbability("suicide", 25, "male", "Nordic");
console.log(`  Probability: ${base25M}`);
console.log(`  Per 100K: ${(base25M * 100000).toFixed(1)}`);
console.log(`  Per year out of 1M: ${Math.round(base25M * 1000000)}`);

console.log("\nAge 45, Male, Nordic:");
const base45M = getAdjustedProbability("suicide", 45, "male", "Nordic");
console.log(`  Probability: ${base45M}`);
console.log(`  Per 100K: ${(base45M * 100000).toFixed(1)}`);
console.log(`  Per year out of 1M: ${Math.round(base45M * 1000000)}`);

// Test 2: Run a small simulation and track suicide by age
console.log("\n\n=== SMALL SIMULATION (100 runs, 100 years each) ===\n");

const game = new MortalityGameV2(birthCards, familyCards, eventCards, deathCards);

let suicidesByAge = {};
let deathsByAge = {};

for (let run = 0; run < 100; run++) {
  const birthCard = birthCards[Math.floor(Math.random() * birthCards.length)];
  const familyCard = familyCards[Math.floor(Math.random() * familyCards.length)];
  
  game.createPlayer(birthCard, familyCard, {
    sex: Math.random() > 0.5 ? "male" : "female"
  });
  
  const player = game.player;

  // Run 100 years
  for (let year = 0; year < 100; year++) {
    if (!suicidesByAge[player.demographics.age]) {
      suicidesByAge[player.demographics.age] = { deaths: 0, suicides: 0 };
    }

    suicidesByAge[player.demographics.age].deaths++;
    
    // Check if they die this year
    const result = game.processYearEnd(player);
    
    if (result && result.cause === "suicide") {
      suicidesByAge[player.demographics.age].suicides++;
      break; // Player died
    }
    
    if (result) {
      break; // Player died of something else
    }
  }
}

// Sort ages and print
const ages = Object.keys(suicidesByAge).map(Number).sort((a, b) => a - b);
console.log("Age | Deaths | Suicides | Suicide% | Expected% (Nordic M)");
console.log("----+--------+----------+----------+---------------------");

let totalDeaths = 0;
let totalSuicides = 0;

for (const age of ages) {
  const deaths = suicidesByAge[age].deaths;
  const suicides = suicidesByAge[age].suicides;
  totalDeaths += deaths;
  totalSuicides += suicides;
  
  const suicidePercent = deaths > 0 ? ((suicides / deaths) * 100).toFixed(2) : "0.00";
  
  // Get expected based on baseline (assume male, Nordic)
  const expected = getAdjustedProbability("suicide", age, "male", "Nordic") * 100;
  const expectedPercent = expected.toFixed(4);
  
  if (deaths >= 5) {
    console.log(`${age.toString().padEnd(3)} | ${deaths.toString().padEnd(6)} | ${suicides.toString().padEnd(8)} | ${suicidePercent.padEnd(8)}% | ${expectedPercent}%`);
  }
}

console.log("----+--------+----------+----------+---------------------");
console.log(`Total: ${totalDeaths} deaths, ${totalSuicides} suicides (${((totalSuicides/totalDeaths)*100).toFixed(2)}%)`);
console.log(`\nExpected rate for Nordic male population: ~12.6/100K (from getAdjustedProbability)`);
console.log(`If we see much higher, the issue is mental health crisis multipliers or baseline calculation.`);