/**
 * COMPREHENSIVE REGION TEST
 * 
 * Tests ONE region in depth with COMPLETE data tracking:
 * - Birth family structure
 * - Marriage and divorce events
 * - Children born (names, ages, relationships)
 * - Employment history (all job changes with ages)
 * - Income tracking
 * - All health events
 * - Complete life timeline
 * 
 * Purpose: Create ONE known, well-documented reference region
 * Usage: node comprehensive_region_test.js [numLives] [region]
 * Example: node comprehensive_region_test.js 5 "Western Europe"
 */

const path = require('path');
const fs = require('fs');

// Go up to root to load engine
const rootDir = path.join(__dirname, '..');
const GameEngine = require(path.join(rootDir, 'game_engine_integrated.js'));

// Load cards from data/ directory
const birthCards = JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'birth_cards_json.json'), 'utf8'));
const familyCards = JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'family_cards_json.json'), 'utf8'));
const eventCardsData = {
  childhood: JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'event_cards_childhood.json'), 'utf8')),
  teen: JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'event_cards_teen.json'), 'utf8')),
  adult: JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'event_cards_adult.json'), 'utf8'))
};
// Flatten event cards into single array
const eventCards = [...eventCardsData.childhood, ...eventCardsData.teen, ...eventCardsData.adult];
const deathCards = JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'death_cards_json.json'), 'utf8'));

// Configuration
const NUM_LIVES = parseInt(process.argv[2]) || 5;
const TARGET_REGION = process.argv[3] || "Western Europe";

console.log(`\n${'='.repeat(80)}`);
console.log(`COMPREHENSIVE REGION TEST: ${TARGET_REGION} (${NUM_LIVES} lives)`);
console.log(`${'='.repeat(80)}\n`);

// ============================================================================
// LIFE TRACKER CLASS
// ============================================================================

class LifeTracker {
  constructor(lifeNumber, birthCard, familyCard) {
    this.lifeNumber = lifeNumber;
    this.birthCard = birthCard;
    this.familyCard = familyCard;
    
    // Timeline of all events
    this.events = [];
    
    // Family data
    this.birthFamily = {
      structure: familyCard.name,
      motherAlive: false,
      fatherAlive: false,
      siblings: 0,
    };
    
    // Marriage/partnership history
    this.relationships = [];
    
    // Children born
    this.childrenBorn = [];
    
    // Employment history
    this.employmentHistory = [];
    
    // Health events
    this.healthEvents = [];
    
    // Death info
    this.deathAge = null;
    this.deathCause = null;
    this.yearsVsExpectancy = null;
  }
  
  recordEvent(age, type, description, data = {}) {
    this.events.push({
      age: age,
      type: type,
      description: description,
      data: data
    });
  }
  
  recordEmploymentChange(age, status, income) {
    this.employmentHistory.push({
      age: age,
      status: status,
      income: income
    });
  }
  
  recordRelationshipChange(age, type, status, partner = null) {
    this.relationships.push({
      age: age,
      type: type,
      status: status,
      partner: partner
    });
  }
  
  recordChild(age, childNumber) {
    this.childrenBorn.push({
      born_age: age,
      child_number: childNumber,
      age_now: 0  // Will update as they age
    });
  }
  
  recordHealth(age, condition, severity) {
    this.healthEvents.push({
      age: age,
      condition: condition,
      severity: severity
    });
  }
  
  getFamilyStructureText() {
    let text = `${this.birthFamily.structure}`;
    if (this.birthFamily.siblings > 0) {
      text += ` (${this.birthFamily.siblings} sibling${this.birthFamily.siblings > 1 ? 's' : ''})`;
    }
    return text;
  }
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

const allLives = [];
const stats = {
  totalDeaths: 0,
  avgAge: 0,
  minAge: 999,
  maxAge: 0,
  marriageCount: 0,
  divorceCount: 0,
  totalChildren: 0,
  employmentRateAtAge30: 0,
  healthCrisesTotal: 0
};

function runLife(lifeNumber) {
  // Find matching birth card
  const selectedBirthCard = birthCards.find(b => b.name === TARGET_REGION);
  if (!selectedBirthCard) {
    console.error(`Region "${TARGET_REGION}" not found!`);
    console.log(`Available regions: ${birthCards.map(b => b.name).join(', ')}`);
    process.exit(1);
  }
  
  // Pick random family card (or specific if needed)
  const selectedFamilyCard = familyCards[Math.floor(Math.random() * familyCards.length)];
  
  const engine = new GameEngine(birthCards, familyCards, eventCards, deathCards);
  const tracker = new LifeTracker(lifeNumber, selectedBirthCard, selectedFamilyCard);
  
  // Create player
  engine.createPlayer(selectedBirthCard, selectedFamilyCard);
  const player = engine.player;
  
  // Record birth family
  tracker.birthFamily.motherAlive = player.relationships.parents.mother.alive;
  tracker.birthFamily.fatherAlive = player.relationships.parents.father.alive;
  tracker.birthFamily.siblings = player.relationships.siblings?.length || 0;
  
  // Record birth info
  tracker.recordEvent(0, 'BIRTH', `Born into ${tracker.getFamilyStructureText()}`, {
    region: TARGET_REGION,
    initialHealth: player.health.physical.current,
    initialResources: player.economics.resources.current,
    birthFamilyIncome: player.relationships.birthFamily.income
  });
  
  // Store initial employment state
  let lastEmploymentStatus = player.economics.income.employed ? 'employed' : 'unemployed';
  let lastEmploymentIncome = player.economics.income.current;
  let lastEmploymentAge = 0;
  let totalChildrenBorn = 0;
  
  // Simulate life year by year
  let yearCount = 0;
  while (player.alive && player.age < 120) {
    yearCount++;
    const currentAge = player.age;
    
    // Track employment changes
    if (player.economics.income.employed !== (lastEmploymentStatus === 'employed')) {
      lastEmploymentStatus = player.economics.income.employed ? 'employed' : 'unemployed';
      tracker.recordEmploymentChange(
        currentAge,
        lastEmploymentStatus,
        player.economics.income.current
      );
    }
    
    // Track income changes if significant
    if (Math.abs(player.economics.income.current - lastEmploymentIncome) > 1) {
      lastEmploymentIncome = player.economics.income.current;
    }
    
    // Track marriage status changes
    if (player.relationships.social.married && !player.relationships.partner.markedMarried) {
      tracker.recordRelationshipChange(
        currentAge,
        'MARRIAGE',
        'married',
        `Partner since age ${player.relationships.partner.since}`
      );
      player.relationships.partner.markedMarried = true;
      stats.marriageCount++;
    }
    
    // Track children born
    const childrenCount = player.relationships.children?.length || 0;
    if (childrenCount > totalChildrenBorn) {
      tracker.recordChild(currentAge, childrenCount);
      totalChildrenBorn = childrenCount;
      stats.totalChildren++;
    }
    
    // Track health issues
    if (player.health.physical.current < 30) {
      if (!player.criticalHealthMarked) {
        tracker.recordHealth(currentAge, 'CRITICAL_HEALTH', player.health.physical.current);
        player.criticalHealthMarked = true;
      }
    }
    
    if (player.health.mental.current < 30) {
      if (!player.criticalMentalMarked) {
        tracker.recordHealth(currentAge, 'CRITICAL_MENTAL', player.health.mental.current);
        player.criticalMentalMarked = true;
      }
    }
    
    // Process next year
    engine.nextYear();
  }
  
  // Record death
  tracker.deathAge = player.age;
  tracker.deathCause = player.causeOfDeath || 'Unknown';
  tracker.yearsVsExpectancy = (player.age - selectedBirthCard.lifeExpectancy).toFixed(1);
  
  tracker.recordEvent(player.age, 'DEATH', `Died at age ${player.age} from ${tracker.deathCause}`, {
    finalHealth: player.health.physical.current,
    finalResources: player.economics.resources.current,
    yearsVsExpectancy: tracker.yearsVsExpectancy
  });
  
  // Update global stats
  stats.totalDeaths++;
  stats.avgAge += tracker.deathAge;
  stats.minAge = Math.min(stats.minAge, tracker.deathAge);
  stats.maxAge = Math.max(stats.maxAge, tracker.deathAge);
  stats.healthCrisesTotal += tracker.healthEvents.length;
  
  // Check employment at age 30
  if (tracker.employmentHistory.length > 0) {
    const age30Status = tracker.employmentHistory.find(e => e.age >= 30);
    if (age30Status?.status === 'employed') {
      stats.employmentRateAtAge30++;
    }
  }
  
  allLives.push(tracker);
  return tracker;
}

// ============================================================================
// RUN ALL LIVES
// ============================================================================

for (let i = 1; i <= NUM_LIVES; i++) {
  console.log(`\n[LIFE ${i}/${NUM_LIVES}]`);
  const tracker = runLife(i);
  console.log(`  Age: ${tracker.deathAge} | Cause: ${tracker.deathCause} | Years vs exp: ${tracker.yearsVsExpectancy}`);
  console.log(`  Marriages: ${tracker.relationships.length} | Children: ${tracker.childrenBorn.length} | Job changes: ${tracker.employmentHistory.length}`);
}

// ============================================================================
// SUMMARY REPORT
// ============================================================================

console.log(`\n${'='.repeat(80)}`);
console.log(`SUMMARY REPORT: ${TARGET_REGION} (${NUM_LIVES} lives)`);
console.log(`${'='.repeat(80)}\n`);

console.log('LONGEVITY:');
console.log(`  Average age: ${(stats.avgAge / NUM_LIVES).toFixed(1)}`);
console.log(`  Min age: ${stats.minAge}`);
console.log(`  Max age: ${stats.maxAge}`);
console.log(`  Expected: ${allLives[0]?.birthCard.lifeExpectancy || '?'} years`);

console.log('\nFAMILY DATA:');
console.log(`  Total marriages: ${stats.marriageCount}`);
console.log(`  Total children born: ${stats.totalChildren}`);
console.log(`  Avg children per life: ${(stats.totalChildren / NUM_LIVES).toFixed(1)}`);

console.log('\nEMPLOYMENT DATA:');
console.log(`  Employment rate at age 30+: ${stats.employmentRateAtAge30}/${NUM_LIVES} (${(stats.employmentRateAtAge30/NUM_LIVES*100).toFixed(0)}%)`);

console.log('\nHEALTH CRISES:');
console.log(`  Total health crises recorded: ${stats.healthCrisesTotal}`);
console.log(`  Average per life: ${(stats.healthCrisesTotal/NUM_LIVES).toFixed(1)}`);

// ============================================================================
// DETAILED OUTPUT FOR EACH LIFE
// ============================================================================

console.log(`\n${'='.repeat(80)}`);
console.log(`DETAILED LIFE REPORTS`);
console.log(`${'='.repeat(80)}`);

allLives.forEach((tracker, idx) => {
  console.log(`\n--- LIFE ${tracker.lifeNumber} ---`);
  console.log(`Birth Family: ${tracker.getFamilyStructureText()}`);
  console.log(`Age at Death: ${tracker.deathAge} (${tracker.yearsVsExpectancy > 0 ? '+' : ''}${tracker.yearsVsExpectancy} years vs expectancy)`);
  console.log(`Cause of Death: ${tracker.deathCause}`);
  
  if (tracker.employmentHistory.length > 0) {
    console.log(`\nEmployment History (${tracker.employmentHistory.length} changes):`);
    tracker.employmentHistory.forEach(emp => {
      console.log(`  Age ${emp.age}: ${emp.status === 'employed' ? '✓ EMPLOYED' : '✗ UNEMPLOYED'} (income: ${emp.income})`);
    });
  } else {
    console.log(`\nEmployment: No employment recorded during life`);
  }
  
  if (tracker.relationships.length > 0) {
    console.log(`\nRelationships (${tracker.relationships.length}):`);
    tracker.relationships.forEach(rel => {
      console.log(`  Age ${rel.age}: ${rel.type} - ${rel.status} ${rel.partner ? `(${rel.partner})` : ''}`);
    });
  } else {
    console.log(`\nRelationships: No partnerships recorded`);
  }
  
  if (tracker.childrenBorn.length > 0) {
    console.log(`\nChildren: ${tracker.childrenBorn.length} born`);
    tracker.childrenBorn.forEach(child => {
      console.log(`  Child #${child.child_number}: Born at parent age ${child.born_age}`);
    });
  } else {
    console.log(`\nChildren: None born`);
  }
  
  if (tracker.healthEvents.length > 0) {
    console.log(`\nHealth Crises: ${tracker.healthEvents.length}`);
    tracker.healthEvents.forEach(health => {
      console.log(`  Age ${health.age}: ${health.condition} (severity: ${health.severity})`);
    });
  }
});

// ============================================================================
// SAVE TO JSON
// ============================================================================

const jsonOutput = {
  region: TARGET_REGION,
  timestamp: new Date().toISOString(),
  numLives: NUM_LIVES,
  stats: stats,
  lives: allLives.map(tracker => ({
    lifeNumber: tracker.lifeNumber,
    birthFamily: tracker.birthFamily,
    deathAge: tracker.deathAge,
    deathCause: tracker.deathCause,
    yearsVsExpectancy: tracker.yearsVsExpectancy,
    marriages: tracker.relationships.length,
    children: tracker.childrenBorn.length,
    employmentChanges: tracker.employmentHistory.length,
    events: tracker.events.length
  }))
};

const outputFile = path.join(rootDir, 'analysis', `comprehensive_${TARGET_REGION.replace(/\s+/g, '_')}_${NUM_LIVES}lives.json`);
fs.writeFileSync(outputFile, JSON.stringify(jsonOutput, null, 2));

console.log(`\n✓ Results saved to: ${outputFile}\n`);

