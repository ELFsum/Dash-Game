import React from 'react';
import { GameState, LeaderboardEntry } from '../types';

interface OverlayProps {
  gameState: GameState;
  score: number;
  leaderboard: LeaderboardEntry[];
  onStart: () => void;
  onGoToMenu: () => void;
}

export const Overlay: React.FC<OverlayProps> = ({ gameState, score, leaderboard, onStart, onGoToMenu }) => {
  const bestScore = leaderboard.length > 0 ? leaderboard[0].distance : 0;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
      
      {/* HUD: Current Score */}
      {(gameState === GameState.PLAYING || gameState === GameState.GAME_OVER) && (
        <div className="absolute top-6 right-8 text-cyan-400 font-mono text-3xl font-bold drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] flex flex-col items-end">
          <span className={`${score > bestScore && bestScore > 0 ? 'text-yellow-400 animate-pulse' : score > 1000 ? 'text-purple-400' : ''}`}>
            {score}m
          </span>
          {gameState === GameState.PLAYING && score > 0 && (
            <span className="text-xs text-slate-500 uppercase tracking-widest mt-1">
              Level {Math.floor(score / 500) + 1}
            </span>
          )}
        </div>
      )}

      {/* START SCREEN (Main Menu) */}
      {gameState === GameState.START && (
        <div className="pointer-events-auto bg-slate-800/80 p-8 rounded-2xl border border-cyan-500/30 backdrop-blur-sm text-center shadow-2xl shadow-cyan-900/50 max-w-md w-full mx-4 animate-in fade-in zoom-in duration-500">
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-1 drop-shadow-sm uppercase italic tracking-tighter">
            Neon Runner
          </h1>
          <p className="text-slate-500 text-[10px] mb-6 uppercase tracking-[0.4em] font-bold">Velocity Protocol v2.5</p>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-3">
              <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest block mb-1">Personal Best</span>
              <span className="text-xl font-mono font-bold text-cyan-400">{bestScore}m</span>
            </div>
            <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-3">
              <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest block mb-1">Last Run</span>
              <span className="text-xl font-mono font-bold text-slate-300">{score}m</span>
            </div>
          </div>

          {/* Controls Reminder */}
          <div className="text-slate-400 space-y-2 mb-6 text-[11px] text-left bg-slate-900/40 p-4 rounded-xl border border-slate-700/50">
            <div className="flex justify-between items-center">
              <span>JUMP</span>
              <span className="text-cyan-500 font-bold font-mono">TAP</span>
            </div>
            <div className="flex justify-between items-center">
              <span>SUPER DASH</span>
              <span className="text-green-500 font-bold font-mono">HOLD IN ZONE</span>
            </div>
            <div className="flex justify-between items-center">
              <span>DASH</span>
              <span className="text-fuchsia-500 font-bold font-mono">SWIPE</span>
            </div>
          </div>

          {/* Leaderboard - Always visible */}
          <div className="mb-8 text-left bg-slate-900/80 p-5 rounded-xl border border-slate-700 shadow-inner">
            <h3 className="text-[10px] font-bold text-cyan-500/80 uppercase tracking-widest mb-3 border-b border-slate-700 pb-2 flex justify-between">
              <span>Local Hall of Fame</span>
              <span className="text-slate-600">Top 5</span>
            </h3>
            <div className="space-y-2.5">
              {leaderboard.length > 0 ? (
                leaderboard.map((entry, i) => (
                  <div key={i} className="flex justify-between items-center text-xs font-mono">
                    <span className={`${i === 0 ? 'text-yellow-400' : 'text-slate-400'}`}>
                      {i + 1}. <span className="opacity-60">{entry.date}</span>
                    </span>
                    <span className={`${i === 0 ? 'text-yellow-400 font-bold' : 'text-slate-200'}`}>{entry.distance}m</span>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-slate-600 text-[10px] uppercase tracking-widest italic">
                  No telemetry data found.
                </div>
              )}
            </div>
          </div>

          <button
            onClick={onStart}
            className="w-full py-4 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-slate-900 font-black text-xl rounded-xl transition-all transform hover:scale-[1.02] active:scale-95 shadow-[0_0_25px_rgba(6,182,212,0.4)] uppercase tracking-widest"
          >
            Initiate Run
          </button>
        </div>
      )}

      {/* GAME OVER SCREEN */}
      {gameState === GameState.GAME_OVER && (
        <div className="pointer-events-auto bg-slate-800/95 p-8 rounded-2xl border border-rose-500/40 backdrop-blur-xl text-center shadow-2xl shadow-rose-900/50 flex flex-col items-center animate-in fade-in zoom-in duration-300 max-w-sm w-full mx-4">
          <div className="w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center mb-6 border border-rose-500/40">
            <div className="w-8 h-8 bg-rose-500 rounded-sm animate-pulse" />
          </div>
          <h2 className="text-3xl font-black text-rose-500 mb-2 tracking-tighter uppercase italic">Signal Severed</h2>
          <p className="text-slate-400 mb-8 font-mono text-lg">
            Final Distance: <span className="text-cyan-400 font-bold tracking-normal">{score}m</span>
          </p>

          <div className="w-full space-y-3">
             <button
              onClick={onStart}
              className="w-full py-4 bg-rose-600 hover:bg-rose-500 text-white font-black text-lg rounded-xl transition-all transform hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(244,63,94,0.3)] uppercase tracking-widest"
            >
              Reboot Protocol
            </button>
            <button
              onClick={onGoToMenu}
              className="w-full py-3 bg-slate-700/50 hover:bg-slate-700 text-slate-300 font-bold text-sm rounded-xl transition-all transform hover:scale-[1.02] active:scale-95 uppercase tracking-widest border border-slate-600/30"
            >
              System Mainframe
            </button>
            <p className="text-[9px] text-slate-500 uppercase font-bold pt-4 tracking-[0.2em] border-t border-slate-700/50 mt-4">
              Local Records Updated
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
