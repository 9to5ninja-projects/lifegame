// Realistic Marriage Age Audit
// Based on UN/World Bank data on median age at first marriage by region
// These are 2020s statistics

const REALISTIC_MARRIAGE_AGES = {
  // Developed nations - later marriage (27-32)
  "birth_nordic": {
    "median": 31,
    "minRealistic": 22,
    "maxRealistic": 45,
    "description": "Nordic countries: very late marriage, common to marry 28-35"
  },
  "birth_western_europe": {
    "median": 30,
    "minRealistic": 22,
    "maxRealistic": 45,
    "description": "Western Europe: median 28-30, common 25-40"
  },
  "birth_japan_korea": {
    "median": 31,
    "minRealistic": 25,
    "maxRealistic": 45,
    "description": "East Asia: median 30-31, but late marriage culture, common 28-38"
  },
  "birth_north_america_middle": {
    "median": 28,
    "minRealistic": 20,
    "maxRealistic": 45,
    "description": "North America: median 27-30, wide variation 20-40"
  },

  // Emerging/transitional - medium marriage age (24-28)
  "birth_eastern_europe": {
    "median": 26,
    "minRealistic": 20,
    "maxRealistic": 40,
    "description": "Eastern Europe: median 25-27, common 20-35"
  },
  "birth_urban_china": {
    "median": 27,
    "minRealistic": 23,
    "maxRealistic": 42,
    "description": "Urban China: median 27-28 (rising), common 24-38"
  },
  "birth_urban_latin_america": {
    "median": 25,
    "minRealistic": 18,
    "maxRealistic": 38,
    "description": "Urban Latin America: median 24-26, common 18-35"
  },
  
  // Developing - earlier marriage (18-25)
  "birth_southeast_asia": {
    "median": 23,
    "minRealistic": 15,
    "maxRealistic": 35,
    "description": "Southeast Asia: median 22-24, range 15-35"
  },
  "birth_rural_india": {
    "median": 21,
    "minRealistic": 14,
    "maxRealistic": 32,
    "description": "Rural India: median 19-22, range 14-32"
  },
  "birth_sub_saharan_africa": {
    "median": 19,
    "minRealistic": 12,
    "maxRealistic": 30,
    "description": "Sub-Saharan Africa: median 18-20, early marriages common"
  },
  "birth_middle_east": {
    "median": 22,
    "minRealistic": 15,
    "maxRealistic": 35,
    "description": "Middle East: median 22-25 (varies), range 15-35"
  }
};

// Calculate probability of marriage at given age for a region
function getMarriageProbabilityAtAge(birthCardId, age) {
  const data = REALISTIC_MARRIAGE_AGES[birthCardId];
  if (!data) return 0; // Unknown region
  
  const { median, minRealistic, maxRealistic } = data;
  
  // Too young or too old
  if (age < minRealistic || age > maxRealistic) return 0;
  
  // Peak probability at median age
  // Gaussian-ish curve centered on median
  const distanceFromMedian = Math.abs(age - median);
  const maxDistance = Math.max(median - minRealistic, maxRealistic - median);
  
  // Probability peaks at 100% at median, drops toward edges
  const probability = Math.pow(1 - (distanceFromMedian / maxDistance), 2);
  
  return Math.max(0, probability);
}

// Test a few ages
console.log('Marriage Probability Examples:\n');

const regions = ['birth_nordic', 'birth_north_america_middle', 'birth_urban_latin_america', 'birth_sub_saharan_africa'];
const ages = [16, 18, 22, 25, 28, 31, 35, 40];

regions.forEach(region => {
  console.log(`\n${region}:`);
  const data = REALISTIC_MARRIAGE_AGES[region];
  console.log(`  Median: ${data.median}, Range: ${data.minRealistic}-${data.maxRealistic}`);
  console.log(`  Ages: `, ages.map(age => {
    const prob = getMarriageProbabilityAtAge(region, age);
    return `${age}: ${(prob * 100).toFixed(0)}%`;
  }).join(', '));
});
