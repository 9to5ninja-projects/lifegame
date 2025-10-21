# LifeGame - Organized Structure

## 📁 Directory Structure

```
lifegame/
├── 📄 Core Files
│   ├── README.md                          # Main project README
│   ├── ROADMAP.md                        # Project roadmap
│   ├── CHANGELOG.md                      # Change history
│   ├── ARCHITECTURE.md                   # System architecture
│   ├── game_engine_v2_homeostatic.js     # Main game engine (3,970 lines)
│   └── standalone_html_game.html         # Playable HTML version
│
├── 📁 systems/
│   ├── (Core game systems - 12+ files)
│   ├── health_crisis_system.js           # Health crises (chronic, congenital, acute)
│   ├── cancer_system.js                  # Cancer progression modeling
│   ├── substance_abuse_system.js         # Addiction mechanics
│   ├── accidents_system.js               # Accident/injury modeling
│   ├── relationships_system.js           # Social network effects
│   ├── temporal_effects_system.js        # Time-based event system
│   ├── housing_system.js                 # Housing affordability
│   ├── retirement_system.js              # Retirement mechanics
│   ├── death_trace_system.js             # Death cause tracking
│   ├── employment_by_region.js           # Employment system
│   ├── cost_of_living.js                 # Economic modeling
│   ├── global_statistics_v2.js           # Game statistics
│   ├── nordic_complete_parameters.js     # Regional parameters
│   └── death_causes.js                   # Death mechanics
│
├── 📁 data/
│   ├── (Game data files - JSON)
│   ├── birth_cards_json.json             # Birth characteristics
│   ├── death_cards_json.json             # Death causes
│   ├── family_cards_json.json            # Family types
│   ├── event_cards_*.json                # Life events (childhood, teen, adult)
│   ├── event_cards_temporal_examples.json # Temporal event examples
│   └── retirement_calibration.json       # Retirement parameters
│
├── 📁 tests/
│   ├── (Comprehensive test suite)
│   ├── test_health_integration.js        # Health system tests
│   ├── test_acute_crises.js              # Acute crisis validation
│   ├── test_full_health_system.js        # Large-scale health tests
│   ├── test_cancer_system.js             # Cancer system tests
│   ├── test_cancer_integration.js        # Cancer integration
│   ├── test_suicide_*.js                 # Suicide risk tests
│   ├── test_*_quick.js                   # Quick validation tests
│   ├── test_baseline.js                  # Baseline testing
│   ├── test_3x_100k.js                   # Large population tests
│   └── trace_one_life.js                 # Single life debugging
│
├── 📁 analysis/
│   ├── (Output data and analysis results)
│   ├── *_analysis.json                   # Analysis outputs
│   ├── *_stats.json                      # Statistical results
│   ├── *_output.json                     # Simulation outputs
│   └── *.txt                             # Text reports
│
├── 📁 docs/
│   ├── (System documentation)
│   ├── HEALTH_CRISIS_*.md                # Health crisis docs
│   ├── DEATH_TRACE_*.md                  # Death trace docs
│   ├── CANCER_SYSTEM.md                  # Cancer system docs
│   ├── RETIREMENT_SYSTEM.md              # Retirement docs
│   ├── SESSION_*.md                      # Session summaries
│   └── *.md                              # Other documentation
│
├── 📁 scripts/
│   └── (Utility scripts)
│
├── 📁 research/
│   └── (Research and reference materials)
│
└── 📁 .git/
    └── (Version control)
```

## 🚀 Quick Start

### Play the Game
```bash
node game_engine_v2_homeostatic.js
```

### Run Tests
```bash
cd tests/
node test_full_health_system.js          # Large-scale test
node test_health_integration.js          # Health system test
node test_acute_crises.js                # Crisis test
```

### Explore Systems
```bash
# View system modules
ls systems/

# View game data
ls data/

# View test results
ls analysis/
```

## 📊 Key Systems

### Game Engine (`game_engine_v2_homeostatic.js`)
- Main simulation engine with homeostatic health system
- 3,970 lines of integrated game logic
- Processes yearly life events for each player
- Tracks 50+ player attributes

### Health Crisis System (`systems/health_crisis_system.js`)
- 5 chronic diseases with regional variation
- 6 congenital conditions with birth-time assignment
- 3 acute crises (stroke, MI, kidney injury)
- Cascading relationship and economic impacts

### Retirement System (`systems/retirement_system.js`)
- Regional pension systems
- Living standard calculations
- Retirement age decisions
- Income management in old age

### Cancer System (`systems/cancer_system.js`)
- Stage progression modeling
- Treatment effectiveness by region
- Remission and recurrence mechanics
- Integration with health crises

### Relationships System (`systems/relationships_system.js`)
- Family dynamics (parents, partner, children)
- Friend network effects
- Workplace relationships
- Stress propagation through networks

## 📈 Test Coverage

**Test Files:** 30+
**Test Types:**
- Unit tests for individual systems
- Integration tests for system interactions
- Large-scale population tests (100-1000 people)
- Regional variation validation
- Outcome distribution verification

**Recent Test Results (500-person, 80-year simulation):**
- 45.8% survival to age 80
- 35.8% of deaths from heart disease
- 100% of survivors with chronic diseases
- Realistic regional health disparities

## 📚 Documentation Structure

### Core Docs (Root)
- `README.md` - Project overview
- `ROADMAP.md` - Development roadmap
- `ARCHITECTURE.md` - System architecture
- `CHANGELOG.md` - Version history

### System Docs (`docs/`)
- `HEALTH_CRISIS_COMPLETE_SUMMARY.md` - Full health crisis guide
- `DEATH_TRACE_SYSTEM_SUMMARY.md` - Death tracing system
- `CANCER_SYSTEM.md` - Cancer modeling
- `RETIREMENT_SYSTEM.md` - Retirement mechanics
- `SESSION_*.md` - Implementation session notes

## 🔧 Development Workflow

1. **Modify Systems** → Edit files in `systems/`
2. **Update Data** → Edit JSON files in `data/`
3. **Test Changes** → Run tests from `tests/`
4. **Review Output** → Check `analysis/` for results
5. **Document** → Add notes to `docs/`

## 📝 File Organization Guidelines

**Where to put new files:**
- System code → `systems/`
- Test code → `tests/`
- Game data (JSON) → `data/`
- Analysis results → `analysis/`
- Documentation → `docs/`
- Utility scripts → `scripts/`

## 🎯 Main Components

| Component | Status | Lines | File |
|-----------|--------|-------|------|
| Game Engine | ✅ Production | 3,970 | game_engine_v2_homeostatic.js |
| Health Crisis | ✅ Complete | 1,119 | systems/health_crisis_system.js |
| Retirement | ✅ Complete | 450+ | systems/retirement_system.js |
| Cancer System | ✅ Complete | 400+ | systems/cancer_system.js |
| Relationships | ✅ Complete | 350+ | systems/relationships_system.js |
| Death Trace | ✅ Complete | 300+ | systems/death_trace_system.js |

## 🔍 Navigation Tips

**Want to...**
- Play the game? → Run `node game_engine_v2_homeostatic.js`
- Run tests? → Go to `tests/` directory
- Check data? → Look in `data/` for JSON files
- Review results? → Check `analysis/` for outputs
- Read docs? → Go to `docs/` or root .md files
- View systems? → Browse `systems/` directory

## 📊 Statistics

- **Total Systems:** 14+
- **Total Lines of Code:** 10,000+
- **Test Files:** 30+
- **Documentation Files:** 20+
- **Data Files:** 50+

---

**Last Organized:** October 20, 2025
**Status:** ✅ Production Ready
