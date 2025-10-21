const GameEngine = require('../game_engine_integrated.js');
const engine = new GameEngine();

// Create one life
const player = engine.createPlayer();

console.log('Starting trace: Income at key ages\n');

// Run until age 30
for (let year = 0; year < 30; year++) {
  engine.processYearEnd(player);
  
  if ([16, 17, 18, 19, 20, 21, 22, 23, 24, 25].includes(player.demographics.age)) {
    console.log(`\n=== AGE ${player.demographics.age} ===`);
    console.log(`  Education level: ${player.development.education.level}`);
    console.log(`  In school: ${player.development.education.inSchool}`);
    console.log(`  Education cost: ${player.development.education.cost}`);
    console.log(`  Employed: ${player.economics.income.employed}`);
    console.log(`  Income current: ${player.economics.income.current}`);
    console.log(`  Resources current: ${player.economics.resources.current.toFixed(1)}`);
    console.log(`  Debt: ${player.economics.debt.toFixed(1)}`);
  }
}
