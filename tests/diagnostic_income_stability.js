/**
 * FIX VERIFICATION: Income tracking test
 * Check if income calculation is working when employment status is constant
 */

const path = require('path');
const fs = require('fs');

// Load engine
const rootDir = path.join(__dirname, '..');
const GameEngine = require(path.join(rootDir, 'game_engine_integrated.js'));

// Load cards
const birthCards = JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'birth_cards_json.json'), 'utf8'));
const familyCards = JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'family_cards_json.json'), 'utf8'));
const eventCardsData = {
  childhood: JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'event_cards_childhood.json'), 'utf8')),
  teen: JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'event_cards_teen.json'), 'utf8')),
  adult: JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'event_cards_adult.json'), 'utf8'))
};
const eventCards = [...eventCardsData.childhood, ...eventCardsData.teen, ...eventCardsData.adult];
const deathCards = JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'death_cards_json.json'), 'utf8'));

console.log('='.repeat(80));
console.log('INCOME STABILITY TEST - Constant Employment Check');
console.log('='.repeat(80));
console.log();

// Find a long period of stable employment
const engine = new GameEngine(birthCards, familyCards, eventCards, deathCards);
const westernEurope = birthCards.find(b => b.name === 'Western Europe');
const familyCard = familyCards[0];

engine.createPlayer(westernEurope, familyCard);
const player = engine.player;

console.log('Finding period of continuous employment...');
console.log();

let stableYears = [];
let currentEmploymentStatus = null;
let stableCount = 0;

for (let year = 0; year < 200 && player.alive; year++) {  // Increased to 200 years to find employed period
  const age = player.demographics.age;
  const employed = player.economics.income.employed;
  const income = player.economics.income.current;
  
  if (employed === currentEmploymentStatus) {
    stableCount++;
    stableYears.push({ age, employed, income });
  } else {
    if (stableCount >= 3) {
      // Found a stable period!
      console.log(`FOUND ${stableCount}-year stable period (employed=${currentEmploymentStatus}):`);
      console.log(`Age | Employed | Income`);
      console.log(`-`.repeat(30));
      stableYears.forEach(y => {
        console.log(`${y.age.toString().padStart(3)} | ${y.employed ? 'YES' : 'NO '} | ${y.income.toString().padStart(4)}`);
      });
      console.log();
      break;
    }
    currentEmploymentStatus = employed;
    stableCount = 1;
    stableYears = [{ age, employed, income }];
  }
  
  engine.nextYear();
}

console.log('OBSERVATION:');
console.log('If income is being calculated correctly, employed periods should show');
console.log('CONSISTENT income values (subject to career performance changes)');
console.log('Unemployed periods should show 8 (benefits) or 0 (no safety net)');
