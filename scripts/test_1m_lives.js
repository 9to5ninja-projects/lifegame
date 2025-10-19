// Large-scale statistical test: 1 million lives
// Tests suicide, crime, addiction against real-world data

const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");
const MortalityGameV2 = require(path.join(rootDir, "game_engine_v2_homeostatic"));

const birthCards = JSON.parse(fs.readFileSync(path.join(rootDir, "birth_cards_json.json"), "utf8"));
const familyCards = JSON.parse(fs.readFileSync(path.join(rootDir, "family_cards_json.json"), "utf8"));
const deathCards = JSON.parse(fs.readFileSync(path.join(rootDir, "death_cards_json.json"), "utf8"));
const eventCards = {
  childhood: JSON.parse(fs.readFileSync(path.join(rootDir, "event_cards_childhood_v2.json"), "utf8")),
  teen: JSON.parse(fs.readFileSync(path.join(rootDir, "event_cards_teen_v2.json"), "utf8")),
  adult: JSON.parse(fs.readFileSync(path.join(rootDir, "event_cards_adult_v2.json"), "utf8"))
};

const game = new MortalityGameV2(birthCards, familyCards, eventCards, deathCards);

const NUM_LIVES = 1000000;

console.log(`\n${"=".repeat(80)}`);
console.log(`🌍 MILLION LIVES STATISTICAL TEST`);
console.log(`Testing ${NUM_LIVES.toLocaleString()} simulated lives`);
console.log(`${"=".repeat(80)}\n`);

const stats = {
  totalLives: 0,
  suicides: 0,
  crimeConvictions: 0,
  criminalYears: 0,
  addictionOnset: 0,
  addictionYears: 0,
  
  // Age-stratified suicide
  suicideByAge: {},
  
  // Crime by age and type
  crimeByAge: {},
  streetCrimeCount: 0,
  whiteCollarCrimeCount: 0,
  
  // Regional data
  suicideByRegion: {},
  crimeByRegion: {},
  
  // Death causes (top 10)
  deathCauses: {},
  
  // Average lifespan
  totalYears: 0
};

console.log(`Processing ${NUM_LIVES.toLocaleString()} lives...`);
const startTime = Date.now();

for (let i = 0; i < NUM_LIVES; i++) {
  if ((i + 1) % 100000 === 0) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const rate = ((i + 1) / (Date.now() - startTime) * 1000).toFixed(0);
    console.log(`  ${(i + 1).toLocaleString()} lives processed (${elapsed}s, ${rate} lives/sec)`);
  }

  const birthCard = birthCards[Math.floor(Math.random() * birthCards.length)];
  const familyCard = familyCards[Math.floor(Math.random() * familyCards.length)];

  game.createPlayer(birthCard, familyCard);
  const p = game.player;
  
  const region = p.demographics.birthRegion;
  stats.totalLives++;

  // Initialize region tracking
  if (!stats.suicideByRegion[region]) stats.suicideByRegion[region] = 0;
  if (!stats.crimeByRegion[region]) stats.crimeByRegion[region] = 0;

  // Simulate life (up to 120 years or death)
  for (let year = 0; year < 120; year++) {
    const result = game.processYearEnd(p);

    if (!p.alive) {
      // Track death
      const cause = result.cause || "unknown";
      stats.deathCauses[cause] = (stats.deathCauses[cause] || 0) + 1;

      // Track suicide
      if (cause === "suicide") {
        stats.suicides++;
        stats.suicideByRegion[region]++;

        const ageGroup = Math.floor(p.demographics.age / 5) * 5;
        stats.suicideByAge[ageGroup] = (stats.suicideByAge[ageGroup] || 0) + 1;
      }

      break;
    }

    // Track years lived
    stats.totalYears++;

    // Track addiction onset
    if (p.addiction.stage !== "none") {
      stats.addictionOnset++;
      stats.addictionYears++;
    }

    // Track crime
    if (p.legal.convictionCount > 0) {
      const prevCount = (p.legal.imprisonmentHistory[p.legal.imprisonmentHistory.length - 1]?.convictionCount || 0);
      if (p.legal.convictionCount > prevCount) {
        stats.crimeConvictions++;
        stats.crimeByRegion[region]++;
        
        const ageGroup = Math.floor(p.demographics.age / 5) * 5;
        if (!stats.crimeByAge[ageGroup]) stats.crimeByAge[ageGroup] = 0;
        stats.crimeByAge[ageGroup]++;
      }
    }

    // Track incarceration years
    if (p.legal.currentlyImprisoned) {
      stats.criminalYears++;
    }
  }
}

const elapsed = (Date.now() - startTime) / 1000;

console.log(`\n${"=".repeat(80)}`);
console.log(`📊 STATISTICAL RESULTS`);
console.log(`${"=".repeat(80)}\n`);

// Calculate suicide rate (per 100,000 person-years)
const suicideRate = (stats.suicides / stats.totalYears) * 100000;
console.log(`💔 SUICIDE`);
console.log(`  Total deaths: ${stats.suicides.toLocaleString()}`);
console.log(`  Rate per 100K person-years: ${suicideRate.toFixed(1)}`);
console.log(`  WHO target: 10-15 per 100K`);
console.log(`  Status: ${suicideRate > 8 && suicideRate < 20 ? "✓ ON TARGET" : "✗ NEEDS ADJUSTMENT"}`);

// Crime stats
const crimeRate = (stats.crimeConvictions / stats.totalYears) * 100000;
console.log(`\n⚖️  CRIME & INCARCERATION`);
console.log(`  Total convictions: ${stats.crimeConvictions.toLocaleString()}`);
console.log(`  Rate per 100K person-years: ${crimeRate.toFixed(1)}`);
console.log(`  Global average: 140 per 100K`);
console.log(`  Status: ${crimeRate > 100 && crimeRate < 200 ? "✓ REASONABLE" : "✗ NEEDS ADJUSTMENT"}`);
console.log(`  Total incarceration years: ${stats.criminalYears.toLocaleString()}`);

// Addiction stats
const addictionRate = (stats.addictionOnset / stats.totalLives) * 100;
console.log(`\n💊 ADDICTION`);
console.log(`  People with addiction onset: ${stats.addictionOnset.toLocaleString()}`);
console.log(`  Prevalence: ${addictionRate.toFixed(1)}%`);
console.log(`  Target: ~4%`);
console.log(`  Status: ${addictionRate > 3 && addictionRate < 5 ? "✓ ON TARGET" : "✗ NEEDS ADJUSTMENT"}`);

// Age breakdown
console.log(`\n📈 SUICIDE BY AGE GROUP`);
Object.keys(stats.suicideByAge)
  .sort((a, b) => parseInt(a) - parseInt(b))
  .slice(0, 10)
  .forEach(ageGroup => {
    const count = stats.suicideByAge[ageGroup];
    console.log(`  Ages ${ageGroup}-${parseInt(ageGroup) + 4}: ${count} (${((count / stats.suicides) * 100).toFixed(1)}%)`);
  });

// Crime by age
console.log(`\n📈 CRIME CONVICTIONS BY AGE GROUP`);
Object.keys(stats.crimeByAge)
  .sort((a, b) => parseInt(a) - parseInt(b))
  .slice(0, 10)
  .forEach(ageGroup => {
    const count = stats.crimeByAge[ageGroup];
    console.log(`  Ages ${ageGroup}-${parseInt(ageGroup) + 4}: ${count} (${((count / stats.crimeConvictions) * 100).toFixed(1)}%)`);
  });

// Top death causes
console.log(`\n⚰️  TOP DEATH CAUSES`);
Object.entries(stats.deathCauses)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .forEach(([cause, count]) => {
    const pct = ((count / NUM_LIVES) * 100).toFixed(1);
    console.log(`  ${cause}: ${count.toLocaleString()} (${pct}%)`);
  });

// Regional suicide breakdown (top 5)
console.log(`\n🌍 SUICIDE BY REGION (Top 5)`);
Object.entries(stats.suicideByRegion)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5)
  .forEach(([region, count]) => {
    const pct = ((count / stats.suicides) * 100).toFixed(1);
    console.log(`  ${region}: ${count} (${pct}%)`);
  });

// Regional crime breakdown (top 5)
console.log(`\n🌍 CRIME BY REGION (Top 5)`);
Object.entries(stats.crimeByRegion)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5)
  .forEach(([region, count]) => {
    const pct = ((count / stats.crimeConvictions) * 100).toFixed(1);
    console.log(`  ${region}: ${count} (${pct}%)`);
  });

console.log(`\n${"=".repeat(80)}`);
console.log(`⏱️  PERFORMANCE: ${elapsed.toFixed(1)}s for ${NUM_LIVES.toLocaleString()} lives = ${(NUM_LIVES / elapsed).toFixed(0)} lives/sec`);
console.log(`${"=".repeat(80)}\n`);
