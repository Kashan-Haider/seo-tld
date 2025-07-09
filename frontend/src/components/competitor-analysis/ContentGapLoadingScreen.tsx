import React from 'react';

interface ContentGapLoadingScreenProps {
  message?: string;
  // progress?: number; // Remove progress prop
}

const ContentGapLoadingScreen: React.FC<ContentGapLoadingScreenProps> = ({ message }) => {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-dark-blue via-medium-blue to-dark-blue relative overflow-hidden">
      <div className="relative flex flex-col items-center gap-10 z-10">
        {/* 3D Orbital Loader with floating cubes */}
        <div className="relative w-40 h-40 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-accent-blue via-light-purple to-neon-cyan blur-2xl opacity-40 animate-pulse" />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg width="140" height="140" viewBox="0 0 140 140" fill="none" className="animate-spin-slow">
              <ellipse cx="70" cy="70" rx="60" ry="24" stroke="#22d3ee" strokeWidth="4" fill="none" opacity="0.3" />
            </svg>
            <svg width="140" height="140" viewBox="0 0 140 140" fill="none" className="absolute animate-spin-reverse-slow">
              <ellipse cx="70" cy="70" rx="24" ry="60" stroke="#a259ff" strokeWidth="4" fill="none" opacity="0.3" />
            </svg>
            <svg width="140" height="140" viewBox="0 0 140 140" fill="none" className="absolute animate-spin-slower">
              <ellipse cx="70" cy="70" rx="45" ry="45" stroke="#3b82f6" strokeWidth="2" fill="none" opacity="0.2" />
            </svg>
          </div>
          <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-accent-blue via-light-purple to-neon-cyan shadow-lg border-4 border-white/10" />
          <div className="absolute left-2 top-6 animate-float-cube1">
            <div className="w-5 h-5 bg-gradient-to-br from-accent-blue to-neon-cyan shadow-lg rounded-lg transform rotate-12 blur-[1px] border-2 border-white/10" />
          </div>
          <div className="absolute right-3 bottom-4 animate-float-cube2">
            <div className="w-4 h-4 bg-gradient-to-br from-light-purple to-accent-blue shadow-md rounded-lg transform rotate-45 blur-[0.5px] border-2 border-white/10" />
          </div>
          <div className="absolute left-8 bottom-1 animate-float-cube3">
            <div className="w-3 h-3 bg-gradient-to-br from-neon-cyan to-accent-blue shadow rounded-lg transform rotate-6 blur-[0.5px] border-2 border-white/10" />
          </div>
        </div>
        <div className="text-xl md:text-2xl font-extrabold text-white animate-pulse-fade mt-2 text-center">
          {message || 'Analyzing content gaps and recommendations...'}
        </div>
      </div>
      <div className="absolute inset-0 z-0 pointer-events-none">
        <svg width="100%" height="100%" viewBox="0 0 1920 1080" className="w-full h-full opacity-20">
          <defs>
            <linearGradient id="gridGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#a259ff" stopOpacity="0.06" />
            </linearGradient>
          </defs>
          {Array.from({ length: 40 }).map((_, i) => (
            <line
              key={`v-${i}`}
              x1={i * 48}
              y1={0}
              x2={i * 48}
              y2={1080}
              stroke="url(#gridGradient)"
              strokeWidth="1"
            />
          ))}
          {Array.from({ length: 22 }).map((_, i) => (
            <line
              key={`h-${i}`}
              x1={0}
              y1={i * 48}
              x2={1920}
              y2={i * 48}
              stroke="url(#gridGradient)"
              strokeWidth="1"
            />
          ))}
        </svg>
      </div>
      <style>{`
        .animate-spin-slow { animation: spin 2.5s linear infinite; }
        .animate-spin-reverse-slow { animation: spin-reverse 3.5s linear infinite; }
        .animate-spin-slower { animation: spin 5s linear infinite; }
        .animate-pulse-fade { animation: pulseFade 2.2s infinite alternate; }
        .animate-float-cube1 { animation: floatCube1 3.2s ease-in-out infinite alternate; }
        .animate-float-cube2 { animation: floatCube2 2.7s ease-in-out infinite alternate; }
        .animate-float-cube3 { animation: floatCube3 2.2s ease-in-out infinite alternate; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes spin-reverse { 100% { transform: rotate(-360deg); } }
        @keyframes pulseFade { 0% { opacity: 0.7; } 100% { opacity: 1; } }
        @keyframes floatCube1 { 0% { transform: translateY(0) rotate(12deg); } 100% { transform: translateY(-24px) rotate(24deg); } }
        @keyframes floatCube2 { 0% { transform: translateY(0) rotate(45deg); } 100% { transform: translateY(-18px) rotate(60deg); } }
        @keyframes floatCube3 { 0% { transform: translateY(0) rotate(6deg); } 100% { transform: translateY(-12px) rotate(18deg); } }
      `}</style>
    </div>
  );
};

export default ContentGapLoadingScreen; 