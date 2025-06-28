import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../App';

const Signup: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, message: '' });
  const navigate = useNavigate();
  const { user } = useAuth();

  const checkPasswordStrength = (password: string) => {
    let score = 0;
    let message = '';

    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    switch (score) {
      case 0:
      case 1:
        message = 'Very weak';
        break;
      case 2:
        message = 'Weak';
        break;
      case 3:
        message = 'Fair';
        break;
      case 4:
        message = 'Good';
        break;
      case 5:
        message = 'Strong';
        break;
    }

    return { score, message };
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setPasswordStrength(checkPasswordStrength(newPassword));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate password match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password strength
    if (passwordStrength.score < 3) {
      setError('Password is too weak. Please choose a stronger password.');
      setLoading(false);
      return;
    }
    
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username, 
          email, 
          password, 
          full_name: fullName 
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.detail || 'Signup failed');
      }
      
      // login(data.access_token);
      // navigate('/dashboard');
      navigate('/check-email');
      
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
      // Redirect to Google OAuth endpoint
      window.location.href = '/api/auth/google-login';
    } catch (err: any) {
      setError('Google signup failed. Please try again.');
      setGoogleLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    switch (passwordStrength.score) {
      case 0:
      case 1:
        return 'bg-red-500';
      case 2:
        return 'bg-orange-500';
      case 3:
        return 'bg-yellow-500';
      case 4:
        return 'bg-blue-500';
      case 5:
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-blue p-4">
      <div className="bg-medium-blue p-8 rounded-lg shadow-lg w-full max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
          <p className="text-light-gray">Join us and get started</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/20 border border-red-500/50 rounded text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-light-gray mb-2 text-sm font-medium">
              Full Name
            </label>
            <input 
              type="text" 
              value={fullName} 
              onChange={e => setFullName(e.target.value)} 
              className="w-full p-3 rounded-lg bg-dark-blue text-white border border-light-gray/20 focus:border-accent-blue focus:outline-none transition-colors" 
              placeholder="Enter your full name"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-light-gray mb-2 text-sm font-medium">
              Username
            </label>
            <input 
              type="text" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              required 
              className="w-full p-3 rounded-lg bg-dark-blue text-white border border-light-gray/20 focus:border-accent-blue focus:outline-none transition-colors" 
              placeholder="Choose a username"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-light-gray mb-2 text-sm font-medium">
              Email Address
            </label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
              className="w-full p-3 rounded-lg bg-dark-blue text-white border border-light-gray/20 focus:border-accent-blue focus:outline-none transition-colors" 
              placeholder="Enter your email"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-light-gray mb-2 text-sm font-medium">
              Password
            </label>
            <input 
              type="password" 
              value={password} 
              onChange={handlePasswordChange} 
              required 
              className="w-full p-3 rounded-lg bg-dark-blue text-white border border-light-gray/20 focus:border-accent-blue focus:outline-none transition-colors" 
              placeholder="Create a password"
              disabled={loading}
            />
            {password && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded ${
                        level <= passwordStrength.score ? getPasswordStrengthColor() : 'bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
                <p className={`text-xs ${
                  passwordStrength.score >= 4 ? 'text-green-400' : 
                  passwordStrength.score >= 3 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  Password strength: {passwordStrength.message}
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-light-gray mb-2 text-sm font-medium">
              Confirm Password
            </label>
            <input 
              type="password" 
              value={confirmPassword} 
              onChange={e => setConfirmPassword(e.target.value)} 
              required 
              className="w-full p-3 rounded-lg bg-dark-blue text-white border border-light-gray/20 focus:border-accent-blue focus:outline-none transition-colors" 
              placeholder="Confirm your password"
              disabled={loading}
            />
            {confirmPassword && password !== confirmPassword && (
              <p className="mt-1 text-xs text-red-400">Passwords do not match</p>
            )}
          </div>

          <button 
            type="submit" 
            disabled={loading || googleLoading || password !== confirmPassword || passwordStrength.score < 3}
            className="w-full bg-accent-blue cursor-pointer text-white py-3 rounded-lg hover:bg-light-purple transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6">
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
            className="mt-4 w-full flex cursor-pointer items-center justify-center gap-3 bg-white text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
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

        <div className="mt-8 text-center">
          <p className="text-light-gray text-sm">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-accent-blue hover:underline font-medium cursor-pointer"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup; 