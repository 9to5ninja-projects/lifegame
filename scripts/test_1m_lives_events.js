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
console.log('1M LIFE TEST SUITE - WITH EVENT INTEGRATION');
console.log('='.repeat(80));
console.log(`Testing ${1000000} lives with event integration`);
console.log(`Events available: ${allEvents.length}`);
console.log();

// Create engine with events
const engine = new GameEngine(birthCards, familyCards, allEvents, deathCards);

// Statistics tracking
const stats = {
  totalLives: 0,
  addiction: 0,
  suicideCount: 0,
  crimeCount: 0,
  averageAge: 0,
  deathCauses: {},
  eventOccurrences: 0,
  playersWithEvents: 0,
  topEvents: {}
};

const startTime = Date.now();
const testSize = 1000000;

for (let i = 0; i < testSize; i++) {
  if ((i + 1) % 100000 === 0) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const rate = ((i + 1) / (elapsed)).toFixed(0);
    process.stdout.write(`\rSimulated ${(i+1).toLocaleString()} lives... (${rate} lives/sec)`);
  }

  // Create player
  const bc = birthCards[Math.floor(Math.random() * birthCards.length)];
  const fc = familyCards[Math.floor(Math.random() * familyCards.length)];
  
  engine.createPlayer(bc, fc, {
    sex: Math.random() > 0.5 ? 'male' : 'female'
  });

  let playerHadEvent = false;

  // Simulate life
  while (engine.player.alive && engine.player.demographics.age < 100) {
    const result = engine.processYearEnd(engine.player);
    
    if (engine.player.lastEvent) {
      playerHadEvent = true;
      stats.eventOccurrences++;
      const eventName = engine.player.lastEvent.name;
      stats.topEvents[eventName] = (stats.topEvents[eventName] || 0) + 1;
    }
    
    if (!result.alive) {
      break;
    }
  }

  if (playerHadEvent) stats.playersWithEvents++;

  // Check final state
  stats.totalLives++;
  stats.averageAge += engine.player.demographics.age;

  // Check for conditions at death
  if (engine.player.health.addiction && engine.player.health.addiction.stage === 'dependent') {
    stats.addiction++;
  }

  // Track death causes
  if (engine.player.causeOfDeath) {
    const cause = engine.player.causeOfDeath;
    stats.deathCauses[cause] = (stats.deathCauses[cause] || 0) + 1;

    // Count suicide and crime
    if (cause && cause.includes('Suicide')) {
      stats.suicideCount++;
    }
    if (cause && (cause.includes('Violence') || cause.includes('Crime'))) {
      stats.crimeCount++;
    }
  }
}

const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
const livesSec = (testSize / totalTime).toFixed(0);

console.log(`\r\nSimulation complete in ${totalTime}s (${livesSec} lives/sec)\n`);

// Calculate rates
const addictionRate = (stats.addiction / testSize * 100).toFixed(2);
const suicideRate = (stats.suicideCount / testSize * 100000).toFixed(1);
const crimeRate = (stats.crimeCount / testSize * 100000).toFixed(1);
const avgAge = (stats.averageAge / testSize).toFixed(1);
const eventRate = (stats.eventOccurrences / testSize).toFixed(2);

console.log('='.repeat(80));
console.log('RESULTS');
console.log('='.repeat(80));
console.log();

console.log('Key Statistics:');
console.log(`  Addiction Prevalence:     ${addictionRate}% (target: 4%)`);
console.log(`  Suicide Rate:             ${suicideRate} per 100K (target: 10-15 per 100K)`);
console.log(`  Crime Rate:               ${crimeRate} per 100K (target: 140 per 100K)`);
console.log(`  Average Lifespan:         ${avgAge} years`);
console.log();

console.log('Event System:');
console.log(`  Players with events:      ${stats.playersWithEvents.toLocaleString()} / ${testSize.toLocaleString()} (${(stats.playersWithEvents/testSize*100).toFixed(1)}%)`);
console.log(`  Total events occurred:    ${stats.eventOccurrences.toLocaleString()}`);
console.log(`  Average events/player:    ${eventRate}`);
console.log();

// Death causes
console.log('Top Death Causes:');
const sortedDeaths = Object.entries(stats.deathCauses)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10);

sortedDeaths.forEach(([ cause, count ], idx) => {
  const pct = (count / testSize * 100).toFixed(1);
  console.log(`  ${idx + 1}. ${cause}: ${count} (${pct}%)`);
});

console.log();
console.log('Top Events:');
const sortedEvents = Object.entries(stats.topEvents)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10);

sortedEvents.forEach(([ name, count ], idx) => {
  const pct = (count / stats.eventOccurrences * 100).toFixed(1);
  console.log(`  ${idx + 1}. ${name}: ${count} (${pct}% of events)`);
});

console.log();
console.log('='.repeat(80));
console.log('TEST COMPLETE');
console.log('='.repeat(80));
console.log();
console.log('Target Achievement:');
console.log(`  Addiction: ${addictionRate}% vs 4% target = ${Math.abs(4 - parseFloat(addictionRate)) <= 0.5 ? '✓ PASS' : '✗ FAIL'}`);
console.log(`  Suicide: ${suicideRate}/100K vs 10-15/100K target = ${parseFloat(suicideRate) > 5 ? '✓ IMPROVING' : '⏳ NEEDS WORK'}`);
console.log(`  Crime: ${crimeRate}/100K vs 140/100K target = ${parseFloat(crimeRate) > 50 ? '✓ IMPROVING' : '⏳ NEEDS WORK'}`);
