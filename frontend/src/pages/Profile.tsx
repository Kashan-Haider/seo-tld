import React from 'react';
import { useAuth } from '../App';

const FloatingPlanet = () => (
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

const FloatingAstronaut = () => (
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

const Orbit = () => (
  <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] z-0 pointer-events-none" viewBox="0 0 420 420" fill="none">
    <ellipse cx="210" cy="210" rx="180" ry="60" stroke="#22d3ee" strokeWidth="2" opacity="0.12" />
    <ellipse cx="210" cy="210" rx="120" ry="180" stroke="#a78bfa" strokeWidth="2" opacity="0.08" />
    <ellipse cx="210" cy="210" rx="200" ry="200" stroke="#fff" strokeWidth="1" opacity="0.06" />
  </svg>
);

const Spotlights = () => (
  <>
    <div className="absolute left-1/2 top-0 -translate-x-1/2 w-96 h-96 bg-gradient-to-b from-accent-blue/40 to-transparent rounded-full blur-3xl opacity-60 z-0" />
    <div className="absolute right-0 top-1/3 w-72 h-72 bg-gradient-to-br from-light-purple/30 to-transparent rounded-full blur-2xl opacity-40 z-0" />
    <div className="absolute left-0 bottom-0 w-80 h-80 bg-gradient-to-tr from-accent-blue/20 to-transparent rounded-full blur-2xl opacity-30 z-0" />
  </>
);

const Profile: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-full flex items-center justify-center bg-dark-blue relative overflow-hidden p-5">
      {/* Space theme background */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#0f1535] via-[#1e2a5a] to-[#232b4d] opacity-95" />
      <Spotlights />
      <Orbit />
      <FloatingPlanet />
      <FloatingAstronaut />
      {/* Glassy, 3D card */}
      <div className="relative z-10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-accent-blue/30 rounded-2xl p-10 max-w-md flex flex-col items-center" style={{boxShadow: '0 8px 40px 0 rgba(34,211,238,0.15), 0 1.5px 8px 0 #1e2a5a'}}>
        <div className="text-center mb-6">
          <div className="mx-auto mb-4 w-24 h-24 rounded-full bg-gradient-to-br from-accent-blue/60 to-light-purple/40 flex items-center justify-center shadow-lg">
            <svg className="w-16 h-16 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
          </div>
          <h2 className="text-3xl font-extrabold text-white mb-1 drop-shadow-[0_2px_8px_rgba(34,211,238,0.25)] tracking-wide" style={{letterSpacing: '0.04em'}}>Your Profile</h2>
          <p className="text-light-gray text-lg">Manage your account details</p>
        </div>
        <div className="w-full flex flex-col gap-4 mt-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-light-gray uppercase tracking-widest">Full Name</span>
            <span className="text-white text-lg font-semibold">{user?.full_name || '-'}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-light-gray uppercase tracking-widest">Username</span>
            <span className="text-white text-lg font-semibold">{user?.username || '-'}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-light-gray uppercase tracking-widest">Email</span>
            <span className="text-white text-lg font-semibold">{user?.email || '-'}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-light-gray uppercase tracking-widest">Account Type</span>
            <span className="text-white text-lg font-semibold">{user?.is_premium ? 'Premium' : 'Standard'}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-light-gray uppercase tracking-widest">Joined</span>
            <span className="text-white text-lg font-semibold">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 