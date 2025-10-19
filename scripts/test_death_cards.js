const GameEngine = require('../game_engine_v2_homeostatic.js');
const fs = require('fs');

const birthCards = JSON.parse(fs.readFileSync('./birth_cards_json.json', 'utf8'));
const familyCards = JSON.parse(fs.readFileSync('./family_cards_json.json', 'utf8'));
const allEvents = [];
const deathCards = JSON.parse(fs.readFileSync('./death_cards_json.json', 'utf8'));

console.log('Checking death cards available for each age:');
console.log();

// Check what death cards are available for different ages
const testAges = [1, 5, 10, 15, 20, 25, 70];

testAges.forEach(age => {
  const validDeaths = deathCards.filter(card => {
    const [minAge, maxAge] = card.ageRange;
    return age >= minAge && age <= maxAge;
  });
  
  const hasSuicide = validDeaths.some(d => d.name.includes('Suicide'));
  console.log(`Age ${age}: ${validDeaths.length} death cards available${hasSuicide ? ' [HAS SUICIDE]' : ''}`);
  
  if (age <= 10 && hasSuicide) {
    console.log(`  WARNING: Suicide available for age ${age}!`);
    const suicideCard = validDeaths.find(d => d.name.includes('Suicide'));
    console.log(`  Card: ${suicideCard.name}, ageRange: [${suicideCard.ageRange[0]}, ${suicideCard.ageRange[1]}]`);
  }
});

console.log();
console.log('Suicide death card details:');
const suicideCard = deathCards.find(d => d.name && d.name.includes('Suicide'));
if (suicideCard) {
  console.log(`  Name: ${suicideCard.name}`);
  console.log(`  Age Range: [${suicideCard.ageRange[0]}, ${suicideCard.ageRange[1]}]`);
  console.log(`  Description: ${suicideCard.description.substring(0, 100)}`);
}
