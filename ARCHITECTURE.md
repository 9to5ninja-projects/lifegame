# ARCHITECTURE - Technical Reference

## Player State Structure (v2.0)

```javascript
player = {
  // Immutable demographics
  demographics: {
    sex: "male" | "female",
    birthYear: 2000,
    birthRegion: "Rural Africa",
    ethnicity: null
  },

  // Health systems with homeostatic drift
  health: {
    physical: {
      current: 70,      // 0-100, affected by events
      baseline: 75,     // Where it drifts toward
      drift: +3,        // Recovery rate per year
      chronic: []       // ["diabetes", "asthma"]
    },
    mental: {
      current: 60,
      baseline: 65,
      drift: +2,
      chronic: []       // ["depression", "ptsd"]
    },
    reproductive: {
      fertile: true,
      pregnant: false,
      childrenBorn: 0
    }
  },

  // Relationship networks
  relationships: {
    parents: {
      mother: { alive: true, present: true, relationship: 65 },
      father: { alive: true, present: true, relationship: 60 }
    },
    siblings: [
      { age: 5, alive: true, relationship: 70 },
      { age: 8, alive: false, relationship: 0 }
    ],
    partner: {
      exists: false,
      married: false,
      relationship: 0,
      since: null
    },
    children: [],
    social: {
      friends: 3,
      community: 50,  // 0-100 integration
      isolation: false
    }
  },

  // Economic systems
  economics: {
    income: {
      current: 15,      // Per-year income
      baseline: 10,
      employed: true,
      occupation: "manual labor"
    },
    resources: {
      current: 25,
      baseline: 20,
      drift: -5  // Natural expense drift
    },
    debt: 0,
    assets: []  // ["home", "vehicle"]
  },

  // Development & education
  development: {
    education: {
      literate: false,
      yearsCompleted: 0,
      level: "none",  // none, primary, secondary, tertiary
      inSchool: false
    },
    skills: ["farming", "trade"],
    cognitive: {
      current: 70,
      baseline: 70,
      developmentPhase: "childhood"  // childhood, adolescent, adult, decline
    }
  },

  // Life circumstances
  circumstances: {
    location: {
      urban: true,
      displaced: false,
      refugee: false,
      migrant: false
    },
    legal: {
      citizenship: true,
      documented: true,
      criminalRecord: false,
      imprisoned: false
    },
    housing: {
      status: "stable",  // stable, unstable, homeless
      ownership: false
    },
    vulnerability: {
      disabled: false,
      elderly: false,
      dependent: true,
      caregiver: false
    }
  },

  // Legacy fields (v1.0 compatibility)
  age: 0,
  survival: 87,
  alive: true,
  eventHistory: []
}
```

---

## Event Format (v2.0)

### Basic Structure
```javascript
{
  id: "event_childbirth",
  type: "event",
  name: "Childbirth",
  ageRange: [15, 45],
  weight: 6,
  
  // Who can experience this?
  requires: {
    all: [
      { "demographics.sex": "female" },
      { "age": ">=15" },
      { "age": "<=45" },
      { "health.reproductive.pregnant": true }
    ]
  },

  // What happens?
  effects: {
    "health.reproductive.pregnant": false,
    "health.reproductive.childrenBorn": "+1",
    "relationships.children": "create",
    "survivalMod": -15  // Maternal mortality risk
  },

  // Multiple outcomes with probabilities
  outcomes: [
    {
      probability: 0.02,  // 2% in low-resource
      effect: "death",
      cause: "Maternal Mortality"
    },
    {
      probability: 0.98,
      effect: "survive"
    }
  ],

  // Trigger follow-up event
  followUp: {
    delay: "+9months",
    event: "childbirth"
  }
}
```

### Prerequisites - Query System

**Simple equality:**
```json
{ "demographics.sex": "female" }
{ "development.education.literate": true }
```

**Range:**
```json
{ "age": "15-45" }
{ "age": ">=50" }
```

**Comparison:**
```json
{ "health.physical.current": "<30" }
{ "economics.resources.current": ">50" }
{ "relationships.social.friends": "==0" }
```

**Array contains:**
```json
{ "health.physical.chronic": "includes:diabetes" }
{ "relationships.children": "has:alive" }
```

**Logical operators:**
```json
{
  "requires": {
    "all": [
      { "demographics.sex": "male" },
      { "age": ">=50" }
    ]
  }
}
```

```json
{
  "requires": {
    "any": [
      { "relationships.parents.mother.alive": false },
      { "relationships.parents.father.alive": false }
    ]
  }
}
```

---

## Core Systems

### 1. Prerequisite Evaluation
```javascript
canEventOccur(event, player) {
  if (!event.requires) return true;
  return evaluateRequirements(event.requires, player);
}

evaluateRequirements(reqs, player) {
  if (reqs.all) return reqs.all.every(r => evaluateSingle(r, player));
  if (reqs.any) return reqs.any.some(r => evaluateSingle(r, player));
  if (reqs.not) return !evaluateSingle(reqs.not, player);
  return evaluateSingle(reqs, player);
}
```

### 2. Health Homeostasis
```javascript
function driftHealth(player) {
  // Physical recovery
  if (player.health.physical.current < player.health.physical.baseline) {
    player.health.physical.current += player.health.physical.drift;
    player.health.physical.current = Math.min(
      player.health.physical.current,
      player.health.physical.baseline
    );
  }
  
  // Mental recovery
  if (player.health.mental.current < player.health.mental.baseline) {
    player.health.mental.current += player.health.mental.drift;
    player.health.mental.current = Math.min(
      player.health.mental.current,
      player.health.mental.baseline
    );
  }
  
  // Age-related decline (60+)
  if (player.age > 60) {
    player.health.physical.baseline -= 1;
    player.health.cognitive.baseline -= 0.5;
  }
}
```

### 3. Economic Drift
```javascript
function driftEconomics(player) {
  let expenses = 10;  // Base living
  expenses += player.relationships.children.length * 5;  // Child cost
  expenses += player.health.physical.chronic.length * 3;  // Medical
  
  let drift = player.economics.income.current - expenses;
  player.economics.resources.current += drift;
  player.economics.resources.current = Math.max(0, player.economics.resources.current);
  
  // Debt accumulation
  if (player.economics.resources.current === 0 && drift < 0) {
    player.economics.debt += Math.abs(drift);
  }
}
```

### 4. Survival Calculation
```javascript
function calculateSurvival(player) {
  let survival = player.survival;  // Base from birth
  
  // Health impacts
  if (player.health.physical.current < 30) survival -= 10;
  if (player.health.mental.current < 20) survival -= 15;
  
  // Economic stress
  if (player.economics.resources.current < 5) survival -= 5;
  if (player.economics.debt > 50) survival -= 8;
  
  // Social support
  if (player.relationships.social.isolation) survival -= 10;
  if (player.relationships.social.friends === 0) survival -= 5;
  
  // Life circumstances
  if (player.circumstances.housing.status === "homeless") survival -= 20;
  if (player.circumstances.location.displaced) survival -= 15;
  
  player.survival = Math.max(1, Math.min(99, survival));
}
```

### 5. Year Processing Loop
```javascript
function processYearEnd(player) {
  // 1. Age
  player.age++;
  
  // 2. Homeostatic drift
  driftHealth(player);
  driftEconomics(player);
  driftRelationships(player);
  
  // 3. Development phases
  processAgingEffects(player);
  
  // 4. Recalculate survival
  calculateSurvival(player);
  
  // 5. Death check
  if (deathCheck(player)) {
    return { alive: false, cause: ... };
  }
  
  return { alive: true, age: player.age };
}
```

---

## Event Conversion Examples

### Simple Event (Before/After)

**v1.0:**
```json
{
  "name": "Parent Dies",
  "effects": {
    "survivalMod": -15,
    "resourceMod": -15,
    "tags": ["parent_loss"]
  }
}
```

**v2.0:**
```json
{
  "name": "Parent Dies",
  "requires": {
    "any": [
      { "relationships.parents.mother.alive": true },
      { "relationships.parents.father.alive": true }
    ]
  },
  "effects": {
    "randomParent": {
      "relationships.parents.{parent}.alive": false,
      "health.mental.current": -15,
      "survivalMod": "ageDependent"
    }
  }
}
```

### Complex Event with Outcomes

```json
{
  "name": "Childbirth",
  "requires": {
    "all": [
      { "demographics.sex": "female" },
      { "age": ">=15" },
      { "age": "<=45" },
      { "health.reproductive.pregnant": true }
    ]
  },
  "effects": {
    "health.reproductive.pregnant": false,
    "health.reproductive.childrenBorn": "+1",
    "relationships.children": "create",
    "survivalMod": -15
  },
  "outcomes": [
    {
      "probability": 0.02,
      "condition": {
        "any": [
          { "demographics.birthRegion": "Rural Sub-Saharan Africa" },
          { "demographics.birthRegion": "Rural South Asia" }
        ]
      },
      "effect": "death",
      "cause": "Maternal Mortality"
    },
    {
      "probability": 0.98,
      "effect": "survive",
      "followUp": {
        "delay": "+9months",
        "event": "give_birth"
      }
    }
  ]
}
```

---

## Testing State Queries

```javascript
// Check if event can occur
const canGiveBirth = canEventOccur(birthEvent, player);

// Query nested state
const isFemale = getNestedValue(player, "demographics.sex") === "female";
const physicalHealth = getNestedValue(player, "health.physical.current");
const hasChildren = getNestedValue(player, "relationships.children").length > 0;

// Check complex requirements
const requirementsMet = evaluateRequirements({
  all: [
    { "demographics.sex": "female" },
    { "age": ">=15" },
    { "age": "<=45" }
  ]
}, player);
```
