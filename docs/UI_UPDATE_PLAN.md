# 🎨 UI UPDATE PLAN - V2.0 State Display

**Priority:** 🔴 HIGH (Critical for usability)  
**Status:** 🚀 IN PROGRESS  
**Estimated Time:** 2-3 hours  
**Date Started:** October 19, 2025

---

## 🎯 Goals

1. **Show full v2.0 state** - Health, economics, relationships, development, circumstances
2. **Explain what's happening** - State changes, event effects, death reasons
3. **Enable informed decisions** - Player understands their situation
4. **Reduce confusion** - Current minimal UI leaves players guessing

---

## 📊 Current UI Problems

### What v1.0 Shows (4 stats)
```
Age: 32
Health: 67%
Resources: $150
Community: 45%
```

### What v2.0 Tracks But DOESN'T Show (30+ properties)
❌ Physical health vs mental health (separate!)  
❌ Health baseline vs current (chronic conditions!)  
❌ Income vs resources vs debt  
❌ Parents alive/dead/relationship quality  
❌ Partner status, children, friends  
❌ Education level, literacy, skills  
❌ Location (urban/rural), housing, citizenship  
❌ Why did they die? (cause, age, health factor)  
❌ What did the event do? (specific stat changes)  
❌ What changed this year? (drift, events, aging)

**Result:** Players have no idea what's going on! 😕

---

## 🎨 UI Redesign

### Current Layout (Minimal)
```
┌─────────────────────────────────────┐
│         MORTALITY LOTTERY           │
├─────────────────────────────────────┤
│  [Stats: Age, Health, Resources]    │
│  [Birth Card Info]                  │
│  [Play Year] [Auto] [Fold]          │
│  [Event Log]                        │
└─────────────────────────────────────┘
```

### Proposed Layout (Rich)
```
┌──────────────────────────────────────────────────────────┐
│                MORTALITY LOTTERY - Age 32                │
├──────────────────────────────────────────────────────────┤
│ [PRIMARY STATS: Age, Health Score, Survival %]           │
├──────────────────────────────────────────────────────────┤
│ ▼ HEALTH STATUS (Click to expand)                        │
│   Physical: 67/100 [=====>    ]  Chronic: None           │
│   Mental: 72/100   [======>   ]                          │
│   Reproductive: Fertile, Not Pregnant                    │
├──────────────────────────────────────────────────────────┤
│ ▼ ECONOMICS                                              │
│   Income: $8,500/year   Resources: $1,250   Debt: $0    │
├──────────────────────────────────────────────────────────┤
│ ▼ RELATIONSHIPS                                          │
│   Parents: Mother (alive), Father (alive)                │
│   Partner: Married to Alex (8 years)                     │
│   Children: 2 (ages 5, 8)                                │
│   Friends: 6   Community: 45/100                         │
├──────────────────────────────────────────────────────────┤
│ ▼ DEVELOPMENT                                            │
│   Education: Secondary (10 years)   Literate: Yes        │
│   Skills: Agriculture, Trade                             │
│   Cognitive: Adult stage                                 │
├──────────────────────────────────────────────────────────┤
│ ▼ CIRCUMSTANCES                                          │
│   Location: Urban, Safe   Housing: Owned, Good Quality   │
│   Employment: Farmer      Legal Status: Citizen          │
├──────────────────────────────────────────────────────────┤
│ [LIVE 1 YEAR] [AUTO-PLAY] [FOLD LIFE]                   │
├──────────────────────────────────────────────────────────┤
│ LAST YEAR'S EVENTS:                                      │
│  Age 31: "Got Promoted" (+500 resources)                 │
│  Age 31: "Son born" (-1000 resources)                    │
│  Age 32: "Recovered from cold" (+15 health)              │
└──────────────────────────────────────────────────────────┘
```

---

## 🛠️ Implementation Steps

### Step 1: Add CSS for Collapsible Sections
- ✅ Styles for expandable sections
- ✅ Color coding: 🟢 good, 🟡 moderate, 🔴 critical
- ✅ Progress bars for numeric ranges
- ✅ Icons for different states

### Step 2: Refactor HTML Structure
- ✅ Create section divs for each state subsystem
- ✅ Add toggle buttons with open/close indicators
- ✅ Add detail rows with formatted values
- ✅ Add visual indicators (colors, icons)

### Step 3: Update updateUI() Function
- ✅ Populate all 6 state subsystems
- ✅ Format numbers appropriately (money, percentages, ages)
- ✅ Show color coding based on values
- ✅ Show state changes (+/- indicators)

### Step 4: Enhance Event Log
- ✅ Show event name AND effects
- ✅ Show state modifiers (e.g., "+5 health", "-$100 resources")
- ✅ Color code positive/negative changes
- ✅ Show age and year clearly

### Step 5: Improve Death Screen
- ✅ Show detailed death cause
- ✅ Show contributing factors (health, age, disease)
- ✅ Show full life summary
- ✅ Show achievements/milestones reached

---

## 📋 Specific UI Changes

### 1. Birth Card Display
**Current:**
```
Your Birth Conditions
Born in: Nordic Country
Family: Two Parents - Stable
```

**Improved:**
```
YOUR BIRTH CONDITIONS
Region: Nordic Country (83 year life expectancy)
Family: Two Parents - Stable (+10 health, +20 resources)
Starting Health: 98%
Starting Resources: $30
Difficulty Multiplier: 1x
```

### 2. Stats Section
**Current:**
```
Age: 32
Health: 67%
Resources: $150
Community: 45%
```

**Improved:**
```
PRIMARY STATS
Age: 32 years | Life Expectancy: 83 | Years Remaining: ~51
Health Score: 67/100 [====>    ] (Moderate) | Survival Chance: 92%
Resources: $1,250 monthly income, $5,000 in savings
Community Integration: 45/100 [====>    ] (Moderate)
```

### 3. Health Details
**Current:** (Hidden)

**New:**
```
▼ HEALTH STATUS
Physical Health: 67/100 [====>    ] (Good)
  └ Baseline: 75 | Current: 67 | Recovery rate: 3/year
  └ Chronic conditions: None

Mental Health: 72/100 [======>   ] (Good)
  └ Baseline: 65 | Current: 72 | Recovery rate: 2/year
  └ Recent stress: None

Reproductive: Fertile (female, 38 years old)
  └ Pregnant: No | Children born: 2 | Menarche: Yes
```

### 4. Economics Details
**New:**
```
▼ ECONOMICS
Income: $8,500/year (Software Engineer)
  └ Employed: Yes | Occupation: Software Engineer
  └ Baseline: $0 | Current: $8,500

Resources: $5,000 (Monthly budget: -$500)
  └ Current: $5,000 | Baseline: $3,000
  └ Drift: -5 yearly (expenses exceed income)

Debt: $0
Assets: Home, Vehicle
```

### 5. Relationships Details
**New:**
```
▼ RELATIONSHIPS
Parents:
  └ Mother: Alive (age 65), Relationship: 75/100
  └ Father: Deceased (died age 78)

Partner: Married to Alex (married 8 years)
  └ Relationship quality: 80/100

Children: 2
  └ Sarah: age 8 | James: age 5

Social:
  └ Friends: 6 people
  └ Community integration: 45/100
  └ Isolation: No
```

### 6. Event Details
**Current:**
```
Age 32: Career Success
```

**Improved:**
```
Age 32: Career Success ⬆️
  • Physical health: +5 (new: 72)
  • Resources: +$30k (new: $8,500)
  • Mental health: Better
```

### 7. Death Screen
**Current:**
```
GAME OVER
You died at age 73
Score: 450 points
```

**Improved:**
```
GAME OVER - Death at Age 73

CAUSE OF DEATH: Chronic Heart Disease
Contributing factors:
  • Age: 73 (high mortality risk)
  • Physical health: 42/100 (critical)
  • Lifestyle: Sedentary (risk factor)
  • Smoking history: Yes (risk factor)

YOUR LIFE:
  Region: Nordic Country (life expectancy: 83)
  Years lived: 73 (88% of expectancy)
  Major achievements:
    ✓ Reached age 60 (+20 pts)
    ✓ Exceeded life expectancy by 0 years
  
FINAL SCORE: 450 points
  Base: 73 × 1.0 = 73
  Milestones: +40 (60, 80 not reached)
  Life expectancy: +0
  Fold penalty: +0
```

---

## 🎨 CSS Additions Needed

```css
/* Collapsible sections */
.state-section {
  margin: 10px 0;
  border: 2px solid #444;
  border-radius: 8px;
  background: rgba(42, 42, 42, 0.9);
}

.section-header {
  padding: 12px 15px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  user-select: none;
}

.section-header:hover {
  background: rgba(78, 205, 196, 0.1);
}

.section-toggle {
  display: inline-block;
  width: 20px;
  height: 20px;
  line-height: 20px;
  text-align: center;
}

.section-content {
  display: none;
  padding: 15px 20px;
  border-top: 1px solid #444;
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
}

.section-content.open {
  display: block;
  max-height: 1000px;
}

/* State indicators */
.stat-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #333;
}

.stat-label {
  color: #999;
  font-size: 0.9rem;
  flex: 1;
}

.stat-value {
  color: #4ecdc4;
  font-weight: bold;
  flex: 1;
  text-align: right;
}

.stat-change {
  margin-left: 10px;
  padding: 0 5px;
  border-radius: 3px;
  font-size: 0.85rem;
}

.stat-change.positive {
  background: rgba(76, 175, 80, 0.3);
  color: #4caf50;
}

.stat-change.negative {
  background: rgba(244, 67, 54, 0.3);
  color: #f44336;
}

/* Color coding */
.status-good { color: #4caf50; }
.status-moderate { color: #ff9800; }
.status-critical { color: #f44336; }

/* Progress bars */
.progress-bar {
  width: 100%;
  height: 8px;
  background: #333;
  border-radius: 4px;
  overflow: hidden;
  margin-top: 3px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4caf50, #4ecdc4);
  transition: width 0.3s ease;
}

.progress-fill.moderate {
  background: linear-gradient(90deg, #ff9800, #ffb74d);
}

.progress-fill.critical {
  background: linear-gradient(90deg, #f44336, #ff6b6b);
}
```

---

## 🔄 JavaScript Changes Needed

### updateUI() Function
```javascript
function updateUI() {
  if (!player) return;

  // Update primary stats
  updatePrimaryStats();
  
  // Update collapsible sections
  updateHealthSection();
  updateEconomicsSection();
  updateRelationshipsSection();
  updateDevelopmentSection();
  updateCircumstancesSection();
  
  // Update event log with details
  updateEventLog();
}

function updateHealthSection() {
  const health = player.health;
  document.getElementById('health-content').innerHTML = `
    <div class="stat-row">
      <span class="stat-label">Physical Health</span>
      <span class="stat-value">
        ${Math.floor(health.physical.current)}/100
        <span class="stat-change positive">+5</span>
      </span>
    </div>
    <div class="progress-bar">
      <div class="progress-fill" style="width: ${health.physical.current}%"></div>
    </div>
    ...
  `;
}

// Similar functions for other sections
```

### Event Log with Details
```javascript
function updateEventLog() {
  document.getElementById('event-log').innerHTML = 
    player.eventHistory.slice().reverse().map(entry => {
      const event = EVENT_CARDS.find(e => e.id === entry.id);
      const effects = event?.effects || [];
      const effectsList = effects.map(e => 
        `${e.type === 'modify' ? '+' : ''}${e.value} ${e.path}`
      ).join(', ');
      
      return `
        <div class="log-entry">
          <strong>Age ${entry.age}:</strong> ${entry.event}
          ${effectsList ? `<span class="effects">(${effectsList})</span>` : ''}
        </div>
      `;
    }).join('');
}
```

---

## ⏱️ Time Estimate

| Task | Time | Notes |
|------|------|-------|
| CSS styling | 30 min | Collapsible sections, colors, progress bars |
| HTML structure | 30 min | Refactor into sections, add detail rows |
| JavaScript updateUI() | 60 min | Update all 6 subsystems + event log |
| Death screen | 30 min | Show cause, factors, achievements |
| Testing | 30 min | Verify all states display correctly |
| **Total** | **180 min** | **3 hours** |

---

## 🎯 Success Criteria

✅ **Health section** shows physical, mental, reproductive with baselines  
✅ **Economics section** shows income, resources, debt, assets  
✅ **Relationships section** shows family, partner, friends status  
✅ **Development section** shows education, skills, literacy  
✅ **Circumstances section** shows location, housing, employment  
✅ **Event log** shows specific stat changes with values  
✅ **Death screen** shows cause and contributing factors  
✅ **Collapsible sections** expand/collapse smoothly  
✅ **Color coding** helps at-a-glance understanding  
✅ **Mobile responsive** (still readable on small screens)  

---

## 🚀 Why This Matters

### Current State
Player sees: `Health: 67%`  
Player thinks: "OK, I'm at 67%, what does that mean?"  
Player is: Confused about mechanics

### Improved State
Player sees: 
```
Physical Health: 67/100 [=====>    ]
Mental Health: 72/100 [======>   ]
Chronic: None
Baseline: 75 (recovers 3/year)
```
Player thinks: "I'm recovering from something, should get better naturally"  
Player is: Informed about mechanics

---

## 📝 Notes

- All state data already exists in `player` object
- Just need to display it clearly
- Collapsible sections keep UI clean but info accessible
- Color coding helps quick understanding
- Progress bars make ranges visual
- Event details explain what happened

**UI is the last piece to complete v2.0 integration!**

---

*UI Update Plan created October 19, 2025*
