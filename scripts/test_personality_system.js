/**
 * Test personality and loneliness system
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

console.log('Testing 10 lives to see personality/loneliness distribution:\n');

const stats = {
  introvert: 0,
  ambivert: 0,
  extrovert: 0,
  isolated: 0,
  lonely: 0,
  content: 0,
};

for (let i = 0; i < 10; i++) {
  const tracer = new DeathTracer();
  const engine = new MortalityGameV2(birthCards, familyCards, eventCards, deathCards, tracer);
  
  engine.createPlayer(nordicBirth, familyCards[0], { sex: Math.random() > 0.5 ? 'male' : 'female' });
  const player = engine.player;
  
  while (player.alive && player.demographics.age < 120) {
    engine.processYearEnd(player);
  }
  
  const socialNeeds = player.personality?.socialNeeds || 50;
  const loneliness = player.relationships?.loneliness || 0;
  const isolated = player.relationships?.social?.isolation || false;
  const friends = player.relationships?.social?.friends || 0;
  const fulfillment = player.relationships?.socialHealthScore || 0;
  
  // Categorize personality
  let personality = 'ambivert';
  if (socialNeeds < 33) {
    personality = 'introvert';
    stats.introvert++;
  } else if (socialNeeds > 66) {
    personality = 'extrovert';
    stats.extrovert++;
  } else {
    stats.ambivert++;
  }
  
  // Categorize wellbeing
  if (isolated) stats.isolated++;
  if (loneliness > 20) stats.lonely++;
  if (loneliness < 15 && fulfillment > 40) stats.content++;
  
  console.log(`Life ${i+1}:`);
  console.log(`  Personality: ${personality} (needs: ${socialNeeds.toFixed(0)})`);
  console.log(`  Friends: ${friends}, Isolated: ${isolated}`);
  console.log(`  Fulfillment: ${fulfillment.toFixed(1)}, Loneliness: ${loneliness.toFixed(1)}`);
  console.log(`  Age at death: ${player.demographics.age}, Cause: ${player.causeOfDeath}`);
  console.log();
}

console.log('='.repeat(60));
console.log('Summary Statistics:');
console.log(`  Introverts: ${stats.introvert}/10 (${stats.introvert*10}%)`);
console.log(`  Ambiverts: ${stats.ambivert}/10 (${stats.ambivert*10}%)`);
console.log(`  Extroverts: ${stats.extrovert}/10 (${stats.extrovert*10}%)`);
console.log();
console.log(`  Isolated (at death): ${stats.isolated}/10 (${stats.isolated*10}%)`);
console.log(`  Lonely (>20): ${stats.lonely}/10 (${stats.lonely*10}%)`);
console.log(`  Content (<15 loneliness, >40 fulfillment): ${stats.content}/10 (${stats.content*10}%)`);
