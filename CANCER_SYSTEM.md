## Cancer System - Complete Architecture

### Overview

Cancer is implemented as a complete standalone system that models:
- **Diagnosis**: Probability of developing cancer by age, gender, type, and region
- **Progression**: Multi-year stage advancement (1→2→3→4) with variable timelines
- **Impact**: Escalating penalties to physical health, mental health, employment, and fertility
- **Outcomes**: Remission, recurrence, or death - with regional treatment variations

### Key Features

#### 1. **Multiple Cancer Types** (8 types)
Each with gender-specific and age-specific incidence rates (per 100,000/year):

- **Breast**: Female-primary (0.5-120/100K by age), rare in males (1% of female rate)
- **Lung**: Both genders, 3x higher in males due to smoking patterns (0.1-180/100K)
- **Colorectal**: Both, steady increase with age (0.1-100/100K)
- **Prostate**: Male-only, sharp increase after 45 (0-300/100K)
- **Cervical**: Female-only, preventable with HPV vaccine, screening reduces 70% (0-15/100K)
- **Liver**: Both, 2x higher in males, linked to hepatitis/cirrhosis (0.2-20/100K)
- **Pancreatic**: Both, poor prognosis (0-25/100K, stage 4 usually)
- **Ovarian**: Female-only, difficult to detect (0-18/100K)

#### 2. **Regional Modifiers** (5 regions)
Each region has 4 parameters modifying cancer outcomes:

```
NORDIC COUNTRY:
  Incidence multiplier:     1.2 (high aging population)
  Screening access:         95% (universal programs)
  Early detection rate:     85% (stage 1-2 at diagnosis)
  Treatment access:         95% (comprehensive healthcare)

DEVELOPED (Western Europe, Japan, North America):
  Incidence multiplier:     1.05-1.15
  Screening access:         85-98%
  Early detection:          75-88%
  Treatment access:         90-98%

EMERGING (Eastern Europe, Urban China):
  Incidence multiplier:     0.8-0.95
  Screening access:         60-70%
  Early detection:          40-50%
  Treatment access:         70-80%

DEVELOPING (Urban Latin America, Southeast Asia, Rural India):
  Incidence multiplier:     0.4-0.7
  Screening access:         10-45%
  Early detection:          8-30%
  Treatment access:         10-50%

FRAGILE (Sub-Saharan Africa):
  Incidence multiplier:     0.35 (early death from other causes)
  Screening access:         5% (minimal infrastructure)
  Early detection:          5% (mostly stage 3-4)
  Treatment access:         10% (limited to major cities)
```

#### 3. **Stage System** (1-4)

Each stage has:
- **Progression timeline**: Years until advancing to next stage
  - Stage 1→2: 2-5 years (treatable, often doesn't progress)
  - Stage 2→3: 1-3 years (getting serious)
  - Stage 3→4: 1-2 years (rapid final decline)
  - Stage 4: 0.5-1.5 years (fatal unless treated)

- **5-year survival rates** by region:
  ```
  Stage 1: Nordic 85%, Developed 80%, Emerging 50%, Developing 30%, Fragile 15%
  Stage 2: Nordic 70%, Developed 60%, Emerging 30%, Developing 15%, Fragile 8%
  Stage 3: Nordic 45%, Developed 35%, Emerging 15%, Developing 7%, Fragile 3%
  Stage 4: Nordic 10%, Developed 7%, Emerging 2%, Developing 1%, Fragile 0.5%
  ```

- **Penalties** (applied each year):
  ```
  Stage 1:
    Physical:    -2 /year (treatable symptoms)
    Mental:      -1 /year (diagnosis stress)
    Employment:  0 /year (can work)
    Fertility:   0 /year (minimal impact)

  Stage 2:
    Physical:    -4 /year (noticeable decline)
    Mental:      -2 /year (treatment anxiety)
    Employment:  -0.5 /year (reduced capacity)
    Fertility:   -0.3 /year (treatment effects)

  Stage 3:
    Physical:    -6 /year (severe symptoms)
    Mental:      -3 /year (existential crisis)
    Employment:  -1.5 /year (often cannot work)
    Fertility:   -0.6 /year (largely infertile)

  Stage 4:
    Physical:    -10 /year (rapid decline)
    Mental:      -5 /year (end-of-life distress)
    Employment:  -5 /year (completely disabled)
    Fertility:   -1 /year (biological death imminent)
  ```

#### 4. **Treatment Access Impact**

With treatment access (Nordic, Developed):
- Penalties reduced 20-30%
- Remission possible (50-70% for stage 1-2)
- Survival rates significantly improved

Without treatment access (Fragile):
- Penalties increased 20-30%
- No remission possible
- Survival rates approach 0% at stage 4

#### 5. **Remission & Recurrence**

- **Remission triggers**: Only stages 1-2, only with treatment access
  - Stage 1: 50-70% remission rate (by region)
  - Stage 2: 25-50% remission rate (by region)
  
- **Recurrence mechanics**: 
  - After 5+ years in remission: 3% annual recurrence risk
  - Returns at higher stage (usually stage+1)
  - Mental health crisis on recurrence (-20 mental)
  - Most dangerous: stage 1 remission → stage 2 recurrence

#### 6. **Risk Factors**

Modifiers for specific cancers:

- **Smoking** → Lung cancer 3x more likely
- **Alcohol** → Liver cancer 1.5x more likely
- **Hepatitis B/C** → Liver cancer 2x more likely
- **Preventable vaccination** (HPV) → Cervical cancer 70% reduction

### Integration into Game Engine

#### Player State Structure
```javascript
player.health.cancer = {
  active: false,              // Currently diagnosed
  type: "breast",             // Cancer type
  stage: 2,                   // 1-4, or 0 if none
  yearsSinceDiagnosis: 3,     // Track progression
  inRemission: false,         // In remission
  remissionYears: 0,          // Years in remission
  treatmentAccess: true,      // Regional healthcare access
  hasRecurred: false,         // Has recurred before
  complications: [],          // ["metastasis", "toxicity"]
  history: []                 // Full cancer history
}
```

#### Annual Cycle (in `processYearEnd()`)
1. **Diagnosis check** (age 15+): `driftCancer()` calls `getCancerIncidence()`
2. **Progression check**: `getStageProgression()` advances stages
3. **Penalties applied**: `getCancerPenalties()` reduces health/employment/fertility
4. **Remission check**: `checkRemission()` (stage 1-2 only with treatment)
5. **Recurrence check**: For remission patients (3% annual after 5 years)
6. **Death check**: `shouldDieFromCancer()` (stage 4 high mortality)

#### Death Weighting
In `weightedDrawDeath()`:
- If `player.health.cancer.active`: Cancer weight amplified 15x
- This makes cancer the primary cause of death when active
- Prevents competing causes (accident, overdose) when cancer stage 4

### Testing

#### Standalone System Tests (`test_cancer_system.js`)
✓ Cancer incidence by age/gender/region shows expected regional variation
✓ Cancer type distribution realistic (breast dominant in females)
✓ Gender differences modeled correctly (prostate in males, breast in females)
✓ Stage at diagnosis varies by region (Nordic 85% early, Fragile 25% early)
✓ Stage progression occurs gradually over years
✓ Penalties escalate through stages properly
✓ Treatment access impact significant (30% worse without access)
✓ Mortality risk stage 4 shows 40-80% annually by region
✓ Remission rates realistic (Nordic 50-70% stage 1, Fragile <10%)
✓ Risk factors modify incidence (smoking 3x lung cancer)

#### Integration Tests (`test_cancer_quick.js`)
✓ Cancer diagnosis occurs in simulations
✓ Multiple lives show expected cancer rates
✓ Cancer deaths tracked and counted
✓ Progression through stages observed
✓ Remission mechanics functional

### Implementation Details

#### File Structure
- **cancer_system.js** (390 lines)
  - `CANCER_TYPES`: 8 types with age/gender/risk data
  - `REGIONAL_MODIFIERS`: 5 regions with screening/treatment parameters
  - `CANCER_STAGES`: Stage definitions with survival rates and penalties
  - Functions: `getCancerIncidence()`, `getStageProgression()`, `getCancerPenalties()`, `shouldDieFromCancer()`, `checkRemission()`

- **game_engine_v2_homeostatic.js** (integration)
  - Import cancer system at top
  - `driftCancer()` method (220 lines) - annual cancer progression
  - `getRegionCode()` helper - convert birth region to region code
  - `getRegionalModifiers()` helper - regional parameters
  - Cancer object in player initialization
  - Cancer check in death weighting

- **Tests**
  - `test_cancer_system.js`: 10 comprehensive tests of cancer system
  - `test_cancer_integration.js`: Integration framework (ready to run full tests)
  - `test_cancer_quick.js`: Quick validation in game engine

### Future Enhancements

1. **Cancer-specific treatments**: Chemotherapy, radiation, surgery with different costs/side effects
2. **Secondary cancers**: Risk from treatment toxicity (5-15 years later)
3. **Cancer screening events**: Optional health screenings that detect early
4. **Lifestyle factors**: Diet, exercise, pollution exposure affecting risk
5. **Occupational cancers**: Asbestos, radiation exposure in certain jobs
6. **Family history**: Genetic predisposition (BRCA1/2, Lynch syndrome)
7. **Complication events**: Blood clots, infections, organ failure
8. **Palliative care**: End-of-life care for stage 4 (pain management, death with dignity)

### Regional Impact Summary

**Nordic**: High incidence (due to aging), high detection (85%), high survival (70%+ stage 1)
- Cancer is a manageable disease with good outcomes for early detection

**Developed**: Similar to Nordic, slightly lower detection rates

**Emerging**: Moderate incidence, moderate detection (40-50%), moderate survival (30-50%)
- Cancer is serious but treatable for those with access

**Developing**: Lower incidence (earlier death from other causes), low detection (8-30%), low survival (5-30%)
- Cancer largely untreated, usually fatal

**Fragile**: Lowest incidence (very high early mortality), minimal detection (5%), minimal survival (0.5-15%)
- Cancer essentially untreated, almost always fatal within years

### References

- WHO Global Cancer Observatory data
- CDC WONDER mortality database
- SEER 5-year survival statistics
- National cancer institute regional variations
- Treatment outcome data by development level
