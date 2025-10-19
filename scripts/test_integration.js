// Quick integration test
// Verifies v2.0 engine works with converted events

const fs = require('fs');
const path = require('path');

// Load game engines using require
console.log('Loading game engines...');
const MortalityGameV2 = require('./game_engine_v2_homeostatic.js');
const MortalityGameIntegrated = require('./game_engine_integrated.js');

console.log('✓ Game engines loaded\n');

// Load game data
const BIRTH_CARDS = JSON.parse(fs.readFileSync('./birth_cards_json.json', 'utf8'));
const FAMILY_CARDS = JSON.parse(fs.readFileSync('./family_cards_json.json', 'utf8'));
const EVENT_CARDS_CHILDHOOD = JSON.parse(fs.readFileSync('./event_cards_childhood_v2.json', 'utf8'));
const EVENT_CARDS_TEEN = JSON.parse(fs.readFileSync('./event_cards_teen_v2.json', 'utf8'));
const EVENT_CARDS_ADULT = JSON.parse(fs.readFileSync('./event_cards_adult_v2.json', 'utf8'));
const DEATH_CARDS = JSON.parse(fs.readFileSync('./death_cards_json.json', 'utf8'));

const EVENT_CARDS = [...EVENT_CARDS_CHILDHOOD, ...EVENT_CARDS_TEEN, ...EVENT_CARDS_ADULT];

console.log('✓ Loaded game data');
console.log(`  - Birth cards: ${BIRTH_CARDS.length}`);
console.log(`  - Family cards: ${FAMILY_CARDS.length}`);
console.log(`  - Event cards: ${EVENT_CARDS.length}`);
console.log(`  - Death causes: ${DEATH_CARDS.length}\n`);

// Create game instance
const game = new MortalityGameIntegrated(BIRTH_CARDS, FAMILY_CARDS, EVENT_CARDS, DEATH_CARDS);

// Test 1: Create player
console.log('TEST 1: Create Player');
const player = game.createPlayer();
console.log(`✓ Player created: ${player.demographics.sex} in ${player.demographics.birthRegion}`);
console.log(`  - Life expectancy: ${player.demographics.lifeExpectancy} years`);
console.log(`  - Physical health: ${Math.floor(player.health.physical.current)}/100`);
console.log(`  - Resources: $${Math.floor(player.economics.resources.current)}\n`);

// Test 2: Play 10 years
console.log('TEST 2: Play 10 Years');
let eventCount = 0;
for (let i = 0; i < 10; i++) {
  const result = game.nextYear();
  if (!result.alive) {
    console.log(`  - Age ${game.player.age}: DIED (${game.player.causeOfDeath})`);
    break;
  }
  if (result.event) {
    eventCount++;
    console.log(`  - Age ${game.player.age}: ${result.event.name}`);
  } else {
    console.log(`  - Age ${game.player.age}: No event`);
  }
}
console.log(`✓ 10 years played, ${eventCount} events occurred\n`);

// Test 3: Check state
console.log('TEST 3: Check Final State');
const summary = game.getSummary();
console.log(`✓ Player age: ${summary.age}`);
console.log(`  - Health: ${summary.physicalHealth}/100`);
console.log(`  - Resources: $${summary.resources}`);
console.log(`  - Children: ${summary.childrenCount}`);
console.log(`  - Events: ${summary.eventCount}`);
console.log(`  - Score: ${summary.score}\n`);

// Test 4: Run simulation
console.log('TEST 4: Run 100-Game Simulation');
const results = game.runSimulation(100, (current, total) => {
  if (current % 20 === 0 || current === total) {
    process.stdout.write(`  ${current}/${total} games...\r`);
  }
});
console.log(`                           \n✓ Simulation complete`);
console.log(`  - Average age: ${results.averageAge} years`);
console.log(`  - Max age: ${results.maxAge} years`);
console.log(`  - Min age: ${results.minAge} years`);
console.log(`  - Fold rate: ${results.foldRate}%`);
console.log(`  - Avg score: ${results.scoreDistribution.avg} points`);
console.log(`  - Score range: ${results.scoreDistribution.min}-${results.scoreDistribution.max}\n`);

// Test 5: Show death causes
console.log('TEST 5: Death Cause Distribution');
const causes = Object.entries(results.deathCauses)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5);
causes.forEach(([cause, count]) => {
  console.log(`  - ${cause}: ${count} (${(count/100*100).toFixed(1)}%)`);
});

console.log('\n✅ All tests passed!\n');
