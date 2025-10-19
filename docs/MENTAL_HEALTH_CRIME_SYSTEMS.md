# Major Statistical Systems: Mental Health, Crime, Addiction

## Overview
This document outlines the core interrelated systems that drive realistic life outcomes based on statistical data from WHO, UN, CDC, and Bureau of Justice databases.

---

## 1. MENTAL HEALTH SYSTEM

### Data Foundation
- **Global mental disorder prevalence**: ~15% of population
- **Depression**: 280M people globally, ~5% prevalence
- **Anxiety disorders**: 5-10% prevalence
- **Untreated mental illness suicide risk**: 20-50x baseline
- **Mental health treatment reduces suicide risk**: 60-80% reduction

### State Tracking
```javascript
health.mental = {
  current: 0-100,              // Immediate state
  baseline: 0-100,             // Long-term baseline
  drift: 2,                    // Recovery rate
  chronic: [],                 // ["depression", "anxiety", "ptsd", "bipolar"]
  episodeDuration: 0,          // Months in current episode
  treatmentStatus: "none",     // "none" | "medicated" | "therapy" | "hospitalized"
  suicideRisk: 0-100,          // Separate tracking (non-linear)
  lastCrisisAge: null          // When last acute crisis occurred
}
```

### Mental Health Progression Rules

#### Recovery/Degradation (Annual)
```
If mental.current < mental.baseline:
  current += drift (recovery)
  If untreated AND current < 30 for 6+ months:
    baseline -= 1 (becomes more vulnerable)
  
If mental.current > mental.baseline:
  current -= drift * 0.5 (slower recovery from highs)

Age-based trajectory:
  Age 13-25: Baseline 60-70 (teen vulnerability)
  Age 26-65: Baseline 65-75 (relatively stable)
  Age 65+: Baseline 55-65 (age-related decline)
```

#### Chronic Condition Formation
```
If mental.current < 20 for 12+ consecutive months → triggers depression
If mental.current < 30 for 24+ consecutive months → baseline permanently reduced
If two crises within 12 months → anxiety disorder added
If trauma event → PTSD added (lasts minimum 2 years)
```

#### Crisis Episodes
- Triggered by: major life events (death, job loss, relationship break), sustained low mental health
- Duration: 2-12 months
- Impact: -30 to -50 mental health points, can trigger suicide ideation
- Recovery: With treatment 6-12 months, without treatment 12-36 months

#### Treatment Effects
- **Medication** (baseline treatment): +1 mental/month, reduces crisis risk 40%
- **Therapy** (more intensive): +1.5 mental/month, reduces crisis risk 50%
- **Hospitalization** (acute): +3 mental/month for duration, prevents suicide attempts 80%
- **Community support/friends**: +0.5 mental/month per close relationship

---

## 2. SUICIDE/SELF-HARM SYSTEM

### Data Foundation
- **Global suicide deaths**: 700K-800K annually
- **Attempts to deaths**: 10:1 to 20:1 ratio (varies by region, method access)
- **Age of peak risk**: 15-44 years (teens, young adults)
- **Risk multipliers**:
  - Untreated mental illness: 10-50x
  - Substance abuse co-occurrence: 8-10x
  - Social isolation: 4-5x
  - Prior attempt: 8x
  - Access to means: 2-3x

### State Tracking
```javascript
health.suicideRisk = {
  ideation: 0-100,              // Passive thoughts to active planning
  attemptHistory: [],           // [{age, method, survived}]
  lastIdeationOnset: null,      // When ideation began
  hasAccessToMeans: true,       // Based on region/circumstances
  currentPlan: null             // When ideation becomes planning
}
```

### Suicide Risk Calculation (Annual Probability)
```
Base risk: 0.01% (baseline population)

Mental health factors:
  If mental.current < 10: +2.0% risk
  If mental.current < 20: +1.0% risk
  If mental.current < 30: +0.3% risk
  If mental.current < 40: +0.1% risk

Duration of low mental health:
  If continuous < 30 for 6-12 months: +0.5% risk
  If continuous < 30 for 12+ months: +1.0% risk

Isolation:
  If isolated AND friends = 0: +0.3% risk
  If isolated AND married/partnered: -0.2% risk (protective)

Prior attempts:
  Each prior attempt: +0.5% risk (sensitization)

Substance abuse:
  Active addiction: +0.8% risk

Untreated mental illness:
  depression + untreated: +0.6% risk
  anxiety + untreated: +0.3% risk
  PTSD + untreated: +0.5% risk

Age factors:
  Ages 15-24: +0.2% risk (teen vulnerability)
  Ages 25-64: baseline
  Ages 65+: +0.1% risk (elderly)
  Ages 80+: +0.3% risk (very elderly, pain/decline)

Treatment protective factors:
  On medication: -0.4% risk
  In therapy: -0.5% risk
  Hospitalized: -0.7% risk

Capped at realistic range: 0.01% to 3% annually
```

### Suicide Attempt Mechanics
- When suicide risk triggers attempt (random annual roll):
  1. Method access (varies by region): firearm 90%+ lethality, poison 10-50%, jumping 80%+
  2. Attempt result: 20-60% of attempts are fatal depending on method and emergency access
  3. Survivor outcome: -20 mental health, +10 trauma, medical costs, potential disability
  4. Non-attempt: If risk triggers but attempt fails (e.g., found in time), crisis intervention occurs

### Intervention/Treatment Prevention
- Annual check: If ideation is active and risk > 1.5%, treatment becomes available (event)
- Treatment adoption: Depends on access (region-based) and social support
- Treatment success: Reduces suicide risk by 60-75% within 6 months

---

## 3. CRIME/INCARCERATION SYSTEM

### Data Foundation
- **Global incarceration rate**: 140 per 100K (varies 40-900 by region)
- **Crime rate triggers**: Poverty, substance abuse, low education, trauma history, untreated mental illness
- **Recidivism rate**: ~50-70% within 5 years (varies by crime type)
- **Incarceration health impacts**: -10 physical/mental health per year, psychological trauma
- **Economic impacts**: Job loss, reduced earning potential 30-50% post-release
- **Age of peak crime**: 15-35 years

### Crime Risk Calculation (Annual Probability)
```
Base risk: 0.1% (baseline)

Economic desperation:
  If resources < 5 AND age 15-35: +0.5% risk
  If resources < 0 AND age 15-35: +1.2% risk
  If debt > 100: +0.3% risk

Mental health/substance abuse:
  If mental.current < 25: +0.3% risk (desperation)
  If addiction active: +1.0% risk (funding habit)
  If PTSD/trauma: +0.2% risk (hypervigilance, aggression)

Social factors:
  If isolated: +0.2% risk
  If parents imprisoned: +0.3% risk (intergenerational)
  If orphaned/unstable childhood: +0.2% risk

Education:
  If < high school: +0.1% risk
  If high school: baseline
  If college+: -0.1% risk (protective)

Age:
  Ages 15-25: +0.3% risk (peak offending)
  Ages 26-35: +0.1% risk
  Ages 36+: -0.05% risk (aging out)

Access/opportunity (region-based):
  High crime area: +0.2% risk
  Low crime area: -0.1% risk

Prior convictions:
  Each prior conviction: +0.3% risk (criminal justice involvement)

Capped at: 0.1% to 3% annually
```

### Incarceration Mechanics
- When crime risk triggers offense:
  1. Detection probability: 30-70% (varies by crime type, region)
  2. Conviction probability: 50-80% if detected (varies by region, defense access)
  3. Sentence: 1-10 years (varies by crime type, criminal history, region)
  4. Annual health cost during incarceration: -2 physical, -3 mental per year
  5. Psychological trauma from incarceration: +5 years to "trauma recovery"
  6. Job loss: Immediate income reduction to 0 during incarceration
  7. Record stigma: Post-release, income reduced 30-50%, employment difficulty increases

### Post-Incarceration Effects
- Released after sentence:
  - First 2 years: 70% recidivism risk (highest)
  - 3-5 years: 40% recidivism risk
  - 5+ years: 20% recidivism risk
  - With job training/support: 50% reduction in recidivism
  - Without support: No risk reduction

---

## 4. SUBSTANCE ABUSE SYSTEM

### Data Foundation
- **Global substance abuse**: 275M people annually (4% of population)
- **Addiction progression**: Casual use → regular use → dependence (6-24 months typical)
- **Health impacts**: Liver disease, heart problems, cognitive decline, psychiatric comorbidity
- **Overdose deaths**: ~100K annually (USA), varies by substance access
- **Recovery rates**: 10-20% achieve sustained recovery without treatment, 40-60% with treatment

### Addiction Tracking
```javascript
addiction = {
  substance: null,                    // "alcohol", "opioids", "cannabis", "stimulants", null
  stage: "none",                      // "none" | "casual" | "regular" | "dependent"
  monthsDuration: 0,                  // Total months in current stage
  frequencyPerMonth: 0,               // Frequency of use
  treatmentStatus: "none",            // "none" | "inpatient" | "outpatient" | "recovered"
  craving: 0-100                      // Intensity of desire to use
}
```

### Addiction Onset Triggers
```
Probability of initial use:
  If mental.current < 30: +0.3% risk (self-medication)
  If social.isolation: +0.2% risk
  If trauma history: +0.2% risk
  If peers use: +0.4% risk (social modeling)
  If resources < 5 AND age 15-30: +0.2% risk (escape)
  If unemployed > 12 months: +0.1% risk

Age factors:
  Ages 15-25: Highest risk (novelty-seeking)
  Ages 26-45: Moderate risk
  Ages 45+: Lower risk

Substance access (region-based):
  High access area: +0.2% risk
  Low access area: -0.1% risk
```

### Addiction Progression
```
Stage transitions (annual):
  Casual use (1-2x/month):
    If continues 12+ months: 20% chance → regular use
  
  Regular use (weekly-2x/week):
    If continues 6+ months: 40% chance → dependent
    If stress/trauma spike: 60% chance → dependent
  
  Dependent (3+ times/week):
    If continues: addiction locked (unless treated)
    Each year without treatment: baseline mental -2, baseline physical -2
    Overdose risk: 0.5-2% annually depending on substance
```

### Health Impacts by Substance
```
Alcohol:
  Physical: Liver damage (-1 physical/year), heart (-0.5), cognitive (-0.5 mental/year age 55+)
  Mental: Temporary relief → depression rebound
  Overdose: 5% fatal if severe

Opioids:
  Physical: Respiratory damage, infectious disease (shared injection)
  Overdose: 60-80% fatal if untreated
  Mental: Severe depression when not using

Cannabis:
  Physical: Cognitive effects in teens (permanent -5 if started <18)
  Mental: Anxiety/paranoia, psychosis risk 1-5% in vulnerable
  Overdose: ~0% fatal

Stimulants (cocaine, meth, amphetamines):
  Physical: Cardiac issues (-2 physical/year), malnutrition
  Mental: Paranoia, aggression (+0.3% crime risk), severe crash depression
  Overdose: 10-20% fatal
```

### Recovery Mechanics
```
Without intervention:
  Addiction progresses → health degradation → crime/self-harm risk increases
  Recovery rate: 5-10% spontaneous remission annually
  
With treatment:
  Inpatient: +30% recovery chance annually, costs significant resources
  Outpatient: +15% recovery chance annually, lower cost
  Peer support: +8% recovery chance annually
  
Post-recovery:
  High relapse risk first 2 years (50-60%)
  Each year without relapse: recovery becomes more stable
  5+ years abstinent: relapse risk drops to 10-15%
```

---

## 5. SOCIAL ISOLATION CASCADE

### Isolation Mechanics
```
Isolation triggered by:
  - Friend loss (death, moving, breakup): +isolation
  - Unemployment > 12 months: +isolation
  - Disability/illness limiting mobility: +isolation
  - Mental health crisis: +isolation
  - Incarceration: ++isolation (locked in)
  - Substance abuse: +isolation (damaged relationships)

Isolation consequences (per year):
  Mental health: -1 baseline per year isolated
  Physical health: -0.5 baseline per year isolated
  Suicide risk: +0.3% per year isolated
  Crime risk: +0.2% per year isolated (desperation)
  Addiction risk: +0.2% per year isolated (self-medication)
  Economic: -1 income (lost job opportunity networking)
```

### Recovery from Isolation
```
Protective factors:
  - Marriage/partnership: -isolation, +social support
  - Employment: -isolation, +social contact
  - Community involvement (religious, clubs, volunteer): -isolation
  - Treatment/therapy: -isolation (human contact)
  - Family relationships: +social buffer

Intervention opportunities:
  - Social connection events
  - Employment programs
  - Mental health outreach
  - Community development initiatives
```

---

## 6. INTERRELATED SYSTEM FEEDBACK LOOPS

### Crisis Cascade Pattern
```
Trigger event:
  Job loss → resources drop → economic stress
  
Cascade:
  Economic stress → mental health -20
  → isolation increases (can't afford social activities)
  → mental health baseline begins declining
  → substance abuse risk +0.3%
  → crime risk +0.5%
  → if crime → incarceration
  → isolation ++ (locked in)
  → mental health -30/year
  → suicide risk +1%/year
  
Without intervention:
  2-3 years → potential death (suicide, overdose, or health collapse)
  
With intervention (job training, mental health support):
  6-12 months → recovery possible
  Costs: minimal vs lifetime costs of incarceration/healthcare
```

### Recovery Cascade Pattern
```
Intervention point:
  Mental health treatment starts
  
Cascade:
  Mental crisis averted → stabilization
  → can seek employment
  → employment → income/social contact
  → social contact → isolation decreases
  → isolation ↓ → mental health improves
  → mental health ↑ → substance abuse risk ↓
  → substance abuse ↓ → crime risk ↓
  → stability → relationships improve
  → relationships → social resilience buffer
  
Result:
  After 12-24 months → significant life trajectory change
```

---

## 7. REGIONAL VARIATION

### Mental Health Treatment Access
```
Nordic/Western Europe: 70-80% treatment rate
Urban China: 40-50% treatment rate
North America: 50-60% treatment rate
Southeast Asia: 20-30% treatment rate
Sub-Saharan Africa: 5-15% treatment rate
```

### Crime/Incarceration Rates (per 100K)
```
Lowest: Nordic countries (40-60)
Low: Western Europe (60-100)
Moderate: North America (400-700)
High: Brazil (350-400)
Highest: Rwanda, El Salvador (500-900)
```

### Substance Abuse Patterns
```
Alcohol dominant: Nordic/Eastern Europe, Sub-Saharan Africa
Opioid crisis: North America, some Western Europe
Cannabis: Global prevalence
Methamphetamine: Southeast Asia, parts of Americas
Cocaine: South America, urban USA
```

---

## 8. STATISTICAL VALIDATION TARGETS

### Global Suicide Rate
- Target: 10-15 per 100K annually
- Regional range: 5 (low) to 30+ (high)

### Incarceration Rate
- Global average: 140 per 100K
- Regional variation: 40-900

### Substance Abuse Prevalence
- Target: 4% of population
- Varies by substance and region

### Mental Disorder Prevalence
- Target: 15% of population
- Depression: 5%
- Anxiety: 5-10%

### Social Isolation
- Target: 20-30% of population experiences significant isolation
- Age factor: Higher in 65+, lower in 25-45

---

## Implementation Order
1. Mental health crisis/episode tracking
2. Suicide ideation and attempt mechanics
3. Crime probability and incarceration consequences
4. Substance abuse progression and overdose
5. Isolation cascade mechanics
6. Integration of all systems (feedback loops)
7. Statistical validation tests
8. Regional variation application
