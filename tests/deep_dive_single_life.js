/**
 * DEEP DIVE SINGLE LIFE TRACKER
 * 
 * Traces a single life from birth to death, tracking ALL systems:
 * - Demographics
 * - Health (chronic diseases, congenital, acute crises, cancer, mental health)
 * - Employment and economics
 * - Housing and circumstances
 * - Relationships and family
 * - All major life events with full system annotations
 * 
 * Purpose: Verify each system is working correctly and identify gaps
 * Usage: node deep_dive_single_life.js [lifeNumber] [region]
 */

const path = require('path');
const fs = require('fs');

// Go up to root to load engine
const rootDir = path.join(__dirname, '..');
const GameEngine = require(path.join(rootDir, 'game_engine_v2_homeostatic.js'));

// Load cards from data/ directory
const birthCards = JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'birth_cards_json.json'), 'utf8'));
const familyCards = JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'family_cards_json.json'), 'utf8'));
const eventCards = {
  childhood: JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'event_cards_childhood.json'), 'utf8')),
  teen: JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'event_cards_teen.json'), 'utf8')),
  adult: JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'event_cards_adult.json'), 'utf8'))
};
const deathCards = JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'death_cards_json.json'), 'utf8'));

// ============================================================================
// SYSTEM TRACKING
// ============================================================================

const SYSTEMS = {
  chronicDiseases: 'Chronic Diseases',
  congenitalConditions: 'Congenital Conditions',
  acuteCrises: 'Acute Crises',
  cancer: 'Cancer System',
  accidents: 'Accidents',
  mentalHealth: 'Mental Health/Suicide',
  retirement: 'Retirement',
  employment: 'Employment',
  housing: 'Housing',
  relationships: 'Relationships',
  substanceAbuse: 'Substance Abuse'
};

// ============================================================================
// LIFE TRACKING
// ============================================================================

function traceLife(lifeNum, regionFilter = null) {
  console.log('\n' + '='.repeat(90));
  console.log(`DEEP DIVE LIFE TRACE #${lifeNum}`.padStart(50));
  console.log('='.repeat(90) + '\n');

  const engine = new GameEngine(birthCards, familyCards, eventCards, deathCards);

  // Select birth card (random or filtered by region)
  let birthCard;
  if (regionFilter) {
    const filtered = birthCards.filter(b => b.name.toLowerCase().includes(regionFilter.toLowerCase()));
    birthCard = filtered.length > 0 ? filtered[Math.floor(Math.random() * filtered.length)] : birthCards[Math.floor(Math.random() * birthCards.length)];
  } else {
    birthCard = birthCards[Math.floor(Math.random() * birthCards.length)];
  }

  const familyCard = familyCards[Math.floor(Math.random() * familyCards.length)];
  
  engine.createPlayer(birthCard, familyCard, { 
    sex: Math.random() > 0.5 ? 'male' : 'female' 
  });
  
  const player = engine.player;

  // ========================================================================
  // BIRTH SUMMARY
  // ========================================================================

  console.log(`┌${'─'.repeat(88)}┐`);
  console.log(`│ BIRTH CHARACTERISTICS`.padEnd(89) + `│`);
  console.log(`├${'─'.repeat(88)}┤`);
  console.log(`│ Region              : ${player.demographics.birthRegion.padEnd(60)} │`);
  console.log(`│ Sex                 : ${player.demographics.sex.padEnd(60)} │`);
  console.log(`│ Birth Family        : ${familyCard.name.padEnd(60)} │`);
  console.log(`│ Starting Resources  : ${player.economics.resources.current.toFixed(1).padEnd(60)} │`);
  console.log(`│ Starting Health     : ${player.health.physical.current.toFixed(1)}/100 (baseline: ${player.health.physical.baseline.toFixed(1)})${' '.repeat(27)} │`);
  console.log(`│ Life Expectancy     : ${player.demographics.lifeExpectancy.toFixed(1)} years${' '.repeat(53)} │`);
  console.log(`│ Mental Baseline     : ${player.health.mental.baseline.toFixed(1)}/100${' '.repeat(58)} │`);
  console.log(`└${'─'.repeat(88)}┘\n`);

  // Track system activations
  const systemsActive = {};
  Object.keys(SYSTEMS).forEach(key => systemsActive[key] = false);

  // ========================================================================
  // YEAR BY YEAR SIMULATION WITH DETAILED LOGGING
  // ========================================================================

  const events = [];
  let lastPhysicalHealth = player.health.physical.current;
  let lastMentalHealth = player.health.mental.current;
  let lastResources = player.economics.resources.current;
  let lastChronicCount = 0;

  console.log(`Age | Event Summary`.padEnd(85) + `| Health | Mental | Resources`);
  console.log('─'.repeat(90));

  for (let year = 0; year < 110 && player.alive; year++) {
    const age = player.demographics.age;
    
    // Pre-year snapshot
    const preState = {
      chronicCount: (player.health.chronic?.active || []).length,
      cancer: player.health.cancer?.stage || 0,
      addiction: player.addiction?.stage || 'none',
      mentalHealth: player.health.mental.current,
      physicalHealth: player.health.physical.current
    };

    // Process year
    engine.processYearEnd(player);

    // Post-year analysis
    const deltaHealth = player.health.physical.current - lastPhysicalHealth;
    const deltaMental = player.health.mental.current - lastMentalHealth;
    const deltaResources = player.economics.resources.current - lastResources;
    const deltaChronicCount = (player.health.chronic?.active || []).length - preState.chronicCount;

    // Detect events
    let eventStr = '';
    let eventOccurred = false;

    // Congenital at birth
    if (age === 0 && player.health.congenital.hasCondition) {
      eventStr = `[CONGENITAL] ${player.health.congenital.condition}`;
      systemsActive.congenitalConditions = true;
      eventOccurred = true;
    }

    // New chronic disease diagnosis
    if (deltaChronicCount > 0) {
      const newDiseases = (player.health.chronic.active || []).slice(-deltaChronicCount).map(d => d.disease);
      eventStr = `[CHRONIC] Diagnosed: ${newDiseases.join(', ')}`;
      systemsActive.chronicDiseases = true;
      eventOccurred = true;
    }

    // Cancer onset/progression
    if (player.health.cancer.stage > 0 && preState.cancer === 0) {
      eventStr = `[CANCER] Stage ${player.health.cancer.stage}`;
      systemsActive.cancer = true;
      eventOccurred = true;
    }

    // Acute crisis (sudden health drop)
    if (deltaHealth < -5) {
      eventStr = `[ACUTE CRISIS] Health drop: ${deltaHealth.toFixed(1)}`;
      systemsActive.acuteCrises = true;
      eventOccurred = true;
    }

    // Mental health crisis
    if (deltaMental < -15 || (player.health.mental.current <= 20 && preState.mentalHealth > 20)) {
      eventStr = `[MENTAL CRISIS] Mental: ${lastMentalHealth.toFixed(1)} → ${player.health.mental.current.toFixed(1)}`;
      systemsActive.mentalHealth = true;
      eventOccurred = true;
    }

    // Substance abuse
    if (player.addiction.stage !== 'none' && preState.addiction === 'none') {
      eventStr = `[SUBSTANCE] ${player.addiction.substance} - Stage: ${player.addiction.stage}`;
      systemsActive.substanceAbuse = true;
      eventOccurred = true;
    }

    // Retirement
    if (player.retired === true && age >= 55 && year === 0) {
      eventStr = `[RETIREMENT] Age ${age}, Resources: ${player.economics.resources.current.toFixed(1)}`;
      systemsActive.retirement = true;
      eventOccurred = true;
    }

    // Employment status change
    if (player.employment?.employed && age >= 15 && age <= 65 && !systemsActive.employment) {
      eventStr = `[EMPLOYMENT] Employed, Income: ${player.economics.income.current.toFixed(1)}`;
      systemsActive.employment = true;
      eventOccurred = true;
    }

    // Housing status
    if (player.circumstances?.housing?.status && !systemsActive.housing) {
      eventStr = `[HOUSING] ${player.circumstances.housing.status} - Quality: ${player.circumstances.housing.quality}`;
      systemsActive.housing = true;
      eventOccurred = true;
    }

    // Relationships
    if (player.relationships && Object.keys(player.relationships).length > 0 && !systemsActive.relationships) {
      eventStr = `[RELATIONSHIPS] Tracked`;
      systemsActive.relationships = true;
      eventOccurred = true;
    }

    // Log significant events or milestone years
    if (eventOccurred || age % 10 === 0 || age === 18 || age === 65) {
      if (!eventStr && age % 10 === 0) {
        eventStr = `Decade milestone`;
      }
      if (!eventStr && age === 18) {
        eventStr = `Adult transition`;
      }
      if (!eventStr && age === 65) {
        eventStr = `Retirement age`;
      }

      console.log(
        `${String(age).padStart(3)} | ${eventStr.padEnd(55)} | ` +
        `${player.health.physical.current.toFixed(1).padStart(5)} | ` +
        `${player.health.mental.current.toFixed(1).padStart(5)} | ` +
        `${player.economics.resources.current.toFixed(1).padStart(9)}`
      );

      if (eventOccurred) {
        events.push({ age, event: eventStr });
      }
    }

    lastPhysicalHealth = player.health.physical.current;
    lastMentalHealth = player.health.mental.current;
    lastResources = player.economics.resources.current;
  }

  // ========================================================================
  // DEATH SUMMARY
  // ========================================================================

  console.log('─'.repeat(90));
  console.log(`\n┌${'─'.repeat(88)}┐`);
  console.log(`│ DEATH SUMMARY`.padEnd(89) + `│`);
  console.log(`├${'─'.repeat(88)}┤`);
  console.log(`│ Age at Death        : ${String(player.demographics.age).padEnd(60)} │`);
  console.log(`│ Cause of Death      : ${(player.causeOfDeath || 'unknown').padEnd(60)} │`);
  console.log(`│ Life Expectancy     : ${player.demographics.lifeExpectancy.toFixed(1)} years${' '.repeat(53)} │`);
  console.log(`│ Years vs Expected   : ${((player.demographics.age - player.demographics.lifeExpectancy).toFixed(1)).padEnd(60)} │`);
  console.log(`│ Final Resources     : ${player.economics.resources.current.toFixed(1).padEnd(60)} │`);
  console.log(`│ Final Health        : ${player.health.physical.current.toFixed(1)}/100${' '.repeat(58)} │`);
  console.log(`│ Final Mental Health : ${player.health.mental.current.toFixed(1)}/100${' '.repeat(58)} │`);
  console.log(`└${'─'.repeat(88)}┘\n`);

  // ========================================================================
  // SYSTEMS VERIFICATION
  // ========================================================================

  const activeSystems = Object.entries(systemsActive).filter(([_, active]) => active);

  console.log(`┌${'─'.repeat(88)}┐`);
  console.log(`│ SYSTEMS ACTIVATED: ${activeSystems.length}/${Object.keys(SYSTEMS).length}`.padEnd(89) + `│`);
  console.log(`├${'─'.repeat(88)}┤`);
  
  activeSystems.forEach(([key, _]) => {
    console.log(`│ ✓ ${SYSTEMS[key].padEnd(85)} │`);
  });

  const inactiveSystems = Object.entries(systemsActive).filter(([_, active]) => !active);
  if (inactiveSystems.length > 0) {
    console.log(`├${'─'.repeat(88)}┤`);
    console.log(`│ NOT ACTIVATED (${inactiveSystems.length}):`.padEnd(89) + `│`);
    inactiveSystems.forEach(([key, _]) => {
      console.log(`│   ✗ ${SYSTEMS[key].padEnd(83)} │`);
    });
  }

  console.log(`└${'─'.repeat(88)}┘\n`);

  // ========================================================================
  // LIFE EVENT SUMMARY
  // ========================================================================

  console.log(`┌${'─'.repeat(88)}┐`);
  console.log(`│ MAJOR LIFE EVENTS: ${events.length} total`.padEnd(89) + `│`);
  console.log(`├${'─'.repeat(88)}┤`);
  
  if (events.length > 0) {
    events.forEach((e, idx) => {
      console.log(`│ ${String(idx + 1).padStart(2)}. Age ${String(e.age).padStart(3)}: ${e.event.padEnd(75)} │`);
    });
  } else {
    console.log(`│ No major events recorded (quiet life)`.padEnd(89) + `│`);
  }

  console.log(`└${'─'.repeat(88)}┘\n`);

  return {
    lifeNum,
    region: player.demographics.birthRegion,
    sex: player.demographics.sex,
    ageAtDeath: player.demographics.age,
    cause: player.causeOfDeath,
    lifeExpectancy: player.demographics.lifeExpectancy,
    yearsVsExpected: player.demographics.age - player.demographics.lifeExpectancy,
    systemsActive: activeSystems.length,
    totalSystems: Object.keys(SYSTEMS).length,
    systems: systemsActive,
    events
  };
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

const lifeNum = parseInt(process.argv[2] || '1');
const region = process.argv[3] || null;

console.log('\n╔' + '═'.repeat(88) + '╗');
console.log('║ ' + 'DEEP DIVE LIFE VERIFICATION - SINGLE LIFE TRACE'.padEnd(87) + ' ║');
console.log('╚' + '═'.repeat(88) + '╝');

const result = traceLife(lifeNum, region);

// Save to file
const reportPath = path.join(rootDir, 'analysis', `deep_dive_life_${lifeNum}.json`);
fs.writeFileSync(reportPath, JSON.stringify(result, null, 2));

console.log(`\n✓ Detailed report saved: analysis/deep_dive_life_${lifeNum}.json\n`);

process.exit(0);
