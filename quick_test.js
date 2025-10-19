#!/usr/bin/env node
/**
 * Quick Test: Run a 100-year game and log any errors
 */

const MortalityGameV2 = require('./game_engine_v2_homeostatic.js');
const MortalityGameIntegrated = require('./game_engine_integrated.js');

// Load minimal data
const BIRTH_CARDS = require('./birth_cards_json.json');
const FAMILY_CARDS = require('./family_cards_json.json');
const DEATH_CARDS = require('./death_cards_json.json');

// Load v2 events
let EVENT_CARDS = [];
try {
  const childhood = require('./event_cards_childhood_v2.json');
  const teen = require('./event_cards_teen_v2.json');
  const adult = require('./event_cards_adult_v2.json');
  EVENT_CARDS = [...childhood, ...teen, ...adult];
  console.log(`✓ Loaded ${EVENT_CARDS.length} event cards`);
} catch (err) {
  console.error(`❌ Failed to load event cards:`, err.message);
  process.exit(1);
}

try {
  const game = new MortalityGameIntegrated(BIRTH_CARDS, FAMILY_CARDS, EVENT_CARDS, DEATH_CARDS);
  const player = game.createPlayer();
  
  console.log(`\n🎮 Starting gameplay test...`);
  console.log(`Player: ${player.demographics.sex === 'male' ? '♂️' : '♀️'} born in ${player.demographics.birthRegion}`);
  console.log(`Life expectancy: ${player.lifeExpectancy} years\n`);

  let errorCount = 0;
  let lastEventAge = 0;

  let yearCount = 0;
  while (player.alive && player.age < 100) {
    try {
      yearCount++;
      const yearResult = game.nextYear();
      
      if (!yearResult.alive) {
        console.log(`\n✓ Game ended naturally at year ${yearCount}`);
        console.log(`  Final age: ${game.player.demographics.age}`);
        console.log(`  Cause: ${game.player.causeOfDeath?.name || 'Unknown'}`);
        break;
      }

      // Log events
      if (player.eventHistory.length > lastEventAge) {
        const event = player.eventHistory[player.eventHistory.length - 1];
        console.log(`Age ${event.age}: ${event.event}`);
        lastEventAge = player.eventHistory.length;
      }
    } catch (err) {
      errorCount++;
      console.error(`❌ Error at year ${yearCount}:`, err.message);
      if (errorCount > 5) {
        throw err;
      }
    }
  }

  if (errorCount === 0) {
    console.log(`\n✅ Test completed successfully! No errors.`);
    const score = game.calculateScore();
    console.log(`Final age: ${game.player.age}, Life expectancy: ${game.player.lifeExpectancy}`);
    console.log(`Final score: ${score} points`);
    if (isNaN(score)) {
      console.log(`⚠️  Score is NaN - checking values...`);
      console.log(`  age:`, game.player.age);
      console.log(`  lifeExpectancy:`, game.player.lifeExpectancy);
      console.log(`  demographics.age:`, game.player.demographics.age);
    }
  } else {
    console.log(`\n❌ Test found ${errorCount} errors`);
    process.exit(1);
  }

} catch (err) {
  console.error(`\n❌ Test failed with error:`);
  console.error(err.message);
  console.error(err.stack);
  process.exit(1);
}
