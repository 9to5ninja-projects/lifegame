# 🎲 MORTALITY LOTTERY

A card game about being born. Based on real-world mortality statistics. Roll the dice each year to survive.

> "Holy shit, I died at 3 months old"  
> "How did you make it to 80 in a war zone?!"  
> "This is fucked up. This is real."  
> "One more run..."

---

## ⚡ PLAY NOW

**Zero setup:** Open `standalone_html_game.html` → click "DRAW YOUR BIRTH" → play

**React version:**
```bash
npm install && npm run dev
# localhost:5173
```

---

## 🎮 HOW TO PLAY

1. **Birth**: Random location + family structure (weighted by real population)
2. **Each year**: Age up → draw events → roll d100 vs survival % → live or die
3. **Events**: Affect survival, health, resources, relationships
4. **Fold (Optional)**: Quit anytime (takes -30% score penalty)
5. **Death**: Game over → final score + life summary

### v1.0 Features
- 15 birth regions (real WHO life expectancy data)
- Life expectancy tracking (years over/under expectancy)
- Fold mechanic (quit voluntarily, -30% penalty)
- Scoring multipliers (1x-5x based on difficulty)

### v2.0 (In Development)
- **Homeostatic state systems**: Health recovers toward baseline, chronic conditions lower baseline
- **Complex prerequisites**: Events gated by sex, age, education, relationships, health
- **Life stages**: Childhood → adolescent → adult → elderly with phase-specific events
- **100+ new events**: Pregnancy, childbirth, prostate cancer, mental health, career progression, etc.

---

## 📊 SCORING

Base = Age × Difficulty (1x-5x) + Milestones (18/60/80) + Life Expectancy Bonus (10 pts/year over) - Fold Penalty (30%)

Examples:
- War zone survivor to 65 (exp 52): 65×5 + 30 + 130 = **485 pts**
- Rural Africa to 70 (exp 58): 70×3 + 30 + 120 = **360 pts**

---

## 📦 FILES

**Game:** `standalone_html_game.html`, `game_engine_core.js`, `react_game_component.js`  
**Data:** `birth_cards_json.json`, `family_cards_json.json`, `event_cards_*.json`, `death_cards_json.json`  
**Tools:** `simulation_script.js`, `card_templates.md`

---

## 📖 DOCUMENTATION

- **`CHANGELOG.md`** - Version history
- **`ARCHITECTURE.md`** - Technical reference (state structure, event format)
- **`ROADMAP.md`** - Future features
- `card_templates.md` - How to create cards

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

---

## ⚖️ CONTENT WARNING

Simulates death, inequality, difficult circumstances. Based on real statistics.

---

**Data:** UN Population Division, WHO Global Health Observatory, Human Development Reports

**Repo:** https://github.com/9to5ninja-projects/lifegame

**The cards are dealt. What are you drawing?** 🎲
