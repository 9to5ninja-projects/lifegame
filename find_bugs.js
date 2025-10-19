// Bug finder - play many games looking for console errors and edge cases
const MortalityGameIntegrated = require('./game_engine_integrated.js');
const fs = require('fs');

// Load cards
const birthCards = JSON.parse(fs.readFileSync('./birth_cards_json.json', 'utf8'));
const familyCards = JSON.parse(fs.readFileSync('./family_cards_json.json', 'utf8'));
const eventCardsChildhood = JSON.parse(fs.readFileSync('./event_cards_childhood_v2.json', 'utf8'));
const eventCardsTeens = JSON.parse(fs.readFileSync('./event_cards_teen_v2.json', 'utf8'));
const eventCardsAdult = JSON.parse(fs.readFileSync('./event_cards_adult_v2.json', 'utf8'));
const deathCards = JSON.parse(fs.readFileSync('./death_cards_json.json', 'utf8'));

// Combine event cards
const allEventCards = [
  ...eventCardsChildhood,
  ...eventCardsTeens,
  ...eventCardsAdult
];

const bugs = [];
const warnings = [];

console.log(`🔍 SEARCHING FOR BUGS...\n`);

for (let gameNum = 0; gameNum < 50; gameNum++) {
  try {
    const game = new MortalityGameIntegrated(birthCards, familyCards, allEventCards, deathCards);
    game.createPlayer();

    if (!game.player) {
      bugs.push(`Game #${gameNum}: No player created`);
      continue;
    }

    let eventsCount = 0;
    
    while (game.player.alive && game.player.demographics.age < 120) {
      try {
        const result = game.nextYear();
        
        if (!result) {
          bugs.push(`Game #${gameNum}, Age ${game.player.demographics.age}: nextYear() returned null`);
          break;
        }

        if (result.alive === false && !game.player.causeOfDeath) {
          bugs.push(`Game #${gameNum}, Age ${game.player.demographics.age}: Dead but no cause of death`);
        }

        // Check for NaN values
        if (isNaN(game.player.demographics.age)) {
          bugs.push(`Game #${gameNum}: Age is NaN`);
          break;
        }

        if (isNaN(game.player.health.physical.current)) {
          bugs.push(`Game #${gameNum}, Age ${game.player.demographics.age}: Physical health is NaN`);
        }

        if (isNaN(game.player.health.mental.current)) {
          bugs.push(`Game #${gameNum}, Age ${game.player.demographics.age}: Mental health is NaN`);
        }

        if (isNaN(game.player.economics.resources.current)) {
          bugs.push(`Game #${gameNum}, Age ${game.player.demographics.age}: Resources is NaN`);
        }

        // Check for missing critical fields
        if (!game.player.demographics) {
          bugs.push(`Game #${gameNum}, Age ${game.player.age}: Missing demographics`);
        }

        if (!game.player.health) {
          bugs.push(`Game #${gameNum}, Age ${game.player.age}: Missing health`);
        }

        // Check event history
        if (result.event && result.event.id) {
          eventsCount++;
        }

      } catch (e) {
        bugs.push(`Game #${gameNum}, Age ${game.player.demographics.age}: ${e.message}`);
        break;
      }
    }

    if (gameNum % 10 === 0) {
      process.stdout.write('.');
    }

  } catch (e) {
    bugs.push(`Game #${gameNum} creation: ${e.message}`);
  }
}

console.log(`\n\n📋 RESULTS:\n`);

if (bugs.length === 0) {
  console.log('✅ NO BUGS FOUND!');
} else {
  console.log(`❌ FOUND ${bugs.length} BUG(S):\n`);
  bugs.slice(0, 20).forEach(bug => console.log(`  • ${bug}`));
  if (bugs.length > 20) {
    console.log(`  ... and ${bugs.length - 20} more`);
  }
}

if (warnings.length > 0) {
  console.log(`\n⚠️  WARNINGS (${warnings.length}):\n`);
  warnings.slice(0, 10).forEach(w => console.log(`  • ${w}`));
}
