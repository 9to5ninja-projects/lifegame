/**
 * DEEP DIVE: UNMARRIED PLAYERS IN WESTERN EUROPE (1,000 lives)
 * Focus: Singles lifecycle mechanics, social networks, mental health, economic stability
 * 
 * Real-world statistics for Western Europe singles:
 * - ~30-40% never marry (varies by age cohort)
 * - Higher poverty risk for single mothers
 * - Social isolation increases with age for singles
 * - Mental health challenges more common in isolated singles
 * - Employment stability similar to married but caregiving duties different
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

const NUM_LIVES = 1000;
const REGION = 'Western Europe';
const BATCH_SIZE = 100;

console.log(`\n${'='.repeat(90)}`);
console.log(`DEEP DIVE: UNMARRIED SINGLES IN ${REGION} (${NUM_LIVES.toLocaleString()} lives)`.padEnd(90));
console.log(`${'='.repeat(90)}\n`);

const lives = [];
const singleThroughLife = []; // Married sometime, divorced/widowed
const neverMarried = []; // Never married at all
const edgeCases = {
  singleParents: [], // Single mothers/fathers with children
  isolatedSingles: [], // Friends < 2 at end of life
  suicideRisk: [], // Mental health < 20
  unemploymentChains: [], // > 5 years consecutive unemployment
  extremePoverty: [], // Resources < 0
  accidents: [], // Accident events
  substanceAbuse: [] // Substance abuse
};

console.log(`Processing ${NUM_LIVES.toLocaleString()} Western Europe lives...`);
const startTime = Date.now();

for (let lifeNum = 0; lifeNum < NUM_LIVES; lifeNum++) {
  if ((lifeNum + 1) % BATCH_SIZE === 0) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const rate = ((lifeNum + 1) / (elapsed || 1)).toFixed(0);
    process.stdout.write(`\r[${(lifeNum + 1).toLocaleString()}/${NUM_LIVES.toLocaleString()}] ${rate} lives/sec`);
  }

  const engine = new GameEngine(birthCards, familyCards, eventCards, deathCards);
  const birthCard = birthCards.find(b => b.name === REGION);
  engine.createPlayer(birthCard, familyCards[0]);
  const player = engine.player;

  let marriages = 0;
  let children = 0;
  let jobChanges = 0;
  let unemploymentYears = 0;
  let lastEmployed = true;
  let lastTenure = player.economics.income?.targetJobTenure;
  let maxDebt = 0;
  let minResources = Infinity;
  let suicideAttempts = 0;
  let accidentCount = 0;
  let substanceAbused = false;
  const mentalHealthLows = [];
  const friendsTimeline = [];
  let becomingWidowed = false;
  let parentDeathAge = null;
  let becomesSingleParent = false;

  // Run full life
  while (player.alive && player.demographics.age < 150) {
    // Track mental health lows
    mentalHealthLows.push(player.health.mental?.current || 0);

    // Track friends over time (friends is a number, not array)
    if (player.demographics.age % 10 === 0) { // Sample every 10 years
      friendsTimeline.push({
        age: player.demographics.age,
        friends: player.relationships.social?.friends || 0,  // friends is a number
        community: player.relationships.social?.community || 0
      });
    }

    // Track marriages/partnerships (check partner.exists to know if in a relationship)
    if (player.relationships.partner?.exists && marriages === 0) {
      marriages++;
    }
    
    // Track if married (distinct from being in relationship)
    if (player.relationships.social?.married && marriages > 0) {
      // Already counted as marriage when partner.exists became true
    }
    
    // Track widowhood
    if (player.relationships.widowed) {
      becomingWidowed = true;
    }

    // Track children (count all children in array)
    children = Math.max(children, player.relationships.children?.length || 0);
    
    // Check for single parent status
    if (children > 0 && !player.relationships.partner?.exists && marriages === 0) {
      becomesSingleParent = true;
    }

    // Track job tenure changes (check if targetJobTenure is different)
    if (player.economics.income?.targetJobTenure !== lastTenure) {
      jobChanges++;
      lastTenure = player.economics.income?.targetJobTenure;
    }

    // Track unemployment (check employed flag)
    const shouldWork = player.demographics.age >= 18 && player.demographics.age < 65;
    const isEmployed = player.economics.income?.employed === true;  // Direct boolean, not nested
    
    if (shouldWork && !isEmployed && lastEmployed) {
      unemploymentYears++;
    }
    lastEmployed = isEmployed && shouldWork;

    // Track debt and resources (resources is object with .current property)
    maxDebt = Math.max(maxDebt, player.economics.debt || 0);
    minResources = Math.min(minResources, player.economics.resources?.current || 0);

    // Track substance abuse
    if (player.health.substanceAbuse?.active) {
      substanceAbused = true;
    }

    // Track accidents
    if (player.health.accidents?.active) {
      accidentCount++;
    }

    engine.nextYear();
  }

  const deathCause = player.causeOfDeath || 'Unknown';
  const finalMentalHealth = player.health.mental?.current || 0;
  const finalFriends = player.relationships.social?.friends || 0;  // friends is a number
  const finalResources = player.economics.resources?.current || 0;  // .current property
  const finalDebt = player.economics.debt || 0;

  // Categorize singles
  let singleType = 'married';
  if (marriages === 0) {
    singleType = 'never_married';
    neverMarried.push({
      age: player.demographics.age,
      sex: player.demographics.sex,
      children: children,
      friends: finalFriends,
      mentalHealth: finalMentalHealth,
      resources: finalResources,
      deathCause: deathCause
    });
  } else if (player.relationships.widowed || !player.relationships.partner?.exists) {
    singleType = 'widowed_or_divorced';
    singleThroughLife.push({
      age: player.demographics.age,
      marriages: marriages,
      widowed: player.relationships.widowed,
      children: children,
      friends: finalFriends,
      mentalHealth: finalMentalHealth,
      deathCause: deathCause
    });
  }

  // Check edge cases
  if (becomesSingleParent) {
    edgeCases.singleParents.push({
      age: player.demographics.age,
      sex: player.demographics.sex,
      children: children,
      resources: finalResources,
      debt: finalDebt,
      mentalHealth: finalMentalHealth,
      deathCause: deathCause
    });
  }

  if (finalFriends < 2 && player.demographics.age > 30) {
    edgeCases.isolatedSingles.push({
      age: player.demographics.age,
      friends: finalFriends,
      married: singleType !== 'never_married',
      mentalHealth: finalMentalHealth,
      deathCause: deathCause
    });
  }

  if (finalMentalHealth < 20 && player.demographics.age > 18) {
    edgeCases.suicideRisk.push({
      age: player.demographics.age,
      mentalHealth: finalMentalHealth,
      friends: finalFriends,
      singleType: singleType,
      deathCause: deathCause
    });
  }

  if (unemploymentYears > 5) {
    edgeCases.unemploymentChains.push({
      age: player.demographics.age,
      unemploymentYears: unemploymentYears,
      resources: finalResources,
      children: children,
      deathCause: deathCause
    });
  }

  if (minResources < 0) {
    edgeCases.extremePoverty.push({
      age: player.demographics.age,
      minResources: minResources,
      finalResources: finalResources,
      children: children,
      deathCause: deathCause
    });
  }

  if (accidentCount > 0) {
    edgeCases.accidents.push({
      age: player.demographics.age,
      count: accidentCount,
      deathCause: deathCause
    });
  }

  if (substanceAbused) {
    edgeCases.substanceAbuse.push({
      age: player.demographics.age,
      mentalHealth: finalMentalHealth,
      deathCause: deathCause
    });
  }

  lives.push({
    age: player.demographics.age,
    sex: player.demographics.sex,
    singleType: singleType,
    marriages: marriages,
    children: children,
    jobChanges: jobChanges,
    unemploymentYears: unemploymentYears,
    mentalHealth: finalMentalHealth,
    physicalHealth: player.health.physical?.current || 0,
    friends: finalFriends,
    community: player.relationships.social?.community || 0,
    resources: finalResources,
    debt: finalDebt,
    maxDebt: maxDebt,
    minResources: minResources,
    deathCause: deathCause,
    widowed: becomingWidowed,
    singleParent: becomesSingleParent,
    isolated: finalFriends < 2,
    suicideRisk: finalMentalHealth < 20
  });
}

console.log('\n\n' + '='.repeat(90));
console.log('ANALYSIS COMPLETE'.padEnd(90));
console.log('='.repeat(90) + '\n');

// Calculate statistics
const stats = {
  totalLives: lives.length,
  avgAge: lives.reduce((sum, l) => sum + l.age, 0) / lives.length,
  minAge: Math.min(...lives.map(l => l.age)),
  maxAge: Math.max(...lives.map(l => l.age)),
  avgChildren: lives.reduce((sum, l) => sum + l.children, 0) / lives.length,
  avgJobChanges: lives.reduce((sum, l) => sum + l.jobChanges, 0) / lives.length,
  avgUnemploymentYears: lives.reduce((sum, l) => sum + l.unemploymentYears, 0) / lives.length,
  avgMentalHealth: lives.reduce((sum, l) => sum + l.mentalHealth, 0) / lives.length,
  avgPhysicalHealth: lives.reduce((sum, l) => sum + l.physicalHealth, 0) / lives.length,
  avgFriends: lives.reduce((sum, l) => sum + l.friends, 0) / lives.length,
  avgCommunity: lives.reduce((sum, l) => sum + l.community, 0) / lives.length,
  avgResources: lives.reduce((sum, l) => sum + l.resources, 0) / lives.length,
  avgDebt: lives.reduce((sum, l) => sum + l.debt, 0) / lives.length,
  neverMarriedCount: neverMarried.length,
  neverMarriedRate: (neverMarried.length / lives.length * 100).toFixed(1),
  singleThroughLifeCount: singleThroughLife.length,
  widowedCount: lives.filter(l => l.widowed).length,
  singleParentCount: lives.filter(l => l.singleParent).length,
  isolatedCount: lives.filter(l => l.isolated).length,
  suicideRiskCount: lives.filter(l => l.suicideRisk).length,
  avgMaxDebt: lives.reduce((sum, l) => sum + l.maxDebt, 0) / lives.length,
  avgMinResources: lives.reduce((sum, l) => sum + l.minResources, 0) / lives.length
};

// Sex breakdown
const females = lives.filter(l => l.sex === 'female');
const males = lives.filter(l => l.sex === 'male');

console.log('📊 WESTERN EUROPE SINGLES: COMPREHENSIVE ANALYSIS\n');

console.log('POPULATION BREAKDOWN:');
console.log(`  Total lives:             ${stats.totalLives.toLocaleString()}`);
console.log(`  Females:                 ${females.length.toLocaleString()} (${(females.length / stats.totalLives * 100).toFixed(1)}%)`);
console.log(`  Males:                   ${males.length.toLocaleString()} (${(males.length / stats.totalLives * 100).toFixed(1)}%)`);
console.log(`  Never married:           ${stats.neverMarriedCount.toLocaleString()} (${stats.neverMarriedRate}%)`);
console.log(`  Became single later:     ${stats.singleThroughLifeCount.toLocaleString()} (${(stats.singleThroughLifeCount / stats.totalLives * 100).toFixed(1)}%)`);

console.log(`\nLONGEVITY & AGE:`);
console.log(`  Average age:             ${stats.avgAge.toFixed(1)} years`);
console.log(`  Range:                   ${stats.minAge} - ${stats.maxAge} years`);
console.log(`  [Expected for Western Europe: 78-82 years average]`);

console.log(`\nFERTILITY & FAMILY:`);
console.log(`  Average children:        ${stats.avgChildren.toFixed(2)}`);
console.log(`  Children-free lives:     ${lives.filter(l => l.children === 0).length.toLocaleString()} (${(lives.filter(l => l.children === 0).length / stats.totalLives * 100).toFixed(1)}%)`);
console.log(`  Single parents:          ${stats.singleParentCount.toLocaleString()} (${(stats.singleParentCount / stats.totalLives * 100).toFixed(1)}%)`);

console.log(`\nEMPLOYMENT & STABILITY:`);
console.log(`  Avg job changes:         ${stats.avgJobChanges.toFixed(1)}`);
console.log(`  Avg unemployment years:  ${stats.avgUnemploymentYears.toFixed(1)}`);
console.log(`  Prolonged unemployment:  ${edgeCases.unemploymentChains.length.toLocaleString()} (${(edgeCases.unemploymentChains.length / stats.totalLives * 100).toFixed(2)}%)`);

console.log(`\nMENTAL HEALTH & SOCIAL:`);
console.log(`  Avg mental health:       ${stats.avgMentalHealth.toFixed(0)}/100`);
console.log(`  Avg friends:             ${stats.avgFriends.toFixed(1)}`);
console.log(`  Avg community:           ${stats.avgCommunity.toFixed(0)}`);
console.log(`  Isolated (friends < 2):  ${stats.isolatedCount.toLocaleString()} (${(stats.isolatedCount / stats.totalLives * 100).toFixed(1)}%)`);
console.log(`  High suicide risk:       ${stats.suicideRiskCount.toLocaleString()} (${(stats.suicideRiskCount / stats.totalLives * 100).toFixed(2)}%)`);

console.log(`\nECONOMIC STABILITY:`);
console.log(`  Avg final resources:     ${isNaN(stats.avgResources) ? 'NaN (ERROR)' : stats.avgResources.toFixed(0)}`);
console.log(`  Avg final debt:          ${stats.avgDebt.toFixed(0)}`);
console.log(`  Avg max debt in life:    ${stats.avgMaxDebt.toFixed(0)}`);
console.log(`  Avg lowest resources:    ${stats.avgMinResources.toFixed(0)}`);
console.log(`  Extreme poverty:         ${edgeCases.extremePoverty.length.toLocaleString()} (${(edgeCases.extremePoverty.length / stats.totalLives * 100).toFixed(2)}%)`);

console.log(`\nHEALTH & ACCIDENTS:`);
console.log(`  Avg physical health:     ${stats.avgPhysicalHealth.toFixed(0)}/100`);
console.log(`  Accident victims:        ${edgeCases.accidents.length.toLocaleString()} (${(edgeCases.accidents.length / stats.totalLives * 100).toFixed(2)}%)`);
console.log(`  Substance abuse:         ${edgeCases.substanceAbuse.length.toLocaleString()} (${(edgeCases.substanceAbuse.length / stats.totalLives * 100).toFixed(2)}%)`);

console.log(`\n${'─'.repeat(90)}`);
console.log(`🔴 EDGE CASES & VULNERABILITIES`);
console.log('─'.repeat(90) + '\n');

console.log(`SINGLE PARENTS (high vulnerability):`);
console.log(`  Count: ${edgeCases.singleParents.length}`);
if (edgeCases.singleParents.length > 0) {
  const avgAge = edgeCases.singleParents.reduce((sum, s) => sum + s.age, 0) / edgeCases.singleParents.length;
  const avgMental = edgeCases.singleParents.reduce((sum, s) => sum + s.mentalHealth, 0) / edgeCases.singleParents.length;
  const avgResources = edgeCases.singleParents.reduce((sum, s) => sum + s.resources, 0) / edgeCases.singleParents.length;
  console.log(`  Avg age: ${avgAge.toFixed(1)} | Mental: ${avgMental.toFixed(0)}/100 | Resources: ${avgResources.toFixed(0)}`);
  console.log(`  Sample:`);
  edgeCases.singleParents.slice(0, 3).forEach(s => {
    console.log(`    - ${s.sex} age ${s.age}, ${s.children} children, mental: ${s.mentalHealth}/100, resources: ${s.resources}`);
  });
}

console.log(`\nISOLATED SINGLES (friends < 2, age > 30):`);
console.log(`  Count: ${edgeCases.isolatedSingles.length}`);
if (edgeCases.isolatedSingles.length > 0) {
  const avgAge = edgeCases.isolatedSingles.reduce((sum, i) => sum + i.age, 0) / edgeCases.isolatedSingles.length;
  const avgMental = edgeCases.isolatedSingles.reduce((sum, i) => sum + i.mentalHealth, 0) / edgeCases.isolatedSingles.length;
  console.log(`  Avg age: ${avgAge.toFixed(1)} | Mental: ${avgMental.toFixed(0)}/100`);
  console.log(`  Sample:`);
  edgeCases.isolatedSingles.slice(0, 3).forEach(i => {
    console.log(`    - Age ${i.age}, friends: ${i.friends}, mental: ${i.mentalHealth}/100, married: ${i.married}`);
  });
}

console.log(`\nHIGH SUICIDE RISK (mental < 20, age > 18):`);
console.log(`  Count: ${edgeCases.suicideRisk.length}`);
if (edgeCases.suicideRisk.length > 0) {
  const avgAge = edgeCases.suicideRisk.reduce((sum, s) => sum + s.age, 0) / edgeCases.suicideRisk.length;
  const avgFriends = edgeCases.suicideRisk.reduce((sum, s) => sum + s.friends, 0) / edgeCases.suicideRisk.length;
  console.log(`  Avg age: ${avgAge.toFixed(1)} | Avg friends: ${avgFriends.toFixed(1)}`);
  console.log(`  Sample:`);
  edgeCases.suicideRisk.slice(0, 3).forEach(s => {
    console.log(`    - Age ${s.age}, mental: ${s.mentalHealth}/100, friends: ${s.friends}, ${s.singleType}`);
  });
}

console.log(`\nPROLONGED UNEMPLOYMENT (> 5 consecutive years):`);
console.log(`  Count: ${edgeCases.unemploymentChains.length}`);
if (edgeCases.unemploymentChains.length > 0) {
  const avgAge = edgeCases.unemploymentChains.reduce((sum, u) => sum + u.age, 0) / edgeCases.unemploymentChains.length;
  const avgYears = edgeCases.unemploymentChains.reduce((sum, u) => sum + u.unemploymentYears, 0) / edgeCases.unemploymentChains.length;
  console.log(`  Avg age: ${avgAge.toFixed(1)} | Avg duration: ${avgYears.toFixed(1)} years`);
  console.log(`  Sample:`);
  edgeCases.unemploymentChains.slice(0, 3).forEach(u => {
    console.log(`    - Age ${u.age}, unemployed: ${u.unemploymentYears} years, resources: ${u.resources}, children: ${u.children}`);
  });
}

console.log(`\nEXTREME POVERTY (resources went negative):`);
console.log(`  Count: ${edgeCases.extremePoverty.length}`);
if (edgeCases.extremePoverty.length > 0) {
  console.log(`  Sample:`);
  edgeCases.extremePoverty.slice(0, 3).forEach(p => {
    console.log(`    - Age ${p.age}, min: ${p.minResources}, final: ${p.finalResources}, children: ${p.children}`);
  });
}

console.log(`\nACCIDENT VICTIMS:`);
console.log(`  Count: ${edgeCases.accidents.length} (${(edgeCases.accidents.length / stats.totalLives * 100).toFixed(2)}%)`);

console.log(`\nSUBSTANCE ABUSE:`);
console.log(`  Count: ${edgeCases.substanceAbuse.length} (${(edgeCases.substanceAbuse.length / stats.totalLives * 100).toFixed(2)}%)`);

console.log(`\n${'─'.repeat(90)}`);
console.log(`📈 NEVER-MARRIED BREAKDOWN (${stats.neverMarriedCount.toLocaleString()} lives)`);
console.log('─'.repeat(90) + '\n');

if (neverMarried.length > 0) {
  const neverMarriedFemales = neverMarried.filter(n => n.sex === 'female');
  const neverMarriedMales = neverMarried.filter(n => n.sex === 'male');
  const avgChildrenFemales = neverMarriedFemales.reduce((sum, n) => sum + n.children, 0) / neverMarriedFemales.length;
  const avgChildrenMales = neverMarriedMales.reduce((sum, n) => sum + n.children, 0) / neverMarriedMales.length;
  const avgMentalFemales = neverMarriedFemales.reduce((sum, n) => sum + n.mentalHealth, 0) / neverMarriedFemales.length;
  const avgMentalMales = neverMarriedMales.reduce((sum, n) => sum + n.mentalHealth, 0) / neverMarriedMales.length;
  const avgResourcesFemales = neverMarriedFemales.reduce((sum, n) => sum + n.resources, 0) / neverMarriedFemales.length;
  const avgResourcesMales = neverMarriedMales.reduce((sum, n) => sum + n.resources, 0) / neverMarriedMales.length;

  console.log(`FEMALES (${neverMarriedFemales.length.toLocaleString()}):`);
  console.log(`  Avg age: ${(neverMarriedFemales.reduce((sum, n) => sum + n.age, 0) / neverMarriedFemales.length).toFixed(1)}`);
  console.log(`  Avg children: ${avgChildrenFemales.toFixed(2)}`);
  console.log(`  Avg mental health: ${avgMentalFemales.toFixed(0)}/100`);
  console.log(`  Avg resources: ${isNaN(avgResourcesFemales) ? 'NaN (ERROR)' : avgResourcesFemales.toFixed(0)}`);

  console.log(`\nMALES (${neverMarriedMales.length.toLocaleString()}):`);
  console.log(`  Avg age: ${(neverMarriedMales.reduce((sum, n) => sum + n.age, 0) / neverMarriedMales.length).toFixed(1)}`);
  console.log(`  Avg children: ${avgChildrenMales.toFixed(2)}`);
  console.log(`  Avg mental health: ${avgMentalMales.toFixed(0)}/100`);
  console.log(`  Avg resources: ${isNaN(avgResourcesMales) ? 'NaN (ERROR)' : avgResourcesMales.toFixed(0)}`);
}

console.log(`\n${'='.repeat(90)}`);
console.log(`TEST COMPLETED: ${NUM_LIVES.toLocaleString()} ${REGION} lives analyzed`);
console.log(`Total time: ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
console.log(`${'='.repeat(90)}\n`);
