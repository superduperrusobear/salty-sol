import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import "./globals.css";
import { Providers } from "@/components/Providers";
import { BackgroundMusic } from "@/components/BackgroundMusic";
import type { ReactNode } from 'react';
import Head from 'next/head';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Salty Sol - Crypto Battle Arena",
  description: "Crypto battle betting platform",
  icons: {
    icon: [
      { url: '/images/s.png', type: 'image/png' }
    ],
    shortcut: '/images/s.png',
    apple: '/images/s.png',
  }
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" className="bg-[#0a0b0f]">
      <head>
        <link rel="icon" href="/images/s.png" />
      </head>
      <body className={`${inter.variable} font-sans antialiased min-h-screen bg-gradient-to-b from-black to-[#0a0b0f]`}>
        <Providers>
          {children}
        </Providers>
        <BackgroundMusic />
      </body>
    </html>
  );
}
