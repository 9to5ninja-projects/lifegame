# 🎮 HOMEOSTATIC SYSTEM IMPLEMENTATION GUIDE

## What You've Got

### Files Added

1. **`game_engine_v2_homeostatic.js`** - Complete game engine with:
   - Full player state structure
   - Prerequisite evaluation system
   - Homeostatic drift systems
   - Effect application engine
   - Death check system
   - Updated scoring

2. **`event_cards_v2_homeostatic.json`** - 25 example events demonstrating:
   - Sex-gated events (prostate cancer, pregnancy, menstruation)
   - Age-gated events (menarche, puberty, menopause)
   - Complex prerequisites (child labor requires poor + in school + young)
   - Array operations (adding chronic conditions)
   - State-dependent effects

3. **`HOMEOSTATIC_SYSTEM_DOCS.md`** - Complete documentation

---

## Quick Start: Using the New Engine

### Import and Initialize

```javascript
// Import the engine
const MortalityGameV2 = require('./game_engine_v2_homeostatic');

// Load card data
const birthCards = require('./birth_cards_json.json');
const familyCards = require('./family_cards_json.json');
const eventCards = require('./event_cards_v2_homeostatic.json');
const deathCards = require('./death_cards_json.json');

// Create game instance
const game = new MortalityGameV2(birthCards, familyCards, eventCards, deathCards);

// Start game
const birthCard = birthCards[0];
const familyCard = familyCards[0];
const demographics = { sex: "female" };  // Optional

game.createPlayer(birthCard, familyCard, demographics);
```

### Access Player State

```javascript
const player = game.player;

// Demographics (immutable after birth)
console.log(player.demographics.sex);                    // "female"
console.log(player.demographics.age);                    // 0
console.log(player.demographics.lifeExpectancy);         // 72

// Health
console.log(player.health.physical.current);             // 70
console.log(player.health.physical.baseline);            // 75
console.log(player.health.physical.chronic);             // []

// Relationships
console.log(player.relationships.partners.exists);       // false
console.log(player.relationships.children.length);       // 0

// Economics
console.log(player.economics.resources.current);         // 25
console.log(player.economics.income.current);            // 0
console.log(player.economics.debt);                      // 0

// Development
console.log(player.development.education.literate);      // false
console.log(player.development.education.level);         // "none"

// Circumstances
console.log(player.circumstances.housing.status);        // "stable"
console.log(player.circumstances.vulnerability.caregiver); // false
```

---

## Game Flow

### Play Through Years

```javascript
// Loop until death
while (player.alive && player.age < 100) {
  // Process year-end: drift all systems
  const yearResult = game.processYearEnd(player);
  
  console.log(`Age ${player.demographics.age}:`);
  console.log(`  Survival: ${player.survival}%`);
  console.log(`  Health: ${player.health.physical.current}`);
  console.log(`  Resources: ${player.economics.resources.current}`);
  
  // Check if dead
  if (!yearResult.alive) {
    console.log(`DIED: ${yearResult.cause.name}`);
    break;
  }
}
```

### Draw Events (Optional)

```javascript
// Find events appropriate for current age
const validEvents = eventCards.filter(event => {
  const [minAge, maxAge] = event.ageRange;
  return player.demographics.age >= minAge && 
         player.demographics.age <= maxAge;
});

// Filter by prerequisites
const availableEvents = validEvents.filter(event =>
  game.canEventOccur(event, player)
);

console.log("Available events:");
availableEvents.forEach(event => console.log(`  - ${event.name}`));

// Apply an event
if (availableEvents.length > 0) {
  const event = availableEvents[0];
  game.applyEventEffects(event, player);
  console.log(`Event: ${event.name}`);
  console.log(`Health now: ${player.health.physical.current}`);
}
```

### Check Fold Option

```javascript
if (player.survival < 40) {
  console.log("Survival is low. Fold? (Y/N)");
  // In UI: if user clicks "Fold This Life"
  game.foldLife(player);
  console.log(`Score: ${game.calculateScore(player)}`);
}
```

### Get Final Summary

```javascript
const summary = game.getSummary(player);
console.log(JSON.stringify(summary, null, 2));
```

Output:
```json
{
  "age": 67,
  "alive": false,
  "folded": false,
  "sex": "female",
  "causeOfDeath": "Pneumonia",
  "birthRegion": "Rural Sub-Saharan Africa",
  "lifeExpectancy": 58,
  "yearsOverUnder": 9,
  "finalScore": 312,
  "education": "none",
  "children": 3,
  "married": true,
  "chronicConditions": [],
  "eventHistory": [...]
}
```

---

## Advanced: Understanding the Homeostatic Loop

### What Happens Each Year

```javascript
processYearEnd(player) {
  // 1. Age up
  player.demographics.age++;  // 5 → 6

  // 2. DRIFT HEALTH
  // Physical health drifts toward baseline (but chronic conditions limit it)
  if (player.health.physical.current < player.health.physical.baseline) {
    player.health.physical.current += player.health.physical.drift;
    // If has diabetes: baseline is capped at 60
  }

  // 3. DRIFT ECONOMICS
  // Income vs expenses
  let drift = income - living_expenses - child_costs - medical_costs;
  resources += drift;
  if (resources < 0) debt += Math.abs(resources);

  // 4. DRIFT RELATIONSHIPS
  // Partner relationships stabilize if married
  // Sibling relationships slowly drift apart
  // Social isolation flag updated

  // 5. COGNITIVE DEVELOPMENT
  // Age-based phases: infancy → childhood → adolescent → adult → decline
  // Puberty, menarche, menopause triggered at appropriate ages

  // 6. LIFE STAGE TRANSITIONS
  // Elderly flag, dependent flag, etc.

  // 7. RECALCULATE SURVIVAL
  // FROM ALL STATES:
  let survival = baseSurvival;
  if (health.physical.current < 30) survival -= 15;  // Poor health
  if (health.mental.current < 20) survival -= 15;     // Despair
  if (chronic.length > 0) survival -= 3 * count;      // Diseases
  if (resources < 5) survival -= 8;                   // Poverty
  if (housing === "homeless") survival -= 25;         // Homelessness
  if (isolated) survival -= 12;                       // Loneliness
  if (married) survival += 5;                         // Marriage protection
  // ... more factors

  // 8. DEATH CHECK
  const roll = Math.random() * 100;
  if (roll > survival) {
    // DEAD
    causeOfDeath = selectWeightedCause();
    alive = false;
  }
}
```

### Example: Year-by-Year Life with Diabetes

```
Age 0-10: Healthy childhood
- physical.current: 75, baseline: 75
- mental.current: 70, baseline: 70
- No events
- Normal childhood development

Age 15: Serious Illness Event
- Event: "Serious Illness"
- Effect: health.physical.current: -40
- New state: physical.current: 35, baseline: 75
- Survival: reduced

Age 15-18: Recovery Years
- Year 16: current: 35 + 3 = 38 (drifting toward 75)
- Year 17: current: 38 + 3 = 41
- Year 18: current: 41 + 3 = 44
- Slowly recovering

Age 18: Diabetes Diagnosis Event
- Event: "Diabetes Diagnosis"
- Effects:
  - health.physical.chronic: ["diabetes"]
  - health.physical.baseline: -15  (75 → 60)
  - survival: -10
- New state: current: 44, baseline: 60

Age 18-35: Living with Chronic Disease
- Each year: drift toward 60 (now the cap)
- Can never exceed 60 because of diabetes
- Other events still happen but physical recovery capped

Age 35: Mental Health Crisis (stress from disease)
- mental.current: 70 → 40
- mental.baseline: 65 → 50 (chronic stress)
- Will recover toward 50 over time, not 65

Age 40: Job Loss (stress compounds)
- income: -10
- mental.current: -12
- Survival drops further

Age 50: Therapy Access (if resources > 20)
- mental.baseline: 50 → 55
- mental.drift: 2 → 3
- Improves recovery rate
- resources: -15

Age 60+: Age-Based Decline
- physical.baseline: 60 → 59 → 58 (yearly decline)
- Can't recover above declining baseline
- Diabetes prevents bounce-back
- Compound effect: disease + aging = severe decline
```

---

## Converting Old Events to New Format

### Old Format (v1)

```javascript
{
  "name": "Parent Dies",
  "weight": 4,
  "effects": {
    "survivalMod": -15,
    "tags": ["orphan"]
  }
}
```

### New Format (v2)

```javascript
{
  "name": "Parent Dies",
  "weight": 4,
  "ageRange": [0, 80],
  "requires": {
    "any": [
      { "relationships.parents.mother.alive": true },
      { "relationships.parents.father.alive": true }
    ]
  },
  "effects": {
    "relationships.parents.mother.alive": false,
    // OR select randomly in code
    "health.mental.current": "-15",
    "relationships.social.isolation": true  // Only if young
    // Age-dependent logic in code
  }
}
```

### Conversion Checklist

- [ ] Add `requires` block with age range
- [ ] Add sex gates if applicable (pregnancy, prostate cancer, etc.)
- [ ] Replace tag arrays with specific state paths
- [ ] Replace `survivalMod` with `survival` or `health.*` changes
- [ ] Replace simple modifiers with `health.physical.baseline` for chronic effects
- [ ] Add `health.physical.chronic` operations for new conditions
- [ ] Test prerequisites match intent

---

## Creating New Events

### Template

```javascript
{
  "id": "event_my_event",
  "type": "event",
  "name": "Event Name",
  "weight": 6,              // Relative probability
  "ageRange": [18, 65],    // When can this happen
  "description": "What happens...",
  
  "requires": {
    "all": [
      { "demographics.age": ">=18" },
      { "some.state.path": "value" }
    ]
  },
  
  "effects": {
    "health.physical.current": "-20",      // Temporary
    "health.physical.baseline": "-5",      // Permanent
    "health.physical.chronic": {
      "operation": "add",
      "item": "depression"
    },
    "survival": "-8",
    "resources": "-15"
  }
}
```

### Example: "New Job"

```javascript
{
  "id": "event_new_job",
  "type": "event",
  "name": "Land a Job",
  "weight": 8,
  "ageRange": [18, 65],
  "description": "After searching, you find employment.",
  
  "requires": {
    "all": [
      { "demographics.age": ">=18" },
      { "economics.income.current": "<5" },
      { "development.education.literate": true }
    ]
  },
  
  "effects": {
    "economics.income.current": "+15",
    "economics.resources.current": "+10",
    "health.mental.current": "+8",
    "survival": "+5"
  }
}
```

---

## Testing Your Events

### Check Prerequisites

```javascript
const event = eventCards[0];
const canOccur = game.canEventOccur(event);
console.log(`Can "${event.name}" happen? ${canOccur}`);
```

### Simulate Event Application

```javascript
console.log("Before:", player.health.physical.current);
game.applyEventEffects(event, player);
console.log("After:", player.health.physical.current);
```

### Run a Mini Simulation

```javascript
let count = 0;
for (let i = 0; i < 100; i++) {
  const player = game.createPlayer(birthCard, familyCard);
  
  while (player.alive && player.age < 100) {
    game.processYearEnd(player);
  }
  
  if (player.health.physical.chronic.includes("diabetes")) {
    count++;
  }
}
console.log(`${count}% of players got diabetes`);
```

---

## Integration with UI

### Display Player State

```html
<div id="stats">
  <div>Age: <span id="age"></span></div>
  <div>Physical Health: <span id="physical"></span></div>
  <div>Mental Health: <span id="mental"></span></div>
  <div>Resources: <span id="resources"></span></div>
  <div>Survival: <span id="survival"></span>%</div>
  <div>Relationships: <span id="relationships"></span></div>
</div>
```

```javascript
function updateUI(player) {
  document.getElementById('age').textContent = player.demographics.age;
  document.getElementById('physical').textContent = 
    `${Math.round(player.health.physical.current)}/` +
    `${Math.round(player.health.physical.baseline)}`;
  document.getElementById('mental').textContent =
    `${Math.round(player.health.mental.current)}/` +
    `${Math.round(player.health.mental.baseline)}`;
  document.getElementById('resources').textContent =
    Math.round(player.economics.resources.current);
  document.getElementById('survival').textContent =
    Math.round(player.survival);
  document.getElementById('relationships').textContent =
    `Partner: ${player.relationships.social.married ? "Yes" : "No"}, ` +
    `Children: ${player.relationships.children.length}`;
}
```

### Display Chronic Conditions

```html
<div id="conditions">
  <h3>Health Conditions</h3>
  <ul id="conditionsList"></ul>
</div>
```

```javascript
function updateConditions(player) {
  const list = document.getElementById('conditionsList');
  list.innerHTML = '';
  
  player.health.physical.chronic.forEach(condition => {
    const li = document.createElement('li');
    li.textContent = condition;
    list.appendChild(li);
  });
  
  if (player.health.physical.chronic.length === 0) {
    list.innerHTML = '<li>No chronic conditions</li>';
  }
}
```

---

## Next Steps

1. **Convert existing events** from v1 to v2 format (50+ events)
2. **Add follow-up events** (pregnancy → childbirth in 9 months)
3. **Add conditional outcomes** (childbirth: 99% survive, 1% die)
4. **Create UI component** to display new state structure
5. **Run 10,000 game simulation** to validate balance
6. **Test edge cases** (what if player becomes pregnant, then chronically ill, then homeless?)

---

## Tips & Tricks

### Preventing Event Spam

Some events are too common. Weight them lower:

```javascript
// War Zone: rare bad events should have weight 2-4
// Safe country: rare good events should have weight 4-8
```

### Age-Appropriate Depth

Events scale by life stage:

```
Infancy (0-2): Few events, high mortality risk
Childhood (3-12): School, accidents, family
Adolescence (13-17): Puberty, education, relationships
Adulthood (18-65): Career, marriage, parenthood
Old age (65+): Health decline, legacy
```

### Prerequisite Complexity

Keep prerequisites clear:

```javascript
// GOOD
{ "demographics.sex": "female", "demographics.age": ">=50" }

// CONFUSING
{ "relationships.children": "has", "economics.debt": ">100" }

// Use descriptive field names
```

### Testing State Mutations

Always clone when testing:

```javascript
const originalPlayer = JSON.parse(JSON.stringify(player));
game.applyEventEffects(event, player);
// Check that specific fields changed, others didn't
```

---

## Troubleshooting

### Event Never Triggers

Check prerequisites:
```javascript
console.log("Event:", event.name);
console.log("Requires:", event.requires);
console.log("Can occur?", game.canEventOccur(event));
```

### Survival Plummeting

Check `calculateSurvivalFromState()` - something is adding too much penalty:
```javascript
console.log("Physical:", player.health.physical.current);
console.log("Mental:", player.health.mental.current);
console.log("Resources:", player.economics.resources.current);
console.log("Isolated:", player.relationships.social.isolation);
```

### Chronic Conditions Not Limiting Recovery

Remember: chronic conditions set a BASELINE, they don't create a hard cap:
```javascript
if (chronic.includes("diabetes")) {
  baseline = Math.min(baseline, 60);  // Can't recover above 60
}
// But you CAN drop below 60 from current events
```

---

**This system is ready to power the next version of Mortality Lottery. Build with it!** 🧠
