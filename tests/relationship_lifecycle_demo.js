/**
 * COMPLETE RELATIONSHIP LIFECYCLE DEMO
 * Shows one life going through all relationship stages
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

console.log(`\n=== COMPLETE RELATIONSHIP LIFECYCLE DEMO ===\n`);

// Keep running until we find a life with rich relationship events
let found = false;
let attempts = 0;

while (!found && attempts < 50) {
  const engine = new GameEngine(birthCards, familyCards, eventCards, deathCards);
  engine.createPlayer(birthCards.find(b => b.name === 'Western Europe'), familyCards[0]);
  const player = engine.player;
  
  let events = {
    married: null,
    children: null,
    motherDied: null,
    fatherDied: null,
    widowed: null,
    remarried: null
  };
  
  // Run full life
  while (player.alive && player.demographics.age < 150) {
    const age = player.demographics.age;
    
    // Track key relationship events (only first occurrence)
    if (!events.married && age >= 20 && age <= 30 && player.relationships.social.married) {
      events.married = age;
    }
    
    if (!events.children && player.relationships.children && player.relationships.children.length > 0) {
      events.children = age;
    }
    
    if (!events.motherDied && !player.relationships.parents.mother.alive) {
      events.motherDied = age;
    }
    
    if (!events.fatherDied && !player.relationships.parents.father.alive) {
      events.fatherDied = age;
    }
    
    if (!events.widowed && player.relationships.social.widowed) {
      events.widowed = {
        age,
        mental: player.health.mental.current
      };
    }
    
    if (!events.remarried && events.widowed && player.relationships.social.married && !player.relationships.social.divorced) {
      events.remarried = age;
    }
    
    engine.nextYear();
  }
  
  // Check if we found meaningful events
  const eventCount = Object.values(events).filter(e => e !== null).length;
  if (eventCount >= 4) {
    found = true;
    
    console.log(`COMPLETE LIFE STORY (Age ${player.demographics.age}, ${player.demographics.sex}):`);
    console.log(`Death: ${player.causeOfDeath || 'Unknown'}\n`);
    
    const timeline = [];
    if (events.married) timeline.push(`Age ${events.married}: Married`);
    if (events.children) timeline.push(`Age ${events.children}: First child born`);
    if (events.motherDied) timeline.push(`Age ${events.motherDied}: Mother died`);
    if (events.fatherDied) timeline.push(`Age ${events.fatherDied}: Father died`);
    if (events.widowed) {
      timeline.push(`Age ${events.widowed.age}: Partner died (WIDOWED)`);
      timeline.push(`         └─ Mental health: ${events.widowed.mental.toFixed(0)}/100`);
    }
    if (events.remarried) timeline.push(`Age ${events.remarried}: Remarried`);
    
    timeline.forEach(e => console.log(`  ${e}`));
    
    console.log(`\nFINAL STATUS (Age ${player.demographics.age}):`);
    console.log(`  - Mental Health: ${player.health.mental.current.toFixed(0)}/100`);
    console.log(`  - Physical Health: ${player.health.physical.current.toFixed(0)}/100`);
    console.log(`  - Currently Married: ${player.relationships.social.married ? 'YES' : 'NO'}`);
    console.log(`  - Widowed: ${player.relationships.social.widowed ? 'YES' : 'NO'}`);
    console.log(`  - Children Alive: ${player.relationships.children?.length || 0}`);
    console.log(`  - Friends: ${player.relationships.social.friends || 0}`);
    console.log(`  - Resources: ${player.economics.resources.current.toFixed(0)}`);
    console.log(`  - Debt: ${player.economics.debt.toFixed(0)}`);
  }
  
  attempts++;
}

if (!found) {
  console.log(`Demo: No particularly interesting relationship events found in ${attempts} attempts.`);
  console.log(`(This is normal - most lives have simpler relationship arcs)`);
}

console.log(`\n${'='.repeat(80)}\n`);
