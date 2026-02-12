import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GameState, LeaderboardEntry } from './types';
import { GameCanvas } from './components/GameCanvas';
import { Overlay } from './components/Overlay';

const STORAGE_KEY = 'neon-runner-scores-v2';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [score, setScore] = useState<number>(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  
  // Use a ref for the score to ensure saveScore always gets the final value
  const scoreRef = useRef(0);
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  // Load leaderboard on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setLeaderboard(parsed);
        }
      } catch (e) {
        console.error("Failed to load leaderboard", e);
      }
    }
  }, []);

  const saveScore = useCallback(() => {
    const finalScore = scoreRef.current;
    if (finalScore <= 0) return;
    
    setLeaderboard(prev => {
      const newEntry: LeaderboardEntry = {
        distance: finalScore,
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })
      };
      
      const updated = [...prev, newEntry]
        .sort((a, b) => b.distance - a.distance)
        .slice(0, 5); // Keep top 5
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleGameStateChange = useCallback((newState: GameState) => {
    setGameState(prev => {
      // Save score transition from playing to game over
      if (prev === GameState.PLAYING && newState === GameState.GAME_OVER) {
        saveScore();
      }
      return newState;
    });
  }, [saveScore]);

  const startGame = useCallback(() => {
    setScore(0);
    setGameState(GameState.PLAYING);
  }, []);

  const handleGoToMenu = useCallback(() => {
    setGameState(GameState.START);
  }, []);

  return (
    <div className="relative w-full h-full bg-slate-900 select-none overflow-hidden font-sans">
      <GameCanvas 
        gameState={gameState} 
        setGameState={handleGameStateChange} 
        setScore={setScore} 
      />
      <Overlay 
        gameState={gameState} 
        score={score} 
        leaderboard={leaderboard}
        onStart={startGame} 
        onGoToMenu={handleGoToMenu}
      />
    </div>
  );
};

export default App;
