# 🎲 MORTALITY LOTTERY

**A card game about being born. Based on real-world mortality statistics.**

You are dealt a birth location and family structure. Every year, you roll the dice to see if you survive. Events happen. Stats change. Eventually, you die—or fold.

> *"Holy shit, I died at 3 months old"*  
> *"How did you make it to 80 in a war zone?!"*  
> *"This is fucked up. This is real."*  
> *"One more run..."*

---

## 🚀 FASTEST PATH TO PLAYABLE (5 MINUTES)

### Option 1: No Setup Required ⚡

1. Open `standalone_html_game.html` in any modern browser
2. Click "DRAW YOUR BIRTH"
3. **PLAY IMMEDIATELY**

That's it. No Node.js, no npm, no build tools. Just pure HTML/CSS/JavaScript.

### Option 2: Full React Version (15 minutes)

```bash
# 1. Clone or download this repo
git clone https://github.com/9to5ninja-projects/lifegame.git
cd lifegame

# 2. Install dependencies
npm install

# 3. Start dev server
npm run dev

# 4. Open browser to localhost:5173
```

---

## 🎮 HOW TO PLAY

### The Rules

1. **Birth**: You're randomly dealt a birth location (weighted by real population) and family structure
2. **Survival Stat**: Your starting survival percentage (1-99%) determines your odds each year
3. **Each Turn**: 
   - Age up 1 year
   - Draw 1-3 event cards (depending on age)
   - Roll d100 vs your survival %
   - If roll > survival, you die
4. **Events**: Affect your survival, resources, and agency stats
5. **Death**: When you die (or fold), see your final score and life summary

### New Features ✨

#### 🎯 Life Expectancy Tracking
- Each birth location has a **real-world life expectancy** (58-84 years)
- Death screen shows how many years **over or under** expectancy you lived
- **Massive score bonuses** for beating your birth region's odds (10 points per year over)

#### 🃏 Voluntary Fold
- At any age, you can click **"FOLD THIS LIFE"**
- Takes a **30% score penalty** vs dying naturally
- Strategic decision: fold early with a safe score, or push for max years?
- Adds a layer of risk/reward: "Do I keep going or cash out?"

---

## 📊 SCORING SYSTEM

```
Base Score = Age × Difficulty Multiplier

Difficulty Multipliers:
- Conflict/Extreme Risk: ×5
- Low Resource: ×3  
- Emerging/Moderate: ×2
- High Resource: ×1

Milestone Bonuses:
- Reach 18: +10
- Reach 60: +20
- Reach 80: +50

Life Expectancy Bonus:
- +10 points per year over regional expectancy

Agency Bonus:
- +5 points per agency point

Fold Penalty:
- -30% total score if you fold instead of dying
```

### Example Scores

| Scenario | Score |
|----------|-------|
| Nordic, died at 85 (expectancy 83) | 85 + 10 + 20 + 50 + 20 = **185 pts** |
| War Zone, died at 40 (expectancy 52) | 40×5 + 10 + 20 = **230 pts** |
| War Zone, **folded** at 40 | (40×5 + 30) × 0.7 = **161 pts** |
| Rural Africa, died at 70 (expectancy 58) | 70×3 + 10 + 20 + 120 = **360 pts** |

---

## 📦 WHAT'S INCLUDED

### Core Game Files
- `game_engine_core.js` - Core game logic (card draws, death checks, scoring)
- `react_game_component.js` - Full React UI component
- `standalone_html_game.html` - **Instant playable version** (no build tools)

### Card Data (JSON)
- `birth_cards_json.json` - 15 geographic regions with life expectancy data
- `family_cards_json.json` - 12 family structures (stable → crisis)
- `event_cards_childhood.json` - Events for ages 0-12
- `event_cards_teen.json` - Events for ages 13-17
- `event_cards_adult.json` - Events for ages 18+
- `death_cards_json.json` - 30 causes of death (age-stratified)

### Supporting Files
- `simulation_script.js` - Run 10,000 lifetimes to validate balance
- `card_templates.md` - Templates for creating more cards
- `life_game_design_doc.md` - Full system architecture
- `setup_readme.md` - Original setup instructions

---

## 🎯 GAME DESIGN PHILOSOPHY

### What Makes This Work

1. **Real Statistics**: Birth weights based on UN population data, death rates from WHO
2. **Emergent Stories**: Every playthrough tells a different story
3. **Dark Comedy**: Confronts mortality with brutal honesty
4. **Addictive Loop**: "One more run" factor is HIGH
5. **Educational**: Players learn about global inequality through gameplay

### The Fold Mechanic

**Why it matters:**
- Adds **player agency** to an otherwise deterministic system
- Creates **tension**: "My survival is 40%... do I risk it or fold?"
- Enables **strategy**: High-resource players might fold early for safe scores
- **Risk-takers** in war zones can push for legendary runs

---

## 🔧 CUSTOMIZATION & EXPANSION

### Adding More Event Cards

Use the templates in `card_templates.md`:

```json
{
  "id": "event_my_new_card",
  "type": "event",
  "name": "Your Event Name",
  "ageRange": [18, 65],
  "weight": 8,
  "description": "What happens...",
  "effects": {
    "survivalMod": -5,
    "resourceMod": 10
  }
}
```

Add to the appropriate age file (`event_cards_childhood.json`, etc.)

### Running Simulations

Validate your changes with the simulation script:

```bash
node simulation_script.js
```

Target statistics:
- ~73 year average lifespan (global)
- ~97% survive to age 1
- ~75% survive to age 60

---

## 🛠️ TECHNICAL DETAILS

### Game Engine Architecture

```javascript
// Core loop
1. createPlayer() → Draw birth + family cards
2. playYear() → Age up, draw events, death check
3. deathCheck() → Roll d100 vs survival %
4. calculateScore() → Apply multipliers, bonuses, penalties
5. getSummary() → Life expectancy comparison, final stats
```

### Key Functions

- `weightedDraw(cards, profileTags)` - Draw cards based on weight and profile compatibility
- `applyCardEffects(card)` - Modify player stats
- `foldLife()` - Voluntary quit with penalty
- `getLifeExpectancyStats()` - Compare player age to regional expectancy

---

## 🎨 UI/UX NOTES

### Standalone HTML Features
- **Instant load** - No dependencies
- **Dark theme** - Noir aesthetic
- **Smooth animations** - CSS transitions
- **Responsive** - Works on mobile

### React Component Features
- **Auto-play mode** - Watch life unfold automatically
- **Event log** - Scrollable history of all events
- **Death screen** - Detailed life summary with stats
- **Fold button** - Strategic quit option with warning

---

## 🚧 ROADMAP

### Phase 1: Core Mechanics ✅
- [x] Birth cards with life expectancy
- [x] Event system (childhood, teen, adult)
- [x] Death checks and causes
- [x] Scoring with difficulty multipliers
- [x] Life expectancy tracking
- [x] Fold mechanic with penalty

### Phase 2: Content Expansion 🚀
- [ ] Add 50+ more event cards
- [ ] Implement choice system for events
- [ ] Add education/career progression tracks
- [ ] Create "achievement" cards for rare outcomes
- [ ] Add more family structures

### Phase 3: Polish & Features 🎨
- [ ] Card art and icons
- [ ] Sound effects
- [ ] Save/load game states
- [ ] Leaderboards (highest scores)
- [ ] Share your life story

### Phase 4: Multiplayer 🎮
- [ ] Simultaneous lives (race to survival)
- [ ] Drafting birth cards
- [ ] Trading/gifting resources
- [ ] Spectator mode

---

## 📈 BALANCING TIPS

### If Survival Rates Are Off

**Too many deaths?**
- Increase starting survival (birth cards)
- Reduce negative event modifiers
- Add more positive events

**Not enough deaths?**
- Decrease starting survival
- Add more deadly events
- Increase age-related survival decline

**Wrong age distribution?**
- Adjust death card age ranges
- Modify survival curve by age bracket

### Run the Simulation

```bash
node simulation_script.js
```

Play 10,000 lives and check:
- Average lifespan
- Survival rates by age milestones
- Distribution of death ages
- Score distribution

---

## 🤝 CONTRIBUTING

Suggestions for new cards? Found a balance issue? Open an issue or PR!

### Areas We Need Help
- **Card Writers**: Create event cards based on real-world data
- **Balancers**: Tune survival curves to match WHO statistics
- **Artists**: Card illustrations, icons, UI polish
- **Developers**: Multiplayer, save system, leaderboards

---

## ⚖️ CONTENT WARNING

This game simulates:
- Death (infant mortality, accidents, disease, violence)
- Inequality (birth lottery, poverty, lack of access)
- Difficult life circumstances (war, abuse, loss)

While based on real statistics, this may not be suitable for all audiences.

---

## 📝 LICENSE

MIT License - Do whatever you want with this. Make it better.

---

## 🎲 THE VISION

**You're building:**
- Cards Against Humanity meets Oregon Trail meets Actual Mortality Data
- A game that's dark, educational, and addictive
- Something that makes people say "holy shit" and immediately play again

**The cards are dealt. What are you drawing?**

---

## 🔗 LINKS

- **GitHub**: https://github.com/9to5ninja-projects/lifegame
- **Play Now**: Just open `standalone_html_game.html`

---

*Built with data from UN Population Division, WHO Global Health Observatory, and Human Development Reports.*
