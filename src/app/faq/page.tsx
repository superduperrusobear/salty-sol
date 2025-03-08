'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function FAQ() {
  const router = useRouter();
  const [currentQuestion, setCurrentQuestion] = useState(0);

  const faqData = [
    {
      question: "What is Salty Sol?",
      answer: "Salty Sol is an exclusive, real-time betting platform where users place wagers on crypto token battles, driven by live market data and dynamic odds. We provide a unique, competitive environment for traders and crypto enthusiasts to bet on market trends in a gamified setting."
    },
    {
      question: "How do I get started?",
      answer: (
        <div>
          <p className="mb-2">1. Enter a username on the homepage (or continue as a guest).</p>
          <p className="mb-2">2. Explore Demo Mode to experience simulated betting.</p>
          <p>3. Secure Private Access to unlock full betting features and VIP perks.</p>
        </div>
      )
    },
    {
      question: "Is Salty Sol free to use?",
      answer: "Yes! The Demo Mode is free, allowing users to explore the platform. However, full betting access requires Private Access."
    },
    {
      question: "Can I chat with other users?",
      answer: (
        <div>
          <p className="mb-2">Yes! Salty Sol features a real-time chat system where users can:</p>
          <p className="mb-2">• Discuss market trends & battle strategies.</p>
          <p className="mb-2">• Engage in community-driven banter.</p>
          <p className="mb-4">• React to live matchups with emojis & memes.</p>
          <p className="text-sm text-yellow-400">Note: Chat is moderated to maintain a fun and respectful environment.</p>
        </div>
      )
    },
    {
      question: "What is Private Access, and how do I get it?",
      answer: (
        <div>
          <p className="mb-2">Private Access is your VIP ticket to Salty Sol's exclusive betting features, including:</p>
          <p className="mb-2">• Full access to live betting & high-stakes matchups.</p>
          <p className="mb-2">• Private betting rooms & custom pools.</p>
          <p className="mb-4">• Higher referral rewards & special bonuses.</p>
          
          <p className="font-semibold text-white mb-2 mt-4">How to Gain Access?</p>
          <ul className="list-disc pl-8 space-y-1">
            <li>Secure an invite from an existing Private Access member.</li>
            <li>Earn access through our referral program.</li>
            <li>Receive an exclusive invite from the Salty Sol team.</li>
          </ul>
        </div>
      )
    },
    {
      question: "How do I increase my odds of winning?",
      answer: (
        <div>
          <p className="mb-2">While betting is dynamic, you can improve your success rate by:</p>
          <p className="mb-2">• Analyzing market trends before placing bets.</p>
          <p className="mb-2">• Tracking volume surges & whale movements.</p>
          <p className="mb-4">• Using risk management strategies (low vs. high volatility tokens).</p>
          <p className="text-sm italic">Remember: The market is unpredictable—bet strategically!</p>
        </div>
      )
    },
    {
      question: "Will Salty Sol support mobile devices?",
      answer: (
        <div>
          <p className="mb-2">Yes! The Salty Sol Mobile App Beta is launching in Q2, allowing:</p>
          <p className="mb-2">• Seamless mobile betting on iOS & Android.</p>
          <p className="mb-2">• Push notifications for live battle updates.</p>
          <p>• Optimized UI/UX for on-the-go betting.</p>
        </div>
      )
    }
  ];

  const goToNextQuestion = () => {
    if (currentQuestion < faqData.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-black to-[#0a0b0f] p-6 flex flex-col">
      <button 
        onClick={() => router.push('/')}
        className="flex items-center text-cyan-400 hover:text-cyan-300 transition-colors mb-8"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
        Back to Home
      </button>

      <h1 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 text-center">
        Frequently Asked Questions
      </h1>
      <p className="text-gray-400 text-center mb-10">
        {`Question ${currentQuestion + 1} of ${faqData.length}`}
      </p>

      <div className="bg-gray-900/30 border border-gray-800 rounded-lg p-8 backdrop-blur-sm min-h-[300px] flex flex-col max-w-3xl mx-auto w-full mb-16">
        <h2 className="text-xl font-semibold text-cyan-400 mb-6">
          {faqData[currentQuestion].question}
        </h2>
        <div className="text-gray-300 flex-grow">
          {faqData[currentQuestion].answer}
        </div>
        
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-800">
          <button 
            onClick={goToPreviousQuestion}
            disabled={currentQuestion === 0}
            className={`flex items-center ${currentQuestion === 0 ? 'text-gray-600 cursor-not-allowed' : 'text-cyan-400 hover:text-cyan-300'} transition-colors`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Previous
          </button>
          
          <div className="flex space-x-2">
            {faqData.map((_, index) => (
              <button 
                key={index}
                onClick={() => setCurrentQuestion(index)}
                className={`w-2 h-2 rounded-full ${currentQuestion === index ? 'bg-cyan-500' : 'bg-gray-600'}`}
                aria-label={`Go to question ${index + 1}`}
              />
            ))}
          </div>
          
          <button 
            onClick={goToNextQuestion}
            disabled={currentQuestion === faqData.length - 1}
            className={`flex items-center ${currentQuestion === faqData.length - 1 ? 'text-gray-600 cursor-not-allowed' : 'text-cyan-400 hover:text-cyan-300'} transition-colors`}
          >
            Next
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="text-center">
        <h2 className="text-xl font-semibold text-white mb-4">
          Want early access to exclusive features?
        </h2>
        <button
          onClick={() => router.push('/signup')}
          className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          Sign Up for Private Access
        </button>
      </div>
    </main>
  );
} 