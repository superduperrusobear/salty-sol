'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { chatService, ChatMessage } from '@/services/chatService';
import { useUser } from './UserContext';
import { useFirebase } from './FirebaseContext';

interface ChatContextType {
  messages: ChatMessage[];
  sendMessage: (text: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const ChatContext = createContext<ChatContextType>({
  messages: [],
  sendMessage: async () => {},
  isLoading: true,
  error: null
});

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { username, isGuest } = useUser();
  const { user } = useFirebase();
  const [isMounted, setIsMounted] = useState(false);

  // Handle hydration
  useEffect(() => {
    setIsMounted(true);
    return () => {
      chatService.cleanup();
    };
  }, []);

  // Subscribe to messages
  useEffect(() => {
    if (!isMounted) return;

    let unsubscribe: (() => void) | undefined;

    const setupChatListener = () => {
      // Allow chat to work even without Firebase auth for guest users
      if (!user && !isGuest) {
        setError('Please wait while we connect to chat...');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        unsubscribe = chatService.onNewMessages((newMessages) => {
          console.log('Received new messages:', newMessages.length);
          setMessages(newMessages);
          setIsLoading(false);
        });
      } catch (error) {
        console.error('Error setting up chat listener:', error);
        setError('Failed to connect to chat. Please refresh the page.');
      }
    };

    setupChatListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user, isMounted, isGuest]);

  const sendMessage = useCallback(async (text: string) => {
    if (!username || !text.trim()) {
      setError('You must have a username to send messages');
      return;
    }

    // Allow guest users to send messages without Firebase auth
    try {
      setError(null);
      await chatService.sendMessage(username, text.trim());
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
    }
  }, [username]);

  // Don't render anything until after hydration
  if (!isMounted) {
    return null;
  }

  return (
    <ChatContext.Provider value={{
      messages,
      sendMessage,
      isLoading,
      error
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => useContext(ChatContext); 