import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const VerifyEmail: React.FC = () => {
  const query = useQuery();
  const status = query.get('status');
  const reason = query.get('reason');

  let title = '';
  let message = '';
  let isSuccess = false;

  if (status === 'success') {
    title = 'Email Verified!';
    message = 'Your email has been successfully verified. You can now log in.';
    isSuccess = true;
  } else if (status === 'error') {
    title = 'Verification Failed';
    if (reason === 'invalid_token') {
      message = 'The verification link is invalid or has already been used.';
    } else if (reason === 'expired_token') {
      message = 'The verification link has expired. Please sign up again or request a new verification email.';
    } else {
      message = 'An unknown error occurred during verification.';
    }
  }

  // Resend logic
  const [email, setEmail] = useState('');
  const [resendMessage, setResendMessage] = useState('');
  const [resendError, setResendError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResendError('');
    setResendMessage('');
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
      setResendMessage(data.message || 'Verification email resent. Please check your inbox.');
    } catch (err: any) {
      setResendError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-dark-blue">
      <div className="bg-medium-blue rounded-lg p-8 shadow-lg max-w-md w-full text-center">
        <h1 className={`text-2xl font-bold mb-4 ${isSuccess ? 'text-green-400' : 'text-red-400'}`}>{title}</h1>
        <p className="text-light-gray mb-6">{message}</p>
        <Link to={isSuccess ? '/login' : '/signup'} className="bg-accent-blue text-white px-4 py-2 rounded-lg hover:bg-light-purple transition-colors">
          {isSuccess ? 'Go to Login' : 'Go to Signup'}
        </Link>
        {/* Resend form only if verification failed */}
        {status === 'error' && (
          <div className="mt-6">
            <form onSubmit={handleResend} className="mb-2">
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
            {resendMessage && <div className="mb-2 text-green-400">{resendMessage}</div>}
            {resendError && <div className="mb-2 text-red-400">{resendError}</div>}
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail; 