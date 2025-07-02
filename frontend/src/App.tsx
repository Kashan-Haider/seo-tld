import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import CreateProject from './pages/projects/CreateProject';
import AuthCallback from './pages/auth/AuthCallback'; // make sure this path is correct
import VerifyEmail from './pages/auth/VerifyEmail';
import CheckEmail from './pages/auth/CheckEmail';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Dashboard from './pages/Dashboard';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Projects from './pages/projects/Projects';
import Opportunities from './pages/audit/Opportunities';
import Diagnostics from './pages/audit/Diagnostics';
import LongTailKeywords from './pages/LongTailKeywords';
import type { AuthContextType } from './typing';



// Authentication Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth Provider Component
const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const validateToken = async (token: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/validate-token', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.valid) {
          setUser({
            id: data.user_id,
            email: data.email,
            ...data.payload
          });
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.log('No token found in localStorage');
      return false;
    }

    // Clean the token (remove quotes if present)
    const cleanToken = token.replace(/^["']|["']$/g, '');
    console.log('Attempting to refresh token:', cleanToken.substring(0, 20) + '...');
    console.log('Token length:', cleanToken.length);
    console.log('Full token:', cleanToken);

    try {
      const response = await fetch('/api/auth/refresh-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ access_token: cleanToken })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('access_token', data.access_token);
        return await validateToken(data.access_token);
      }
      console.log('Refresh failed with status:', response.status);
      const errorText = await response.text();
      console.log('Error response:', errorText);
      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  };

  const login = (token: string) => {
    localStorage.setItem('access_token', token);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setIsAuthenticated(false);
    setUser(null);
  };

  // Initialize authentication state
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        const isValid = await validateToken(token);
        if (isValid) {
          setIsAuthenticated(true);
        } else {
          // Try to refresh the token
          const refreshSuccess = await refreshToken();
          if (!refreshSuccess) {
            logout();
          } else {
            setIsAuthenticated(true);
          }
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  // Set up token refresh interval
  useEffect(() => {
    if (!isAuthenticated) return;

    const refreshInterval = setInterval(async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        const isValid = await validateToken(token);
        if (!isValid) {
          const refreshSuccess = await refreshToken();
          if (!refreshSuccess) {
            logout();
          }
        }
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(refreshInterval);
  }, [isAuthenticated]);

  const value: AuthContextType = {
    isAuthenticated,
    user,
    loading,
    login,
    logout,
    refreshToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ProtectedLayout with enhanced authentication
const ProtectedLayout: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-blue">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  return isAuthenticated ? (
    <div className="h-screen w-full flex flex-col md:flex-row bg-dark-blue overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <Outlet />
        </main>
      </div>
    </div>
  ) : <Navigate to="/login" replace />;
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'linear-gradient(135deg, #0f1535 0%, #1e2a5a 100%)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(10px)',
            },
            success: {
              iconTheme: {
                primary: '#22d3ee',
                secondary: '#ffffff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#ffffff',
              },
            },
          }}
        />
        <Routes>
          {/* Public routes */}
          <Route path="/auth/callback" element={<AuthCallback />} />

          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/auth/verify" element={<VerifyEmail />} />
          <Route path="/check-email" element={<CheckEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          
          {/* Protected routes */}
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/create-project" element={<CreateProject />} />
            <Route path="/projects" element={<Projects/>} />
            <Route path="/long-tail-keywords" element={<LongTailKeywords />} />
            <Route path="/project/:id" element={<div>Project Details Page (Coming Soon)</div>} />
            <Route path="/audit/:auditId/opportunities" element={<Opportunities />} />
            <Route path="/audit/:auditId/diagnostics" element={<Diagnostics />} />
            {/* Add more protected routes here */}
          </Route>

          {/* Redirect root to Dashboard if not matched */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;