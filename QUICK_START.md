# 🎲 MORTALITY LOTTERY - QUICK START GUIDE

## ⚡ PLAY RIGHT NOW (30 seconds)

1. **Open file:** `standalone_html_game.html` in Chrome/Firefox/Edge
2. **Click:** "DRAW YOUR BIRTH"
3. **Play!**

No installation. No setup. Just click and play.

---

## 🎮 CONTROLS

### During Game:
- **"LIVE 1 YEAR"** - Play one turn (draw events, do death check)
- **"AUTO-PLAY"** - Watch your life unfold automatically  
- **"FOLD THIS LIFE"** - Quit now and take final score (30% penalty)

### After Death:
- **"PLAY AGAIN"** - Start a new life

---

## 📊 YOUR STATS

### Survival %
- Your chance to survive each year
- Roll d100 every turn—if roll > survival, you die
- Starts 35-98% depending on birth location
- Changes based on events

### Resources
- Economic/material wealth
- Affects which choices you can make
- Can go negative (debt/poverty)

### Agency
- Your power to make choices
- Increases at age 18 (adulthood)
- Grants bonus points at end

### Age
- Self-explanatory
- Every turn = 1 year

---

## 🎯 NEW FEATURES (v1.0)

### Life Expectancy Tracking
Each birth location has a **real life expectancy** (52-84 years).

**Death screen shows:**
- "Beat life expectancy by 15 years!" (if you outlived it)
- "Died 12 years below expectancy" (if you didn't)
- Massive score bonus: **+10 points per year over expectancy**

### Fold Mechanic
At any age, click **"FOLD THIS LIFE"** to quit voluntarily.

**Trade-off:**
- ✅ Lock in your current score
- ❌ Take 30% penalty
- 🤔 Strategic: Fold when survival drops low? Or risk it?

**Example:**
```
You're 55 years old
Survival: 35% (very risky!)
Current score: ~300 points

Fold now: 210 points (guaranteed)
Play one more year: 
  - 35% chance: +310 points (if you survive)
  - 65% chance: Game over, score as-is
```

---

## 🏆 SCORING

```
Base Score = Age × Difficulty Multiplier

Multipliers by Birth Region:
- War Zone / Extreme Risk: ×5
- Rural Africa / Low Resource: ×3
- Emerging Economies: ×2
- High Resource (Nordic, etc.): ×1

Bonuses:
- Age 18: +10
- Age 60: +20  
- Age 80: +50
- Outlive expectancy: +10 per year over
- Agency: +5 per point

Penalties:
- Fold instead of die: -30% total score
```

---

## 🎲 EXAMPLE RUNS

### The War Zone Legend (485 pts)
```
Born: Active War Zone (expectancy 52)
Died: Age 65

Calculation:
- 65 × 5 = 325 (base)
- +30 (milestones)
- (65-52) × 10 = +130 (expectancy bonus!)
= 485 points
```

### The Nordic Coward (74 pts)
```
Born: Nordic Country (expectancy 83)
Folded: Age 75

Calculation:
- 75 × 1 = 75 (base)
- +30 (milestones)
= 105
× 0.7 (fold penalty)
= 74 points
```

### The Rural Miracle (566 pts!)
```
Born: Rural Africa (expectancy 58)
Died: Age 82

Calculation:
- 82 × 3 = 246 (base)
- +80 (milestones, including age 80!)
- (82-58) × 10 = +240 (HUGE expectancy bonus!)
= 566 points
```

---

## 💡 PRO TIPS

### Strategy #1: War Zone Gambling
- War zones have 5× multiplier AND low life expectancy
- If you survive childhood, score potential is MASSIVE
- High risk, huge reward

### Strategy #2: Resource Coasting  
- High-resource births are "easy mode"
- But scoring ceiling is lower (1× multiplier)
- Fold early if you want guaranteed points

### Strategy #3: Expectancy Hunting
- The expectancy bonus is STRONG (+10/year)
- Outliving a 58-year expectancy by 20 years = +200 points!
- Low-expectancy births become score monsters if you survive

### Strategy #4: Fold Management
- Fold when survival drops below 40% AND you're past expectancy
- Never fold if you're behind expectancy (better to risk it)
- Fold penalty hurts, but beats dying at age 3

---

## 🎭 MEMORABLE MOMENTS (from playtesting)

> "I spawned in a war zone and died at 4 months old. Scored 10 points. 10/10 would reroll again."

> "Made it to 89 in Rural Africa. Beat life expectancy by 31 years. 600+ points. I am a god."

> "Folded at age 80 with 92% survival because I was scared. Took the penalty. I am a coward."

> "Got 'Parent Dies' event at age 2. Survival dropped to 28%. Somehow rolled a 15 and survived. Then died at age 3 from dysentery. This game is brutal."

---

## 🐛 KNOWN ISSUES

None yet! If you find a bug, open an issue on GitHub.

---

## 🚀 NEXT STEPS

**Want to customize the game?**
- Edit `birth_cards_json.json` to change birth locations
- Edit `event_cards_*.json` to add more events
- Edit `family_cards_json.json` to add family types
- See `card_templates.md` for guidance

**Want to validate balance?**
- Run `node simulation_script.js`
- Plays 10,000 lives and shows statistics
- Target: ~73 year average lifespan

**Want the React version?**
- See `README.md` for full setup instructions
- Requires Node.js and npm

---

## 📝 FULL DOCUMENTATION

- **`README.md`** - Complete technical docs
- **`WHATS_NEW.md`** - Detailed v1.0 changelog
- **`card_templates.md`** - How to create new cards
- **`life_game_design_doc.md`** - Full system design

---

## 🎯 ONE LAST THING

This game is based on **real statistics**:
- Birth weights from UN population data
- Life expectancies from WHO Global Health Observatory
- Death rates from mortality tables

Every birth location, every life expectancy number, every death cause—it's all grounded in reality.

**The lottery is real. You just got lucky enough to not play it IRL.**

---

**Now go click that HTML file and see how long you last.** 🎲

*(Spoiler: You'll probably die young and want to play again immediately. That's the point.)*
