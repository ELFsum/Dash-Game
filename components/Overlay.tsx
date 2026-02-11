import React from 'react';
import { GameState } from '../types';

interface OverlayProps {
  gameState: GameState;
  score: number;
  onStart: () => void;
}

export const Overlay: React.FC<OverlayProps> = ({ gameState, score, onStart }) => {
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
      
      {/* Heads Up Display (always visible if playing or game over) */}
      {(gameState === GameState.PLAYING || gameState === GameState.GAME_OVER) && (
        <div className="absolute top-6 right-8 text-cyan-400 font-mono text-3xl font-bold drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">
          {score}m
        </div>
      )}

      {/* Start Screen */}
      {gameState === GameState.START && (
        <div className="pointer-events-auto bg-slate-800/80 p-8 rounded-2xl border border-cyan-500/30 backdrop-blur-sm text-center shadow-2xl shadow-cyan-900/50 max-w-md mx-4">
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-6 drop-shadow-sm">
            NEON RUNNER
          </h1>
          <div className="text-slate-300 space-y-4 mb-8 text-lg text-left bg-slate-900/50 p-6 rounded-xl border border-slate-700">
            <p className="flex items-center gap-3">
              <span className="w-8 h-8 flex items-center justify-center bg-cyan-900 text-cyan-300 rounded-lg text-sm font-bold">👆</span>
              <span><strong>Tap</strong> to Jump</span>
            </p>
            <p className="flex items-center gap-3">
              <span className="w-8 h-8 flex items-center justify-center bg-purple-900 text-purple-300 rounded-lg text-sm font-bold">⏸️</span>
              <span><strong>Hold</strong> in <strong className="text-green-400">Green Zones</strong> to charge, release in Sweet Spot to Super Dash!</span>
            </p>
            <p className="flex items-center gap-3">
              <span className="w-8 h-8 flex items-center justify-center bg-fuchsia-900 text-fuchsia-300 rounded-lg text-sm font-bold">➡️</span>
              <span><strong>Swipe Right</strong> to Dash</span>
            </p>
          </div>
          <button
            onClick={onStart}
            className="w-full py-4 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold text-xl rounded-xl transition-all transform hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(6,182,212,0.5)]"
          >
            START GAME
          </button>
        </div>
      )}

      {/* Game Over Screen */}
      {gameState === GameState.GAME_OVER && (
        <div className="pointer-events-auto bg-slate-800/90 p-8 rounded-2xl border border-rose-500/30 backdrop-blur-sm text-center shadow-2xl shadow-rose-900/50 flex flex-col items-center animate-in fade-in zoom-in duration-300">
          <h2 className="text-5xl font-black text-rose-500 mb-2 drop-shadow-[0_0_10px_rgba(244,63,94,0.6)]">
            SYSTEM FAILURE
          </h2>
          <p className="text-slate-400 mb-6 font-mono text-xl">
            Distance: <span className="text-cyan-400 font-bold">{score}m</span>
          </p>
          <button
            onClick={onStart}
            className="py-3 px-12 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xl rounded-xl transition-all transform hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(168,85,247,0.5)]"
          >
            REBOOT
          </button>
        </div>
      )}
    </div>
  );
};
