'use client';

import React from 'react';
import { Fighter } from '@/contexts/BattleContext';
import { tokenService } from '@/services/tokenService';

interface FighterCardProps {
  fighter: Fighter | null;
  index: number;
  winChance: number;
  onViewProfile: (fighter: Fighter | null) => void;
  className?: string;
}

const FighterCard: React.FC<FighterCardProps> = ({ 
  fighter, 
  index, 
  winChance, 
  onViewProfile,
  className = ''
}) => {
  // Helper function to get fighter image
  const getFighterImage = (fighter: Fighter | null, index: number): string => {
    if (!fighter) return index === 1 ? '/FALLBACKS/atm.webp' : '/FALLBACKS/woke.webp';
    
    // For first match, always use fallbacks
    if (!fighter.imageUri) {
      return index === 1 ? '/FALLBACKS/atm.webp' : '/FALLBACKS/woke.webp';
    }
    
    // After first match, try to use imageUri
    return fighter.imageUri || (index === 1 ? '/FALLBACKS/atm.webp' : '/FALLBACKS/woke.webp');
  };

  return (
    <div className={`rounded-lg border border-gray-800 bg-gray-950 p-3 ${className}`}>
      {fighter ? (
        <>
          <div className="mb-2 flex items-center gap-2">
            <img 
              src={getFighterImage(fighter, index)}
              alt={fighter.name} 
              className="h-6 w-6 rounded-full object-cover"
            />
            <button 
              onClick={() => fighter.contractAddress && navigator.clipboard.writeText(fighter.contractAddress)}
              className="text-base font-bold text-white hover:text-cyan-400 transition-colors"
            >
              {fighter.name}
              <span className="text-sm font-normal text-gray-500 ml-1">
                ({fighter.symbol})
              </span>
            </button>
          </div>
          <div className="space-y-1.5 text-sm text-gray-400">
            <div className="flex justify-between">
              <span>Win Chance</span>
              <span className="text-green-400">
                {winChance.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>Market Cap</span>
              <span className="text-white">
                ${tokenService.formatNumber(fighter.marketCap || 0)}
              </span>
            </div>
            <button 
              onClick={() => onViewProfile(fighter)}
              className="w-full mt-1 flex items-center justify-center gap-1 rounded border border-gray-800 bg-gray-900 px-2 py-1 text-xs text-cyan-400 hover:bg-gray-800 hover:text-cyan-300 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
              View Fighter Profile
            </button>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-24">
          <div className="animate-pulse text-gray-500">Loading fighter data...</div>
        </div>
      )}
    </div>
  );
};

export default FighterCard; 