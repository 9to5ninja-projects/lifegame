// More detailed bug finding
const MortalityGameIntegrated = require('../game_engine_integrated.js');
const fs = require('fs');

// Load cards
const birthCards = JSON.parse(fs.readFileSync('../data/birth_cards_json.json', 'utf8'));
const familyCards = JSON.parse(fs.readFileSync('../data/family_cards_json.json', 'utf8'));
const eventCardsChildhood = JSON.parse(fs.readFileSync('../data/event_cards_childhood_v2.json', 'utf8'));
const eventCardsTeens = JSON.parse(fs.readFileSync('../data/event_cards_teen_v2.json', 'utf8'));
const eventCardsAdult = JSON.parse(fs.readFileSync('../data/event_cards_adult_v2.json', 'utf8'));
const deathCards = JSON.parse(fs.readFileSync('../data/death_cards_json.json', 'utf8'));

// Combine event cards
const allEventCards = [
  ...eventCardsChildhood,
  ...eventCardsTeens,
  ...eventCardsAdult
];

console.log(`🔍 DETAILED BUG FINDER...\n`);

const game = new MortalityGameIntegrated(birthCards, familyCards, allEventCards, deathCards);
game.createPlayer();

console.log(`After createPlayer:`);
console.log(`  Health physical.value:`, game.player.health.physical.value);
console.log(`  Health physical.current:`, game.player.health.physical.current);
console.log(`  Health physical.baseline:`, game.player.health.physical.baseline);
console.log(`  Health physical.drift:`, game.player.health.physical.drift);
console.log(`  Age:`, game.player.demographics.age);

console.log(`\n--- First nextYear ---`);
const result1 = game.nextYear();
console.log(`After nextYear:`);
console.log(`  Health physical.value:`, game.player.health.physical.value);
console.log(`  Health physical.current:`, game.player.health.physical.current);
console.log(`  Health physical.baseline:`, game.player.health.physical.baseline);
console.log(`  Health physical.drift:`, game.player.health.physical.drift);
console.log(`  Age:`, game.player.demographics.age);


