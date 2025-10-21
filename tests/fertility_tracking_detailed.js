/**
 * FERTILITY TRACKING TEST
 * Debug why fertility appears to be 0 now
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
const results = [];

console.log(`\n=== FERTILITY TRACKING TEST: ${NUM_LIVES} lives ===\n`);

for (let lifeNum = 0; lifeNum < NUM_LIVES; lifeNum++) {
  const engine = new GameEngine(birthCards, familyCards, eventCards, deathCards);
  engine.createPlayer(birthCards.find(b => b.name === 'Western Europe'), familyCards[0]);
  const player = engine.player;
  
  let lifeData = {
    lifeNumber: lifeNum + 1,
    ages: [],
    married: false,
    marriageAge: null,
    children: 0,
    childrenBirthAges: [],
    fertileStatus: [],
    chronicDiseases: [],
    deathAge: null
  };
  
  // Run full life
  while (player.alive && player.demographics.age < 150) {
    const age = player.demographics.age;
    
    // Track fertility status each year
    const isFertile = player.health.reproductive?.fertile !== false;
    const hasDisease = (player.health.chronic?.active?.length || 0) > 0;
    
    lifeData.ages.push(age);
    lifeData.fertileStatus.push({
      age,
      fertile: isFertile,
      diseaseCount: player.health.chronic?.active?.length || 0,
      married: player.relationships.social.married,
      children: player.relationships.children?.length || 0
    });
    
    // Track when married
    if (player.relationships.social.married && !lifeData.married) {
      lifeData.married = true;
      lifeData.marriageAge = age;
    }
    
    // Track children
    const childCount = player.relationships.children?.length || 0;
    if (childCount > lifeData.children) {
      lifeData.childrenBirthAges.push({
        age,
        newTotal: childCount
      });
      lifeData.children = childCount;
    }
    
    // Track diseases
    if (player.health.chronic?.active?.length > 0 && age <= 40) {
      player.health.chronic.active.forEach(d => {
        if (!lifeData.chronicDiseases.find(x => x.disease === d.disease)) {
          lifeData.chronicDiseases.push({
            age,
            disease: d.disease
          });
        }
      });
    }
    
    engine.nextYear();
  }
  
  lifeData.deathAge = player.demographics.age;
  
  results.push(lifeData);
  
  process.stdout.write(`\r[${lifeNum + 1}/${NUM_LIVES}] Age: ${player.demographics.age}, Married: ${lifeData.married}, Children: ${lifeData.children}`);
}

console.log('\n');

// Print results
console.log('='.repeat(120));
console.log('FERTILITY TRACKING DETAILS');
console.log('='.repeat(120) + '\n');

results.forEach((r, i) => {
  console.log(`\nLife ${r.lifeNumber}: Age ${r.deathAge}, Married: ${r.married ? `YES (age ${r.marriageAge})` : 'NO'}, Children: ${r.children}`);
  
  if (r.chronicDiseases.length > 0) {
    console.log(`  Early diseases (age 20-40):`);
    r.chronicDiseases.forEach(d => {
      console.log(`    └─ Age ${d.age}: ${d.disease}`);
    });
  }
  
  if (r.childrenBirthAges.length > 0) {
    console.log(`  Children born:`);
    r.childrenBirthAges.forEach(c => {
      console.log(`    └─ Age ${c.age}: child #${c.newTotal}`);
    });
  }
  
  // Find married but infertile phase
  if (r.married && r.children === 0) {
    console.log(`  ISSUE: Married age ${r.marriageAge} but no children`);
    // Find when they became infertile
    let fertileAfterMarriage = r.fertileStatus.filter(f => f.age >= r.marriageAge && f.age <= 45);
    let hadFertilePeriod = fertileAfterMarriage.some(f => f.fertile);
    if (!hadFertilePeriod) {
      console.log(`    └─ Was NEVER fertile during reproductive years after marriage`);
    } else {
      console.log(`    └─ Had fertile periods but no births (bad luck or tracking issue)`);
    }
  }
});

console.log('\n' + '='.repeat(120));

// Summary
const totalMarried = results.filter(r => r.married).length;
const totalChildren = results.reduce((sum, r) => sum + r.children, 0);
const avgChildrenIfMarried = totalChildren / (totalMarried || 1);

console.log(`\nSUMMARY:`);
console.log(`  Lives: ${NUM_LIVES}`);
console.log(`  Married: ${totalMarried} (${(totalMarried / NUM_LIVES * 100).toFixed(0)}%)`);
console.log(`  Total children: ${totalChildren} (${(totalChildren / NUM_LIVES).toFixed(2)} per life)`);
console.log(`  Children per marriage: ${avgChildrenIfMarried.toFixed(2)}`);
console.log('='.repeat(120));
