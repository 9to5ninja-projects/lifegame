// MORTALITY LOTTERY - Simulation & Statistics Script
// Run this to validate game balance and compare to real-world data

import MortalityGame from './src/lib/game-engine.js';
import birthCards from './data/birth-cards.json' assert { type: 'json' };
import familyCards from './data/family-cards.json' assert { type: 'json' };
import eventCards from './data/event-cards-childhood.json' assert { type: 'json' };
import deathCards from './data/death-cards.json' assert { type: 'json' };

// CONFIGURATION
const SIMULATIONS = 10000; // Number of lives to simulate

// SIMULATION RESULTS
const results = {
  totalLives: 0,
  deathsByAge: {},
  deathsByCause: {},
  deathsByProfile: {},
  averageLifespan: 0,
  survivalRates: {
    age1: 0,
    age5: 0,
    age18: 0,
    age60: 0,
    age80: 0
  },
  birthDistribution: {},
  familyDistribution: {}
};

// RUN SIMULATIONS
console.log(`\n🎲 SIMULATING ${SIMULATIONS} LIVES...\n`);

for (let i = 0; i < SIMULATIONS; i++) {
  const game = new MortalityGame(birthCards, familyCards, eventCards, deathCards);
  game.createPlayer();

  // Track birth distribution
  const birthProfile = game.player.birthCards[0].name;
  results.birthDistribution[birthProfile] = (results.birthDistribution[birthProfile] || 0) + 1;

  const familyType = game.player.birthCards[1].name;
  results.familyDistribution[familyType] = (results.familyDistribution[familyType] || 0) + 1;

  const profileTags = game.player.profileTags;

  // Play through life
  while (game.player.alive && game.player.age < 100) {
    game.playYear();

    // Track survival rates at key ages
    if (game.player.alive) {
      if (game.player.age === 1) results.survivalRates.age1++;
      if (game.player.age === 5) results.survivalRates.age5++;
      if (game.player.age === 18) results.survivalRates.age18++;
      if (game.player.age === 60) results.survivalRates.age60++;
      if (game.player.age === 80) results.survivalRates.age80++;
    }
  }

  // Record death
  const deathAge = game.player.age;
  const cause = game.player.causeOfDeath?.name || 'Old Age';
  const profile = profileTags[0] || 'unknown';

  results.deathsByAge[deathAge] = (results.deathsByAge[deathAge] || 0) + 1;
  results.deathsByCause[cause] = (results.deathsByCause[cause] || 0) + 1;
  results.deathsByProfile[profile] = (results.deathsByProfile[profile] || 0) + 1;

  results.averageLifespan += deathAge;
  results.totalLives++;

  // Progress indicator
  if ((i + 1) % 1000 === 0) {
    console.log(`  Simulated ${i + 1} / ${SIMULATIONS} lives...`);
  }
}

// CALCULATE STATISTICS
results.averageLifespan /= results.totalLives;

Object.keys(results.survivalRates).forEach(key => {
  results.survivalRates[key] = (results.survivalRates[key] / results.totalLives * 100).toFixed(1);
});

// DISPLAY RESULTS
console.log('\n' + '='.repeat(60));
console.log('📊 SIMULATION RESULTS');
console.log('='.repeat(60));

console.log(`\nTotal Lives Simulated: ${results.totalLives}`);
console.log(`Average Lifespan: ${results.averageLifespan.toFixed(1)} years`);

console.log('\n--- SURVIVAL RATES BY AGE ---');
console.log(`Survive to Age 1:  ${results.survivalRates.age1}%`);
console.log(`Survive to Age 5:  ${results.survivalRates.age5}%`);
console.log(`Survive to Age 18: ${results.survivalRates.age18}%`);
console.log(`Survive to Age 60: ${results.survivalRates.age60}%`);
console.log(`Survive to Age 80: ${results.survivalRates.age80}%`);

console.log('\n--- BIRTH DISTRIBUTION (Top 10) ---');
const sortedBirths = Object.entries(results.birthDistribution)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10);

sortedBirths.forEach(([profile, count]) => {
  const percentage = (count / results.totalLives * 100).toFixed(1);
  console.log(`${profile.padEnd(35)} ${percentage.padStart(5)}% (${count})`);
});

console.log('\n--- FAMILY STRUCTURE DISTRIBUTION (Top 10) ---');
const sortedFamilies = Object.entries(results.familyDistribution)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10);

sortedFamilies.forEach(([family, count]) => {
  const percentage = (count / results.totalLives * 100).toFixed(1);
  console.log(`${family.padEnd(35)} ${percentage.padStart(5)}% (${count})`);
});

console.log('\n--- TOP 15 CAUSES OF DEATH ---');
const sortedCauses = Object.entries(results.deathsByCause)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 15);

sortedCauses.forEach(([cause, count]) => {
  const percentage = (count / results.totalLives * 100).toFixed(1);
  console.log(`${cause.padEnd(40)} ${percentage.padStart(5)}% (${count})`);
});

console.log('\n--- DEATHS BY PROFILE ---');
const sortedProfiles = Object.entries(results.deathsByProfile)
  .sort((a, b) => b[1] - a[1]);

sortedProfiles.forEach(([profile, count]) => {
  const percentage = (count / results.totalLives * 100).toFixed(1);
  console.log(`${profile.padEnd(25)} ${percentage.padStart(5)}% (${count})`);
});

console.log('\n--- AGE DISTRIBUTION AT DEATH ---');
const ageGroups = {
  'Infant (0-1)': 0,
  'Child (2-12)': 0,
  'Teen (13-18)': 0,
  'Young Adult (19-30)': 0,
  'Adult (31-60)': 0,
  'Elder (61-80)': 0,
  'Very Old (81+)': 0
};

Object.entries(results.deathsByAge).forEach(([age, count]) => {
  const ageNum = parseInt(age);
  if (ageNum <= 1) ageGroups['Infant (0-1)'] += count;
  else if (ageNum <= 12) ageGroups['Child (2-12)'] += count;
  else if (ageNum <= 18) ageGroups['Teen (13-18)'] += count;
  else if (ageNum <= 30) ageGroups['Young Adult (19-30)'] += count;
  else if (ageNum <= 60) ageGroups['Adult (31-60)'] += count;
  else if (ageNum <= 80) ageGroups['Elder (61-80)'] += count;
  else ageGroups['Very Old (81+)'] += count;
});

Object.entries(ageGroups).forEach(([group, count]) => {
  const percentage = (count / results.totalLives * 100).toFixed(1);
  console.log(`${group.padEnd(25)} ${percentage.padStart(5)}% (${count})`);
});

// REAL-WORLD COMPARISON
console.log('\n' + '='.repeat(60));
console.log('🌍 REAL-WORLD COMPARISON');
console.log('='.repeat(60));

const realWorld = {
  averageLifespan: 73, // Global average
  infantMortality: 2.8, // Global average deaths per 100 live births
  surviveToAge5: 96.2,
  surviveToAge60: 78,
  surviveToAge80: 25
};

console.log('\nGlobal Averages (Real World):');
console.log(`Average Lifespan: ${realWorld.averageLifespan} years`);
console.log(`Infant Mortality: ${realWorld.infantMortality}% (die before age 1)`);
console.log(`Survive to Age 5: ${realWorld.surviveToAge5}%`);
console.log(`Survive to Age 60: ${realWorld.surviveToAge60}%`);
console.log(`Survive to Age 80: ${realWorld.surviveToAge80}%`);

console.log('\nSimulation vs. Real World:');
console.log(`Lifespan: ${results.averageLifespan.toFixed(1)} vs ${realWorld.averageLifespan} (${(results.averageLifespan - realWorld.averageLifespan).toFixed(1)} difference)`);
console.log(`Infant Survival: ${results.survivalRates.age1}% vs ${100 - realWorld.infantMortality}%`);
console.log(`Age 5 Survival: ${results.survivalRates.age5}% vs ${realWorld.surviveToAge5}%`);
console.log(`Age 60 Survival: ${results.survivalRates.age60}% vs ${realWorld.surviveToAge60}%`);
console.log(`Age 80 Survival: ${results.survivalRates.age80}% vs ${realWorld.surviveToAge80}%`);

// BALANCE RECOMMENDATIONS
console.log('\n' + '='.repeat(60));
console.log('⚖️  BALANCE RECOMMENDATIONS');
console.log('='.repeat(60));

const recommendations = [];

if (Math.abs(results.averageLifespan - realWorld.averageLifespan) > 5) {
  const direction = results.averageLifespan > realWorld.averageLifespan ? 'TOO HIGH' : 'TOO LOW';
  recommendations.push(`⚠️  Average lifespan is ${direction} (${results.averageLifespan.toFixed(1)} vs ${realWorld.averageLifespan})`);
  if (direction === 'TOO HIGH') {
    recommendations.push('   → Increase event severity or death check frequency');
  } else {
    recommendations.push('   → Decrease starting survival numbers or reduce positive event impacts');
  }
}

const infantSurvivalDiff = Math.abs(parseFloat(results.survivalRates.age1) - (100 - realWorld.infantMortality));
if (infantSurvivalDiff > 3) {
  recommendations.push(`⚠️  Infant survival rate off by ${infantSurvivalDiff.toFixed(1)}%`);
  recommendations.push('   → Adjust starting survival numbers in birth cards');
}

if (recommendations.length === 0) {
  console.log('\n✅ Game balance looks good! Within acceptable range of real-world statistics.\n');
} else {
  console.log('');
  recommendations.forEach(rec => console.log(rec));
  console.log('');
}

console.log('='.repeat(60));
console.log('Simulation complete!\n');

// EXPORT RESULTS (optional)
// import fs from 'fs';
// fs.writeFileSync('./simulation-results.json', JSON.stringify(results, null, 2));
// console.log('Results exported to simulation-results.json\n');