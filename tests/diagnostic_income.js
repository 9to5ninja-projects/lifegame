/**
 * DIAGNOSTIC: Income System
 * Traces income calculation to find where it freezes at zero
 * 
 * Usage: node diagnostic_income.js
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
console.log('INCOME DIAGNOSTIC TEST');
console.log('='.repeat(80));
console.log();

// Create one life and track income closely
const engine = new GameEngine(birthCards, familyCards, eventCards, deathCards);
const westernEurope = birthCards.find(b => b.name === 'Western Europe');
const familyCard = familyCards[0];

engine.createPlayer(westernEurope, familyCard);
const player = engine.player;

console.log(`BIRTH STATE (Age 0):`);
console.log(`  Employment: ${player.economics.income.employed ? 'EMPLOYED' : 'unemployed'}`);
console.log(`  Income: ${player.economics.income.current}`);
console.log(`  Resources: ${player.economics.resources.current}`);
console.log(`  Education: ${player.development.education.level}`);
console.log();

// Simulate year by year and track income
console.log(`YEAR-BY-YEAR INCOME TRACKING:`);
console.log(`Age | Employed | Income | Education     | Resources | Notes`);
console.log(`-`.repeat(80));

for (let year = 0; year < 60 && player.alive; year++) {
  const age = player.demographics.age;
  
  if (age >= 15 && age <= 50) {
    const employed = player.economics.income.employed ? 'YES' : 'no ';
    const income = Math.round(player.economics.income.current);
    const edu = (player.development.education.level || 'none').substring(0, 13).padEnd(13);
    const resources = Math.round(player.economics.resources.current);
    
    let notes = '';
    if (year === 0) notes = '(birth)';
    if (year === 1) notes = '(age 1)';
    if (age === 15) notes = '(school end)';
    if (age === 18) notes = '(can work)';
    if (age === 25) notes = '(job search)';
    if (age === 30) notes = '(career)';
    if (income === 0 && employed) notes = '!!! FREEZE';
    
    console.log(`${age.toString().padStart(3)} | ${employed} | ${income.toString().padStart(4)} | ${edu} | ${resources.toString().padStart(4)} | ${notes}`);
  }
  
  engine.nextYear();
}

console.log();
console.log('KEY OBSERVATIONS:');
console.log('1. When does income first reach zero?');
console.log('2. What is education level when it happens?');
console.log('3. Is employment.employed still true?');
console.log('4. Does income ever recover?');
console.log();
console.log('FINAL STATE (Age ' + player.demographics.age + '):');
console.log(`  Employed: ${player.economics.income.employed ? 'YES' : 'NO'}`);
console.log(`  Income: ${player.economics.income.current}`);
console.log(`  Education: ${player.development.education.level}`);
console.log(`  Career Performance: ${player.economics.income.careerPerformance}`);
