'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '@/contexts/ChatContext';
import { useUser } from '@/contexts/UserContext';
import { useBattle } from '@/contexts/BattleContext';
import { useFirebase } from '@/contexts/FirebaseContext';
import { chatService } from '@/services/chatService';

export const ChatBox = () => {
  const { messages: chatMessages, sendMessage, isLoading, error } = useChat();
  const { username, isGuest } = useUser();
  const { user } = useFirebase();
  const { battleState } = useBattle();
  const [inputValue, setInputValue] = useState('');
  const [chatUsername, setChatUsername] = useState('');
  const [isUsernameSet, setIsUsernameSet] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevBetsLengthRef = useRef(0);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Check if username is already set from user store
  useEffect(() => {
    if (username && !isGuest) {
      setIsUsernameSet(true);
      setChatUsername(username);
    }
  }, [username, isGuest]);

  // Monitor fake gambler bets and add chat messages
  useEffect(() => {
    if (!battleState?.fakeGamblers?.activeBets) return;
    
    const currentBetsLength = battleState.fakeGamblers.activeBets.length;
    
    // Only process new bets
    if (currentBetsLength > prevBetsLengthRef.current) {
      const newBets = battleState.fakeGamblers.activeBets.slice(prevBetsLengthRef.current);
      
      // Add chat messages for new bets
      newBets.forEach(bet => {
        const fighterName = bet.player === 1 
          ? battleState.fighters.current.player1?.name || 'Player 1'
          : battleState.fighters.current.player2?.name || 'Player 2';
          
        chatService.sendMessage(bet.username, `I'm betting ${bet.amount.toLocaleString()} SOL on ${fighterName}! 🚀`).catch(console.error);
      });
      
      prevBetsLengthRef.current = currentBetsLength;
    }
    
    // Add system messages for phase changes
    if (battleState.phase === 'BATTLE' && battleState.timeRemaining === 81) {
      chatService.sendSystemMessage('🔥 Battle has started! No more bets allowed.').catch(console.error);
    } else if (battleState.phase === 'PAYOUT' && battleState.timeRemaining === 15) {
      const winner = battleState.battleOutcome?.winner === 1 
        ? battleState.fighters.current.player1?.name || 'Player 1'
        : battleState.fighters.current.player2?.name || 'Player 2';
        
      chatService.sendSystemMessage(`🏆 Battle ended! ${winner} is the winner! Payouts: ${battleState.battleOutcome?.winningAmount.toLocaleString()} SOL`).catch(console.error);
    } else if (battleState.phase === 'BETTING' && battleState.timeRemaining === 20 && battleState.currentBattle > 0) {
      // Reset the bets counter when a new battle starts
      prevBetsLengthRef.current = 0;
      chatService.sendSystemMessage('🆕 New battle starting! Place your bets now.').catch(console.error);
    }
  }, [battleState]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !username || !user) return;
    
    try {
      await sendMessage(inputValue);
      setInputValue('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const handleSetUsername = () => {
    if (chatUsername.trim().length >= 3) {
      setIsUsernameSet(true);
    }
  };

  return (
    <div className="flex h-full flex-col rounded-lg border border-gray-800 bg-black">
      <div className="border-b border-gray-800 p-2">
        <h3 className="text-sm font-bold text-white">Live Chat</h3>
      </div>
      
      {!isUsernameSet && isGuest ? (
        <div className="flex flex-1 flex-col items-center justify-center p-4">
          <p className="mb-2 text-center text-sm text-gray-400">Enter your username to chat</p>
          <div className="w-full">
            <input
              type="text"
              value={chatUsername}
              onChange={(e) => setChatUsername(e.target.value)}
              placeholder="Enter username (min 3 characters)"
              className="mb-2 w-full rounded bg-gray-900 p-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              minLength={3}
            />
            <button
              onClick={handleSetUsername}
              className="w-full rounded bg-gradient-to-r from-cyan-500 to-blue-500 py-2 text-sm font-medium text-white transition-all hover:opacity-90"
            >
              Start Chatting
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto p-2">
            {error && (
              <div className="bg-red-900/50 border-b border-red-800 p-2 text-sm text-red-300">
                {error}
              </div>
            )}
            
            <div className="space-y-1.5">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              ) : chatMessages.map((msg, index) => (
                <div key={msg.id || index} className={`rounded p-1.5 ${msg.username === username ? 'bg-blue-900/30' : 'bg-gray-900'}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${
                      msg.isSystemMessage 
                        ? 'text-yellow-400' 
                        : battleState.fakeGamblers.usernames.includes(msg.username)
                          ? 'text-green-400'
                          : 'text-cyan-400'
                    }`}>
                      {msg.username}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-white">{msg.text}</p>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
          
          <div className="border-t border-gray-800 p-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={!user ? "Connecting to chat..." : username ? "Type a message..." : "Please login to chat"}
                disabled={!username || !user}
                className="flex-1 rounded bg-gray-900 p-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
              <button
                onClick={handleSendMessage}
                disabled={!username || !user || !inputValue.trim()}
                className="rounded bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}; 