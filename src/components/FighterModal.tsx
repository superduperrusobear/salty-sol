'use client';

import React from 'react';
import { Fighter, BattleState } from '@/contexts/BattleContext';
import { tokenService } from '@/services/tokenService';

interface FighterModalProps {
  fighter: Fighter | null;
  isOpen: boolean;
  onClose: () => void;
  battleState: BattleState;
}

const FighterModal: React.FC<FighterModalProps> = ({ fighter, isOpen, onClose, battleState }) => {
  if (!isOpen || !fighter) return null;

  const fallbackImage = fighter.symbol === 'ATM' ? '/FALLBACKS/atm.webp' : '/FALLBACKS/woke.webp';
  const imageToUse = !battleState?.currentBattle ? fallbackImage : (fighter.imageUri || fallbackImage);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-lg rounded-lg border border-gray-800 bg-gray-950 p-4">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src={imageToUse}
              alt={fighter.name} 
              className="h-8 w-8 rounded-full object-cover"
            />
            <div>
              <h3 className="text-lg font-bold text-white">{fighter.name}</h3>
              <p className="text-sm text-gray-400">{fighter.symbol}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Token Analysis */}
        <div className="space-y-4">
          {/* Market Stats */}
          <div className="rounded-lg border border-gray-800 bg-black/50 p-3">
            <h4 className="mb-2 text-sm font-medium text-gray-400">Market Stats</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500">Market Cap</p>
                <p className="font-mono text-white">${tokenService.formatNumber(fighter.marketCap || 0)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">24h Volume</p>
                <p className="font-mono text-white">${tokenService.formatNumber(fighter.volume || 0)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Price</p>
                <p className="font-mono text-white">${fighter.price?.toFixed(8) || '0.00000000'}</p>
              </div>
            </div>
          </div>

          {/* Token Info */}
          <div className="rounded-lg border border-gray-800 bg-black/50 p-3">
            <h4 className="mb-2 text-sm font-medium text-gray-400">Token Info</h4>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-gray-500">Contract Address</p>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-sm text-white truncate">{fighter.contractAddress}</p>
                  <button 
                    onClick={() => navigator.clipboard.writeText(fighter.contractAddress)}
                    className="text-cyan-400 hover:text-cyan-300"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                      <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                    </svg>
                  </button>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500">Network</p>
                <p className="text-white">Solana</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FighterModal; 