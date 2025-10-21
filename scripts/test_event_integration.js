const GameEngine = require('../game_engine_v2_homeostatic.js');
const fs = require('fs');

// Load all card types
const eventCardsAdult = JSON.parse(fs.readFileSync('../data/event_cards_adult_v2.json', 'utf8'));
const eventCardsChildhood = JSON.parse(fs.readFileSync('../data/event_cards_childhood_v2.json', 'utf8'));
const eventCardsTeens = JSON.parse(fs.readFileSync('../data/event_cards_teen_v2.json', 'utf8'));
const familyCards = JSON.parse(fs.readFileSync('../data/family_cards_json.json', 'utf8'));
const birthCards = JSON.parse(fs.readFileSync('../data/birth_cards_json.json', 'utf8'));
const deathCards = JSON.parse(fs.readFileSync('../data/death_cards_json.json', 'utf8'));

// Combine all events
const allEvents = [...eventCardsAdult, ...eventCardsChildhood, ...eventCardsTeens];

console.log('='.repeat(80));
console.log('EVENT SYSTEM INTEGRATION TEST');
console.log('='.repeat(80));
console.log(`Loaded ${allEvents.length} total events`);
console.log(`  - Adult events: ${eventCardsAdult.length}`);
console.log(`  - Childhood events: ${eventCardsChildhood.length}`);
console.log(`  - Teen events: ${eventCardsTeens.length}`);
console.log();

// Create engine with events
const engine = new GameEngine(birthCards, familyCards, allEvents, deathCards);

// Test 1: Create a player and simulate some years
console.log('TEST 1: Single Player Event Simulation');
console.log('-'.repeat(80));

// Select random birth and family cards
const birthCard = birthCards[Math.floor(Math.random() * birthCards.length)];
const familyCard = familyCards[Math.floor(Math.random() * familyCards.length)];

engine.createPlayer(birthCard, familyCard, {
  sex: 'male'
});

const player = engine.player;
let eventLog = [];

// Simulate 10 years
for (let year = 0; year < 10; year++) {
  const startState = {
    age: player.demographics.age,
    health: player.health.mental.current,
    resources: player.economics.resources.current
  };

  const result = engine.processYearEnd(player);

  const event = player.lastEvent;
  if (event) {
    eventLog.push({
      year: year + 1,
      age: player.demographics.age,
      event: event.name,
      eventId: event.id,
      healthChange: player.health.mental.current - startState.health,
      resourceChange: player.economics.resources.current - startState.resources
    });
    
    console.log(`Year ${year + 1} (Age ${player.demographics.age}): ${event.name}`);
    console.log(`  Mental Health: ${startState.health.toFixed(1)} → ${player.health.mental.current.toFixed(1)}`);
    console.log(`  Resources: ${startState.resources.toFixed(1)} → ${player.economics.resources.current.toFixed(1)}`);
  }
  
  if (!result.alive) {
    console.log(`Player died at age ${player.demographics.age}: ${result.cause}`);
    break;
  }
}

console.log();
console.log(`Events occurred: ${eventLog.length}`);
if (eventLog.length > 0) {
  console.log('Event log:');
  eventLog.forEach(e => {
    console.log(`  Age ${e.age}: ${e.event}`);
  });
}

// Test 2: Prerequisite checking
console.log();
console.log('TEST 2: Prerequisite Validation');
console.log('-'.repeat(80));

const birthCard2 = birthCards[Math.floor(Math.random() * birthCards.length)];
const familyCard2 = familyCards[Math.floor(Math.random() * familyCards.length)];

engine.createPlayer(birthCard2, familyCard2, {
  sex: 'female'
});

const player2 = engine.player;

// Test age range filtering
const childEventsAvailable = engine.getAvailableEvents(player2);
console.log(`Age ${player2.demographics.age}: ${childEventsAvailable.length} events available`);

// Age player up to 25
player2.demographics.age = 25;
const adultEventsAvailable = engine.getAvailableEvents(player2);
console.log(`Age ${player2.demographics.age}: ${adultEventsAvailable.length} events available`);

// Age player to 70
player2.demographics.age = 70;
const elderEventsAvailable = engine.getAvailableEvents(player2);
console.log(`Age ${player2.demographics.age}: ${elderEventsAvailable.length} events available`);

// Test 3: Event statistics (1000 player simulation with events)
console.log();
console.log('TEST 3: Event Statistics (1000 lives)');
console.log('-'.repeat(80));

const eventStats = {};
let totalEventsOccurred = 0;
let playersWithEvents = 0;
const maxAge = 80;

for (let i = 0; i < 1000; i++) {
  const bc = birthCards[Math.floor(Math.random() * birthCards.length)];
  const fc = familyCards[Math.floor(Math.random() * familyCards.length)];
  
  engine.createPlayer(bc, fc, {
    sex: Math.random() > 0.5 ? 'male' : 'female'
  });
  
  let playerHadEvent = false;
  
  while (engine.player.demographics.age < maxAge && engine.player.alive) {
    const result = engine.processYearEnd(engine.player);
    if (engine.player.lastEvent) {
      playerHadEvent = true;
      totalEventsOccurred++;
      const eventName = engine.player.lastEvent.name;
      eventStats[eventName] = (eventStats[eventName] || 0) + 1;
    }
    if (!result.alive) break;
  }
  
  if (playerHadEvent) playersWithEvents++;
}

console.log(`Players with at least one event: ${playersWithEvents}/1000 (${(playersWithEvents/10).toFixed(1)}%)`);
console.log(`Total events occurred: ${totalEventsOccurred}`);
console.log(`Average events per player: ${(totalEventsOccurred/1000).toFixed(2)}`);
console.log();

// Show top events
const topEvents = Object.entries(eventStats)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10);

console.log('Top 10 most common events:');
topEvents.forEach(([ name, count ], idx) => {
  console.log(`  ${idx + 1}. ${name}: ${count} times (${(count/10).toFixed(1)}%)`);
});

// Test 4: Crisis event chains
console.log();
console.log('TEST 4: Crisis Event Chain Detection');
console.log('-'.repeat(80));

// Look for potential crisis chains in the event data
const jobLossEvents = allEvents.filter(e => e.name && e.name.toLowerCase().includes('job') && e.name.toLowerCase().includes('loss'));
const depressionEvents = allEvents.filter(e => e.name && (e.name.toLowerCase().includes('depri') || e.name.toLowerCase().includes('divorce')));
const addictionEvents = allEvents.filter(e => e.name && (e.name.toLowerCase().includes('substance') || e.name.toLowerCase().includes('addiction')));

console.log(`Job loss events: ${jobLossEvents.length}`);
if (jobLossEvents.length > 0) {
  jobLossEvents.slice(0, 3).forEach(e => console.log(`  - ${e.name}`));
}

console.log(`Depression/relationship events: ${depressionEvents.length}`);
if (depressionEvents.length > 0) {
  depressionEvents.slice(0, 3).forEach(e => console.log(`  - ${e.name}`));
}

console.log(`Addiction events: ${addictionEvents.length}`);
if (addictionEvents.length > 0) {
  addictionEvents.slice(0, 3).forEach(e => console.log(`  - ${e.name}`));
}

console.log();
console.log('='.repeat(80));
console.log('EVENT INTEGRATION TEST COMPLETE');
console.log('='.repeat(80));

