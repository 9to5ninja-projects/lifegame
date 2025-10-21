/**
 * SINGLE LIFE FROM WEALTHY FAMILY - TRACE
 * Test whether friends accumulate properly for a well-resourced player
 * This isolates whether friends=0 is due to:
 * a) No university education (poverty → can't afford it)
 * b) Or actual friends system bug
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
console.log('SINGLE LIFE FROM WEALTHY FAMILY - Western Europe'.padEnd(100));
console.log('='.repeat(100) + '\n');

const engine = new GameEngine(birthCards, familyCards, eventCards, deathCards);
const birthCard = birthCards.find(b => b.name === 'Western Europe');

// Create player with wealthy family
engine.createPlayer(birthCard, familyCards[0]);
const player = engine.player;

// HACK: Set wealthy family background to ensure university attendance
player.relationships.birthFamily = {
  income: 100,        // Very wealthy family
  education: 'tertiary_bachelor',
  size: 2
};

// Give player starting resources
player.economics.resources.current = 50;
player.economics.resources.baseline = 50;
player.demographics.birthWealth = 'high';

console.log(`✓ Created ${player.demographics.sex} player, Western Europe (WEALTHY BACKGROUND)`);
console.log(`  Family income: ${player.relationships.birthFamily.income}`);
console.log(`  Starting resources: ${player.economics.resources.current}\n`);

// Function to dump relevant state
function dumpState(label) {
  console.log(`\n${'─'.repeat(100)}`);
  console.log(`[Age ${player.demographics.age}] ${label}`);
  console.log('─'.repeat(100));
  
  // Relationships
  console.log('\nRELATIONSHIPS:');
  console.log(`  Partner exists: ${player.relationships?.partner?.exists}`);
  console.log(`  Social.married: ${player.relationships?.social?.married}`);
  console.log(`  Social.friends: ${player.relationships?.social?.friends}`);
  console.log(`  Social.community: ${player.relationships?.social?.community}`);
  
  // Employment
  console.log('\nEMPLOYMENT:');
  console.log(`  Employed: ${player.economics?.income?.employed}`);
  console.log(`  Income: ${player.economics?.income?.current}`);
  console.log(`  Unemployment months: ${player.economics?.income?.unemploymentMonths || 0}`);
  
  // Education
  console.log('\nEDUCATION:');
  console.log(`  Level: ${player.development?.education?.level}`);
  console.log(`  In school: ${player.development?.education?.inSchool}`);
  console.log(`  University years: ${player.development?.education?.universityYears || 0}`);
  
  // Resources
  console.log('\nECONOMICS:');
  console.log(`  Resources: ${JSON.stringify(player.economics?.resources)}`);
  console.log(`  Debt: ${player.economics?.debt}`);
}

// Trace key milestones
const milestones = [0, 5, 12, 18, 20, 22, 25, 30, 40, 50, 60, 70, 80];
let nextMilestone = 0;

while (player.demographics.age <= 85 && player.health?.vital?.alive) {
  // Dump state at milestones
  if (player.demographics.age === milestones[nextMilestone]) {
    let label = 'Birth';
    if (player.demographics.age === 5) label = 'Childhood';
    else if (player.demographics.age === 12) label = 'Secondary school begins';
    else if (player.demographics.age === 18) label = 'Adult age - may attend university';
    else if (player.demographics.age === 20) label = 'University years';
    else if (player.demographics.age === 22) label = 'University graduation window';
    else if (player.demographics.age === 25) label = 'Post-university entry to workforce';
    else if (player.demographics.age === 30) label = 'Established adult';
    else if (player.demographics.age === 40) label = 'Mid-career';
    else if (player.demographics.age === 50) label = 'Peak earning years';
    else if (player.demographics.age === 60) label = 'Pre-retirement';
    else if (player.demographics.age === 70) label = 'Elderly';
    else if (player.demographics.age === 80) label = 'Very elderly';
    
    dumpState(label);
    nextMilestone++;
  }
  
  // Process one year
  engine.processYear();
}

console.log('\n' + '='.repeat(100));
console.log('END OF LIFE SUMMARY'.padEnd(100));
console.log('='.repeat(100));
console.log(`  Age at death: ${player.demographics.age}`);
console.log(`  Cause: ${player.demographics.causeOfDeath || 'N/A'}`);
console.log(`  Final friends: ${player.relationships?.social?.friends}`);
console.log(`  Final community: ${player.relationships?.social?.community}`);
console.log(`  Final resources: ${player.economics?.resources?.current}`);
console.log(`  Final education: ${player.development?.education?.level}`);
