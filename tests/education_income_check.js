/**
 * TEST: What is the education level at age 20?
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

console.log(`At age ${player.demographics.age}:`);
console.log(`Education level: ${player.development.education.level}`);
console.log(`Education inSchool: ${player.development.education.inSchool}`);
console.log(`Employment status: ${player.economics.income.employed}`);
console.log(`Income: ${player.economics.income.current}`);
console.log(`Career Performance: ${player.economics.income.careerPerformance}`);
console.log(`Resources: ${player.economics.resources.current}`);

// Manually calculate what income SHOULD be
const edu = player.development.education.level || "none";
let baseIncome = 10;
if (edu.includes("tertiary") || edu.includes("bachelor") || edu.includes("master")) {
  baseIncome = 30;
} else if (edu === "secondary") {
  baseIncome = 18;
} else if (edu === "primary") {
  baseIncome = 12;
}

const age = player.demographics.age;
let experienceMultiplier = 1.0;
if (age >= 50) experienceMultiplier = 1.3;
else if (age >= 35) experienceMultiplier = 1.2;
else if (age >= 25) experienceMultiplier = 1.1;
else experienceMultiplier = 0.8;

const regionalMultiplier = 1.6; // Western Europe
const careerPerf = player.economics.income.careerPerformance || 1.0;

const calculated = baseIncome * experienceMultiplier * regionalMultiplier * careerPerf;
console.log();
console.log(`SHOULD CALCULATE AS:`);
console.log(`${baseIncome} * ${experienceMultiplier} * ${regionalMultiplier} * ${careerPerf.toFixed(2)} = ${calculated.toFixed(2)}`);
