import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../App';
import FloatingPlanet from '../../ui/FloatingPlanet';
import FloatingAstronaut from '../../ui/FloatingAstronaut';
import Orbit from '../../ui/Orbit';
import Spotlights from '../../ui/Spotlights';

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
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Login failed');
      }
      login(data.access_token);
      navigate('/');
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
      window.location.href = `${import.meta.env.VITE_BACKEND_URL}/auth/google-login`;
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