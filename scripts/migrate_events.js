/**
 * EVENT CARD MIGRATION SCRIPT
 * 
 * Converts old event format to temporal format:
 * OLD: { effects: { survivalMod: -15, resourceMod: 5 } }
 * NEW: { 
 *   effects: [],
 *   temporalEffect: {
 *     immediate: { mentalHealthMod: -40, resourceMod: -10 },
 *     duration: 36,
 *     decayType: 'exponential',
 *     residual: { mentalHealthBaseline: -5 }
 *   }
 * }
 */

const fs = require('fs');
const path = require('path');

// Conversion rules based on event type
const CONVERSION_RULES = {
  // Death events - severe trauma, long recovery
  'sibling_dies': {
    category: 'trauma',
    duration: 24,
    decayType: 'exponential',
    mentalHealthMod: -30,
    residualMental: -3
  },
  'parent_dies': {
    category: 'trauma',
    duration: 36,
    decayType: 'exponential',
    mentalHealthMod: -40,
    residualMental: -5
  },
  'friend_dies': {
    category: 'trauma',
    duration: 18,
    decayType: 'exponential',
    mentalHealthMod: -25,
    residualMental: -2
  },
  
  // Illness/injury - physical recovery
  'malaria': {
    category: 'physical',
    duration: 3,
    decayType: 'linear',
    physicalHealthMod: -30,
    residualPhysical: -2
  },
  'serious_injury': {
    category: 'physical',
    duration: 12,
    decayType: 'exponential',
    physicalHealthMod: -30,
    mentalHealthMod: -15,
    residualPhysical: -3
  },
  
  // Positive achievements - lasting boost
  'learn_to_read': {
    category: 'education',
    duration: 0,
    decayType: 'none',
    mentalHealthMod: 10,
    residualMental: 2
  },
  'start_school': {
    category: 'education',
    duration: 0,
    decayType: 'none',
    mentalHealthMod: 5,
    residualMental: 1
  },
  'scholarship': {
    category: 'education',
    duration: 48,
    decayType: 'step',
    mentalHealthMod: 15,
    resourceMod: 20,
    residualMental: 2
  },
  
  // Family changes - brief adjustment
  'sibling_born': {
    category: 'social',
    duration: 6,
    decayType: 'linear',
    mentalHealthMod: 5,
    resourceMod: -3,
    residualResource: -1
  },
  
  // Social gains - lasting benefit
  'make_best_friend': {
    category: 'social',
    duration: 0,
    decayType: 'none',
    mentalHealthMod: 15,
    residualMental: 3
  },
  
  // Default for unknown events
  'default_positive': {
    category: 'general',
    duration: 6,
    decayType: 'linear',
    mentalHealthMod: 10
  },
  'default_negative': {
    category: 'general',
    duration: 12,
    decayType: 'linear',
    mentalHealthMod: -10
  }
};

function determineEventType(event) {
  const name = event.name.toLowerCase();
  const id = event.id.toLowerCase();
  
  // Death events
  if (name.includes('dies') || name.includes('death')) {
    if (name.includes('parent')) return 'parent_dies';
    if (name.includes('sibling')) return 'sibling_dies';
    if (name.includes('friend')) return 'friend_dies';
  }
  
  // Illness
  if (name.includes('malaria')) return 'malaria';
  if (name.includes('injury') || name.includes('accident')) return 'serious_injury';
  
  // Education
  if (name.includes('read')) return 'learn_to_read';
  if (name.includes('school') && name.includes('start')) return 'start_school';
  if (name.includes('scholarship')) return 'scholarship';
  
  // Social
  if (name.includes('sibling') && name.includes('born')) return 'sibling_born';
  if (name.includes('friend') && !name.includes('dies')) return 'make_best_friend';
  
  // Check if positive or negative from survivalMod
  if (event.effects) {
    const survivalMod = event.effects.survivalMod || 0;
    return survivalMod > 0 ? 'default_positive' : 'default_negative';
  }
  
  return 'default_positive';
}

function convertEvent(event) {
  // Skip if already has temporalEffect
  if (event.temporalEffect) {
    console.log(`  ⏭️  ${event.name} - already has temporalEffect`);
    return event;
  }
  
  // Ensure effects is an array
  if (typeof event.effects === 'object' && !Array.isArray(event.effects)) {
    const oldEffects = event.effects;
    event.effects = [];
    
    // Determine conversion rule
    const eventType = determineEventType(event);
    const rule = CONVERSION_RULES[eventType];
    
    console.log(`  ✏️  ${event.name} → ${eventType}`);
    
    // Build temporal effect
    const immediate = {};
    if (rule.mentalHealthMod) immediate.mentalHealthMod = rule.mentalHealthMod;
    if (rule.physicalHealthMod) immediate.physicalHealthMod = rule.physicalHealthMod;
    if (rule.resourceMod) immediate.resourceMod = rule.resourceMod;
    
    // Map old resourceMod to new if not in rule
    if (!rule.resourceMod && oldEffects.resourceMod) {
      immediate.resourceMod = oldEffects.resourceMod;
    }
    
    const residual = {};
    if (rule.residualMental) residual.mentalHealthBaseline = rule.residualMental;
    if (rule.residualPhysical) residual.physicalHealthBaseline = rule.residualPhysical;
    if (rule.residualResource) residual.resourceMod = rule.residualResource;
    
    event.temporalEffect = {
      name: event.name,
      category: rule.category,
      immediate: immediate,
      duration: rule.duration,
      decayType: rule.decayType,
      residual: residual
    };
    
    // Clean up empty objects
    if (Object.keys(event.temporalEffect.immediate).length === 0) {
      delete event.temporalEffect.immediate;
    }
    if (Object.keys(event.temporalEffect.residual).length === 0) {
      delete event.temporalEffect.residual;
    }
  }
  
  return event;
}

function migrateEventFile(filePath) {
  console.log(`\nMigrating: ${path.basename(filePath)}`);
  console.log('='.repeat(60));
  
  const events = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const migratedEvents = events.map(convertEvent);
  
  // Write back
  const outputPath = filePath.replace('.json', '_migrated.json');
  fs.writeFileSync(outputPath, JSON.stringify(migratedEvents, null, 2));
  
  console.log(`\n✅ Migrated ${migratedEvents.length} events`);
  console.log(`📁 Output: ${outputPath}`);
  
  return migratedEvents;
}

// Run migration
const files = [
  path.join(__dirname, '../event_cards_childhood.json'),
  path.join(__dirname, '../event_cards_teen.json'),
  path.join(__dirname, '../event_cards_adult.json')
];

console.log('EVENT CARD MIGRATION');
console.log('='.repeat(60));

for (const file of files) {
  if (fs.existsSync(file)) {
    migrateEventFile(file);
  } else {
    console.log(`⚠️  File not found: ${file}`);
  }
}

console.log('\n' + '='.repeat(60));
console.log('MIGRATION COMPLETE');
console.log('Review *_migrated.json files, then replace originals');
