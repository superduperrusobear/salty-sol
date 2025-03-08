'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '@/contexts/ChatContext';
import { useUser } from '@/contexts/UserContext';
import { useBattle } from '@/contexts/BattleContext';
import { useFirebase } from '@/contexts/FirebaseContext';
import { chatService, ChatMessage } from '@/services/chatService';

export const ChatBox = () => {
  const { messages: chatMessages, sendMessage, isLoading, error } = useChat();
  const { username, isGuest, setUsername: updateGlobalUsername } = useUser();
  const { user } = useFirebase();
  const { battleState } = useBattle();
  const [inputValue, setInputValue] = useState('');
  const [chatUsername, setChatUsername] = useState('');
  const [isUsernameSet, setIsUsernameSet] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevBetsLengthRef = useRef(0);
  // Track system message IDs that should be hidden
  const [hiddenSystemMessages, setHiddenSystemMessages] = useState<string[]>([]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Check if username is already set from user store
  useEffect(() => {
    if (username) {
      setIsUsernameSet(true);
      setChatUsername(username);
    }
  }, [username]);

  // Monitor fake gambler bets and add chat messages
  useEffect(() => {
    // Completely disabled monitoring of fake gambler bets
    // Only handle system messages for phase changes
    
    if (battleState?.phase === 'BATTLE' && battleState.timeRemaining === 81) {
      chatService.sendSystemMessage('Battle has started! No more bets allowed.').catch(console.error);
    } else if (battleState?.phase === 'PAYOUT' && battleState.timeRemaining === 15 && battleState?.battleOutcome) {
      const winner = battleState.battleOutcome.winner === 1 
        ? battleState.fighters.current.player1?.name || 'Player 1'
        : battleState.fighters.current.player2?.name || 'Player 2';
        
      chatService.sendSystemMessage(`Battle ended! ${winner} is the winner! Payouts: ${battleState.battleOutcome.winningAmount.toLocaleString()} SOL`).catch(console.error);
    } else if (battleState?.phase === 'BETTING' && battleState.timeRemaining === 20 && battleState.currentBattle > 0) {
      chatService.sendSystemMessage('New battle starting! Place your bets now.').catch(console.error);
    }
  }, [battleState]);

  // Auto-hide system messages after 23.5 seconds
  useEffect(() => {
    // Find system messages that aren't already being tracked for hiding
    const systemMessages = chatMessages.filter(
      msg => msg.isSystemMessage && msg.id && !hiddenSystemMessages.includes(msg.id)
    );
    
    if (systemMessages.length > 0) {
      const timeouts: NodeJS.Timeout[] = [];
      
      systemMessages.forEach(msg => {
        if (msg.id) {
          const messageAge = Date.now() - msg.timestamp;
          const timeoutDuration = Math.max(0, 23500 - messageAge);
          
          const timeout = setTimeout(() => {
            setHiddenSystemMessages(prev => [...prev, msg.id!]);
          }, timeoutDuration);
          
          timeouts.push(timeout);
        }
      });
      
      // Clean up timeouts
      return () => {
        timeouts.forEach(timeout => clearTimeout(timeout));
      };
    }
  }, [chatMessages, hiddenSystemMessages]);

  // Filter out hidden system messages
  const visibleMessages = chatMessages.filter(
    msg => !(msg.isSystemMessage && msg.id && hiddenSystemMessages.includes(msg.id))
  );

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !username) return;
    
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
      // Update the global username for guest users
      if (isGuest) {
        updateGlobalUsername(chatUsername.trim());
      }
    }
  };

  return (
    <div className="flex h-full flex-col border border-gray-800 bg-black">
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
              className="mb-2 w-full bg-gray-900 p-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              minLength={3}
            />
            <button
              onClick={handleSetUsername}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 py-2 text-sm font-medium text-white transition-all hover:opacity-90"
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
            
            <div className="space-y-1">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin h-8 w-8 border-b-2 border-t-2 border-white"></div>
                </div>
              ) : visibleMessages.map((msg, index) => (
                <div key={msg.id || index} className="text-sm">
                  <span className={`font-bold ${
                    msg.isSystemMessage 
                      ? 'text-yellow-400' 
                      : index % 2 === 0
                        ? 'bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent'
                        : 'bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent'
                  }`}>
                    {msg.username}
                  </span>
                  <span className="text-white">: {msg.text}</span>
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
                placeholder={!username ? "Please set a username to chat" : "Type a message..."}
                disabled={!username}
                className="flex-1 bg-gray-900 p-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
              <button
                onClick={handleSendMessage}
                disabled={!username || !inputValue.trim()}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
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