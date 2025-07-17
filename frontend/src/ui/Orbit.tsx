import React from 'react';

const Orbit: React.FC = () => (
  <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] z-0 pointer-events-none" viewBox="0 0 420 420" fill="none">
    <ellipse cx="210" cy="210" rx="180" ry="60" stroke="#22d3ee" strokeWidth="2" opacity="0.12" />
    <ellipse cx="210" cy="210" rx="120" ry="180" stroke="#a78bfa" strokeWidth="2" opacity="0.08" />
    <ellipse cx="210" cy="210" rx="200" ry="200" stroke="#fff" strokeWidth="1" opacity="0.06" />
  </svg>
);

export default Orbit; 