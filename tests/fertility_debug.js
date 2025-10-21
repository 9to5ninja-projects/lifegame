/**
 * TEST: Debug fertility
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

console.log('\n=== FERTILITY DEBUG ===\n');
console.log('Starting fertility:', player.health.reproductive.fertile);

// Run to age 20
for (let i = 0; i < 20; i++) {
  engine.nextYear();
}

console.log(`\nAge 20:`);
console.log(`  Fertile: ${player.health.reproductive.fertile}`);
console.log(`  Married: ${player.relationships.social.married}`);
console.log(`  Partner exists: ${player.relationships.partner.exists}`);
console.log(`  Partner since: ${player.relationships.partner.since}`);
console.log(`  Children: ${player.relationships.children.length}`);
console.log(`  Chronic diseases: ${player.health.chronic.active.map(d => d.disease).join(', ') || 'none'}`);

// Continue to age 30, logging every year for marriage and fertility
for (let i = 0; i < 11; i++) {
  engine.nextYear();
  const age = player.demographics.age;
  console.log(`\nAge ${age}:`);
  console.log(`  Fertile: ${player.health.reproductive.fertile}`);
  console.log(`  Married: ${player.relationships.social.married}`);
  console.log(`  Children born: ${player.relationships.children.length}`);
  console.log(`  Chronic: ${player.health.chronic.active.map(d => d.disease).join(', ') || 'none'}`);
}
