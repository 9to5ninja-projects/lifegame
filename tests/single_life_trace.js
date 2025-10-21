/**
 * SINGLE LIFE DEEP TRACE
 * Run ONE life with detailed logging at each age milestone
 * to see exactly what's being tracked and where data is stored
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

console.log('\n' + '='.repeat(100));
console.log('SINGLE LIFE DEEP TRACE - Western Europe'.padEnd(100));
console.log('='.repeat(100) + '\n');

const engine = new GameEngine(birthCards, familyCards, eventCards, deathCards);
const birthCard = birthCards.find(b => b.name === 'Western Europe');
engine.createPlayer(birthCard, familyCards[0]);
const player = engine.player;

console.log(`✓ Created ${player.demographics.sex} player, Western Europe\n`);

// Function to dump relevant state
function dumpState(label) {
  console.log(`\n${'─'.repeat(100)}`);
  console.log(`[Age ${player.demographics.age}] ${label}`);
  console.log('─'.repeat(100));
  
  // Relationships
  console.log('\nRELATIONSHIPS:');
  console.log(`  Partner:`);
  console.log(`    exists: ${player.relationships?.partner?.exists}`);
  console.log(`    alive: ${player.relationships?.partner?.alive}`);
  console.log(`    married: ${player.relationships?.partner?.married}`);
  console.log(`    since: ${player.relationships?.partner?.since}`);
  console.log(`    relationship strength: ${player.relationships?.partner?.relationship}`);
  console.log(`  Children: ${player.relationships?.children?.length || 0}`);
  if (player.relationships?.children?.length > 0) {
    player.relationships.children.forEach((c, i) => {
      console.log(`    [${i}] age ${c.age}, alive: ${c.alive}`);
    });
  }
  console.log(`  Social.married: ${player.relationships?.social?.married}`);
  console.log(`  Social.friends: ${player.relationships?.social?.friends}`);
  console.log(`    (type: ${typeof player.relationships?.social?.friends})`);
  console.log(`  Social.community: ${player.relationships?.social?.community}`);
  
  // Employment
  console.log('\nEMPLOYMENT:');
  console.log(`  employmentStatus: ${JSON.stringify(player.economics?.income?.employmentStatus)}`);
  console.log(`  employed (old API): ${player.economics?.income?.employed}`);
  console.log(`  jobHistoryCount: ${player.economics?.income?.jobHistoryCount}`);
  console.log(`  targetJobTenure: ${player.economics?.income?.targetJobTenure}`);
  console.log(`  income.current: ${player.economics?.income?.current}`);
  
  // Resources/Economics
  console.log('\nECONOMICS:');
  console.log(`  resources: ${JSON.stringify(player.economics?.resources)}`);
  console.log(`  debt: ${player.economics?.debt}`);
  
  // Health
  console.log('\nHEALTH:');
  console.log(`  mental.current: ${player.health?.mental?.current}`);
  console.log(`  physical.current: ${player.health?.physical?.current}`);
  console.log(`  substanceAbuse.active: ${player.health?.substanceAbuse?.active}`);
  console.log(`  accidents.active: ${player.health?.accidents?.active}`);

  // EDUCATION
  console.log('\nEDUCATION:');
  console.log(`  level: ${player.development?.education?.level}`);
  console.log(`  literate: ${player.development?.education?.literate}`);
  console.log(`  yearsCompleted: ${player.development?.education?.yearsCompleted}`);
  
  // Deaths
  console.log('\nDEATHS:');
  console.log(`  alive: ${player.alive}`);
  console.log(`  causeOfDeath: ${player.causeOfDeath}`);
}

// Age 0
dumpState('BIRTH');

// Advance to age 5
while (player.demographics.age < 5 && player.alive) {
  engine.nextYear();
}
dumpState('AGE 5 (childhood)');

// Advance to age 18
while (player.demographics.age < 18 && player.alive) {
  engine.nextYear();
}
dumpState('AGE 18 (young adult - employment starts)');

// Advance to age 25 (marriage window)
while (player.demographics.age < 25 && player.alive) {
  engine.nextYear();
}
dumpState('AGE 25 (peak marriage age)');

// Advance to age 30
while (player.demographics.age < 30 && player.alive) {
  engine.nextYear();
}
dumpState('AGE 30 (family building)');

// Advance to age 40
while (player.demographics.age < 40 && player.alive) {
  engine.nextYear();
}
dumpState('AGE 40 (mid-career)');

// Advance to age 50
while (player.demographics.age < 50 && player.alive) {
  engine.nextYear();
}
dumpState('AGE 50 (peak career)');

// Advance to death
let cycleCount = 0;
while (player.alive && cycleCount < 150) {
  engine.nextYear();
  cycleCount++;
}

dumpState('DEATH');

console.log('\n' + '='.repeat(100));
console.log('TRACE COMPLETE'.padEnd(100));
console.log('='.repeat(100) + '\n');
