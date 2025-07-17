import React from 'react';

const FloatingPlanet: React.FC = () => (
  <svg className="absolute left-10 top-16 w-32 h-32 animate-float z-0" viewBox="0 0 100 100" fill="none">
    <ellipse cx="50" cy="50" rx="40" ry="40" fill="url(#planetGradient)" />
    <ellipse cx="50" cy="50" rx="40" ry="40" fill="url(#planetShadow)" fillOpacity="0.5" />
    <defs>
      <radialGradient id="planetGradient" cx="0.5" cy="0.5" r="0.5" fx="0.3" fy="0.3" gradientTransform="rotate(45) scale(1 1)">
        <stop offset="0%" stopColor="#22d3ee" />
        <stop offset="100%" stopColor="#1e2a5a" />
      </radialGradient>
      <radialGradient id="planetShadow" cx="0.7" cy="0.7" r="0.7">
        <stop offset="0%" stopColor="#000" stopOpacity="0.2" />
        <stop offset="100%" stopColor="#000" stopOpacity="0.7" />
      </radialGradient>
    </defs>
  </svg>
);

export default FloatingPlanet; 