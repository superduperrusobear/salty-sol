'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import './roadmap.css';

// Icons for different roadmap items
const Icons = {
  Development: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  ),
  Launch: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
    </svg>
  ),
  Community: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  Feature: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
  ),
  Partnership: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  Expansion: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
  ),
  Security: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  Governance: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
};

// Define types for roadmap data
interface RoadmapItem {
  id: number;
  type: string;
  title: string;
  description: string;
  details?: string[];
  status: 'Completed' | 'In Progress' | 'Planned';
  icon: React.ReactNode;
}

interface RoadmapQuarter {
  id: string;
  title: string;
  color: string;
  items: RoadmapItem[];
}

// Roadmap data structure
const roadmapData: RoadmapQuarter[] = [
  {
    id: 'q1-2025',
    title: 'Q1 2025',
    color: 'from-cyan-500 to-blue-500',
    items: [
      {
        id: 1,
        type: 'Launch',
        title: 'Launch Day',
        description: 'Official launch of the Salty Sol platform with the following targets:',
        details: [
          'Achieve 5,000 token holders',
          'Leverage Solana influencers and launch announcements to attract organic interest',
          'Utilize the referral system to boost rapid adoption',
          'Reach Trending Position on Dexscreener',
          'Coordinate high-volume buy-ins during peak hours to optimize algorithm visibility',
          'Engage with the community to push real-time trading and sustain engagement',
          'Utilize social media and trading groups to drive traffic towards the launch',
          'Ensure the trial version is accessible to all users for early exploration'
        ],
        status: 'Completed',
        icon: Icons.Launch,
      },
      {
        id: 2,
        type: 'Development',
        title: 'First Week Objectives',
        description: 'Key milestones for the first week after launch:',
        details: [
          'Deploy Salty Sol\'s native token on Solana',
          'Execute successful platform launch',
          'Introduce lottery-based and rewards-driven betting tokens to increase engagement',
          'Activate referral-based incentives for early adopters to expand the user base',
          'Offer early-stage betting pools for selected projects',
          'Roll out Private Access invitations to top referrers, early adopters, and strategic partners',
          'Implement a gated entry system where Private Access members receive exclusive benefits'
        ],
        status: 'Completed',
        icon: Icons.Development,
      },
      {
        id: 3,
        type: 'Community',
        title: 'Phase 1 Expansion',
        description: 'Expanding our reach and enhancing platform capabilities:',
        details: [
          'Open additional Private Access slots based on referral milestones',
          'Target 10,000+ token holders through community campaigns',
          'Implement buyback & burn mechanics to stabilize token valuation',
          'Optimize trading pairs for higher volume and visibility',
          'Enable user-created betting pools for private groups'
        ],
        status: 'In Progress',
        icon: Icons.Community,
      },
    ],
  },
  {
    id: 'q2-2025',
    title: 'Q2 2025',
    color: 'from-green-500 to-emerald-500',
    items: [
      {
        id: 4,
        type: 'Feature',
        title: 'Advanced Betting Options',
        description: 'Expanding our betting capabilities with new features:',
        details: [
          'Implement parlays and multi-bet options',
          'Add prop bets for various events',
          'Enable custom wager creation',
          'Introduce dynamic odds based on market conditions',
          'Launch special event betting pools'
        ],
        status: 'Planned',
        icon: Icons.Feature,
      },
      {
        id: 5,
        type: 'Development',
        title: 'Mobile App Beta',
        description: 'Extending our platform to mobile devices:',
        details: [
          'Release the first mobile beta version for iOS & Android',
          'Implement core betting mechanics & real-time market integration',
          'Optimize wallet connections (Phantom, Solflare, and more) for seamless mobile use',
          'Conduct private beta testing with select Private Access users'
        ],
        status: 'Planned',
        icon: Icons.Development,
      },
      {
        id: 6,
        type: 'Launch',
        title: 'Salty Sol Mobile App Public Launch',
        description: 'Bringing our platform to mobile users worldwide:',
        details: [
          'Roll out the full mobile version with live betting, market tracking, and notifications',
          'Optimize user acquisition via targeted mobile ad campaigns',
          'Begin feature expansion planning for mobile-exclusive betting modes'
        ],
        status: 'Planned',
        icon: Icons.Launch,
      },
    ],
  },
  {
    id: 'q3-2025',
    title: 'Q3 2025',
    color: 'from-purple-500 to-indigo-500',
    items: [
      {
        id: 7,
        type: 'Feature',
        title: 'Referral Program Launch',
        description: 'Comprehensive referral system to drive growth:',
        details: [
          'Implement tiered rewards structure',
          'Create tracking dashboard for referrers',
          'Enable automatic reward distribution',
          'Launch referral contests with special prizes',
          'Provide marketing materials for top referrers'
        ],
        status: 'Planned',
        icon: Icons.Feature,
      },
      {
        id: 8,
        type: 'Expansion',
        title: 'Global Market Expansion',
        description: 'Extending our reach to new markets:',
        details: [
          'Add support for multiple languages',
          'Implement region-specific payment options',
          'Establish local community managers',
          'Comply with regional regulations',
          'Create targeted marketing campaigns for key regions'
        ],
        status: 'Planned',
        icon: Icons.Expansion,
      },
      {
        id: 9,
        type: 'Security',
        title: 'Enhanced Security Measures',
        description: 'Strengthening platform security:',
        details: [
          'Conduct third-party security audits',
          'Implement advanced encryption protocols',
          'Add multi-factor authentication options',
          'Create bug bounty program',
          'Enhance fraud detection systems'
        ],
        status: 'Planned',
        icon: Icons.Security,
      },
    ],
  },
  {
    id: 'q4-2025',
    title: 'Q4 2025',
    color: 'from-red-500 to-orange-500',
    items: [
      {
        id: 10,
        type: 'TBD',
        title: 'To Be Determined',
        description: 'TBD',
        details: ['To Be Determined'],
        status: 'Planned',
        icon: Icons.Feature,
      },
      {
        id: 11,
        type: 'TBD',
        title: 'To Be Determined',
        description: 'TBD',
        details: ['To Be Determined'],
        status: 'Planned',
        icon: Icons.Development,
      },
      {
        id: 12,
        type: 'TBD',
        title: 'To Be Determined',
        description: 'TBD',
        details: ['To Be Determined'],
        status: 'Planned',
        icon: Icons.Community,
      },
    ],
  },
];

export default function Roadmap() {
  const [activeItem, setActiveItem] = useState<number | null>(null);
  const [activeQuarter, setActiveQuarter] = useState<string | null>('q1-2025');

  const handleItemClick = (id: number) => {
    setActiveItem(activeItem === id ? null : id);
  };

  const handleQuarterClick = (id: string) => {
    setActiveQuarter(id);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-black to-[#0a0b0f] text-white">
      {/* Header */}
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <a href="/" className="text-blue-400 hover:text-blue-300 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </a>
        </div>

        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
            Salty Sol Roadmap
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Our strategic plan for building the future of decentralized betting. Follow our journey as we develop, 
            expand, and revolutionize the crypto betting landscape.
          </p>
        </div>

        {/* Quarter Navigation */}
        <div className="flex justify-center mb-12 space-x-4 overflow-x-auto pb-4">
          {roadmapData.map((quarter) => (
            <button
              key={quarter.id}
              onClick={() => handleQuarterClick(quarter.id)}
              className={`px-6 py-3 rounded-full font-medium transition-all ${
                activeQuarter === quarter.id
                  ? `bg-gradient-to-r ${quarter.color} text-white shadow-lg`
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {quarter.title}
            </button>
          ))}
        </div>

        {/* Roadmap Content */}
        <div className="max-w-4xl mx-auto">
          {roadmapData.map((quarter) => (
            <div
              key={quarter.id}
              className={`transition-all duration-500 ${
                activeQuarter === quarter.id ? 'opacity-100 max-h-[2000px]' : 'opacity-0 max-h-0 overflow-hidden'
              }`}
            >
              <div className="relative">
                <div className="absolute left-1/2 w-0.5 h-full bg-gray-800 transform -translate-x-1/2"></div>
                
                <div className="space-y-16">
                  {quarter.items.map((item, index) => (
                    <div key={item.id} className="relative">
                      <div className={`absolute top-6 left-1/2 w-6 h-6 rounded-full bg-gradient-to-r ${quarter.color} transform -translate-x-1/2 z-10 flex items-center justify-center`}>
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                      </div>
                      
                      <div className={`flex ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
                        <div className="w-1/2"></div>
                        <div className={`w-1/2 ${index % 2 === 0 ? 'pl-8' : 'pr-8'}`}>
                          <article 
                            className={`${activeItem === item.id ? 'active' : ''} shadow-lg rounded-lg overflow-hidden`}
                            onClick={() => handleItemClick(item.id)}
                          >
                            <header className={`flex items-center p-4 cursor-pointer bg-gradient-to-r ${quarter.color} rounded-t-lg`}>
                              <div className="text-white flex items-center justify-center w-12 h-12">
                                {item.icon}
                              </div>
                              <div className="ml-4 flex-grow">
                                <h3 className="font-bold text-lg">{item.title}</h3>
                                <span className="text-sm opacity-80">{item.type}</span>
                              </div>
                              <div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  item.status === 'Completed' 
                                    ? 'bg-green-900 text-green-300' 
                                    : item.status === 'In Progress' 
                                      ? 'bg-blue-900 text-blue-300' 
                                      : 'bg-gray-700 text-gray-300'
                                }`}>
                                  {item.status}
                                </span>
                              </div>
                            </header>
                            <div className="body bg-gray-800 border-gray-700 rounded-b-lg">
                              <p className="mb-4">{item.description}</p>
                              {item.details && (
                                <ul className="list-disc pl-5 mb-4 space-y-2 text-gray-300">
                                  {item.details.map((detail, idx) => (
                                    <li key={idx}>{detail}</li>
                                  ))}
                                </ul>
                              )}
                              {item.status === 'Completed' && (
                                <div className="flex items-center text-green-400">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Milestone achieved
                                </div>
                              )}
                            </div>
                          </article>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-800 mt-20 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-500 text-sm">
            © 2025 Salty Sol. All rights reserved.
          </p>
        </div>
      </div>
    </main>
  );
} 