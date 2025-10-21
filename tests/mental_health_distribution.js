/**
 * MENTAL HEALTH DISTRIBUTION TEST
 * Run 1,000 lives and track mental health at key ages
 * to see if everyone is depressed at 18, or if it's just edge cases
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
console.log('MENTAL HEALTH DISTRIBUTION - 1,000 Lives, Western Europe'.padEnd(100));
console.log('='.repeat(100) + '\n');

const birthCard = birthCards.find(b => b.name === 'Western Europe');
const stats = {
  ages: {
    5: { mental: [], friends: [], employed: [] },
    12: { mental: [], friends: [], employed: [] },
    18: { mental: [], friends: [], employed: [], inSchool: [] },
    22: { mental: [], friends: [], employed: [], inSchool: [], education: [] },
    25: { mental: [], friends: [], employed: [], education: [] },
    30: { mental: [], friends: [], employed: [], education: [] },
  }
};

for (let i = 0; i < 1000; i++) {
  const engine = new GameEngine(birthCards, familyCards, eventCards, deathCards);
  engine.createPlayer(birthCard, familyCards[0]);
  const player = engine.player;

  // Collect snapshots at key ages
  while (player.demographics.age <= 30 && player.health?.vital?.alive) {
    const age = player.demographics.age;
    
    if (stats.ages[age]) {
      stats.ages[age].mental.push(player.health.mental.current);
      stats.ages[age].friends.push(player.relationships.social.friends);
      stats.ages[age].employed.push(player.economics.income.employed ? 1 : 0);
      if (age === 18 || age === 22) {
        stats.ages[age].inSchool.push(player.development.education.inSchool ? 1 : 0);
      }
      if (age === 22 || age === 25 || age === 30) {
        stats.ages[age].education.push(player.development.education.level);
      }
    }

    engine.processYear();
  }
}

// Calculate statistics
console.log('MENTAL HEALTH BY AGE:');
console.log('─'.repeat(100));
console.log('Age | Mean Mental | Std Dev | Min | Max | <30 (depression) | 30-50 (low) | 50-70 (OK) | >70 (good)');
console.log('─'.repeat(100));

Object.keys(stats.ages).sort((a, b) => a - b).forEach(age => {
  const mental = stats.ages[age].mental;
  if (mental.length === 0) return;

  const mean = mental.reduce((a, b) => a + b, 0) / mental.length;
  const variance = mental.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / mental.length;
  const stdDev = Math.sqrt(variance);
  const min = Math.min(...mental);
  const max = Math.max(...mental);
  const severe = mental.filter(m => m < 30).length;
  const low = mental.filter(m => m >= 30 && m < 50).length;
  const ok = mental.filter(m => m >= 50 && m < 70).length;
  const good = mental.filter(m => m >= 70).length;

  console.log(
    `${age.padStart(3)} | ${mean.toFixed(1).padStart(11)} | ${stdDev.toFixed(1).padStart(7)} | ${min.padStart(3)} | ${max.padStart(3)} | ${(severe + '').padStart(16)} | ${(low + '').padStart(11)} | ${(ok + '').padStart(10)} | ${(good + '')}%`
  );
});

console.log('\n' + '='.repeat(100));
console.log('FRIENDS BY AGE:');
console.log('─'.repeat(100));
console.log('Age | Mean Friends | Std Dev | 0 Friends | 1-3 Friends | 4+ Friends | Max Friends');
console.log('─'.repeat(100));

Object.keys(stats.ages).sort((a, b) => a - b).forEach(age => {
  const friends = stats.ages[age].friends;
  if (friends.length === 0) return;

  const mean = friends.reduce((a, b) => a + b, 0) / friends.length;
  const variance = friends.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / friends.length;
  const stdDev = Math.sqrt(variance);
  const zero = friends.filter(f => f === 0).length;
  const few = friends.filter(f => f >= 1 && f <= 3).length;
  const many = friends.filter(f => f >= 4).length;
  const max = Math.max(...friends);

  console.log(
    `${age.padStart(3)} | ${mean.toFixed(1).padStart(12)} | ${stdDev.toFixed(1).padStart(7)} | ${(zero + '').padStart(9)} | ${(few + '').padStart(11)} | ${(many + '').padStart(10)} | ${max}`
  );
});

console.log('\n' + '='.repeat(100));
console.log('EMPLOYMENT BY AGE:');
console.log('─'.repeat(100));
console.log('Age | Employed %');
console.log('─'.repeat(100));

Object.keys(stats.ages).sort((a, b) => a - b).forEach(age => {
  const employed = stats.ages[age].employed;
  if (employed.length === 0) return;

  const pct = (employed.reduce((a, b) => a + b, 0) / employed.length * 100).toFixed(1);
  console.log(`${age.padStart(3)} | ${pct.padStart(10)}%`);
});

console.log('\n' + '='.repeat(100));
console.log('IN SCHOOL / EDUCATION AT AGE 18 & 22:');
console.log('─'.repeat(100));

const inSchool18 = stats.ages[18].inSchool;
const inSchool22 = stats.ages[22].inSchool;
const edu22 = stats.ages[22].education;

console.log(`Age 18 in school: ${(inSchool18.reduce((a, b) => a + b, 0) / inSchool18.length * 100).toFixed(1)}%`);
console.log(`Age 22 in school: ${(inSchool22.reduce((a, b) => a + b, 0) / inSchool22.length * 100).toFixed(1)}%`);
console.log(`Age 22 education distribution:`);
console.log(`  - none: ${(edu22.filter(e => e === 'none').length + '').padStart(3)} (${(edu22.filter(e => e === 'none').length / edu22.length * 100).toFixed(1)}%)`);
console.log(`  - primary: ${(edu22.filter(e => e === 'primary').length + '').padStart(3)} (${(edu22.filter(e => e === 'primary').length / edu22.length * 100).toFixed(1)}%)`);
console.log(`  - secondary: ${(edu22.filter(e => e === 'secondary').length + '').padStart(3)} (${(edu22.filter(e => e === 'secondary').length / edu22.length * 100).toFixed(1)}%)`);
console.log(`  - tertiary_bachelor: ${(edu22.filter(e => e === 'tertiary_bachelor').length + '').padStart(3)} (${(edu22.filter(e => e === 'tertiary_bachelor').length / edu22.length * 100).toFixed(1)}%)`);
console.log(`  - tertiary: ${(edu22.filter(e => e === 'tertiary').length + '').padStart(3)} (${(edu22.filter(e => e === 'tertiary').length / edu22.length * 100).toFixed(1)}%)`);

console.log('\n' + '='.repeat(100));
console.log('MENTAL HEALTH vs FRIENDS CORRELATION AT AGE 25:');
console.log('─'.repeat(100));

const age25Mental = stats.ages[25].mental;
const age25Friends = stats.ages[25].friends;

// Group by mental health level
const depressed = age25Friends.filter((f, i) => age25Mental[i] < 40);
const lowMental = age25Friends.filter((f, i) => age25Mental[i] >= 40 && age25Mental[i] < 60);
const normalMental = age25Friends.filter((f, i) => age25Mental[i] >= 60);

console.log(`Mental < 40 (severe): avg friends = ${(depressed.reduce((a, b) => a + b, 0) / depressed.length).toFixed(1)} (n=${depressed.length})`);
console.log(`Mental 40-60 (low): avg friends = ${(lowMental.reduce((a, b) => a + b, 0) / lowMental.length).toFixed(1)} (n=${lowMental.length})`);
console.log(`Mental >= 60 (normal+): avg friends = ${(normalMental.reduce((a, b) => a + b, 0) / normalMental.length).toFixed(1)} (n=${normalMental.length})`);
