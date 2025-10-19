# Card Creation Templates

Quick reference for creating new cards. Copy-paste these templates and modify.

---

## Birth Card Template

```json
{
  "id": "birth_unique_id",
  "type": "birth",
  "name": "Geographic Region Name",
  "weight": 10,
  "description": "Flavor text describing what it's like to be born here.",
  "profileTags": ["tag1", "tag2"],
  "effects": {
    "statSet": {
      "survival": 75
    },
    "resourceMod": 5
  }
}
```

**Common Profile Tags:**
- `high-resource`, `moderate-resource`, `low-resource`
- `stable`, `unstable`, `extreme-risk`
- `urban`, `rural`, `agrarian`
- `emerging`, `conflict`, `recovering`

**Weight Guidelines:**
- Nordic/High Resource: 1-3 (rare)
- Western/Developed: 3-6
- Emerging Markets: 6-12
- Low Resource: 12-25
- Sub-Saharan Africa: 20-25 (most common birth globally)

**Survival Number Guidelines:**
- Profile A (High Resource): 95-99
- Profile B (Moderate): 90-95
- Profile C (Emerging): 80-90
- Profile D (Low Resource): 50-70
- Profile E (Conflict): 30-50

---

## Family Card Template

```json
{
  "id": "family_unique_id",
  "type": "family",
  "name": "Family Structure Description",
  "weight": 15,
  "description": "Flavor text about family situation.",
  "profileCompatibility": {
    "high-resource": 40,
    "moderate-resource": 30,
    "low-resource": 15,
    "conflict": 5
  },
  "effects": {
    "survivalMod": 5,
    "resourceMod": 10
  }
}
```

**Profile Compatibility:**
- Higher number = more likely in that profile
- Total across profiles doesn't need to equal 100
- Can specify different weights for different birth contexts

**Modifier Guidelines:**
- Stable families: +5 to +10 survival, +10 to +25 resources
- Moderate families: 0 to +5 survival, -5 to +10 resources
- Unstable families: -8 to -20 survival, -10 to -25 resources
- Extreme cases (orphan, violence): -18 to -30 survival

---

## Event Card Template (Simple)

```json
{
  "id": "event_unique_id",
  "type": "event",
  "name": "Event Name",
  "ageRange": [13, 25],
  "description": "What happens to the player.",
  "weight": 15,
  "profileTags": ["all"],
  "effects": {
    "survivalMod": -5,
    "resourceMod": 0,
    "agencyMod": 0
  }
}
```

**Age Ranges:**
- Childhood: [0, 12]
- Adolescent: [13, 25]
- Adult: [26, 60]
- Elder: [60, 100]
- Lifelong: [0, 100]

**Weight:**
- Very common events: 25-40
- Common events: 15-25
- Uncommon events: 8-15
- Rare events: 3-8
- Legendary events: 1-3

---

## Event Card Template (With Choices)

```json
{
  "id": "event_unique_id",
  "type": "event",
  "name": "Event Name",
  "ageRange": [18, 35],
  "description": "Event description with meaningful decision.",
  "weight": 10,
  "profileTags": ["all"],
  "choices": [
    {
      "text": "Choice A description",
      "requires": {
        "resourceMin": 10,
        "tags": ["literate"]
      },
      "effects": {
        "survivalMod": 8,
        "resourceMod": -10,
        "agencyMod": 1
      }
    },
    {
      "text": "Choice B description",
      "effects": {
        "survivalMod": -5,
        "resourceMod": 5
      }
    }
  ]
}
```

**Choice Requirements:**
- `resourceMin`: Minimum resources needed
- `tags`: Player must have these tags (e.g., "literate", "educated")
- Leave empty object `{}` for no requirements

---

## Event Card Template (Profile-Weighted)

```json
{
  "id": "event_unique_id",
  "type": "event",
  "name": "Event Name",
  "ageRange": [5, 18],
  "description": "Event that's more common in certain profiles.",
  "weight": 10,
  "profileTags": ["low-resource", "conflict"],
  "profileWeights": {
    "high-resource": 2,
    "moderate-resource": 8,
    "low-resource": 25,
    "conflict": 40,
    "unstable": 30
  },
  "effects": {
    "survivalMod": -12
  }
}
```

**Profile Weights Override Base Weight:**
- Use this when event probability varies dramatically by profile
- High numbers = more likely in that profile
- Can use 0 to make event impossible in a profile

---

## Death Card Template

```json
{
  "id": "death_unique_id",
  "name": "Cause of Death",
  "ageRange": [15, 60],
  "description": "How the person died.",
  "profileTags": ["low-resource", "conflict"],
  "profileWeights": {
    "high-resource": 5,
    "moderate-resource": 15,
    "low-resource": 30,
    "conflict": 50
  },
  "weight": 20,
  "genderSpecific": "female"
}
```

**Gender Specific (Optional):**
- `"female"`: Only for female characters
- `"male"`: Only for male characters
- Omit field: Can happen to any gender

**Age Ranges by Life Stage:**
- Infant: [0, 1]
- Child: [0, 12]
- Teen/Young Adult: [13, 30]
- Adult: [20, 60]
- Elder: [60, 100]
- Very Old: [75, 100]

**Profile Weights for Deaths:**
- Infectious disease: High in low-resource
- Violence: High in conflict/unstable
- Heart disease/cancer: Universal, but treatment access varies
- Maternal mortality: Very high in low-resource
- Dementia: High in high-resource (they live long enough)

---

## Effect Modifiers Quick Reference

### Survival Modifiers
- **Major positive:** +8 to +15 (healthcare access, stable family)
- **Minor positive:** +2 to +5 (friendship, small wins)
- **Neutral:** 0 (many life events)
- **Minor negative:** -3 to -8 (illness, loss)
- **Major negative:** -10 to -20 (parent death, violence, chronic illness)
- **Severe negative:** -20 to -30 (extreme trauma, refugee status)

### Resource Modifiers
- **Major gain:** +30 to +50 (inheritance, career success)
- **Minor gain:** +5 to +15 (job, stable income)
- **Neutral:** 0
- **Minor loss:** -5 to -15 (expenses, setbacks)
- **Major loss:** -20 to -40 (medical bills, disaster, bankruptcy)

### Agency Modifiers
- Agency is RARE - only give +1 for meaningful moments
- Education completed: +1
- Reach adulthood: +1
- Major achievement: +1
- Mentor/awakening: +1
- Forced marriage/imprisonment: -1

---

## Tags Reference

**Player Can Have These Tags:**
- `literate`: Can read
- `educated`: Completed formal education
- `working`: Has job
- `married`: In marriage/partnership
- `parent`: Has children
- `athlete`: Athletic talent
- `armed-group`: Joined militia/gang

**Use Tags For:**
- Event requirements ("must be literate to accept scholarship")
- Future event triggers ("if parent, can have event about child")
- Flavor text customization

---

## Tips for Writing Good Cards

### Birth Cards
- Focus on CONDITIONS not stereotypes
- "Rural agrarian, low resource" not "poor African village"
- Weights should match real birth rates
- Survival numbers drive the whole game - balance carefully

### Family Cards
- Family is the BIGGEST modifier early in life
- Orphaned infant should have 50%+ death chance first year
- Stable family is a huge advantage - reflect that
- Don't moralize (single parent ≠ automatically bad)

### Event Cards
- Make them SPECIFIC and VISUAL
- Bad: "Something bad happens"
- Good: "Your best friend dies in front of you"
- Events should feel inevitable but unpredictable
- Mix universal (love, loss) with profile-specific (malaria, drought)

### Death Cards
- Age-appropriate causes
- Infants: infection, malnutrition, birth complications
- Children: preventable disease, accidents
- Teens/Adults: violence, accidents, chronic disease
- Elders: heart disease, cancer, dementia
- Profile matters: conflict = violence, low-resource = preventable disease

---

## Playtesting Checklist

After adding new cards, test:

1. **Run simulation** (`node simulate.js`)
   - Check average lifespan
   - Check survival rates match real world
   - Check event/death distributions

2. **Manual playtest** (5-10 runs)
   - Does it feel fair?
   - Are there "dead zones" where nothing happens?
   - Are there too many events piling up?

3. **Edge cases**
   - Can a Profile E player survive to 18?
   - Can a Profile A player die young?
   - Do choices actually matter?

4. **Balance**
   - If everyone's dying too fast: Increase survival numbers or reduce negative modifiers
   - If everyone's living too long: Increase death check frequency or add more deadly events
   - If one profile dominates: Adjust birth card weights

---

## Common Mistakes to Avoid

❌ **Don't:** Make events too common (weight = 50)  
✅ **Do:** Most events should be weight 10-25

❌ **Don't:** Huge survival swings (-50 or +50)  
✅ **Do:** Incremental changes (-5 to -15 for most events)

❌ **Don't:** Forget age ranges  
✅ **Do:** Make sure events can only happen at appropriate ages

❌ **Don't:** Only negative events  
✅ **Do:** Mix joy, sorrow, mundane, and extraordinary

❌ **Don't:** Ignore profile tags  
✅ **Do:** Use profileWeights to make events realistic

❌ **Don't:** Write novels in description  
✅ **Do:** Keep it punchy (1-2 sentences max)

❌ **Don't:** Make every choice obvious  
✅ **Do:** Both choices should have tradeoffs

---

**Now go make some cards. Break the game. Fix it. Repeat.**