/**
 * Diagnostic test for relationships system
 * Tests a single life and tracks friend count changes year by year
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

console.log('='.repeat(80));
console.log('RELATIONSHIPS SYSTEM DIAGNOSTIC');
console.log('='.repeat(80));

const tracer = new DeathTracer();
const engine = new MortalityGameV2(birthCards, familyCards, eventCards, deathCards, tracer);

const nordicBirth = birthCards.find(b => b.name === 'Nordic Country');

engine.createPlayer(nordicBirth, familyCards[0], {
  sex: 'female'
});

const player = engine.player;

console.log('\nInitial State:');
console.log(`  Age: ${player.demographics.age}`);
console.log(`  Friends: ${player.relationships?.social?.friends || 'UNDEFINED'}`);
console.log(`  Isolated: ${player.relationships?.social?.isolation || 'UNDEFINED'}`);
console.log(`  Married: ${player.relationships?.social?.married || 'UNDEFINED'}`);

console.log('\nYear-by-Year Tracking:');
console.log('Age | Friends | Isolated | Married | Physical | Mental');
console.log('-'.repeat(60));

const milestones = [0, 5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90];
let lastMilestone = 0;

while (player.alive && player.demographics.age < 100) {
  engine.processYearEnd(player);
  
  const age = player.demographics.age;
  
  // Print at milestones or major changes
  if (milestones.includes(age) || age === lastMilestone + 10) {
    const friends = player.relationships?.social?.friends || 0;
    const isolated = player.relationships?.social?.isolation ? 'YES' : 'NO';
    const married = player.relationships?.social?.married ? 'YES' : 'NO';
    const phys = Math.round(player.health.physical.current);
    const ment = Math.round(player.health.mental.current);
    
    console.log(`${age.toString().padStart(3)} | ${friends.toString().padStart(7)} | ${isolated.padEnd(8)} | ${married.padEnd(7)} | ${phys.toString().padStart(8)} | ${ment.toString().padStart(6)}`);
    lastMilestone = age;
  }
}

console.log('\nFinal State at Death:');
console.log(`  Age: ${player.demographics.age}`);
console.log(`  Cause: ${player.causeOfDeath}`);
console.log(`  Friends: ${player.relationships?.social?.friends || 0}`);
console.log(`  Isolated: ${player.relationships?.social?.isolation}`);
console.log(`  Married: ${player.relationships?.social?.married}`);
console.log(`  Has Partner: ${player.relationships?.social?.partner ? 'YES' : 'NO'}`);

// Check if relationships object structure is correct
console.log('\nRelationships Object Structure:');
console.log(JSON.stringify(player.relationships, null, 2));
