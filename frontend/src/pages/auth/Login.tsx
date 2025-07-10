import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../App';

// 3D Space SVG Components
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

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Login failed');
      }
      login(data.access_token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      window.location.href = '/api/auth/google-login';
    } catch (err: any) {
      setError('Google login failed. Please try again.');
      setGoogleLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-blue relative overflow-hidden">
      {/* Space theme background */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#0f1535] via-[#1e2a5a] to-[#232b4d] opacity-95" />
      <Spotlights />
      <Orbit />
      <FloatingPlanet />
      <FloatingAstronaut />
      {/* Glassy, 3D card */}
      <div className="relative z-10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-accent-blue/30 rounded-2xl p-10 w-full max-w-md flex flex-col items-center" style={{boxShadow: '0 8px 40px 0 rgba(34,211,238,0.15), 0 1.5px 8px 0 #1e2a5a'}}>
        <div className="text-center mb-8">
          <h2 className="text-4xl font-extrabold text-white mb-2 drop-shadow-[0_2px_8px_rgba(34,211,238,0.25)] tracking-wide" style={{letterSpacing: '0.04em'}}>Welcome Back</h2>
          <p className="text-light-gray text-lg">Sign in to your account</p>
        </div>
        {error && (
          <div className="mb-6 p-3 bg-red-500/20 border border-red-500/50 rounded text-red-400 text-sm shadow-md">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6 w-full">
          <div>
            <label className="block text-light-gray mb-2 text-sm font-medium">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full p-3 rounded-xl bg-dark-blue/80 text-white border border-light-gray/20 focus:border-accent-blue focus:ring-2 focus:ring-accent-blue focus:outline-none transition-all shadow-inner shadow-accent-blue/10 hover:shadow-accent-blue/20"
              placeholder="Enter your email"
              disabled={loading}
              autoComplete="username"
            />
          </div>
          <div>
            <label className="block text-light-gray mb-2 text-sm font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full p-3 rounded-xl bg-dark-blue/80 text-white border border-light-gray/20 focus:border-accent-blue focus:ring-2 focus:ring-accent-blue focus:outline-none transition-all shadow-inner shadow-accent-blue/10 hover:shadow-accent-blue/20"
              placeholder="Enter your password"
              disabled={loading}
              autoComplete="current-password"
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-accent-blue text-sm hover:underline hover:text-light-purple transition-colors font-semibold"
            >
              Forgot password?
            </button>
          </div>
          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full bg-gradient-to-r from-accent-blue via-light-purple to-accent-blue text-white py-3 rounded-xl font-bold text-lg shadow-lg shadow-accent-blue/30 hover:scale-[1.03] hover:shadow-light-purple/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-accent-blue/30"
            style={{boxShadow: '0 2px 16px 0 #22d3ee44'}}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <div className="mt-8 w-full">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-light-gray/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-medium-blue text-light-gray">Or continue with</span>
            </div>
          </div>
          <button
            onClick={handleGoogleLogin}
            disabled={loading || googleLoading}
            className="mt-4 w-full flex items-center justify-center gap-3 bg-gradient-to-r from-white/80 to-white/60 text-gray-800 py-3 rounded-xl font-bold shadow-lg shadow-accent-blue/20 hover:scale-[1.03] hover:shadow-light-purple/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-accent-blue/10"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {googleLoading ? 'Connecting...' : 'Continue with Google'}
          </button>
        </div>
        <div className="mt-8 text-center w-full">
          <p className="text-light-gray text-sm">
            Don't have an account?{' '}
            <button
              onClick={() => navigate('/signup')}
              className="text-accent-blue hover:underline font-medium hover:text-light-purple transition-colors"
            >
              Sign up
            </button>
          </p>
          <p className="text-light-gray text-sm mt-2">
            <button
              onClick={() => navigate('/forgot-password')}
              className="text-accent-blue hover:underline font-medium hover:text-light-purple transition-colors"
            >
              Forgot password?
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

// Tailwind CSS Animations (add to your global CSS if not present):
// .animate-float { animation: float 4s ease-in-out infinite; }
// .animate-float-slow { animation: float 7s ease-in-out infinite; }
// @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-18px); } }
// .animate-blob { animation: blob 8s infinite ease-in-out alternate; }
// @keyframes blob { 0% { transform: scale(1) translate(0,0); } 100% { transform: scale(1.1) translate(20px, 10px); } } 