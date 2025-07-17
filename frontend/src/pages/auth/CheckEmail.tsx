import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FloatingPlanet from '../../ui/FloatingPlanet';
import FloatingAstronaut from '../../ui/FloatingAstronaut';
import Orbit from '../../ui/Orbit';
import Spotlights from '../../ui/Spotlights';

const CheckEmail: React.FC = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to resend verification email');
      }
      setMessage(data.message || 'Verification email resent. Please check your inbox.');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
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
          <h2 className="text-3xl font-extrabold text-white mb-2 drop-shadow-[0_2px_8px_rgba(34,211,238,0.25)] tracking-wide" style={{letterSpacing: '0.04em'}}>Verify Your Email</h2>
          <p className="text-light-gray text-base">
            We have sent a verification link to your email address.<br />
            Please check your inbox and click the link to verify your account.
          </p>
        </div>
        {message && (
          <div className="mb-6 p-3 bg-green-500/20 border border-green-500/50 rounded text-green-400 text-sm shadow-md w-full text-center">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-6 p-3 bg-red-500/20 border border-red-500/50 rounded text-red-400 text-sm shadow-md w-full text-center">
            {error}
          </div>
        )}
        <form onSubmit={handleResend} className="space-y-6 w-full">
          <div>
            <label className="block text-light-gray mb-2 text-sm font-medium">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email to resend"
              className="w-full p-3 rounded-xl bg-dark-blue/80 text-white border border-light-gray/20 focus:border-accent-blue focus:ring-2 focus:ring-accent-blue focus:outline-none transition-all shadow-inner shadow-accent-blue/10 hover:shadow-accent-blue/20"
              required
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-accent-blue via-light-purple to-accent-blue text-white py-3 rounded-xl font-bold text-lg shadow-lg shadow-accent-blue/30 hover:scale-[1.03] hover:shadow-light-purple/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-accent-blue/30"
            style={{boxShadow: '0 2px 16px 0 #22d3ee44'}}
            disabled={loading}
          >
            {loading ? 'Resending...' : 'Resend Verification Email'}
          </button>
        </form>
        <div className="mt-8 w-full flex flex-col items-center gap-2">
          <button
            onClick={() => navigate('/login')}
            className="text-accent-blue hover:underline font-medium hover:text-light-purple transition-colors text-sm"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckEmail; 