# Nordic Region Economic & Social Infrastructure

## Overview
Built comprehensive baseline for Nordic region including employment, education, cost of living, and stress-income relationships. All systems are data-driven and region-parameterized.

## 1. Employment System (`employment_by_region.js`)

**Nordic Employment Rates by Age/Gender:**
- Ages 15-24: 55-58% (youth, many in school)
- Ages 25-34: 82-88% (young adult, high employment)
- Ages 35-49: 85-90% (prime working years)
- Ages 50-64: 78-82% (pre-retirement still active)
- Ages 65+: 10-12% (mostly retired)

**Features:**
- Stochastic employment transitions (15% turnover annually)
- Tracks unemployment duration in months
- Different rates by gender (males slightly higher at all ages)
- All functions probabilistic - single sample may vary but aggregates are correct

## 2. Cost of Living System (`cost_of_living.js`)

**Nordic Regional Costs (annual, per person):**
- Base cost: 1.0 unit per year
- Scales by family size (1 person = 1.2x multiplier, 4 people = 0.9x per person)
- Age multiplier (children 0-5 = 0.7x, elderly 65+ = 1.3x)

**Nordic Income (annual, employed adult):**
- Employed adult: 2.0 units/year
- Unemployed: 0.6 units/year (welfare support)
- Child benefit: 0.2 units/year per child
- Elderly pension: 1.2 units/year (age 67+)

**Household Sustainability:**
- Single adult employed: +0.56 surplus (stable)
- Single adult unemployed: -0.84 gap (needs savings)
- 2 adults (1 employed) + 2 children: -0.42 gap (tight but manageable with savings)
- Elderly couple on pensions: -0.20 gap (minimal but sustainable)

**Stress-Income Curve:**
```
Ratio 0.25 → Stress 2.5 (Destitute)
Ratio 0.50 → Stress 1.8 (Struggling)
Ratio 0.75 → Stress 1.8 (Struggling)
Ratio 1.00 → Stress 1.0 (Baseline)
Ratio 1.20 → Stress 0.9 (Comfortable)
Ratio 1.50 → Stress 0.8 (Secure)
Ratio 2.00 → Stress 0.7 (Wealthy)
```
Severe stress multiplier (>1.8x) only when income < 50% of costs.

## 3. Education System (`education_system.js`)

**Education Stages & Attendance:**
- Preschool (0-5): 95% attend in Nordic (heavily subsidized at 0.05/year)
- Primary (6-11): 99% attend (free, compulsory)
- Secondary (12-17): 98% attend (free, compulsory)
- Tertiary (18-25): 65% attend (0.02/year heavily subsidized)

**Employment Tiers from Education:**
```
Education Level          → Tier | Wage Range
None                     → Tier 1 | 0.10-0.30
Primary                  → Tier 1 | 0.15-0.40
Secondary                → Tier 2 | 0.40-1.00
Secondary Vocational     → Tier 2 | 0.45-1.20
Tertiary Technical       → Tier 3 | 0.80-1.60
Tertiary Bachelor        → Tier 4 | 1.20-2.50
Tertiary Advanced        → Tier 5 | 1.80-4.00
```

**Lifetime Earnings (Nordic, assuming steady employment 20-65):**
- Secondary only: 45 units lifetime
- Bachelor degree: 112.5 units lifetime (2.5x higher!)
- Advanced degree: 180 units lifetime (4x higher!)

**Regional Comparison for Same Family (2 adults, 1 employed, 2 children):**
```
Nordic:     Cost 3.42, Income 3.00 (sustainable, -12% gap)
Developed:  Cost 3.08, Income 2.35 (tight, -24% gap)
Emerging:   Cost 1.37, Income 0.94 (fragile, -31% gap)
Developing: Cost 0.68, Income 0.29 (destitute, -58% gap)
Fragile:    Cost 0.41, Income 0.08 (destitute, -81% gap)
```

## 4. Game Engine Integration

**Player Creation:**
- Initialize with Nordic/region-specific employment probability based on age/gender
- Initialize with education stage (preschool/primary/etc)
- Initialize with baseline resources from region wealth

**Annual Processing (`processYearEnd`):**
1. Age up
2. Update mental health baseline
3. **Update employment status** - 15% turnover, structural probabilities
4. **Update education status** - attendance, progression, completion
5. Drift health systems
6. Drift economics (cost of living based on family resources)
7. Drift mental health (stress factors now include unemployment duration, poverty ratio)
8. Calculate suicide risk
9. Death check

**Stress Calculation (`driftMentalHealthCrisis`):**
- Employment stress: Unemployed = +2 stress (worse if >6 months, even worse if >12 months)
- Poverty stress: Resources <50% baseline = +2 stress, <10% baseline = +3 stress
- Social isolation = +1 stress
- Health problems = +1-2 stress
- Debt stress = up to +3 stress
- Total stress is accumulated and then applied with random variation

## 5. What's Still Needed

### Immediate Next Steps:
1. **Test 1M life simulation** with new systems to see if employment stability reduces suicide rates
2. **Multi-adult households** - model grandparents, aunts/uncles contributing to cost sharing
3. **Single parent households** - major stress factor, economic vulnerability
4. **Inter-regional migration** - people move between regions (education opportunity)

### Medium Term:
1. **Employment tier-specific health risks** - tier 1 jobs have higher injury/disease
2. **Education debt** - in developed nations, tertiary education creates debt burden
3. **Intergenerational effects** - parental education affects child outcomes
4. **Social mobility** - education as escape from poverty

### Long Term:
1. **Labor market shocks** - unemployment spikes, recessions
2. **Skills mismatch** - educated people working below tier (precariat)
3. **Gender wage gap** - incorporate differential pay by gender
4. **Work-life balance** - occupational stress (deferred for now per user guidance)

## 6. Key Insights

**Education as Stress Buffer:**
Even controlling for income, being in school provides:
- Structure and routine
- Social connection and purpose
- Future income prospects (reduces future stress)
- Mental health baseline +2 adjustment while in school

**Regional Economic Determinism:**
- Nordic: Safe, stable, requires modest income to thrive
- Fragile: Harsh, even employed can't afford basic costs
- Education ROI: Bachelor degree = 2.5x lifetime income (massive difference)
- Family structure critical: single parent struggling in Nordic, non-existent in Fragile

**Unemployment Stress Curve:**
- First 6 months: moderate stress (0-1 multiplier)
- 6-12 months: increased stress (1-2 multiplier)
- 12+ months: chronic stress (2x baseline)
- Combined with poverty = severe crisis risk

## 7. Files & Modules

```
employment_by_region.js          - Employment probabilities by age/gender/region
cost_of_living.js                - Household costs, income, benefits, stress-income curve
education_system.js              - Education stages, costs, completion, employment tiers
game_engine_v2_homeostatic.js    - Main engine, integrated all three + stress calc

tests/
  test_cost_of_living.js         - Cost by region & family structure
  test_education_system.js       - Education pathways & earnings potential
  test_employment_rates.js       - Employment distribution by age
```

## 8. Next Run: Full Simulation

When ready, test with:
```bash
node scripts/test_suicide_1m.js
```

Expected improvements from previous 331/100K:
- Employment now provides stable income (was always 0)
- Better mental health for employed + in-school individuals
- Income/cost ratio stress applied instead of just "resources < 5"
- Poverty stress now graduated (not binary)
- Education provides protective effect on mental health
- Unemployment duration tracked (gets worse over time)

Target: Nordic suicide rate should drop from 331/100K to <15/100K (realistic range).
