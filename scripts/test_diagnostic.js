const GameEngine = require('../game_engine_v2_homeostatic.js');
const fs = require('fs');

// Load all card types
const eventCardsAdult = JSON.parse(fs.readFileSync('./event_cards_adult_v2.json', 'utf8'));
const eventCardsChildhood = JSON.parse(fs.readFileSync('./event_cards_childhood_v2.json', 'utf8'));
const eventCardsTeens = JSON.parse(fs.readFileSync('./event_cards_teen_v2.json', 'utf8'));
const familyCards = JSON.parse(fs.readFileSync('./family_cards_json.json', 'utf8'));
const birthCards = JSON.parse(fs.readFileSync('./birth_cards_json.json', 'utf8'));
const deathCards = JSON.parse(fs.readFileSync('./death_cards_json.json', 'utf8'));

// Combine all events
const allEvents = [...eventCardsAdult, ...eventCardsChildhood, ...eventCardsTeens];

console.log('='.repeat(80));
console.log('QUICK DIAGNOSTIC TEST');
console.log('='.repeat(80));

const engine = new GameEngine(birthCards, familyCards, allEvents, deathCards);

// Test 1: Check birth card and family card structure
console.log('Birth Cards:', birthCards.length);
console.log('Sample birth card:');
if (birthCards[0]) {
  console.log(JSON.stringify(birthCards[0], null, 2).split('\n').slice(0, 20).join('\n'));
}

console.log();
console.log('Family Cards:', familyCards.length);
console.log('Sample family card:');
if (familyCards[0]) {
  console.log(JSON.stringify(familyCards[0], null, 2).split('\n').slice(0, 20).join('\n'));
}

console.log();
console.log('='.repeat(80));

// Test 2: Create a test player and check their addiction state
const bc = birthCards[0];
const fc = familyCards[0];

engine.createPlayer(bc, fc);

console.log('Initial player state:');
console.log('  Age:', engine.player.demographics.age);
console.log('  Birth Region:', engine.player.demographics.birthRegion);
console.log('  Survival:', engine.player.survival);
console.log('  Addiction stage:', engine.player.addiction.stage);
console.log('  Health mental:', engine.player.health.mental.current);
console.log('  Health physical:', engine.player.health.physical.current);

// Simulate to adulthood
while (engine.player.demographics.age < 25 && engine.player.alive) {
  const result = engine.processYearEnd(engine.player);
  if (!engine.player.alive) {
    console.log('  Died at age:', engine.player.demographics.age);
    console.log('  Cause:', engine.player.causeOfDeath);
    break;
  }
}

console.log();
console.log('At age 25 (or death):');
console.log('  Age:', engine.player.demographics.age);
console.log('  Birth Region:', engine.player.demographics.birthRegion);
console.log('  Addiction stage:', engine.player.addiction.stage);
console.log('  Addiction substance:', engine.player.addiction.substance);
console.log('  Mental health:', engine.player.health.mental.current);
console.log('  Physical health:', engine.player.health.physical.current);
console.log('  Alive:', engine.player.alive);
console.log('  Cause of death:', engine.player.causeOfDeath);
