/**
 * HEALTH CRISIS SYSTEM
 * 
 * Models serious health conditions and their cascading effects on:
 * - Patient (physical/mental health, employment, fertility)
 * - Family members (stress, caregiver burden, financial impact)
 * - Social network (friend support, workplace discrimination)
 * - Children (mental health if parent is ill)
 * 
 * Includes:
 * 1. Chronic diseases (Type 1/2 diabetes, heart disease, autoimmune)
 * 2. Congenital conditions (birth defects, disabilities)
 * 3. Acute crises (stroke, heart attack)
 * 4. Cancer (integrated from cancer_system.js)
 */

// ============================================================================
// CHRONIC DISEASES
// ============================================================================

const CHRONIC_DISEASES = {
  type1Diabetes: {
    name: "Type 1 Diabetes",
    onset: "sudden", // Can appear in childhood or adulthood
    incidence: {
      Nordic: 0.04,    // 4 per 100,000 per year
      Developed: 0.03,
      Emerging: 0.01,
      Developing: 0.005,
      Fragile: 0.002
    },
    ageGroups: {
      "0-20": 0.35,    // 35% of type 1 cases
      "20-40": 0.40,   // 40% of cases
      "40-60": 0.20,   // 20% of cases
      "60+": 0.05      // 5% of cases
    },
    penalties: {
      physical: -3,    // Per year health decline
      mental: -1,      // Chronic stress
      employment: -0.5, // Reduced capacity
      fertility: -0.2  // Slight impact
    },
    treatmentAccessModifier: {
      Nordic: 0.7,     // Penalties reduced 30% with access
      Developed: 0.75,
      Emerging: 1.0,   // No reduction without access
      Developing: 1.15, // Actually worse without access (complications)
      Fragile: 1.3
    },
    complications: ["hypoglycemia", "diabeticNeuropathy", "nephropathy", "retinopathy"],
    lifeExpectancyReduction: 15 // Years
  },

  type2Diabetes: {
    name: "Type 2 Diabetes",
    onset: "gradual",
    incidence: {
      Nordic: 0.8,
      Developed: 1.2,
      Emerging: 0.8,
      Developing: 0.4,
      Fragile: 0.1
    },
    ageGroups: {
      "0-20": 0.01,
      "20-40": 0.05,
      "40-60": 0.50,   // 50% of type 2 diagnosed 40-60
      "60+": 0.44      // 44% diagnosed 60+
    },
    riskFactors: {
      obesity: 3.0,    // 3x more likely if obese
      sedentary: 2.0,
      familyHistory: 2.5
    },
    penalties: {
      physical: -2,
      mental: -0.5,
      employment: -0.3,
      fertility: -0.1
    },
    treatmentAccessModifier: {
      Nordic: 0.5,
      Developed: 0.6,
      Emerging: 0.9,
      Developing: 1.2,
      Fragile: 1.4
    },
    complications: ["cardiovascular", "neuropathy", "nephropathy", "vision"],
    lifeExpectancyReduction: 8
  },

  heartDisease: {
    name: "Heart Disease",
    onset: "gradual",
    incidence: {
      Nordic: 0.5,
      Developed: 0.7,
      Emerging: 0.4,
      Developing: 0.2,
      Fragile: 0.1
    },
    ageGroups: {
      "0-20": 0.01,
      "20-40": 0.15,
      "40-60": 0.60,
      "60+": 0.24
    },
    riskFactors: {
      smoking: 2.5,
      highBloodPressure: 3.0,
      highCholesterol: 2.0,
      stress: 1.5,
      obesity: 1.8,
      diabetes: 2.0
    },
    penalties: {
      physical: -4,
      mental: -2,
      employment: -1.0,
      fertility: -0.3
    },
    treatmentAccessModifier: {
      Nordic: 0.6,
      Developed: 0.65,
      Emerging: 0.95,
      Developing: 1.3,
      Fragile: 1.5
    },
    complications: ["arrhythmia", "heartFailure", "stroke", "MI"],
    lifeExpectancyReduction: 12
  },

  autoimmune: {
    name: "Autoimmune Disease",
    onset: "gradual",
    types: ["lupus", "rheumatoidArthritis", "multipleSc lerosis", "celiacDisease"],
    incidence: {
      Nordic: 0.3,
      Developed: 0.25,
      Emerging: 0.15,
      Developing: 0.08,
      Fragile: 0.05
    },
    ageGroups: {
      "0-20": 0.20,
      "20-40": 0.40,
      "40-60": 0.30,
      "60+": 0.10
    },
    genderRatio: {
      female: 0.75, // 75% of autoimmune patients are female
      male: 0.25
    },
    penalties: {
      physical: -2,
      mental: -1.5, // High psychological impact from unpredictability
      employment: -0.8,
      fertility: -0.4
    },
    treatmentAccessModifier: {
      Nordic: 0.4,
      Developed: 0.5,
      Emerging: 0.85,
      Developing: 1.2,
      Fragile: 1.4
    },
    complications: ["flare", "organ damage", "infection", "depression"],
    lifeExpectancyReduction: 10
  },

  chronicPain: {
    name: "Chronic Pain Syndrome",
    onset: "gradual",
    incidence: {
      Nordic: 0.8,
      Developed: 1.0,
      Emerging: 0.6,
      Developing: 0.3,
      Fragile: 0.1
    },
    ageGroups: {
      "0-20": 0.05,
      "20-40": 0.25,
      "40-60": 0.50,
      "60+": 0.20
    },
    causes: ["arthritis", "fibromyalgia", "neuropathy", "trauma"],
    penalties: {
      physical: -2,
      mental: -3, // High depression/suicide risk
      employment: -1.2,
      fertility: 0
    },
    treatmentAccessModifier: {
      Nordic: 0.5,
      Developed: 0.6,
      Emerging: 1.1,
      Developing: 1.4,
      Fragile: 1.5
    },
    complications: ["depression", "addiction", "suicide", "isolation"],
    lifeExpectancyReduction: 5,
    suicideRiskMultiplier: 1.5
  }
};

// ============================================================================
// CONGENITAL CONDITIONS (at birth)
// ============================================================================

const CONGENITAL_CONDITIONS = {
  cerebralPalsy: {
    name: "Cerebral Palsy",
    severity: "moderate", // mild, moderate, severe
    prevalence: {
      Nordic: 0.002,
      Developed: 0.0025,
      Emerging: 0.003,
      Developing: 0.005,
      Fragile: 0.008
    },
    impacts: {
      physical: -20, // Permanent reduction in physical capacity
      mobility: "restricted", // Affects employment options
      education: -0.3, // 30% reduction in education outcomes
      employment: -0.5, // 50% unemployment increase
      lifespan: 0 // No lifespan reduction if managed
    },
    requiresCaregiver: true
  },

  downSyndrome: {
    name: "Down Syndrome (Trisomy 21)",
    severity: "moderate-severe",
    prevalence: {
      Nordic: 0.0013,
      Developed: 0.0015,
      Emerging: 0.002,
      Developing: 0.003,
      Fragile: 0.005
    },
    maleFemaleRatio: 1.0,
    maternalAgeRisk: true, // Risk increases with maternal age >35
    impacts: {
      intellectual: -40, // IQ typically 30-70
      physical: -15,
      education: -0.8, // Severe education barrier
      employment: -0.9, // 85-90% never employed
      independence: "partial", // Lives with parents/caregivers usually
      lifespan: -20
    },
    healthComplications: ["heartDefects", "thyroidDisease", "gastrointestinal", "hearing"],
    requiresCaregiver: true,
    caregiverBurden: "extreme" // Lifelong care needed
  },

  autismSpectrum: {
    name: "Autism Spectrum Disorder",
    severity: "variable", // mild (Asperger's) to severe
    prevalence: {
      Nordic: 0.01,
      Developed: 0.015,
      Emerging: 0.008,
      Developing: 0.004,
      Fragile: 0.002
    },
    maleFemaleRatio: 3.0, // 3x more common in males (though underdiagnosed in females)
    impacts: {
      social: -0.4, // 40% reduction in social capability/relationships
      employment: -0.3, // 30% unemployment increase (varies by severity)
      education: -0.2, // Can attend mainstream school if supported
      lifespan: 0 // No lifespan impact if supported
    },
    canImprove: true, // With early intervention, outcomes improve
    requiresCaregiver: false,
    variableSeverity: true
  },

  cleftPalateLip: {
    name: "Cleft Palate/Lip",
    severity: "mild-moderate",
    prevalence: {
      Nordic: 0.0008,
      Developed: 0.001,
      Emerging: 0.0015,
      Developing: 0.002,
      Fragile: 0.003
    },
    impacts: {
      speech: -0.2,
      appearance: -0.3, // Social stigma and mental health
      employment: -0.1,
      lifespan: 0
    },
    treatability: "high", // Correctable with surgery in developed countries
    surgeryAccess: {
      Nordic: 0.99,
      Developed: 0.95,
      Emerging: 0.60,
      Developing: 0.20,
      Fragile: 0.05
    },
    requiresCaregiver: false
  },

  hemophilia: {
    name: "Hemophilia",
    severity: "moderate-severe",
    prevalence: {
      Nordic: 0.0001,
      Developed: 0.00012,
      Emerging: 0.00015,
      Developing: 0.0002,
      Fragile: 0.00025
    },
    primaryGender: "male", // X-linked recessive
    impacts: {
      physical: -10, // Bleeding episodes limit activity
      employment: -0.4, // Limited to safe jobs
      lifespan: -15 // Historically; now manageable with treatment
    },
    treatmentAccess: {
      Nordic: 0.98,
      Developed: 0.95,
      Emerging: 0.60,
      Developing: 0.10,
      Fragile: 0.02
    },
    requiresCaregiver: true
  },

  cysticFibrosis: {
    name: "Cystic Fibrosis",
    severity: "severe",
    prevalence: {
      Nordic: 0.00025,
      Developed: 0.0003,
      Emerging: 0.0001,
      Developing: 0.00005,
      Fragile: 0.00002
    },
    impacts: {
      physical: -25,
      employment: -0.6,
      lifespan: -35 // Median survival now 50+ years with treatment
    },
    treatmentAccess: {
      Nordic: 0.99,
      Developed: 0.98,
      Emerging: 0.40,
      Developing: 0.05,
      Fragile: 0.01
    },
    lifeExpectancyWithTreatment: 50,
    lifeExpectancyWithoutTreatment: 10,
    requiresCaregiver: true,
    caregiverBurden: "extreme"
  }
};

// ============================================================================
// ACUTE HEALTH CRISES
// ============================================================================

const ACUTE_CRISES = {
  stroke: {
    name: "Stroke",
    incidence: {
      Nordic: 0.15,    // 150 per 100,000 per year
      Developed: 0.12,
      Emerging: 0.10,
      Developing: 0.08,
      Fragile: 0.05
    },
    ageGroups: {
      "0-50": 0.05,
      "50-65": 0.25,
      "65-80": 0.45,
      "80+": 0.25
    },
    riskFactors: {
      hypertension: 3.0,
      diabetes: 2.0,
      smoking: 1.8,
      highCholesterol: 1.5,
      atrial: 2.5, // Atrial fibrillation
      previousStroke: 8.0
    },
    mortality: {
      Nordic: 0.10,    // 10% mortality with treatment
      Developed: 0.12,
      Emerging: 0.30,
      Developing: 0.50,
      Fragile: 0.70
    },
    outcomes: {
      full_recovery: 0.10,
      partial_recovery: 0.50,
      permanent_disability: 0.30,
      death: 0.10
    },
    disabilityImpacts: {
      physical: -30,
      employment: -0.8,
      independence: "variable",
      lifespan: -8
    },
    causesCaregiver: true
  },

  heartAttack: {
    name: "Heart Attack (MI)",
    incidence: {
      Nordic: 0.08,
      Developed: 0.10,
      Emerging: 0.06,
      Developing: 0.03,
      Fragile: 0.02
    },
    ageGroups: {
      "0-40": 0.02,
      "40-60": 0.45,
      "60-80": 0.40,
      "80+": 0.13
    },
    riskFactors: {
      previousHD: 5.0,
      smoking: 2.5,
      diabetes: 2.0,
      hypertension: 1.8,
      stress: 1.5,
      sedentary: 1.3
    },
    mortality: {
      Nordic: 0.05,
      Developed: 0.07,
      Emerging: 0.15,
      Developing: 0.30,
      Fragile: 0.50
    },
    outcomes: {
      full_recovery: 0.60,
      partial_recovery: 0.20,
      chronic_heart_failure: 0.15,
      death: 0.05
    },
    healthImpacts: {
      physical: -15,
      employment: -0.6,
      lifespan: -10
    }
  },

  acuteRenalFailure: {
    name: "Acute Kidney Injury",
    incidence: {
      Nordic: 0.02,
      Developed: 0.025,
      Emerging: 0.015,
      Developing: 0.010,
      Fragile: 0.005
    },
    riskFactors: {
      diabetes: 3.0,
      hypertension: 2.0,
      infection: 2.5,
      medication: 1.5,
      trauma: 2.0
    },
    recovery: {
      full_recovery: 0.60,
      chronic_kidney_disease: 0.35,
      end_stage_renal: 0.05
    },
    treatmentAccess: {
      Nordic: 0.95,
      Developed: 0.90,
      Emerging: 0.50,
      Developing: 0.15,
      Fragile: 0.05
    }
  }
};

// ============================================================================
// RELATIONSHIP IMPACTS OF HEALTH CRISES
// ============================================================================

const RELATIONSHIP_IMPACTS = {
  patientDiagnosis: {
    immediate: {
      mental: -20, // Shock/fear/grief
      stress: true
    },
    family: {
      parents: {
        stress: -15, // If patient is adult
        worry: true,
        supportResponse: {
          increased: 0.70,  // 70% increase support
          unchanged: 0.20,
          withdraw: 0.10    // 10% withdraw support
        }
      },
      partner: {
        stress: -20,
        caregivingDecision: true, // Will they take caregiver role?
        relationshipStrain: -10,
        acceptanceRange: [-20, 10] // Could go either way
      },
      children: {
        ifParent: {
          mental: -15, // Child's mental health hit
          school: -0.2, // Academic performance decline
          behavioral: "variable"
        }
      },
      siblings: {
        stress: -10,
        support: 0.40, // 40% increase support
        avoidance: 0.30 // 30% distance themselves
      }
    },
    friends: {
      initialSupport: {
        rally: 0.50,    // 50% rally support
        maintain: 0.30,
        withdraw: 0.20  // 20% withdraw
      },
      mentalHealthImpact: -5, // Among close friends
      visitationPatterns: {
        increase: 0.40,
        stable: 0.40,
        decrease: 0.20
      }
    },
    coworkers: {
      accommodation: {
        Nordic: 0.85,   // 85% reasonable accommodation
        Developed: 0.75,
        Emerging: 0.50,
        Developing: 0.25,
        Fragile: 0.10
      },
      discrimination: {
        Nordic: 0.05,   // 5% experience discrimination
        Developed: 0.10,
        Emerging: 0.30,
        Developing: 0.60,
        Fragile: 0.80
      },
      employmentRisk: -0.5 // 50% higher unemployment risk
    }
  },

  caregiverBurden: {
    partnerCaregiving: {
      employmentReduction: {
        fullTime: 0.40,     // 40% quit completely
        partTime: 0.40,     // 40% go part-time
        continue: 0.20      // 20% continue full-time
      },
      incomeLoss: {
        fullTime: 0.80,     // 80% income loss if quit
        partTime: 0.50      // 50% income loss if part-time
      },
      mentalHealthCost: -3, // Per year of caregiving
      relationshipStrain: -2, // Per year
      burnoutRisk: 0.30,  // 30% risk of serious burnout
      divorce_separation: 0.15 // 15% relationships fail under strain
    },

    parentalCaregiving: {
      neverEmployed: {
        ifAdultChildDisabled: 0.60 // 60% never work if caring for disabled adult child
      },
      reducedEmployment: {
        incidence: 0.40,
        incomeLoss: 0.60
      },
      mentalHealthCost: -2,
      lifespan: -5 // Chronic stress reduces lifespan
    },

    siblingCaregiving: {
      employment: -0.3, // 30% employment reduction
      education: -0.4, // 40% don't pursue education
      mentalHealth: -2,
      resentment: true,
      relationshipStrain: 0.50 // 50% report sibling strain
    }
  },

  financialImpact: {
    directMedicalCosts: {
      Nordic: {
        type1Diabetes: 3000,     // Per year
        heartDisease: 5000,
        cancer: 20000,
        chronicPain: 2000
      },
      Developed: {
        type1Diabetes: 5000,
        heartDisease: 10000,
        cancer: 50000,
        chronicPain: 3000
      },
      Emerging: {
        type1Diabetes: 2000,
        heartDisease: 3000,
        cancer: 5000,
        chronicPain: 500
      },
      Developing: {
        type1Diabetes: 500,
        heartDisease: 1000,
        cancer: 1000,
        chronicPain: 100
      },
      Fragile: {
        type1Diabetes: 100,
        heartDisease: 200,
        cancer: 100,
        chronicPain: 20
      }
    },

    indirectCosts: {
      lostIncome: true, // Patient can't work
      caregiverLostIncome: true,
      travelMedical: true,
      homeModifications: true,
      equipment: true
    },

    bankruptcyRisk: {
      Nordic: 0.02,    // 2% bankruptcy from medical
      Developed: 0.15, // 15% in US
      Emerging: 0.40,
      Developing: 0.70,
      Fragile: 0.85
    }
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get chronic disease diagnosis probability
 * @param {object} player - Player object
 * @param {string} region - Mapped region code
 * @returns {object} {hasDiease, disease, severity}
 */
function checkChronicDiseaseOnset(player, region) {
  const age = player.demographics.age;
  const sex = player.demographics.sex;
  
  // List of diseases to check (in order of likelihood)
  const diseases = [
    'type2Diabetes',
    'heartDisease',
    'autoimmune',
    'type1Diabetes',
    'chronicPain'
  ];

  for (const diseaseName of diseases) {
    const disease = CHRONIC_DISEASES[diseaseName];
    if (!disease) continue;

    // Get age group
    let ageGroup = '0-20';
    if (age < 20) ageGroup = '0-20';
    else if (age < 40) ageGroup = '20-40';
    else if (age < 60) ageGroup = '40-60';
    else ageGroup = '60+';

    // Base incidence for this region and age
    let incidence = (disease.incidence[region] || 0.01) * (disease.ageGroups[ageGroup] || 0.1);

    // Apply risk factors
    if (disease.riskFactors) {
      // Check for obesity (if exists in player data)
      if (disease.riskFactors.obesity && player.health?.physical?.bmi > 30) {
        incidence *= disease.riskFactors.obesity;
      }
      
      // Check for smoking
      if (disease.riskFactors.smoking && player.addiction?.substance === 'tobacco') {
        incidence *= disease.riskFactors.smoking;
      }

      // Check for high blood pressure
      if (disease.riskFactors.highBloodPressure && player.health?.chronic?.hypertension) {
        incidence *= disease.riskFactors.highBloodPressure;
      }
    }

    // Apply gender ratio for autoimmune
    if (diseaseName === 'autoimmune' && sex === 'male') {
      incidence *= 1 / disease.genderRatio.female; // Reduces female rate to male rate
    }

    // Roll for diagnosis
    if (Math.random() < incidence) {
      return {
        hasDiease: true,
        disease: diseaseName,
        severity: 'moderate'
      };
    }
  }

  return { hasDiease: false };
}

/**
 * Get congenital condition at birth
 * @param {object} player - Newborn player
 * @param {string} region - Region
 * @param {number} maternalAge - Mother's age (affects Down Syndrome risk)
 * @returns {object} {hasCondition, condition}
 */
function checkCongenitalCondition(player, region, maternalAge = 30) {
  const conditions = [
    'cerebralPalsy',
    'downSyndrome',
    'autismSpectrum',
    'cleftPalateLip',
    'hemophilia',
    'cysticFibrosis'
  ];

  for (const conditionName of conditions) {
    const condition = CONGENITAL_CONDITIONS[conditionName];
    if (!condition) continue;

    let prevalence = condition.prevalence[region] || 0.001;

    // Maternal age effect for Down Syndrome
    if (conditionName === 'downSyndrome' && maternalAge) {
      if (maternalAge > 35) {
        prevalence *= 1 + ((maternalAge - 35) * 0.1); // Increases 10% per year after 35
      }
    }

    // Gender ratio for hemophilia (X-linked)
    if (conditionName === 'hemophilia' && player.demographics.sex === 'female') {
      prevalence *= 0.05; // Much rarer in females (carrier state)
    }

    if (Math.random() < prevalence) {
      return {
        hasCondition: true,
        condition: conditionName
      };
    }
  }

  return { hasCondition: false };
}

/**
 * Apply health crisis effects to relationships
 * @param {object} players - Array of all players (for social network access)
 * @param {object} patient - Diagnosed player
 * @returns {object} {familySupport, friendSupport, employmentRisk}
 */
function applyDiagnosisToRelationships(players, patient) {
  const results = {
    familySupport: 0,
    friendSupport: 0,
    employmentRisk: 0,
    caregiverRisk: []
  };

  // Find family members
  if (patient.relationships?.family?.parents?.length > 0) {
    patient.relationships.family.parents.forEach(parentId => {
      const parent = players.find(p => p.id === parentId);
      if (parent) {
        // Parent stress
        parent.health.mental.current = Math.max(20, parent.health.mental.current - 15);
        
        // Increase support attempt
        results.familySupport += 1;
      }
    });
  }

  // Partner caregiving decision
  if (patient.relationships?.partner?.current) {
    const partner = players.find(p => p.id === patient.relationships.partner.current);
    if (partner) {
      // Partner stress
      partner.health.mental.current = Math.max(20, partner.health.mental.current - 20);
      
      // Will they become caregiver?
      const caregiverDecision = Math.random();
      const caregiverThreshold = 0.60; // 60% of partners take caregiver role
      
      if (caregiverDecision < caregiverThreshold) {
        results.caregiverRisk.push({
          type: 'partner',
          id: partner.id,
          willCareGive: true
        });
      }
    }
  }

  // Child mental health if patient is parent
  if (patient.relationships?.children?.length > 0) {
    patient.relationships.children.forEach(childId => {
      const child = players.find(p => p.id === childId);
      if (child && child.demographics.age >= 5) { // School age and up
        child.health.mental.current = Math.max(20, child.health.mental.current - 15);
        child.education.academicPerformance = Math.max(0.3, child.education.academicPerformance - 0.2);
      }
    });
  }

  return results;
}

/**
 * Apply caregiver burden effects
 * @param {object} caregiver - Partner/family member taking caregiver role
 * @param {string} region - Region code
 * @param {number} years - Years of caregiving
 */
function applyCaregiverBurden(caregiver, region, years = 1) {
  // Employment reduction
  const employmentChance = Math.random();
  const impacts = RELATIONSHIP_IMPACTS.caregiverBurden.partnerCaregiving;
  
  if (employmentChance < impacts.employmentReduction.fullTime) {
    // Quit job
    caregiver.employment.status = 'unemployed';
    caregiver.economics.income.current *= 0.0;
  } else if (employmentChance < impacts.employmentReduction.fullTime + impacts.employmentReduction.partTime) {
    // Go part-time
    caregiver.employment.status = 'part-time';
    caregiver.economics.income.current *= 0.5;
  }

  // Mental health decline
  caregiver.health.mental.current = Math.max(20, caregiver.health.mental.current - (impacts.mentalHealthCost * years));

  // Relationship strain if partner
  if (caregiver.relationships?.partner?.current) {
    caregiver.relationships.partner.satisfaction = Math.max(20, 
      (caregiver.relationships.partner.satisfaction || 50) - (impacts.relationshipStrain * years)
    );
  }

  // Burnout risk increases over time
  if (years > 3 && Math.random() < impacts.burnoutRisk) {
    caregiver.health.mental.current = Math.max(10, caregiver.health.mental.current - 20);
    caregiver.employment.status = 'unemployed';
  }
}

// ============================================================================
// ACUTE CRISIS CHECKS
// ============================================================================

/**
 * Check if player experiences acute crisis (stroke, MI, kidney injury)
 * @param {object} player - Player object
 * @param {string} region - Mapped region code
 * @returns {object} {hasCrisis, crisis, riskFactors, mortality} or {hasCrisis: false}
 */
function checkAcuteCrisis(player, region) {
  const age = player.demographics.age;
  const crises = ['stroke', 'heartAttack', 'acuteRenalFailure'];

  // Only applicable for ages 30+
  if (age < 30) return { hasCrisis: false };

  for (const crisisName of crises) {
    const crisis = ACUTE_CRISES[crisisName];
    if (!crisis) continue;

    // Get age group for this crisis
    let ageGroup = '0-50';
    if (crisisName === 'stroke') {
      if (age < 50) ageGroup = '0-50';
      else if (age < 65) ageGroup = '50-65';
      else if (age < 80) ageGroup = '65-80';
      else ageGroup = '80+';
    } else if (crisisName === 'heartAttack') {
      if (age < 40) ageGroup = '0-40';
      else if (age < 60) ageGroup = '40-60';
      else if (age < 80) ageGroup = '60-80';
      else ageGroup = '80+';
    }

    // Base incidence for this region and age
    // Note: incidence values represent per 100,000 population per year (e.g., 0.15 = 150 per 100k)
    // Convert to decimal probability: divide by 100,000 to get decimal, multiply by ageGroup proportion
    let baseRate = (crisis.incidence[region] || 0.02) / 100; // 150 per 100k → 0.15 per year → 0.0015 probability
    let ageMultiplier = crisis.ageGroups && crisis.ageGroups[ageGroup] || 0.1;
    let incidence = baseRate * ageMultiplier;

    // Apply risk factors
    if (crisis.riskFactors) {
      // Check for hypertension
      if (crisis.riskFactors.hypertension && player.health?.chronic?.hypertension) {
        incidence *= crisis.riskFactors.hypertension;
      }

      // Check for diabetes
      if (crisis.riskFactors.diabetes && player.health?.chronic?.active) {
        const hasDiabetes = player.health.chronic.active.some(d => 
          d.disease.includes('Diabetes') || d.disease === 'type1Diabetes' || d.disease === 'type2Diabetes'
        );
        if (hasDiabetes) incidence *= crisis.riskFactors.diabetes;
      }

      // Check for smoking
      if (crisis.riskFactors.smoking && player.addiction?.substance === 'tobacco') {
        incidence *= crisis.riskFactors.smoking;
      }

      // Check for previous condition
      if (crisisName === 'stroke' && crisis.riskFactors.previousStroke && 
          player.health?.crises?.previousStroke) {
        incidence *= crisis.riskFactors.previousStroke;
      }

      if (crisisName === 'heartAttack' && crisis.riskFactors.previousHD && 
          player.health?.chronic?.active?.some(d => d.disease === 'heartDisease')) {
        incidence *= crisis.riskFactors.previousHD;
      }
    }

    // Roll for crisis event
    if (Math.random() < incidence) {
      // Determine outcome based on region's treatment access or mortality
      let mortality = 0;
      let outcomeDistribution = {};
      
      if (crisis.mortality) {
        // Stroke and MI have mortality
        mortality = crisis.mortality[region] || 0.15;
        outcomeDistribution = crisis.outcomes || {};
      } else if (crisis.recovery) {
        // Kidney injury uses recovery-based outcomes
        outcomeDistribution = crisis.recovery;
        // Estimate mortality based on treatment access
        const access = crisis.treatmentAccess[region] || 0.5;
        mortality = 1 - access; // Higher mortality with less access
      }
      
      let outcome = 'full_recovery';
      const rand = Math.random();
      
      // Check for death
      if (rand < mortality) {
        outcome = 'death';
      } else {
        // Distribute outcomes based on survival
        const total = Object.values(outcomeDistribution).reduce((a, b) => a + b, 0);
        if (total > 0) {
          let cumulative = 0;
          const rand2 = Math.random() * total;
          
          for (const [key, val] of Object.entries(outcomeDistribution)) {
            cumulative += val;
            if (rand2 < cumulative) {
              outcome = key;
              break;
            }
          }
        }
      }

      return {
        hasCrisis: true,
        crisis: crisisName,
        outcome,
        mortality: mortality,
        disabilityImpacts: crisis.disabilityImpacts,
        causesCaregiver: crisis.causesCaregiver,
        healthImpacts: crisis.healthImpacts
      };
    }
  }

  return { hasCrisis: false };
}

/**
 * Apply acute crisis outcomes to player
 * @param {object} player - Player object
 * @param {object} crisisData - Result from checkAcuteCrisis
 * @returns {boolean} true if died from crisis
 */
function applyAcuteCrisis(player, crisisData) {
  if (!crisisData.crisisData || !crisisData.crisisData.hasCrisis) return false;

  const crisis = crisisData.crisisData;
  const crisisName = crisis.crisis;

  // Track the crisis event
  if (!player.health.crises) {
    player.health.crises = {};
  }

  // Record crisis
  if (!player.health.crises[crisisName]) {
    player.health.crises[crisisName] = {
      occurrences: 0,
      outcomes: []
    };
  }

  player.health.crises[crisisName].occurrences++;
  player.health.crises[crisisName].outcomes.push({
    outcome: crisis.outcome,
    age: player.demographics.age,
    year: new Date().getFullYear()
  });

  // Handle outcome
  if (crisis.outcome === 'death') {
    return true; // Signal death
  }

  // Apply disability impacts
  if (crisis.disabilityImpacts) {
    if (crisis.disabilityImpacts.physical) {
      player.health.physical.current = Math.max(
        5, 
        player.health.physical.current + crisis.disabilityImpacts.physical
      );
    }

    if (crisis.disabilityImpacts.employment) {
      // Apply employment penalty
      const empPenalty = crisis.disabilityImpacts.employment * 100; // Convert to percentage
      if (player.employment?.status === 'employed') {
        // 80% chance of job loss or downgrade
        if (Math.random() < 0.8) {
          player.employment.status = Math.random() < 0.5 ? 'unemployed' : 'part-time';
        }
      }
    }

    if (crisis.disabilityImpacts.lifespan) {
      player.demographics.lifeExpectancy = Math.max(
        30,
        player.demographics.lifeExpectancy + crisis.disabilityImpacts.lifespan
      );
    }
  }

  if (crisis.healthImpacts) {
    if (crisis.healthImpacts.physical) {
      player.health.physical.current = Math.max(
        5,
        player.health.physical.current + crisis.healthImpacts.physical
      );
    }

    if (crisis.healthImpacts.employment) {
      const empPenalty = crisis.healthImpacts.employment * 100;
      if (player.employment?.status === 'employed') {
        if (Math.random() < 0.5) {
          player.employment.status = 'part-time';
        }
      }
    }

    if (crisis.healthImpacts.lifespan) {
      player.demographics.lifeExpectancy = Math.max(
        30,
        player.demographics.lifeExpectancy + crisis.healthImpacts.lifespan
      );
    }
  }

  // Mental health impact from crisis
  player.health.mental.current = Math.max(
    10,
    player.health.mental.current - 25 // Severe trauma
  );

  // If crisis causes caregiver need, that's handled separately by applyDiagnosisToRelationships
  if (crisis.causesCaregiver) {
    // Flag for family to potentially become caregiver
    player.health.needsCaregiver = true;
  }

  return false; // Did not die
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  CHRONIC_DISEASES,
  CONGENITAL_CONDITIONS,
  ACUTE_CRISES,
  RELATIONSHIP_IMPACTS,
  checkChronicDiseaseOnset,
  checkCongenitalCondition,
  checkAcuteCrisis,
  applyAcuteCrisis,
  applyDiagnosisToRelationships,
  applyCaregiverBurden
};
