import React from "react";

interface LongTailKeywordLoadingScreenProps {
  message?: string;
}

const LongTailKeywordLoadingScreen: React.FC<LongTailKeywordLoadingScreenProps> = ({ message }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-dark-blue via-medium-blue to-dark-blue backdrop-blur-lg overflow-hidden">
      {/* 3D Loader & Message */}
      <div className="relative flex flex-col items-center gap-10 z-10">
        {/* 3D Orbital Loader with floating cubes */}
        <div className="relative w-40 h-40 flex items-center justify-center">
          {/* Glow Sphere (subtle) */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-accent-blue via-light-purple to-neon-cyan blur-2xl opacity-40 animate-pulse" />
          {/* 3D Spinning Rings */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg width="150" height="150" viewBox="0 0 150 150" fill="none" className="animate-spin-slow">
              <ellipse cx="75" cy="75" rx="65" ry="26" stroke="#22d3ee" strokeWidth="4" fill="none" opacity="0.3" />
            </svg>
            <svg width="150" height="150" viewBox="0 0 150 150" fill="none" className="absolute animate-spin-reverse-slow">
              <ellipse cx="75" cy="75" rx="26" ry="65" stroke="#a259ff" strokeWidth="4" fill="none" opacity="0.3" />
            </svg>
            <svg width="150" height="150" viewBox="0 0 150 150" fill="none" className="absolute animate-spin-slower">
              <ellipse cx="75" cy="75" rx="48" ry="48" stroke="#3b82f6" strokeWidth="2.5" fill="none" opacity="0.2" />
            </svg>
          </div>
          {/* Central Sphere (subtle shadow) */}
          <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-accent-blue via-light-purple to-neon-cyan shadow-lg border-4 border-white/10" />
          {/* Floating 3D Cubes */}
          <div className="absolute left-1 top-6 animate-float-cube1">
            <div className="w-6 h-6 bg-gradient-to-br from-accent-blue to-neon-cyan shadow-lg rounded-lg transform rotate-12 blur-[1px] border-2 border-white/10" />
          </div>
          <div className="absolute right-2 bottom-4 animate-float-cube2">
            <div className="w-4 h-4 bg-gradient-to-br from-light-purple to-accent-blue shadow-md rounded-lg transform rotate-45 blur-[0.5px] border-2 border-white/10" />
          </div>
          <div className="absolute left-8 bottom-1 animate-float-cube3">
            <div className="w-3.5 h-3.5 bg-gradient-to-br from-neon-cyan to-accent-blue shadow rounded-lg transform rotate-6 blur-[0.5px] border-2 border-white/10" />
          </div>
        </div>
        <div className="mt-2 text-xl font-bold text-white animate-pulse-fade">
          {message || "Generating long-tail keywords..."}
        </div>
      </div>
      {/* Futuristic Grid Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <svg width="100%" height="100%" viewBox="0 0 1920 1080" className="w-full h-full opacity-20">
          <defs>
            <linearGradient id="gridGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#a259ff" stopOpacity="0.06" />
            </linearGradient>
          </defs>
          {/* Vertical lines */}
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
          {/* Horizontal lines */}
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
      {/* Animations */}
      <style>{`
        .animate-spin-slow { animation: spin 2.5s linear infinite; }
        .animate-spin-reverse-slow { animation: spin-reverse 3.5s linear infinite; }
        .animate-spin-slower { animation: spin 5s linear infinite; }
        .animate-pulse-fade { animation: pulseFade 2.2s infinite alternate; }
        .animate-float-cube1 { animation: floatCube1 3.2s ease-in-out infinite alternate; }
        .animate-float-cube2 { animation: floatCube2 2.7s ease-in-out infinite alternate; }
        .animate-float-cube3 { animation: floatCube3 2.2s ease-in-out infinite alternate; }
        .animate-fade-in { animation: fadeIn 1.2s ease-in; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes spin-reverse { 100% { transform: rotate(-360deg); } }
        @keyframes pulseFade { 0% { opacity: 0.7; } 100% { opacity: 1; } }
        @keyframes floatCube1 { 0% { transform: translateY(0) rotate(12deg); } 100% { transform: translateY(-18px) rotate(24deg); } }
        @keyframes floatCube2 { 0% { transform: translateY(0) rotate(45deg); } 100% { transform: translateY(-12px) rotate(60deg); } }
        @keyframes floatCube3 { 0% { transform: translateY(0) rotate(6deg); } 100% { transform: translateY(-8px) rotate(18deg); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
};

export default LongTailKeywordLoadingScreen; 