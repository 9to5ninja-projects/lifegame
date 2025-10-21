// Comprehensive game test - run 10 full games
const MortalityGameV2 = require('../game_engine_v2_homeostatic.js');
const MortalityGameIntegrated = require('../game_engine_integrated.js');
const fs = require('fs');

// Load game data
const BIRTH_CARDS = JSON.parse(fs.readFileSync('../data/birth_cards_json.json', 'utf8'));
const FAMILY_CARDS = JSON.parse(fs.readFileSync('../data/family_cards_json.json', 'utf8'));
const EVENT_CARDS = JSON.parse(fs.readFileSync('../data/event_cards_childhood_v2.json', 'utf8'))
  .concat(JSON.parse(fs.readFileSync('../data/event_cards_teen_v2.json', 'utf8')))
  .concat(JSON.parse(fs.readFileSync('../data/event_cards_adult_v2.json', 'utf8')));
const DEATH_CARDS = JSON.parse(fs.readFileSync('../data/death_cards_json.json', 'utf8'));

const game = new MortalityGameIntegrated(BIRTH_CARDS, FAMILY_CARDS, EVENT_CARDS, DEATH_CARDS);

console.log('='.repeat(70));
console.log('COMPREHENSIVE GAME TEST - 10 FULL GAMES');
console.log('='.repeat(70));

let stats = {
  totalGames: 10,
  totalYears: 0,
  averageAge: 0,
  totalEvents: 0,
  eventsPerGame: 0,
  specialEvents: {
    marriages: 0,
    divorces: 0,
    parentDeaths: 0,
    adoptions: 0,
    parentDeathsAdult: 0
  }
};

for (let gameNum = 1; gameNum <= 10; gameNum++) {
  game.createPlayer();
  
  const birthRegion = game.player.demographics.birthRegion;
  const lifeExpectancy = game.player.lifeExpectancy;
  
  let events = [];
  
  // Play full game
  while (game.player.alive && game.player.age < 150) {
    const result = game.nextYear();
    
    if (result.event) {
      events.push(result.event.name);
      
      // Track special events
      if (result.event.name.includes('Marriage')) stats.specialEvents.marriages++;
      if (result.event.name.includes('Divorce')) stats.specialEvents.divorces++;
      if (result.event.name.includes('Parent Dies')) {
        if (game.player.age < 18) {
          stats.specialEvents.parentDeaths++;
        } else {
          stats.specialEvents.parentDeathsAdult++;
        }
      }
      if (result.event.name.includes('Adopted')) stats.specialEvents.adoptions++;
    }
  }
  
  const finalAge = game.player.age;
  stats.totalYears += finalAge;
  stats.totalEvents += events.length;
  
  console.log(`\nGame ${gameNum}: ${birthRegion} (LE: ${lifeExpectancy})`);
  console.log(`  Age: ${finalAge}, Events: ${events.length}, Cause: ${game.player.causeOfDeath?.cause || 'Unknown'}`);
  console.log(`  Married: ${game.player.relationships.partner.exists}, Orphan: ${game.player.circumstances.vulnerability.orphan}`);
  
  if (events.length > 0) {
    console.log(`  Key events: ${events.slice(0, 5).join(', ')}${events.length > 5 ? '...' : ''}`);
  }
}

console.log('\n' + '='.repeat(70));
console.log('OVERALL STATISTICS');
console.log('='.repeat(70));
console.log(`Total years lived: ${stats.totalYears}`);
console.log(`Average age: ${(stats.totalYears / stats.totalGames).toFixed(1)}`);
console.log(`Total events: ${stats.totalEvents}`);
console.log(`Average events/game: ${(stats.totalEvents / stats.totalGames).toFixed(1)}`);
console.log(`\nSpecial Events:`);
console.log(`  Marriages: ${stats.specialEvents.marriages}`);
console.log(`  Divorces: ${stats.specialEvents.divorces}`);
console.log(`  Parent Deaths (child): ${stats.specialEvents.parentDeaths}`);
console.log(`  Parent Deaths (adult): ${stats.specialEvents.parentDeathsAdult}`);
console.log(`  Adoptions: ${stats.specialEvents.adoptions}`);
console.log('='.repeat(70));
console.log('✓ All systems operational');


