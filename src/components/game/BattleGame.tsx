'use client';

import React, { useEffect, useRef } from 'react';
import { useBattle } from '@/contexts/BattleContext';
import Phaser from 'phaser';
import { createGameConfig } from './config/gameConfig';
import { BattleScene } from './BattleScene';

interface BattleGameProps {
  className?: string;
}

export const BattleGame: React.FC<BattleGameProps> = ({ className }) => {
  const gameRef = useRef<HTMLDivElement>(null);
  const { battleState } = useBattle();
  const gameInstanceRef = useRef<Phaser.Game | null>(null);
  const lastBattleRef = useRef(battleState.currentBattle);
  const lastPhaseRef = useRef(battleState.phase);

  useEffect(() => {
    if (!gameRef.current) return;

    // Only create the game instance if it doesn't exist
    if (!gameInstanceRef.current) {
      const config = createGameConfig(gameRef.current);
      gameInstanceRef.current = new Phaser.Game(config);
    }

    // Handle window resize
    const handleResize = () => {
      if (gameInstanceRef.current) {
        gameInstanceRef.current.scale.refresh();
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      if (gameInstanceRef.current) {
        gameInstanceRef.current.destroy(true);
        gameInstanceRef.current = null;
      }
    };
  }, []);

  // Change arena when a new battle starts
  useEffect(() => {
    if (battleState.currentBattle !== lastBattleRef.current) {
      const scene = gameInstanceRef.current?.scene.getScene('BattleScene') as BattleScene;
      if (scene) {
        scene.changeArena();
      }
      lastBattleRef.current = battleState.currentBattle;
    }
  }, [battleState.currentBattle]);

  // Sync battle phase with the BattleScene
  useEffect(() => {
    if (battleState.phase !== lastPhaseRef.current) {
      const scene = gameInstanceRef.current?.scene.getScene('BattleScene') as BattleScene;
      if (scene && scene.setBattlePhase) {
        console.log(`Setting battle phase to ${battleState.phase}`);
        scene.setBattlePhase(battleState.phase);
      }
      lastPhaseRef.current = battleState.phase;
    }
  }, [battleState.phase]);

  return (
    <div className="relative w-full h-full bg-transparent rounded-lg overflow-hidden">
      {/* Battle phase overlay */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
        <div className="bg-black/80 text-white px-4 py-2 rounded-lg text-sm font-medium">
          {battleState.phase === 'BATTLE' && (
            <div className="flex items-center gap-2 text-red-400">
              <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse"></span>
              Battle in Progress - Round {battleState.currentRound}/3 ({battleState.timeRemaining}s)
            </div>
          )}
          {battleState.phase === 'BETTING' && (
            <div className="flex items-center gap-2 text-green-400">
              <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
              Place Your Bets ({battleState.timeRemaining}s)
            </div>
          )}
          {battleState.phase === 'PAYOUT' && (
            <div className="flex items-center gap-2 text-yellow-400">
              <span className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse"></span>
              Battle Complete!
            </div>
          )}
        </div>
      </div>

      {/* Fighter names */}
      {battleState.phase === 'BATTLE' && (
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-10">
          <div className="text-center text-gray-400">
            {battleState.fighters.current.player1?.name} vs {battleState.fighters.current.player2?.name}
          </div>
        </div>
      )}

      {/* Phaser game container */}
      <div 
        ref={gameRef} 
        className={`w-full h-full bg-transparent rounded-lg overflow-hidden ${className || ''}`}
        style={{ background: 'transparent' }}
      />
    </div>
  );
}; 