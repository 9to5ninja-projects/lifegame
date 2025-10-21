# Regional Economic Framework - Housing, Wages, Homelessness

## Western Europe (Denmark/Nordic Model) - Reference Region

### Real Statistics
- **Homelessness Rate**: 0.1% of population (6,635 homeless in ~5.8 million people in Denmark)
- **Housing Affordability**: Comprehensive welfare system ensures low homelessness despite high rents
- **Wages**: ~DKK 120/hour (~€16/hour) for entry-level work
- **Housing Costs**: DKK 5,000-8,000/month (~€670-1,070) for basic apartment in Copenhagen
- **Rent-to-Income Ratio**: ~30-40% for low-income workers (through subsidies)

### System Design For Western Europe

**Entry-Level Wages (Age 18-25):**
- Starting: 15-20 units/month (apprenticeship/part-time)
- After 1-2 years: 25-35 units/month (full-time unskilled)
- After 5+ years: 50-80 units/month (skilled trade)

**Housing Costs (Monthly):**
- homeless: 0 (free but isolation penalty: -15 health, social=-50)
- shelter: 0 (subsidized, isolation: -5 health, social=-30)
- overcrowded: 5 units (shared housing, no isolation penalty)
- basic_rental: 10 units (standard efficiency apartment)
- quality_rental: 20 units (nice 1-bedroom in good neighborhood)
- owned_home: 12 units (mortgage cost-equivalent, wealth building)
- owned_quality: 25 units (nice owned property)

**Housing Affordability Logic (Western Europe):**
```
affordableBudget = income * 0.4  (40% rule)

Age 18-25, income 15-20:
  affordableBudget = 6-8
  Problem: No rental ≤8 exists (minimum is overcrowded=5)
  Solution: Government housing subsidy
  Assignment: overcrowded (5 units)
  Effective income after subsidy: 15-20 covers living costs
  
Age 25-35, income 25-50:
  affordableBudget = 10-20
  Assignment: basic_rental (10) or quality_rental (20)
  Effective income sufficient for rent + living
  
Unemployed, income 0, resources 30+:
  affordableBudget = 0
  But has resources (unemployment benefits)
  Assignment: shelter (0 rent, uses resources)
  Effective: resources deplete by 10/month (living costs)
  
Homeless (unemployed, resources < 5):
  affordableBudget = 0, resources = 0
  Assignment: homeless (0 rent, 0 resources)
  Health crash: -15/year, isolation severe
  Likely: Dead within 5-10 years OR rescued by welfare
```

**Welfare/Housing Subsidy System (Western Europe):**
- Unemployed for >3 months: Receive housing subsidy (covers rent difference up to basic_rental)
- Students: Can access student housing at reduced cost
- Young adults (18-25) entering workforce: Government apprenticeship program with basic housing
- Disabled/Ill: Covered by universal healthcare, housing assistance
- Result: Homelessness rate ~0.1% (only people refusing help or newly arrived refugees)

**Living Costs (Monthly):**
- Base living: 10 units (food, transport, basics)
- Childcare: +3 per child
- Medical: Covered by taxes (universal healthcare)
- Maximum resources drain: ~10-15 units/month for low-income worker

### Marriage & Family Impact
- Marriage reduces housing costs 20% (dual income, shared space)
- Children +3 housing units/month but covered by child benefits
- Two-income household with 1-2 children can afford quality_rental (20) on combined 60 units income

---

## Southern Europe (Spain/Italy) - Higher Inequality Variant

**Key Differences:**
- Housing costs: 20-50% higher than Nordic countries
- Homelessness rate: 0.5-1.0% (5-10x higher than Nordic)
- Youth unemployment: 20-30%
- Welfare coverage: Lower, more family-dependent

**Wages:**
- Starting: 12-18 units/month
- Skilled: 40-70 units/month
- Homelessness risk: Higher for unemployed (< 1 month safety net)

**Welfare Coverage:**
- Government housing subsidy: Lower coverage (50% of those eligible)
- Family support: Critical (many young adults live at home until 30)
- Result: Homelessness from sudden job loss, family breakdown

---

## Eastern Europe (Poland/Romania) - Low Wages, Lower Costs

**Wages:**
- Starting: 8-12 units/month
- Skilled: 25-40 units/month

**Housing Costs:**
- Basic_rental: 6 units
- Overcrowded: 3 units

**Homelessness Rate:** 0.3-0.5%

**Welfare:** Very limited, family support essential

---

## War Zones / Sub-Saharan Africa - Extreme Poverty

**Homelessness Rate:** 10-30%

**Wages:** 2-8 units/month (when employment exists)

**Housing Costs:**
- Overcrowded: 8-12 units (exploitative landlords)
- Shelter: 0-2 units
- Homelessness: Common

**Welfare:** None

**Survival Mechanics:**
- Resources deplete at 15-20/month (inadequate food, water)
- Death from starvation/disease common if unemployed >3 months
- Homelessness → death within months without external aid

---

## Implementation Strategy

### For Current Game (Western Europe):
1. Set entry wages to 15-30 range (age-dependent)
2. Set housing costs: overcrowded(5), basic_rental(10), quality_rental(20)
3. Implement housing subsidy: Unemployed get free shelter (0 cost, isolation penalty instead of income loss)
4. Keep 40% affordability rule BUT: Subsidies bridge gap for young workers
5. Homelessness rate should be ~0.1% naturally emergent

### Parametrization For Other Regions:
```javascript
REGIONAL_ECONOMIC_DATA = {
  "Western Europe": {
    minWage: 15,
    maxEntryWage: 20,
    housingCosts: {overcrowded: 5, basic_rental: 10, quality_rental: 20, ...},
    welfareSubsidyCoverage: 0.95,  // 95% of unemployed get housing subsidy
    homelessnessRate: 0.001,        // 0.1%
  },
  "Southern Europe": {
    minWage: 12,
    maxEntryWage: 18,
    housingCosts: {overcrowded: 8, basic_rental: 15, quality_rental: 30, ...},
    welfareSubsidyCoverage: 0.50,
    homelessnessRate: 0.007,        // 0.7%
  },
  // ... more regions
}
```

---

## Family Support System (Interregional)

**Western Europe:**
- Parents support unemployed adult children through ages 18-25 (50% of cases)
- Family housing available if worker returns to parents' town
- Resources baseline high due to family wealth

**Southern Europe:**
- Parents support children ages 18-35 (70% of cases)
- Multi-generational housing common
- Family crisis (death of parent) → major poverty risk

**Eastern Europe:**
- Family support critical (lack of welfare)
- Multi-generational housing
- Emigration common to richer countries

**Sub-Saharan Africa:**
- Extended family support critical
- Clan/community networks
- Urban migration → loss of family support → homelessness risk

