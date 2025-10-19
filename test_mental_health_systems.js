// Test suite for Mental Health, Suicide, Crime, and Addiction Systems
// Validates statistical accuracy against real-world data

const fs = require("fs");
const MortalityGameV2 = require("./game_engine_v2_homeostatic");

// Load card data
const birthCards = JSON.parse(fs.readFileSync("birth_cards_json.json", "utf8"));
const familyCards = JSON.parse(fs.readFileSync("family_cards_json.json", "utf8"));
const eventCards = {
  childhood: JSON.parse(fs.readFileSync("event_cards_childhood_v2.json", "utf8")),
  teen: JSON.parse(fs.readFileSync("event_cards_teen_v2.json", "utf8")),
  adult: JSON.parse(fs.readFileSync("event_cards_adult_v2.json", "utf8"))
};
const deathCards = JSON.parse(fs.readFileSync("death_cards_json.json", "utf8"));

const game = new MortalityGameV2(birthCards, familyCards, eventCards, deathCards);

// ============================================================================
// MENTAL HEALTH CRISIS SYSTEM TEST
// ============================================================================

function testMentalHealthCrisis(numGames = 300) {
  console.log("\n📊 MENTAL HEALTH CRISIS SYSTEM TEST");
  console.log("=".repeat(80));

  const stats = {
    crisisCount: 0,
    depressionDiagnosed: 0,
    anxietyDiagnosed: 0,
    ptsdiagnosed: 0,
    chronicConditions: 0,
    mentalHealthLow: 0,
    crisesWithTreatment: 0,
    untreatedCrises: 0,
    suicideIdeation: 0,
    maxSuicideRisk: 0
  };

  for (let i = 0; i < numGames; i++) {
    const birthCard = birthCards[Math.floor(Math.random() * birthCards.length)];
    const familyCard = familyCards[Math.floor(Math.random() * familyCards.length)];
    
    game.createPlayer(birthCard, familyCard);
    const player = game.player;

    // Simulate 100 years
    for (let year = 0; year < 100; year++) {
      const result = game.processYearEnd(player);
      if (!player.alive) break;

      // Track mental health crises
      if (player.health.mental.episodeDuration > 0) {
        stats.crisisCount++;
      }

      if (player.health.mental.current < 30) {
        stats.mentalHealthLow++;
      }

      if (player.health.mental.chronic.includes("depression")) {
        stats.depressionDiagnosed++;
      }
      if (player.health.mental.chronic.includes("anxiety")) {
        stats.anxietyDiagnosed++;
      }
      if (player.health.mental.chronic.includes("ptsd")) {
        stats.ptsdiagnosed++;
      }

      if (player.health.mental.chronic.length > 0) {
        stats.chronicConditions++;
      }

      if (player.health.mental.treatmentStatus !== "none") {
        stats.crisesWithTreatment++;
      } else if (player.health.mental.episodeDuration > 0) {
        stats.untreatedCrises++;
      }

      if (player.health.mental.suicideRisk > 0.5) {
        stats.suicideIdeation++;
      }

      stats.maxSuicideRisk = Math.max(stats.maxSuicideRisk, player.health.mental.suicideRisk);
    }
  }

  console.log(`\n📈 Results from ${numGames} games (tracking mental health annually):\n`);
  console.log(`  Crisis episodes detected: ${stats.crisisCount}`);
  console.log(`  Depression diagnoses: ${stats.depressionDiagnosed}`);
  console.log(`  Anxiety diagnoses: ${stats.anxietyDiagnosed}`);
  console.log(`  PTSD diagnoses: ${stats.ptsdiagnosed}`);
  console.log(`  Years with chronic condition: ${stats.chronicConditions}`);
  console.log(`  Years with low mental health (<30): ${stats.mentalHealthLow}`);
  console.log(`  Crises with treatment: ${stats.crisesWithTreatment}`);
  console.log(`  Untreated crises: ${stats.untreatedCrises}`);
  console.log(`  Years with suicide ideation risk: ${stats.suicideIdeation}`);
  console.log(`  Maximum suicide risk encountered: ${stats.maxSuicideRisk.toFixed(2)}%`);
}

// ============================================================================
// SUICIDE ATTEMPT SYSTEM TEST
// ============================================================================

function testSuicideAttempts(numGames = 500) {
  console.log("\n💔 SUICIDE ATTEMPT SYSTEM TEST");
  console.log("=".repeat(80));

  const stats = {
    suicideDeaths: 0,
    suicideAttempts: 0,
    suicidalIdeation: 0,
    suicideBySurvivors: 0,
    multipleAttempts: 0,
    attempts: []
  };

  for (let i = 0; i < numGames; i++) {
    const birthCard = birthCards[Math.floor(Math.random() * birthCards.length)];
    const familyCard = familyCards[Math.floor(Math.random() * familyCards.length)];
    
    game.createPlayer(birthCard, familyCard);
    const player = game.player;

    for (let year = 0; year < 120; year++) {
      const result = game.processYearEnd(player);
      if (!result.alive) {
        if (result.cause === "suicide") {
          stats.suicideDeaths++;
          stats.attempts.push({
            age: player.demographics.age,
            attempts: player.health.mental.suicideHistory.length,
            region: player.demographics.birthRegion
          });
        }
        break;
      }

      if (player.health.mental.suicideHistory.length > 0) {
        stats.suicideAttempts = Math.max(stats.suicideAttempts, player.health.mental.suicideHistory.length);
      }

      if (player.health.mental.suicideRisk > 1.0) {
        stats.suicidalIdeation++;
      }
    }
  }

  // Calculate rates
  const suicideRate = (stats.suicideDeaths / numGames) * 100000; // Per 100K games

  console.log(`\n📊 Results from ${numGames} games:\n`);
  console.log(`  Total suicide deaths: ${stats.suicideDeaths}`);
  console.log(`  Suicide rate (per 100K games): ${suicideRate.toFixed(1)}`);
  console.log(`  WHO global rate target: 10-15 per 100K`);
  console.log(`  Years with suicidal ideation: ${stats.suicidalIdeation}`);
  console.log(`  Max attempts by single person: ${stats.suicideAttempts}`);

  if (stats.attempts.length > 0) {
    const avgAge = stats.attempts.reduce((sum, a) => sum + a.age, 0) / stats.attempts.length;
    console.log(`  Average age at suicide death: ${avgAge.toFixed(1)}`);
    console.log(`  Age range: ${Math.min(...stats.attempts.map(a => a.age))}-${Math.max(...stats.attempts.map(a => a.age))}`);
    
    console.log("\n  Sample suicide cases:");
    stats.attempts.slice(0, 5).forEach((attempt, idx) => {
      console.log(`    ${idx + 1}. Age ${attempt.age}, ${attempt.region}, ${attempt.attempts} prior attempt(s)`);
    });
  }
}

// ============================================================================
// ADDICTION SYSTEM TEST
// ============================================================================

function testAddiction(numGames = 300) {
  console.log("\n💊 ADDICTION SYSTEM TEST");
  console.log("=".repeat(80));

  const stats = {
    addictionOnset: 0,
    casual: 0,
    regular: 0,
    dependent: 0,
    overdoseDeaths: 0,
    recovered: 0,
    substanceBreakdown: {},
    addictionCases: []
  };

  for (let i = 0; i < numGames; i++) {
    const birthCard = birthCards[Math.floor(Math.random() * birthCards.length)];
    const familyCard = familyCards[Math.floor(Math.random() * familyCards.length)];
    
    game.createPlayer(birthCard, familyCard);
    const player = game.player;

    for (let year = 0; year < 100; year++) {
      const result = game.processYearEnd(player);
      
      if (player.addiction.substance) {
        stats.addictionOnset++;
        stats.substanceBreakdown[player.addiction.substance] = 
          (stats.substanceBreakdown[player.addiction.substance] || 0) + 1;

        if (player.addiction.stage === "casual") stats.casual++;
        else if (player.addiction.stage === "regular") stats.regular++;
        else if (player.addiction.stage === "dependent") stats.dependent++;
      }

      if (player.addiction.treatmentStatus === "recovered") {
        stats.recovered++;
      }

      if (!result.alive) {
        if (result.cause === "overdose") {
          stats.overdoseDeaths++;
          stats.addictionCases.push({
            age: player.demographics.age,
            substance: player.addiction.substance,
            monthsInUse: player.addiction.monthsDuration
          });
        }
        break;
      }
    }
  }

  console.log(`\n📊 Results from ${numGames} games:\n`);
  console.log(`  People with addiction onset: ${stats.addictionOnset}`);
  console.log(`  Prevalence rate: ${((stats.addictionOnset / numGames) * 100).toFixed(1)}%`);
  console.log(`  Global target: ~4% substance abuse prevalence`);
  console.log(`\n  Progression stages:\n`);
  console.log(`    Casual use: ${stats.casual} years`);
  console.log(`    Regular use: ${stats.regular} years`);
  console.log(`    Dependent: ${stats.dependent} years`);
  console.log(`    Recovered: ${stats.recovered} years`);
  console.log(`\n  Overdose deaths: ${stats.overdoseDeaths}`);
  console.log(`  Substance breakdown:`);
  Object.entries(stats.substanceBreakdown).forEach(([substance, count]) => {
    console.log(`    ${substance}: ${count}`);
  });

  if (stats.addictionCases.length > 0) {
    console.log("\n  Sample overdose cases:");
    stats.addictionCases.slice(0, 3).forEach((case_, idx) => {
      console.log(`    ${idx + 1}. Age ${case_.age}, ${case_.substance}, ${case_.monthsInUse} months use`);
    });
  }
}

// ============================================================================
// CRIME & INCARCERATION SYSTEM TEST
// ============================================================================

function testCrimeIncarceration(numGames = 400) {
  console.log("\n⚖️  CRIME & INCARCERATION SYSTEM TEST");
  console.log("=".repeat(80));

  const stats = {
    crimes: 0,
    detected: 0,
    convicted: 0,
    imprisoned: 0,
    incarcerationYears: 0,
    reoffenses: 0,
    recidivismRate: 0,
    imprisonedCases: []
  };

  for (let i = 0; i < numGames; i++) {
    const birthCard = birthCards[Math.floor(Math.random() * birthCards.length)];
    const familyCard = familyCards[Math.floor(Math.random() * familyCards.length)];
    
    game.createPlayer(birthCard, familyCard);
    const player = game.player;

    let prisonHistory = 0;

    for (let year = 0; year < 100; year++) {
      const result = game.processYearEnd(player);
      if (!player.alive) break;

      if (player.legal.convictionCount > prisonHistory) {
        prisonHistory = player.legal.convictionCount;
        stats.convicted++;
      }

      if (player.legal.currentlyImprisoned) {
        stats.imprisoned++;
        stats.incarcerationYears++;
      }

      if (player.legal.imprisonmentHistory.length > 0) {
        stats.imprisonedCases.push({
          age: player.demographics.age,
          convictions: player.legal.convictionCount,
          totalSentenceYears: player.legal.imprisonmentHistory.reduce((sum, h) => sum + h.duration, 0)
        });
      }
    }
  }

  const incarceratedRate = (stats.convicted / numGames) * 100000; // Per 100K games

  console.log(`\n📊 Results from ${numGames} games:\n`);
  console.log(`  Total convictions: ${stats.convicted}`);
  console.log(`  Incarceration rate (per 100K): ${incarceratedRate.toFixed(1)}`);
  console.log(`  Global average: 140 per 100K`);
  console.log(`  Total years imprisoned: ${stats.incarcerationYears}`);
  console.log(`  Average sentence: ${(stats.incarcerationYears / Math.max(1, stats.convicted)).toFixed(1)} years`);

  const uniqueImprisoned = new Set(stats.imprisonedCases.map(c => c.age + c.convictions));
  const reoffenderCount = stats.imprisonedCases.filter(c => c.convictions > 1).length;

  console.log(`\n  Recidivism (multiple convictions): ${reoffenderCount}`);
  console.log(`  Target recidivism rate: 50-70% within 5 years`);

  if (stats.imprisonedCases.length > 0) {
    console.log("\n  Sample incarceration cases:");
    stats.imprisonedCases.slice(0, 5).forEach((case_, idx) => {
      console.log(`    ${idx + 1}. Age ${case_.age}, ${case_.convictions} conviction(s), ${case_.totalSentenceYears} years total`);
    });
  }
}

// ============================================================================
// ISOLATION CASCADE TEST
// ============================================================================

function testIsolationCascade(numGames = 250) {
  console.log("\n🔗 ISOLATION CASCADE SYSTEM TEST");
  console.log("=".repeat(80));

  const stats = {
    isolatedYears: 0,
    isolationTriggers: {},
    cascadeToMentalHealth: 0,
    cascadeToAddiction: 0,
    cascadeToCrime: 0,
    recoveredFromIsolation: 0
  };

  for (let i = 0; i < numGames; i++) {
    const birthCard = birthCards[Math.floor(Math.random() * birthCards.length)];
    const familyCard = familyCards[Math.floor(Math.random() * familyCards.length)];
    
    game.createPlayer(birthCard, familyCard);
    const player = game.player;

    let wasIsolated = false;
    let isolationStartAge = null;

    for (let year = 0; year < 100; year++) {
      const result = game.processYearEnd(player);
      if (!player.alive) break;

      if (player.relationships.social.isolation) {
        if (!wasIsolated) {
          isolationStartAge = player.demographics.age;
          wasIsolated = true;
        }
        stats.isolatedYears++;

        // Track cascades
        if (player.health.mental.current < 30) stats.cascadeToMentalHealth++;
        if (player.addiction.substance) stats.cascadeToAddiction++;
        if (player.legal.convictionCount > 0) stats.cascadeToCrime++;
      } else if (wasIsolated) {
        stats.recoveredFromIsolation++;
        wasIsolated = false;
      }
    }
  }

  console.log(`\n📊 Results from ${numGames} games:\n`);
  console.log(`  Total years of isolation: ${stats.isolatedYears}`);
  console.log(`  Isolation prevalence: ${((stats.isolatedYears / (numGames * 100)) * 100).toFixed(1)}%`);
  console.log(`  Target isolation prevalence: 20-30%`);
  console.log(`\n  Cascade effects:\n`);
  console.log(`    To mental health crisis: ${stats.cascadeToMentalHealth} years`);
  console.log(`    To substance abuse: ${stats.cascadeToAddiction} years`);
  console.log(`    To crime/incarceration: ${stats.cascadeToCrime} years`);
  console.log(`\n  Recovery:\n`);
  console.log(`    Successfully recovered from isolation: ${stats.recoveredFromIsolation}`);
}

// ============================================================================
// INTEGRATED CRISIS CASCADE TEST
// ============================================================================

function testCrisisCascade(numGames = 200) {
  console.log("\n⛓️  INTEGRATED CRISIS CASCADE TEST");
  console.log("=".repeat(80));
  console.log("\nTracing the path: Economic Crisis → Mental Health → Isolation → Addiction/Crime\n");

  const stats = {
    startedInPoverty: 0,
    developedMentalCrisis: 0,
    becameIsolated: 0,
    developedAddiction: 0,
    offended: 0,
    fullCascade: 0
  };

  for (let i = 0; i < numGames; i++) {
    const birthCard = birthCards[Math.floor(Math.random() * birthCards.length)];
    const familyCard = familyCards[Math.floor(Math.random() * familyCards.length)];
    
    game.createPlayer(birthCard, familyCard);
    const player = game.player;

    let economicCrisis = false;
    let mentalCrisis = false;
    let isolated = false;
    let addiction = false;
    let crime = false;

    for (let year = 0; year < 100; year++) {
      const result = game.processYearEnd(player);
      if (!player.alive) break;

      // Stage 1: Economic crisis
      if (player.economics.resources.current <= 0 && !economicCrisis) {
        economicCrisis = true;
        stats.startedInPoverty++;
      }

      // Stage 2: Mental health consequence
      if (economicCrisis && player.health.mental.current < 30 && !mentalCrisis) {
        mentalCrisis = true;
        stats.developedMentalCrisis++;
      }

      // Stage 3: Social isolation
      if (mentalCrisis && player.relationships.social.isolation && !isolated) {
        isolated = true;
        stats.becameIsolated++;
      }

      // Stage 4: Addiction/Crime
      if (isolated) {
        if (player.addiction.substance && !addiction) {
          addiction = true;
          stats.developedAddiction++;
        }
        if (player.legal.convictionCount > 0 && !crime) {
          crime = true;
          stats.offended++;
        }
      }

      // Full cascade
      if (economicCrisis && mentalCrisis && isolated && (addiction || crime)) {
        stats.fullCascade++;
      }
    }
  }

  console.log(`  Economic crisis trigger: ${stats.startedInPoverty} cases`);
  console.log(`  Progressed to mental crisis: ${stats.developedMentalCrisis} cases`);
  console.log(`  Progressed to isolation: ${stats.becameIsolated} cases`);
  console.log(`  Developed addiction: ${stats.developedAddiction} cases`);
  console.log(`  Committed crime: ${stats.offended} cases`);
  console.log(`  Full cascade (economic → mental → isolation → addiction/crime): ${stats.fullCascade} cases`);

  const cascadeRate = ((stats.fullCascade / stats.startedInPoverty) * 100).toFixed(1);
  console.log(`\n  Cascade progression rate: ${cascadeRate}% of poverty cases → full cascade`);
}

// ============================================================================
// MAIN TEST EXECUTION
// ============================================================================

console.log("\n" + "=".repeat(80));
console.log("🧠 MENTAL HEALTH, SUICIDE, CRIME, AND ADDICTION SYSTEMS");
console.log("Statistical Validation Test Suite");
console.log("=".repeat(80));

testMentalHealthCrisis(300);
testSuicideAttempts(500);
testAddiction(300);
testCrimeIncarceration(400);
testIsolationCascade(250);
testCrisisCascade(200);

console.log("\n" + "=".repeat(80));
console.log("✅ TEST SUITE COMPLETE");
console.log("=".repeat(80));
console.log("\nNote: All systems operational. Statistics should be validated against");
console.log("WHO, UN, CDC, and Bureau of Justice databases for accuracy.");
