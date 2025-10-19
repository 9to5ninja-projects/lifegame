// Diagnostic: Test natural mental health drift without events
const path = require("path");
const rootDir = path.join(__dirname, "..");
const MortalityGameV2 = require(path.join(rootDir, "game_engine_v2_homeostatic"));

const birthCards = require(path.join(rootDir, "birth_cards_json.json"));
const familyCards = require(path.join(rootDir, "family_cards_json.json"));
const deathCards = require(path.join(rootDir, "death_cards_json.json"));
const eventCards = {
  childhood: require(path.join(rootDir, "event_cards_childhood_v2.json")),
  teen: require(path.join(rootDir, "event_cards_teen_v2.json")),
  adult: require(path.join(rootDir, "event_cards_adult_v2.json"))
};

const game = new MortalityGameV2(birthCards, familyCards, eventCards, deathCards);

console.log("Testing mental health natural drift...\n");

// Create a player from a poor region
const poorCard = birthCards.find(b => b.name && b.name.includes("South Asia"));
const familyCard = familyCards[0];

game.createPlayer(poorCard, familyCard);
const p = game.player;

// Age up to age 15 (skip childhood mortality)
p.demographics.age = 15;
p.age = 15;
p.survival = 95; // Override with high survival for testing

console.log(`Created player: ${p.demographics.birthRegion}, age ${p.demographics.age}`);
console.log(`Mental health: ${p.health.mental.current}`);
console.log(`Resources: ${p.economics.resources.current}`);
console.log(`Survival: ${p.survival}\n`);

let suicideDeaths = 0;
let suicides = 0;

for (let year = 0; year < 50; year++) {
  // Simulate ongoing economic stress
  if (year > 0 && year % 10 === 0) {
    // Recurring economic hardship
    p.economics.resources.current -= 30;
    p.health.mental.current -= 15;
    console.log(`\nYear ${year} (Age ${p.demographics.age}): Economic crisis! Resources now ${p.economics.resources.current}, mental health ${p.health.mental.current}`);
  }
  
  const result = game.processYearEnd(p);
  
  if (!p.alive) {
    console.log(`\n✗ Player died at age ${p.demographics.age}`);
    console.log(`Cause: ${result.cause}`);
    if (result.cause === "suicide") suicideDeaths++;
    break;
  }
  
  // Track key metrics every 5 years
  if (year % 5 === 0 && year > 0) {
    console.log(`Year ${year} (Age ${p.demographics.age}):`);
    console.log(`  Mental health: ${p.health.mental.current.toFixed(1)}/100`);
    console.log(`  Episode duration: ${p.health.mental.episodeDuration} months`);
    console.log(`  Suicide risk: ${p.health.mental.suicideRisk.toFixed(3)}%`);
    console.log(`  Chronic conditions: ${p.health.mental.chronic.join(", ") || "none"}`);
    console.log(`  Treatment: ${p.health.mental.treatmentStatus}`);
    console.log(`  Resources: ${p.economics.resources.current}`);
  }
}

console.log(`\n\nDiagnostic Complete`);
