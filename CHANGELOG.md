# CHANGELOG

## v2.0 - Homeostatic State System (IN DEVELOPMENT)

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
