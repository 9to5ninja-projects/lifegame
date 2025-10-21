// Comprehensive gameplay test - extended play to find edge cases
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

const stats = {
  gamesPlayed: 0,
  totalYears: 0,
  maxAge: 0,
  minAge: 999,
  avgAge: 0,
  deathCauses: {},
  events: {},
  errors: []
};

console.log(`🎮 COMPREHENSIVE GAMEPLAY TEST\n`);
console.log(`Playing 20 full games...\n`);

for (let gameNum = 0; gameNum < 20; gameNum++) {
  try {
    const game = new MortalityGameIntegrated(birthCards, familyCards, allEventCards, deathCards);
    game.createPlayer();
    
    const birthRegion = game.player.demographics.birthRegion;
    const sex = game.player.demographics.sex;
    
    let yearCount = 0;
    const events = [];

    while (game.player.alive && game.player.demographics.age < 120) {
      try {
        const result = game.nextYear();
        yearCount++;

        if (result.event) {
          events.push(`Age ${game.player.demographics.age}: ${result.event.name}`);
          stats.events[result.event.name] = (stats.events[result.event.name] || 0) + 1;
        }

        if (!result.alive) {
          break;
        }
      } catch (e) {
        stats.errors.push(`Game #${gameNum}, Year ${yearCount}: ${e.message}`);
        break;
      }
    }

    const age = game.player.demographics.age;
    const cause = game.player.causeOfDeath ? game.player.causeOfDeath.name : 'Folded';
    
    stats.gamesPlayed++;
    stats.totalYears += age;
    stats.maxAge = Math.max(stats.maxAge, age);
    stats.minAge = Math.min(stats.minAge, age);
    stats.deathCauses[cause] = (stats.deathCauses[cause] || 0) + 1;

    if (gameNum % 5 === 0) {
      console.log(`Game #${gameNum}: ${sex.toUpperCase()} from ${birthRegion}, lived to ${age} (${events.length} events)`);
      if (events.length > 0) {
        console.log(`  Events: ${events.slice(-3).join(' → ')}`);
      }
    }

  } catch (e) {
    console.error(`FATAL ERROR in Game #${gameNum}: ${e.message}`);
    stats.errors.push(`Game #${gameNum} creation: ${e.message}`);
  }
}

stats.avgAge = Math.round(stats.totalYears / stats.gamesPlayed);

console.log(`\n📊 RESULTS:\n`);
console.log(`  Games Played: ${stats.gamesPlayed}`);
console.log(`  Total Years: ${stats.totalYears}`);
console.log(`  Average Age: ${stats.avgAge}`);
console.log(`  Max Age: ${stats.maxAge}`);
console.log(`  Min Age: ${stats.minAge}`);

console.log(`\n💀 DEATH CAUSES:`);
Object.entries(stats.deathCauses)
  .sort((a, b) => b[1] - a[1])
  .forEach(([cause, count]) => {
    console.log(`  ${cause}: ${count} (${Math.round(count / stats.gamesPlayed * 100)}%)`);
  });

if (stats.events) {
  const topEvents = Object.entries(stats.events)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  
  console.log(`\n📖 TOP 10 EVENTS:`);
  topEvents.forEach(([event, count]) => {
    console.log(`  ${event}: ${count} times`);
  });
}

if (stats.errors.length > 0) {
  console.log(`\n❌ ERRORS (${stats.errors.length}):`);
  stats.errors.slice(0, 5).forEach(err => console.log(`  • ${err}`));
  if (stats.errors.length > 5) {
    console.log(`  ... and ${stats.errors.length - 5} more`);
  }
} else {
  console.log(`\n✅ NO ERRORS`);
}


