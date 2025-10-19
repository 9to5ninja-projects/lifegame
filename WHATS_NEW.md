# 🎉 WHAT'S NEW IN v1.0

## ✨ New Features

### 1. **Life Expectancy Tracking** 🎯

Every birth location now includes **real-world life expectancy data**:

- Nordic Country: 83 years
- Japan/South Korea: 84 years  
- North America: 78 years
- Urban China: 77 years
- Rural Africa: 58 years
- War Zone: 52 years
- ...and more!

**On the death screen, you now see:**
- Regional life expectancy for your birth location
- How many years **over or under** expectancy you lived
- Percentage of expected lifespan achieved
- Visual indicator if you "beat the odds"

**Example:**
```
Born: Rural Sub-Saharan Africa
Regional Life Expectancy: 58 years
🎯 Beat life expectancy by 17 years!
Lived: 129% of expected lifespan
```

---

### 2. **Voluntary Fold Mechanic** 🃏

At any point during your life, you can now click **"FOLD THIS LIFE"** to voluntarily end your run.

**How it works:**
- Available throughout gameplay (not just at death)
- Takes a **30% score penalty**
- Useful for "cashing out" when survival % gets dangerously low
- Strategic decision: Risk it for more years, or fold with a safe score?

**Confirmation prompt:**
```
Are you sure you want to fold at age 43?
You'll take a 30% score penalty.
```

**Death screen shows fold status:**
```
You folded at age 43
Folded: -30% score penalty
Final Score: 161 points
```

---

### 3. **Enhanced Scoring System** 🏆

The scoring system now rewards players for **beating their birth region's odds**:

#### New Bonus: Life Expectancy Multiplier
- **+10 points per year** you survive beyond your region's life expectancy
- Incentivizes high-risk birth locations (harder to survive = bigger rewards)
- Makes long runs in war zones/rural areas incredibly valuable

#### Fold Penalty
- **-30% total score** if you fold instead of dying naturally
- Encourages risk-taking and pushes for "true" deaths
- Creates tension: "Do I fold at 80% survival or risk the death check?"

#### Updated Score Formula:
```
Base Score = Age × Difficulty Multiplier

Milestone Bonuses:
- Age 18: +10 points
- Age 60: +20 points  
- Age 80: +50 points

Life Expectancy Bonus:
- +10 points × (Age - Regional Life Expectancy)
- Only applies if you outlive expectancy

Fold Penalty:
- Final Score × 0.7 if folded
```

---

## 🎮 Example Scenarios

### Scenario 1: War Zone Survivor
**Birth:** Active War Zone (Expectancy: 52)  
**Died at:** 65  
**Calculation:**
- Base: 65 × 5 (conflict multiplier) = 325
- Milestones: +10 (age 18) + +20 (age 60) = 30
- Life Expectancy: (65 - 52) × 10 = **+130 bonus!**
- **Total: 485 points** 🏆

### Scenario 2: Nordic Folder
**Birth:** Nordic Country (Expectancy: 83)  
**Folded at:** 75  
**Calculation:**
- Base: 75 × 1 (high-resource) = 75
- Milestones: +10 + +20 = 30
- Life Expectancy: (75 - 83) = -8 (no bonus)
- Subtotal: 105
- Fold Penalty: 105 × 0.7 = **74 points** 😬

### Scenario 3: Rural Africa Legend
**Birth:** Rural Africa (Expectancy: 58)  
**Died at:** 82  
**Calculation:**
- Base: 82 × 3 (low-resource) = 246
- Milestones: +10 + +20 + +50 (age 80!) = 80
- Life Expectancy: (82 - 58) × 10 = **+240 bonus!**
- **Total: 566 points** 🌟

---

## 🛠️ Technical Changes

### Files Modified

**`birth_cards_json.json`:**
- Added `"lifeExpectancy"` field to all 15 birth cards
- Values range from 52 (war zone) to 84 (Japan/SK)

**`game_engine_core.js`:**
- New method: `foldLife()` - Handles voluntary folding
- New method: `getLifeExpectancyStats()` - Calculates expectancy comparison
- Updated: `calculateScore()` - Includes expectancy bonus and fold penalty
- Updated: `getSummary()` - Returns expectancy stats and fold status

**`standalone_html_game.html`:**
- Added "FOLD THIS LIFE" button to controls
- Added `folded` state tracking
- Updated death screen to show expectancy comparison
- Updated score calculation with new bonuses/penalties
- Added life expectancy to embedded birth cards

**`react_game_component.js`:**
- (Ready for same updates as standalone version)

**`README.md`:**
- Complete rewrite with new features documented
- Added fold mechanic explanation
- Added life expectancy tracking details
- Updated scoring system documentation

---

## 🎯 Strategic Implications

### The Fold Decision

**Fold early if:**
- Born in high-resource region (low multiplier)
- Already near life expectancy
- Survival % drops below 50%
- You want a guaranteed "safe" score

**Push for natural death if:**
- Born in war zone/rural area (high multiplier)
- Far beyond life expectancy (10 pts/year is HUGE)
- Survival % still above 70%
- Chasing leaderboard/high score

### New "Meta" Strategies

1. **War Zone Gambling:** War zones now have the highest score potential (5× multiplier + low expectancy = massive bonuses)
2. **Expectancy Hunting:** Players may restart until they get low-expectancy births
3. **Risk Management:** Fold becomes a tool for optimizing expected value
4. **Achievement Runs:** "Survive to 100 in a war zone" is now an actual challenge

---

## 🐛 Bug Fixes

- Fixed missing life expectancy data in birth cards
- Corrected score calculation when player reaches age 100
- Added confirmation dialog for fold action (prevents accidental clicks)

---

## 📈 Balance Notes

**Life Expectancy Bonus (10 pts/year) is STRONG:**
- A player born in Africa (58 exp) who reaches 80 gets +220 bonus points
- This is intentional—it rewards overcoming adversity
- Makes low-resource births competitive for high scores

**Fold Penalty (30%) is HARSH:**
- Discourages "score farming" by folding at safe points
- Encourages risk-taking and dramatic stories
- Still allows strategic folding in hopeless situations (e.g., 20% survival at age 5)

**Recommended Tweaks (if needed):**
- Reduce life expectancy bonus to 5 pts/year if too strong
- Adjust fold penalty to 40% if players fold too often
- Add "high-risk fold" option with lower penalty but requires <30% survival

---

## 🚀 What's Next?

Immediate priorities:
1. **Test balance** - Play 100 games and check score distribution
2. **Add more event cards** - Use templates in `card_templates.md`
3. **Run simulation** - Verify survival curves still match real data
4. **UI polish** - Add animations for fold action, expectancy reveals

Future features:
- Save/load game states
- Leaderboards (highest scores per birth region)
- Achievements (e.g., "Beat expectancy by 30 years")
- Share your life story on social media

---

## 💬 Feedback Welcome!

Does the fold mechanic feel right? Is the life expectancy bonus balanced? Should we add a "high-risk fold" option?

Open an issue or PR with your thoughts!

---

**The cards are dealt. Will you fold, or bet it all?** 🎲
