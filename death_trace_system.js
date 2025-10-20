/**
 * DEATH TRACE SYSTEM
 * 
 * Enables reverse-playback of a person's life, showing the causal chain from birth to death.
 * Every significant life event is logged with context, allowing developers to understand
 * why someone died and what led to that outcome.
 * 
 * Usage:
 *   const tracer = new DeathTracer();
 *   engine.enableDeathTracing(tracer);  // Add to game engine
 *   // ... run simulation ...
 *   const log = tracer.getLifeLog(playerAtDeath);
 *   tracer.printDeathTrace(log);
 */

class DeathTracer {
  constructor() {
    this.lifeLog = new Map(); // playerId -> [{age, phase, event, context, health}]
  }

  /**
   * Initialize event log for a new person
   */
  initializeLifeLog(player) {
    const playerId = this.getPlayerId(player);
    if (!this.lifeLog.has(playerId)) {
      this.lifeLog.set(playerId, []);
    }
    
    // Log birth (directly push to avoid recursion)
    const log = this.lifeLog.get(playerId);
    log.push({
      age: player.demographics.age,
      year: new Date().getFullYear(),
      eventType: 'BIRTH',
      context: {
        birthRegion: player.demographics.birthRegion,
        lifeExpectancy: player.demographics.lifeExpectancy,
        sex: player.demographics.sex,
      },
      health: {
        physical: {
          current: player.health.physical.current,
          baseline: player.health.physical.baseline,
        },
        mental: {
          current: player.health.mental.current,
          baseline: player.health.mental.baseline,
          suicideRisk: player.health.mental.suicideRisk,
          chronic: [...(player.health.mental.chronic || [])],
        },
        physical_chronic: [...(player.health.physical.chronic || [])],
      },
      economics: {
        resources: player.economics?.resources?.current || 0,
        debt: player.economics?.debt || 0,
        employed: player.economics?.income?.employed || false,
      },
      relationships: {
        married: player.relationships?.social?.married || false,
        friends: player.relationships?.social?.friends || 0,
        children: player.relationships?.family?.children || 0,
        isolated: player.relationships?.social?.isolation || false,
      },
      housing: {
        status: player.circumstances?.housing?.status || 'stable',
      }
    });
  }

  /**
   * Log any significant life event
   */
  logEvent(player, eventType, context = {}) {
    const playerId = this.getPlayerId(player);
    
    if (!this.lifeLog.has(playerId)) {
      this.initializeLifeLog(player);
    }

    const log = this.lifeLog.get(playerId);
    
    log.push({
      age: player.demographics.age,
      year: new Date().getFullYear() + player.demographics.age - player.demographics.birthYear,
      eventType: eventType,
      context: context,
      health: {
        physical: {
          current: player.health.physical.current,
          baseline: player.health.physical.baseline,
        },
        mental: {
          current: player.health.mental.current,
          baseline: player.health.mental.baseline,
          suicideRisk: player.health.mental.suicideRisk,
          chronic: [...(player.health.mental.chronic || [])],
        },
        physical_chronic: [...(player.health.physical.chronic || [])],
      },
      economics: {
        resources: player.economics?.resources?.current || 0,
        debt: player.economics?.debt || 0,
        employed: player.economics?.income?.employed || false,
      },
      relationships: {
        married: player.relationships?.social?.married || false,
        friends: player.relationships?.social?.friends || 0,
        children: player.relationships?.family?.children || 0,
        isolated: player.relationships?.social?.isolation || false,
      },
      housing: {
        status: player.circumstances?.housing?.status || 'stable',
      }
    });
  }

  // ======== SYSTEM-SPECIFIC LOGGERS ========

  logBirth(player) {
    this.logEvent(player, 'BIRTH', {
      lifeExpectancy: player.demographics.lifeExpectancy,
      birthRegion: player.demographics.birthRegion,
    });
  }

  logDeathByDisease(player, disease, details = {}) {
    this.logEvent(player, 'DEATH_BY_DISEASE', {
      disease: disease,
      ...details,
    });
  }

  logDeathBySuicide(player, method, details = {}) {
    this.logEvent(player, 'DEATH_BY_SUICIDE', {
      method: method,
      suicideRisk: player.health.mental.suicideRisk,
      mentalHealth: player.health.mental.current,
      ...details,
    });
  }

  logDeathByAccident(player, type, details = {}) {
    this.logEvent(player, 'DEATH_BY_ACCIDENT', {
      type: type,
      ...details,
    });
  }

  logDeathByViolence(player, cause, details = {}) {
    this.logEvent(player, 'DEATH_BY_VIOLENCE', {
      cause: cause,
      ...details,
    });
  }

  logDeathByOtherCause(player, cause, details = {}) {
    this.logEvent(player, 'DEATH_BY_OTHER', {
      cause: cause,
      ...details,
    });
  }

  logMentalHealthCrisis(player, severity, trigger = null) {
    this.logEvent(player, 'MENTAL_HEALTH_CRISIS', {
      severity: severity, // 'mild' | 'moderate' | 'severe'
      trigger: trigger,
      currentMentalHealth: player.health.mental.current,
      baseline: player.health.mental.baseline,
    });
  }

  logSuicideAttempt(player, survived, method, details = {}) {
    this.logEvent(player, 'SUICIDE_ATTEMPT', {
      survived: survived,
      method: method,
      ...details,
    });
  }

  logCancerProgression(player, stage, details = {}) {
    this.logEvent(player, 'CANCER_PROGRESSION', {
      stage: stage,
      ...details,
    });
  }

  logAddictionEvent(player, substance, eventType, details = {}) {
    this.logEvent(player, `ADDICTION_${eventType.toUpperCase()}`, {
      substance: substance,
      ...details,
    });
  }

  logAccidentEvent(player, type, severity, details = {}) {
    this.logEvent(player, 'ACCIDENT', {
      type: type,
      severity: severity, // 'minor' | 'moderate' | 'severe'
      ...details,
    });
  }

  logEmploymentChange(player, newStatus, reason = null) {
    this.logEvent(player, 'EMPLOYMENT_CHANGE', {
      employed: newStatus,
      reason: reason,
    });
  }

  logRelationshipChange(player, changeType, details = {}) {
    this.logEvent(player, `RELATIONSHIP_${changeType.toUpperCase()}`, {
      ...details,
    });
  }

  logPovertyStateChange(player, newStatus) {
    this.logEvent(player, 'POVERTY_STATE_CHANGE', {
      status: newStatus, // 'poverty' | 'low_income' | 'middle_income' | 'wealthy'
    });
  }

  logHomelessnessEvent(player, status) {
    this.logEvent(player, 'HOMELESSNESS_CHANGE', {
      status: status,
    });
  }

  logEducationEvent(player, eventType, details = {}) {
    this.logEvent(player, `EDUCATION_${eventType.toUpperCase()}`, {
      ...details,
    });
  }

  logHealthEvent(player, eventType, details = {}) {
    this.logEvent(player, `HEALTH_${eventType.toUpperCase()}`, {
      ...details,
    });
  }

  logTraumaEvent(player, traumaType, details = {}) {
    this.logEvent(player, `TRAUMA_${traumaType.toUpperCase()}`, {
      ...details,
    });
  }

  // ======== RETRIEVAL & ANALYSIS ========

  /**
   * Get entire life log for a person
   */
  getLifeLog(player) {
    const playerId = this.getPlayerId(player);
    return this.lifeLog.get(playerId) || [];
  }

  /**
   * Get only events before death
   */
  getLifeLogBeforeDeath(player) {
    const log = this.getLifeLog(player);
    // Remove death event itself for chain analysis
    return log.filter(event => !event.eventType.startsWith('DEATH_'));
  }

  /**
   * Get death event
   */
  getDeathEvent(player) {
    const log = this.getLifeLog(player);
    return log.find(event => event.eventType.startsWith('DEATH_'));
  }

  /**
   * Find critical turning points (major health/economic decline)
   */
  findCriticalTurningPoints(player) {
    const log = this.getLifeLog(player);
    const turningPoints = [];

    for (let i = 1; i < log.length; i++) {
      const prev = log[i - 1];
      const curr = log[i];

      // Mental health crisis (sudden drop)
      const mentalDrop = prev.health.mental.current - curr.health.mental.current;
      if (mentalDrop > 15) {
        turningPoints.push({
          age: curr.age,
          type: 'MENTAL_HEALTH_DROP',
          magnitude: mentalDrop,
          event: curr,
        });
      }

      // Economic crisis (sudden resource loss)
      const resourceDrop = prev.economics.resources - curr.economics.resources;
      if (resourceDrop > 5) {
        turningPoints.push({
          age: curr.age,
          type: 'ECONOMIC_CRISIS',
          magnitude: resourceDrop,
          event: curr,
        });
      }

      // Employment loss
      if (prev.economics.employed && !curr.economics.employed) {
        turningPoints.push({
          age: curr.age,
          type: 'EMPLOYMENT_LOSS',
          event: curr,
        });
      }

      // Homelessness onset
      if (prev.housing.status !== 'homeless' && curr.housing.status === 'homeless') {
        turningPoints.push({
          age: curr.age,
          type: 'HOMELESSNESS_ONSET',
          event: curr,
        });
      }
    }

    return turningPoints;
  }

  /**
   * Trace causal chain: given a death, find upstream events that contributed
   */
  traceCausalChain(player, maxEventsBack = 50) {
    const log = this.getLifeLog(player);
    const deathEvent = this.getDeathEvent(player);
    
    if (!deathEvent) return null;

    const chain = {
      death: deathEvent,
      immediateFactors: this.analyzeDeathFactors(player, deathEvent),
      turningPoints: this.findCriticalTurningPoints(player),
      lifetimeChallenges: this.identifyLifetimeChallenges(player),
      lastNEvents: log.slice(Math.max(0, log.length - maxEventsBack)),
    };

    return chain;
  }

  /**
   * Analyze what health/economic/social factors contributed to death
   */
  analyzeDeathFactors(player, deathEvent) {
    const factors = {
      primaryCause: deathEvent.context.disease || deathEvent.context.method || deathEvent.context.cause || 'Unknown',
      healthFactors: [],
      economicFactors: [],
      socialFactors: [],
      contextualFactors: [],
    };

    if (deathEvent.health.physical.current < 30) {
      factors.healthFactors.push('Severely compromised physical health');
    }
    if (deathEvent.health.mental.current < 20) {
      factors.healthFactors.push('Severe mental health crisis');
    }
    if (deathEvent.health.physical_chronic.length > 0) {
      factors.healthFactors.push(`Multiple chronic conditions: ${deathEvent.health.physical_chronic.join(', ')}`);
    }

    if (deathEvent.economics.resources < 5) {
      factors.economicFactors.push('Severe resource poverty');
    }
    if (deathEvent.economics.debt > 50) {
      factors.economicFactors.push('Severe debt burden');
    }
    if (!deathEvent.economics.employed && deathEvent.age > 18) {
      factors.economicFactors.push('Unemployed for extended period');
    }

    if (deathEvent.relationships.isolated) {
      factors.socialFactors.push('Social isolation');
    }
    if (deathEvent.relationships.friends === 0) {
      factors.socialFactors.push('No social connections');
    }
    if (deathEvent.relationships.married) {
      factors.socialFactors.push('Married (potential support)');
    }

    if (deathEvent.housing.status === 'homeless') {
      factors.contextualFactors.push('Homeless');
    } else if (deathEvent.housing.status === 'unstable') {
      factors.contextualFactors.push('Unstable housing');
    }

    return factors;
  }

  /**
   * Identify recurring challenges throughout life
   */
  identifyLifetimeChallenges(player) {
    const log = this.getLifeLog(player);
    const challenges = {
      economicStruggle: 0,
      mentalHealthStruggle: 0,
      socialIsolation: 0,
      healthCrisis: 0,
      employmentInstability: 0,
    };

    for (const event of log) {
      if (event.economics.resources < 5) challenges.economicStruggle++;
      if (event.health.mental.current < 40) challenges.mentalHealthStruggle++;
      if (event.relationships.isolated || event.relationships.friends === 0) challenges.socialIsolation++;
      if (event.health.physical.current < 40 || event.health.physical_chronic.length > 0) challenges.healthCrisis++;
      if (!event.economics.employed && event.age > 18) challenges.employmentInstability++;
    }

    return challenges;
  }

  // ======== PRETTY PRINTING ========

  /**
   * Print a formatted death trace to console
   */
  printDeathTrace(player, verbose = false) {
    const log = this.getLifeLog(player);
    if (log.length === 0) {
      console.log('No life log found for this player');
      return;
    }

    const deathEvent = this.getDeathEvent(player);
    const chain = this.traceCausalChain(player);

    console.log('\n' + '='.repeat(80));
    console.log('DEATH TRACE REPORT');
    console.log('='.repeat(80));

    // Header
    console.log(`\n${player.demographics.sex.toUpperCase()} - Born in ${player.demographics.birthRegion}`);
    console.log(`Lived: ${player.demographics.age} years (Expected: ${player.demographics.lifeExpectancy} years)`);
    console.log(`Birth Year: ${player.demographics.birthYear}`);

    // Death details
    if (deathEvent) {
      console.log(`\n${'-'.repeat(80)}`);
      console.log('CAUSE OF DEATH');
      console.log(`${'-'.repeat(80)}`);
      console.log(`Age: ${deathEvent.age}`);
      console.log(`Primary Cause: ${deathEvent.context.disease || deathEvent.context.method || deathEvent.context.cause || 'Unknown'}`);
      
      if (chain.immediateFactors) {
        const factors = chain.immediateFactors;
        if (factors.healthFactors.length > 0) {
          console.log(`Health Factors:\n  - ${factors.healthFactors.join('\n  - ')}`);
        }
        if (factors.economicFactors.length > 0) {
          console.log(`Economic Factors:\n  - ${factors.economicFactors.join('\n  - ')}`);
        }
        if (factors.socialFactors.length > 0) {
          console.log(`Social Factors:\n  - ${factors.socialFactors.join('\n  - ')}`);
        }
        if (factors.contextualFactors.length > 0) {
          console.log(`Contextual Factors:\n  - ${factors.contextualFactors.join('\n  - ')}`);
        }
      }
    }

    // Turning points
    if (chain.turningPoints.length > 0) {
      console.log(`\n${'-'.repeat(80)}`);
      console.log('CRITICAL TURNING POINTS');
      console.log(`${'-'.repeat(80)}`);
      
      for (const point of chain.turningPoints.slice(0, 10)) {
        console.log(`Age ${point.age}: ${point.type}`);
        if (point.magnitude) console.log(`  Magnitude: ${point.magnitude}`);
      }
    }

    // Lifetime challenges
    if (chain.lifetimeChallenges) {
      console.log(`\n${'-'.repeat(80)}`);
      console.log('LIFETIME CHALLENGES');
      console.log(`${'-'.repeat(80)}`);
      
      const challenges = chain.lifetimeChallenges;
      console.log(`Economic Struggle Events: ${challenges.economicStruggle}`);
      console.log(`Mental Health Struggle Events: ${challenges.mentalHealthStruggle}`);
      console.log(`Social Isolation Events: ${challenges.socialIsolation}`);
      console.log(`Health Crisis Events: ${challenges.healthCrisis}`);
      console.log(`Employment Instability Events: ${challenges.employmentInstability}`);
    }

    // Life timeline (if verbose)
    if (verbose) {
      console.log(`\n${'-'.repeat(80)}`);
      console.log('COMPLETE LIFE TIMELINE');
      console.log(`${'-'.repeat(80)}`);
      
      for (const event of log.slice(-50)) { // Last 50 events
        console.log(`\nAge ${event.age}: ${event.eventType}`);
        console.log(`  Physical: ${event.health.physical.current}/${event.health.physical.baseline} | Mental: ${event.health.mental.current}/${event.health.mental.baseline}`);
        console.log(`  Resources: ${event.economics.resources} | Employed: ${event.economics.employed}`);
        console.log(`  Housing: ${event.housing.status} | Isolated: ${event.relationships.isolated}`);
        
        if (Object.keys(event.context).length > 0) {
          console.log(`  Context: ${JSON.stringify(event.context)}`);
        }
      }
    }

    console.log(`\n${'='.repeat(80)}\n`);
  }

  /**
   * Export death trace to JSON for analysis
   */
  exportDeathTrace(player) {
    const log = this.getLifeLog(player);
    const deathEvent = this.getDeathEvent(player);
    const chain = this.traceCausalChain(player);

    return {
      player: {
        age: player.demographics.age,
        sex: player.demographics.sex,
        birthRegion: player.demographics.birthRegion,
        lifeExpectancy: player.demographics.lifeExpectancy,
      },
      death: deathEvent,
      causalChain: chain,
      fullLog: log,
    };
  }

  /**
   * Compare multiple deaths to find patterns
   */
  analyzeMortalityPatterns(players) {
    const patterns = {
      primaryCauses: {},
      ageAtDeath: [],
      byRegion: {},
      byHealthStatus: {},
    };

    for (const player of players) {
      const deathEvent = this.getDeathEvent(player);
      if (!deathEvent) continue;

      const cause = deathEvent.context.disease || deathEvent.context.cause || 'Unknown';
      patterns.primaryCauses[cause] = (patterns.primaryCauses[cause] || 0) + 1;
      patterns.ageAtDeath.push(player.demographics.age);

      const region = player.demographics.birthRegion;
      if (!patterns.byRegion[region]) {
        patterns.byRegion[region] = { count: 0, avgAge: 0, causes: {} };
      }
      patterns.byRegion[region].count++;
      patterns.byRegion[region].causes[cause] = (patterns.byRegion[region].causes[cause] || 0) + 1;
    }

    // Calculate averages
    for (const region in patterns.byRegion) {
      const deaths = patterns.ageAtDeath.filter(
        (_, i) => players[i].demographics.birthRegion === region
      );
      patterns.byRegion[region].avgAge = deaths.reduce((a, b) => a + b, 0) / deaths.length;
    }

    return patterns;
  }

  // ======== UTILITIES ========

  getPlayerId(player) {
    // Use birth year + sex + region as ID
    // Since players within same simulation will have same birth year, we need to add something unique
    // We'll use the object reference which stays the same for a player object
    if (!player._traceId) {
      player._traceId = `player_${Math.random().toString(36).substr(2, 9)}`;
    }
    return player._traceId;
  }
}

module.exports = DeathTracer;
