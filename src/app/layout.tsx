import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { UserProvider } from "@/contexts/UserContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Salty Sol",
  description: "Experience the thrill of crypto-style betting with zero risk. Place your bets, watch epic battles, and climb the leaderboard!",
  icons: {
    icon: '/images/s.png',
    shortcut: '/images/s.png',
    apple: '/images/s.png',
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <UserProvider>
          <main>{children}</main>
        </UserProvider>
      </body>
    </html>
  );
}
