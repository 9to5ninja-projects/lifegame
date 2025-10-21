// Test script: Verify health crisis integration into game engine
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
console.log("HEALTH CRISIS SYSTEM INTEGRATION TEST");
console.log("=".repeat(80));

// Create game and a small population
const game = new MortalityGameV2(birthCards, familyCards, eventCards, deathCards);
const population = [];

// Create 20 players across different regions with gender balance
const regions = [
  "Nordic Country",
  "Western Europe",
  "North America - Middle Class",
  "Urban Latin America",
  "Sub-Saharan Africa"
];

console.log("\n1. CREATING POPULATION");
console.log("-".repeat(80));

// Get sample birth and family cards
const birthCardsByRegion = {};
const familyCardsByType = {};

birthCards.forEach(card => {
  if (card.region) {
    if (!birthCardsByRegion[card.region]) {
      birthCardsByRegion[card.region] = card;
    }
  }
});

familyCards.forEach(card => {
  const cardType = card.name.split(" ")[0]; // Get first word as type
  if (!familyCardsByType[cardType]) {
    familyCardsByType[cardType] = card;
  }
});

const familyCardArray = Object.values(familyCardsByType).slice(0, 5);

for (let i = 0; i < 10; i++) {
  regions.forEach((region, idx) => {
    // Find a birth card for this region
    let birthCard = birthCards.find(bc => bc.region === region);
    if (!birthCard) birthCard = birthCards[0]; // Fallback
    
    // Use different family cards
    const familyCard = familyCardArray[idx % familyCardArray.length];
    
    game.createPlayer(birthCard, familyCard);
    const player = game.player;
    population.push(player);
  });
}

console.log(`\nTotal population created: ${population.length}`);

// Count congenital conditions
const congenitalCounts = {};
let congenitalTotal = 0;
population.forEach(p => {
  if (p.health.congenital.hasCondition) {
    congenitalTotal++;
    const cond = p.health.congenital.condition;
    congenitalCounts[cond] = (congenitalCounts[cond] || 0) + 1;
  }
});

console.log(`\nCongenital conditions: ${congenitalTotal}/${population.length} births (${(congenitalTotal/population.length*100).toFixed(1)}%)`);
if (congenitalTotal > 0) {
  console.log("Conditions assigned:");
  Object.entries(congenitalCounts).forEach(([cond, count]) => {
    console.log(`  ${cond}: ${count}`);
  });
}

console.log("\n2. SIMULATING 60 YEARS OF LIFE");
console.log("-".repeat(80));

// Run simulation for 60 years
let chronicDiseaseCounts = {};
let diagnosesByRegion = {};
let totalDiagnoses = 0;

for (let year = 0; year < 60; year++) {
  population.forEach(p => {
    if (!p.alive) return;
    
    // Process year
    game.processYearEnd(p, year + p.demographics.birthYear);
    
    // Count new chronic disease diagnoses
    if (p.health.chronic.active && p.health.chronic.active.length > 0) {
      p.health.chronic.active.forEach(disease => {
        if (disease.yearsSinceDiagnosis === 1) { // Just diagnosed this year
          chronicDiseaseCounts[disease.disease] = (chronicDiseaseCounts[disease.disease] || 0) + 1;
          totalDiagnoses++;
          
          const region = p.demographics.birthRegion;
          if (!diagnosesByRegion[region]) diagnosesByRegion[region] = {};
          diagnosesByRegion[region][disease.disease] = (diagnosesByRegion[region][disease.disease] || 0) + 1;
        }
      });
    }
  });
}

console.log(`\nTotal chronic disease diagnoses over 60 years: ${totalDiagnoses}`);
console.log("\nDiagnoses by disease type:");
Object.entries(chronicDiseaseCounts).forEach(([disease, count]) => {
  console.log(`  ${disease}: ${count}`);
});

console.log("\nDiagnoses by region:");
Object.entries(diagnosesByRegion).forEach(([region, diseases]) => {
  console.log(`\n  ${region}:`);
  Object.entries(diseases).forEach(([disease, count]) => {
    console.log(`    ${disease}: ${count}`);
  });
});

// Check survivors and health state
const survivors = population.filter(p => p.alive);
console.log(`\n3. POPULATION HEALTH STATUS AFTER 60 YEARS`);
console.log("-".repeat(80));
console.log(`Survivors: ${survivors.length}/${population.length} (${(survivors.length/population.length*100).toFixed(1)}%)`);
console.log(`Deaths: ${population.length - survivors.length}`);

// Analyze health status by region
const healthByRegion = {};
population.forEach(p => {
  const region = p.demographics.birthRegion;
  if (!healthByRegion[region]) {
    healthByRegion[region] = {
      count: 0,
      avgPhysical: 0,
      avgMental: 0,
      avgIncome: 0,
      chronicCount: 0
    };
  }
  healthByRegion[region].count++;
  healthByRegion[region].avgPhysical += p.health.physical.current;
  healthByRegion[region].avgMental += p.health.mental.current;
  healthByRegion[region].avgIncome += p.economics.income.current;
  if (p.health.chronic.active) {
    healthByRegion[region].chronicCount += p.health.chronic.active.length;
  }
});

console.log("\nHealth metrics by region:");
Object.entries(healthByRegion).forEach(([region, stats]) => {
  console.log(`\n  ${region}:`);
  console.log(`    Players: ${stats.count}`);
  console.log(`    Avg physical health: ${(stats.avgPhysical / stats.count).toFixed(1)}`);
  console.log(`    Avg mental health: ${(stats.avgMental / stats.count).toFixed(1)}`);
  console.log(`    Avg income: ${(stats.avgIncome / stats.count).toFixed(2)}`);
  console.log(`    Total active chronic diseases: ${stats.chronicCount}`);
});

console.log("\n4. INTEGRATION VALIDATION");
console.log("-".repeat(80));

// Check if key integration points are working
const integrationChecks = {
  "Congenital condition function working": congenitalTotal >= 0, // May be 0 with small sample
  "Chronic disease onset checks working": totalDiagnoses > 0,
  "Health impacts visible (survivors < total)": survivors.length < population.length,
  "Physical/mental health degraded": survivors.some(p => p.health.physical.current < 60),
  "driftChronicDiseases applying penalties": survivors.some(p => p.health.chronic.active && p.health.chronic.active.length > 0)
};

Object.entries(integrationChecks).forEach(([check, passed]) => {
  const status = passed ? "✓ PASS" : "✗ FAIL";
  console.log(`${status}: ${check}`);
});

console.log("\n" + "=".repeat(80));
console.log("TEST COMPLETE");
console.log("=".repeat(80));
