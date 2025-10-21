const GameEngine = require('../game_engine_v2_homeostatic.js');
const fs = require('fs');

// Load cards
const birthCards = JSON.parse(fs.readFileSync('../data/birth_cards_json.json', 'utf8'));
const familyCards = JSON.parse(fs.readFileSync('../data/family_cards_json.json', 'utf8'));
const allEvents = [];
const deathCards = JSON.parse(fs.readFileSync('../data/death_cards_json.json', 'utf8'));

const engine = new GameEngine(birthCards, familyCards, allEvents, deathCards);

// Test what suicide risk values are actually calculated
console.log('=== Debug: What suicide risk values are being calculated? ===\n');

let riskSamples = [];

for (let i = 0; i < 20; i++) {
  engine.createPlayer(birthCards[0], familyCards[0], { sex: 'male' });
  const player = engine.player;
  
  player.demographics.age = 20 + Math.floor(Math.random() * 20);  // Ages 20-40
  player.health.mental.current = 50 + Math.floor(Math.random() * 20);  // Mental health 50-70
  player.health.mental.baseline = player.health.mental.current;
  
  engine.calculateSuicideRisk(player);
  
  console.log(`Player Age ${player.demographics.age}, Mental: ${player.health.mental.current} => suicideRisk = ${player.health.mental.suicideRisk}`);
  riskSamples.push(player.health.mental.suicideRisk);
}

const avgRisk = riskSamples.reduce((a, b) => a + b, 0) / riskSamples.length;
console.log(`\nAverage suicide risk: ${avgRisk}`);
console.log(`In percentage: ${avgRisk}%`);
console.log(`In per-100K: ${avgRisk * 1000}/100K`);

// Now test the actual check that happens during year processing
console.log('\n=== Testing actual in-game check ===\n');

let suicideAttempts = 0;
for (let i = 0; i < 10; i++) {
  engine.createPlayer(birthCards[0], familyCards[0], { sex: 'male' });
  const player = engine.player;
  
  player.demographics.age = 25;
  player.health.mental.current = 50;
  player.health.mental.baseline = 50;
  
  engine.calculateSuicideRisk(player);
  
  console.log(`Player ${i+1}: suicideRisk = ${player.health.mental.suicideRisk}`);
  
  // Simulate the actual check from line 1727
  if (player.demographics.age >= 15 && player.health.mental.suicideRisk > 0.05) {
    const suicideRoll = Math.random() * 100;
    console.log(`  -> Check: ${suicideRoll.toFixed(4)} < ${player.health.mental.suicideRisk}? ${suicideRoll < player.health.mental.suicideRisk ? 'YES - ATTEMPT!' : 'NO'}`);
    
    if (suicideRoll < player.health.mental.suicideRisk) {
      suicideAttempts++;
    }
  }
}

console.log(`\nSuicide attempts in 10 players: ${suicideAttempts}`);

