// Debug parent age tracking and survival
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

console.log('PARENT AGE TRACKING DEBUG TEST');
console.log('='.repeat(60));

game.createPlayer();

const birthCard = BIRTH_CARDS.find(b => b.id === game.player.demographicProfileId);
console.log(`Birth Card: ${birthCard ? birthCard.region : 'Unknown'}`);
console.log(`Life Expectancy: ${game.player.lifeExpectancy}`);
console.log(`Mother Age at Birth: ${game.player.relationships.parents.mother.ageAtBirth}`);
console.log(`Father Age at Birth: ${game.player.relationships.parents.father.ageAtBirth}`);
console.log();

// Play and track parent ages
for (let year = 0; year < 30 && game.player.alive; year++) {
  const result = game.nextYear();
  
  const playerAge = game.player.age;
  const motherAge = game.player.relationships.parents.mother.currentAge;
  const fatherAge = game.player.relationships.parents.father.currentAge;
  const survival = Math.floor(game.player.survival);
  
  let eventStr = result.event ? ` [EVENT: ${result.event.name}]` : '';
  
  console.log(`Age ${playerAge}: Survival=${survival}%, Mother=${motherAge}, Father=${fatherAge}${eventStr}`);
  
  if (!game.player.alive) {
    console.log(`Player died: ${game.player.causeOfDeath}`);
    break;
  }
}

console.log('='.repeat(60));
