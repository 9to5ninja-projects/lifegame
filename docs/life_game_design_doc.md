# Life Simulation Game - Design Document
**Version:** 0.1-alpha  
**Last Updated:** 2025-10-18  
**Game Type:** Procedural Life Simulator (Game of Life × Oregon Trail)  
**Core Mechanic:** Birth conditions determine life trajectory through weighted probability systems

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Core Design Philosophy](#core-design-philosophy)
3. [System Architecture](#system-architecture)
4. [Demographic Profile System](#demographic-profile-system)
5. [Birth Roll System](#birth-roll-system)
6. [Random Event System](#random-event-system)
7. [Death System](#death-system)
8. [Data Requirements](#data-requirements)
9. [Implementation Roadmap](#implementation-roadmap)
10. [Research Checklist](#research-checklist)

---

## Project Overview

### Concept
A procedurally generated life simulator where players experience a human life from birth to death. Initial "birth rolls" determine starting conditions (geography, socioeconomic status, health, family structure) which heavily influence—but don't absolutely determine—life outcomes.

### Core Tension
**Determinism vs. Agency**: Some runs end before they begin (infant mortality, extreme poverty, conflict zones). Others offer genuine choice. The game doesn't shy away from inequality—it models it.

### Key Features
- Weighted demographic spawning based on real-world birth statistics
- 12-16 Life Condition Profiles derived from WHO/UN/World Bank data
- Random event deck that cuts across all socioeconomic strata
- Multiple causes of death weighted by age, region, and profile
- Replayability through radical variation in starting conditions

---

## Core Design Philosophy

### Design Principles
1. **Statistical Honesty**: Model real-world inequity without exploitation
2. **Backward-Build Architecture**: Define outcomes first, then assign cultural context
3. **Meaningful Randomness**: RNG serves narrative, not spectacle
4. **Respect for Variation**: No two runs feel the same
5. **Emergent Narrative**: Story comes from systems, not scripted events

### Ethical Considerations
- Avoid poverty tourism or "tragedy porn"
- Cultural flavor is additive, not reductive
- Death is modeled with gravity, not gamified frivolously
- Player agency matters, even when constrained by circumstance

---

## System Architecture

### Three-Tier Spawn System

```
BIRTH ROLL
    ↓
[1] Continental Region (weighted by real birth rates)
    ↓
[2] Life Condition Profile (weighted by regional demographics)
    ↓
[3] Cultural/Geographic Flavor (narrative context)
```

**Example Flow:**
1. Roll → Sub-Saharan Africa (23% global spawn weight)
2. Roll → Profile D: Rural Agrarian, Low Resource
3. Assign → Rural Ethiopia, Oromo-speaking, Orthodox Christian, highland climate

**Why This Works:**
- Mechanics come from Profile (health stats, education access, mortality risks)
- Story comes from Flavor (language, religion, geography, culture)
- Avoids stereotyping specific countries while modeling real conditions

---

## Demographic Profile System

### Profile Structure
Each profile contains:
- **Base Statistics** (mortality, life expectancy, health access)
- **Probability Modifiers** (event likelihood, death causes)
- **Milestone Triggers** (age-gated events and risks)
- **Agency Potential** (how much choice matters in this profile)

### Proposed Profiles (12-16 Total)

#### **Profile A: High Stability, High Resource**
- **Real-World Analogs**: Nordic countries, Japan, Switzerland, Singapore
- **Infant Mortality**: 2-5 per 1,000 live births
- **Life Expectancy**: 80-85 years
- **Healthcare Access**: 99%+ within 1 hour
- **Education Access**: 99% literacy, avg 13+ years schooling
- **Primary Causes of Death**: Heart disease (30%), cancer (25%), dementia (15%), accidents (5%)
- **Violence Index**: <1 per 100,000
- **Climate Risk**: Low
- **Economic Mobility**: High
- **Agency Factor**: High (choices significantly impact trajectory)

#### **Profile B: Urban Middle Income, Stable**
- **Real-World Analogs**: Urban China, South Korea, Poland, urban Argentina
- **Infant Mortality**: 8-15 per 1,000
- **Life Expectancy**: 75-78 years
- **Healthcare Access**: 90-95%
- **Education Access**: 95% literacy, avg 11 years schooling
- **Primary Causes of Death**: Heart disease (25%), cancer (20%), stroke (15%), accidents (10%), diabetes (8%)
- **Violence Index**: 2-5 per 100,000
- **Climate Risk**: Low to Medium
- **Economic Mobility**: Medium-High
- **Agency Factor**: High

#### **Profile C: Emerging Economy, Rapid Transition**
- **Real-World Analogs**: Urban India, Brazil, Mexico, Indonesia, Philippines
- **Infant Mortality**: 20-35 per 1,000
- **Life Expectancy**: 68-73 years
- **Healthcare Access**: 70-85%
- **Education Access**: 85% literacy, avg 8-9 years schooling
- **Primary Causes of Death**: Heart disease (20%), infectious disease (15%), accidents (12%), violence (8%), respiratory illness (8%)
- **Violence Index**: 8-20 per 100,000
- **Climate Risk**: Medium-High (flooding, heat, pollution)
- **Economic Mobility**: Medium (high variance)
- **Agency Factor**: Medium-High (more volatile)

#### **Profile D: Rural Agrarian, Low Resource**
- **Real-World Analogs**: Rural Niger, Chad, Madagascar, Laos, rural Guatemala
- **Infant Mortality**: 45-75 per 1,000
- **Life Expectancy**: 58-65 years
- **Healthcare Access**: 40-60%
- **Education Access**: 60-70% literacy, avg 4-6 years schooling
- **Primary Causes of Death**: Infectious disease (25%), malnutrition (15%), maternal mortality (12%), preventable illness (15%), accidents (10%)
- **Violence Index**: 5-15 per 100,000 (varies)
- **Climate Risk**: High (drought, flood cycles, food insecurity)
- **Economic Mobility**: Low
- **Agency Factor**: Low-Medium (external forces dominate)

#### **Profile E: Conflict Zone, Active War**
- **Real-World Analogs**: Yemen, South Sudan, Syria (active conflict), Afghanistan (2001-2021)
- **Infant Mortality**: 60-110 per 1,000
- **Life Expectancy**: 52-62 years
- **Healthcare Access**: 30-50% (often collapsed infrastructure)
- **Education Access**: 50-65% literacy, avg 3-5 years schooling
- **Primary Causes of Death**: Violence (30%), infectious disease (20%), malnutrition (15%), lack of medical care (15%), maternal mortality (10%)
- **Violence Index**: 50-300+ per 100,000
- **Climate Risk**: Often high (compounding disasters)
- **Economic Mobility**: Near zero
- **Agency Factor**: Extremely Low (survival RNG dominant)

#### **Profile F: Post-Conflict, Fragile State**
- **Real-World Analogs**: Iraq (post-2014), Liberia, Sierra Leone, Bosnia (1990s-2000s)
- **Infant Mortality**: 40-70 per 1,000
- **Life Expectancy**: 60-68 years
- **Healthcare Access**: 50-65% (rebuilding)
- **Education Access**: 65-75% literacy, avg 6-8 years schooling
- **Primary Causes of Death**: Infectious disease (20%), residual violence (15%), accidents (12%), chronic illness (12%), preventable disease (10%)
- **Violence Index**: 15-40 per 100,000
- **Climate Risk**: Medium-High
- **Economic Mobility**: Low-Medium (rebuilding creates opportunities)
- **Agency Factor**: Medium (volatility + opportunity)

#### **Profile G: Resource Extraction Economy**
- **Real-World Analogs**: Angola, Kazakhstan, Saudi Arabia (non-elite), Venezuela, Mongolia
- **Infant Mortality**: 25-50 per 1,000
- **Life Expectancy**: 65-72 years
- **Healthcare Access**: 60-80% (stratified)
- **Education Access**: 80-90% literacy, avg 8-10 years schooling
- **Primary Causes of Death**: Accidents (industrial) (15%), heart disease (15%), infectious disease (12%), environmental illness (10%), violence (8%)
- **Violence Index**: 10-30 per 100,000
- **Climate Risk**: Often high (extraction zones)
- **Economic Mobility**: Low (boom-bust cycles, elite capture)
- **Agency Factor**: Medium (volatile, stratified)

#### **Profile H: Small Island / Isolated**
- **Real-World Analogs**: Pacific Islands, Caribbean (rural), Greenland, rural Alaska
- **Infant Mortality**: 15-35 per 1,000
- **Life Expectancy**: 68-75 years
- **Healthcare Access**: 60-80% (distance issues)
- **Education Access**: 85-95% literacy, avg 9-11 years schooling
- **Primary Causes of Death**: Heart disease (20%), diabetes (15%), accidents (drowning, weather) (12%), suicide (8%), infectious disease (8%)
- **Violence Index**: 3-12 per 100,000
- **Climate Risk**: Extreme (rising seas, storms, isolation)
- **Economic Mobility**: Low (limited opportunity, high cost of living)
- **Agency Factor**: Medium (tight-knit, but constrained)

#### **Profiles I-L: TBD Based on Research**
Potential additional profiles:
- **Post-Soviet Rust Belt** (Ukraine rural, rural Russia, Moldova)
- **MENA Middle Class** (urban Iran, Turkey, Morocco, Tunisia)
- **Latin American Urban Poor** (favelas, barrios, slums)
- **North American Underclass** (rural poverty, urban disinvestment, Indigenous reservations)

---

## Birth Roll System

### Phase 1: Continental Region Roll

**Weighted by Real Annual Birth Rates**

| Region | Annual Births (millions) | Global % | Spawn Weight |
|--------|--------------------------|----------|--------------|
| Sub-Saharan Africa | 32 | 23% | 23 |
| South Asia | 30 | 22% | 22 |
| East Asia | 18 | 13% | 13 |
| Southeast Asia | 13 | 9% | 9 |
| MENA | 12 | 9% | 9 |
| Latin America | 11 | 8% | 8 |
| North America | 6 | 4% | 4 |
| Europe | 5 | 4% | 4 |
| Central Asia | 4 | 3% | 3 |
| Oceania | 0.7 | 0.5% | 1 |

**Implementation:**
```javascript
const continents = [
  { name: "Sub-Saharan Africa", weight: 23 },
  { name: "South Asia", weight: 22 },
  { name: "East Asia", weight: 13 },
  // ...etc
];

function weightedRoll(array) {
  const total = array.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * total;
  
  for (let item of array) {
    if (random < item.weight) return item;
    random -= item.weight;
  }
}
```

### Phase 2: Life Profile Roll

**Each region has weighted distribution of profiles**

Example: **Sub-Saharan Africa**
- Profile D (Rural Agrarian): 40%
- Profile E (Conflict Zone): 10%
- Profile F (Post-Conflict): 15%
- Profile C (Emerging Urban): 25%
- Profile B (Urban Stable): 8%
- Profile A (High Resource): 2%

**Regional Profile Distribution Tables** (TO BE RESEARCHED)

### Phase 3: Cultural Flavor Assignment

**Non-mechanical narrative context**

Includes:
- Specific country/region name
- Language(s)
- Religious/spiritual context
- Climate and geography
- Urban vs. rural setting
- Family structure norms

**Implementation Note:** Stored as flavor text, doesn't affect mechanics directly. Used for event text generation and narrative cohesion.

---

## Random Event System

### Event Categories

Events organized by:
1. **Frequency** (Common, Uncommon, Rare, Legendary)
2. **Impact** (Narrative, Mechanical, Both)
3. **Age Trigger** (Childhood, Adolescence, Adulthood, Elder)
4. **Profile Modifier** (some events more likely in certain profiles)

### Event Structure

```javascript
{
  id: "meteor_shower",
  name: "Witness Meteor Shower",
  category: "Cosmic Accident",
  frequency: "rare",
  description: "You witness a meteor shower on a night you couldn't sleep",
  ageRange: [10, 80],
  mechanicalEffect: {
    // Can modify stats, unlock paths, etc.
    wonder: +5,
    sleepQuality: -2
  },
  narrativeEffect: "A memory that stays with you",
  profileModifiers: {
    // None - universal event
  }
}
```

### Event Types

**Cosmic Accidents** (Rare, 1-3% chance per decade)
- Meteor shower witness
- Lightning near-miss
- Eclipse on birthday
- Natural phenomenon

**Strange Encounters** (Uncommon, 5-10% per decade)
- Life-altering conversation with stranger
- Locked eyes moment
- Prophetic homeless person
- Overhear life-changing secret

**Body Betrayals & Gifts** (Uncommon to Rare, 3-8% per decade)
- Sudden allergy
- Temporary synesthesia
- Hair loss/regrowth
- Prophetic dreams

**Threshold Moments** (Common to Uncommon, 10-20% per decade)
- Near-death experience
- Save someone's life
- Public panic attack → awakening
- Witness birth

**Fractures & Fusions** (Common, 15-25% per life)
- Friendship ends
- Decade-later reconciliation
- Pet chooses you
- Betrayal
- Rival becomes ally

**Complete Event Deck** (see separate document: `random_events.json`)

---

## Death System

### Death Mechanic Overview

Death can occur at any age, weighted by:
1. **Age** (infant, child, adolescent, adult, elder)
2. **Life Profile** (determines cause likelihood)
3. **Accumulated Risk Factors** (events, choices, injuries)
4. **Random Catastrophic Events** (accidents, violence, natural disaster)

### Cause of Death Database Structure

```javascript
{
  cause: "Infectious Disease - Diarrheal",
  ageWeights: {
    infant: 35,  // per 1000 in this profile
    child: 8,
    adolescent: 1,
    adult: 0.5,
    elder: 2
  },
  profileWeights: {
    A: 0.01,
    B: 0.1,
    C: 2,
    D: 15,
    E: 20,
    F: 12
  },
  preventable: true,
  treatmentAccess: "healthcareAccess", // stat check
  description: "Dehydration from contaminated water"
}
```

### Age-Stratified Death Rolls

**Infant (0-1 year):**
- Roll every month
- Highest risk period
- Profile D/E/F: 50-100 per 1000 chance
- Profile A: 2-5 per 1000 chance

**Child (1-12 years):**
- Roll every year
- Profile-dependent
- Infectious disease, malnutrition, accidents

**Adolescent (13-25 years):**
- Roll every year
- Violence, accidents, suicide spike
- Gender and profile modifiers

**Adult (26-60 years):**
- Roll every year
- Chronic disease begins
- Occupational hazards
- Profile-divergent causes

**Elder (60+ years):**
- Roll every 6 months
- Accelerating risk
- Heart disease, cancer, dementia dominant
- Profile still matters (healthcare access)

### Profile-Specific Death Tables

**TO BE RESEARCHED**: Gather data from:
- WHO Global Health Estimates
- UN World Population Prospects
- National mortality databases
- Academic studies on cause-specific mortality by region

---

## Data Requirements

### Essential Datasets

#### 1. Birth Statistics
**Source:** UN World Population Prospects, World Bank  
**Data Points Needed:**
- Annual births by country (2020-2024 avg)
- Crude birth rate per continent
- Urban vs. rural birth distribution
- Maternal mortality rates by region

#### 2. Mortality Statistics
**Source:** WHO Global Health Observatory, GBD Study  
**Data Points Needed:**
- Infant mortality rate (per 1,000 live births) by country
- Under-5 mortality rate by country
- Life expectancy at birth by country/region
- Cause-specific mortality by age group and region
- Maternal mortality ratio by country

#### 3. Cause of Death Data
**Source:** WHO GHE, IHME Global Burden of Disease  
**Data Points Needed:**
- Top 20 causes of death by age group
- Regional variation in cause-specific mortality
- Preventable vs. non-preventable deaths
- Violence and injury mortality by region
- Infectious disease burden by region

#### 4. Healthcare Access
**Source:** WHO, World Bank, DHS  
**Data Points Needed:**
- % population with healthcare access within 1 hour
- Hospital bed density per 1,000 population
- Physicians per 1,000 population
- Vaccination coverage rates
- Essential medicine availability

#### 5. Education Statistics
**Source:** UNESCO, World Bank  
**Data Points Needed:**
- Literacy rates by country and age
- Average years of schooling by country
- Primary/secondary enrollment rates
- Gender gaps in education

#### 6. Socioeconomic Indicators
**Source:** World Bank, UNDP  
**Data Points Needed:**
- GDP per capita (PPP) by country
- Gini coefficient (inequality)
- % population below poverty line
- Access to clean water and sanitation
- Electrification rates

#### 7. Violence and Conflict
**Source:** UCDP, WHO, UNODC  
**Data Points Needed:**
- Homicide rates by country
- Conflict-related deaths by region
- Displaced populations
- Gender-based violence statistics

#### 8. Climate and Environmental Risk
**Source:** EM-DAT, World Bank Climate Portal  
**Data Points Needed:**
- Natural disaster frequency by region
- Climate vulnerability indices
- Food security indicators
- Air quality / pollution exposure

---

## Implementation Roadmap

### Phase 1: Core Systems (Months 1-2)
- [ ] Birth roll algorithm (continent → profile → flavor)
- [ ] Profile data structure and 12-16 profile definitions
- [ ] Basic UI for displaying life stats
- [ ] Age progression system
- [ ] Death roll system (basic)

### Phase 2: Data Integration (Months 2-3)
- [ ] Research and compile all required datasets
- [ ] Build weighted probability tables
- [ ] Create cause-of-death database
- [ ] Validate statistical accuracy with experts
- [ ] Build regional flavor text libraries

### Phase 3: Event System (Months 3-4)
- [ ] Random event deck (100+ events)
- [ ] Event triggering logic
- [ ] Event consequence system
- [ ] Age-gated event filtering
- [ ] Profile-modified event probability

### Phase 4: Player Agency (Months 4-5)
- [ ] Choice points (education, career, relationships)
- [ ] Consequence modeling
- [ ] Agency vs. determinism balance
- [ ] Multiple ending conditions
- [ ] Narrative branching

### Phase 5: Polish & Balance (Months 5-6)
- [ ] Playtesting across all profiles
- [ ] Balance death rates against tedium
- [ ] Tune RNG for narrative satisfaction
- [ ] Cultural sensitivity review
- [ ] Accessibility features

### Phase 6: Launch Prep (Month 6)
- [ ] Final data validation
- [ ] Performance optimization
- [ ] Tutorial / onboarding
- [ ] Content warnings and ethical framing
- [ ] Community guidelines for discussion

---

## Research Checklist

### Immediate Priority Data Gathering

#### **Tier 1: Critical for MVP**
- [ ] UN World Population Prospects 2024 (birth rates by country)
- [ ] WHO Global Health Estimates 2020 (cause-specific mortality)
- [ ] World Bank World Development Indicators (socioeconomic)
- [ ] UNICEF State of the World's Children (child mortality)

#### **Tier 2: Essential for Accuracy**
- [ ] IHME Global Burden of Disease Study (detailed mortality)
- [ ] WHO Global Health Observatory (healthcare access)
- [ ] UNESCO Education Statistics (literacy, schooling)
- [ ] UNODC Global Study on Homicide (violence data)

#### **Tier 3: Flavor and Depth**
- [ ] DHS Demographic and Health Surveys (granular country data)
- [ ] World Bank Climate Change Portal (environmental risk)
- [ ] EM-DAT Disaster Database (natural disasters)
- [ ] Academic papers on regional mortality patterns

### Data Processing Pipeline

1. **Collect** raw CSV/Excel datasets from sources
2. **Clean** and standardize (country codes, age groups)
3. **Aggregate** to profile level (not country-specific)
4. **Weight** probabilities for game balance vs. realism
5. **Validate** with domain experts (demographers, public health)
6. **Implement** in code as JSON probability tables
7. **Test** for distribution accuracy (10,000 simulated lives)

---

## Technical Specifications

### Data Formats

**Profile Definition:**
```json
{
  "id": "profile_d",
  "name": "Rural Agrarian, Low Resource",
  "infantMortality": 60,
  "lifeExpectancy": 62,
  "healthcareAccess": 0.50,
  "literacy": 0.65,
  "violenceIndex": 10,
  "climateRisk": 0.8,
  "mobilityFactor": 0.2,
  "agencyFactor": 0.3,
  "deathCauses": {
    "infant": [
      {"cause": "diarrheal", "weight": 25},
      {"cause": "malaria", "weight": 20},
      {"cause": "pneumonia", "weight": 20}
    ],
    "child": [...],
    "adult": [...],
    "elder": [...]
  }
}
```

**Regional Distribution:**
```json
{
  "region": "Sub-Saharan Africa",
  "birthWeight": 23,
  "profiles": [
    {"id": "profile_d", "weight": 40},
    {"id": "profile_e", "weight": 10},
    {"id": "profile_c", "weight": 25}
  ],
  "flavors": [
    {
      "country": "Ethiopia",
      "language": "Oromo",
      "religion": "Orthodox Christian",
      "setting": "Highland village"
    }
  ]
}
```

### Performance Targets
- Spawn calculation: <50ms
- Event roll per year: <10ms
- Death check: <20ms
- Full life simulation: <500ms (for analytics)

---

## Family System Architecture

### Overview
The family system is the **ecological foundation** of the game. Players don't spawn in isolation—they're born into existing family structures that determine survival odds, resource access, and emotional landscape. Events affecting family members cascade to the player, especially during dependent years (0-18).

### Core Principle
**Family is both buffer and burden.** Stable families with resources increase survival odds. Unstable, under-resourced, or absent families create compounding risk.

---

### Family Generation at Birth

#### Phase 1: Parent Generation

**Mother (required, unless stillbirth/adoption scenario)**
```javascript
{
  age: 15-45 (weighted by profile and region),
  alive: true,
  health: 0-100,
  education: years,
  employed: boolean,
  maritalStatus: "single" | "married" | "cohabitating" | "widowed",
  support: 0-100 (extended family, community)
}
```

**Father (conditional)**
- Present: 60-95% depending on profile/culture
- Age: typically 1-10 years older than mother
- Same stat structure as mother

**Parent Age Distribution (Profile-Dependent)**

| Profile | Teen Mother (15-19) % | Optimal Age (20-34) % | Older Mother (35+) % |
|---------|----------------------|---------------------|---------------------|
| Profile A | 2% | 75% | 23% |
| Profile B | 8% | 70% | 22% |
| Profile C | 15% | 65% | 20% |
| Profile D | 25% | 60% | 15% |
| Profile E | 30% | 55% | 15% |

**Data Sources Needed:**
- Adolescent birth rates by region (UNFPA)
- Median age at first birth by country
- Maternal age distribution curves

#### Phase 2: Family Structure Determination

**Household Types (weighted by profile/culture)**

1. **Nuclear Two-Parent** (married/cohabitating)
   - Profile A: 75%
   - Profile C: 55%
   - Profile E: 40%

2. **Single Mother**
   - Profile A: 8%
   - Profile C: 20%
   - Profile E: 35%

3. **Extended Family (multigenerational)**
   - Profile A: 10%
   - Profile C: 20%
   - Profile D: 40%
   - Grandparents, aunts/uncles present
   - Common in agrarian and collectivist cultures

4. **Single Father** (rare, often post-maternal death)
   - All profiles: 2-5%

5. **Orphaned at Birth** (maternal mortality)
   - Profile A: 0.01%
   - Profile D: 1.2%
   - Profile E: 2.5%
   - Typically raised by extended family if they exist

6. **Institutional** (orphanage, foster)
   - Rare at birth, increases if parents die
   - Profile-dependent social safety nets

**Cultural Modifiers:**
- Sub-Saharan Africa: Higher extended family rates
- Nordic countries: Higher single-parent support systems
- MENA/South Asia: Lower single-mother rates (social structure)
- Latin America: High grandmother co-parenting rates

#### Phase 3: Sibling Generation

**Number of Siblings (Total Fertility Rate by Profile)**

| Profile | Average Children per Family | Distribution |
|---------|----------------------------|--------------|
| Profile A | 1.5-2.0 | 30% only child, 50% one sibling, 20% two+ |
| Profile B | 2.0-2.5 | 20% only child, 45% one sibling, 35% two+ |
| Profile C | 2.5-3.5 | 15% only child, 35% one sibling, 50% two+ |
| Profile D | 4.0-6.0 | 5% only child, 15% one sibling, 80% two+ |
| Profile E | 3.5-5.0 | 8% only child, 22% one sibling, 70% two+ |

**Birth Order Effects:**
- First child: Higher parental attention, learning curve
- Middle child: Resource competition
- Youngest: Benefit from experienced parents, but may face scarcity
- Only child: All resources, but no sibling support network

**Sibling Spacing:**
- Profile A/B: 2-4 years average
- Profile D/E: 1.5-2.5 years average
- Matters for resource strain (multiple dependents at once)

**Existing Siblings vs. Future Siblings:**
- At birth, determine: How many siblings already exist? (older)
- Project: How many will likely be born after you? (younger)
- Siblings can die, affecting family dynamics

---

### Family Stability Metrics

**Composite "Family Stability Score" (0-100)**

Calculated from:
1. **Economic Security** (0-30 points)
   - Parent employment
   - Income relative to poverty line
   - Access to food/water/shelter

2. **Caregiver Presence** (0-25 points)
   - Two parents: 25
   - One parent + extended family: 20
   - Single parent, no support: 10
   - Institutional: 5

3. **Caregiver Health** (0-20 points)
   - Both parents healthy: 20
   - One parent chronically ill: 12
   - Both parents ill/disabled: 5

4. **Household Safety** (0-25 points)
   - No violence: 25
   - Domestic instability: 10-15
   - Active abuse: 0-5

**Stability Score Effects:**
- **80-100**: Protective factor, reduces death risk by 30%
- **50-79**: Baseline
- **25-49**: Increased stress, illness, developmental delays
- **0-24**: Severe risk, survival compromised

---

### Event Cascade System

**Parent Events → Child Effects**

| Parent Event | Cascade to Child (Age-Dependent) |
|--------------|----------------------------------|
| **Parent dies** | Infant (0-2): +50% death risk<br>Child (3-12): Economic shock, psychological trauma<br>Teen (13-18): May need to work, leave school<br>Adult (18+): Grief, but independent |
| **Parent loses job** | Reduced nutrition, medical access, education<br>May trigger migration, homelessness |
| **Parent gets chronically ill** | Child may become caregiver<br>Economic drain<br>Increased stress |
| **Parent divorces/separates** | Resource split, potential custody battle<br>Psychological impact<br>Possible domestic violence spike |
| **Parent remarries** | New siblings (step)<br>Resource reallocation<br>Positive or negative depending on relationship |
| **Domestic violence** | Direct harm risk<br>Psychological trauma<br>Increased child mortality (abuse) |
| **Parent migrates (labor)** | Remittances (economic +) but absence (emotional -)<br>Single-parent household functionally |

**Sibling Events → Player Effects**

| Sibling Event | Effect on Player |
|---------------|------------------|
| **Sibling dies** | Profile D/E: Common, normalized grief<br>Profile A: Rare, catastrophic grief<br>Resources reallocate to survivors |
| **Sibling gets sick** | Diverts parental attention and resources<br>Contagion risk if infectious |
| **Older sibling leaves home** | Loss of support, or relief from competition |
| **Sibling achieves success** | Potential role model, resources may flow back<br>Or increased parental comparison/pressure |

---

### Dependency Model

**Age-Based Dependency on Caregivers**

| Age Range | Dependency Level | Survival Without Caregiver |
|-----------|------------------|----------------------------|
| 0-2 years | Total | 0% (certain death within days) |
| 3-6 years | Extreme | ~5% (orphans can survive with community, barely) |
| 7-12 years | High | ~30% (can scavenge, vulnerable to exploitation) |
| 13-17 years | Moderate | ~70% (can work, but stunted development) |
| 18+ years | Independent | 100% (baseline adult survival) |

**Orphaning Mechanics:**

If both parents die (or single parent dies):
1. **Extended Family Check**: Roll for grandparents, aunts/uncles
   - Profile D/E: 70% chance extended family absorbs child
   - Profile A/B: 50% chance (smaller families, but foster/adoption systems)
   - Profile E (Conflict): 30% (family networks destroyed)

2. **If No Family:**
   - Profile A/B: Institutional care (orphanage, foster system)
   - Profile C/D: Street child, child labor, early marriage
   - Profile E: Death or survival as displaced person

3. **Age-Specific Outcomes:**
   - Infant orphan (0-2): Nearly certain death without immediate adoption
   - Child orphan (3-12): Malnutrition, exploitation, truncated education
   - Teen orphan (13-17): Labor, early marriage, military recruitment, sex work

---

### Family System Data Requirements

#### Critical Datasets

**1. Family Structure Data**
- Household composition by country (DHS, census data)
- Single-parent household rates by region
- Extended family co-residence rates
- Orphan and vulnerable children statistics (UNICEF)

**2. Fertility Data**
- Total Fertility Rate (TFR) by country/region
- Adolescent fertility rate (births per 1,000 girls 15-19)
- Birth spacing intervals
- Wanted vs. unwanted fertility rates

**3. Parental Mortality**
- Adult mortality rates (15-49 age group)
- Maternal mortality ratio
- Life expectancy by age cohort
- HIV/AIDS orphaning rates (Sub-Saharan Africa)

**4. Domestic Stability**
- Domestic violence prevalence (WHO Multi-country Study)
- Child maltreatment rates
- Divorce/separation rates by country
- Household economic vulnerability indices

**5. Child Outcomes by Family Type**
- Mortality differentials (two-parent vs. single-parent)
- Educational attainment by family structure
- Nutrition outcomes (stunting, wasting) by household type
- Psychological outcomes (ACE studies)

---

### Implementation Strategy

#### Phase 1: Basic Family Generation (MVP)
- Generate mother (always)
- Generate father (probabilistic)
- Determine household type
- Roll number of siblings
- Calculate basic Family Stability Score

#### Phase 2: Parent Simulation (Parallel Lives)
- Parents have their own age progression
- Parents can die, get sick, lose jobs
- Parent events trigger cascades to player
- Player dependency on parents decreases with age

#### Phase 3: Sibling Simulation
- Siblings are born after player
- Siblings age in parallel
- Sibling mortality rolls
- Sibling events affect player

#### Phase 4: Extended Family Network
- Generate grandparents (if parents young enough)
- Aunts/uncles as safety net
- Community support systems
- Cultural norms around collective child-rearing

---

### Game Mechanics Integration

**How Family Affects Core Systems:**

1. **Infant Mortality Rolls:**
   - Base rate from Profile
   - Modified by Family Stability Score
   - Modified by mother's age (teen mother = higher risk)
   - Modified by birth spacing (short interval = higher risk)

2. **Education Access:**
   - Determined by parental education + economic security
   - Sibling competition for resources
   - May be interrupted by parent death/illness

3. **Random Events:**
   - Some events more likely in certain family structures
   - "Parent remarries" only possible if parent single/widowed
   - "Sibling rivalry" requires siblings

4. **Agency and Choices:**
   - Family structure constrains options
   - Teen in single-parent household may need to work
   - Child in stable two-parent home has more educational choices

---

### Ethical Considerations

**Sensitive Topics:**
- **Child abuse:** Model statistically but don't graphically depict
- **Sexual violence:** Happens, affects outcomes, but no explicit content
- **Child marriage:** In some profiles (E, D), girls married at 12-15
  - Model as loss of agency, health risks, truncated childhood
  - Don't romanticize or trivialize
- **Orphan exploitation:** Child soldiers, trafficking, labor
  - Acknowledge reality without exploitation of trauma

**Cultural Sensitivity:**
- Extended family ≠ dysfunction (Western bias)
- Single parenthood exists across all cultures, different support systems
- Polygamy in some cultures (not inherently abusive)
- Collectivist vs. individualist child-rearing norms

---

### Testing and Validation

**Family System Playtest Questions:**
1. Do family structures match real-world distributions by region?
2. Do parental deaths appropriately impact child survival?
3. Does the system avoid stereotyping (single parent = bad)?
4. Are extended family networks properly modeled?
5. Do sibling interactions feel meaningful?
6. Is the emotional weight of parent death appropriate?

**Statistical Validation:**
- Run 10,000 births per profile
- Check family structure distributions vs. real data
- Validate orphan rates match UNICEF estimates
- Ensure child outcomes correlate with family stability

---

### Family System Example (Full Spawn)

**Example: Profile D Birth (Rural Agrarian)**

```
BIRTH ROLL:
→ Sub-Saharan Africa (23% weight)
→ Profile D: Rural Agrarian, Low Resource
→ Flavor: Rural Ethiopia, Oromo-speaking, Orthodox Christian

FAMILY GENERATION:
Mother:
  - Age: 19 (adolescent birth)
  - Alive: Yes
  - Health: 65/100 (malnourished)
  - Education: 3 years schooling
  - Employed: Subsistence farmer
  - Marital Status: Married

Father:
  - Age: 24
  - Alive: Yes
  - Health: 70/100
  - Education: 4 years schooling
  - Employed: Subsistence farmer
  - Marital Status: Married

Household Type: Nuclear + Grandparents (extended)
  - Paternal grandmother: Age 54, helps with childcare
  - Grandfather: Age 58, farms with son

Siblings:
  - Older sister: Age 2 (born when mother was 17)
  - You: Newborn
  - Projected: 3-4 more siblings likely over next 10 years

Family Stability Score: 52/100
  - Economic Security: 12/30 (subsistence, food insecurity)
  - Caregiver Presence: 22/25 (two parents + grandmother)
  - Caregiver Health: 14/20 (mother malnourished)
  - Household Safety: 18/25 (stable, but resource stress)

SURVIVAL MODIFIERS:
  - Base infant mortality (Profile D): 60 per 1,000
  - Mother's age (teen): +15 per 1,000
  - Short birth spacing (2 years): +10 per 1,000
  - Extended family support: -10 per 1,000
  - ADJUSTED INFANT MORTALITY: 75 per 1,000 (7.5% death risk, first year)

YEAR 1 EVENT CASCADE:
  - Age 0.3: Mother contracts malaria → breastfeeding interrupted
    → You: +10% death risk this month
  - Age 0.7: Drought → food insecurity → malnutrition
    → You: Stunted growth, developmental delays
  - Age 0.9: Sister (age 2) dies from diarrheal disease
    → Family: Profound grief, grandmother focuses more on you
    → You: Survival odds slightly improve (less competition)

RESULT: You survive Year 1, but with lasting effects (stunted, cognitively delayed)
```

---

## Open Questions

1. **How granular should player choices be?** (Moment-to-moment vs. milestone decisions)
2. **Should profile be hidden or visible to player?** (Immersion vs. strategy)
3. **How do we handle extremely short runs?** (Infant death = tutorial? Skip ahead?)
4. **Permadeath or continue?** (Roguelike vs. narrative exploration)
5. **Multiplayer/comparative?** (See friends' lives? Leaderboards feel wrong)
6. **Victory conditions?** (Is there "winning" or just surviving/thriving?)
7. **How explicit about real-world mapping?** (Name actual countries or keep abstract?)

---

## Ethical Framework

### Design Commitments
- **Never punch down**: Avoid making entertainment from others' suffering
- **Humanize, don't spectacle-ize**: Every life has dignity
- **Educate through experience**: Players learn what privilege means by absence
- **Avoid saviorism**: No "save the poor people" mechanics
- **Respect cultural specificity**: Flavor text reviewed by cultural consultants
- **Content warnings**: Clear framing about difficult content (infant death, violence, etc.)

### Red Lines (Will Not Include)
- Graphic depictions of violence against children
- Sexual violence as random event
- "Poverty tourism" mechanics (slum safari, etc.)
- Trivializing genocide or ethnic cleansing
- Exploitation of real recent tragedies for entertainment

---

## Version History
- **v0.1-alpha** (2025-10-18): Initial design document created

---

## Contributors
- [Your Name/Studio]
- [Data Research Team TBD]
- [Cultural Consultants TBD]
- [Sensitivity Readers TBD]

---

## Next Steps
1. Validate statistical approach with demographer/public health expert
2. Begin Tier 1 data collection
3. Prototype birth roll system in code
4. Test with 1,000 simulated births for distribution accuracy
5. Create first playable vertical slice (one complete life, Profile A and Profile D)

---

**END OF DESIGN DOCUMENT v0.1**