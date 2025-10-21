/**
 * RELATIONSHIP LIFECYCLE TEST
 * Verify that children, partners, friends age and die
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

const NUM_LIVES = 5;

console.log(`\n=== RELATIONSHIP LIFECYCLE TEST: ${NUM_LIVES} lives ===\n`);

for (let lifeNum = 0; lifeNum < NUM_LIVES; lifeNum++) {
  const engine = new GameEngine(birthCards, familyCards, eventCards, deathCards);
  engine.createPlayer(birthCards.find(b => b.name === 'Western Europe'), familyCards[0]);
  const player = engine.player;
  
  let events = {
    childrenBorn: [],
    childrenDied: [],
    partnered: false,
    partnerDied: false,
    parentDied: false,
    friendCount: 0,
    maxChildren: 0
  };
  
  // Run full life
  while (player.alive && player.demographics.age < 150) {
    const beforeChildren = player.relationships.children?.length || 0;
    const beforeFriends = player.relationships.social?.friends || 0;
    const beforePartner = player.relationships.partner?.exists;
    
    engine.nextYear();
    
    const afterChildren = player.relationships.children?.length || 0;
    const afterFriends = player.relationships.social?.friends || 0;
    const afterPartner = player.relationships.partner?.exists;
    
    // Track children born
    if (afterChildren > beforeChildren) {
      events.childrenBorn.push(player.demographics.age);
    }
    
    // Track children died
    if (afterChildren < beforeChildren && beforeChildren > 0) {
      events.childrenDied.push({
        age: player.demographics.age,
        childrenRemaining: afterChildren
      });
    }
    
    // Track partnership
    if (!beforePartner && afterPartner) {
      events.partnered = player.demographics.age;
    }
    
    // Track partner death
    if (beforePartner && !afterPartner) {
      events.partnerDied = player.demographics.age;
    }
    
    // Track friend count
    events.friendCount = Math.max(events.friendCount, afterFriends);
    events.maxChildren = Math.max(events.maxChildren, afterChildren);
  }
  
  // Check parent deaths
  if (!player.relationships.parents.mother.alive || !player.relationships.parents.father.alive) {
    events.parentDied = true;
  }
  
  console.log(`\nLife ${lifeNum + 1}: Age ${player.demographics.age}`);
  console.log(`  Children: born=${events.childrenBorn.length}, max=${events.maxChildren}, died=${events.childrenDied.length}`);
  if (events.childrenBorn.length > 0) {
    console.log(`    └─ Born at ages: ${events.childrenBorn.join(', ')}`);
  }
  if (events.childrenDied.length > 0) {
    console.log(`    └─ Deaths: ${events.childrenDied.map(d => `age ${d.age}`).join(', ')}`);
  }
  
  console.log(`  Partner: ${events.partnered ? `Yes (age ${events.partnered})` : 'No'}${events.partnerDied ? ` - DIED age ${events.partnerDied}` : ''}`);
  console.log(`  Friends: peak ${events.friendCount}`);
  console.log(`  Parents: ${events.parentDied ? 'At least one died ✓' : 'Both alive'}`);
}

console.log('\n' + '='.repeat(80));
