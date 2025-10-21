/**
 * CHILDREN LIFECYCLE COMPREHENSIVE TEST
 * Verify children: birth → aging → potential death → expense tracking
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

const NUM_LIVES = 10;
const results = [];

console.log(`\n=== CHILDREN LIFECYCLE COMPREHENSIVE TEST: ${NUM_LIVES} lives ===\n`);

for (let lifeNum = 0; lifeNum < NUM_LIVES; lifeNum++) {
  const engine = new GameEngine(birthCards, familyCards, eventCards, deathCards);
  engine.createPlayer(birthCards.find(b => b.name === 'Western Europe'), familyCards[0]);
  const player = engine.player;
  
  let lifeData = {
    lifeNumber: lifeNum + 1,
    playerDeathAge: null,
    childrenBorn: [],
    childrenDied: [],
    childrenAliveAtDeath: 0,
    expenseTracking: []
  };
  
  // Run full life
  while (player.alive && player.demographics.age < 150) {
    const age = player.demographics.age;
    
    // Track children
    const childCount = player.relationships.children?.length || 0;
    const childAges = (player.relationships.children || []).map(c => c.age);
    
    // New births
    if (player.relationships.children && player.relationships.children.length > lifeData.childrenBorn.length) {
      const newChild = player.relationships.children[player.relationships.children.length - 1];
      lifeData.childrenBorn.push({
        bornAtPlayerAge: age,
        birthOrder: lifeData.childrenBorn.length + 1
      });
    }
    
    // Track expense at key ages
    if ([25, 35, 45, 50].includes(age)) {
      const childrenCost = childCount * 5;
      lifeData.expenseTracking.push({
        playerAge: age,
        childCount,
        childAges,
        expectedCost: childrenCost
      });
    }
    
    engine.nextYear();
  }
  
  lifeData.playerDeathAge = player.demographics.age;
  lifeData.childrenAliveAtDeath = player.relationships.children?.length || 0;
  
  results.push(lifeData);
  
  process.stdout.write(`\r[${lifeNum + 1}/${NUM_LIVES}] Age: ${player.demographics.age}, Children born: ${lifeData.childrenBorn.length}, Children alive: ${lifeData.childrenAliveAtDeath}`);
}

console.log('\n');

// Analyze results
const stats = {
  totalLivesWithChildren: results.filter(r => r.childrenBorn.length > 0).length,
  totalChildrenBorn: results.reduce((sum, r) => sum + r.childrenBorn.length, 0),
  totalChildrenAliveAtEnd: results.reduce((sum, r) => sum + r.childrenAliveAtDeath, 0),
  childrenWhoAged: 0,
  exampleLives: []
};

// Find example lives with children
results.forEach(r => {
  if (r.childrenBorn.length > 0) {
    stats.exampleLives.push({
      lifeNum: r.lifeNumber,
      born: r.childrenBorn.length,
      alive: r.childrenAliveAtDeath,
      expenses: r.expenseTracking
    });
  }
});

console.log('='.repeat(100));
console.log('CHILDREN LIFECYCLE STATISTICS');
console.log('='.repeat(100));

console.log(`\nBASIC STATS:`);
console.log(`  Lives analyzed: ${NUM_LIVES}`);
console.log(`  Lives with children: ${stats.totalLivesWithChildren} (${(stats.totalLivesWithChildren / NUM_LIVES * 100).toFixed(0)}%)`);
console.log(`  Total children born: ${stats.totalChildrenBorn}`);
console.log(`  Children alive at player death: ${stats.totalChildrenAliveAtEnd}`);
console.log(`  Children died before player: ${stats.totalChildrenBorn - stats.totalChildrenAliveAtEnd}`);

if (stats.totalChildrenBorn > 0) {
  console.log(`  Survival rate (made it to player death): ${((stats.totalChildrenAliveAtEnd / stats.totalChildrenBorn) * 100).toFixed(0)}%`);
}

console.log('\n' + '='.repeat(100));
console.log('EXAMPLE LIVES WITH CHILDREN');
console.log('='.repeat(100));

stats.exampleLives.slice(0, 3).forEach(life => {
  console.log(`\nLife ${life.lifeNum}:`);
  console.log(`  Children born: ${life.born}, Alive at death: ${life.alive}, Died: ${life.born - life.alive}`);
  if (life.expenses.length > 0) {
    console.log(`  Expense tracking (5 resources per child per year):`);
    life.expenses.forEach(exp => {
      console.log(`    Player age ${exp.playerAge}: ${exp.childCount} children (ages ${exp.childAges.join(', ')}), cost = ${exp.expectedCost}/year`);
    });
  }
});

console.log('\n' + '='.repeat(100));
