/**
 * INSTRUMENTED TEST: Add console.log to game engine to trace income calculation
 */

const path = require('path');
const fs = require('fs');

const rootDir = path.join(__dirname, '..');

// Load and PATCH the engine to add logging
let engineCode = fs.readFileSync(path.join(rootDir, 'game_engine_v2_homeostatic.js'), 'utf8');

// Find the line where income is assigned when employed
// Look for: p.economics.income.current = Math.round(householdIncome);
const originalAssignment = 'p.economics.income.current = Math.round(householdIncome);';
const patchedAssignment = `
if (p.demographics.age >= 19 && p.demographics.age <= 22) {
  console.log('  [INCOME CALC AGE ' + p.demographics.age + '] EMPLOYED=' + p.economics.income.employed + ', baseIncome=' + baseIncome + ', expMult=' + experienceMultiplier + ', regMult=' + regionalMultiplier + ', careerPerf=' + p.economics.income.careerPerformance.toFixed(2) + ', personal=' + personalIncome.toFixed(2) + ', household=' + householdIncome.toFixed(2));
}
p.economics.income.current = Math.round(householdIncome);`;

engineCode = engineCode.replace(originalAssignment, patchedAssignment);

// Also add logging for the unemployment benefits
const unemploymentBenefits = `p.economics.income.current = 8; // Unemployment benefits (~50% of base wage)`;
const patchedUnemployment = `
if (p.demographics.age >= 19 && p.demographics.age <= 22) {
  console.log('  [UNEMPLOYMENT AGE ' + p.demographics.age + '] Setting income to 8 (benefits)');
}
p.economics.income.current = 8;`;

engineCode = engineCode.replace(unemploymentBenefits, patchedUnemployment);

// Write patched engine to temp file
const patchedPath = path.join(rootDir, 'game_engine_v2_INSTRUMENTED.js');
fs.writeFileSync(patchedPath, engineCode, 'utf8');

// Now require and use the patched engine
// First, remove from require cache if already loaded
delete require.cache[require.resolve(path.join(rootDir, 'game_engine_integrated.js'))];

// Create a custom integrated engine that uses the patched v2
const GameEngineV2Patched = require(patchedPath);

const birthCards = JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'birth_cards_json.json'), 'utf8'));
const familyCards = JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'family_cards_json.json'), 'utf8'));
const eventCardsData = {
  childhood: JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'event_cards_childhood.json'), 'utf8')),
  teen: JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'event_cards_teen.json'), 'utf8')),
  adult: JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'event_cards_adult.json'), 'utf8'))
};
const eventCards = [...eventCardsData.childhood, ...eventCardsData.teen, ...eventCardsData.adult];
const deathCards = JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'death_cards_json.json'), 'utf8'));

console.log('Age | Empl | Income | Resources');
console.log(`-`.repeat(40));

const engine = new GameEngineV2Patched(birthCards, familyCards, eventCards, deathCards);
engine.createPlayer(birthCards.find(b => b.name === 'Western Europe'), familyCards[0]);
const player = engine.player;

// Run to age 15
for (let i = 0; i < 15; i++) {
  engine.nextYear();
}

// Then print every year from 15-30 with logging
for (let year = 0; year < 16 && player.alive; year++) {
  const age = player.demographics.age;
  const empl = player.economics.income.employed ? 'Y' : 'N';
  const income = player.economics.income.current;
  const res = Math.round(player.economics.resources.current);
  
  console.log(`\n[BEFORE YEAR END] Age ${age}`);
  engine.nextYear();
  
  console.log(`[AFTER YEAR END] ${age.toString().padStart(3)} | ${empl} | ${income.toString().padStart(5)} | ${res.toString().padStart(6)}`);
}

console.log(`\nFinal - ALIVE: ${player.alive}, Age: ${player.demographics.age}`);

// Clean up temp file
fs.unlinkSync(patchedPath);
