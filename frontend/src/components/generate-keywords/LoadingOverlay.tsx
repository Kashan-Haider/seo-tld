import React, { useEffect, useState } from "react";

const messages = [
  "Analyzing your keyword...",
  "Generating keywords using AI...",
  "Enhancing and deduplicating keywords...",
  "Clustering similar phrases...",
  "Fetching real-time search suggestions...",
  "Estimating search volume and difficulty...",
  "Scoring and ranking keywords...",
  "Finalizing your advanced keyword list..."
];

const LoadingOverlay: React.FC = () => {
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIdx((idx) => (idx + 1) % messages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col text-center items-center justify-center bg-dark-blue/95 backdrop-blur-lg px-5">
      <div className="mb-8 flex flex-col items-center">
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-spin-slow">
          <circle cx="40" cy="40" r="36" stroke="#3b82f6" strokeWidth="8" strokeDasharray="56 56" strokeLinecap="round" />
          <circle cx="40" cy="40" r="28" stroke="#A259FF" strokeWidth="6" strokeDasharray="44 44" strokeLinecap="round" />
          <circle cx="40" cy="40" r="20" stroke="#22d3ee" strokeWidth="4" strokeDasharray="32 32" strokeLinecap="round" />
        </svg>
        <div className="mt-6 text-2xl font-bold text-white tracking-wide animate-pulse">
          {messages[msgIdx]}
        </div>
        <div className="mt-2 text-white text-base animate-fade-in">
          Please wait while we generate your advanced keywords. It may take a few minutes.
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <span className="w-3 h-3 bg-accent-blue rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
        <span className="w-3 h-3 bg-light-purple rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
        <span className="w-3 h-3 bg-neon-cyan rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
      </div>
      <style>{`
        .animate-spin-slow { animation: spin 2s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .animate-fade-in { animation: fadeIn 1.2s ease-in; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-bounce { animation: bounce 1.2s infinite alternate; }
        @keyframes bounce { to { transform: translateY(-12px); } }
      `}</style>
    </div>
  );
};

export default LoadingOverlay; 