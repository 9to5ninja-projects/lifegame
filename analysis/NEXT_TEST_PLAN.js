/**
 * TEST PLAN: WEALTHY REGIONS FOR EMPLOYMENT & RETIREMENT SYSTEMS
 * 
 * Purpose: Verify employment and retirement systems work correctly by testing
 * lives from wealthy birth regions (Nordic, Japan/South Korea, North America)
 * 
 * Current Gap: All 3 test lives from poor regions remained unemployed throughout
 * life, preventing employment and retirement systems from activating.
 * 
 * Hypothesis: These systems DO work, but only activate when:
 *   1. Starting with adequate resources
 *   2. Achieving education/skill development
 *   3. Reaching appropriate age for employment
 * 
 * Expected Outcomes from Wealthy Regions:
 *   ✓ Employment system activates (ages 15-65)
 *   ✓ Retirement system activates (ages 60+)
 *   ✓ Income tracking visible
 *   ✓ Resource management becomes key mechanic
 *   ✓ Health disparities tied to employment status
 */

// RECOMMENDED TEST SEQUENCE:

// Test 1: NORDIC COUNTRY (Expected: High employment, early retirement)
node tests/deep_dive_single_life.js 4 nordic

// Expected output should show:
// [EMPLOYMENT] Employed, Income: [amount]
// [RETIREMENT] Retired at age [55-65]
// Resources should vary with employment status


// Test 2: JAPAN/SOUTH KOREA (Expected: High employment, working late)
node tests/deep_dive_single_life.js 5 japan

// Expected output should show:
// [EMPLOYMENT] Employed at age ~20
// Resources accumulating
// Possibly later retirement (age 65+)


// Test 3: NORTH AMERICA (Expected: Varied employment, health tied to work)
node tests/deep_dive_single_life.js 6 america

// Expected output should show:
// [EMPLOYMENT] system activation
// Possible employment gaps (realistic for US)
// Health crises affecting employment


// FOLLOW-UP TESTS (After Priority 1):

// Test 4: HIGH CONGENITAL REGION (Sub-Saharan Africa)
node tests/deep_dive_single_life.js 7 saharan

// Expected: [CONGENITAL] at age 0


// Test 5: ANOTHER HIGH CONGENITAL (High burden of disease region)
node tests/deep_dive_single_life.js 8 developing

// Test 6: HIGH ACCIDENT REGION (War-torn or dangerous area)
node tests/deep_dive_single_life.js 9 fragile

// Expected: [ACUTE CRISIS] from injuries/accidents


// VALIDATION CRITERIA:

// Priority 1 Tests Pass If:
✓ At least one life shows [EMPLOYMENT]
✓ At least one life shows [RETIREMENT]
✓ Resources actively tracked during employment
✓ Health disparities visible by employment status
✓ No crashes or errors

// Priority 2 Tests Pass If:
✓ [CONGENITAL] fires at least once
✓ [ACCIDENTS] fires at least once
✓ Birth region affects outcomes as expected
✓ Regional variation in systems is visible

// If ALL Tests Pass:
→ System coverage reaches ~90%
→ Ready to launch new region
→ Full release candidate
