# MORTALITY LOTTERY - PROTOTYPE STATUS

## ✅ CURRENT STATUS: FULLY FUNCTIONAL

All core systems are implemented and working correctly.

### 🎮 Game Features Implemented

#### Core Systems
- ✅ **Birth Phase**: Random geography + family cards with realistic distribution
- ✅ **Year Progression**: Age-based advancement with homeostatic state system
- ✅ **Event System**: Age-stratified events with prerequisites and effects
- ✅ **Death System**: Age/health-based mortality with causes
- ✅ **Scoring**: Points based on lifespan vs expectancy + bonuses

#### Family Dynamics
- ✅ **Parent Deaths**: Age-based (35+), probabilistic mortality with realistic curves
- ✅ **Marriage/Divorce**: Regional marriage ages, duration-based divorce, remarriage support
- ✅ **Orphan Tracking**: Automatic status updates when parents die
- ✅ **Adoption Events**: Available for orphaned children (ages 5-16)

#### UI/UX
- ✅ **Start Screen**: "Draw Your Birth" button with warning
- ✅ **Gender Indicator**: Shows 👨/👩 with sex
- ✅ **Collapsible Sections**: Health, Economics, Relationships, Development, Circumstances
- ✅ **Event Log**: Latest event in brief, expandable full history
- ✅ **Death Screen**: Cause analysis, achievements, final score

#### Game Mechanics
- ✅ **Live 1 Year**: Single year advancement
- ✅ **Auto-Play**: Continuous play at 300ms per year
- ✅ **Fold Life**: Voluntary exit with 30% score penalty
- ✅ **Fallback Data**: Embedded JSON for offline play

### 📊 Statistics

**Tested Configuration (20 games):**
- Average lifespan: 45 years
- Min: 7 years
- Max: 94 years
- Events per game: 12-18

### 🔧 Technical Stack

- **Backend**: MortalityGameV2 (homeostatic state system)
- **Integration**: MortalityGameIntegrated (v1.0 compatibility wrapper)
- **Frontend**: HTML5 + CSS3 + Vanilla JavaScript
- **Server**: Python HTTP server
- **Data**: JSON cards (births, families, events, deaths)

### 🐛 Recent Fixes

1. **clampPlayerStats Parameter** (Oct 19): Fixed method to accept player parameter for proper state handling
2. **Teen Parent Deaths** (Oct 19): Added parent death events to teen age range (13-18)
3. **Gender Display** (Oct 19): Added visible gender indicator (👨/👩)
4. **Event Log Reorganization** (Oct 19): Moved from bottom to collapsible section between buttons and stats

### 📋 TODO - Phase 2

- [ ] Regional divorce rate variations
- [ ] Family structure realism (children per marriage)
- [ ] Economic impacts of life events
- [ ] Birth condition inheritance for children
- [ ] Partner/child relationship tracking
- [ ] Sibling interaction events
- [ ] Career advancement tracks
- [ ] Educational outcomes tracking

### 🎯 How to Play

1. Open `http://localhost:8000/standalone_html_game.html`
2. Click "DRAW YOUR BIRTH" to start
3. Click "LIVE 1 YEAR" to age and draw events
4. Click "AUTO-PLAY" to watch life unfold
5. Click "FOLD THIS LIFE" to exit early with score penalty
6. Game ends when you reach age 120 or die

### 📈 Key Metrics

- **Regional Life Expectancy**: 52-83 years (based on birth card)
- **Mortality Curve**: 1% at age <35, up to 40% at age 90+
- **Marriage Probability**: Gaussian by region (median 19-31 years)
- **Event Frequency**: 1-3 events per year (age-dependent)
- **Divorce Rate**: 2-4% annual (marriage duration-dependent)

### ✨ What Makes It Realistic

1. **Parent age tracking**: Parents age with player (ageAtBirth + player.age)
2. **Age-appropriate mortality**: Realistic survival odds by decade
3. **Regional distribution**: Marriage ages match UN demographics
4. **Probabilistic systems**: RNG checks for all stochastic events
5. **State interdependence**: Health, economics, relationships affect survival
6. **Prerequisite system**: Events only fire when conditions allow

---

**Version**: 2.0 Homeostatic  
**Last Updated**: October 19, 2025  
**Status**: Ready for gameplay testing
