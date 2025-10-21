/**
 * EXPENSE BREAKDOWN: Show what's causing debt accumulation
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

// Run to age 20
for (let i = 0; i < 20; i++) {
  engine.nextYear();
}

// Show ages 20-26 with expense breakdown
console.log('\n=== EXPENSE BREAKDOWN (Ages 20-26) ===\n');
console.log('Age | Employed | Income | Living | Children | Housing | Chronic | Debt | Diseases');
console.log('-'.repeat(95));

for (let year = 0; year < 7 && player.alive; year++) {
  const age = player.demographics.age;
  const employed = player.economics.income.employed ? 'Y' : 'N';
  const income = player.economics.income.current;
  const baseLiving = 10;
  const childrenCost = player.relationships.children.length * 5;
  const houseCost = player.circumstances.housing.quality / 10;
  const chronicCount = player.health.chronic.active.length;
  const debt = player.economics.debt;
  
  const diseases = player.health.chronic.active.map(d => d.disease).join(', ') || 'none';
  
  console.log(`${age.toString().padStart(3)} | ${employed} | ${income.toString().padStart(6)} | ${baseLiving.toString().padStart(6)} | ${childrenCost.toString().padStart(8)} | ${houseCost.toString().padStart(7)} | ${chronicCount.toString().padStart(7)} | ${debt.toString().padStart(4)} | ${diseases}`);
  
  engine.nextYear();
}
