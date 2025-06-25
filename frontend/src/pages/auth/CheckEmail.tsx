import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const CheckEmail: React.FC = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch('/api/auth/resend-verification', {
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-dark-blue">
      <div className="bg-medium-blue rounded-lg p-8 shadow-lg max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-4 text-accent-blue">Verify Your Email</h1>
        <p className="text-light-gray mb-6">
          We have sent a verification link to your email address.<br />
          Please check your inbox and click the link to verify your account.
        </p>
        <form onSubmit={handleResend} className="mb-4">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Enter your email to resend"
            className="w-full p-3 rounded-lg bg-dark-blue text-white border border-light-gray/20 focus:border-accent-blue focus:outline-none transition-colors mb-2"
            required
            disabled={loading}
          />
          <button
            type="submit"
            className="w-full bg-accent-blue text-white py-2 rounded-lg hover:bg-light-purple transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            disabled={loading}
          >
            {loading ? 'Resending...' : 'Resend Verification Email'}
          </button>
        </form>
        {message && <div className="mb-2 text-green-400">{message}</div>}
        {error && <div className="mb-2 text-red-400">{error}</div>}
      </div>
    </div>
  );
};

export default CheckEmail; 