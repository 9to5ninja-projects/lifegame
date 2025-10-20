/**
 * Debug relationships system to see why friends aren't growing
 */

const MortalityGameV2 = require('../game_engine_v2_homeostatic.js');
const DeathTracer = require('../death_trace_system.js');
const birthCards = require('../birth_cards_json.json');
const familyCards = require('../family_cards_json.json');
const deathCards = require('../death_cards_json.json');

const eventCardsChildhood = require('../event_cards_childhood.json');
const eventCardsTeen = require('../event_cards_teen.json');
const eventCardsAdult = require('../event_cards_adult.json');
const eventCards = [...eventCardsChildhood, ...eventCardsTeen, ...eventCardsAdult];

const nordicBirth = birthCards.find(b => b.name === 'Nordic Country');

const tracer = new DeathTracer();
const engine = new MortalityGameV2(birthCards, familyCards, eventCards, deathCards, tracer);

engine.createPlayer(nordicBirth, familyCards[0], { sex: 'male' });
const player = engine.player;

console.log('Initial state:');
console.log('  Friends:', player.relationships?.social?.friends);
console.log('  Isolation:', player.relationships?.social?.isolation);
console.log('  Age:', player.demographics.age);

// Process first 20 years
for (let year = 0; year < 20; year++) {
  const ageBefore = player.demographics.age;
  const friendsBefore = player.relationships?.social?.friends || 0;
  
  engine.processYearEnd(player);
  
  const ageAfter = player.demographics.age;
  const friendsAfter = player.relationships?.social?.friends || 0;
  
  if (friendsAfter !== friendsBefore || year < 5) {
    console.log(`\nYear ${year + 1}: Age ${ageBefore} → ${ageAfter}`);
    console.log(`  Friends: ${friendsBefore} → ${friendsAfter}`);
    console.log(`  Isolation: ${player.relationships?.social?.isolation}`);
    console.log(`  Life stage: ${player.demographics?.lifeStage}`);
  }
  
  if (!player.alive) {
    console.log(`\nDied at age ${player.demographics.age}`);
    break;
  }
}

console.log('\n\nFinal state:');
console.log('  Age:', player.demographics.age);
console.log('  Friends:', player.relationships?.social?.friends);
console.log('  Isolation:', player.relationships?.social?.isolation);
console.log('  Alive:', player.alive);
