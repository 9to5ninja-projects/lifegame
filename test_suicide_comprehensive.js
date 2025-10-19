// Comprehensive suicide attempt and fatality analysis
const fs = require('fs');
const path = require('path');

const MortalityGameV2 = require('./game_engine_v2_homeostatic.js');
const { getAdjustedProbability, getSuicideMethodsForRegion } = require('./global_statistics_v2.js');

const birthCards = JSON.parse(fs.readFileSync('./birth_cards_json.json', 'utf8'));
const familyCards = JSON.parse(fs.readFileSync('./family_cards_json.json', 'utf8'));
const deathCards = JSON.parse(fs.readFileSync('./death_cards_json.json', 'utf8'));
const eventCards = {
  childhood: JSON.parse(fs.readFileSync('./event_cards_childhood.json', 'utf8')),
  teen: JSON.parse(fs.readFileSync('./event_cards_teen.json', 'utf8')),
  adult: JSON.parse(fs.readFileSync('./event_cards_adult.json', 'utf8'))
};

console.log("=== COMPREHENSIVE SUICIDE ATTEMPT ANALYSIS ===\n");

const game = new MortalityGameV2(birthCards, familyCards, eventCards, deathCards);

// Track detailed stats
let stats = {
  totalLives: 0,
  totalYears: 0,
  yearsWithSuicidalIdeation: 0, // risk > 0.001%
  suicideAttempts: 0,
  suicideDeaths: 0,
  nonFatalAttempts: 0,
  attemptsByAge: {},
  deathsByAge: {},
  attemptsByRegion: {},
  deathsByRegion: {},
  methodLethalityStats: {}
};

const NUM_LIVES = 10000;

console.log(`Processing ${NUM_LIVES.toLocaleString()} lives...\n`);
const startTime = Date.now();

for (let i = 0; i < NUM_LIVES; i++) {
  if ((i + 1) % 1000 === 0) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`  ${(i + 1).toLocaleString()} lives processed (${elapsed}s)`);
  }

  const birthCard = birthCards[Math.floor(Math.random() * birthCards.length)];
  const familyCard = familyCards[Math.floor(Math.random() * familyCards.length)];

  game.createPlayer(birthCard, familyCard);
  const p = game.player;
  const region = p.demographics.birthRegion;

  stats.totalLives++;
  if (!stats.attemptsByRegion[region]) stats.attemptsByRegion[region] = 0;
  if (!stats.deathsByRegion[region]) stats.deathsByRegion[region] = 0;

  // Simulate life
  for (let year = 0; year < 120; year++) {
    stats.totalYears++;

    // Track suicidal ideation
    if (p.health.mental.suicideRisk > 0.001) {
      stats.yearsWithSuicidalIdeation++;
    }

    // Run year
    const result = game.processYearEnd(p);

    // Check if they died from suicide
    if (!result.alive && result.cause === "Suicide") {
      stats.suicideDeaths++;
      if (!stats.deathsByAge[p.demographics.age]) stats.deathsByAge[p.demographics.age] = 0;
      stats.deathsByAge[p.demographics.age]++;
      stats.deathsByRegion[region]++;
      break;
    }

    // Check for suicide attempts (non-fatal)
    // This is a bit tricky - we need to detect when someone survived a suicide attempt
    // Signs: sudden drop in mental health, addition of PTSD, sudden hospitalization, increased debt
    // We'll check suicideHistory
    if (p.health.mental.suicideHistory.length > 0) {
      // Count non-fatal attempts (those recorded but still alive)
      const attemptCount = p.health.mental.suicideHistory.length;
      if (attemptCount > stats.suicideAttempts) {
        // New attempt detected!
        stats.suicideAttempts = attemptCount;
        stats.nonFatalAttempts++;
        if (!stats.attemptsByAge[p.demographics.age]) stats.attemptsByAge[p.demographics.age] = 0;
        stats.attemptsByAge[p.demographics.age]++;
        stats.attemptsByRegion[region]++;
      }
    }

    if (!result.alive) {
      break; // Player died from something else
    }
  }
}

const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

console.log(`\n${"=".repeat(80)}`);
console.log(`RESULTS (${NUM_LIVES.toLocaleString()} lives, ${elapsed}s)`);
console.log(`${"=".repeat(80)}\n`);

console.log(`Total life-years tracked: ${stats.totalYears.toLocaleString()}`);
console.log(`Years with suicidal ideation (risk > 0.001%): ${stats.yearsWithSuicidalIdeation.toLocaleString()}`);
console.log(`  → ${((stats.yearsWithSuicidalIdeation / stats.totalYears) * 100).toFixed(2)}% of all years\n`);

console.log(`SUICIDE ATTEMPTS:`);
console.log(`  Total non-fatal attempts: ${stats.nonFatalAttempts}`);
console.log(`  Attempt rate: 1 attempt per ${Math.round(stats.totalYears / Math.max(1, stats.nonFatalAttempts))} life-years`);
console.log(`  Attempt rate among ideation years: 1 per ${Math.round(stats.yearsWithSuicidalIdeation / Math.max(1, stats.nonFatalAttempts))} years\n`);

console.log(`SUICIDE DEATHS:`);
console.log(`  Total suicide deaths: ${stats.suicideDeaths}`);
console.log(`  Fatality rate: ${stats.suicideDeaths.toLocaleString()} / ${stats.totalYears.toLocaleString()} = ${(stats.suicideDeaths / stats.totalYears * 100000).toFixed(1)} per 100K`);
console.log(`  Death rate among ideation years: 1 per ${Math.round(stats.yearsWithSuicidalIdeation / Math.max(1, stats.suicideDeaths))} years`);
console.log(`  Lethality of attempts: ${stats.suicideDeaths}/${Math.max(1, stats.suicideDeaths + stats.nonFatalAttempts)} = ${((stats.suicideDeaths / Math.max(1, stats.suicideDeaths + stats.nonFatalAttempts)) * 100).toFixed(1)}%\n`);

console.log(`BY AGE (Deaths only):`);
console.log(`Age | Deaths | Rate/100K`);
console.log(`----+--------+----------`);
const deathAges = Object.keys(stats.deathsByAge).map(Number).sort((a, b) => a - b);
for (const age of deathAges) {
  const deaths = stats.deathsByAge[age];
  console.log(`${age.toString().padEnd(3)} | ${deaths.toString().padEnd(6)} | (${deaths} deaths)`);
}

console.log(`\nBY REGION (Deaths only):`);
console.log(`Region | Deaths`);
console.log(`-------+-------`);
for (const region of Object.keys(stats.deathsByRegion).sort()) {
  const deaths = stats.deathsByRegion[region];
  console.log(`${region.substring(0, 20).padEnd(20)} | ${deaths}`);
}

console.log(`\n${"=".repeat(80)}`);
console.log(`INTERPRETATION:`);
console.log(`${"=".repeat(80)}`);

const idealRate = 12.6; // 12.6 per 100K for Nordic youth
const actualRate = (stats.suicideDeaths / stats.totalYears * 100000);

console.log(`\nTarget suicide rate (Nordic baseline): ${idealRate.toFixed(1)} per 100K`);
console.log(`Actual rate in simulation: ${actualRate.toFixed(1)} per 100K`);
console.log(`Ratio: ${(actualRate / idealRate).toFixed(2)}x ${actualRate > idealRate ? 'TOO HIGH' : 'too low'}`);

if (stats.suicideDeaths === 0) {
  console.log(`\n⚠️  ISSUE: Zero suicides detected!`);
  console.log(`   - Suicidal ideation is occurring (${stats.yearsWithSuicidalIdeation} years)`);
  if (stats.nonFatalAttempts > 0) {
    console.log(`   - Attempts are happening (${stats.nonFatalAttempts} non-fatal attempts)`);
    console.log(`   - BUT: No attempts are resulting in death`);
    console.log(`   - This suggests: Method lethality is too low, OR intervention rates too high`);
  } else {
    console.log(`   - No attempts are being triggered`);
    console.log(`   - This suggests: Suicide check never passes probability roll`);
  }
}
