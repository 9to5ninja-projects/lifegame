import React, { useState, useEffect } from 'react';
import MortalityGame from './game-engine';

// Import card data (you'll need to adjust paths)
import birthCards from './data/birth-cards.json';
import familyCards from './data/family-cards.json';
import eventCards from './data/event-cards-childhood.json';
import deathCards from './data/death-cards.json';

function MortalityGameComponent() {
  const [game, setGame] = useState(null);
  const [gameState, setGameState] = useState('start'); // start, playing, dead
  const [currentEvents, setCurrentEvents] = useState([]);
  const [yearLog, setYearLog] = useState([]);

  // Initialize game
  const startGame = () => {
    const newGame = new MortalityGame(birthCards, familyCards, eventCards, deathCards);
    newGame.createPlayer();
    setGame(newGame);
    setGameState('playing');
    setYearLog([]);
    setCurrentEvents([]);
  };

  // Play one year
  const playOneYear = () => {
    if (!game || !game.player.alive) return;

    const result = game.playYear();
    
    // Log the year
    setYearLog(prev => [...prev, {
      age: result.age,
      events: result.events,
      survival: result.survival
    }]);

    // Check if dead
    if (!result.deathCheck.alive) {
      setGameState('dead');
    }
  };

  // Auto-play until death or age 100
  const autoPlay = () => {
    const interval = setInterval(() => {
      if (!game || !game.player.alive || game.player.age >= 100) {
        clearInterval(interval);
        if (game && game.player.alive) {
          setGameState('dead'); // Reached max age
        }
        return;
      }
      playOneYear();
    }, 500); // Play one year every 500ms
  };

  if (!game || gameState === 'start') {
    return (
      <div className="game-container">
        <h1>MORTALITY LOTTERY</h1>
        <p>A card game about being born. Based on real-world statistics.</p>
        <button onClick={startGame} className="start-button">
          Draw Your Birth
        </button>
      </div>
    );
  }

  if (gameState === 'dead') {
    const summary = game.getSummary();
    return (
      <div className="game-container death-screen">
        <h1>GAME OVER</h1>
        <div className="death-details">
          <h2>You died at age {summary.age}</h2>
          <p className="cause-of-death">
            Cause: {summary.causeOfDeath || 'Old Age'}
          </p>
          
          <div className="life-summary">
            <h3>Your Life</h3>
            <p><strong>Born:</strong> {summary.birthProfile}</p>
            <p><strong>Family:</strong> {summary.familyStructure}</p>
            <p><strong>Major Events:</strong> {summary.eventHistory.length}</p>
            <p><strong>Final Score:</strong> {summary.finalScore} points</p>
          </div>

          <div className="event-history">
            <h3>Life Events</h3>
            {summary.eventHistory.map((event, i) => (
              <div key={i} className="event-item">
                Age {event.age}: {event.event}
                {event.choice && <span> - {event.choice}</span>}
              </div>
            ))}
          </div>

          <button onClick={startGame} className="play-again-button">
            Play Again
          </button>
        </div>
      </div>
    );
  }

  // Playing state
  const player = game.player;

  return (
    <div className="game-container">
      <div className="game-header">
        <h1>MORTALITY LOTTERY</h1>
      </div>

      <div className="player-stats">
        <div className="stat-item">
          <span className="stat-label">Age:</span>
          <span className="stat-value">{player.age}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Survival:</span>
          <span className="stat-value">{player.survival}%</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Resources:</span>
          <span className="stat-value">{player.resources}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Agency:</span>
          <span className="stat-value">{player.agency}</span>
        </div>
      </div>

      <div className="birth-cards">
        <h3>Your Birth Conditions</h3>
        {player.birthCards.map((card, i) => (
          <div key={i} className="card birth-card">
            <h4>{card.name}</h4>
            <p>{card.description}</p>
          </div>
        ))}
      </div>

      <div className="controls">
        <button onClick={playOneYear} className="action-button">
          Live 1 Year
        </button>
        <button onClick={autoPlay} className="action-button">
          Auto-Play to Death
        </button>
      </div>

      <div className="event-log">
        <h3>Life Events</h3>
        <div className="log-container">
          {yearLog.slice().reverse().map((year, i) => (
            <div key={i} className="log-entry">
              <strong>Age {year.age}:</strong>
              {year.events.length > 0 ? (
                <ul>
                  {year.events.map((event, j) => (
                    <li key={j}>{event}</li>
                  ))}
                </ul>
              ) : (
                <span> Nothing notable happened.</span>
              )}
              <span className="survival-note">Survival: {year.survival}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MortalityGameComponent;

/* 
BASIC STYLING (Add to your CSS file):

.game-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: system-ui, -apple-system, sans-serif;
}

.game-header h1 {
  text-align: center;
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.player-stats {
  display: flex;
  gap: 20px;
  justify-content: center;
  margin: 20px 0;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 8px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-label {
  font-size: 0.9rem;
  color: #666;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
}

.birth-cards {
  margin: 20px 0;
}

.card {
  background: white;
  border: 2px solid #333;
  border-radius: 8px;
  padding: 15px;
  margin: 10px 0;
}

.card h4 {
  margin: 0 0 10px 0;
}

.controls {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin: 20px 0;
}

.action-button, .start-button, .play-again-button {
  padding: 12px 24px;
  font-size: 1rem;
  background: #333;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

.action-button:hover, .start-button:hover, .play-again-button:hover {
  background: #555;
}

.event-log {
  margin-top: 30px;
}

.log-container {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #ddd;
  padding: 15px;
  border-radius: 8px;
}

.log-entry {
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.log-entry:last-child {
  border-bottom: none;
}

.survival-note {
  display: block;
  font-size: 0.85rem;
  color: #666;
  margin-top: 5px;
}

.death-screen {
  text-align: center;
}

.death-details {
  margin-top: 30px;
}

.cause-of-death {
  font-size: 1.3rem;
  color: #d32f2f;
  margin: 20px 0;
}

.life-summary {
  background: #f5f5f5;
  padding: 20px;
  border-radius: 8px;
  margin: 20px 0;
  text-align: left;
}

.event-history {
  text-align: left;
  margin: 30px 0;
  max-height: 400px;
  overflow-y: auto;
}

.event-item {
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}
*/