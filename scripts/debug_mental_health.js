const GameEngine = require('../game_engine_v2_homeostatic.js');

const engine = new GameEngine();

// Create 1000 youth (ages 10-20) and track their mental health over 10 years
const stats = {
  ages: {},
  mentalHealthByAge: {},
  suicideRiskByAge: {},
};

console.log('=== MENTAL HEALTH DEBUG ===\n');

for (let i = 0; i < 1000; i++) {
  const p = engine.createPerson({
    age: 10 + Math.floor(Math.random() * 11), // Ages 10-20
    sex: Math.random() > 0.5 ? 'M' : 'F',
    birthRegion: 'Nordic Country',
  });

  // Simulate 10 years
  for (let year = 0; year < 10; year++) {
    engine.simulateYear(p);
  }

  const age = p.demographics.age;
  if (!stats.mentalHealthByAge[age]) {
    stats.mentalHealthByAge[age] = [];
    stats.suicideRiskByAge[age] = [];
  }

  stats.mentalHealthByAge[age].push(p.health.mental.current);
  stats.suicideRiskByAge[age].push(p.health.mental.suicideRisk);
}

// Calculate averages
console.log('Age | Avg Mental Health | Min | Max | Suicide Risk (%) | Low MH Count\n');
for (let age = 10; age <= 30; age++) {
  if (stats.mentalHealthByAge[age]) {
    const mh = stats.mentalHealthByAge[age];
    const sr = stats.suicideRiskByAge[age];
    const avg = (mh.reduce((a, b) => a + b, 0) / mh.length).toFixed(1);
    const min = Math.min(...mh);
    const max = Math.max(...mh);
    const avgRisk = (sr.reduce((a, b) => a + b, 0) / sr.length * 100).toFixed(3);
    const lowCount = mh.filter(v => v < 35).length;

    console.log(`${age}  | ${avg.padStart(8)} | ${min.toString().padStart(3)} | ${max.toString().padStart(3)} | ${avgRisk.padStart(8)} | ${lowCount}`);
  }
}

console.log('\n=== STRESS FACTOR DISTRIBUTION ===\n');

// Track what causes low mental health
const stressReasons = {
  poverty: 0,
  unemployment: 0,
  isolation: 0,
  health: 0,
  none: 0,
};

for (let i = 0; i < 100; i++) {
  const p = engine.createPerson({
    age: 15,
    sex: 'M',
    birthRegion: 'Nordic Country',
  });

  // Check initial state
  if (p.economics.resources.current < 5) stressReasons.poverty++;
  if (!p.economics.income.employed) stressReasons.unemployment++;
  if (p.relationships.social.isolation) stressReasons.isolation++;
  if (p.health.physical.current < 40) stressReasons.health++;
  
  if (!p.economics.income.employed && p.relationships.social.isolation && p.health.physical.current < 40) {
    stressReasons.none++;
  }
}

console.log('Initial state for age 15 (out of 100):');
for (const [key, val] of Object.entries(stressReasons)) {
  console.log(`  ${key}: ${val}`);
}
