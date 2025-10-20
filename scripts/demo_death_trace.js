/**
 * DEATH TRACE DEMO
 * 
 * Runs a single simulated life to age of death, then prints the complete
 * causal chain showing what events led to that death.
 */

const fs = require('fs');
const path = require('path');
const MortalityGameV2 = require(path.join(__dirname, '../game_engine_v2_homeostatic.js'));
const DeathTracer = require(path.join(__dirname, '../death_trace_system.js'));

// Load game data
console.log(`\n>>> Loading game data from ${path.join(__dirname, '..')}`);
const birthCards = JSON.parse(fs.readFileSync(path.join(__dirname, '../birth_cards_json.json'), 'utf8'));
const familyCards = JSON.parse(fs.readFileSync(path.join(__dirname, '../family_cards_json.json'), 'utf8'));
const eventCards = {
  childhood: JSON.parse(fs.readFileSync(path.join(__dirname, '../event_cards_childhood.json'), 'utf8')),
  teen: JSON.parse(fs.readFileSync(path.join(__dirname, '../event_cards_teen.json'), 'utf8')),
  adult: JSON.parse(fs.readFileSync(path.join(__dirname, '../event_cards_adult.json'), 'utf8')),
};
const deathCards = JSON.parse(fs.readFileSync(path.join(__dirname, '../death_cards_json.json'), 'utf8'));

// Create engine and tracer
const engine = new MortalityGameV2(birthCards, familyCards, eventCards, deathCards);
const tracer = new DeathTracer();

// Pick a birth card and run life
const birthCard = birthCards[0]; // Nordic Country
console.log(`\n>>> Simulating life starting from: ${birthCard.name}`);

engine.createPlayer(birthCard, familyCards[0]);
const player = engine.player;

// Initialize life log
tracer.initializeLifeLog(player);

// Run life year by year, logging events
let age = 0;
while (player.alive && age < 150) {
  engine.processYearEnd(player);

  // Check if dead
  if (!player.alive) {
    console.log(`\n>>> Player died at age ${player.demographics.age} from: ${player.causeOfDeath}`);
    break;
  }
}

// Print death trace report
console.log('\n\n>>> Generating Death Trace Report...\n');
tracer.printDeathTrace(player, false); // Set to true for full timeline

// Print causal chain
const chain = tracer.traceCausalChain(player);
console.log('\nCAUSAL CHAIN SUMMARY:');
console.log(JSON.stringify(chain, null, 2));

// Export to file for analysis
const exported = tracer.exportDeathTrace(player);
fs.writeFileSync(
  './death_trace_output.json',
  JSON.stringify(exported, null, 2)
);
console.log('\n>>> Full trace exported to death_trace_output.json');
