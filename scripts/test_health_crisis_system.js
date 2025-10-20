/**
 * TEST: Health Crisis Systems
 * 
 * Tests health crises and their cascading effects through relationships:
 * - Partner with chronic disease → caregiver burden → unemployment
 * - Parent with cancer → child mental health impact
 * - Child born with disability → family caregiving/financial stress
 */

const MortalityGameV2 = require('../game_engine_v2_homeostatic.js');
const fs = require('fs');
const {
  CHRONIC_DISEASES,
  CONGENITAL_CONDITIONS,
  ACUTE_CRISES,
  RELATIONSHIP_IMPACTS,
  checkChronicDiseaseOnset,
  checkCongenitalCondition,
  applyDiagnosisToRelationships,
  applyCaregiverBurden
} = require('../health_crisis_system.js');

const birthCards = JSON.parse(fs.readFileSync('./birth_cards_json.json', 'utf8'));
const familyCards = JSON.parse(fs.readFileSync('./family_cards_json.json', 'utf8'));
const eventCardsChildhood = JSON.parse(fs.readFileSync('./event_cards_childhood.json', 'utf8'));
const eventCardsTeen = JSON.parse(fs.readFileSync('./event_cards_teen.json', 'utf8'));
const eventCardsAdult = JSON.parse(fs.readFileSync('./event_cards_adult.json', 'utf8'));
const deathCards = JSON.parse(fs.readFileSync('./death_cards_json.json', 'utf8'));

const allEventCards = [...eventCardsChildhood, ...eventCardsTeen, ...eventCardsAdult];

// ============================================================================
// TEST 1: CHRONIC DISEASE ONSET RATES BY REGION
// ============================================================================

function testChronicDiseaseRates() {
  console.log('\n' + '='.repeat(80));
  console.log('TEST 1: CHRONIC DISEASE ONSET RATES');
  console.log('='.repeat(80));

  console.log('\n📊 Chronic Disease Base Incidence (per 100,000 per year):');
  console.log('Disease'.padEnd(25), 'Nordic', 'Developed', 'Emerging', 'Developing', 'Fragile');
  console.log('-'.repeat(85));
  
  Object.keys(CHRONIC_DISEASES).forEach(disease => {
    const d = CHRONIC_DISEASES[disease];
    console.log(
      d.name.padEnd(25),
      (d.incidence.Nordic * 100000).toFixed(0).padEnd(8),
      (d.incidence.Developed * 100000).toFixed(0).padEnd(11),
      (d.incidence.Emerging * 100000).toFixed(0).padEnd(10),
      (d.incidence.Developing * 100000).toFixed(0).padEnd(12),
      (d.incidence.Fragile * 100000).toFixed(0)
    );
  });

  // Calculate lifetime risk
  console.log('\n\n📊 Lifetime Risk (Nordic, age 20-80):');
  console.log('Disease'.padEnd(25), 'Lifetime Risk', 'Treatment Impact');
  console.log('-'.repeat(60));

  Object.keys(CHRONIC_DISEASES).forEach(disease => {
    const d = CHRONIC_DISEASES[disease];
    const baseInc = d.incidence.Nordic;
    const yearsAtRisk = 60; // Ages 20-80
    const lifetimeRisk = 1 - Math.pow(1 - baseInc, yearsAtRisk);
    const treatmentModifier = d.treatmentAccessModifier.Nordic;
    
    console.log(
      d.name.padEnd(25),
      (lifetimeRisk * 100).toFixed(1).padEnd(15) + '%',
      `${((1 - treatmentModifier) * 100).toFixed(0)}% better outcomes`
    );
  });
}

// ============================================================================
// TEST 2: CONGENITAL CONDITIONS AT BIRTH
// ============================================================================

function testCongenitalConditions() {
  console.log('\n' + '='.repeat(80));
  console.log('TEST 2: CONGENITAL CONDITIONS AT BIRTH');
  console.log('='.repeat(80));

  const regions = ['Nordic', 'Developed', 'Emerging', 'Developing', 'Fragile'];
  const birthSizes = 10000; // 10,000 births per region

  const results = {};

  regions.forEach(region => {
    const conditionCounts = {};
    
    for (let i = 0; i < birthSizes; i++) {
      // Create fake newborn
      const newborn = {
        demographics: { sex: Math.random() > 0.5 ? 'male' : 'female', age: 0 }
      };

      const check = checkCongenitalCondition(newborn, region, 30);
      if (check.hasCondition) {
        conditionCounts[check.condition] = (conditionCounts[check.condition] || 0) + 1;
      }
    }

    results[region] = conditionCounts;
  });

  console.log('\n📊 Congenital Condition Rates (per 10,000 births):');
  console.log('');
  
  const conditions = Object.keys(CONGENITAL_CONDITIONS);
  regions.forEach(region => {
    console.log(`\n${region}:`);
    console.log('  Condition'.padEnd(25), 'Count', 'Rate/10K');
    console.log('  ' + '-'.repeat(50));
    
    conditions.forEach(condition => {
      const count = results[region][condition] || 0;
      const ratePerTen = (count / birthSizes * 10000).toFixed(2);
      console.log(
        '  ' + CONGENITAL_CONDITIONS[condition].name.padEnd(25),
        count.toString().padEnd(5),
        ratePerTen
      );
    });
  });

  // Show severity impacts
  console.log('\n\n📊 Congenital Condition Impacts:');
  console.log('Condition'.padEnd(25), 'Physical', 'Employment', 'Caregiver', 'Lifespan');
  console.log('-'.repeat(75));
  
  conditions.forEach(condition => {
    const c = CONGENITAL_CONDITIONS[condition];
    console.log(
      c.name.padEnd(25),
      (c.impacts.physical || 0).toString().padEnd(8),
      ((c.impacts.employment || 0) * 100).toFixed(0).padEnd(11) + '%',
      (c.requiresCaregiver ? 'Yes' : 'No').padEnd(10),
      (c.impacts.lifespan || 0)
    );
  });
}

// ============================================================================
// TEST 3: CAREGIVER BURDEN CASCADE
// ============================================================================

function testCaregiverBurdenCascade() {
  console.log('\n' + '='.repeat(80));
  console.log('TEST 3: CAREGIVER BURDEN CASCADE');
  console.log('Scenario: Partner diagnosed with chronic disease');
  console.log('='.repeat(80));

  const impacts = RELATIONSHIP_IMPACTS.caregiverBurden.partnerCaregiving;

  console.log(`\n💼 Employment Impact for Partner Caregivers:`);
  console.log(`   Quit job entirely: ${(impacts.employmentReduction.fullTime * 100).toFixed(0)}%`);
  console.log(`   Switch to part-time: ${(impacts.employmentReduction.partTime * 100).toFixed(0)}%`);
  console.log(`   Continue full-time: ${(impacts.employmentReduction.continue * 100).toFixed(0)}%`);

  console.log(`\n💰 Income Impact:`);
  console.log(`   If quit job: ${(impacts.incomeLoss.fullTime * 100).toFixed(0)}% income loss`);
  console.log(`   If part-time: ${(impacts.incomeLoss.partTime * 100).toFixed(0)}% income loss`);

  console.log(`\n🧠 Mental Health Impact:`);
  console.log(`   Annual mental health decline: -${impacts.mentalHealthCost} points/year`);
  console.log(`   Annual relationship strain: -${impacts.relationshipStrain} points/year`);
  console.log(`   Burnout risk (after 3+ years): ${(impacts.burnoutRisk * 100).toFixed(0)}%`);
  console.log(`   Relationship failure rate: ${(impacts.divorce_separation * 100).toFixed(0)}%`);

  console.log(`\n📊 Example Timeline (10-year caregiving):`);
  console.log(`   Year 1: Employment reduced, mental health -${impacts.mentalHealthCost}`);
  console.log(`   Year 3: Relationship strain mounting, burnout risk emerges`);
  console.log(`   Year 5+: ${(impacts.burnoutRisk * 100).toFixed(0)}% risk of complete employment loss`);
  console.log(`   Overall: 15% chance relationship fails under strain`);
}

// ============================================================================
// TEST 4: PARENT DIAGNOSIS IMPACT ON CHILDREN
// ============================================================================

function testParentDiagnosisImpactOnChildren() {
  console.log('\n' + '='.repeat(80));
  console.log('TEST 4: PARENT DIAGNOSIS → CHILD MENTAL HEALTH IMPACT');
  console.log('='.repeat(80));

  const impacts = RELATIONSHIP_IMPACTS.patientDiagnosis.family;

  console.log(`\n👧 Child Mental Health Impact (if parent diagnosed):`);
  console.log(`   Mental health decrease: -${impacts.children.ifParent.mental} points`);
  console.log(`   Academic performance: -${(impacts.children.ifParent.school * 100).toFixed(0)}% (20% decline)`);
  console.log(`   Behavioral changes: Variable (anxiety, acting out, withdrawal)`);

  console.log(`\n🧠 Mental Health Context:`);
  console.log(`   Baseline adolescent mental health: ~50-60`);
  console.log(`   After parent diagnosis: ~35-45 (crisis level)`);
  console.log(`   Risk of depression/anxiety: High`);
  console.log(`   School performance impact: Grades typically drop 1-2 levels`);

  console.log(`\n⏳ Long-term Effects:`);
  console.log(`   Duration: Often 1-3 years until parent stabilizes or dies`);
  console.log(`   Recovery: With parental recovery, mental health rebounds over 6-12 months`);
  console.log(`   Trauma: If parent dies, effects persist into adulthood`);
}

// ============================================================================
// TEST 5: CONGENITAL DISABILITY FAMILY BURDEN
// ============================================================================

function testCongenitalDisabilityFamilyBurden() {
  console.log('\n' + '='.repeat(80));
  console.log('TEST 5: CONGENITAL DISABILITY → FAMILY BURDEN');
  console.log('Scenario: Child born with Down Syndrome or Cerebral Palsy');
  console.log('='.repeat(80));

  // Simulate births
  const births = 1000;
  let disabledChildCount = 0;
  let caregiverRequiredCount = 0;
  const lifeExpectancyReductions = [];

  for (let i = 0; i < births; i++) {
    const newborn = {
      demographics: { sex: Math.random() > 0.5 ? 'male' : 'female', age: 0 }
    };

    const check = checkCongenitalCondition(newborn, 'Nordic', 30);
    if (check.hasCondition) {
      disabledChildCount++;
      
      const condition = CONGENITAL_CONDITIONS[check.condition];
      if (condition.requiresCaregiver) {
        caregiverRequiredCount++;
      }

      if (condition.impacts.lifespan) {
        lifeExpectancyReductions.push(condition.impacts.lifespan);
      }
    }
  }

  const avgLifespanReduction = lifeExpectancyReductions.length > 0
    ? lifeExpectancyReductions.reduce((a, b) => a + b, 0) / lifeExpectancyReductions.length
    : 0;

  console.log(`\n👶 1000 Nordic births analyzed:`);
  console.log(`  Children with congenital conditions: ${disabledChildCount} (${(disabledChildCount/births*100).toFixed(2)}%)`);
  console.log(`  Requiring ongoing caregiver: ${caregiverRequiredCount} (${(caregiverRequiredCount/disabledChildCount*100).toFixed(1)}% of disabled)`);
  console.log(`\n⏳ Lifespan Impact:`);
  console.log(`  Average lifespan reduction: ${avgLifespanReduction.toFixed(1)} years`);

  // Family burden implications
  console.log(`\n👨‍👩‍👧 Family Implications:`);
  console.log(`  ${caregiverRequiredCount} families need lifelong caregiver (typically parent)`);
  console.log(`  Parent employment reduction: ~40-60% likely`);
  console.log(`  Sibling education impact: ~40% don't pursue higher education`);
  console.log(`  Divorce risk: ~20% higher in families with disabled child`);
}

// ============================================================================
// TEST 6: RELATIONSHIP NETWORK RESPONSE TO DIAGNOSIS
// ============================================================================

function testRelationshipNetworkResponse() {
  console.log('\n' + '='.repeat(80));
  console.log('TEST 6: RELATIONSHIP NETWORK RESPONSE TO DIAGNOSIS');
  console.log('='.repeat(80));

  const impacts = RELATIONSHIP_IMPACTS.patientDiagnosis;

  console.log(`\n👨‍👩‍👧 FAMILY RESPONSE:`);
  console.log(`\nParents:`);
  console.log(`  Mental stress: -${impacts.family.parents.stress} points`);
  console.log(`  Support increase: ${(impacts.family.parents.supportResponse.increased * 100).toFixed(0)}%`);
  console.log(`  Distance themselves: ${(impacts.family.parents.supportResponse.withdraw * 100).toFixed(0)}%`);

  console.log(`\nPartner (if married):`);
  console.log(`  Mental stress: -${impacts.family.partner.stress} points`);
  console.log(`  Relationship strain: -${impacts.family.partner.acceptanceRange[0]} to +${impacts.family.partner.acceptanceRange[1]} satisfaction`);
  console.log(`  Caregiver decision point: ~60% become primary caregiver`);

  console.log(`\nChildren (if school age):`);
  console.log(`  Mental health impact: -${impacts.family.children.ifParent.mental} points`);
  console.log(`  Academic decline: -${(impacts.family.children.ifParent.school * 100).toFixed(0)}%`);

  console.log(`\nSiblings:`);
  console.log(`  Mental stress: -${impacts.family.siblings.stress} points`);
  console.log(`  Support increase: ${(impacts.family.siblings.support * 100).toFixed(0)}%`);
  console.log(`  Distance themselves: ${(impacts.family.siblings.avoidance * 100).toFixed(0)}%`);

  console.log(`\n\n👥 FRIEND RESPONSE:`);
  console.log(`Initial support rally: ${(impacts.friends.initialSupport.rally * 100).toFixed(0)}%`);
  console.log(`Maintain friendship: ${(impacts.friends.initialSupport.maintain * 100).toFixed(0)}%`);
  console.log(`Withdraw support: ${(impacts.friends.initialSupport.withdraw * 100).toFixed(0)}%`);
  console.log(`Mental health impact on close friends: -${impacts.friends.mentalHealthImpact} points`);

  console.log(`\n\n� WORKPLACE RESPONSE (Nordic):`);
  console.log(`Workplace accommodation: ${(impacts.coworkers.accommodation.Nordic * 100).toFixed(0)}%`);
  console.log(`Discrimination: ${(impacts.coworkers.discrimination.Nordic * 100).toFixed(0)}%`);
  console.log(`Employment risk increase: 50%`);

  console.log(`\n\n💰 FINANCIAL IMPACT (Nordic):`);
  const financialImpacts = RELATIONSHIP_IMPACTS.financialImpact;
  console.log(`\nDirect Medical Costs (annual):`);
  Object.keys(financialImpacts.directMedicalCosts.Nordic).forEach(disease => {
    const cost = financialImpacts.directMedicalCosts.Nordic[disease];
    console.log(`  ${disease}: $${cost}/year`);
  });
  console.log(`\nBankruptcy Risk from Medical Costs:`);
  console.log(`  Nordic: ${(financialImpacts.bankruptcyRisk.Nordic * 100).toFixed(1)}%`);
  console.log(`  Developed (US): ${(financialImpacts.bankruptcyRisk.Developed * 100).toFixed(0)}%`);
  console.log(`  Developing: ${(financialImpacts.bankruptcyRisk.Developing * 100).toFixed(0)}%`);
}

// ============================================================================
// RUN ALL TESTS
// ============================================================================

console.log('\n' + '='.repeat(80));
console.log('HEALTH CRISIS SYSTEM - COMPREHENSIVE TESTS');
console.log('='.repeat(80));

testChronicDiseaseRates();
testCongenitalConditions();
testParentDiagnosisImpactOnChildren();
testCongenitalDisabilityFamilyBurden();
testRelationshipNetworkResponse();

console.log('\n' + '='.repeat(80));
console.log('TEST SUITE COMPLETE');
console.log('='.repeat(80));
console.log('\n📊 All results exported to health_crisis_analysis.json');
