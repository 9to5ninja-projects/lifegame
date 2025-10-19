// Large-scale test with EVENT APPLICATION
// 1 million lives with realistic event triggering

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

// Helper function to select appropriate events by age
function getEventsForAge(age) {
  if (age < 13) return eventCards.childhood;
  if (age < 18) return eventCards.teen;
  return eventCards.adult;
}

// Helper to apply random qualifying event
function applyRandomEvent(player, game) {
  const age = player.demographics.age;
  
  // Filter to only apply NON-DEATH, NON-DISEASE events
  // Death/disease events should only be applied by specialized logic
  const BLOCK_KEYWORDS = ["dies", "death", "disease", "illness", "malaria", "diarrhea", "pneumonia", "accident", "drowning", "starvation", "malnutrition", "disaster", "domestic"];
  
  const availableEvents = getEventsForAge(age)
    .filter(event => {
      // Skip harmful/death events
      if (BLOCK_KEYWORDS.some(keyword => event.id && event.id.toLowerCase().includes(keyword))) {
        return false;
      }
      
      // Check age range
      if (event.ageRange) {
        const [minAge, maxAge] = event.ageRange;
        if (age < minAge || age > maxAge) return false;
      }
      
      // Simple requirement check
      if (event.requires) {
        if (event.requires["relationships.partner.exists"] === true && !player.relationships.partner.exists) return false;
        if (event.requires["relationships.partner.exists"] === false && player.relationships.partner.exists) return false;
        if (event.requires["relationships.partner.married"] === true && !player.relationships.partner.married) return false;
      }
      
      return true;
    });

  if (availableEvents.length === 0) return null;

  const event = availableEvents[Math.floor(Math.random() * availableEvents.length)];
  
  try {
    game.applyEventEffects(event, player);
    return event;
  } catch (e) {
    // Silently skip events that have errors
    return null;
  }
}

const NUM_LIVES = 1000000;

console.log(`\n${"=".repeat(80)}`);
console.log(`🌍 MILLION LIVES TEST WITH EVENT INTEGRATION`);
console.log(`Testing ${NUM_LIVES.toLocaleString()} simulated lives (WITH events)`);
console.log(`${"=".repeat(80)}\n`);

const stats = {
  totalLives: 0,
  suicides: 0,
  crimeConvictions: 0,
  addictionOnset: 0,
  
  // Age-stratified
  suicideByAge: {},
  crimeByAge: {},
  
  // Death causes
  deathCauses: {},
  
  // Events applied
  eventsApplied: 0,
  eventsTriggered: {},
  
  // Average lifespan
  totalYears: 0,
  avgAge: 0
};

console.log(`Processing ${NUM_LIVES.toLocaleString()} lives with events...`);
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
  
  stats.totalLives++;
  let age = 0;

  // Simulate life
  for (let year = 0; year < 120; year++) {
    age = p.demographics.age;

    // Apply random events with some probability each year
    // Most people experience 0-2 major life events per year
    const eventRoll = Math.random();
    if (eventRoll < 0.15) { // 15% chance of event per year
      const event = applyRandomEvent(p, game);
      if (event) {
        stats.eventsApplied++;
        stats.eventsTriggered[event.id] = (stats.eventsTriggered[event.id] || 0) + 1;
      }
    }

    const result = game.processYearEnd(p);

    if (!p.alive) {
      // Track death
      const cause = result.cause || "unknown";
      stats.deathCauses[cause] = (stats.deathCauses[cause] || 0) + 1;

      // Track suicide
      if (cause === "suicide") {
        stats.suicides++;
        const ageGroup = Math.floor(age / 5) * 5;
        stats.suicideByAge[ageGroup] = (stats.suicideByAge[ageGroup] || 0) + 1;
      }

      break;
    }

    stats.totalYears++;

    // Track addiction onset
    if (p.addiction.stage !== "none") {
      stats.addictionOnset++;
    }

    // Track crime
    if (p.legal.convictionCount > 0) {
      stats.crimeConvictions++;
      const ageGroup = Math.floor(age / 5) * 5;
      if (!stats.crimeByAge[ageGroup]) stats.crimeByAge[ageGroup] = 0;
      stats.crimeByAge[ageGroup]++;
    }
  }
  
  stats.avgAge += age;
}

stats.avgAge = stats.avgAge / NUM_LIVES;
const elapsed = (Date.now() - startTime) / 1000;

console.log(`\n${"=".repeat(80)}`);
console.log(`📊 RESULTS WITH EVENTS`);
console.log(`${"=".repeat(80)}\n`);

// Calculate rates
const suicideRate = (stats.suicides / stats.totalYears) * 100000;
const crimeRate = (stats.crimeConvictions / stats.totalYears) * 100000;
const addictionRate = (stats.addictionOnset / stats.totalLives) * 100;

console.log(`💔 SUICIDE`);
console.log(`  Deaths: ${stats.suicides.toLocaleString()}`);
console.log(`  Rate per 100K person-years: ${suicideRate.toFixed(1)}`);
console.log(`  WHO target: 10-15 per 100K`);
console.log(`  Status: ${suicideRate > 8 && suicideRate < 20 ? "✓ ON TARGET" : "✗ NEEDS ADJUSTMENT"}`);

console.log(`\n⚖️  CRIME`);
console.log(`  Convictions: ${stats.crimeConvictions.toLocaleString()}`);
console.log(`  Rate per 100K person-years: ${crimeRate.toFixed(1)}`);
console.log(`  Target: 140 per 100K`);
console.log(`  Status: ${crimeRate > 100 && crimeRate < 200 ? "✓ REASONABLE" : "✗ NEEDS ADJUSTMENT"}`);

console.log(`\n💊 ADDICTION`);
console.log(`  Onset cases: ${stats.addictionOnset.toLocaleString()}`);
console.log(`  Prevalence: ${addictionRate.toFixed(1)}%`);
console.log(`  Target: ~4%`);
console.log(`  Status: ${addictionRate > 3 && addictionRate < 5 ? "✓ ON TARGET" : "✗ NEEDS ADJUSTMENT"}`);

console.log(`\n📈 AVERAGE LIFESPAN`);
console.log(`  Average age at death: ${stats.avgAge.toFixed(1)} years`);
console.log(`  Global average: ~73 years`);

console.log(`\n🎲 EVENT STATISTICS`);
console.log(`  Total events applied: ${stats.eventsApplied.toLocaleString()}`);
console.log(`  Average events per life: ${(stats.eventsApplied / NUM_LIVES).toFixed(2)}`);
console.log(`  Events triggered per year (approx): ${((stats.eventsApplied / stats.totalYears) * 100).toFixed(1)}%`);

console.log(`\n⚰️  TOP DEATH CAUSES (Top 10)`);
Object.entries(stats.deathCauses)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .forEach(([cause, count]) => {
    const pct = ((count / NUM_LIVES) * 100).toFixed(1);
    console.log(`  ${cause}: ${pct}%`);
  });

console.log(`\n📍 TOP EVENTS TRIGGERED (Top 15)`);
Object.entries(stats.eventsTriggered)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 15)
  .forEach(([eventId, count]) => {
    const pct = ((count / stats.eventsApplied) * 100).toFixed(1);
    console.log(`  ${eventId}: ${count.toLocaleString()} (${pct}%)`);
  });

console.log(`\n${"=".repeat(80)}`);
console.log(`⏱️  PERFORMANCE: ${elapsed.toFixed(1)}s = ${(NUM_LIVES / elapsed).toFixed(0)} lives/sec`);
console.log(`${"=".repeat(80)}\n`);
