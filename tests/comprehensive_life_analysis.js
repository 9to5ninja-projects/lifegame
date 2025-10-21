/**
 * COMPREHENSIVE LIFE SYSTEMS ANALYSIS
 * One detailed life trace showing ALL systems at key ages
 * to understand what combination of factors led to depression
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

console.log('\n' + '='.repeat(120));
console.log('COMPREHENSIVE LIFE SYSTEMS ANALYSIS - Western Europe'.padEnd(120));
console.log('='.repeat(120) + '\n');

const engine = new GameEngine(birthCards, familyCards, eventCards, deathCards);
const birthCard = birthCards.find(b => b.name === 'Western Europe');
engine.createPlayer(birthCard, familyCards[0]);
const player = engine.player;

console.log(`Created ${player.demographics.sex} player, Western Europe\n`);

function dumpFullState(label) {
  console.log(`\n${'═'.repeat(120)}`);
  console.log(`[Age ${player.demographics.age}] ${label}`.padEnd(120));
  console.log('═'.repeat(120));
  
  // FAMILY & EARLY LIFE
  console.log('\nFAMILY & BIRTH CIRCUMSTANCES:');
  console.log(`  Birth wealth level: ${player.demographics.birthWealth}`);
  console.log(`  Birth region: ${player.demographics.birthRegion}`);
  console.log(`  Family income: ${player.relationships.birthFamily?.income || 0}`);
  console.log(`  Family education: ${player.relationships.birthFamily?.education || 'N/A'}`);
  console.log(`  Siblings: ${player.relationships.siblings?.length || 0} (${player.relationships.siblings?.filter(s => s.alive).length || 0} alive)`);
  console.log(`  Parents alive: mother=${player.relationships.parents.mother.alive}, father=${player.relationships.parents.father.alive}`);
  
  // HOUSING & CIRCUMSTANCES
  console.log('\nHOUSING & LIVING CONDITIONS:');
  console.log(`  Housing quality: ${player.circumstances?.housing?.quality || 'N/A'}`);
  console.log(`  Housing security: ${player.circumstances?.housing?.security || 'N/A'}`);
  console.log(`  Neighborhood density: ${player.circumstances?.neighborhood?.density || 'N/A'}`);
  
  // ECONOMIC SITUATION
  console.log('\nECONOMIC SITUATION:');
  console.log(`  Resources current: ${player.economics.resources.current.toFixed(1)}`);
  console.log(`  Resources baseline: ${player.economics.resources.baseline.toFixed(1)}`);
  console.log(`  Resources drift: ${player.economics.resources.drift}`);
  console.log(`  Debt: ${player.economics.debt.toFixed(1)}`);
  console.log(`  Education budget (age 18): ${player.development.education.familyBudgetAtAge18 || 'N/A'}`);
  console.log(`  Family resources at independence: ${player.development.education.familyBudgetAtAge18 ? 'SET' : 'NOT SET'}`);
  
  // EMPLOYMENT
  console.log('\nEMPLOYMENT STATUS:');
  console.log(`  Employed: ${player.economics.income.employed}`);
  console.log(`  Income (monthly): ${player.economics.income.current.toFixed(1)}`);
  console.log(`  Career performance: ${player.economics.income.careerPerformance?.toFixed(2) || 'N/A'}`);
  console.log(`  Unemployment months: ${player.economics.income.unemploymentMonths || 0}`);
  console.log(`  Job tenure: ${player.economics.income.targetJobTenure?.toFixed(1) || 'N/A'}`);
  
  // EDUCATION
  console.log('\nEDUCATION STATUS:');
  console.log(`  Level: ${player.development.education.level}`);
  console.log(`  In school: ${player.development.education.inSchool}`);
  console.log(`  Education cost: ${player.development.education.cost?.toFixed(2) || 0}`);
  console.log(`  Literate: ${player.development.education.literate}`);
  if (player.development.education.level === 'tertiary_bachelor' || player.development.education.level === 'tertiary') {
    console.log(`  University years completed: ${player.development.education.universityYears || 0}`);
  }
  
  // RELATIONSHIPS
  console.log('\nRELATIONSHIPS:');
  console.log(`  Partner exists: ${player.relationships.partner.exists}`);
  if (player.relationships.partner.exists) {
    console.log(`    Since age: ${player.relationships.partner.since}`);
    console.log(`    Married: ${player.relationships.social.married}`);
    console.log(`    Relationship strength: ${player.relationships.partner.relationship?.toFixed(1) || 'N/A'}`);
  }
  console.log(`  Children: ${player.relationships.children?.length || 0}`);
  console.log(`  Friends: ${player.relationships.social.friends}`);
  console.log(`  Community: ${player.relationships.social.community}`);
  console.log(`  Isolated: ${player.relationships.social.isolation || false}`);
  
  // PHYSICAL HEALTH
  console.log('\nPHYSICAL HEALTH:');
  console.log(`  Current: ${player.health.physical.current?.toFixed(1) || 'N/A'}`);
  console.log(`  Baseline: ${player.health.physical.baseline?.toFixed(1) || 'N/A'}`);
  console.log(`  Chronic conditions: ${player.health.physical.chronic?.length || 0}`);
  if (player.health.physical.chronic?.length > 0) {
    console.log(`    - ${player.health.physical.chronic.map(c => c.type || c).join(', ')}`);
  }
  console.log(`  Disabilities: ${player.health.physical.disabilities?.length || 0}`);
  
  // MENTAL HEALTH
  console.log('\nMENTAL HEALTH:');
  console.log(`  Current: ${player.health.mental.current?.toFixed(1) || 'N/A'}`);
  console.log(`  Baseline: ${player.health.mental.baseline?.toFixed(1) || 'N/A'}`);
  console.log(`  Episode duration: ${player.health.mental.episodeDuration || 0} months`);
  console.log(`  Chronic: ${player.health.mental.chronic?.join(', ') || 'none'}`);
  console.log(`  Treatment status: ${player.health.mental.treatmentStatus || 'none'}`);
  console.log(`  Suicide risk: ${player.health.mental.suicideRisk?.toFixed(2) || 'N/A'}`);
  
  // STRESS FACTORS
  console.log('\nSTRESS CONTRIBUTORS (age-relevant):');
  if (player.demographics.age >= 18 && !player.economics.income.employed && player.relationships.social.friends <= 1) {
    console.log(`  ⚠️  TRIPLE STRESS: Unemployed + isolated + early adulthood`);
  }
  if (player.economics.resources.current < player.economics.resources.baseline * 0.5) {
    console.log(`  ⚠️  Poverty stress: Resources < 50% of baseline (${player.economics.resources.current.toFixed(1)} < ${(player.economics.resources.baseline * 0.5).toFixed(1)})`);
  }
  if (player.economics.income.unemploymentMonths > 6) {
    console.log(`  ⚠️  Long-term unemployment: ${player.economics.income.unemploymentMonths} months`);
  }
  if (player.development.education.inSchool && player.economics.resources.current < 5) {
    console.log(`  ⚠️  In school with severe financial stress`);
  }
  if (player.relationships.social.friends === 0) {
    console.log(`  ⚠️  Complete social isolation (0 friends)`);
  }
  
  // LIFE SATISFACTION COMPOSITE
  console.log('\nLIFE QUALITY COMPOSITE:');
  const scores = {
    economic: Math.min(10, Math.max(1, player.economics.resources.current / 10)),
    social: Math.min(10, Math.max(1, (player.relationships.social.friends + player.relationships.social.community / 20) / 2)),
    health: (player.health.physical.current + player.health.mental.current) / 20,
    relationships: player.relationships.partner.exists ? 8 : 5,
    employment: player.economics.income.employed ? 7 : 3
  };
  
  const avgScore = Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length;
  console.log(`  Economic (${scores.economic.toFixed(1)}/10): ${player.economics.resources.current.toFixed(1)} resources`);
  console.log(`  Social (${scores.social.toFixed(1)}/10): ${player.relationships.social.friends} friends, community ${player.relationships.social.community}`);
  console.log(`  Physical health (${(scores.health).toFixed(1)}/10): ${player.health.physical.current?.toFixed(1) || 'N/A'}`);
  console.log(`  Mental health baseline (${player.health.mental.current?.toFixed(1)}/100): ${player.health.mental.current?.toFixed(1) || 'N/A'}`);
  console.log(`  Relationships (${scores.relationships.toFixed(1)}/10): ${player.relationships.partner.exists ? 'partnered' : 'single'}`);
  console.log(`  Employment (${scores.employment.toFixed(1)}/10): ${player.economics.income.employed ? 'employed' : 'unemployed'}`);
  console.log(`  ► OVERALL QUALITY OF LIFE: ${avgScore.toFixed(1)}/10`);
}

// Key ages to analyze
const milestones = [0, 5, 12, 16, 18, 19, 20, 21, 22, 23, 24, 25, 28, 30];
let nextIdx = 0;

console.log(`Starting analysis loop. Player age: ${player.demographics.age}`);
console.log(`Player health structure:`, Object.keys(player.health || {}));
console.log(`Player alive property: ${player.demographics.alive}`);
console.log(`Player vitals:`, player.health?.vital);
console.log(`Player death property:`, player.demographics.causeOfDeath);

while (player.demographics.age <= 30 && player.demographics.alive !== false) {
  if (nextIdx < milestones.length && player.demographics.age === milestones[nextIdx]) {
    let label = '';
    if (player.demographics.age === 0) label = 'BIRTH - Starting conditions';
    else if (player.demographics.age === 5) label = 'EARLY CHILDHOOD - Family dependency begins';
    else if (player.demographics.age === 12) label = 'PRE-ADOLESCENCE - School age';
    else if (player.demographics.age === 16) label = 'ADOLESCENCE - Potential secondary school exit';
    else if (player.demographics.age === 18) label = 'ADULTHOOD THRESHOLD - University decision point';
    else if (player.demographics.age === 19) label = 'Age 19 - First year post-secondary (if attending)';
    else if (player.demographics.age === 20) label = 'Age 20 - University/work year 2-3';
    else if (player.demographics.age === 22) label = 'Age 22 - University graduation window or workforce entry';
    else if (player.demographics.age === 25) label = 'Age 25 - Early career/independence established';
    else if (player.demographics.age === 30) label = 'Age 30 - Mid-career/established adult';
    
    dumpFullState(label);
    nextIdx++;
  }
  
  engine.nextYear();
}

console.log('\n' + '═'.repeat(120));
console.log('END OF ANALYSIS'.padEnd(120));
console.log('═'.repeat(120));
