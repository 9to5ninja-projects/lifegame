/**
 * TEST: Relationships System
 * 
 * Validates that social connections now grow throughout life
 * instead of only declining (which caused 100% isolation at death)
 */

const path = require('path');
const fs = require('fs');

// Load game engine
const MortalityGameV2 = require(path.join(__dirname, '../game_engine_v2_homeostatic.js'));

// Load card data
const birthCards = JSON.parse(fs.readFileSync(path.join(__dirname, '../birth_cards_json.json'), 'utf8'));
const familyCards = JSON.parse(fs.readFileSync(path.join(__dirname, '../family_cards_json.json'), 'utf8'));
const eventCards = JSON.parse(fs.readFileSync(path.join(__dirname, '../event_cards_childhood.json'), 'utf8'));
const deathCards = JSON.parse(fs.readFileSync(path.join(__dirname, '../death_cards_json.json'), 'utf8'));

console.log('='.repeat(80));
console.log('RELATIONSHIPS SYSTEM TEST');
console.log('='.repeat(80));
console.log();

// Create game instance
const engine = new MortalityGameV2(birthCards, familyCards, eventCards, deathCards);

// Create a Nordic player
const nordicBirth = birthCards.find(b => b.name === 'Nordic Country') || birthCards[0];
engine.createPlayer(nordicBirth, familyCards[0], { sex: 'female' });

const player = engine.player;

console.log('Starting State (Age 0):');
console.log(`  Friends: ${player.relationships.social.friends}`);
console.log(`  Mother alive: ${player.relationships.parents.mother.alive}`);
console.log(`  Father alive: ${player.relationships.parents.father.alive}`);
console.log(`  Community: ${player.relationships.social.community}`);
console.log();

// Track social connections over life
const socialHistory = [];

function recordSocialState(age) {
  const summary = engine.relationshipsSystem.getSocialSummary(player);
  socialHistory.push({
    age: age,
    ...summary
  });
  return summary;
}

recordSocialState(0);

// Simulate life stages
console.log('LIFE SIMULATION:');
console.log('-'.repeat(80));

// Childhood (1-11)
console.log('\nCHILDHOOD (1-11):');
for (let year = 0; year < 11; year++) {
  player.development.education.currentLevel = 'primary';
  engine.processYearEnd(player);
  
  if (!player.alive) {
    console.log(`  Died at age ${player.demographics.age}`);
    break;
  }
}

if (player.alive) {
  const summary = recordSocialState(player.demographics.age);
  console.log(`  Age ${player.demographics.age}: Friends=${summary.friends}, Community=${summary.community}, Social Health=${summary.socialHealth}`);
}

// Adolescence (12-17)
if (player.alive) {
  console.log('\nADOLESCENCE (12-17):');
  for (let year = 0; year < 6; year++) {
    player.development.education.currentLevel = 'secondary';
    engine.processYearEnd(player);
    
    if (!player.alive) {
      console.log(`  Died at age ${player.demographics.age}`);
      break;
    }
  }
  
  if (player.alive) {
    const summary = recordSocialState(player.demographics.age);
    console.log(`  Age ${player.demographics.age}: Friends=${summary.friends}, Community=${summary.community}, Social Health=${summary.socialHealth}`);
  }
}

// Young Adult (18-29)
if (player.alive) {
  console.log('\nYOUNG ADULT (18-29):');
  for (let year = 0; year < 12; year++) {
    // Some go to university
    if (year < 4 && Math.random() < 0.4) {
      player.development.education.currentLevel = 'university';
    }
    
    engine.processYearEnd(player);
    
    if (!player.alive) {
      console.log(`  Died at age ${player.demographics.age}`);
      break;
    }
  }
  
  if (player.alive) {
    const summary = recordSocialState(player.demographics.age);
    console.log(`  Age ${player.demographics.age}: Friends=${summary.friends}, Partner=${summary.partner}, Children=${summary.children}, Social Health=${summary.socialHealth}`);
  }
}

// Adult (30-59)
if (player.alive) {
  console.log('\nADULT (30-59):');
  for (let year = 0; year < 30; year++) {
    engine.processYearEnd(player);
    
    if (!player.alive) {
      console.log(`  Died at age ${player.demographics.age}`);
      break;
    }
  }
  
  if (player.alive) {
    const summary = recordSocialState(player.demographics.age);
    console.log(`  Age ${player.demographics.age}: Friends=${summary.friends}, Partner=${summary.partner}, Parents=${summary.parents}, Social Health=${summary.socialHealth}`);
  }
}

// Elderly (60+)
if (player.alive) {
  console.log('\nELDERLY (60+):');
  for (let year = 0; year < 20; year++) {
    engine.processYearEnd(player);
    
    if (!player.alive) {
      console.log(`  Died at age ${player.demographics.age}`);
      break;
    }
  }
  
  if (player.alive) {
    const summary = recordSocialState(player.demographics.age);
    console.log(`  Age ${player.demographics.age}: Friends=${summary.friends}, Parents=${summary.parents}, Isolated=${summary.isolated}, Social Health=${summary.socialHealth}`);
  }
}

console.log();
console.log('='.repeat(80));
console.log('SOCIAL CONNECTION ANALYSIS');
console.log('='.repeat(80));
console.log();

// Find peaks and troughs
const friendCounts = socialHistory.map(h => h.friends);
const maxFriends = Math.max(...friendCounts);
const minFriends = Math.min(...friendCounts);
const finalFriends = friendCounts[friendCounts.length - 1];

console.log('Friend Network Over Time:');
console.log(`  Starting: ${friendCounts[0]}`);
console.log(`  Peak: ${maxFriends} friends`);
console.log(`  Final: ${finalFriends} friends`);
console.log(`  Net change: ${finalFriends - friendCounts[0]} (${finalFriends > friendCounts[0] ? '✅ GROWTH' : '❌ DECLINE'})`);
console.log();

// Check if isolation problem is fixed
const finalSummary = socialHistory[socialHistory.length - 1];
console.log('Final Social State:');
console.log(`  Friends: ${finalSummary.friends}`);
console.log(`  Partner: ${finalSummary.partner}`);
console.log(`  Parents alive: ${finalSummary.parents}`);
console.log(`  Children: ${finalSummary.children}`);
console.log(`  Community integration: ${finalSummary.community}`);
console.log(`  Social health score: ${finalSummary.socialHealth}/100`);
console.log(`  Isolated: ${finalSummary.isolated ? '❌ YES' : '✅ NO'}`);
console.log();

// Validation
console.log('VALIDATION:');
if (finalFriends > friendCounts[0]) {
  console.log('  ✅ Friends can GROW over lifetime (bug fixed!)');
} else {
  console.log('  ❌ Friends still only declining');
}

if (parseFloat(finalSummary.socialHealth) > 30) {
  console.log('  ✅ Maintained social connections throughout life');
} else {
  console.log('  ⚠️  Social health below threshold');
}

if (!finalSummary.isolated) {
  console.log('  ✅ NOT isolated at death (major improvement!)');
} else {
  console.log('  ❌ Still isolated at death');
}

console.log();
console.log('Next: Run 10-life simulation to validate across population');
