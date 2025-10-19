# CHANGELOG

## v2.3 - Contextual Death System & Causal Chains (Phase 2C - IN PROGRESS)

### Death Causes as Consequences
- **Poverty Chain**: Low resources (< 0) → 3x malnutrition/starvation, 2.5x disease risk
- **Chronic Disease Chain**: Diabetes → 3x heart disease/kidney failure, stroke risk
- **Mental Health Chain**: Depression (< 20) → 5x suicide risk, 2x accident/overdose
- **Addiction Chain**: Dependent → 10x overdose, 5x liver cirrhosis, 3x accident
- **Incarceration Chain**: Prison → 3x violence, 2x TB/suicide risk
- **Regional Context**: War zones → 5x conflict death, endemic disease regions → 2x disease
- **Age Stratification**: Infants → 3x birth defects, elderly (70+) → 4x heart disease
- **Isolation Effect**: No friends + low social connection → 2x suicide/accident/overdose

### System Philosophy
Deaths are now CONSEQUENCES not RANDOM EVENTS. A diabetic person doesn't randomly die from heart disease—their diabetes increases heart disease risk. A poor person doesn't randomly starve—they lack access to food. This creates realistic causal chains without explicit event systems.

### Integration
- No new events needed—system uses existing player state
- Weights update dynamically each year based on circumstances
- Multiple risk factors stack (poverty + depression + addiction = very high-risk death profile)
- Remains probabilistic but causally grounded

---

## v2.2 - Crime System Demographic Realism & Regional Justice (Phase 2B - COMPLETED)

### Crime System Refactoring
- **Separated Crime Pathways**:
  - Street crime (poverty-driven): theft, burglary, assault (ages 15-35 peak)
  - White-collar crime (education-enabled): embezzlement, fraud (ages 35-55 peak)
- **Age-Stratified Crime Risk**:
  - Peak ages 18-35: ~250/100K (street crime)
  - Ages 35-55: ~150/100K (white-collar + street)
  - Ages 65+: ~50/100K (reduced opportunity)
  - Youth <18: Very low (legal accountability differs)
- **Education/Wealth Paradox**:
  - Education reduces street crime 70-90% (opportunity cost, access to jobs)
  - Education enables white-collar crime (access to systems, planning ability)
  - Wealth both prevents poverty crime AND enables fraud/embezzlement
- **Protective Factors Applied**:
  - Stable employment: -50% street crime risk
  - Marriage/family: -30% overall crime risk
  - Mental health treatment: -20% crime risk
  - Poverty + unemployment + isolation: +300% street crime risk

### Regional Justice System Framework
- **Nordic Model** (Nordic Country): 0.5x severity, rehabilitation focus, 1-5 year sentences
- **Moderate Systems** (North America, UK, Eastern Europe, Latin America): 0.8-1.2x, 3-12 years
- **Harsh Systems** (Middle East, Sub-Saharan Africa, Southeast Asia, War Zones): 1.3-2.0x, 5-25 years
- **White-Collar Differential**: Generally 40-50% lighter sentences than street crime across all systems
- **Prior Convictions**: Escalate sentences +2 years per conviction

### Sentencing Data Basis
- UN World Prison Brief data
- Sentencing Project statistics
- Regional criminal code documentation
- Death penalty status by region (incorporated for context)

### Suicide Age Constraint
- **Minimum age 15** for suicide attempts (psychological development)
- Age-stratified risk: Peak 15-24 (20-25 per 100K), secondary peak 65+ (15-18 per 100K)
- Childhood trauma recorded but suicide risk only activates post-puberty

---

## v2.1 - Statistical System Calibration (Phase 2A - COMPLETED)

### Probability Tuning
- **Addiction**: Base onset multiplied 4x (0.1% → 0.4%) to reach 4% prevalence target ✓
- **Mental Health Crisis**: Threshold lowered from 12m<30 to 6m<35 for earlier detection ✓
- **Suicide Base Risk**: Increased (0.01% → 0.15%) with unit fix for proper scaling ✓
- **Crime Base Risk**: Increased for economic desperation ages 15-35 ✓
- **Regional Starting Resources**: Added wealth variation (poorest: 2-5, wealthy: 25-40) ✓

### Critical Bug Fixes
- **Suicide Risk Unit Mismatch**: Fixed comparison of 0.01-3.0% risk vs 0-100 scale roll
- **Death Cause Override**: Suicide/overdose deaths now properly recorded (not overwritten by random death)
- **Infant Suicide**: Prevented by adding age >= 15 minimum

### System Improvements
- Regional multipliers framework implemented
- Test suite updated to track against real-world statistics
- Calibration validation completed

---

## v2.0 - Homeostatic State System

### Major Changes
- **Expanded Player State**: Replaced simple tag system with structured homeostatic model
  - Demographics (sex, birthYear, birthRegion)
  - Health systems (physical, mental, reproductive with drift mechanics)
  - Relationships (parents, siblings, partner, children, social)
  - Economics (income, resources, debt, assets)
  - Development (education, skills, cognitive stages)
  - Circumstances (location, legal, housing, vulnerability)

- **Event Prerequisite Engine**: Events now use complex gate conditions
  - Nested state queries (e.g., `relationships.parents.mother.alive`)
  - Operators: `==`, `>`, `<`, `>=`, `<=`, `includes`
  - Logical operators: `all`, `any`, `not`
  - Example: Childbirth requires `sex: female AND age: 15-45 AND pregnant: true`

- **Homeostatic Drift**: Systems naturally progress toward equilibrium
  - Health recovers toward baseline (with drift rate)
  - Chronic conditions lower baseline permanently
  - Economics processes income vs expenses
  - Relationships drift based on presence/quality
  - Cognitive development phases (childhood → adolescent → adult → decline)

- **Complex Event Effects**: Events can modify multiple states
  - Nested state changes (`health.physical.baseline: -15`)
  - Array operations (add/remove conditions, relationships)
  - Conditional effects (apply if state meets criteria)
  - Follow-up events (pregnancy → +9mo → childbirth)
  - Probabilistic outcomes (2% maternal mortality, etc.)

### New Event Categories
- Sex-gated: Pregnancy, childbirth, prostate cancer, menopause
- Life-stage: Puberty, first love, career progression, retirement
- Relationship events: Parent death, sibling birth, marriage, divorce
- Health crises: Acute illness, chronic diagnosis, recovery, therapy
- Economic: Job loss, inheritance, debt, homelessness
- Social: Isolation, community integration, friendship, conflict
- Educational: Literacy, schooling, scholarship, dropout

### Breaking Changes
- Old event format no longer supported
- Player state structure completely redesigned
- Survival calculation now based on all system states

### Migration Guide
See `ARCHITECTURE.md` for event conversion examples.

---

## v1.0 - Initial Release (October 2025)

### Features
- 15 birth locations with life expectancy data (real WHO statistics)
- 12 family structures affecting starting stats
- 50+ event cards (childhood, teen, adult)
- 30 death causes (age and profile-stratified)
- Scoring system with difficulty multipliers
- Life expectancy tracking (years over/under expectancy)
- Voluntary fold mechanic (quit anytime, -30% penalty)
- Standalone HTML version (no build tools)
- React component version
- Simulation script for balance testing

### Core Mechanics
- Weighted random card draws
- Annual death checks (roll d100 vs survival %)
- Age-based event frequency
- Profile tags for event compatibility
- Milestone bonuses (age 18, 60, 80)
- Life expectancy bonus (+10 pts/year over expectancy)
