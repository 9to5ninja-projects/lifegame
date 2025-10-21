/**
 * LARGE POPULATION TEST: 100,000 lives
 * Comprehensive statistical analysis to identify edge cases and missing mechanics
 * 
 * Real-world validation targets:
 * - Global life expectancy: 72-73 years (varies by region)
 * - Marriage rate: 40-60% depending on region
 * - Fertility: 1.5-3 children per woman globally
 * - Unemployment: 3-10% depending on region
 * - Health crises in lifetime: 30-50%
 * - Substance abuse: 10-15% lifelong prevalence
 * - Poverty: 8-70% depending on region
 */

const path = require('path');
const fs = require('fs');

const rootDir = path.join(__dirname, '..');
const GameEngine = require(path.join(rootDir, 'game_engine_integrated.js'));

const birthCards = JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'birth_cards_json.json'), 'utf8'));
const familyCards = JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'family_cards_json.json'), 'utf8'));
const eventCardsData = {
  childhood: JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'event_cards_childhood.json'), 'utf8')),
  teen: JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'event_cards_teen.json'), 'utf8')),
  adult: JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'event_cards_adult.json'), 'utf8'))
};
const eventCards = [...eventCardsData.childhood, ...eventCardsData.teen, ...eventCardsData.adult];
const deathCards = JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'death_cards_json.json'), 'utf8'));

const NUM_LIVES = 100000;
const BATCH_SIZE = 1000; // Log progress every 1000 lives

console.log(`\n${'='.repeat(90)}`);
console.log('POPULATION TEST: 100,000 LIVES - COMPREHENSIVE STATISTICAL ANALYSIS'.padEnd(90));
console.log(`${'='.repeat(90)}\n`);

const lives = [];
const regionStats = {};
const crisisTypeFrequency = {};
const deathCauseFrequency = {};
const edgeCases = {
  orphanedYoung: [], // Age < 16 with both parents dead
  widowedYoung: [], // Age < 40 widowed with dependent children
  debtDefault: [], // End of life with debt > income * 5
  extremePoverty: [], // End of life with resources < 0
  substanceTrajectory: [], // Substance abuse onset and progression
  unemploymentChain: [], // Unemployment lasting > 10 consecutive years
  neverMarried: 0, // Count of players never married
  neverChildren: 0, // Count with 0 children
  chronicMultiple: [], // Multiple chronic diseases
  suicideAttempts: [] // Tracked suicide events
};

console.log(`Processing ${NUM_LIVES.toLocaleString()} lives...`);
const startTime = Date.now();

for (let lifeNum = 0; lifeNum < NUM_LIVES; lifeNum++) {
  // Progress indicator every BATCH_SIZE
  if ((lifeNum + 1) % BATCH_SIZE === 0) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const rate = ((lifeNum + 1) / (elapsed || 1)).toFixed(0);
    process.stdout.write(`\r[${(lifeNum + 1).toLocaleString()}/${NUM_LIVES.toLocaleString()}] Rate: ${rate} lives/sec | Elapsed: ${elapsed}s`);
  }

  const engine = new GameEngine(birthCards, familyCards, eventCards, deathCards);
  
  // Randomize birth card region
  const randomBirthCard = birthCards[Math.floor(Math.random() * birthCards.length)];
  engine.createPlayer(randomBirthCard, familyCards[0]);
  const player = engine.player;
  const region = randomBirthCard.name;

  // Initialize region stats
  if (!regionStats[region]) {
    regionStats[region] = {
      count: 0,
      avgAge: 0,
      totalMarriages: 0,
      totalChildren: 0,
      totalCrises: 0,
      totalUnemploymentYears: 0,
      avgDebt: 0,
      avgResources: 0,
      avgMentalHealth: 0,
      avgPhysicalHealth: 0,
      avgFriends: 0,
      widowedCount: 0,
      substanceAbuseCount: 0,
      minResources: Infinity,
      maxResources: -Infinity,
      deathCauses: {}
    };
  }

  let marriages = 0;
  let children = 0;
  let jobChanges = 0;
  let crisisCount = 0;
  let unemploymentYears = 0;
  let lastWasEmployed = true;
  let widowedAtSomePoint = false;
  let hasSubstanceAbuse = false;
  let chronicDiseaseCount = 0;
  let maxDebtEncountered = 0;
  let minResourcesEncountered = Infinity;
  const crisiesExperienced = new Set();
  let failedEducationYears = 0;

  // Run full life
  while (player.alive && player.demographics.age < 150) {
    // Track unemployment chains
    const shouldBeEmployed = player.demographics.age >= 18 && player.demographics.age < 65;
    const isEmployed = player.economics.income?.employmentStatus?.employed === true;
    
    if (shouldBeEmployed && !isEmployed && lastWasEmployed) {
      unemploymentYears++;
    }
    lastWasEmployed = isEmployed && shouldBeEmployed;

    // Track marriages (detect when partner alive)
    if (player.relationships.partner?.alive) {
      if (marriages === 0 || player.relationships.partner.since === player.demographics.age) {
        marriages++;
      }
    }

    // Track widowhood
    if (player.relationships.widowed) {
      widowedAtSomePoint = true;
    }

    // Track health crises
    if (player.health.crises && Object.keys(player.health.crises).length > 0) {
      Object.keys(player.health.crises).forEach(crisisKey => {
        crisiesExperienced.add(crisisKey);
        crisisTypeFrequency[crisisKey] = (crisisTypeFrequency[crisisKey] || 0) + 1;
      });
      crisisCount = Object.keys(player.health.crises).length;
    }

    // Track chronic diseases
    if (player.health.chronicDiseases && Object.keys(player.health.chronicDiseases).length > 0) {
      chronicDiseaseCount = Object.keys(player.health.chronicDiseases).length;
    }

    // Track substance abuse
    if (player.health.substanceAbuse && player.health.substanceAbuse.active) {
      hasSubstanceAbuse = true;
    }

    // Track children (current alive count)
    children = Math.max(children, player.relationships.children?.filter(c => c?.alive).length || 0);

    // Track debt and resources extremes
    maxDebtEncountered = Math.max(maxDebtEncountered, player.economics.debt || 0);
    minResourcesEncountered = Math.min(minResourcesEncountered, player.economics.resources || 0);

    // Track job tenure changes
    const currentTenure = player.economics.income.targetJobTenure;
    if (player.demographics.age >= 18) {
      jobChanges = player.economics.income?.jobHistoryCount || 0;
    }

    engine.nextYear();
  }

  const deathCause = player.causeOfDeath || 'Unknown';
  deathCauseFrequency[deathCause] = (deathCauseFrequency[deathCause] || 0) + 1;

  // Check edge cases
  if (player.demographics.age < 16 && !player.relationships.parents?.mother?.alive && !player.relationships.parents?.father?.alive) {
    edgeCases.orphanedYoung.push({
      age: player.demographics.age,
      region: region,
      children: player.relationships.children?.length || 0,
      resources: player.economics.resources,
      deathCause: deathCause
    });
  }

  if (widowedAtSomePoint && player.demographics.age < 40 && (player.relationships.children?.filter(c => c?.alive)?.length || 0) > 0) {
    edgeCases.widowedYoung.push({
      age: player.demographics.age,
      region: region,
      childrenAlive: player.relationships.children?.filter(c => c?.alive)?.length || 0,
      resources: player.economics.resources,
      deathCause: deathCause
    });
  }

  if (maxDebtEncountered > (player.economics.resources || 0) * 5 && maxDebtEncountered > 100) {
    edgeCases.debtDefault.push({
      age: player.demographics.age,
      maxDebt: maxDebtEncountered,
      finalResources: player.economics.resources,
      region: region
    });
  }

  if (minResourcesEncountered < 0 && player.demographics.age > 18) {
    edgeCases.extremePoverty.push({
      age: player.demographics.age,
      minResources: minResourcesEncountered,
      finalResources: player.economics.resources,
      region: region,
      children: player.relationships.children?.length || 0
    });
  }

  if (hasSubstanceAbuse) {
    edgeCases.substanceTrajectory.push({
      age: player.demographics.age,
      onset: player.health.substanceAbuse?.onsetAge || 'unknown',
      type: player.health.substanceAbuse?.type || 'unknown',
      stage: player.health.substanceAbuse?.stage || 'unknown',
      survived: player.alive,
      deathCause: deathCause
    });
  }

  if (!player.relationships.partner?.alive && !player.relationships.widowed && marriages === 0) {
    edgeCases.neverMarried++;
  }

  if ((player.relationships.children?.length || 0) === 0) {
    edgeCases.neverChildren++;
  }

  if (chronicDiseaseCount > 1) {
    edgeCases.chronicMultiple.push({
      age: player.demographics.age,
      count: chronicDiseaseCount,
      diseases: Object.keys(player.health.chronicDiseases || {}),
      region: region
    });
  }

  // Update region stats
  regionStats[region].count++;
  regionStats[region].avgAge += player.demographics.age;
  regionStats[region].totalMarriages += marriages;
  regionStats[region].totalChildren += children;
  regionStats[region].totalCrises += crisiesExperienced.size;
  regionStats[region].totalUnemploymentYears += unemploymentYears;
  regionStats[region].avgDebt += (player.economics.debt || 0);
  regionStats[region].avgResources += (player.economics.resources || 0);

  lives.push({
    lifeNumber: lifeNum + 1,
    age: player.demographics.age,
    deathCause,
    marriages,
    children,
    jobChanges,
    crisisCount: crisiesExperienced.size,
    sex: player.demographics.sex,
    education: player.development.education.level,
    region: region,
    resources: player.economics.resources,
    debt: player.economics.debt || 0,
    widowed: widowedAtSomePoint,
    substanceAbuse: hasSubstanceAbuse,
    mentalHealth: player.health.mental?.current || 0,
    physicalHealth: player.health.physical?.current || 0,
    friends: player.relationships.social?.friends?.length || 0,
    crisisSize: crisiesExperienced.size
  });
}

console.log('\n\n' + '='.repeat(90));
console.log('ANALYSIS COMPLETE'.padEnd(90));
console.log('='.repeat(90) + '\n');

// Calculate averages and normalize region stats
Object.keys(regionStats).forEach(region => {
  const count = regionStats[region].count;
  regionStats[region].avgAge /= count;
  regionStats[region].avgMarriages = regionStats[region].totalMarriages / count;
  regionStats[region].avgChildren = regionStats[region].totalChildren / count;
  regionStats[region].avgCrises = regionStats[region].totalCrises / count;
  regionStats[region].avgUnemploymentYears = regionStats[region].totalUnemploymentYears / count;
  regionStats[region].avgDebt /= count;
  regionStats[region].avgResources /= count;
  regionStats[region].avgMentalHealth /= count;
  regionStats[region].avgPhysicalHealth /= count;
  regionStats[region].avgFriends /= count;
  regionStats[region].widowedRate = (regionStats[region].widowedCount / count * 100).toFixed(1);
  regionStats[region].substanceAbuseRate = (regionStats[region].substanceAbuseCount / count * 100).toFixed(1);
});

// Global statistics
const stats = {
  totalLives: lives.length,
  avgAge: lives.reduce((sum, l) => sum + l.age, 0) / lives.length,
  minAge: Math.min(...lives.map(l => l.age)),
  maxAge: Math.max(...lives.map(l => l.age)),
  ageStdDev: 0,
  marriageRate: (lives.filter(l => l.marriages > 0).length / lives.length * 100).toFixed(1),
  avgMarriages: lives.reduce((sum, l) => sum + l.marriages, 0) / lives.length,
  totalChildren: lives.reduce((sum, l) => sum + l.children, 0),
  avgChildren: lives.reduce((sum, l) => sum + l.children, 0) / lives.length,
  childrenByWomen: 0, // Only count female lives
  avgJobChanges: lives.reduce((sum, l) => sum + l.jobChanges, 0) / lives.length,
  avgCrises: lives.reduce((sum, l) => sum + l.crisisSize, 0) / lives.length,
  crisisRate: (lives.filter(l => l.crisisSize > 0).length / lives.length * 100).toFixed(1),
  avgDebt: lives.reduce((sum, l) => sum + l.debt, 0) / lives.length,
  avgResources: lives.reduce((sum, l) => sum + l.resources, 0) / lives.length,
  avgMentalHealth: lives.reduce((sum, l) => sum + l.mentalHealth, 0) / lives.length,
  avgPhysicalHealth: lives.reduce((sum, l) => sum + l.physicalHealth, 0) / lives.length,
  avgFriends: lives.reduce((sum, l) => sum + l.friends, 0) / lives.length,
  widowedRate: (lives.filter(l => l.widowed).length / lives.length * 100).toFixed(1),
  substanceAbuseRate: (lives.filter(l => l.substanceAbuse).length / lives.length * 100).toFixed(1),
  neverMarriedCount: edgeCases.neverMarried,
  neverMarriedRate: (edgeCases.neverMarried / lives.length * 100).toFixed(1),
  neverChildrenCount: edgeCases.neverChildren,
  neverChildrenRate: (edgeCases.neverChildren / lives.length * 100).toFixed(1)
};

// Calculate stddev for age
const meanAge = stats.avgAge;
stats.ageStdDev = Math.sqrt(
  lives.reduce((sum, l) => sum + Math.pow(l.age - meanAge, 2), 0) / lives.length
).toFixed(1);

// Female fertility
const females = lives.filter(l => l.sex === 'female');
stats.childrenByWomen = females.length > 0 ? (stats.totalChildren / females.length).toFixed(2) : 0;

console.log('📊 GLOBAL POPULATION STATISTICS');
console.log('─'.repeat(90));
console.log(`\nLIFE EXPECTANCY:`);
console.log(`  Average age at death:    ${stats.avgAge.toFixed(1)} years`);
console.log(`  Range:                   ${stats.minAge} - ${stats.maxAge} years`);
console.log(`  Standard deviation:      ±${stats.ageStdDev} years`);
console.log(`  [Expected: 65-75 globally, higher in developed regions]`);

console.log(`\nMARRIAGE & PARTNERSHIPS:`);
console.log(`  Marriage rate:           ${stats.marriageRate}% (${lives.filter(l => l.marriages > 0).length.toLocaleString()} lives)`);
console.log(`  Average marriages/life:  ${stats.avgMarriages.toFixed(2)}`);
console.log(`  Never married:           ${stats.neverMarriedCount.toLocaleString()} (${stats.neverMarriedRate}%)`);
console.log(`  Widowed at some point:   ${stats.widowedRate}%`);
console.log(`  [Expected: 40-65% marry, varies by region]`);

console.log(`\nFERTILITY & CHILDREN:`);
console.log(`  Total children born:     ${stats.totalChildren.toLocaleString()}`);
console.log(`  Avg per life:            ${stats.avgChildren.toFixed(2)}`);
console.log(`  Avg per woman:           ${stats.childrenByWomen} (${females.length.toLocaleString()} females)`);
console.log(`  Never had children:      ${stats.neverChildrenCount.toLocaleString()} (${stats.neverChildrenRate}%)`);
console.log(`  [Expected: 1.5-3 children/woman, varies by region]`);

console.log(`\nCARROER & EMPLOYMENT:`);
console.log(`  Average job changes:     ${stats.avgJobChanges.toFixed(1)} (working age 18-65)`);
console.log(`  [Expected: 5-15 job changes in career]`);

console.log(`\nHEALTH CRISES & CONDITIONS:`);
console.log(`  Average crises/life:     ${stats.avgCrises.toFixed(2)}`);
console.log(`  Crisis rate:             ${stats.crisisRate}% (experienced ≥1 crisis)`);
console.log(`  Substance abuse rate:    ${stats.substanceAbuseRate}%`);
console.log(`  [Expected: 30-50% experience crisis, 10-15% substance abuse]`);

console.log(`\nMENTAL & PHYSICAL HEALTH:`);
console.log(`  Avg mental health:       ${stats.avgMentalHealth.toFixed(0)}/100`);
console.log(`  Avg physical health:     ${stats.avgPhysicalHealth.toFixed(0)}/100`);
console.log(`  Avg friends (support):   ${stats.avgFriends.toFixed(1)}`);

console.log(`\nECONOMIC STABILITY:`);
console.log(`  Avg final resources:     ${stats.avgResources.toFixed(0)}`);
console.log(`  Avg final debt:          ${stats.avgDebt.toFixed(0)}`);
console.log(`  Extreme poverty:         ${edgeCases.extremePoverty.length} cases (${(edgeCases.extremePoverty.length / lives.length * 100).toFixed(2)}%)`);

console.log(`\n${'─'.repeat(90)}`);
console.log(`🌍 REGIONAL BREAKDOWN (${Object.keys(regionStats).length} regions)`);
console.log('─'.repeat(90) + '\n');

Object.keys(regionStats).sort().forEach(region => {
  const r = regionStats[region];
  console.log(`${region}`);
  console.log(`  Population:     ${r.count.toLocaleString()}`);
  console.log(`  Avg age:        ${r.avgAge.toFixed(1)} | Marriage rate: ${(r.totalMarriages / r.count).toFixed(2)} | Children: ${r.avgChildren.toFixed(2)} | Jobs: ${r.avgUnemploymentYears.toFixed(1)} unemployment years`);
  console.log(`  Health:         Crises: ${r.avgCrises.toFixed(2)} | Substance abuse: ${r.substanceAbuseRate}% | Widowed: ${r.widowedRate}%`);
  console.log(`  Economy:        Resources: ${r.avgResources.toFixed(0)} | Debt: ${r.avgDebt.toFixed(0)} | Friends: ${r.avgFriends.toFixed(1)}`);
  console.log(`  Top death:      ${Object.entries(r.deathCauses).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown'} (${Object.entries(r.deathCauses).sort((a, b) => b[1] - a[1])[0]?.[1] || 0} cases)`);
  console.log();
});

console.log(`${'─'.repeat(90)}`);
console.log(`⚠️  EDGE CASES & OUTLIERS`);
console.log('─'.repeat(90) + '\n');

console.log(`ORPHANED YOUTH (age < 16 with no parents):`);
console.log(`  Count: ${edgeCases.orphanedYoung.length}`);
if (edgeCases.orphanedYoung.length > 0) {
  console.log(`  Sample: Age ${edgeCases.orphanedYoung[0].age}, ${edgeCases.orphanedYoung[0].region}, ${edgeCases.orphanedYoung[0].children} children`);
}

console.log(`\nWIDOWED YOUNG (age < 40 with dependent children):`);
console.log(`  Count: ${edgeCases.widowedYoung.length}`);
if (edgeCases.widowedYoung.length > 0) {
  console.log(`  Samples:`);
  edgeCases.widowedYoung.slice(0, 3).forEach(w => {
    console.log(`    - Age ${w.age}, ${w.region}, ${w.childrenAlive} dependent children, resources: ${w.resources}`);
  });
}

console.log(`\nDEBT DEFAULT (max debt > 5x end-of-life resources):`);
console.log(`  Count: ${edgeCases.debtDefault.length}`);
if (edgeCases.debtDefault.length > 0) {
  console.log(`  Samples:`);
  edgeCases.debtDefault.slice(0, 3).forEach(d => {
    console.log(`    - Age ${d.age}, ${d.region}, max debt: ${d.maxDebt}, final: ${d.finalResources}`);
  });
}

console.log(`\nEXTREME POVERTY (resources went negative):`);
console.log(`  Count: ${edgeCases.extremePoverty.length} (${(edgeCases.extremePoverty.length / lives.length * 100).toFixed(2)}%)`);
if (edgeCases.extremePoverty.length > 0) {
  console.log(`  Samples:`);
  edgeCases.extremePoverty.slice(0, 3).forEach(p => {
    console.log(`    - Age ${p.age}, ${p.region}, min: ${p.minResources}, final: ${p.finalResources}, children: ${p.children}`);
  });
}

console.log(`\nSUBSTANCE ABUSE TRAJECTORY:`);
console.log(`  Count: ${edgeCases.substanceTrajectory.length} (${(edgeCases.substanceTrajectory.length / lives.length * 100).toFixed(2)}%)`);
if (edgeCases.substanceTrajectory.length > 0) {
  console.log(`  Samples (by death cause):`);
  edgeCases.substanceTrajectory.slice(0, 5).forEach(s => {
    console.log(`    - Onset: ${s.onset}, Type: ${s.type}, Stage: ${s.stage}, Survived: ${s.survived}, Cause: ${s.deathCause}`);
  });
}

console.log(`\nMULTIPLE CHRONIC DISEASES:`);
console.log(`  Count: ${edgeCases.chronicMultiple.length}`);
if (edgeCases.chronicMultiple.length > 0) {
  console.log(`  Samples:`);
  edgeCases.chronicMultiple.slice(0, 3).forEach(c => {
    console.log(`    - Age ${c.age}, ${c.region}: ${c.diseases.join(', ')}`);
  });
}

console.log(`\n${'─'.repeat(90)}`);
console.log(`🔍 TOP 10 DEATH CAUSES`);
console.log('─'.repeat(90));
const sortedDeathCauses = Object.entries(deathCauseFrequency).sort((a, b) => b[1] - a[1]).slice(0, 10);
sortedDeathCauses.forEach((cause, idx) => {
  const pct = ((cause[1] / NUM_LIVES) * 100).toFixed(2);
  console.log(`${(idx + 1).toString().padStart(2)}. ${cause[0].padEnd(40)} ${cause[1].toLocaleString().padStart(7)} (${pct}%)`);
});

console.log(`\n${'─'.repeat(90)}`);
console.log(`💡 TOP 10 HEALTH CRISES`);
console.log('─'.repeat(90));
const sortedCrises = Object.entries(crisisTypeFrequency).sort((a, b) => b[1] - a[1]).slice(0, 10);
sortedCrises.forEach((crisis, idx) => {
  const pct = ((crisis[1] / NUM_LIVES) * 100).toFixed(2);
  console.log(`${(idx + 1).toString().padStart(2)}. ${crisis[0].padEnd(40)} ${crisis[1].toLocaleString().padStart(7)} (${pct}%)`);
});

console.log(`\n${'='.repeat(90)}`);
console.log(`TEST COMPLETED: ${NUM_LIVES.toLocaleString()} lives simulated`);
console.log(`Total time: ${((Date.now() - startTime) / 1000).toFixed(1)}s | Rate: ${(NUM_LIVES / ((Date.now() - startTime) / 1000)).toFixed(0)} lives/sec`);
console.log(`${'='.repeat(90)}\n`);
