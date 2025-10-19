const GameEngine = require('../game_engine_v2_homeostatic.js');
const fs = require('fs');

// Load all card types
const eventCardsAdult = JSON.parse(fs.readFileSync('./event_cards_adult_v2.json', 'utf8'));
const eventCardsChildhood = JSON.parse(fs.readFileSync('./event_cards_childhood_v2.json', 'utf8'));
const eventCardsTeens = JSON.parse(fs.readFileSync('./event_cards_teen_v2.json', 'utf8'));
const familyCards = JSON.parse(fs.readFileSync('./family_cards_json.json', 'utf8'));
const birthCards = JSON.parse(fs.readFileSync('./birth_cards_json.json', 'utf8'));
const deathCards = JSON.parse(fs.readFileSync('./death_cards_json.json', 'utf8'));

// Combine all events
const allEvents = [...eventCardsAdult, ...eventCardsChildhood, ...eventCardsTeens];

console.log('='.repeat(100));
console.log('GLOBAL POPULATION TEST - 1M LIVES PER REGION');
console.log('='.repeat(100));
console.log(`Total events available: ${allEvents.length}`);
console.log(`Birth cards: ${birthCards.length}`);
console.log(`Family cards: ${familyCards.length}`);
console.log();

// Group birth cards by region type
const regionGroups = {
  'Nordic': birthCards.filter(b => b.name && b.name.includes('Nordic')),
  'Developed': birthCards.filter(b => b.name && (b.name.includes('North America') || b.name.includes('Europe') || b.name.includes('Japan') || b.name.includes('Korea'))),
  'Developing': birthCards.filter(b => b.name && (b.name.includes('China') || b.name.includes('Latin') || b.name.includes('Southeast'))),
  'Fragile': birthCards.filter(b => b.name && (b.name.includes('Sub-Saharan') || b.name.includes('South Asia') || b.name.includes('War')))
};

console.log('Birth Card Distribution:');
Object.entries(regionGroups).forEach(([region, cards]) => {
  console.log(`  ${region}: ${cards.length} cards`);
});
console.log();

// Run simulation for each region
const regionalResults = {};

Object.entries(regionGroups).forEach(([regionName, regionCards]) => {
  if (regionCards.length === 0) {
    console.log(`⚠️  Skipping ${regionName} - no birth cards found`);
    return;
  }

  console.log(`\nTesting ${regionName} Region (${regionCards.length} birth card variants)...`);
  console.log('-'.repeat(100));

  const engine = new GameEngine(birthCards, familyCards, allEvents, deathCards);
  
  const stats = {
    region: regionName,
    totalLives: 0,
    avgAge: 0,
    avgSurvival: 0,
    avgResources: 0,
    addiction: 0,
    suicideCount: 0,
    crimeCount: 0,
    deathCauses: {},
    ageAtDeath: [],
    eventOccurrences: 0,
    playersWithEvents: 0,
    avgEventsPerPlayer: 0
  };

  const startTime = Date.now();
  const testSize = 1000000;

  for (let i = 0; i < testSize; i++) {
    if ((i + 1) % 100000 === 0) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const rate = ((i + 1) / (elapsed)).toFixed(0);
      process.stdout.write(`\r  ${(i+1).toLocaleString()} lives... (${rate} lives/sec)`);
    }

    // Create player from this region
    const bc = regionCards[Math.floor(Math.random() * regionCards.length)];
    const fc = familyCards[Math.floor(Math.random() * familyCards.length)];
    
    engine.createPlayer(bc, fc, {
      sex: Math.random() > 0.5 ? 'male' : 'female'
    });

    let playerHadEvent = false;

    // Simulate life
    while (engine.player.alive && engine.player.demographics.age < 100) {
      const result = engine.processYearEnd(engine.player);
      
      if (engine.player.lastEvent) {
        playerHadEvent = true;
        stats.eventOccurrences++;
      }
      
      if (!result.alive) break;
    }

    if (playerHadEvent) stats.playersWithEvents++;

    // Track statistics
    stats.totalLives++;
    stats.avgAge += engine.player.demographics.age;
    stats.avgSurvival += engine.player.survival;
    stats.avgResources += engine.player.economics.resources.current;
    stats.ageAtDeath.push(engine.player.demographics.age);

    // Check final state
    if (engine.player.health.addiction && engine.player.addiction.stage === 'dependent') {
      stats.addiction++;
    }

    // Track death causes
    if (engine.player.causeOfDeath) {
      const cause = engine.player.causeOfDeath;
      stats.deathCauses[cause] = (stats.deathCauses[cause] || 0) + 1;

      if (cause && cause.includes('Suicide')) stats.suicideCount++;
      if (cause && (cause.includes('Violence') || cause.includes('Crime'))) stats.crimeCount++;
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  const livesSec = (testSize / totalTime).toFixed(0);

  process.stdout.write(`\r  Completed in ${totalTime}s (${livesSec} lives/sec)\n`);

  // Calculate rates
  stats.avgAge /= testSize;
  stats.avgSurvival /= testSize;
  stats.avgResources /= testSize;
  stats.avgEventsPerPlayer = (stats.eventOccurrences / testSize).toFixed(2);

  const addictionRate = (stats.addiction / testSize * 100).toFixed(2);
  const suicideRate = (stats.suicideCount / testSize * 100000).toFixed(1);
  const crimeRate = (stats.crimeCount / testSize * 100000).toFixed(1);

  // Calculate median age at death
  stats.ageAtDeath.sort((a, b) => a - b);
  const medianAge = stats.ageAtDeath[Math.floor(stats.ageAtDeath.length / 2)];

  console.log();
  console.log(`Results for ${regionName}:`);
  console.log(`  Average Lifespan:     ${stats.avgAge.toFixed(1)} years`);
  console.log(`  Median Age at Death:  ${medianAge} years`);
  console.log(`  Average Survival:     ${stats.avgSurvival.toFixed(1)}/100`);
  console.log(`  Average Resources:    ${stats.avgResources.toFixed(1)}`);
  console.log();
  console.log(`  Addiction Rate:       ${addictionRate}% (target: 4%)`);
  console.log(`  Suicide Rate:         ${suicideRate}/100K (target: 10-15/100K)`);
  console.log(`  Crime Rate:           ${crimeRate}/100K (target: 140/100K)`);
  console.log();
  console.log(`  Events:               ${stats.playersWithEvents.toLocaleString()} players had events (${(stats.playersWithEvents/testSize*100).toFixed(1)}%)`);
  console.log(`  Avg Events/Player:    ${stats.avgEventsPerPlayer}`);
  console.log();

  // Top death causes
  const topDeaths = Object.entries(stats.deathCauses)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  console.log(`  Top 5 Death Causes:`);
  topDeaths.forEach(([ cause, count ], idx) => {
    const pct = (count / testSize * 100).toFixed(1);
    console.log(`    ${idx + 1}. ${cause}: ${(count/1000).toFixed(1)}K (${pct}%)`);
  });

  regionalResults[regionName] = {
    addictionRate: parseFloat(addictionRate),
    suicideRate: parseFloat(suicideRate),
    crimeRate: parseFloat(crimeRate),
    avgAge: stats.avgAge,
    medianAge: medianAge,
    avgSurvival: stats.avgSurvival,
    avgResources: stats.avgResources
  };
});

// Summary comparison
console.log();
console.log('='.repeat(100));
console.log('REGIONAL COMPARISON SUMMARY');
console.log('='.repeat(100));
console.log();

console.log('Lifespan by Region:');
Object.entries(regionalResults).forEach(([region, data]) => {
  console.log(`  ${region.padEnd(15)}: Avg ${data.avgAge.toFixed(1)} years | Median ${data.medianAge} years`);
});

console.log();
console.log('Survival by Region:');
Object.entries(regionalResults).forEach(([region, data]) => {
  console.log(`  ${region.padEnd(15)}: ${data.avgSurvival.toFixed(1)}/100`);
});

console.log();
console.log('Resources by Region:');
Object.entries(regionalResults).forEach(([region, data]) => {
  console.log(`  ${region.padEnd(15)}: ${data.avgResources.toFixed(1)} resources`);
});

console.log();
console.log('Addiction Rates by Region:');
Object.entries(regionalResults).forEach(([region, data]) => {
  const diff = (data.addictionRate - 4).toFixed(2);
  const status = Math.abs(data.addictionRate - 4) <= 0.5 ? '✓' : '✗';
  console.log(`  ${region.padEnd(15)}: ${data.addictionRate.toFixed(2)}% (target 4%, ${diff > 0 ? '+' : ''}${diff}%) ${status}`);
});

console.log();
console.log('Suicide Rates by Region:');
Object.entries(regionalResults).forEach(([region, data]) => {
  const inRange = data.suicideRate >= 8 && data.suicideRate <= 20;
  const status = inRange ? '✓' : '⏳';
  console.log(`  ${region.padEnd(15)}: ${data.suicideRate.toFixed(1)}/100K (target 10-15/100K) ${status}`);
});

console.log();
console.log('Crime Rates by Region:');
Object.entries(regionalResults).forEach(([region, data]) => {
  const inRange = data.crimeRate >= 100 && data.crimeRate <= 200;
  const status = inRange ? '✓' : '⏳';
  console.log(`  ${region.padEnd(15)}: ${data.crimeRate.toFixed(1)}/100K (target 140/100K) ${status}`);
});

console.log();
console.log('='.repeat(100));
console.log('TEST COMPLETE - Regional Analysis');
console.log('='.repeat(100));
