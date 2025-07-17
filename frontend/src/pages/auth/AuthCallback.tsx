import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../App';

const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const processAuth = async () => {
      try {
        console.log('Processing auth callback...');
        console.log('Search params:', Object.fromEntries(searchParams.entries()));
        
        const token = searchParams.get('token');
        const refreshToken = searchParams.get('refresh_token');
        const errorParam = searchParams.get('error');
        const errorMessage = searchParams.get('message');
        
        if (errorParam) {
          console.error('Auth error from backend:', errorParam, errorMessage);
          setError(`Authentication failed: ${errorParam}${errorMessage ? ` - ${errorMessage}` : ''}`);
          setIsProcessing(false);
          return;
        }
        
        if (token && refreshToken) {
          console.log('Tokens received, logging in...');
          // Validate token format
          if (token.split('.').length !== 3 || refreshToken.length < 10) {
            console.error('Invalid token or refresh token format');
            setError('Invalid token or refresh token format received');
            setIsProcessing(false);
            return;
          }
          // Store both tokens and redirect to dashboard
          await login(token, refreshToken);
          console.log('Login successful, redirecting to home...');
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 100);
        } else if (token) {
          // Fallback: only access token present (legacy)
          if (token.split('.').length !== 3) {
            setError('Invalid token format received');
            setIsProcessing(false);
            return;
          }
          await login(token);
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 100);
        } else {
          console.error('No token found in URL params');
          setError('No access token received from authentication provider');
          setIsProcessing(false);
        }
      } catch (err) {
        console.error('Auth callback processing error:', err);
        setError('An unexpected error occurred during authentication');
        setIsProcessing(false);
      }
    };

    processAuth();
  }, [searchParams, login, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-blue p-4">
        <div className="bg-medium-blue p-8 rounded-lg shadow-lg w-full max-w-md text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Authentication Error</h2>
          <p className="text-light-gray mb-6">{error}</p>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="bg-accent-blue text-white px-6 py-2 rounded-lg hover:bg-light-purple transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-blue p-4">
        <div className="bg-medium-blue p-8 rounded-lg shadow-lg w-full max-w-md text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Authenticating...</h2>
          <p className="text-light-gray mb-6">Please wait while we complete your authentication.</p>
          <div className="mt-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-blue mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default AuthCallback;