// Detailed suicide rate analysis
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

console.log("=== DETAILED SUICIDE ANALYSIS ===\n");

// Run 10,000 lives and track
const NUM_LIVES = 10000;
let stats = {
  suicides: 0,
  deaths: 0,
  suicideByAge: {},
  suicideByAgeAndGender: {}
};

for (let i = 0; i < NUM_LIVES; i++) {
  if ((i + 1) % 1000 === 0) {
    console.log(`  Processed ${i + 1} lives...`);
  }

  const birthCard = birthCards[Math.floor(Math.random() * birthCards.length)];
  const familyCard = familyCards[Math.floor(Math.random() * familyCards.length)];

  game.createPlayer(birthCard, familyCard);
  const p = game.player;
  
  // Run life
  for (let year = 0; year < 120; year++) {
    stats.deaths++;
    
    if (!stats.suicideByAge[p.demographics.age]) {
      stats.suicideByAge[p.demographics.age] = { deaths: 0, suicides: 0 };
    }
    
    const key = p.demographics.age + '_' + p.demographics.sex;
    if (!stats.suicideByAgeAndGender[key]) {
      stats.suicideByAgeAndGender[key] = { deaths: 0, suicides: 0 };
    }
    
    stats.suicideByAge[p.demographics.age].deaths++;
    stats.suicideByAgeAndGender[key].deaths++;
    
    const result = game.processYearEnd(p);
    
    if (result && result.cause === "suicide") {
      stats.suicides++;
      stats.suicideByAge[p.demographics.age].suicides++;
      stats.suicideByAgeAndGender[key].suicides++;
    }
    
    if (!result.alive) {
      break;
    }
  }
}

console.log(`\n=== RESULTS ===`);
console.log(`Total lifeyears tracked: ${stats.deaths}`);
console.log(`Total suicides: ${stats.suicides}`);
console.log(`Overall suicide rate: ${(stats.suicides / stats.deaths * 100000).toFixed(1)} per 100K\n`);

// Age breakdown
const ages = Object.keys(stats.suicideByAge).map(Number).sort((a, b) => a - b);
console.log("AGE BREAKDOWN:");
console.log("Age | Deaths | Suicides | %    | Expected (Nordic M)");
console.log("----+--------+----------+------+--------------------");

let ages10_29 = { deaths: 0, suicides: 0 };
let ages30plus = { deaths: 0, suicides: 0 };

for (const age of ages) {
  const data = stats.suicideByAge[age];
  const percent = ((data.suicides / data.deaths) * 100000).toFixed(1);
  const expected = (getAdjustedProbability("suicide", age, "male", "Nordic") * 100000).toFixed(1);
  
  console.log(`${age.toString().padEnd(3)} | ${data.deaths.toString().padEnd(6)} | ${data.suicides.toString().padEnd(8)} | ${percent.padEnd(4)} | ${expected}`);
  
  if (age >= 10 && age <= 29) {
    ages10_29.deaths += data.deaths;
    ages10_29.suicides += data.suicides;
  }
  if (age >= 30) {
    ages30plus.deaths += data.deaths;
    ages30plus.suicides += data.suicides;
  }
}

console.log("----+--------+----------+------+--------------------");
console.log(`Ages 10-29: ${ages10_29.suicides}/${ages10_29.deaths} = ${(ages10_29.suicides / ages10_29.deaths * 100000).toFixed(1)} per 100K`);
console.log(`Ages 30+: ${ages30plus.suicides}/${ages30plus.deaths} = ${(ages30plus.suicides / ages30plus.deaths * 100000).toFixed(1)} per 100K`);

// Gender breakdown
console.log("\n\nGENDER + AGE BREAKDOWN:");
console.log("Age | Gender | Deaths | Suicides | Rate     | Expected");
console.log("----+--------+--------+----------+----------+----------");

const keys = Object.keys(stats.suicideByAgeAndGender).sort();
for (const key of keys) {
  const [age, gender] = key.split('_');
  const data = stats.suicideByAgeAndGender[key];
  if (data.deaths > 0) {
    const rate = (data.suicides / data.deaths * 100000).toFixed(1);
    const expected = (getAdjustedProbability("suicide", parseInt(age), gender, "Nordic") * 100000).toFixed(1);
    if (data.deaths >= 5) {
      console.log(`${age.toString().padEnd(3)} | ${gender.padEnd(6)} | ${data.deaths.toString().padEnd(6)} | ${data.suicides.toString().padEnd(8)} | ${rate.padEnd(8)} | ${expected}`);
    }
  }
}
