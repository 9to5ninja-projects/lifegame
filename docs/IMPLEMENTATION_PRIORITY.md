/**
 * IMPLEMENTATION PRIORITY - Nordic Region
 * 
 * What's DONE vs what NEEDS WORK
 * Prioritized by impact on core systems (mortality, mental health, family)
 */

// ============================================================================
// TIER 1: CRITICAL FOR CORE MECHANICS (Do now)
// ============================================================================

const TIER_1_CRITICAL = {
  // DONE ✓
  employment_by_region: {
    status: "DONE",
    file: "employment_by_region.js",
    integrated: true,
    coverage: "Age/gender employment rates, 15% turnover"
  },
  
  education_system: {
    status: "DONE",
    file: "education_system.js",
    integrated: true,
    coverage: "Education stages, costs, completion rates, employment tiers"
  },
  
  cost_of_living: {
    status: "DONE",
    file: "cost_of_living.js",
    integrated: true,
    coverage: "Household costs, family size, income, benefits, stress curve"
  },

  // NEEDED - HIGH PRIORITY
  disease_and_mortality: {
    status: "PARTIAL",
    file: "global_statistics_v2.js",
    integrated: true,
    coverage: "Death rates exist but need age/gender detail for all causes",
    missing: [
      "Heart disease progression model (plaque buildup over time)",
      "Cancer risk by lifestyle (smoking, alcohol, obesity)",
      "Diabetes onset and complications model",
      "Respiratory disease from air quality/smoking",
      "Stroke risk from hypertension/age",
      "Chronic disease interactions (comorbidity)"
    ],
    priority: "VERY HIGH - major mortality cause"
  },

  suicide_and_mental_health: {
    status: "PARTIAL",
    file: "global_statistics_v2.js + game_engine.js",
    integrated: true,
    coverage: "Suicide calculation exists, but rates still too high",
    missing: [
      "Mental health episode triggers (not just static thresholds)",
      "Treatment effectiveness (therapy, medication)",
      "Recovery trajectories after crisis",
      "Protective factors (religion, community, purpose)",
      "Seasonal depression (SAD) in Nordic latitudes",
      "Gender differences in mental health (women: depression, men: substance abuse)"
    ],
    priority: "VERY HIGH - debugging suicide rate"
  },

  // NEEDED - ESSENTIAL
  fertility_and_childbirth: {
    status: "NOT STARTED",
    file: "NEED: fertility_system.js",
    integrated: false,
    coverage: "None",
    missing: [
      "Fertility probability by age/gender",
      "Pregnancy tracking and duration",
      "Maternal health complications",
      "Infant mortality by region/mother age",
      "Miscarriage rates",
      "Birth spacing and planning",
      "Abortion access and choices",
      "Adoption mechanics"
    ],
    priority: "CRITICAL - entire family tree depends on this"
  },

  child_loss_and_orphaning: {
    status: "NOT STARTED",
    file: "NEED: child_loss_system.js",
    integrated: false,
    coverage: "None",
    missing: [
      "Infant mortality (0-1 year)",
      "Childhood disease deaths (1-5 years)",
      "Childhood accidents (5-18 years)",
      "Orphan status triggers",
      "Guardian assignment",
      "Orphan stress/trauma model",
      "Institutional care vs relatives"
    ],
    priority: "CRITICAL - child vulnerability model"
  },
};

// ============================================================================
// TIER 2: IMPORTANT FOR REALISM (Do soon)
// ============================================================================

const TIER_2_IMPORTANT = {
  accident_and_injury: {
    status: "NOT STARTED",
    file: "NEED: accident_system.js",
    coverage: "None",
    missing: [
      "Traffic accident rates by age",
      "Occupational injury by employment tier",
      "Home accidents by age/region",
      "Injury severity (broken bone, severe, critical)",
      "Recovery time and disability",
      "Permanent disability outcomes"
    ],
    priority: "HIGH - 30+/100K deaths in Nordic youth"
  },

  substance_use: {
    status: "NOT STARTED",
    file: "NEED: substance_system.js",
    coverage: "None",
    missing: [
      "Alcohol consumption patterns",
      "Drug use initiation and progression",
      "Addiction development trajectory",
      "Health consequences (liver disease, etc)",
      "Social consequences (job loss, relationships)",
      "Recovery and treatment",
      "Deaths from overdose/complications"
    ],
    priority: "HIGH - substance abuse major mortality cause"
  },

  relationship_and_family: {
    status: "PARTIAL",
    file: "game_engine.js relationships section",
    coverage: "Basic relationship tracking",
    missing: [
      "Marriage/partnership formation mechanics",
      "Divorce triggers and stress",
      "Domestic violence model",
      "Child support calculations",
      "Multi-generational households",
      "Social support quality (close friends vs acquaintances)",
      "Relationship satisfaction over time"
    ],
    priority: "HIGH - relationships critical for mental health"
  },

  housing_and_displacement: {
    status: "NOT STARTED",
    file: "NEED: housing_system.js",
    coverage: "None",
    missing: [
      "Housing cost and affordability",
      "Homelessness triggers",
      "Housing instability stress",
      "Access to utilities (heating, water)",
      "Crowding and its effects",
      "Neighborhood safety",
      "Displacement risk (eviction, disaster)"
    ],
    priority: "MEDIUM - affects poverty and health"
  },

  immigration_and_social_integration: {
    status: "NOT STARTED",
    file: "NEED: migration_system.js",
    coverage: "None",
    missing: [
      "Migration trigger mechanics",
      "Language barrier stress",
      "Discrimination model",
      "Employment discrimination",
      "Social exclusion mechanics",
      "Integration over time",
      "Remittances and split households"
    ],
    priority: "MEDIUM - 5-10% of Nordic population"
  },
};

// ============================================================================
// TIER 3: POLISH & DEPTH (Do later)
// ============================================================================

const TIER_3_POLISH = {
  seasonal_effects: {
    missing: [
      "SAD (Seasonal Affective Disorder) in dark Nordic winters",
      "Seasonal suicide rate variation",
      "Cold-related mortality",
      "Influenza seasonality"
    ]
  },

  lifestyle_factors: {
    missing: [
      "Diet quality and effects",
      "Exercise levels and effects",
      "Sleep quality tracking",
      "Screen time effects",
      "Social media impact on mental health"
    ]
  },

  healthcare_seeking: {
    missing: [
      "When people seek medical care",
      "Healthcare access barriers",
      "Healthcare avoidance",
      "Preventive care uptake",
      "Mental health service use"
    ]
  },

  economic_shocks: {
    missing: [
      "Job loss events (recession)",
      "Income windfall events",
      "Inheritance mechanics",
      "Debt accumulation",
      "Financial crisis outcomes"
    ]
  },

  life_events_and_events: {
    missing: [
      "Major life events triggering stress/change",
      "Event timing and clustering",
      "Event recovery trajectories",
      "Intergenerational trauma"
    ]
  }
};

// ============================================================================
// IMMEDIATE ACTION ITEMS (Next 3 tasks)
// ============================================================================

const IMMEDIATE_TASKS = [
  {
    rank: 1,
    task: "Debug suicide rate - currently 331/100K, target 12/100K",
    why: "Core metric, 27x too high still",
    approach: [
      "Test if employment reduces mental health crises",
      "Test if education reduces stress baseline",
      "Check unemployment duration stress multiplier",
      "Check poverty stress calculation",
      "Verify global_statistics_v2.js baseline is correct"
    ],
    estimatedTime: "2-3 hours"
  },

  {
    rank: 2,
    task: "Implement fertility_system.js",
    why: "Cannot model families without births",
    approach: [
      "Age-based fertility probability",
      "Pregnancy duration and tracking",
      "Infant mortality by age/region",
      "Integrate into game engine annual cycle",
      "Test realistic birth rates"
    ],
    estimatedTime: "3-4 hours"
  },

  {
    rank: 3,
    task: "Implement child_loss_system.js",
    why: "Children die from disease, accidents, malnutrition",
    approach: [
      "Model childhood disease mortality",
      "Track orphan status and effects",
      "Integrate parental grief/stress mechanics",
      "Differentiate by region (Nordic vs Fragile)",
      "Test realistic child survival rates"
    ],
    estimatedTime: "3-4 hours"
  }
];

module.exports = {
  TIER_1_CRITICAL,
  TIER_2_IMPORTANT,
  TIER_3_POLISH,
  IMMEDIATE_TASKS,
};
