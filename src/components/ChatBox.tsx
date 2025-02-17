'use client';

import React, { useState, useEffect, useRef } from 'react';
import { subscribeToChatMessages, sendChatMessage } from '../services/firebase';

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: any;
}

export default function ChatBox() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [tempUsername, setTempUsername] = useState('');
  const [username, setUsername] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = subscribeToChatMessages(50, (newMessages) => {
      const sortedMessages = newMessages.sort((a, b) => b.timestamp - a.timestamp);
      setMessages(sortedMessages);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !newMessage.trim()) return;

    setIsSending(true);
    setError('');
    
    try {
      await sendChatMessage(newMessage.trim(), username);
      setNewMessage('');
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error: any) {
      console.error('Error sending message:', error);
      setError(error.message || 'Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (newMessage.trim()) {
        handleSendMessage(e);
      }
    }
  };

  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempUsername.trim().length >= 3) {
      setUsername(tempUsername.trim());
    }
  };

  const handleUsernameKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (tempUsername.trim().length >= 3) {
        setUsername(tempUsername.trim());
      }
    }
  };

  // If username is not set, show username input
  if (!username) {
    return (
      <div className="h-full bg-black/80 p-4 flex flex-col items-center justify-center">
        <div className="w-full max-w-md">
          <h2 className="text-[#00FFA3] text-xl mb-4 text-center">Enter your username to chat</h2>
          <form onSubmit={handleUsernameSubmit} className="space-y-4">
            <input
              type="text"
              value={tempUsername}
              onChange={(e) => setTempUsername(e.target.value)}
              onKeyPress={handleUsernameKeyPress}
              placeholder="Enter username (min 3 characters)"
              className="w-full bg-black/50 text-white px-4 py-2 rounded border border-[#00FFA3]/30 
                       focus:outline-none focus:border-[#00FFA3] transition-colors"
              minLength={3}
              maxLength={20}
            />
            <button
              type="submit"
              disabled={tempUsername.trim().length < 3}
              className="w-full px-4 py-2 bg-[#00FFA3] text-black rounded hover:bg-[#00FFA3]/90 
                       transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start Chatting
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-black/80 flex flex-col">
      {/* Chat Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <h2 className="text-[#00FFA3] font-bold">Live Chat</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">{messages.length} messages</span>
            <span className="text-sm text-[#00FFA3]">Chatting as: {username}</span>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <p className="text-gray-400 text-center">No messages yet. Be the first to chat!</p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`p-2 rounded ${
                msg.username === username ? 'bg-[#00FFA3]/10' : 'bg-black/40'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#00FFA3]">{msg.username}</span>
                <span className="text-xs text-gray-400">
                  {typeof msg.timestamp === 'number' 
                    ? new Date(msg.timestamp).toLocaleTimeString()
                    : new Date(msg.timestamp?.toDate?.() || msg.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-white break-words">{msg.message}</p>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <div className="p-4 border-t border-white/10">
        <form onSubmit={handleSendMessage} className="space-y-2">
          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message and press Enter to send..."
              className="flex-1 bg-black/50 text-white px-4 py-2 rounded border border-[#00FFA3]/30 
                       focus:outline-none focus:border-[#00FFA3] transition-colors"
              disabled={isSending}
              maxLength={280}
            />
            <button
              type="submit"
              disabled={isSending || !newMessage.trim()}
              className="px-4 py-2 bg-[#00FFA3] text-black rounded hover:bg-[#00FFA3]/90 
                       transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 