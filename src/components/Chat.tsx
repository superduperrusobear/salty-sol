'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useChat } from '@/contexts/ChatContext';
import { useUser } from '@/contexts/UserContext';
import { useFirebase } from '@/contexts/FirebaseContext';

export function Chat() {
  const { messages, sendMessage, isLoading, error } = useChat();
  const { username } = useUser();
  const { user } = useFirebase();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Handle hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isMounted && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isMounted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !username || !user) return;

    try {
      await sendMessage(newMessage);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    if (!isMounted) return '';
    return new Date(timestamp).toLocaleTimeString();
  };

  // Don't render anything until after hydration
  if (!isMounted) {
    return null;
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-lg overflow-hidden">
      <div className="p-4 bg-gray-800 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-white">Live Chat</h2>
      </div>

      {error && (
        <div className="bg-red-900/50 border-b border-red-800 p-2 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            No messages yet
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={message.id || index}
              className={`flex flex-col ${
                message.isSystemMessage ? 'opacity-75' : ''
              }`}
            >
              <div className="flex items-baseline space-x-2">
                <span className={`font-medium ${
                  message.isSystemMessage ? 'text-yellow-500' : 'text-blue-400'
                }`}>
                  {message.username}
                </span>
                <span className="text-xs text-gray-500">
                  {formatTimestamp(message.timestamp)}
                </span>
              </div>
              <p className={`text-sm mt-1 ${
                message.isSystemMessage ? 'text-yellow-200' : 'text-white'
              }`}>
                {message.text}
              </p>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 bg-gray-800 border-t border-gray-700">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={!user ? "Connecting to chat..." : username ? "Type a message..." : "Please login to chat"}
            disabled={!username || !user}
            className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            maxLength={500}
          />
          <button
            type="submit"
            disabled={!username || !user || !newMessage.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
} 