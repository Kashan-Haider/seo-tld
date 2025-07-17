import React, { useState, useEffect, createContext, useContext, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
// Replace static imports with React.lazy for pages
const Login = React.lazy(() => import('./pages/auth/Login'));
const Signup = React.lazy(() => import('./pages/auth/Signup'));
const CreateProject = React.lazy(() => import('./pages/projects/CreateProject'));
const AuthCallback = React.lazy(() => import('./pages/auth/AuthCallback'));
const VerifyEmail = React.lazy(() => import('./pages/auth/VerifyEmail'));
const CheckEmail = React.lazy(() => import('./pages/auth/CheckEmail'));
const ForgotPassword = React.lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = React.lazy(() => import('./pages/auth/ResetPassword'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Projects = React.lazy(() => import('./pages/projects/Projects'));
const Opportunities = React.lazy(() => import('./pages/audit/Opportunities'));
const Diagnostics = React.lazy(() => import('./pages/audit/Diagnostics'));
const GenerateKeywords = React.lazy(() => import('./pages/GenerateKeywords'));
const SavedKeywords = React.lazy(() => import('./pages/SavedKeywords'));
const CompetitorAnalysis = React.lazy(() => import('./pages/CompetitorAnalysis'));
const SavedAnalyses = React.lazy(() => import('./pages/SavedAnalyses'));
const Billing = React.lazy(() => import('./pages/Billing'));
const Profile = React.lazy(() => import('./pages/Profile'));
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

  // Helper to fetch user profile from backend
  const fetchUserProfile = async (token: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data);
        return data;
      } else {
        setUser(null);
        return null;
      }
    } catch (error) {
      setUser(null);
      return null;
    }
  };

  const validateToken = async (token: string): Promise<boolean> => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/validate-token`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.valid) {
          // Fetch full user profile after token validation
          await fetchUserProfile(token);
          return true;
        }
      }
      setUser(null);
      return false;
    } catch (error) {
      setUser(null);
      console.error('Token validation error:', error);
      return false;
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    // Try to use refresh_token from localStorage if available
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      console.log('No refresh token found in localStorage');
      return false;
    }
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refresh_token: refreshToken })
      });
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
        // Fetch user profile after refreshing token
        await fetchUserProfile(data.access_token);
        return await validateToken(data.access_token);
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  // Accept both tokens, store both
  const login = async (accessToken: string, refreshToken?: string) => {
    localStorage.setItem('access_token', accessToken);
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
    }
    setIsAuthenticated(true);
    await fetchUserProfile(accessToken);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
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
      <div className="flex-1 min-h-screen flex flex-col overflow-hidden">
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
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-dark-blue text-white text-lg">Loading...</div>}>
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
              <Route path="/projects" element={<Projects />} />
              <Route path="/generate-keywords" element={<GenerateKeywords />} />
              <Route path="/saved-keywords" element={<SavedKeywords />} />
              <Route path="/competitor-analysis" element={<CompetitorAnalysis />} />
              <Route path="/saved-analyses" element={<SavedAnalyses />} />
              <Route path="/project/:id" element={<div>Project Details Page (Coming Soon)</div>} />
              <Route path="/audit/:auditId/opportunities" element={<Opportunities />} />
              <Route path="/audit/:auditId/diagnostics" element={<Diagnostics />} />
              <Route path="/billing" element={<Billing />} />
              <Route path="/profile" element={<Profile />} />
              {/* Add more protected routes here */}
            </Route>
            {/* Redirect root to Dashboard if not matched */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
};

export default App;