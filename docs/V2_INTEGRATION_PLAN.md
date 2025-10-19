# 🔧 V2.0 Integration Plan

**Status:** Starting integration  
**Target:** Fully functional v2.0 game engine  
**Effort:** 4-6 hours  
**Date Started:** October 19, 2025

---

## 🎯 Goals

1. **Event Migration:** Convert 50+ v1.0 events to v2.0 format
2. **Engine Integration:** Connect `game_engine_v2_homeostatic.js` to playable game
3. **UI Display:** Show rich state (health, economics, relationships, education)
4. **Testing:** Run 10,000-game simulation to validate balance
5. **Deployment:** Update `standalone_html_game.html` and React component

---

## 📋 Phase 1: Event Migration

### Status: ✅ COMPLETE

### What's Needed
- Parse `event_cards_childhood.json`, `event_cards_teen.json`, `event_cards_adult.json`
- Convert each event from v1.0 → v2.0 format
- Validate prerequisites match state structure
- Test with prerequisite evaluation engine

### v1.0 → v2.0 Format

**v1.0:**
```json
{
  "name": "Parent Dies",
  "ageRange": [0, 80],
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
  "ageRange": [0, 80],
  "requires": {
    "any": [
      { "relationships.parents.mother.alive": true },
      { "relationships.parents.father.alive": true }
    ]
  },
  "effects": [
    {
      "path": "health.mental.current",
      "type": "modify",
      "value": -15
    },
    {
      "path": "economics.resources.current",
      "type": "modify",
      "value": -15
    },
    {
      "conditional": {
        "if": { "relationships.parents.mother.alive": true },
        "then": { "relationships.parents.mother.alive": false }
      }
    }
  ]
}
```

### Conversion Strategy

1. **Low-risk events first** (no complex prerequisites)
   - Simple stat modifiers (survivalMod → health.physical.current)
   - Add basic age gates → requires object
   - ~20 events, 1-2 hours

2. **Medium-risk events** (some conditional logic)
   - Resource loss events → economics.resources.current
   - Health events → health.physical/mental.current
   - ~20 events, 2-3 hours

3. **High-complexity events** (sex-gated, conditional chains)
   - Pregnancy, childbirth, menopause
   - Career progression, education
   - Family structure-dependent
   - ~10 events, 1-2 hours

---

## 🔌 Phase 2: Engine Integration

### Status: ✅ COMPLETE

### What Was Done
✅ Created `game_engine_integrated.js` - wrapper class that:
  - Wraps `MortalityGameV2` as internal engine
  - Provides v1.0-compatible API for HTML/React
  - Implements `createPlayer()`, `nextYear()`, `foldLife()`, `calculateScore()`
  - Auto-maps v2.0 state to v1.0 fields for UI compatibility
  - Includes `runSimulation()` for balance testing

✅ Updated `standalone_html_game.html` to:
  - Load `game_engine_v2_homeostatic.js` and `game_engine_integrated.js`
  - Async load game data from JSON files (with fallback)
  - Use `MortalityGameIntegrated` instead of v1.0 engine
  - Call `game.nextYear()` for yearly loop
  - Call `game.foldLife()` for voluntary quit
  - Display v2.0 state in UI (health, resources, community)
  - Auto-update all functions to use new API

✅ React component needs update (next step):
  - Will be similar to HTML: use integrated engine
  - Maintain component state = game.player
  - Wire up events and UI interactions

### API Changes Completed (v1.0 → v2.0)

| v1.0 | v2.0 | Status |
|------|------|--------|
| `player.survival` | `player.health.physical.current` | ✅ Mapped in updateCompatibilityFields() |
| `player.resources` | `player.economics.resources.current` | ✅ Mapped in updateCompatibilityFields() |
| `player.agency` | `player.relationships.social.community` | ✅ Mapped in updateCompatibilityFields() |
| `applyCardEffects(card)` | `applyEventEffects(event)` | ✅ Implemented in v2.0 engine |
| `deathCheck()` | `calculateDeathProbability()` | ✅ v2.0 integrated |
| None | `processYearEnd()` | ✅ Called in nextYear() |
| None | `driftHealth()`, `driftEconomics()` | ✅ Part of processYearEnd() |

---

## 📊 Phase 3: UI Display

### Status: NOT STARTED

### What v1.0 Shows
- Age (large number)
- Survival % (bar)
- Resources (counter)
- Agency (counter)
- Event log (history)

### What v2.0 Should Show
- Age (large number) ✅ same
- **Health Status** (new)
  - Physical health: 45/100 (color bar)
  - Mental health: 72/100 (color bar)
  - Reproductive: fertile, not pregnant, 2 children
  - Chronic conditions: diabetes (baseline -15)
- **Economics** (new)
  - Income: $15,000/year
  - Resources: $8,500
  - Debt: $0
  - Employment: Software Engineer since age 22
- **Relationships** (expanded)
  - Parents: mother alive (80), father deceased
  - Partner: married to Alex (18 years)
  - Children: 3 (ages 15, 12, 8)
  - Friends: 8
  - Social integration: 72/100
- **Development** (new)
  - Education: Bachelor's degree
  - Literacy: yes
  - Cognitive stage: adult
- **Circumstances** (new)
  - Location: Urban, safe
  - Housing: Owned home
  - Legal status: Citizen

### UI Strategy
1. Keep v1.0 style (dark theme, clean)
2. Add collapsible sections for each state subsystem
3. Use color coding: 🟢 healthy, 🟡 moderate, 🔴 critical
4. Show deltas on yearly update (+5 health, -$2k resources, etc.)
5. Keep event log for narrative continuity

---

## 📊 Phase 3: Testing & Balance

### Status: 🚀 IN PROGRESS

Next steps:
- [ ] Run integration test: Load JSON files, create player, run 10 years
- [ ] Run full simulation: 1,000 games with converted events
- [ ] Validate survival curves match WHO data
- [ ] Check prerequisite gates (sex-specific, age-specific events)
- [ ] Tune homeostatic drift if needed
- [ ] Verify score distribution looks reasonable

### What to Test
1. **Event prerequisite evaluation**
   - Does `requires` correctly gate events?
   - Do sex-gated events work (pregnancy only for females)?
   - Do age gates work?

2. **Homeostatic drift**
   - Do health stats drift toward baseline?
   - Do economic stats recover from shocks?
   - Do relationships change realistically?

3. **Survival calculations**
   - Do high-health players survive more?
   - Do chronic conditions permanently affect survival?
   - Does age-stratified death work?

4. **Balance metrics**
   - Average lifespan by region (should match real life expectancy ±5 years)
   - Fold rate (% of games ending in fold vs natural death)
   - Score distribution (min/max/avg)
   - Event frequency (no events dominating)

### Testing Script
```bash
# Run 10,000 simulations
node simulation_script.js --games 10000 --engine v2.0 --report balance

# Output: 
# - Average lifespan per region
# - Death cause distribution
# - Event frequency analysis
# - Score percentiles
# - Anomaly detection
```

---

## 🚀 Phase 5: Deployment

### Status: ⏳ WAITING (After testing)

### What Changes
1. **`standalone_html_game.html`**
   - Update game engine from v1.0 to v2.0
   - Update UI HTML to show v2.0 state
   - Maintain v1.0 gameplay feel (one year at a time)

2. **`game_engine_core.js`**
   - Option A: Replace entirely with v2.0 (breaking change)
   - Option B: Wrap v2.0 with v1.0 API adapter (backward compatible)

3. **`react_game_component.js`**
   - Update to use v2.0 engine
   - Add state display for v2.0 properties

4. **Version Bump**
   - Update to v2.0 in file headers
   - Update CHANGELOG.md with completion date
   - Tag git release as v2.0-integrated

### Deployment Checklist
- [ ] Event migration complete and tested
- [ ] Engine integration complete
- [ ] UI displays v2.0 state correctly
- [ ] 10,000-game simulation passes balance checks
- [ ] No regressions in v1.0 gameplay feel
- [ ] All 4 files updated (HTML, core.js, react.js, card JSON)
- [ ] Git commit + push to main
- [ ] GitHub release notes

---

## 📈 Success Criteria

✅ **Event Migration:** 50+ events converted, all prerequisites evaluate correctly  
✅ **Integration:** Game runs with v2.0 engine, no console errors  
✅ **UI:** All 6 state subsystems visible and updating correctly  
✅ **Balance:** 10,000-game average lifespan within 5 years of real data  
✅ **Performance:** Game runs smoothly, no lag on yearly tick  
✅ **Playability:** Game feels as engaging as v1.0, maybe more  

---

## 🗓️ Timeline Estimate

| Phase | Estimate | Start | Target | Status |
|-------|----------|-------|--------|--------|
| Event Migration | 1.5-2 hrs | Oct 19 | Oct 19 evening | ✅ DONE (0.5hr) |
| Engine Integration | 1-1.5 hrs | Oct 19 | Oct 19 night | ✅ DONE (1.5hr) |
| Testing & Balance | 1-2 hrs | Oct 20 | Oct 20 morning | 🚀 NEXT |
| UI Display | 1-2 hrs | Oct 20 | Oct 20 afternoon | ⏳ After testing |
| Deployment | 0.5-1 hr | Oct 20 | Oct 20 evening | ⏳ After testing |
| **TOTAL** | **5-8.5 hrs** | | **Oct 20 evening** | 👉 On track |

---

## 📝 Notes

- All event migration code can be scripted (parse → convert → validate)
- UI updates are straightforward (add HTML sections, wire up state properties)
- Testing is automated (simulation script already exists)
- v2.0 architecture is solid; this is engineering, not design

---

**Next Action:** Start Phase 1 - Event Migration  
**Who:** You (or AI assistant if scripted)  
**Duration:** ~2 hours  

*Let's ship v2.0! 🚀*
