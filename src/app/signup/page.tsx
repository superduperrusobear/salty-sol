'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function SignUp() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [phantomInstalled, setPhantomInstalled] = useState(false);

  // Check if Phantom is installed
  useEffect(() => {
    const checkPhantomWallet = () => {
      const phantom = window?.phantom?.solana;
      if (phantom) {
        setPhantomInstalled(true);
      }
    };

    // Check immediately and after a short delay to ensure window is fully loaded
    checkPhantomWallet();
    const timer = setTimeout(checkPhantomWallet, 500);
    
    return () => clearTimeout(timer);
  }, []);

  // Connect to Phantom wallet
  const connectWallet = async () => {
    setLoading(true);
    
    try {
      // Check if Phantom is installed
      const phantom = window?.phantom?.solana;
      
      if (!phantom) {
        window.open('https://phantom.app/', '_blank');
        toast.error('Please install Phantom wallet first');
        setLoading(false);
        return;
      }

      // Connect to wallet
      const { publicKey } = await phantom.connect();
      const address = publicKey.toString();
      
      // Set wallet address and connected state
      setWalletAddress(address);
      setWalletConnected(true);
      
      toast.success('Wallet connected successfully!');
      
      // Redirect to Telegram after a short delay
      setTimeout(() => {
        window.open('https://t.me/SaltySolBot', '_blank');
      }, 1500);
      
    } catch (error) {
      console.error('Error connecting to wallet:', error);
      toast.error('Failed to connect wallet. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-black to-[#0a0b0f] text-white flex flex-col items-center justify-center p-4">
      <div className="flex justify-center mb-4">
        <img src="/images/s.png" alt="Salty Sol" className="h-16 w-auto" />
      </div>
      
      <p className="text-gray-400 mb-8 text-center">
        {!walletConnected 
          ? "Connect your Phantom wallet to get started" 
          : "Wallet connected! Redirecting to Telegram..."}
      </p>

      {!walletConnected ? (
        <>
          <button
            onClick={connectWallet}
            disabled={loading}
            className="w-full max-w-md bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center justify-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Connecting...
              </>
            ) : (
              "Connect Phantom Wallet"
            )}
          </button>
          
          {!phantomInstalled && (
            <p className="text-yellow-400 text-sm mt-4 text-center">
              Phantom wallet not detected. Please install it first.
            </p>
          )}
          
          <div className="mt-6 flex justify-center space-x-4">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-xs text-gray-500">Secure Connection</span>
            </div>
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-xs text-gray-500">Fast & Easy</span>
            </div>
          </div>
        </>
      ) : (
        <div className="w-full max-w-md text-center">
          <div className="flex items-center mb-6 p-3 bg-gray-800/50 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <div className="flex-1 text-left">
              <p className="text-sm text-gray-300">Wallet Connected</p>
              <p className="text-xs text-gray-500">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</p>
            </div>
          </div>
          
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 0C7.164 0 0 7.164 0 16s7.164 16 16 16 16-7.164 16-16S24.836 0 16 0zm-3.2 23.28c-.32 0-.553-.107-.733-.267-.18-.16-.267-.373-.267-.693 0-.107 0-.213.053-.373l1.6-5.227c.053-.16.053-.267.053-.32 0-.107-.053-.16-.16-.16-.107 0-.213.053-.373.16l-.64.427c-.053-.107-.053-.267-.053-.373 0 0 .96-.853 1.28-1.067.32-.213.693-.373 1.067-.373.32 0 .587.107.747.267.16.16.267.373.267.64 0 .107-.053.267-.053.427l-1.6 5.227c-.53.16-.53.267-.53.32 0 .107.53.16.16.16.107 0 .267-.53.427-.16l.693-.427c.053.107.053.267.053.373 0 0-1.013.853-1.333 1.067-.32.213-.693.373-1.067.373h-.067zm3.253-12.8c-.427 0-.8-.16-1.12-.427-.32-.32-.48-.693-.48-1.12 0-.427.16-.8.48-1.12.32-.32.693-.48 1.12-.48.427 0 .8.16 1.12.427.32.32.48.693.48 1.12 0 .427-.16.8-.48 1.12-.32.32-.693.48-1.12.48z" fill="#229ED9"/>
              </svg>
            </div>
          </div>
          
          <p className="text-gray-300 mb-6">
            Opening Telegram channel...
          </p>
          
          <a 
            href="https://t.me/SaltySolBot" 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full inline-block bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Join Telegram Channel
          </a>
        </div>
      )}

      <a href="/" className="text-blue-400 hover:text-blue-300 text-sm mt-6">
        Back to Home
      </a>
    </main>
  );
}

// Add TypeScript interface for window with Phantom
declare global {
  interface Window {
    phantom?: {
      solana?: {
        connect: () => Promise<{ publicKey: { toString: () => string } }>;
        isPhantom: boolean;
      };
    };
  }
} 