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
  const { username } = useUser();
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
      if (!user) {
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
  }, [user, isMounted]);

  const sendMessage = useCallback(async (text: string) => {
    if (!username || !text.trim() || !user) {
      setError('You must be logged in to send messages');
      return;
    }

    try {
      setError(null);
      await chatService.sendMessage(username, text.trim());
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
    }
  }, [username, user]);

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