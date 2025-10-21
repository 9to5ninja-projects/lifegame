/**
 * SYSTEMS INTEGRATION DIAGNOSTIC
 * Checks which major game systems are working in integrated engine
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

console.log('\n' + '='.repeat(90));
console.log('SYSTEMS INTEGRATION DIAGNOSTIC - Single Western Europe Life'.padEnd(90));
console.log('='.repeat(90) + '\n');

const engine = new GameEngine(birthCards, familyCards, eventCards, deathCards);
const birthCard = birthCards.find(b => b.name === 'Western Europe');
engine.createPlayer(birthCard, familyCards[0]);
const player = engine.player;

console.log('✓ Player created');
console.log(`  Age: ${player.demographics.age} | Sex: ${player.demographics.sex}`);
console.log(`  Birth region: ${player.demographics.birthRegion}`);
console.log();

// Store initial state
const initialState = {
  mentalHealth: player.health.mental?.current,
  physicalHealth: player.health.physical?.current,
  resources: player.economics?.resources,
  debt: player.economics?.debt,
  employmentStatus: player.economics?.income?.employmentStatus?.employed,
  children: player.relationships?.children?.length,
  friends: player.relationships?.social?.friends?.length,
  married: player.relationships?.social?.married,
  partnerAlive: player.relationships?.partner?.alive
};

console.log('INITIAL STATE (Age 0):');
console.log(`  Mental health:       ${initialState.mentalHealth}`);
console.log(`  Physical health:     ${initialState.physicalHealth}`);
console.log(`  Resources:           ${initialState.resources}`);
console.log(`  Debt:                ${initialState.debt}`);
console.log(`  Employed:            ${initialState.employmentStatus}`);
console.log(`  Children:            ${initialState.children}`);
console.log(`  Friends:             ${initialState.friends}`);
console.log(`  Married:             ${initialState.married}`);
console.log(`  Partner alive:       ${initialState.partnerAlive}`);
console.log();

// Advance 10 years to childhood stage
console.log('Advancing to age 10 (childhood)...');
for (let i = 0; i < 10; i++) {
  engine.nextYear();
}
console.log(`✓ Age: ${player.demographics.age}`);
console.log(`  Mental health:       ${player.health.mental?.current}`);
console.log(`  Physical health:     ${player.health.physical?.current}`);
console.log();

// Advance to age 18 (adult stage)
console.log('Advancing to age 18 (adult/employment stage)...');
while (player.demographics.age < 18 && player.alive) {
  engine.nextYear();
}
console.log(`✓ Age: ${player.demographics.age}`);
console.log(`  Employed:            ${player.economics?.income?.employmentStatus?.employed}`);
console.log(`  Employment status:   ${JSON.stringify(player.economics?.income?.employmentStatus)}`);
console.log(`  Job tenure:          ${player.economics?.income?.targetJobTenure}`);
console.log(`  Resources:           ${player.economics?.resources}`);
console.log(`  Debt:                ${player.economics?.debt}`);
console.log();

// Advance to marriage age
console.log('Advancing to age 25 (peak marriage age)...');
while (player.demographics.age < 25 && player.alive) {
  engine.nextYear();
}
console.log(`✓ Age: ${player.demographics.age}`);
console.log(`  Married:             ${player.relationships?.social?.married}`);
console.log(`  Partner alive:       ${player.relationships?.partner?.alive}`);
console.log(`  Partner since:       ${player.relationships?.partner?.since}`);
console.log(`  Children:            ${player.relationships?.children?.length}`);
console.log(`  Friends:             ${player.relationships?.social?.friends?.length}`);
console.log();

// Advance more to 35
console.log('Advancing to age 35 (family building stage)...');
while (player.demographics.age < 35 && player.alive) {
  engine.nextYear();
}
console.log(`✓ Age: ${player.demographics.age}`);
console.log(`  Married:             ${player.relationships?.social?.married}`);
console.log(`  Children:            ${player.relationships?.children?.length}`);
if (player.relationships?.children?.length > 0) {
  console.log(`  Child details:       ${player.relationships.children.map(c => `age ${c.age}, alive: ${c.alive}`).join('; ')}`);
}
console.log(`  Friends:             ${player.relationships?.social?.friends?.length}`);
console.log(`  Community:           ${player.relationships?.social?.community}`);
console.log(`  Job tenure:          ${player.economics?.income?.targetJobTenure}`);
console.log(`  Employment status:   ${player.economics?.income?.employmentStatus?.employed}`);
console.log();

// Advance to 50
console.log('Advancing to age 50 (mid-life)...');
while (player.demographics.age < 50 && player.alive) {
  engine.nextYear();
}
console.log(`✓ Age: ${player.demographics.age}`);
console.log(`  Alive:               ${player.alive}`);
if (!player.alive) {
  console.log(`  DIED: ${player.causeOfDeath}`);
} else {
  console.log(`  Marriages:           ${player.relationships?.social?.married ? 'married' : 'not married'}`);
  console.log(`  Children:            ${player.relationships?.children?.length}`);
  console.log(`  Friends:             ${player.relationships?.social?.friends?.length}`);
  console.log(`  Mental health:       ${player.health.mental?.current}`);
  console.log(`  Resources:           ${player.economics?.resources}`);
  console.log(`  Debt:                ${player.economics?.debt}`);
  console.log(`  Employed:            ${player.economics?.income?.employmentStatus?.employed}`);
  console.log();

  // Advance full life
  console.log('Running full life to death...');
  let yearCount = 0;
  let marriages = 0;
  let maxChildren = 0;
  let maxFriends = 0;
  let jobTenureChanges = [];
  let lastTenure = player.economics?.income?.targetJobTenure;
  let unemploymentYears = 0;
  let lastEmployed = true;

  while (player.alive && player.demographics.age < 150) {
    // Track tenure changes
    if (player.economics?.income?.targetJobTenure !== lastTenure) {
      jobTenureChanges.push({
        age: player.demographics.age,
        newTenure: player.economics?.income?.targetJobTenure
      });
    }
    lastTenure = player.economics?.income?.targetJobTenure;

    // Track unemployment
    const shouldWork = player.demographics.age >= 18 && player.demographics.age < 65;
    const isEmployed = player.economics?.income?.employmentStatus?.employed === true;
    if (shouldWork && !isEmployed && lastEmployed) {
      unemploymentYears++;
    }
    lastEmployed = isEmployed && shouldWork;

    // Track marriages
    if (player.relationships?.social?.married && marriages === 0) {
      marriages++;
    }

    // Track relationships
    maxChildren = Math.max(maxChildren, player.relationships?.children?.length || 0);
    maxFriends = Math.max(maxFriends, player.relationships?.social?.friends?.length || 0);

    engine.nextYear();
    yearCount++;
  }

  console.log(`✓ Life complete at age ${player.demographics.age}`);
  console.log(`  Death cause:         ${player.causeOfDeath}`);
  console.log(`  Marriages:           ${marriages}`);
  console.log(`  Max children:        ${maxChildren}`);
  console.log(`  Max friends:         ${maxFriends}`);
  console.log(`  Job tenure changes:  ${jobTenureChanges.length}`);
  console.log(`  Unemployment years:  ${unemploymentYears}`);
  console.log(`  Final resources:     ${player.economics?.resources}`);
  console.log(`  Final debt:          ${player.economics?.debt}`);
  console.log();

  // Analysis
  console.log('='.repeat(90));
  console.log('INTEGRATION STATUS:'.padEnd(90));
  console.log('='.repeat(90));

  const issues = [];
  const working = [];

  if (marriages === 0) issues.push('❌ MARRIAGE SYSTEM: 0 marriages in full life');
  else working.push('✓ Marriage system working');

  if (maxChildren === 0) issues.push('❌ FERTILITY SYSTEM: 0 children born');
  else working.push('✓ Fertility system working');

  if (maxFriends === 0) issues.push('❌ SOCIAL SYSTEM: 0 friends in entire life');
  else working.push('✓ Social system working');

  if (jobTenureChanges.length === 0) issues.push('❌ EMPLOYMENT SYSTEM: 0 job changes in career');
  else working.push(`✓ Employment system working (${jobTenureChanges.length} changes)`);

  if (isNaN(player.economics?.resources)) issues.push('❌ ECONOMIC SYSTEM: Resources is NaN');
  else working.push('✓ Economic system working');

  console.log();
  working.forEach(w => console.log(w));
  console.log();
  issues.forEach(i => console.log(i));
}

console.log('\n' + '='.repeat(90) + '\n');
