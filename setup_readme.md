# MORTALITY LOTTERY - Prototype Setup

Quick start guide to get the card game prototype running in VS Code.

---

## Quick Start (5 Minutes)

### 1. Create Project Structure

```bash
mkdir mortality-lottery
cd mortality-lottery
npm init -y
npm install vite react react-dom
```

### 2. Create File Structure

```
mortality-lottery/
├── data/
│   ├── birth-cards.json
│   ├── family-cards.json
│   ├── event-cards-childhood.json
│   └── death-cards.json
├── src/
│   ├── lib/
│   │   └── game-engine.js
│   ├── components/
│   │   └── MortalityGame.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── styles.css
├── index.html
└── package.json
```

### 3. Copy Files

Copy the JSON card files I created into the `data/` folder:
- `birth-cards.json`
- `family-cards.json`
- `event-cards-childhood.json`
- `death-cards.json`

Copy the code files:
- `game-engine.js` → `src/lib/game-engine.js`
- `MortalityGame.jsx` → `src/components/MortalityGame.jsx`

### 4. Create Entry Files

**index.html**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mortality Lottery</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
```

**src/main.jsx**
```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

**src/App.jsx**
```javascript
import React from 'react';
import MortalityGame from './components/MortalityGame';

function App() {
  return (
    <div className="App">
      <MortalityGame />
    </div>
  );
}

export default App;
```

**src/styles.css**
```css
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #1a1a1a;
  color: #f5f5f5;
  line-height: 1.6;
}

.App {
  min-height: 100vh;
  padding: 20px;
}

.game-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.game-header h1 {
  text-align: center;
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #ff6b6b;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.player-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin: 30px 0;
  padding: 20px;
  background: #2a2a2a;
  border-radius: 12px;
  border: 2px solid #444;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
}

.stat-label {
  font-size: 0.9rem;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: #4ecdc4;
}

.birth-cards {
  margin: 30px 0;
}

.birth-cards h3 {
  margin-bottom: 15px;
  color: #ff6b6b;
}

.card {
  background: #2a2a2a;
  border: 2px solid #4ecdc4;
  border-radius: 10px;
  padding: 20px;
  margin: 15px 0;
  transition: transform 0.2s, box-shadow 0.2s;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(78, 205, 196, 0.3);
}

.card h4 {
  margin: 0 0 10px 0;
  color: #4ecdc4;
  font-size: 1.3rem;
}

.card p {
  color: #ccc;
  margin: 0;
}

.controls {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin: 30px 0;
  flex-wrap: wrap;
}

.action-button,
.start-button,
.play-again-button {
  padding: 15px 30px;
  font-size: 1.1rem;
  font-weight: bold;
  background: #ff6b6b;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.action-button:hover,
.start-button:hover,
.play-again-button:hover {
  background: #ff5252;
  transform: scale(1.05);
}

.start-button {
  font-size: 1.5rem;
  padding: 20px 40px;
}

.event-log {
  margin-top: 40px;
}

.event-log h3 {
  margin-bottom: 15px;
  color: #ff6b6b;
}

.log-container {
  max-height: 500px;
  overflow-y: auto;
  border: 2px solid #444;
  padding: 20px;
  border-radius: 10px;
  background: #2a2a2a;
}

.log-container::-webkit-scrollbar {
  width: 8px;
}

.log-container::-webkit-scrollbar-track {
  background: #1a1a1a;
}

.log-container::-webkit-scrollbar-thumb {
  background: #4ecdc4;
  border-radius: 4px;
}

.log-entry {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #444;
}

.log-entry:last-child {
  border-bottom: none;
}

.log-entry strong {
  color: #4ecdc4;
}

.log-entry ul {
  margin: 10px 0 10px 20px;
}

.log-entry li {
  color: #ccc;
  margin: 5px 0;
}

.survival-note {
  display: block;
  font-size: 0.85rem;
  color: #999;
  margin-top: 8px;
  font-style: italic;
}

.death-screen {
  text-align: center;
  padding: 40px 20px;
}

.death-screen h1 {
  font-size: 4rem;
  color: #ff6b6b;
  margin-bottom: 20px;
}

.death-details {
  margin-top: 30px;
}

.death-details h2 {
  font-size: 2rem;
  color: #f5f5f5;
  margin-bottom: 15px;
}

.cause-of-death {
  font-size: 1.5rem;
  color: #ff6b6b;
  margin: 20px 0;
  padding: 15px;
  background: #2a2a2a;
  border-radius: 8px;
  border: 2px solid #ff6b6b;
}

.life-summary {
  background: #2a2a2a;
  padding: 30px;
  border-radius: 12px;
  margin: 30px auto;
  text-align: left;
  max-width: 600px;
  border: 2px solid #4ecdc4;
}

.life-summary h3 {
  color: #4ecdc4;
  margin-bottom: 20px;
  text-align: center;
}

.life-summary p {
  margin: 10px 0;
  font-size: 1.1rem;
}

.life-summary strong {
  color: #ff6b6b;
}

.event-history {
  text-align: left;
  margin: 40px auto;
  max-width: 700px;
  max-height: 400px;
  overflow-y: auto;
  background: #2a2a2a;
  padding: 20px;
  border-radius: 12px;
  border: 2px solid #444;
}

.event-history h3 {
  color: #4ecdc4;
  margin-bottom: 15px;
  position: sticky;
  top: 0;
  background: #2a2a2a;
  padding-bottom: 10px;
}

.event-item {
  padding: 10px 0;
  border-bottom: 1px solid #444;
  color: #ccc;
}

.event-item:last-child {
  border-bottom: none;
}

.event-item span {
  color: #999;
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .game-header h1 {
    font-size: 2rem;
  }
  
  .player-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .stat-value {
    font-size: 1.5rem;
  }
}
```

### 5. Update package.json

Add this to your `package.json`:

```json
{
  "name": "mortality-lottery",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.0",
    "vite": "^4.3.9"
  }
}
```

### 6. Create vite.config.js

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
```

### 7. Install & Run

```bash
npm install
npm run dev
```

Open browser to `http://localhost:5173`

---

## What You Get

- **Birth Phase**: Draw random geography + family cards
- **Year-by-Year Progression**: Age through life
- **Event System**: Random events happen based on age
- **Death Checks**: Roll against survival % each year
- **Death Screen**: Shows cause of death, life summary, score

---

## Customization

### Add More Events

Create new event card files:
- `event-cards-teen.json` (age 13-25)
- `event-cards-adult.json` (age 26-60)
- `event-cards-elder.json` (age 60+)

Import them in `MortalityGame.jsx`:
```javascript
import eventCardsChild from './data/event-cards-childhood.json';
import eventCardsTeen from './data/event-cards-teen.json';
// etc.

const allEvents = [...eventCardsChild, ...eventCardsTeen];
```

### Adjust Difficulty

Edit card effects in JSON files:
- Increase `survivalMod` to make events less deadly
- Decrease starting `survival` in birth cards to make births harder
- Add more `weight` to certain cards to make them more common

### Add Choices

Events can have player choices. Add to event card:

```json
{
  "choices": [
    {
      "text": "Choice A",
      "effects": { "survivalMod": 5 }
    },
    {
      "text": "Choice B",
      "requires": { "resourceMin": 10 },
      "effects": { "resourceMod": -10, "survivalMod": 10 }
    }
  ]
}
```

Then update `MortalityGame.jsx` to present choices to player.

---

## Next Steps

1. **Playtest**: Run through 20+ games, take notes
2. **Balance**: Adjust survival numbers based on playtests
3. **Expand**: Add more event cards (goal: 200+)
4. **Polish**: Add animations, sound effects
5. **Multiplayer**: Add competitive modes

---

## Troubleshooting

**Cards not loading?**
- Check file paths in import statements
- Ensure JSON is valid (use JSONLint.com)

**Game not rendering?**
- Check browser console for errors
- Ensure all files are in correct folders

**Survival always 50%?**
- Check that card effects are applying
- Verify `applyCardEffects()` is being called

**Everyone dies instantly?**
- Starting survival numbers might be too low
- Check death check logic in `game-engine.js`

---

## File Checklist

✅ data/birth-cards.json  
✅ data/family-cards.json  
✅ data/event-cards-childhood.json  
✅ data/death-cards.json  
✅ src/lib/game-engine.js  
✅ src/components/MortalityGame.jsx  
✅ src/App.jsx  
✅ src/main.jsx  
✅ src/styles.css  
✅ index.html  
✅ vite.config.js  
✅ package.json  

---

**You now have a playable prototype. Go break it, then fix it. That's the game.**

🔥