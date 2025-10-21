#!/usr/bin/env node
/**
 * Test: Check for parent death event duplication
 */

const MortalityGameV2 = require('../game_engine_v2_homeostatic.js');
const MortalityGameIntegrated = require('../game_engine_integrated.js');

// Load minimal data
const BIRTH_CARDS = require('../data/birth_cards_json.json');
const FAMILY_CARDS = require('../data/family_cards_json.json');
const DEATH_CARDS = require('../data/death_cards_json.json');

// Load v2 events
const childhood = require('../data/event_cards_childhood_v2.json');
const teen = require('../data/event_cards_teen_v2.json');
const adult = require('../data/event_cards_adult_v2.json');
const EVENT_CARDS = [...childhood, ...teen, ...adult];

try {
  const game = new MortalityGameIntegrated(BIRTH_CARDS, FAMILY_CARDS, EVENT_CARDS, DEATH_CARDS);
  const player = game.createPlayer();
  
  console.log(`\n🎮 Testing parent death events...`);
  console.log(`Initial: Mother=${player.relationships.parents.mother.alive}, Father=${player.relationships.parents.father.alive}\n`);

  let parentDeathCount = 0;
  let eventLog = [];

  while (player.alive && player.age < 100) {
    const yearResult = game.nextYear();
    
    if (!yearResult.alive) {
      break;
    }

    // Check for parent death events
    if (player.eventHistory.length > eventLog.length) {
      const event = player.eventHistory[player.eventHistory.length - 1];
      eventLog.push(event);
      
      if (event.event.includes('Parent')) {
        parentDeathCount++;
        console.log(`Age ${event.age}: ${event.event}`);
        console.log(`  → Mother now: ${player.relationships.parents.mother.alive}, Father now: ${player.relationships.parents.father.alive}`);
      }
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`Total parent death events: ${parentDeathCount}`);
  console.log(`Final mother status: ${player.relationships.parents.mother.alive}`);
  console.log(`Final father status: ${player.relationships.parents.father.alive}`);
  
  if (parentDeathCount > 2) {
    console.log(`❌ ERROR: More than 2 parent deaths detected!`);
    process.exit(1);
  } else if (parentDeathCount <= 2) {
    console.log(`✅ OK: Parent deaths within expected range`);
  }

} catch (err) {
  console.error(`\n❌ Test failed:`, err.message);
  console.error(err.stack);
  process.exit(1);
}

