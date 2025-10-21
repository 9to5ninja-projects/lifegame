/**
 * WIDOWED STATUS TEST
 * Verify spouse death triggers widowed status and cascading effects
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

const NUM_LIVES = 20;
const results = [];

console.log(`\n=== WIDOWED STATUS TEST: ${NUM_LIVES} lives ===\n`);

for (let lifeNum = 0; lifeNum < NUM_LIVES; lifeNum++) {
  const engine = new GameEngine(birthCards, familyCards, eventCards, deathCards);
  engine.createPlayer(birthCards.find(b => b.name === 'Western Europe'), familyCards[0]);
  const player = engine.player;
  
  let lifeData = {
    lifeNumber: lifeNum + 1,
    playerDeathAge: null,
    partnerDeathAge: null,
    becameWidowed: false,
    widowedDuration: 0,
    remarried: false,
    remarriageAge: null,
    childrenAtWidowhood: 0,
    timelineEvents: []
  };
  
  // Run full life
  while (player.alive && player.demographics.age < 150) {
    const age = player.demographics.age;
    
    // Track widowhood events
    if (player.relationships.social.widowed && !lifeData.becameWidowed) {
      lifeData.becameWidowed = true;
      lifeData.partnerDeathAge = player.relationships.partner.deathAge;
      lifeData.childrenAtWidowhood = player.relationships.children?.length || 0;
      lifeData.timelineEvents.push({
        age,
        event: 'became_widowed',
        partnerAge: player.relationships.partner.deathAge,
        childrenCount: lifeData.childrenAtWidowhood,
        mentalHealth: player.health.mental.current,
        isolation: player.relationships.social.isolation
      });
    }
    
    // Track remarriage
    if (player.relationships.social.married && lifeData.becameWidowed && !lifeData.remarried) {
      lifeData.remarried = true;
      lifeData.remarriageAge = age;
      lifeData.timelineEvents.push({
        age,
        event: 'remarried',
        mentalHealth: player.health.mental.current
      });
    }
    
    // Track widowhood duration each year
    if (lifeData.becameWidowed) {
      lifeData.widowedDuration = age - lifeData.partnerDeathAge;
    }
    
    engine.nextYear();
  }
  
  lifeData.playerDeathAge = player.demographics.age;
  
  results.push(lifeData);
  
  process.stdout.write(`\r[${lifeNum + 1}/${NUM_LIVES}] Age: ${player.demographics.age}, Widowed: ${lifeData.becameWidowed}, Remarried: ${lifeData.remarried}`);
}

console.log('\n');

// Analyze results
const stats = {
  widowedCount: results.filter(r => r.becameWidowed).length,
  remarriedCount: results.filter(r => r.remarried).length,
  avgWidowedDuration: 0,
  widowedWithChildren: results.filter(r => r.becameWidowed && r.childrenAtWidowhood > 0).length,
  exampleWidowed: []
};

// Calculate average widowed duration (for those who became widowed)
const widowedDurations = results.filter(r => r.becameWidowed).map(r => r.widowedDuration);
if (widowedDurations.length > 0) {
  stats.avgWidowedDuration = widowedDurations.reduce((a, b) => a + b, 0) / widowedDurations.length;
}

// Get example widowed lives
results.filter(r => r.becameWidowed).forEach(r => {
  stats.exampleWidowed.push({
    lifeNum: r.lifeNumber,
    widowedAge: r.partnerDeathAge,
    widowedDuration: r.widowedDuration,
    childrenAtWidowhood: r.childrenAtWidowhood,
    remarried: r.remarried ? `Yes at age ${r.remarriageAge}` : 'No',
    events: r.timelineEvents
  });
});

console.log('='.repeat(100));
console.log('WIDOWED STATUS STATISTICS');
console.log('='.repeat(100));

console.log(`\nBASIC STATS:`);
console.log(`  Lives analyzed: ${NUM_LIVES}`);
console.log(`  Lives that became widowed: ${stats.widowedCount} (${(stats.widowedCount / NUM_LIVES * 100).toFixed(0)}%)`);
console.log(`  Widowed who remarried: ${stats.remarriedCount} (${stats.widowedCount > 0 ? (stats.remarriedCount / stats.widowedCount * 100).toFixed(0) : 'N/A'}% of widowed)`);
console.log(`  Widowed with dependent children: ${stats.widowedWithChildren}`);
console.log(`  Average widowed duration: ${stats.avgWidowedDuration.toFixed(1)} years`);

console.log('\n' + '='.repeat(100));
console.log('EXAMPLE WIDOWED LIVES');
console.log('='.repeat(100));

stats.exampleWidowed.slice(0, 3).forEach(life => {
  console.log(`\nLife ${life.lifeNum}: Widowed at age ${life.widowedAge}, Duration: ${life.widowedDuration} years`);
  console.log(`  Children at widowhood: ${life.childrenAtWidowhood}`);
  console.log(`  Remarried: ${life.remarried}`);
  life.events.forEach(e => {
    if (e.event === 'became_widowed') {
      console.log(`    Age ${e.age}: Became widowed (partner was ${e.partnerAge})`);
      console.log(`      Mental health: ${e.mentalHealth.toFixed(0)}/100, Isolation: ${e.isolation ? 'YES' : 'NO'}`);
    } else if (e.event === 'remarried') {
      console.log(`    Age ${e.age}: Remarried`);
      console.log(`      Mental health: ${e.mentalHealth.toFixed(0)}/100`);
    }
  });
});

console.log('\n' + '='.repeat(100));
