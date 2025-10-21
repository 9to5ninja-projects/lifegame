# Retirement System Documentation

## Overview

The retirement system models how people transition from work to retirement, including:
- **When** they retire (age, wealth-based, health-forced)
- **How much** income they receive (pensions, benefits, wealth drawdown)
- **What standard** of living they maintain (comfortable → poverty)

## Regional Retirement Models

### Nordic (Scandinavia)
- Standard retirement age: **65**
- Strong state pension: **60% of lifetime average income**
- Universal welfare: Low poverty rates (<1% in retirement)
- Income equality: Rich/poor gap compressed in old age

### Developed (US, Western Europe)
- Standard retirement age: **67**  
- Moderate state pension: **50% of lifetime average**
- Higher inequality than Nordic
- Poverty rates: ~5-10% in retirement

### Emerging (China, India, Brazil)
- Standard retirement age: **60**
- Weak state pension: **30% of lifetime average**
- High reliance on family support
- Poverty rates: ~20-30% in retirement

### Developing (Sub-Saharan Africa)
- **No formal retirement age** - work until unable
- Minimal/no state pension: **10% of lifetime average**
- Subsistence living in old age
- Poverty rates: ~50-70% in retirement

## Retirement Decision Logic

### When to Retire

People retire when:

1. **Age-based**: Reach standard retirement age (if they can afford it)
2. **Wealth-based**: Have accumulated enough wealth to maintain standard
3. **Health-forced**: Health drops below 50 at age 55+ (can't work anymore)

### Affordability Thresholds (Nordic)

```javascript
Comfortable retirement: 800+ wealth units
Adequate retirement:    400-800 wealth units  
Minimal retirement:     200-400 wealth units
Cannot afford:          <200 wealth units
```

## Income in Retirement

### Three Income Sources

1. **Employment Income**
   - If still working (not retired or part-time)
   - Drops sharply after age 65 (most people retire)

2. **Pension Income** (if retired)
   - **State pension**: `lifetimeAvgIncome × regionalPensionRate`
   - **Wealth drawdown**: `accumulatedWealth × 0.04` (4% rule)
   - Dominant source: ~90% of retirement income

3. **Benefit Income** (if unemployed/low income)
   - Social safety net
   - ~10% of retirement income
   - Prevents complete poverty

### Income Calculation Example (Nordic)

```
Person with:
  - Lifetime average income: 100
  - Accumulated wealth: 2000
  - Regional pension rate: 60%

Retirement income:
  - State pension: 100 × 0.60 = 60
  - Wealth drawdown: 2000 × 0.04 = 80
  - Benefits: 15 (minimum if needed)
  - TOTAL: ~140 per year
```

## Living Standards in Retirement

### Classification Thresholds (Nordic)

| Standard | Income Range | % of Population | Description |
|----------|-------------|----------------|-------------|
| **Comfortable** | 112+ | ~51% | Above median income, can afford extras |
| **Adequate** | 67-112 | ~31% | Living decently, covering all needs |
| **Struggling** | 30-67 | ~17% | Making ends meet, tight budget |
| **Poverty** | <30 | ~1% | Severe hardship (very rare in Nordic) |

### Standards Update Dynamically

- Living standard is **recalculated every year**
- Income changes as wealth depletes, pensions adjust
- People can move between standards over time

## Class Stratification in Retirement

### Rich vs Poor Outcomes (Nordic, Age 70)

| Metric | Rich Birth | Poor Birth | Gap |
|--------|-----------|-----------|-----|
| **Retirement rate** | 85% | 81% | +4% |
| **Retirement age** | 63.9 years | 64.2 years | -0.3 years |
| **Total income** | 130 | 123 | +5.6% |
| **Pension income** | 117 (90%) | 111 (90%) | +5.4% |
| **Accumulated wealth** | 2247 | 1998 | +12.5% |
| **Comfortable standard** | 50.6% | 44.4% | +6.2pp |
| **Poverty rate** | 0% | 1.2% | -1.2pp |

### Key Findings

1. **Nordic welfare compresses inequality**
   - Rich earn only 5.6% more than poor at age 70
   - Compare to working age: 50-100% income gap
   
2. **Pensions are equalizing**
   - 90% of income from pensions for both rich and poor
   - State pension formula treats all equally
   
3. **Wealth matters, but less than expected**
   - Rich have 12.5% more wealth
   - But translates to only 5.6% more income (4% drawdown rule)
   
4. **Living standards overlap heavily**
   - 44% of poor achieve comfortable retirement
   - 0% of rich fall into poverty
   - Middle classes (adequate/struggling) = 35-46%

## Integration with Game Engine

### Yearly Processing (in processYearEnd)

```javascript
1. Update employment status (employment_system.js)
2. Process retirement decisions (retirement_system.js)
   - Track lifetime income
   - Decide if should retire
   - Calculate pension/benefit income
   - Update living standard
3. Update relationships, housing, etc.
```

### Player Object Structure

```javascript
player.economics.retirement = {
  isRetired: boolean,
  retirementAge: number,
  lifetimeAvgIncome: number,
  lifetimeWorkYears: number,
  retirementStandard: 'comfortable'|'adequate'|'struggling'|'poverty'
}

player.economics.income = {
  total: number,
  employmentIncome: number,  // If working
  pensionIncome: number,      // If retired
  benefitIncome: number       // If unemployed/low income
}
```

## Testing & Validation

### Test Scripts

1. **test_retirement_system.js**
   - Compares 100 rich vs 100 poor births
   - Tracks retirement timing, income sources, living standards
   - Snapshots at age 70 for comparison

2. **calibrate_retirement_standards.js**
   - Analyzes 200 Nordic lives at age 70
   - Shows income distribution (mean, median, percentiles)
   - Validates threshold calibration

### Validation Results

✅ **Income inversion FIXED**: Rich now earn more than poor in retirement (was reversed before)  
✅ **Pension dominance**: 88-90% of retirement income from pensions (realistic)  
✅ **Nordic poverty <1%**: Strong welfare state prevents destitution  
✅ **Comfortable majority**: 50%+ achieve comfortable retirement  
✅ **Class gaps compressed**: Rich advantage exists but muted by welfare

## Regional Comparison (Future Work)

### Expected Patterns

**Nordic vs US vs Developing**

| Metric | Nordic | US (Expected) | Developing (Expected) |
|--------|--------|--------------|---------------------|
| Poverty rate | <1% | 10-15% | 50-70% |
| Comfortable rate | 51% | 30-40% | 10-20% |
| Rich-poor income gap | 5.6% | 30-50% | 100%+ |
| Pension coverage | 90% | 60-70% | 10-20% |

### Next Steps

1. Test retirement in **US region** (expect higher poverty, larger class gaps)
2. Test retirement in **Developing region** (expect most never retire, work until death)
3. Add **couples retirement** (joint income, survivor benefits)
4. Add **gender analysis** (women typically have lower pensions)

## Design Philosophy

### Balancing Realism and Playability

1. **Regional diversity**: Different retirement experiences by development level
2. **Class stratification**: Rich advantage exists but isn't overwhelming
3. **Welfare state effects**: Nordic model successfully reduces inequality
4. **Dynamic standards**: Living standards change as wealth depletes
5. **Multiple pathways**: Age, wealth, or health can trigger retirement

### Data-Driven Calibration

- Thresholds based on **actual income distribution** (median, percentiles)
- Not arbitrary numbers, but derived from simulation output
- Iterative testing until distributions match real-world patterns
- Nordic <1% poverty aligns with real Scandinavian elderly poverty rates

## Code References

- **retirement_system.js**: Main retirement logic (358 lines)
- **game_engine_v2_homeostatic.js**: Integration (line ~780)
- **scripts/test_retirement_system.js**: Rich vs poor testing
- **scripts/calibrate_retirement_standards.js**: Threshold calibration
