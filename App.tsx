import React, { useState, useCallback } from 'react';
import { GameState } from './types';
import { GameCanvas } from './components/GameCanvas';
import { Overlay } from './components/Overlay';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [score, setScore] = useState<number>(0);

  const startGame = useCallback(() => {
    setScore(0);
    setGameState(GameState.PLAYING);
  }, []);

  return (
    <div className="relative w-full h-full bg-slate-900 select-none overflow-hidden">
      {/* Game Canvas Layer */}
      <GameCanvas 
        gameState={gameState} 
        setGameState={setGameState} 
        setScore={setScore} 
      />

      {/* UI Overlay Layer */}
      <Overlay 
        gameState={gameState} 
        score={score} 
        onStart={startGame} 
      />
    </div>
  );
};

export default App;
