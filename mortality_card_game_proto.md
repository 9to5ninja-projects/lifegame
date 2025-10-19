# MORTALITY LOTTERY - Prototype Specification
**Version:** Prototype v0.1  
**Target:** Playable in browser, 1-4 players, 15-30 min gameplay

---

## CORE GAME LOOP

```
1. BIRTH PHASE
   ├─ Draw Geographic Card (weighted)
   ├─ Draw Family Structure Card (weighted by geography)
   └─ Calculate Starting Stats (Survival Number, Resources, Agency)

2. YEAR PHASE (repeat until death or victory)
   ├─ Age up 1 year (or 5 years, configurable)
   ├─ Draw Event Card(s) based on age
   ├─ Resolve Event (choices, stat changes)
   ├─ Death Check (d100 vs Survival Number)
   └─ If alive, loop. If dead, draw Cause of Death card.

3. END PHASE
   └─ Display: Age at Death, Cause, Key Life Events, Score
```

---

## DATA STRUCTURES

### Card Schema

```json
{
  "id": "unique_id",
  "type": "birth|family|event|death",
  "name": "Card Name",
  "weight": 23,
  "description": "Flavor text",
  "ageRange": [0, 100],
  "profileTags": ["rural", "conflict", "high-resource"],
  "effects": {
    "survivalMod": -15,
    "resourceMod": 0,
    "agencyMod": 0,
    "statSet": {
      "survival": 35
    }
  },
  "choices": [
    {
      "text": "Choice A",
      "effect": { "survivalMod": +5 }
    }
  ]
}
```

### Player State

```json
{
  "id": "player_1",
  "age": 0,
  "alive": true,
  "survival": 50,
  "resources": 0,
  "agency": 0,
  "birthCards": [],
  "eventHistory": [],
  "profileTags": ["rural", "low-resource"],
  "causeOfDeath": null
}
```

---

## MINIMUM VIABLE CARD SET

### Birth Geography Cards (15 cards)

**Profile A: High Resource (weight: 6)**
- Nordic Country
- Western Europe
- Japan/South Korea
- North America (Urban, Middle Class)
- Australia/New Zealand
- Singapore

**Profile B: Stable Middle (weight: 13)**
- Eastern Europe
- Urban China
- Urban Latin America
- Mediterranean Europe

**Profile C: Emerging (weight: 30)**
- Urban South Asia
- Southeast Asia
- Latin America (Mixed)
- Urban Middle East
- Brazil/Mexico

**Profile D: Low Resource (weight: 40)**
- Rural Sub-Saharan Africa
- Rural South Asia
- Rural Southeast Asia
- Rural Central Africa

**Profile E: Conflict (weight: 11)**
- Active War Zone (Syria, Yemen)
- Fragile State (South Sudan, Afghanistan)
- Post-Conflict Rebuilding

---

### Family Structure Cards (12 cards)

**Stable (weight varies by geography)**
1. Two Parents, Middle Class, Extended Family
2. Two Parents, Stable Income, Nuclear
3. Single Parent, Strong Support Network
4. Extended Family, Multi-Generational

**Moderate**
5. Two Parents, Low Income
6. Single Parent, Limited Support
7. Teen Mother, Lives with Parents
8. Single Father (Widowed)

**Unstable**
9. Single Teen Mother, No Support
10. Orphaned at Birth (Maternal Death)
11. Parents Both Chronically Ill
12. Institutional Care (Orphanage)

---

### Event Cards (50 cards minimum)

#### Childhood Events (Age 0-12) - 15 cards

**Universal**
1. Sibling is Born
2. You Learn to Read
3. Witness Meteor Shower
4. Pet Chooses You
5. Accident (Minor Injury)

**Profile-Weighted**
6. Malaria/Diarrheal Disease (D/E)
7. Preventable Illness (D/E)
8. Vaccination Campaign (All, high impact in D/E)
9. Family Migrates for Work (C/D)
10. Natural Disaster (Flood/Drought) (C/D/E)
11. Parent Loses Job (All)
12. Parent Dies (All, weighted by profile)
13. Sibling Dies (D/E common, A/B rare)
14. Start School (All)
15. Violence in Household (All, higher in C/D/E)

#### Adolescent Events (Age 13-25) - 15 cards

**Universal**
1. First Love
2. Identity Crisis
3. Rebellion Phase
4. Strange Encounter (Life-Changing Conversation)
5. You Save Someone's Life

**Profile-Weighted**
6. Scholarship Offered (All, requires literacy)
7. Forced to Work (Leave School) (D/E)
8. Gang/Militia Recruitment (E, urban C)
9. Early Marriage/Pregnancy (D/E, girls)
10. Violence (Assault, Conflict) (C/D/E)
11. Drug/Alcohol Exposure (All)
12. Mental Health Crisis (All, higher in A/B awareness)
13. Traffic Accident (C/D/E)
14. Natural Disaster Displacement (D/E)
15. Win Small Lottery/Opportunity (All)

#### Adult Events (Age 26-60) - 12 cards

1. Career Success
2. Marriage/Partnership
3. Have Children
4. Chronic Illness Develops
5. Parent Dies (Elder)
6. Lose Job/Economic Crisis
7. Divorce/Separation
8. Achieve Dream
9. Serious Accident
10. Windfall (Inheritance, Lottery)
11. Forced Migration
12. Reconcile with Estranged Person

#### Elder Events (Age 60+) - 8 cards

1. Grandchildren
2. Retirement
3. Health Decline
4. Outlive Spouse/Partner
5. Dementia Onset
6. Cancer Diagnosis
7. Fall/Injury
8. Peaceful Decline

---

### Cause of Death Cards (30 cards, age-stratified)

#### Infant/Child (0-5)
1. Diarrheal Disease
2. Pneumonia
3. Malaria
4. Malnutrition
5. Congenital Defect
6. Accident (Drowning, Fire)
7. Preventable Illness

#### Child/Teen (6-18)
8. Infectious Disease
9. Accident (Traffic, Drowning)
10. Violence (Armed Conflict)
11. Preventable Disease
12. Suicide

#### Adult (19-60)
13. Heart Disease
14. Cancer
15. Traffic Accident
16. Violence (Homicide, Conflict)
17. Suicide
18. Infectious Disease (HIV, TB)
19. Maternal Mortality (Childbirth)
20. Diabetes
21. Liver Disease (Alcohol)
22. Drug Overdose
23. Workplace Accident

#### Elder (60+)
24. Heart Disease
25. Cancer
26. Stroke
27. Dementia/Alzheimer's
28. Pneumonia
29. Falls/Injury
30. Old Age (Peaceful)

---

## GAME MECHANICS

### Survival Number

**Starting Survival (based on birth cards):**
- Profile A + Stable Family: 98 (infant year)
- Profile B + Moderate Family: 92
- Profile C + Moderate Family: 85
- Profile D + Unstable Family: 40
- Profile E + Any Family: 30

**Age-Based Changes:**
- Infant (0-1): Lowest survival
- Child (2-12): Improves +5-10 depending on profile
- Teen (13-18): Slight decline (violence, risk-taking)
- Adult (19-60): Stable, but chronic disease starts
- Elder (60+): Declines -2 per year

**Event Modifiers:**
- Parent dies (age 0-12): -15
- Parent dies (age 13+): -5
- Serious illness: -10
- Good healthcare access: +5
- Economic stability: +3
- Education completed: +2

### Resources (0-100+)

**Uses:**
- Buy out of bad events (if option exists)
- Improve survival odds
- Enable certain choices

**Sources:**
- Born wealthy: Start with 50
- Job/Career: +10-30 per event
- Inheritance: +20-50
- Lose job: -20

### Agency Points (0-10)

**Uses:**
- Make meaningful choices when offered
- Reroll one death check per point spent
- Force a specific event draw

**Sources:**
- Reach age 18: Gain 1
- Education completed: Gain 1
- Career success: Gain 1
- Rare events: Gain 1

---

## DEATH CHECK SYSTEM

**Timing:**
- Age 0-1: Every 3 months (4 checks)
- Age 2-12: Every year
- Age 13-60: Every year
- Age 60+: Every year (accelerating risk)

**Roll Mechanic:**
```javascript
function deathCheck(player) {
  const roll = Math.floor(Math.random() * 100) + 1; // 1-100
  
  if (roll > player.survival) {
    // Player dies
    player.alive = false;
    player.causeOfDeath = drawDeathCard(player.age, player.profileTags);
    return false;
  }
  
  return true; // Survived
}
```

**Cause of Death Selection:**
- Filter death cards by age range
- Weight by profile tags
- Draw randomly from filtered set

---

## SCORING SYSTEM

**Points Awarded:**

1. **Survival Points**
   - Each year survived: +1 point
   - Bonus multiplier based on difficulty:
     - Profile A: 1x
     - Profile B: 1.5x
     - Profile C: 2x
     - Profile D: 3x
     - Profile E: 5x

2. **Achievement Points**
   - Reached Age 18: +10
   - Reached Age 60: +20
   - Reached Age 80: +50
   - Education completed: +15
   - Career success: +10
   - Had children: +5
   - Survived near-death: +10 each

3. **Agency Points Remaining**
   - Each unspent: +5

**Example:**
- Profile E player survives to age 25
- Base: 25 years × 1 = 25
- Multiplier: 25 × 5 = 125
- Bonuses: Reached 18 (+10), Education (+15), 2 Agency (+10)
- Total: 160 points

**Comparison:**
- Profile A player survives to age 85
- Base: 85 years × 1 = 85
- Multiplier: 85 × 1 = 85  
- Bonuses: All milestones (+95)
- Total: 180 points

*(Profile E surviving to 25 is nearly as impressive as Profile A living full life)*

---

## UI REQUIREMENTS

### Main Screen
- Player stats (Age, Survival %, Resources, Agency)
- Current cards in play (Birth, Family)
- Event history log
- Action buttons (Draw Event, End Turn, Use Agency)

### Card Display
- Card art/icon
- Title
- Description
- Effects shown clearly
- Choice buttons (if applicable)

### Death Screen
- Age at death
- Cause of death card
- Life summary (key events)
- Final score
- "Play Again" button

---

## IMPLEMENTATION CHECKLIST

### Phase 1: Core Systems (Day 1)
- [ ] Card data structure (JSON)
- [ ] Player state object
- [ ] Weighted card draw function
- [ ] Death check roll function
- [ ] Age progression function

### Phase 2: Card Content (Day 1-2)
- [ ] 15 Birth Geography cards (JSON)
- [ ] 12 Family Structure cards (JSON)
- [ ] 50 Event cards (JSON, age-stratified)
- [ ] 30 Cause of Death cards (JSON)

### Phase 3: Game Loop (Day 2)
- [ ] Birth phase (draw 2 cards, set stats)
- [ ] Year phase (age up, draw events, resolve)
- [ ] Death check integration
- [ ] Game over state

### Phase 4: UI (Day 2-3)
- [ ] Card display component
- [ ] Player stats display
- [ ] Event log
- [ ] Choice buttons
- [ ] Death screen

### Phase 5: Playtest & Iteration (Day 3+)
- [ ] Balance survival numbers
- [ ] Test event variety
- [ ] Verify scoring feels fair
- [ ] Check for broken combos
- [ ] Add juice (animations, sound?)

---

## FILE STRUCTURE

```
/mortality-lottery
  /data
    birth-cards.json
    family-cards.json
    event-cards-childhood.json
    event-cards-teen.json
    event-cards-adult.json
    event-cards-elder.json
    death-cards.json
  /src
    /lib
      card-engine.js      // Draw, shuffle, weight functions
      game-state.js       // Player state management
      death-check.js      // Roll logic
      scoring.js          // Point calculation
    /components
      Card.jsx
      PlayerStats.jsx
      EventLog.jsx
      DeathScreen.jsx
    App.jsx
    main.jsx
  index.html
  package.json
```

---

## SAMPLE CARD DATA

### birth-cards.json
```json
[
  {
    "id": "birth_nordic",
    "type": "birth",
    "name": "Nordic Country",
    "weight": 1,
    "description": "Born in a Nordic welfare state. Congratulations, you won the lottery.",
    "profileTags": ["high-resource", "stable", "urban"],
    "effects": {
      "statSet": {
        "survival": 98
      },
      "resourceMod": 30
    }
  },
  {
    "id": "birth_rural_africa",
    "type": "birth",
    "name": "Rural Sub-Saharan Africa",
    "weight": 23,
    "description": "Born in a rural village. Resources are scarce, but community is strong.",
    "profileTags": ["low-resource", "rural", "agrarian"],
    "effects": {
      "statSet": {
        "survival": 50
      },
      "resourceMod": -10
    }
  },
  {
    "id": "birth_conflict_zone",
    "type": "birth",
    "name": "Active War Zone",
    "weight": 5,
    "description": "Born during active conflict. Survival is not guaranteed.",
    "profileTags": ["conflict", "unstable", "extreme-risk"],
    "effects": {
      "statSet": {
        "survival": 35
      },
      "resourceMod": -20
    }
  }
]
```

### event-cards-childhood.json
```json
[
  {
    "id": "event_sibling_dies",
    "type": "event",
    "name": "Sibling Dies",
    "ageRange": [0, 12],
    "description": "Your younger sibling dies from preventable disease.",
    "profileTags": ["low-resource", "conflict"],
    "weight": 15,
    "effects": {
      "survivalMod": 3
    },
    "flavor": {
      "high-resource": "A rare tragedy that reshapes your family forever.",
      "low-resource": "Grief is familiar here. The family continues."
    }
  },
  {
    "id": "event_parent_dies",
    "type": "event",
    "name": "Parent Dies",
    "ageRange": [0, 18],
    "description": "Your mother/father dies. Everything changes.",
    "profileTags": ["all"],
    "weight": 8,
    "effects": {
      "survivalMod": -15,
      "resourceMod": -10
    },
    "ageModifiers": {
      "0-2": { "survivalMod": -30 },
      "3-12": { "survivalMod": -15 },
      "13-18": { "survivalMod": -5 }
    }
  },
  {
    "id": "event_scholarship",
    "type": "event",
    "name": "Scholarship Offered",
    "ageRange": [13, 18],
    "description": "Someone notices your potential and offers educational support.",
    "profileTags": ["low-resource", "emerging"],
    "weight": 5,
    "choices": [
      {
        "text": "Accept: Pursue education",
        "requires": { "literacy": true },
        "effects": {
          "survivalMod": 5,
          "agencyMod": 1,
          "tags": ["educated"]
        }
      },
      {
        "text": "Decline: Keep working to support family",
        "effects": {
          "resourceMod": 10
        }
      }
    ]
  }
]
```

---

## BALANCING NOTES

### Target Outcomes (10,000 simulated games)

**Profile A:**
- 95% reach age 18
- 80% reach age 60
- 50% reach age 80
- Average lifespan: 78 years

**Profile C:**
- 85% reach age 18
- 60% reach age 60
- 20% reach age 80
- Average lifespan: 68 years

**Profile E:**
- 55% reach age 18
- 25% reach age 60
- 5% reach age 80
- Average lifespan: 42 years

### Tuning Knobs
- Starting survival numbers
- Event frequency by age
- Death check frequency
- Modifier magnitudes
- Agency point costs/gains

---

## PROTOTYPE SUCCESS CRITERIA

**Playable:**
- Can complete full game (birth → death)
- 15-30 min playtime
- No major bugs/softlocks

**Engaging:**
- Decisions feel meaningful
- Randomness feels fair (not totally arbitrary)
- Player wants to replay with different spawns

**Educational:**
- Players notice disparity between profiles
- Conversations emerge about inequality
- Statistics feel grounded, not arbitrary

---

## NEXT STEPS AFTER PROTOTYPE

1. **Expand card pool** (200+ events)
2. **Add multiplayer** (race mode, co-op)
3. **Improve UI/UX** (animations, better visual design)
4. **Sound design** (card draw, death toll, ambience)
5. **Balancing pass** (based on real playtests)
6. **Mobile responsiveness**
7. **Analytics** (track win rates, common death causes)
8. **Narrative polish** (better flavor text, humor)
9. **Accessibility** (screen reader support, colorblind modes)
10. **Monetization?** (Cosmetics, expansion packs, donate to charity orgs)

---

**BUILD THIS FIRST. ITERATE LATER.**

The goal is a playable prototype by end of weekend.
Focus on: Birth → Events → Death check → Replay loop.
Everything else is polish.

Let's fucking go. 🔥