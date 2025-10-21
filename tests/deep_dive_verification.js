/**
 * DEEP DIVE VERIFICATION - Single Life Tracking
 * 
 * Tracks ALL systems for a single life from birth to death:
 * - Demographics and birth characteristics
 * - Health systems (chronic diseases, congenital, acute crises, cancer, mental health)
 * - Employment and income
 * - Housing and cost of living
 * - Relationships and family
 * - Key life events with full system interaction
 * 
 * Purpose: Verify all systems are working correctly and identify system gaps
 */

const GameEngine = require('../game_engine_v2_homeostatic.js');
const path = require('path');
const fs = require('fs');

const rootDir = path.join(__dirname, '..');

// Load cards
const birthCards = JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'birth_cards_json.json'), 'utf8'));
const familyCards = JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'family_cards_json.json'), 'utf8'));
const eventCards = {
  childhood: JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'event_cards_childhood.json'), 'utf8')),
  teen: JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'event_cards_teen.json'), 'utf8')),
  adult: JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'event_cards_adult.json'), 'utf8'))
};
const deathCards = JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'death_cards_json.json'), 'utf8'));

// ============================================================================
// LIFE EVENT TRACKING
// ============================================================================

class LifeEventLog {
  constructor() {
    this.events = [];
    this.systemChecks = [];
  }

  log(age, type, data) {
    this.events.push({
      age,
      type,
      timestamp: this.events.length,
      data
    });
  }

  systemCheck(age, system, passed, details) {
    this.systemChecks.push({
      age,
      system,
      passed,
      details
    });
  }

  getReport() {
    return {
      totalEvents: this.events.length,
      events: this.events,
      systemChecks: this.systemChecks,
      systemsVerified: [...new Set(this.systemChecks.map(s => s.system))],
      checksPerSystem: Object.fromEntries(
        [...new Set(this.systemChecks.map(s => s.system))].map(system => [
          system,
          this.systemChecks.filter(s => s.system === system).length
        ])
      )
    };
  }
}

// ============================================================================
// DEEP DIVE VERIFICATION
// ============================================================================

function runDeepDiveVerification(lifeCount = 3, maxAge = 100) {
  console.log('\n' + '='.repeat(80));
  console.log('DEEP DIVE LIFE VERIFICATION');
  console.log('='.repeat(80));

  const results = [];

  for (let lifeNum = 1; lifeNum <= lifeCount; lifeNum++) {
    console.log(`\n\n${'█'.repeat(80)}`);
    console.log(`LIFE #${lifeNum}`);
    console.log(`${'█'.repeat(80)}\n`);

    const engine = new GameEngine(birthCards, familyCards, eventCards, deathCards);
    const log = new LifeEventLog();

    // Create random life
    const birthCard = birthCards[Math.floor(Math.random() * birthCards.length)];
    const familyCard = familyCards[Math.floor(Math.random() * familyCards.length)];
    
    engine.createPlayer(birthCard, familyCard, { sex: Math.random() > 0.5 ? 'male' : 'female' });
    const player = engine.player;

    // Log birth
    console.log(`┌─ BIRTH ─────────────────────────────────────────────────────────────────────┐`);
    console.log(`│ Region:            ${player.demographics.birthRegion.padEnd(54)} │`);
    console.log(`│ Sex:               ${player.demographics.sex.padEnd(54)} │`);
    console.log(`│ Birth Resources:   ${player.resources.toFixed(1).padEnd(54)} │`);
    console.log(`│ Starting Health:   ${player.health.physical.current.toFixed(1)}/100 (baseline: ${player.health.physical.baseline.toFixed(1)}) ${' '.repeat(27)} │`);
    console.log(`│ Mental Baseline:   ${player.health.mental.baseline.toFixed(1)}${' '.repeat(54)} │`);
    console.log(`└─────────────────────────────────────────────────────────────────────────────┘\n`);

    log.log(0, 'birth', {
      region: player.demographics.birthRegion,
      resources: player.resources,
      health: player.health.current
    });

    // Track system activations
    let systemsActive = {
      chronicDiseases: false,
      congenitalConditions: false,
      acuteCrises: false,
      cancer: false,
      accidents: false,
      suicide: false,
      retirement: false,
      employment: false,
      housing: false,
      relationships: false,
      substanceAbuse: false
    };

    // ========================================================================
    // YEAR BY YEAR SIMULATION
    // ========================================================================

    let lastMentalHealth = player.health.mental.current;
    let lastPhysicalHealth = player.health.physical.current;
    let lastResources = player.resources;

    for (let year = 0; year < maxAge && player.alive; year++) {
      const age = player.demographics.age;

      // Track pre-year state
      const preYearState = {
        age,
        alive: player.alive,
        health: player.health.physical.current,
        mentalHealth: player.health.mental.current,
        resources: player.resources,
        employed: player.employment?.employed || false,
        chronicDiseasesCount: (player.health.chronic?.active || []).length,
        congenital: player.health.congenital.hasCondition,
        cancer: player.health.cancer.stage || 0,
        addiction: player.addiction?.stage || 'none'
      };

      // Process year
      engine.processYearEnd(player);

      // Detect significant changes
      const deltaHealth = player.health.physical.current - lastPhysicalHealth;
      const deltaMental = player.health.mental.current - lastMentalHealth;
      const deltaResources = player.resources - lastResources;
      const currentChronicCount = (player.health.chronic?.active || []).length;

      // Log major events
      let majorEventOccurred = false;
      let eventDetails = [];

      // Health crises detection
      if (currentChronicCount > preYearState.chronicDiseasesCount) {
        majorEventOccurred = true;
        const newDiseases = (player.health.chronic.active || []).filter((d, idx) => idx >= preYearState.chronicDiseasesCount);
        eventDetails.push(`NEW CHRONIC: ${newDiseases.map(d => d.disease).join(', ')}`);
        systemsActive.chronicDiseases = true;
        log.systemCheck(age, 'Chronic Diseases', true, `Diagnosed: ${newDiseases.map(d => d.disease).join(', ')}`);
      }

      // Congenital conditions at birth (age 0)
      if (age === 0 && player.health.congenital.hasCondition) {
        majorEventOccurred = true;
        eventDetails.push(`CONGENITAL: ${player.health.congenital.condition}`);
        systemsActive.congenitalConditions = true;
        log.systemCheck(age, 'Congenital Conditions', true, `Condition: ${player.health.congenital.condition}`);
      }

      // Cancer detection
      if (player.health.cancer.stage > 0 && preYearState.cancer === 0) {
        majorEventOccurred = true;
        eventDetails.push(`CANCER: Stage ${player.health.cancer.stage}`);
        systemsActive.cancer = true;
        log.systemCheck(age, 'Cancer System', true, `Stage: ${player.health.cancer.stage}`);
      }

      // Acute crisis detection (sudden health drops)
      if (Math.abs(deltaHealth) > 5) {
        eventDetails.push(`ACUTE CRISIS: Health ${(lastPhysicalHealth).toFixed(1)} → ${player.health.physical.current.toFixed(1)}`);
        systemsActive.acuteCrises = true;
        log.systemCheck(age, 'Acute Crises', true, `Health drop: ${deltaHealth.toFixed(1)}`);
        majorEventOccurred = true;
      }

      // Mental health crisis (suicide risk)
      if (player.health.mental.current <= 20 && lastMentalHealth > 20) {
        eventDetails.push(`MENTAL HEALTH CRISIS: ${lastMentalHealth.toFixed(1)} → ${player.health.mental.current.toFixed(1)}`);
        systemsActive.suicide = true;
        log.systemCheck(age, 'Mental Health', true, `Crisis at age ${age}`);
        majorEventOccurred = true;
      }

      // Substance abuse detection
      if (player.addiction && player.addiction.stage !== 'none') {
        if (preYearState.addiction === 'none') {
          eventDetails.push(`SUBSTANCE ABUSE: ${player.addiction.stage}`);
          systemsActive.substanceAbuse = true;
          log.systemCheck(age, 'Substance Abuse', true, `Stage: ${player.addiction.stage}`);
          majorEventOccurred = true;
        }
      }

      // Retirement detection
      if (player.retired === true && age >= 55) {
        if (preYearState.employed && !player.employment?.employed && age >= 60) {
          eventDetails.push(`RETIREMENT: Resources ${player.resources.toFixed(1)}`);
          systemsActive.retirement = true;
          log.systemCheck(age, 'Retirement System', true, `Retired at age ${age}`);
          majorEventOccurred = true;
        }
      }

      // Employment/income tracking
      if (player.employment && player.employment.employed && age >= 15 && age <= 65) {
        if (!systemsActive.employment) {
          systemsActive.employment = true;
          log.systemCheck(age, 'Employment System', true, `Employed at age ${age}`);
        }
      }

      // Housing tracking
      if (player.housing && player.housing.type) {
        if (!systemsActive.housing) {
          systemsActive.housing = true;
          log.systemCheck(age, 'Housing System', true, `Type: ${player.housing.type}`);
        }
      }

      // Relationships tracking
      if (player.relationships && Object.keys(player.relationships).length > 0) {
        if (!systemsActive.relationships) {
          systemsActive.relationships = true;
          log.systemCheck(age, 'Relationships System', true, `Relationships tracked`);
        }
      }

      // Log major events every year or when something happens
      if (majorEventOccurred || age % 5 === 0 || age === 18 || age === 65) {
        const eventStr = eventDetails.length > 0 ? eventDetails.join(' | ') : 'Regular year';
        
        console.log(`Age ${String(age).padStart(3)}: ${eventStr.padEnd(50)} Health: ${player.health.physical.current.toFixed(1).padStart(5)}/100  Mental: ${player.health.mental.current.toFixed(1).padStart(5)}/100  Resources: ${player.resources.toFixed(1).padStart(8)}`);
        
        log.log(age, 'year', {
          health: player.health.physical.current,
          mental: player.health.mental.current,
          resources: player.resources,
          events: eventDetails
        });
      }

      lastPhysicalHealth = player.health.physical.current;
      lastMentalHealth = player.health.mental.current;
      lastResources = player.resources;

      // Auto-stop if age unrealistic for this region
      if (age > maxAge) break;
    }

    // ========================================================================
    // END OF LIFE SUMMARY
    // ========================================================================

    console.log(`\n┌─ DEATH ──────────────────────────────────────────────────────────────────────┐`);
    console.log(`│ Age at Death:      ${player.demographics.age}${' '.repeat(59)} │`);
    console.log(`│ Cause:             ${(player.causeOfDeath || 'unknown').padEnd(54)} │`);
    console.log(`│ Life Expectancy:   ${(player.demographics.lifeExpectancy || 'unknown').toString().padEnd(54)} │`);
    console.log(`│ Years vs Expect:   ${((player.demographics.age - (player.demographics.lifeExpectancy || 0)).toFixed(1)).padEnd(54)} │`);
    console.log(`│ Final Resources:   ${player.resources.toFixed(1).padEnd(54)} │`);
    console.log(`│ Final Health:      ${player.health.physical.current.toFixed(1)}/100${' '.repeat(48)} │`);
    console.log(`└─────────────────────────────────────────────────────────────────────────────┘\n`);

    // Active systems report
    console.log(`┌─ SYSTEMS VERIFICATION ───────────────────────────────────────────────────────┐`);
    const activeSystems = Object.entries(systemsActive).filter(([_, active]) => active);
    console.log(`│ Systems Active: ${activeSystems.length}/11${' '.repeat(57)} │`);
    activeSystems.forEach(([system, _], idx) => {
      const isLast = idx === activeSystems.length - 1;
      console.log(`│ ✓ ${system.padEnd(66)} │`);
    });
    console.log(`└─────────────────────────────────────────────────────────────────────────────┘\n`);

    results.push({
      lifeNumber: lifeNum,
      age: player.demographics.age,
      region: player.demographics.birthRegion,
      sex: player.demographics.sex,
      cause: player.causeOfDeath,
      lifeExpectancy: player.demographics.lifeExpectancy,
      yearsVsExpectancy: player.demographics.age - (player.demographics.lifeExpectancy || 0),
      systems: systemsActive,
      activeSystems: activeSystems.map(([s, _]) => s),
      log: log.getReport()
    });
  }

  // ========================================================================
  // FINAL VERIFICATION REPORT
  // ========================================================================

  console.log('\n' + '='.repeat(80));
  console.log('VERIFICATION SUMMARY - ALL LIVES');
  console.log('='.repeat(80) + '\n');

  const systemCoverageByLife = results.map((r, idx) => {
    const activeCount = Object.values(r.systems).filter(v => v).length;
    return `Life ${idx + 1}: ${activeCount}/11 systems active (${r.region})`;
  });

  systemCoverageByLife.forEach(s => console.log(s));

  // Aggregate system coverage
  const allSystems = Object.keys(results[0].systems);
  const systemCoverage = {};
  
  allSystems.forEach(system => {
    const activeIn = results.filter(r => r.systems[system]).length;
    systemCoverage[system] = {
      active: activeIn,
      percentage: ((activeIn / results.length) * 100).toFixed(1)
    };
  });

  console.log('\n┌─ SYSTEM COVERAGE ACROSS ALL LIVES ───────────────────────────────────────────┐');
  Object.entries(systemCoverage).forEach(([system, data]) => {
    const bar = '█'.repeat(Math.round(data.percentage / 5)) + '░'.repeat(20 - Math.round(data.percentage / 5));
    console.log(`│ ${system.padEnd(25)} ${bar} ${data.active}/${results.length} (${data.percentage}%) │`);
  });
  console.log(`└─────────────────────────────────────────────────────────────────────────────┘\n`);

  // Life expectancy accuracy
  console.log(`┌─ LIFE EXPECTANCY ACCURACY ──────────────────────────────────────────────────┐`);
  const avgDiff = (results.reduce((sum, r) => sum + r.yearsVsExpectancy, 0) / results.length).toFixed(1);
  const minAgeAchieved = Math.min(...results.map(r => r.age));
  const maxAgeAchieved = Math.max(...results.map(r => r.age));
  const avgAge = (results.reduce((sum, r) => sum + r.age, 0) / results.length).toFixed(1);

  console.log(`│ Min Age:              ${minAgeAchieved.toString().padEnd(54)} │`);
  console.log(`│ Max Age:              ${maxAgeAchieved.toString().padEnd(54)} │`);
  console.log(`│ Avg Age:              ${avgAge.toString().padEnd(54)} │`);
  console.log(`│ Avg Years vs Expected: ${(avgDiff > 0 ? '+' : '') + avgDiff}${' '.repeat(50)} │`);
  console.log(`└─────────────────────────────────────────────────────────────────────────────┘\n`);

  // Regional diversity
  console.log(`┌─ REGIONAL DIVERSITY ─────────────────────────────────────────────────────────┐`);
  const regionCounts = {};
  results.forEach(r => {
    regionCounts[r.region] = (regionCounts[r.region] || 0) + 1;
  });
  
  Object.entries(regionCounts).forEach(([region, count]) => {
    console.log(`│ ${region.padEnd(70)} │`);
  });
  console.log(`└─────────────────────────────────────────────────────────────────────────────┘\n`);

  // Ready for new region assessment
  console.log(`┌─ READINESS ASSESSMENT ───────────────────────────────────────────────────────┐`);
  const avgSystemCoverage = (Object.values(systemCoverage).reduce((sum, s) => sum + parseFloat(s.percentage), 0) / Object.values(systemCoverage).length).toFixed(1);
  const systemsAt100 = Object.values(systemCoverage).filter(s => s.percentage === '100.0').length;
  const systemsBelow50 = Object.values(systemCoverage).filter(s => parseFloat(s.percentage) < 50).length;

  console.log(`│ Average System Coverage: ${avgSystemCoverage}%${' '.repeat(47)} │`);
  console.log(`│ Systems at 100%:         ${systemsAt100}/11${' '.repeat(53)} │`);
  console.log(`│ Systems Below 50%:       ${systemsBelow50}/11${' '.repeat(53)} │`);
  
  const ready = avgSystemCoverage >= 70 && systemsAt100 >= 5;
  console.log(`│ Ready for New Region:    ${ready ? '✓ YES' : '✗ NO (needs more testing)'.padEnd(50)}${' '.repeat(15)} │`);
  console.log(`└─────────────────────────────────────────────────────────────────────────────┘\n`);

  // Save detailed report
  const reportData = {
    timestamp: new Date().toISOString(),
    livesSimulated: results.length,
    systemCoverage,
    results,
    assessment: {
      averageSystemCoverage: parseFloat(avgSystemCoverage),
      systemsAt100Percent: systemsAt100,
      systemsBelow50Percent: systemsBelow50,
      readyForNewRegion: ready
    }
  };

  fs.writeFileSync(
    path.join(rootDir, 'analysis', 'deep_dive_verification_report.json'),
    JSON.stringify(reportData, null, 2)
  );

  console.log('✓ Detailed report saved to: analysis/deep_dive_verification_report.json\n');

  return reportData;
}

// ============================================================================
// RUN VERIFICATION
// ============================================================================

const lifeCount = parseInt(process.argv[2] || '3');
const maxAge = parseInt(process.argv[3] || '100');

console.log(`\nRunning deep dive verification: ${lifeCount} lives, max age ${maxAge}`);
const report = runDeepDiveVerification(lifeCount, maxAge);

process.exit(0);
