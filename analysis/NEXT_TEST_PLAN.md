# NEXT TEST PLAN: WEALTHY REGIONS FOR EMPLOYMENT & RETIREMENT

## Purpose
Verify employment and retirement systems work correctly by testing lives from wealthy birth regions (Nordic, Japan/South Korea, North America).

## Current Gap
All 3 test lives from poor regions remained unemployed throughout life, preventing employment and retirement systems from activating.

## Hypothesis
These systems DO work, but only activate when:
1. Starting with adequate resources
2. Achieving education/skill development
3. Reaching appropriate age for employment

---

## PRIORITY 1: WEALTHY REGION TESTS

### Test 1: NORDIC COUNTRY (Expected: High employment, early retirement)
```bash
node tests/deep_dive_single_life.js 4 nordic
```

Expected output should show:
- `[EMPLOYMENT] Employed, Income: [amount]`
- `[RETIREMENT] Retired at age [55-65]`
- Resources should vary with employment status
- Health disparities tied to employment


### Test 2: JAPAN/SOUTH KOREA (Expected: High employment, working late)
```bash
node tests/deep_dive_single_life.js 5 japan
```

Expected output should show:
- `[EMPLOYMENT] Employed at age ~20`
- Resources accumulating
- Possibly later retirement (age 65+)
- Career-related stress effects


### Test 3: NORTH AMERICA (Expected: Varied employment, health tied to work)
```bash
node tests/deep_dive_single_life.js 6 america
```

Expected output should show:
- `[EMPLOYMENT]` system activation
- Possible employment gaps (realistic for US)
- Health crises affecting employment
- Income volatility


---

## PRIORITY 2: SYSTEM VALIDATION TESTS

### Test 4: HIGH CONGENITAL REGION (Sub-Saharan Africa)
```bash
node tests/deep_dive_single_life.js 7 saharan
```

Expected: `[CONGENITAL]` at age 0


### Test 5: HIGH CONGENITAL REGION 2 (Developing world)
```bash
node tests/deep_dive_single_life.js 8 developing
```

Expected: Verify congenital system with different region


### Test 6: HIGH ACCIDENT REGION (War-torn or dangerous)
```bash
node tests/deep_dive_single_life.js 9 fragile
```

Expected: `[ACUTE CRISIS]` from injuries/accidents


---

## VALIDATION CRITERIA

### Priority 1 Tests Pass If:
- ✓ At least one life shows `[EMPLOYMENT]`
- ✓ At least one life shows `[RETIREMENT]`
- ✓ Resources actively tracked during employment
- ✓ Health disparities visible by employment status
- ✓ No crashes or errors


### Priority 2 Tests Pass If:
- ✓ `[CONGENITAL]` fires at least once
- ✓ `[ACCIDENTS]` fires at least once
- ✓ Birth region affects outcomes as expected
- ✓ Regional variation in systems is visible


### Overall Pass Condition:
If ALL tests pass:
- → System coverage reaches ~90%
- → Ready to launch new region
- → Full release candidate status


---

## EXECUTION NOTES

**Run Priority 1 Tests First:**
```bash
# Run all three wealthy region tests
node tests/deep_dive_single_life.js 4 nordic
node tests/deep_dive_single_life.js 5 japan
node tests/deep_dive_single_life.js 6 america

# Check for Employment/Retirement in output
# Review analysis/deep_dive_life_4.json, _5.json, _6.json
```

**If Priority 1 Passes, Run Priority 2:**
```bash
# Run system validation tests
node tests/deep_dive_single_life.js 7 saharan
node tests/deep_dive_single_life.js 8 developing
node tests/deep_dive_single_life.js 9 fragile

# Review for new system activations
```

**Document Results:**
- Compile system activation matrix across all 9 lives
- Note any regional patterns
- Identify any remaining gaps
- Prepare for new region launch


---

## Expected Outcomes

### If Employment/Retirement Systems Work:
✓ **Ready to Launch New Region:** Core systems verified at ~90% coverage
✓ **Recommend:** Full production release with documentation
✓ **Next Phase:** Expand to additional regions with confidence

### If Employment/Retirement Systems FAIL:
⚠ **Needs Investigation:** Debug why wealthy birth regions not triggering employment
⚠ **Likely Issues:**
  - Education system not working correctly
  - Employment triggers need education prerequisite
  - Income calculation not active during employment years
  - Retirement checks not looking at employment history

⚠ **Debug Path:**
1. Check game engine for education → employment logic
2. Verify employment.js system integration
3. Review retirement_system.js triggers
4. Add detailed logging to employment activation

---

## Timeline Estimate
- Priority 1: ~15 minutes to run 3 tests
- Priority 1 Analysis: ~10 minutes to review
- Priority 2: ~15 minutes to run 3 tests
- Priority 2 Analysis: ~10 minutes to review
- **Total: ~50 minutes**

If systems pass:
- → Ready to launch Nordic region immediately
- → Can test other wealthy regions in sequence

---

**Generated:** Post Deep Dive Verification
**Status:** Ready to execute next testing phase
