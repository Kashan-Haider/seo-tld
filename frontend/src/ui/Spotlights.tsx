import React from 'react';

const Spotlights: React.FC = () => (
  <>
    <div className="absolute left-1/2 top-0 -translate-x-1/2 w-96 h-96 bg-gradient-to-b from-accent-blue/40 to-transparent rounded-full blur-3xl opacity-60 z-0" />
    <div className="absolute right-0 top-1/3 w-72 h-72 bg-gradient-to-br from-light-purple/30 to-transparent rounded-full blur-2xl opacity-40 z-0" />
    <div className="absolute left-0 bottom-0 w-80 h-80 bg-gradient-to-tr from-accent-blue/20 to-transparent rounded-full blur-2xl opacity-30 z-0" />
  </>
);

export default Spotlights; 