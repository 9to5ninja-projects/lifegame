const GameEngine = require('../game_engine_v2_homeostatic.js');
const fs = require('fs');

// Load cards
const birthCards = JSON.parse(fs.readFileSync('./birth_cards_json.json', 'utf8'));
const familyCards = JSON.parse(fs.readFileSync('./family_cards_json.json', 'utf8'));
const allEvents = [];
const deathCards = JSON.parse(fs.readFileSync('./death_cards_json.json', 'utf8'));

const engine = new GameEngine(birthCards, familyCards, allEvents, deathCards);

console.log('=== Analyzing Suicide Risk Calculation ===\n');

// Test different mental health levels
const scenarios = [
  { age: 20, mentalHealth: 88, label: 'Healthy young adult (baseline)' },
  { age: 20, mentalHealth: 65, label: 'Typical mental health' },
  { age: 20, mentalHealth: 50, label: 'Moderate mental health issues' },
  { age: 20, mentalHealth: 30, label: 'Significant depression' },
  { age: 20, mentalHealth: 15, label: 'Severe crisis' },
  { age: 17, mentalHealth: 75, label: 'Healthy teen' },
  { age: 19, mentalHealth: 65, label: 'Typical teen' },
];

console.log('Mental Health -> Suicide Risk Calculation:\n');

scenarios.forEach(s => {
  engine.createPlayer(birthCards[0], familyCards[0], { sex: 'male' });
  const p = engine.player;
  
  p.demographics.age = s.age;
  p.health.mental.current = s.mentalHealth;
  p.health.mental.baseline = s.mentalHealth;
  
  engine.calculateSuicideRisk(p);
  
  const riskPercent = p.health.mental.suicideRisk;
  const riskDecimal = riskPercent / 100;
  const per100k = riskPercent * 1000;
  const annualProbability = `1 in ${Math.round(1 / riskDecimal)}`;
  
  console.log(`${s.label.padEnd(40)} MH=${s.mentalHealth.toString().padStart(2)}`);
  console.log(`  -> Risk: ${riskPercent.toFixed(4)}% (${per100k.toFixed(1)}/100K, ${annualProbability})`);
  console.log();
});

// Now let's check what happens over 30 years for an average person
console.log('\n=== 30-Year Cumulative Suicide Risk ===\n');

console.log('For someone ages 15-45 (key suicide window):');

let totalRiskCount = 0;
for (let age = 15; age <= 45; age++) {
  engine.createPlayer(birthCards[0], familyCards[0], { sex: 'male' });
  const p = engine.player;
  
  p.demographics.age = age;
  p.health.mental.current = 70;  // Average mental health
  p.health.mental.baseline = 70;
  
  engine.calculateSuicideRisk(p);
  totalRiskCount += p.health.mental.suicideRisk;
}

const avgRiskAge = totalRiskCount / (45 - 15 + 1);
console.log(`Average annual risk for ages 15-45: ${avgRiskAge.toFixed(4)}%`);
console.log(`Over 30 years: ${(avgRiskAge * 30).toFixed(2)}%`);
console.log(`Expected real-world: ~0.3-0.5% over 30 years`);
console.log(`\nProblem: ${(avgRiskAge * 30) / 0.4} times TOO HIGH`);

// Let's think about this differently
// Real Nordic suicide rate: ~12/100K annually
// That means ~0.012% annually, or 0.00012 as decimal
// So over 30 years, cumulative would be around 0.36%

console.log('\n=== What should the numbers be? ===\n');
console.log('Real Nordic suicide rate: ~12/100K = 0.012% annually');
console.log('Over 30 years (cumulative with some recovery): ~0.3-0.4%');
console.log('Our calculation is giving WAY more than that');
console.log('\nThe issue: Base suicide risk 0.08% is already 6.7x higher than real (0.012%)');
console.log('And it increases significantly with mental health issues');
console.log('So we need to reduce BASE suicide risk dramatically');
