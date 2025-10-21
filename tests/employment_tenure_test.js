/**
 * TEST: Employment stability with new tenure-based logic
 */

const path = require('path');
const fs = require('fs');

const rootDir = path.join(__dirname, '..');
const GameEngine = require(path.join(rootDir, 'game_engine_integrated.js'));

const birthCards = JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'birth_cards_json.json'), 'utf8'));
const familyCards = JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'family_cards_json.json'), 'utf8'));
const eventCardsData = {
  childhood: JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'event_cards_childhood.json'), 'utf8')),
  teen: JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'event_cards_teen.json'), 'utf8')),
  adult: JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'event_cards_adult.json'), 'utf8'))
};
const eventCards = [...eventCardsData.childhood, ...eventCardsData.teen, ...eventCardsData.adult];
const deathCards = JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'death_cards_json.json'), 'utf8'));

const engine = new GameEngine(birthCards, familyCards, eventCards, deathCards);
engine.createPlayer(birthCards.find(b => b.name === 'Western Europe'), familyCards[0]);
const player = engine.player;

console.log('=== EMPLOYMENT TENURE TRACKING ===\n');
console.log('Age | Empl | Tenure | Target | Income | Unemployed Mo | Status');
console.log('-'.repeat(75));

// Run to age 18
for (let i = 0; i < 18; i++) {
  engine.nextYear();
}

// Then track ages 18-60
for (let year = 0; year < 43 && player.alive; year++) {
  const age = player.demographics.age;
  const empl = player.economics.income.employed ? 'Y' : 'N';
  const tenure = (player.economics.income.currentJobTenureYears || 0).toFixed(1);
  const target = (player.economics.income.targetJobTenure || 0).toFixed(1);
  const income = Math.round(player.economics.income.current);
  const unemployedMo = player.economics.income.unemploymentMonths || 0;
  
  let status = '';
  if (player.economics.income.employed) {
    if (Math.abs(parseFloat(tenure) - parseFloat(target)) < 0.5) {
      status = 'TENURE ABOUT TO EXPIRE';
    } else {
      status = 'Stable job';
    }
  } else {
    status = `Unemployed ${unemployedMo}mo`;
  }
  
  console.log(`${age.toString().padStart(3)} | ${empl} | ${tenure.padStart(6)} | ${target.padStart(6)} | ${income.toString().padStart(6)} | ${unemployedMo.toString().padStart(12)} | ${status}`);
  
  engine.nextYear();
}

console.log(`\nFinal - ALIVE: ${player.alive}, Age: ${player.demographics.age}`);
