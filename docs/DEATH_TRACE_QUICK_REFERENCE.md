# Death Trace System - Quick Reference

## TL;DR

You wanted to be able to look at why someone died "like looking at the log backwards, only more verbose".

**You now have exactly that** - a complete record of every significant event in a person's life with full context at each step.

## Quick Commands

### See one person's complete death trace
```bash
node scripts/demo_death_trace.js
```

### Analyze 10 lives and find patterns
```bash
node scripts/analyze_death_traces.js
```

### Run 50 lives and flag anomalies
```bash
node scripts/detect_anomalies.js
```

## Using in Code

### Enable tracing for a run
```javascript
const tracer = new DeathTracer();
const engine = new MortalityGameV2(cards..., tracer);

engine.createPlayer(birthCard, familyCard);
// ... simulate life ...

// View the trace
tracer.printDeathTrace(engine.player);
```

### Get causal chain
```javascript
const chain = tracer.traceCausalChain(player);
// Shows: death event + immediate factors + turning points + lifetime challenges
```

### Export for analysis
```javascript
const json = tracer.exportDeathTrace(player);
fs.writeFileSync('trace.json', JSON.stringify(json, null, 2));
```

## What Gets Logged

**Every event** logs:
- Age when it happened
- Event type (BIRTH, MENTAL_HEALTH_CRISIS, EMPLOYMENT_LOSS, DEATH_BY_SUICIDE, etc)
- Event-specific context
- **Complete state at that moment** (health, economic, social, housing)

### Events Currently Logged

- ✅ BIRTH
- ✅ MENTAL_HEALTH_CRISIS
- ✅ SUICIDE_ATTEMPT
- ✅ DEATH_BY_SUICIDE
- ⏳ CANCER_PROGRESSION
- ⏳ ADDICTION_INITIATION / ESCALATION
- ⏳ EMPLOYMENT_CHANGE
- ⏳ RELATIONSHIP_CHANGE
- ⏳ HOMELESSNESS_CHANGE

(⏳ = stubbed out but not fully integrated yet)

## Death Trace Output Example

```
================================================================================
MALE - Born in Nordic Country
Lived: 27 years (Expected: 83 years)
Birth Year: 2025

CAUSE OF DEATH
Age: 27
Primary Cause: Tuberculosis
Health Factors:
  - Severely compromised physical health
  - Multiple chronic conditions: cancer, asthma

CRITICAL TURNING POINTS
Age 12: EMPLOYMENT_LOSS
Age 15: MENTAL_HEALTH_DROP (magnitude: 28)
Age 22: HOMELESSNESS_ONSET
Age 24: MENTAL_HEALTH_DROP (magnitude: 35)
Age 26: HEALTH_CRISIS

LIFETIME CHALLENGES
Economic Struggle Events: 18
Mental Health Struggle Events: 24
Social Isolation Events: 12
Health Crisis Events: 8
Employment Instability Events: 5
```

## How to Use for Debugging

### Problem: "Why are suicide rates 50x too high?"

1. **Run trace:**
   ```bash
   node scripts/demo_death_trace.js
   ```

2. **Look at output:**
   - When did mental health first decline?
   - Were they isolated?
   - Any employment changes?
   - How many mental health events total?

3. **If mental health declining too fast:**
   - Check `getMentalHealthBaseline()` - baseline should be 88 at birth, 65 by age 18
   - Check stress multipliers in `driftMentalHealthCrisis()` - are they 10x too high?

4. **If too many crises by age 10:**
   - Check initialization
   - Check if baseline decay is happening too early

5. **Repeat with multiple traces to find pattern:**
   ```bash
   node scripts/analyze_death_traces.js
   ```
   - Look at lifetime challenges count
   - Compare across 10 lives

### Problem: "Why are 82% dead by age 30?"

1. **Run anomaly detector:**
   ```bash
   node scripts/detect_anomalies.js
   ```

2. **Check output for:**
   - "NEVER EMPLOYED BY AGE 30" - employment system broken
   - "TOO MANY MENTAL HEALTH CRISES" - stress too high
   - "UNEXPECTED DEATH AGES" - dying young from wrong cause

3. **Pick worst anomaly and trace:**
   ```javascript
   // Get a person who died at age 12
   tracer.printDeathTrace(youngDeathVictim, true);
   ```
   - See exact sequence: unemployment → poverty → homelessness → TB

4. **Fix the root cause** (e.g., employment system giving 0% employment rate to age 12)

## Data Structure: What Each Log Entry Contains

```javascript
{
  age: 27,                    // Age when event occurred
  year: 2052,                 // Absolute year
  eventType: "DEATH_BY_TUBERCULOSIS",
  context: {
    disease: "Tuberculosis",
    ...other event-specific fields
  },
  
  health: {
    physical: {
      current: 15,            // 0-100 scale
      baseline: 45,
      chronic: ["asthma", "cancer"]
    },
    mental: {
      current: 22,
      baseline: 65,
      suicideRisk: 0.156,
      chronic: ["depression", "ptsd"]
    }
  },
  
  economics: {
    resources: 0,             // Can't survive this
    debt: 150,
    employed: false
  },
  
  relationships: {
    married: false,
    friends: 0,
    children: 0,
    isolated: true
  },
  
  housing: {
    status: "homeless"
  }
}
```

## Interpreting Traces

### Red Flags to Look For

| Pattern | Meaning |
|---------|---------|
| Mental health 88→64 by age 20 | Baseline too low - check getMentalHealthBaseline() |
| 30+ mental health events by age 30 | Stress multipliers too high - check driftMentalHealthCrisis() |
| 0% employed by age 30 | Employment system broken - check shouldBeEmployed() |
| Resources = 0 but alive | Logic error - check calculateSurvivalFromState() |
| Homelessness at age 5 | Wrong threshold - check homelessness logic |
| Chronic conditions at age 0 | Initialization bug - check chronic array initialization |

### Green Flags

| Pattern | Meaning |
|---------|---------|
| Mental health 88→75 by age 20 | Realistic baseline decay |
| 5-10 mental health events by age 30 | Normal stress response |
| 60% employed by age 30 | Realistic employment rate |
| Resources stable or growing | Economic system working |
| Homelessness rare/late in life | Correct threshold |

## Files

- **`death_trace_system.js`** - Core DeathTracer class
- **`game_engine_v2_homeostatic.js`** - Engine with tracer integration
- **`scripts/demo_death_trace.js`** - Single trace demo
- **`scripts/analyze_death_traces.js`** - 10-life analysis
- **`scripts/detect_anomalies.js`** - Anomaly detector
- **`DEATH_TRACE_DOCUMENTATION.md`** - Full API reference
- **`DEATH_TRACE_SYSTEM_SUMMARY.md`** - Implementation details

## Next Steps

1. **Run anomaly detector** to find worst problem:
   ```bash
   node scripts/detect_anomalies.js
   ```

2. **Pick the biggest anomaly** (likely employment system)

3. **Trace several victims** of that issue:
   ```bash
   node scripts/analyze_death_traces.js
   ```

4. **Find the root cause** in game_engine_v2_homeostatic.js

5. **Fix the system** and re-run detector to verify

6. **Rinse and repeat** for next anomaly

You now have **full visibility into what's breaking your simulation**. 🔍
