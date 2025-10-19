// Test parent death odds based on age
const MortalityGameV2 = require('./game_engine_v2_homeostatic.js');
const MortalityGameIntegrated = require('./game_engine_integrated.js');
const fs = require('fs');

// Load game data
const BIRTH_CARDS = JSON.parse(fs.readFileSync('./birth_cards_json.json', 'utf8'));
const FAMILY_CARDS = JSON.parse(fs.readFileSync('./family_cards_json.json', 'utf8'));
const EVENT_CARDS = JSON.parse(fs.readFileSync('./event_cards_childhood_v2.json', 'utf8'))
  .concat(JSON.parse(fs.readFileSync('./event_cards_teen_v2.json', 'utf8')))
  .concat(JSON.parse(fs.readFileSync('./event_cards_adult_v2.json', 'utf8')));
const DEATH_CARDS = JSON.parse(fs.readFileSync('./death_cards_json.json', 'utf8'));

const game = new MortalityGameIntegrated(BIRTH_CARDS, FAMILY_CARDS, EVENT_CARDS, DEATH_CARDS);

// Test: Create player and advance to different parent ages, track parent death events
console.log('='.repeat(60));
console.log('PARENT DEATH AGE-BASED ODDS TEST');
console.log('='.repeat(60));

for (let testRun = 0; testRun < 5; testRun++) {
  console.log(`\nTest Run ${testRun + 1}:`);
  game.createPlayer();
  
  let parentDeathEvents = 0;
  const mothersAge = game.player.relationships.parents.mother.ageAtBirth;
  const fathersAge = game.player.relationships.parents.father.ageAtBirth;
  
  console.log(`  Initial: Mother age ${game.player.relationships.parents.mother.ageAtBirth}, ` +
              `Father age ${game.player.relationships.parents.father.ageAtBirth}`);
  console.log(`  Mother alive: ${game.player.relationships.parents.mother.alive}, ` +
              `Father alive: ${game.player.relationships.parents.father.alive}`);
  
  // Play 100 years
  for (let year = 0; year < 100 && game.player.alive; year++) {
    const result = game.nextYear();
    
    if (result.event && result.event.name && result.event.name.includes('Parent Dies')) {
      const playerAge = game.player.age;
      const motherCurrentAge = game.player.relationships.parents.mother.ageAtBirth + playerAge;
      const fatherCurrentAge = game.player.relationships.parents.father.ageAtBirth + playerAge;
      
      console.log(`    [Age ${playerAge}] Parent Dies event triggered!`);
      console.log(`      Mother: ${game.player.relationships.parents.mother.alive ? 'ALIVE' : 'DEAD'} ` +
                  `(age ${motherCurrentAge})`);
      console.log(`      Father: ${game.player.relationships.parents.father.alive ? 'ALIVE' : 'DEAD'} ` +
                  `(age ${fatherCurrentAge})`);
      parentDeathEvents++;
    }
  }
  
  console.log(`  Final: Player age ${game.player.age}, Parent death events: ${parentDeathEvents}`);
  console.log(`    Mother alive: ${game.player.relationships.parents.mother.alive}, ` +
              `Father alive: ${game.player.relationships.parents.father.alive}`);
}

console.log('\n' + '='.repeat(60));
console.log('TEST COMPLETE: Parent deaths should be age-appropriate');
console.log('Young parents (20s) should rarely die');
console.log('Old parents (60+) should have higher death rates');
console.log('='.repeat(60));
