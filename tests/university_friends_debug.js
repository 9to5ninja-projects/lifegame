/**
 * Debug test: Does a university-educated person accumulate friends?
 * Focused test to verify relationships_system.js university bonus logic
 */

const GameEngine = require('../game_engine_integrated');

// Create one player and run them to age 60
const engine = new GameEngine();
const player = engine.createPlayer('Western Europe');

console.log('='.repeat(80));
console.log('UNIVERSITY FRIENDS DEBUG TEST');
console.log('='.repeat(80));
console.log(`Created player from Western Europe`);
console.log(`Initial resources: current=${player.economics.resources.current}, baseline=${player.economics.resources.baseline}`);
console.log();

// Run through their life
for (let year = 0; year < 61; year++) {
  engine.processYearEnd(player);
  
  // Print every age to see how friends change
  const age = player.demographics.age;
  if (age === 18 || age === 20 || age === 22 || age === 25 || age === 30 || age === 40 || age === 50 || age === 60) {
    console.log(`Age ${age}: education=${player.development.education.level}, friends=${player.relationships.social.friends}, community=${player.relationships.social.community}, employed=${player.economics.income.employed}, mental=${Math.round(player.health.mental.current)}`);
    
    if (age === 25) {
      console.log(`  [DETAIL at 25] frozenBudget=${player.development.education.familyBudgetAtAge18}, resources.current=${Math.round(player.economics.resources.current)}`);
    }
  }
}

console.log();
console.log('='.repeat(80));
console.log('RESULTS:');
console.log(`Final age: ${player.demographics.age}`);
console.log(`Final education: ${player.development.education.level}`);
console.log(`Final friends: ${player.relationships.social.friends}`);
console.log(`Final community: ${player.relationships.social.community}`);
console.log('='.repeat(80));

if (player.development.education.level === 'tertiary_bachelor' && player.relationships.social.friends === 0) {
  console.log('ERROR: University-educated but 0 friends!');
  console.log('The university friend bonus in relationships_system.js is NOT working');
} else if (player.development.education.level === 'tertiary_bachelor' && player.relationships.social.friends > 0) {
  console.log('SUCCESS: University-educated with friends!');
  console.log('The system is working correctly');
} else if (player.development.education.level !== 'tertiary_bachelor') {
  console.log('NOTE: Did not reach tertiary education in this run (random decision)');
}
