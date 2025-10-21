/**
 * DIAGNOSTIC: Employment Income Calculation
 * Adds console.log statements directly to game engine to trace the problem
 */

const path = require('path');
const fs = require('fs');

// Load engine
const rootDir = path.join(__dirname, '..');

// Manually load and patch game_engine_v2 to add logging
let engineCode = fs.readFileSync(path.join(rootDir, 'game_engine_v2_homeostatic.js'), 'utf8');

// Add logging at line where income is calculated
// Find the line: p.economics.income.current = Math.round(householdIncome);
// Add logging before it

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
console.log('EMPLOYMENT INCOME DETAILED TRACE');
console.log('='.repeat(80));
console.log();

// Create one life and manually check each year's employment calculation
const engine = new GameEngine(birthCards, familyCards, eventCards, deathCards);
const westernEurope = birthCards.find(b => b.name === 'Western Europe');
const familyCard = familyCards[0];

engine.createPlayer(westernEurope, familyCard);
const player = engine.player;

// Patch the v2Engine to add logging
const v2Engine = engine.v2Engine;
const originalUpdateEmployment = v2Engine.updateEmploymentStatus;

v2Engine.updateEmploymentStatus = function(p) {
  originalUpdateEmployment.call(this, p);
  
  // After update, log what happened
  if (p.demographics.age >= 16 && p.demographics.age <= 30) {
    console.log(`Age ${p.demographics.age}:`);
    console.log(`  Employed: ${p.economics.income.employed}`);
    console.log(`  Income.current: ${p.economics.income.current}`);
    console.log(`  Education: ${p.development.education.level}`);
    console.log(`  CareerPerf: ${p.economics.income.careerPerformance?.toFixed(2)}`);
    console.log();
  }
};

// Simulate years
for (let year = 0; year < 40 && player.alive; year++) {
  engine.nextYear();
}

console.log('THEORY:');
console.log('income.current should be recalculated each year in updateEmploymentStatus()');
console.log('But if it\'s not, then old value persists and driftEconomics uses old value');
console.log('which then calculates drift based on old income');
