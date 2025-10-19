// Event Conversion Tool: v1.0 → v2.0
// Converts old event format to new prerequisite/effect system

const fs = require('fs');
const path = require('path');

class EventConverter {
  
  // Map v1.0 tags/profiles to v2.0 prerequisite gates
  static mapProfileToRequires(tags = [], profileWeights = {}) {
    const requires = {};

    // Apply profile-based gates
    if (profileWeights) {
      const profiles = Object.keys(profileWeights);
      
      // Infer from weights
      if (profileWeights['high-resource'] && profileWeights['high-resource'] < 10) {
        // Prefer low-resource contexts
        if (!requires.any) requires.any = [];
        requires.any.push({ 'circumstances.economic': { '<': 40 } });
      }
      
      if (profileWeights['low-resource'] && profileWeights['low-resource'] > 20) {
        // Prefer low-resource contexts
        if (!requires.any) requires.any = [];
        requires.any.push({ 'circumstances.economic': { '<': 40 } });
      }

      if (profileWeights['rural'] && profileWeights['rural'] > 10) {
        if (!requires.any) requires.any = [];
        requires.any.push({ 'circumstances.location': 'rural' });
      }

      if (profileWeights['conflict'] && profileWeights['conflict'] > 20) {
        if (!requires.any) requires.any = [];
        requires.any.push({ 'circumstances.conflict': true });
      }
    }

    // Apply tag-based gates
    if (tags && tags.includes('low-resource')) {
      if (!requires.any) requires.any = [];
      requires.any.push({ 'circumstances.economic': { '<': 40 } });
    }
    if (tags && tags.includes('rural')) {
      if (!requires.any) requires.any = [];
      requires.any.push({ 'circumstances.location': 'rural' });
    }
    if (tags && tags.includes('conflict')) {
      if (!requires.any) requires.any = [];
      requires.any.push({ 'circumstances.conflict': true });
    }

    return Object.keys(requires).length > 0 ? requires : null;
  }

  // Convert v1.0 effects to v2.0 effects array
  static mapEffects(v1Effects = {}, ageRange = [0, 100]) {
    const effects = [];

    // survivalMod → health.physical.current
    if (v1Effects.survivalMod) {
      effects.push({
        path: 'health.physical.current',
        type: 'modify',
        value: v1Effects.survivalMod
      });
    }

    // resourceMod → economics.resources.current
    if (v1Effects.resourceMod) {
      effects.push({
        path: 'economics.resources.current',
        type: 'modify',
        value: v1Effects.resourceMod
      });
    }

    // agencyMod → relationships.social.community
    if (v1Effects.agencyMod) {
      effects.push({
        path: 'relationships.social.community',
        type: 'modify',
        value: v1Effects.agencyMod * 10 // Scale up (agency was 0-10, community is 0-100)
      });
    }

    // tags: special handling
    if (v1Effects.tags) {
      if (v1Effects.tags.includes('literate')) {
        effects.push({
          path: 'development.literacy',
          type: 'set',
          value: true
        });
      }
      if (v1Effects.tags.includes('educated')) {
        effects.push({
          path: 'development.educationLevel',
          type: 'set',
          value: 'primary'
        });
      }
    }

    return effects;
  }

  // Convert single v1.0 event to v2.0
  static convertEvent(v1Event) {
    const v2Event = {
      id: v1Event.id,
      name: v1Event.name,
      ageRange: v1Event.ageRange || [0, 100],
      description: v1Event.description,
      weight: v1Event.weight || 1
    };

    // Add prerequisites (context-based)
    const requires = this.mapProfileToRequires(
      v1Event.profileTags,
      v1Event.profileWeights
    );
    if (requires) {
      v2Event.requires = requires;
    }

    // Convert effects
    const effects = this.mapEffects(v1Event.effects, v1Event.ageRange);
    if (effects.length > 0) {
      v2Event.effects = effects;
    }

    // Handle age modifiers if present
    if (v1Event.ageModifiers) {
      // Parse age modifier and apply as conditional effects
      for (const [ageKey, mods] of Object.entries(v1Event.ageModifiers)) {
        const [minAge, maxAge] = ageKey.split('-').map(Number);
        v2Event.ageModifiers = v2Event.ageModifiers || {};
        v2Event.ageModifiers[`${minAge}-${maxAge}`] = this.mapEffects(mods, [minAge, maxAge]);
      }
    }

    // Handle choices if present
    if (v1Event.choices) {
      v2Event.choices = v1Event.choices.map(choice => ({
        text: choice.text,
        requires: choice.requires, // Keep as-is for now
        effects: this.mapEffects(choice.effects, v1Event.ageRange)
      }));
    }

    return v2Event;
  }

  // Batch convert all events from a file
  static convertFile(inputPath) {
    try {
      const rawData = fs.readFileSync(inputPath, 'utf8');
      const v1Events = JSON.parse(rawData);
      
      const v2Events = v1Events.map(event => this.convertEvent(event));
      
      return v2Events;
    } catch (error) {
      console.error(`Error converting ${inputPath}: ${error.message}`);
      return null;
    }
  }

  // Write converted events to file
  static writeFile(outputPath, events) {
    try {
      fs.writeFileSync(outputPath, JSON.stringify(events, null, 2), 'utf8');
      console.log(`✓ Converted ${events.length} events → ${outputPath}`);
      return true;
    } catch (error) {
      console.error(`Error writing ${outputPath}: ${error.message}`);
      return false;
    }
  }

  // Convert all event card files
  static convertAll(baseDir = './') {
    const files = [
      'event_cards_childhood.json',
      'event_cards_teen.json',
      'event_cards_adult.json'
    ];

    let totalConverted = 0;

    files.forEach(file => {
      const inputPath = path.join(baseDir, file);
      const outputPath = path.join(baseDir, `${file.replace('.json', '')}_v2.json`);

      if (fs.existsSync(inputPath)) {
        const converted = this.convertFile(inputPath);
        if (converted) {
          this.writeFile(outputPath, converted);
          totalConverted += converted.length;
        }
      } else {
        console.warn(`⚠ File not found: ${inputPath}`);
      }
    });

    console.log(`\n✓ Total events converted: ${totalConverted}`);
    return totalConverted;
  }
}

// Run conversion if executed directly
if (require.main === module) {
  const baseDir = __dirname;
  console.log(`Converting events in: ${baseDir}\n`);
  EventConverter.convertAll(baseDir);
}

module.exports = EventConverter;
