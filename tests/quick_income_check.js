/**
 * SIMPLE CHECK: Just run a life and print every 5th year
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

console.log('Age | Empl | Income | Resources | Education');
console.log(`-`.repeat(60));

const engine = new GameEngine(birthCards, familyCards, eventCards, deathCards);
engine.createPlayer(birthCards.find(b => b.name === 'Western Europe'), familyCards[0]);
const player = engine.player;

let count = 0;
while (player.alive && player.demographics.age < 100) {
  if (count % 5 === 0) {
    const age = player.demographics.age;
    const empl = player.economics.income.employed ? 'Y' : 'N';
    const income = player.economics.income.current;
    const res = Math.round(player.economics.resources.current);
    const edu = (player.development.education.level || 'none').substring(0,10);
    console.log(`${age.toString().padStart(3)} | ${empl} | ${income.toString().padStart(5)} | ${res.toString().padStart(6)} | ${edu}`);
  }
  engine.nextYear();
  count++;
}

console.log(`\nALIVE: ${player.alive}, Age: ${player.demographics.age}`);
