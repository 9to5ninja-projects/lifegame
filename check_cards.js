const fs = require('fs');

const birthCards = JSON.parse(fs.readFileSync('./birth_cards_json.json', 'utf8'));

console.log('=== FIRST 5 BIRTH CARDS ===\n');

for (let i = 0; i < Math.min(5, birthCards.length); i++) {
  const card = birthCards[i];
  console.log(`[${i}] ${card.name || card.title || 'Unnamed'}`);
  console.log(`    Life expectancy: ${card.lifeExpectancy}`);
  console.log(`    Region: ${card.region || card.birthRegion}`);
  console.log('');
}
