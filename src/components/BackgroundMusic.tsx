'use client';

import { useEffect, useRef } from 'react';

export function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create audio element
    const audio = new Audio('/Shin Megami Tensei IV OST - Battle B2 - (Boss Battle Theme).mp3');
    audio.loop = true;
    audio.volume = 0.4; // Set volume to 40%
    audioRef.current = audio;

    // Function to start playing
    const startPlaying = () => {
      audio.play().catch(error => {
        console.log('Audio playback failed:', error);
      });
      // Remove the event listeners after successful playback
      document.removeEventListener('click', startPlaying);
      document.removeEventListener('keydown', startPlaying);
    };

    // Add event listeners for user interaction
    document.addEventListener('click', startPlaying);
    document.addEventListener('keydown', startPlaying);

    return () => {
      // Cleanup
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      document.removeEventListener('click', startPlaying);
      document.removeEventListener('keydown', startPlaying);
    };
  }, []);

  return null;
} 