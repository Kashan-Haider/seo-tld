import React from 'react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-dark-blue/95 backdrop-blur-lg">
      <div className="mb-8 flex flex-col items-center">
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-spin-slow">
          <circle cx="40" cy="40" r="36" stroke="#3b82f6" strokeWidth="8" strokeDasharray="56 56" strokeLinecap="round" />
          <circle cx="40" cy="40" r="28" stroke="#A259FF" strokeWidth="6" strokeDasharray="44 44" strokeLinecap="round" />
          <circle cx="40" cy="40" r="20" stroke="#22d3ee" strokeWidth="4" strokeDasharray="32 32" strokeLinecap="round" />
        </svg>
        <div className="mt-6 text-2xl font-bold text-white tracking-wide animate-pulse">Generating Audit Report...</div>
        <div className="mt-2 text-accent-blue text-base animate-fade-in">Analyzing your website for SEO, performance, and more.</div>
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

export default LoadingScreen; 