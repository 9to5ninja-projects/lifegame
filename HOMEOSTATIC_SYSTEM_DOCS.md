# 🧠 HOMEOSTATIC STATE SYSTEM - v2 DOCUMENTATION

## Overview

The Homeostatic State System replaces the simple tag-based model with a **rich, interconnected state machine** that models life as it actually works:

- **Acute events** have temporary effects (recovers over time)
- **Chronic conditions** have permanent baseline shifts
- **Relationships** evolve and deteriorate
- **Economics** drift based on income vs expenses
- **Health** recovers naturally but chronic illness prevents full recovery

This enables **complex event chains** that feel like real life, not just random card draws.

---

## Player State Structure

### 1. Demographics (Immutable)

```javascript
demographics: {
  sex: "male" | "female",        // Set at birth
  age: 0,                         // Incremented yearly
  birthYear: 2010,
  birthRegion: "Southeast Asia",
  ethnicity: "optional",          // For cultural events
  lifeExpectancy: 72              // From birth card
}
```

**Purpose:** Gates events that are sex-specific or age-specific.

**Examples:**
- Prostate cancer: requires `sex: "male" AND age >= 50`
- Pregnancy: requires `sex: "female" AND age 15-45`
- Menarche: requires `sex: "female" AND age 10-16`

---

### 2. Health (Homeostatic)

```javascript
health: {
  physical: {
    current: 70,              // 0-100, can recover
    baseline: 75,             // Where it recovers to
    drift: +3,                // Recovery rate per year
    chronic: ["diabetes"]     // Permanent conditions
  },
  mental: {
    current: 55,              // 0-100
    baseline: 65,             // Recovery target
    drift: +2,                // Recovery rate
    chronic: ["depression"]   // Permanent conditions
  },
  reproductive: {
    fertile: true,            // Can get pregnant
    pregnant: false,          // Currently pregnant
    childrenBorn: 0,          // Lifetime total
    menarche: false,          // For females
    menopause: false          // For females
  }
}
```

**How It Works:**

```javascript
// Yearly drift:
if (physical.current < physical.baseline) {
  physical.current += drift;  // Recover!
}

// Chronic conditions lower baseline:
if (chronic.includes("diabetes")) {
  baseline = Math.min(baseline, 60);  // Can't recover above 60
}

// Age-based decline:
if (age > 60) {
  baseline -= 1;  // Slow decline each year
}
```

**Events interact with it:**

```json
{
  "name": "Serious Illness",
  "effects": {
    "health.physical.current": "-40"    // Drops temporarily
  }
}

{
  "name": "Chronic Illness Diagnosis",
  "effects": {
    "health.physical.baseline": "-15",  // Permanent
    "health.physical.chronic": { "operation": "add", "item": "diabetes" }
  }
}

{
  "name": "Therapy Helps",
  "effects": {
    "health.mental.baseline": "+5",     // Improves recovery target
    "health.mental.drift": "+1"         // Faster recovery
  }
}
```

---

### 3. Relationships (State Machine)

```javascript
relationships: {
  parents: {
    mother: {
      alive: true,
      present: true,          // Living in same household
      relationship: 70        // 0-100 quality
    },
    father: {
      alive: true,
      present: false,         // Not in household
      relationship: 50
    }
  },
  
  siblings: [
    {
      age: 5,                 // Relative age (can be negative)
      alive: true,
      relationship: 70,
      sex: "female"
    }
  ],
  
  partner: {
    exists: false,
    married: false,
    relationship: 0,          // 0-100 quality
    since: null,              // Year married
    children: []              // With this partner
  },
  
  children: [
    {
      age: 3,
      alive: true,
      biological: true,       // Or adopted/step
      parentPartner: "partner_id"
    }
  ],
  
  social: {
    friends: 3,               // Absolute count
    community: 50,            // 0-100 integration
    isolation: false,         // Boolean flag
    married: false            // Mirror of partner.married
  }
}
```

**Relationship Decay/Growth:**

```javascript
// Each year:
if (partner.married) {
  partner.relationship += 0.2;  // Married couples stabilize
} else if (partner.exists) {
  partner.relationship -= 0.5;  // Single partners drift apart
}

// Social isolation flag:
if (friends === 0 && !married && children.length === 0) {
  isolation = true;  // No support network
}
```

**Events:**

```json
{
  "name": "Parent Dies",
  "effects": {
    "relationships.parents.mother.alive": false,
    "health.mental.current": "-20",     // Age-dependent
    "relationships.social.isolation": true
  }
}

{
  "name": "Marriage",
  "requires": {
    "all": [
      { "relationships.partner.exists": true },
      { "demographics.age": ">=18" }
    ]
  },
  "effects": {
    "relationships.social.married": true,
    "survival": "+5"                    // Married people survive longer
  }
}
```

---

### 4. Economics (Homeostatic)

```javascript
economics: {
  income: {
    current: 15,              // Per-year income
    baseline: 10,             // Expected for birth profile
    employed: true,
    occupation: "manual labor"
  },
  
  resources: {
    current: 25,              // Liquid savings
    baseline: 20,             // Normal level
    drift: -5                 // Expenses per year
  },
  
  debt: 0,                    // Accumulated debt
  assets: ["home", "vehicle"]
}
```

**Yearly Drift:**

```javascript
function driftEconomics(player) {
  let drift = income.current 
    - 10                                  // Base living
    - (children.length * 5)               // Children cost money
    - (chronic.length * 3)                // Medical costs
    - (housing.quality / 10);             // Housing cost

  resources.current += drift;

  // Debt accumulation if can't afford
  if (resources.current < 0) {
    debt += Math.abs(resources.current);
    resources.current = 0;
  }
}
```

**Effects on Survival:**

```javascript
if (resources.current < 5) survival -= 8;      // Poverty stress
if (debt > 50) survival -= 10;                 // Debt stress
if (income.current === 0) survival -= 15;      // Unemployment crisis
```

---

### 5. Development (Progressive)

```javascript
development: {
  education: {
    literate: false,
    yearsCompleted: 0,
    level: "none",            // none, primary, secondary, tertiary
    inSchool: false,
    schoolQuality: 0          // 0-100 determines learning speed
  },
  
  skills: [
    "farming",
    "trade"
  ],
  
  cognitive: {
    current: 70,
    baseline: 70,
    developmentPhase: "childhood",  // infancy, childhood, adolescent, adult, decline
    decline: 0                      // Accumulates in old age
  }
}
```

**Cognitive Development by Age:**

```javascript
if (age < 2) phase = "infancy";
else if (age < 12) phase = "childhood";
else if (age < 18) phase = "adolescent";
else if (age < 65) phase = "adult";
else {
  phase = "decline";
  decline += 1;
  baseline -= 0.5;  // Gradual cognitive decline
}
```

**Learning Events:**

```json
{
  "name": "Learn to Read",
  "requires": {
    "all": [
      { "demographics.age": ">5" },
      { "development.education.literate": false }
    ]
  },
  "effects": {
    "development.education.literate": true,
    "survival": "+3"                    // Literacy improves survival
  }
}
```

---

### 6. Circumstances (Flags)

```javascript
circumstances: {
  location: {
    urban: true,
    displaced: false,
    refugee: false,
    migrant: false,
    climate: "temperate"      // Affects disease risk
  },
  
  legal: {
    citizenship: true,
    documented: true,
    criminalRecord: false,
    imprisoned: false
  },
  
  housing: {
    status: "stable",         // stable, unstable, homeless
    ownership: false,
    quality: 50               // 0-100, affects health
  },
  
  vulnerability: {
    disabled: false,
    elderly: false,
    dependent: true,          // Age-dependent
    caregiver: false          // Caring for others
  }
}
```

**Impact on Survival:**

```javascript
if (housing.status === "homeless") survival -= 25;   // Massive hit
if (location.displaced) survival -= 15;
if (vulnerability.disabled) survival -= 10;
```

---

## Event System (v2)

### Prerequisite Format

Events use complex `requires` blocks to gate when they can occur:

```json
{
  "name": "Childbirth",
  "requires": {
    "all": [
      { "demographics.sex": "female" },
      { "demographics.age": ">=15" },
      { "demographics.age": "<=45" },
      { "health.reproductive.pregnant": true }
    ]
  }
}
```

### Comparison Operators

```javascript
{ "demographics.age": ">18" }         // Greater than
{ "demographics.age": "<65" }         // Less than
{ "demographics.age": ">=18" }        // Greater or equal
{ "demographics.age": "<=45" }        // Less or equal
{ "demographics.age": "18-45" }       // Range
{ "demographics.age": "18-45" }       // Same as above
```

### Array Checks

```javascript
{ "health.physical.chronic": "has diabetes" }     // Has item in array
{ "relationships.siblings": "has younger" }       // Has younger sibling
```

### Logical Operators

```json
{
  "requires": {
    "all": [
      { "condition1": true },
      { "condition2": true }
    ]
  }
}
```

All must be true.

```json
{
  "requires": {
    "any": [
      { "condition1": true },
      { "condition2": true }
    ]
  }
}
```

At least one must be true.

---

### Effect Format

Effects can be simple assignments or operations:

```json
{
  "effects": {
    "health.physical.current": "-40",         // Direct modifier
    "health.physical.baseline": "-15",        // Permanent change
    "survival": "-8",
    "health.physical.chronic": {              // Array operation
      "operation": "add",
      "item": "diabetes"
    },
    "relationships.children": {               // Add child
      "operation": "add",
      "item": "newborn"
    }
  }
}
```

---

## Homeostatic Processing Loop

Every year:

```javascript
function processYearEnd(player) {
  // 1. Age up
  player.demographics.age++;

  // 2. Drift all homeostatic systems toward baseline
  driftHealth(player);          // Health recovers (or declines with chronic)
  driftEconomics(player);       // Resources change based on income/expenses
  driftRelationships(player);   // Relationships evolve

  // 3. Development changes (learning, cognitive decline)
  processCognitiveDevelopment(player);

  // 4. Life stage transitions (puberty, menopause, aging)
  processLifeStageTransitions(player);

  // 5. Recalculate survival from ALL STATE
  calculateSurvivalFromState(player);

  // 6. Death check
  return deathCheck(player);
}
```

### Example: Yearly Loop for Someone with Diabetes

```
Year 1: Diabetes Diagnosis
- physical.current: 70 → 30 (event effect)
- physical.baseline: 75 → 60 (chronic condition)
- chronic: ["diabetes"]

Year 2: Drift
- physical.current: 30 → 33 (drift +3, but capped at baseline 60)
- baseline: 60 (unchanged)
- survival recalculated: base - 8 (from chronic) = lower

Year 3: Drift
- physical.current: 33 → 36
- Continues recovering toward 60 but NEVER exceeds 60
- Mental health also affected (stress from disease) → mental.baseline drops

Year 5: Age-based decline
- physical.baseline: 60 → 59 (age decline)
- Chronic condition prevents recovery above declining baseline
```

---

## Complex Event Chains

The new system enables **realistic cascading events**:

```
Event 1: Parent Dies (age 5)
├─ relationships.parents.mother.alive: false
├─ health.mental.current: -20
├─ Can now trigger: "Become Caregiver"

Event 2: Become Caregiver (now triggered)
├─ development.education.inSchool: false
├─ health.mental.current: -10
├─ Can now trigger: "Forced Child Labor"

Event 3: Forced Child Labor (triggered)
├─ economics.income: +8
├─ health.physical.current: -10
├─ Age 15: Can trigger "Early Marriage" if poor
└─ Chain continues...
```

---

## Scoring (v2)

Same multipliers as v1, but with new bonuses:

```javascript
let score = yearsLived * multiplier;

// Milestones
if (age >= 18) score += 10;
if (age >= 60) score += 20;
if (age >= 80) score += 50;

// Life expectancy (unchanged)
score += Math.max(0, (age - expectancy) * 10);

// NEW: Education bonus
if (development.education.literate) score += 10;
if (development.education.level === "tertiary") score += 30;

// NEW: Relationship/family bonus
if (relationships.social.married) score += 10;
score += relationships.children.length * 5;

// NEW: Caregiver bonus (important responsibility)
if (circumstances.vulnerability.caregiver) score += 15;
```

---

## Implementation Checklist

- [x] Phase 1: Player state structure
- [x] Phase 2: Prerequisite evaluation engine
- [x] Phase 3: Homeostatic drift systems
- [ ] Phase 4: Effect application system (detailed)
- [ ] Phase 5: Convert existing events to new format
- [ ] Phase 6: Implement follow-up events (pregnancy → childbirth)
- [ ] Phase 7: Integrate with UI
- [ ] Phase 8: Testing and balance tuning

---

## Migration Path

### Old System → New System

**Old (v1):**
```javascript
player.tags = ["literate", "married", "parent"]
player.survival = 65
```

**New (v2):**
```javascript
player.development.education.literate = true
player.relationships.social.married = true
player.relationships.children.length = 1
player.health.physical.current = 65  // Can change
player.health.physical.baseline = 75 // Recovery target
```

---

## Next Steps

1. **Implement effect application engine** (handle array operations, modifiers, etc.)
2. **Convert existing 50+ events** to new format
3. **Create follow-up events** (pregnancy → childbirth in 9 months)
4. **Add conditional effects** (outcome varies by state)
5. **Run 10,000 game simulation** and validate
6. **Test UI** with new state display

---

*This system transforms the game from "card simulator" to "life simulator."*
