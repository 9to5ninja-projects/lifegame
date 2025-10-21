/**
 * CHILDREN LIFECYCLE TEST
 * Check if children age and die or stay frozen
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

const NUM_LIVES = 3;

console.log(`\n=== CHILDREN LIFECYCLE TEST: ${NUM_LIVES} lives ===\n`);

for (let lifeNum = 0; lifeNum < NUM_LIVES; lifeNum++) {
  const engine = new GameEngine(birthCards, familyCards, eventCards, deathCards);
  engine.createPlayer(birthCards.find(b => b.name === 'Western Europe'), familyCards[0]);
  const player = engine.player;
  
  let childrenAtBirth = [];
  let childrenLog = [];
  
  // Run full life
  while (player.alive && player.demographics.age < 150) {
    // Check children state at each year
    if (player.relationships.children && player.relationships.children.length > 0) {
      const ages = player.relationships.children.map(c => c.age);
      const bornAt = player.relationships.children.map(c => c.born);
      
      childrenLog.push({
        playerAge: player.demographics.age,
        childCount: player.relationships.children.length,
        childAges: ages,
        bornAtPlayerAge: bornAt
      });
    }
    
    engine.nextYear();
  }
  
  console.log(`\n\nLife ${lifeNum + 1}: Player died at age ${player.demographics.age}`);
  console.log(`Total children born: ${childrenLog.length > 0 ? childrenLog[childrenLog.length - 1].childCount : 0}`);
  
  if (childrenLog.length > 0) {
    console.log(`\nChildren lifecycle:`);
    // Show first few snapshots
    for (let i = 0; i < Math.min(3, childrenLog.length); i++) {
      const log = childrenLog[i];
      console.log(`  Player age ${log.playerAge}: ${log.childCount} children, ages ${log.childAges.join(', ')}, born at player ages ${log.bornAtPlayerAge.join(', ')}`);
    }
    
    // Show last snapshot
    if (childrenLog.length > 3) {
      const lastLog = childrenLog[childrenLog.length - 1];
      console.log(`  ...`);
      console.log(`  Player age ${lastLog.playerAge}: ${lastLog.childCount} children, ages ${lastLog.childAges.join(', ')}`);
    }
    
    // Check if children aged
    const firstLog = childrenLog[0];
    const lastLog = childrenLog[childrenLog.length - 1];
    const childAgesStatic = JSON.stringify(firstLog.childAges) === JSON.stringify(lastLog.childAges);
    
    console.log(`\n⚠️  ISSUE: Children ages ARE STATIC (never age)!` + (childAgesStatic ? ' ✓ CONFIRMED' : ' - Actually aging'));
  }
}

console.log('\n' + '='.repeat(80));
