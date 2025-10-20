# Death Trace System - Developer Documentation

## Overview

The Death Trace System enables **complete causal chain reconstruction** for every simulated life. Rather than just seeing that someone died, you can replay their entire life backwards (or forwards) to understand:

1. **What events led to their death**
2. **When did critical turning points occur** (health/economic/social collapse)
3. **What chronic challenges accumulated** over their lifetime
4. **How different systems interacted** to produce the outcome

This is crucial for **debugging** why the mortality rates are wrong, why mental health is declining, and identifying which systems need fixes.

## Architecture

### Core Components

#### 1. **DeathTracer Class** (`death_trace_system.js`)
The main logging system that records every significant life event with full context.

```javascript
const tracer = new DeathTracer();
```

**Key Methods:**
- `initializeLifeLog(player)` - Start tracking a player's life
- `logEvent(player, eventType, context)` - Log any event with full health/economic/social context
- `getLifeLog(player)` - Retrieve complete event history
- `getDeathEvent(player)` - Get the fatal event
- `traceCausalChain(player)` - Analyze what led to death
- `printDeathTrace(player, verbose)` - Pretty-print the trace report

#### 2. **Game Engine Integration** (`game_engine_v2_homeostatic.js`)
The engine automatically logs events through the tracer when enabled.

```javascript
// Enable tracing
const engine = new MortalityGameV2(birthCards, familyCards, eventCards, deathCards, tracer);

// Or replace later
engine.setDeathTracer(newTracer);

// Disable for performance
engine.disableDeathTracing();
```

## Event Logging Hooks

### Health System Events

```javascript
// Mental health crisis detected
tracer.logMentalHealthCrisis(player, severity, trigger);

// Suicide attempt
tracer.logSuicideAttempt(player, survived, method, details);

// Suicide death
tracer.logDeathBySuicide(player, method, details);

// Cancer progression
tracer.logCancerProgression(player, stage, details);
```

### Economic System Events

```javascript
// Poverty/income change
tracer.logPovertyStateChange(player, status);

// Employment change
tracer.logEmploymentChange(player, employed, reason);

// Homelessness
tracer.logHomelessnessEvent(player, status);
```

### Social System Events

```javascript
// Relationship change
tracer.logRelationshipChange(player, changeType, details);

// Trauma (PTSD, assault, etc)
tracer.logTraumaEvent(player, traumaType, details);
```

### Cause-of-Death Events

```javascript
// By disease
tracer.logDeathByDisease(player, disease, details);

// By accident
tracer.logDeathByAccident(player, type, details);

// By violence
tracer.logDeathByViolence(player, cause, details);

// Other cause
tracer.logDeathByOtherCause(player, cause, details);
```

## Data Captured per Event

Every logged event includes:

```javascript
{
  age: number,                    // Age when event occurred
  year: number,                   // Absolute year
  eventType: string,              // MENTAL_HEALTH_CRISIS, DEATH_BY_SUICIDE, etc
  context: object,                // Event-specific details
  
  // Full state snapshot at this moment
  health: {
    physical: { current, baseline, chronic: [] },
    mental: { current, baseline, suicideRisk, chronic: [] }
  },
  economics: {
    resources: number,
    debt: number,
    employed: boolean
  },
  relationships: {
    married: boolean,
    friends: number,
    children: number,
    isolated: boolean
  },
  housing: {
    status: string              // stable, unstable, homeless
  }
}
```

This **full context at each point in time** lets you see:
- Was their health already degraded before the crisis?
- Did they lose employment leading up to death?
- Were they socially isolated?

## Analysis Methods

### 1. Get Complete Life Log

```javascript
const log = tracer.getLifeLog(player);
// Returns: [{age, eventType, context, health, ...}, ...]

// Access only pre-death events
const lifeEvents = tracer.getLifeLogBeforeDeath(player);
```

### 2. Trace Causal Chain

```javascript
const chain = tracer.traceCausalChain(player);
/*
Returns:
{
  death: { ... },                         // Death event details
  immediateFactors: {
    healthFactors: [],
    economicFactors: [],
    socialFactors: [],
    contextualFactors: []
  },
  turningPoints: [
    { age, type, magnitude, event }       // MENTAL_HEALTH_DROP, ECONOMIC_CRISIS, etc
  ],
  lifetimeChallenges: {
    economicStruggle: count,
    mentalHealthStruggle: count,
    socialIsolation: count,
    healthCrisis: count,
    employmentInstability: count
  }
}
*/
```

### 3. Print Formatted Report

```javascript
// Quick overview
tracer.printDeathTrace(player, verbose = false);

// Full timeline with every event
tracer.printDeathTrace(player, verbose = true);
```

Output example:
```
================================================================================
DEATH TRACE REPORT
================================================================================

MALE - Born in Nordic Country
Lived: 27 years (Expected: 83 years)
Birth Year: 2025

--------------------------------------------------------------------------------
CAUSE OF DEATH
--------------------------------------------------------------------------------
Age: 27
Primary Cause: Tuberculosis
Health Factors:
  - Severely compromised physical health
  - Multiple chronic conditions: cancer, asthma
Economic Factors:
  - Severe resource poverty
Mental Factors:
  - Severe mental health crisis

--------------------------------------------------------------------------------
CRITICAL TURNING POINTS
--------------------------------------------------------------------------------
Age 12: EMPLOYMENT_LOSS
Age 15: MENTAL_HEALTH_DROP (magnitude: 28)
Age 22: HOMELESSNESS_ONSET
Age 24: MENTAL_HEALTH_DROP (magnitude: 35)
Age 26: HEALTH_CRISIS

--------------------------------------------------------------------------------
LIFETIME CHALLENGES
--------------------------------------------------------------------------------
Economic Struggle Events: 18
Mental Health Struggle Events: 24
Social Isolation Events: 12
Health Crisis Events: 8
Employment Instability Events: 5
```

### 4. Compare Multiple Deaths

```javascript
const players = [...]; // Array of dead players
const patterns = tracer.analyzeMortalityPatterns(players);
/*
Returns:
{
  primaryCauses: {
    "Disease X": 15,
    "Suicide": 8,
    "Accident": 3,
    ...
  },
  ageAtDeath: [27, 34, 19, ...],
  byRegion: {
    "Nordic Country": {
      count: 10,
      avgAge: 28.5,
      causes: { ... }
    },
    ...
  }
}
*/
```

### 5. Export for External Analysis

```javascript
const exported = tracer.exportDeathTrace(player);
// Save to JSON for Python analysis, Excel import, etc
fs.writeFileSync('trace.json', JSON.stringify(exported, null, 2));
```

## Usage Example: Debugging High Suicide Rates

**Problem:** Why is suicide rate 50x too high?

**Solution:**

1. **Run trace on a suicidal death:**
   ```javascript
   tracer.printDeathTrace(suicideVictim, true);
   ```

2. **Look at turning points:**
   - When did mental health start declining?
   - Was there an employment loss before crisis?
   - Were they isolated?

3. **Inspect log backward:**
   - Find first mental health degradation event
   - Check what caused it (economic stress? social isolation?)
   - Verify the stress multipliers are reasonable

4. **Check lifetime challenges:**
   - If 50+ mental health struggles by age 27, baseline is broken
   - If 0 employment events despite 13.7% employment rate, employment system is broken

5. **Compare with expected patterns:**
   - Real Nordic teen suicide rate: 12.6/100K
   - Your rate: 679/100K (54x too high)
   - The trace will show if it's:
     - Wrong baseline (no, already fixed)
     - Wrong stress multipliers (check driftMentalHealthCrisis)
     - Wrong baseline decay (check getMentalHealthBaseline)
     - Missing positive events (check processPossibleEvent)

## Performance Considerations

**Tracing adds overhead:** Each event logs ~200 bytes of context

**For production:**
- Disable with `engine.disableDeathTracing()`
- Or use sparse tracer that only logs key events

**For debugging:**
- Keep enabled to understand system behavior

## Integration Checklist

- [x] DeathTracer class created
- [x] Game engine constructor accepts tracer
- [x] Player creation logs birth event
- [x] Suicide death logs cause
- [x] Mental health crisis logs trigger
- [ ] **TODO:** Add logging to driftCancer()
- [ ] **TODO:** Add logging to driftAddiction()
- [ ] **TODO:** Add logging to employment changes
- [ ] **TODO:** Add logging to relationship changes
- [ ] **TODO:** Add logging to homelessness events

## Next Steps

1. **Add all drift system logging** - Every major change should log
2. **Add event system logging** - When processPossibleEvent fires positive/negative events
3. **Create replay visualization** - UI to step through events
4. **Statistical analysis** - Correlate turning points with outcomes
5. **Automated debugging** - Detect when patterns are wrong and flag them

## Example Scripts

### See single life trace
```bash
node scripts/demo_death_trace.js
```
Output: Single person's complete life trace

### Analyze 10 lives from Nordic Country
```bash
node scripts/analyze_death_traces.js
```
Output: Patterns, turning points, cause-of-death distribution

## File Locations

- **System:** `death_trace_system.js`
- **Integration:** `game_engine_v2_homeostatic.js` lines 6-46
- **Demo scripts:** `scripts/demo_death_trace.js`, `scripts/analyze_death_traces.js`
- **Output:** `death_trace_output.json`, `death_trace_analysis_report.json`
