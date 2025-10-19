const GameEngine = require('../game_engine_v2_homeostatic.js');
const fs = require('fs');

// Load cards
const birthCards = JSON.parse(fs.readFileSync('./birth_cards_json.json', 'utf8'));
const familyCards = JSON.parse(fs.readFileSync('./family_cards_json.json', 'utf8'));
const allEvents = [];
const deathCards = JSON.parse(fs.readFileSync('./death_cards_json.json', 'utf8'));

const engine = new GameEngine(birthCards, familyCards, allEvents, deathCards);

// Test suicide mechanics with different mental health states
console.log('Suicide Risk Analysis:\n');

const testCases = [
  { age: 20, mentalHealth: 65, label: 'Young Adult - Healthy' },
  { age: 20, mentalHealth: 40, label: 'Young Adult - Moderate Crisis' },
  { age: 20, mentalHealth: 15, label: 'Young Adult - Severe Crisis' },
  { age: 40, mentalHealth: 65, label: 'Middle-Aged - Healthy' },
  { age: 40, mentalHealth: 15, label: 'Middle-Aged - Severe Crisis' },
  { age: 70, mentalHealth: 65, label: 'Elderly - Healthy' },
  { age: 70, mentalHealth: 15, label: 'Elderly - Severe Crisis' }
];

testCases.forEach(test => {
  engine.createPlayer(birthCards[0], familyCards[0], { sex: 'male' });
  const player = engine.player;
  
  // Set test conditions
  player.demographics.age = test.age;
  player.health.mental.current = test.mentalHealth;
  player.health.mental.baseline = test.mentalHealth;
  
  // Calculate suicide risk
  engine.calculateSuicideRisk(player);
  
  const suicideRisk = player.health.mental.suicideRisk;
  const annualProbability = suicideRisk; // Should be 0.08% to 1.2%
  const per100k = suicideRisk * 1000; // Convert to per 100K rate
  
  console.log(`${test.label.padEnd(35)}`);
  console.log(`  Age: ${test.age}, Mental Health: ${test.mentalHealth}`);
  console.log(`  Suicide Risk: ${suicideRisk.toFixed(4)}% (${per100k.toFixed(1)}/100K)`);
  
  // Show what the attempt probability would be
  const suicideRoll = Math.random() * 100;
  const willAttempt = suicideRoll < suicideRisk;
  console.log(`  Annual attempt probability (if threshold): ${(suicideRisk).toFixed(4)}%`);
  console.log(`  Status: ${suicideRisk > 1.2 ? 'CAPPED AT 1.2%' : 'OK'}`);
  console.log();
});

// Test what's actually happening in-game with Nordic player
console.log('\n=== Real Nordic Player Test (500 players, ages 15-40) ===\n');

let suicideCount = 0;
let totalDeaths = 0;
const ageRange = { min: 15, max: 40 };

for (let i = 0; i < 500; i++) {
  engine.createPlayer(birthCards[0], familyCards[0], { sex: Math.random() > 0.5 ? 'male' : 'female' });
  const player = engine.player;
  
  // Age them to test range
  player.demographics.age = ageRange.min + Math.floor(Math.random() * (ageRange.max - ageRange.min));
  
  // Simulate 30 years (run through multiple suicide checks)
  for (let year = 0; year < 30 && player.alive; year++) {
    // Simulate mental health drift (can get worse)
    if (Math.random() < 0.1) { // 10% chance of mental health episode
      player.health.mental.current = Math.max(5, player.health.mental.current - 10);
      player.health.mental.episodeDuration = 12;
    }
    
    engine.calculateSuicideRisk(player);
    
    // Check if suicide would happen this year
    if (player.demographics.age >= 15 && player.health.mental.suicideRisk > 0.05) {
      const suicideRoll = Math.random() * 100;
      if (suicideRoll < player.health.mental.suicideRisk) {
        // Would trigger suicide attempt
        const suicideResult = engine.attemptSuicide(player);
        if (!suicideResult.alive) {
          player.alive = false;
          suicideCount++;
        }
      }
    }
    
    // Also run normal death check
    if (player.alive && Math.random() * 100 > player.survival) {
      player.alive = false;
    }
    
    if (player.alive) {
      player.demographics.age++;
    }
    totalDeaths++;
  }
}

const suicideRate = (suicideCount / 500) * 100000;
console.log(`Suicide count: ${suicideCount} out of 500 players`);
console.log(`Suicide rate: ${suicideRate.toFixed(1)}/100K`);
console.log(`Expected: 10-15/100K`);
console.log(`Status: ${suicideRate > 50 ? 'STILL TOO HIGH' : suicideRate < 5 ? 'TOO LOW' : 'IN RANGE'}`);
