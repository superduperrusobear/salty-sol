'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { UserProvider } from "@/contexts/UserContext";
import { BattleProvider } from "@/contexts/BattleContext";
import { FirebaseProvider } from "@/contexts/FirebaseContext";
import { ChatProvider } from "@/contexts/ChatContext";

const ToasterComponent = dynamic(
  () => import('react-hot-toast').then((mod) => {
    const { Toaster } = mod;
    return () => (
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1f2937',
            color: '#fff',
            border: '1px solid rgb(31 41 55)'
          },
        }}
      />
    );
  }),
  { ssr: false }
);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <React.Fragment>
      <FirebaseProvider>
        <UserProvider>
          <BattleProvider>
            <ChatProvider>
              {children}
            </ChatProvider>
          </BattleProvider>
        </UserProvider>
      </FirebaseProvider>
      <ToasterComponent />
    </React.Fragment>
  );
} 