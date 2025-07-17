import React from 'react';

const FloatingAstronaut: React.FC = () => (
  <svg className="absolute right-10 top-24 w-24 h-24 animate-float-slow z-0" viewBox="0 0 100 100" fill="none">
    <circle cx="50" cy="50" r="30" fill="#fff" opacity="0.15" />
    <ellipse cx="50" cy="50" rx="18" ry="22" fill="#fff" opacity="0.25" />
    <ellipse cx="50" cy="50" rx="12" ry="12" fill="#22d3ee" />
    <rect x="44" y="62" width="12" height="18" rx="6" fill="#fff" opacity="0.7" />
    <rect x="47" y="80" width="6" height="10" rx="3" fill="#22d3ee" />
    <ellipse cx="50" cy="50" rx="8" ry="8" fill="#fff" />
    <ellipse cx="50" cy="50" rx="6" ry="6" fill="#232b4d" />
  </svg>
);

export default FloatingAstronaut; 