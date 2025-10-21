// Large-scale test: 500 lives to see acute crisis patterns
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

console.log("=".repeat(80));
console.log("LARGE-SCALE HEALTH CRISIS TEST - 500 Lives × 80 Years");
console.log("=".repeat(80));

const game = new MortalityGameV2(birthCards, familyCards, eventCards, deathCards);
const population = [];

// Create 500 players
const regions_pop = [
  "Nordic Country",
  "Western Europe",
  "North America - Middle Class",
  "Urban Latin America",
  "Sub-Saharan Africa"
];

const familyCardArray = familyCards.slice(0, 5);

for (let i = 0; i < 100; i++) {
  regions_pop.forEach((region, idx) => {
    let birthCard = birthCards.find(bc => bc.region === region);
    if (!birthCard) birthCard = birthCards[0];
    
    const familyCard = familyCardArray[idx % familyCardArray.length];
    game.createPlayer(birthCard, familyCard);
    population.push(game.player);
  });
}

console.log(`Population created: ${population.length}`);

// Simulate 80 years
let crisisStats = {
  totalEvents: 0,
  byType: {},
  byRegion: {},
  byOutcome: {},
  ages: []
};

let causeOfDeathStats = {};
let lifeExpectancies = [];

for (let year = 0; year < 80; year++) {
  population.forEach(p => {
    if (!p.alive) return;
    
    const result = game.processYearEnd(p, year + p.demographics.birthYear);
    
    // Track crises
    if (p.health.crises) {
      Object.entries(p.health.crises).forEach(([crisisType, data]) => {
        if (data.lastAge === p.demographics.age) {
          crisisStats.totalEvents++;
          crisisStats.byType[crisisType] = (crisisStats.byType[crisisType] || 0) + 1;
          crisisStats.byOutcome[data.lastOutcome] = (crisisStats.byOutcome[data.lastOutcome] || 0) + 1;
          crisisStats.ages.push(p.demographics.age);
          
          const region = p.demographics.birthRegion;
          if (!crisisStats.byRegion[region]) crisisStats.byRegion[region] = {};
          crisisStats.byRegion[region][crisisType] = (crisisStats.byRegion[region][crisisType] || 0) + 1;
        }
      });
    }
    
    if (!result.alive && result.cause) {
      causeOfDeathStats[result.cause] = (causeOfDeathStats[result.cause] || 0) + 1;
    }
  });
}

const survivors = population.filter(p => p.alive);
const totalDeaths = population.length - survivors.length;

console.log("\n1. SURVIVAL STATISTICS");
console.log("-".repeat(80));
console.log(`Survivors: ${survivors.length}/${population.length} (${(survivors.length/population.length*100).toFixed(1)}%)`);
console.log(`Deaths: ${totalDeaths}`);
console.log(`Average age of survivors: ${(survivors.reduce((s,p) => s + p.demographics.age, 0) / survivors.length).toFixed(1)}`);

console.log("\n2. CAUSES OF DEATH (Top 10)");
console.log("-".repeat(80));
Object.entries(causeOfDeathStats)
  .sort(([,a], [,b]) => b - a)
  .slice(0, 10)
  .forEach(([cause, count]) => {
    const pct = (count / totalDeaths * 100).toFixed(1);
    console.log(`  ${cause.padEnd(25)} ${count.toString().padStart(4)} (${pct}%)`);
  });

console.log("\n3. ACUTE CRISIS EVENTS");
console.log("-".repeat(80));
console.log(`Total acute crisis events: ${crisisStats.totalEvents}`);
console.log(`Person-years at risk (30+): ${population.filter(p => p.demographics.age >= 30).length * 80}`);
if (crisisStats.totalEvents > 0) {
  console.log(`Crises per 1000 person-years: ${(crisisStats.totalEvents / (population.length * 80 / 1000)).toFixed(1)}`);
  
  console.log(`\nBy type:`);
  Object.entries(crisisStats.byType).forEach(([type, count]) => {
    console.log(`  ${type.padEnd(20)} ${count.toString().padStart(4)} events`);
  });
  
  console.log(`\nBy outcome:`);
  Object.entries(crisisStats.byOutcome).forEach(([outcome, count]) => {
    console.log(`  ${outcome.padEnd(25)} ${count.toString().padStart(4)}`);
  });
  
  console.log(`\nAverage age at crisis: ${(crisisStats.ages.reduce((a,b) => a+b, 0) / crisisStats.ages.length).toFixed(1)}`);
  
  console.log(`\nBy region:`);
  Object.entries(crisisStats.byRegion).forEach(([region, types]) => {
    const count = Object.values(types).reduce((a,b) => a+b, 0);
    console.log(`  ${region.padEnd(30)} ${count}`);
  });
} else {
  console.log(`  No acute crisis events (expected with current incidence)`);
}

console.log("\n4. HEALTH STATUS OF SURVIVORS");
console.log("-".repeat(80));
if (survivors.length > 0) {
  const avgPhysical = survivors.reduce((s, p) => s + p.health.physical.current, 0) / survivors.length;
  const avgMental = survivors.reduce((s, p) => s + p.health.mental.current, 0) / survivors.length;
  const withChronic = survivors.filter(p => p.health.chronic.active && p.health.chronic.active.length > 0).length;
  const withCrises = survivors.filter(p => p.health.crises && Object.keys(p.health.crises).length > 0).length;
  
  console.log(`Average physical health: ${avgPhysical.toFixed(1)}/100`);
  console.log(`Average mental health: ${avgMental.toFixed(1)}/100`);
  console.log(`With chronic diseases: ${withChronic}/${survivors.length} (${(withChronic/survivors.length*100).toFixed(1)}%)`);
  console.log(`With acute crisis history: ${withCrises}/${survivors.length} (${(withCrises/survivors.length*100).toFixed(1)}%)`);
  
  const avgChronic = survivors.reduce((s, p) => s + (p.health.chronic.active?.length || 0), 0) / survivors.length;
  console.log(`Average active chronic diseases: ${avgChronic.toFixed(2)}`);
}

console.log("\n" + "=".repeat(80));
console.log("FULL SYSTEM TEST COMPLETE");
console.log("=".repeat(80));
