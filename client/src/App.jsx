import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AdminPanel from './components/AdminPanel';
import EmployeePortal from './components/EmployeePortal';

const Login = () => {
  const { loginWithGoogle, user } = useAuth();
  const [error, setError] = useState('');

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLogin = async () => {
    try {
      setError('');
      await loginWithGoogle();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      <div className="orb orb-3"></div>

      <div className="glass-card w-full max-w-md text-center relative z-10" style={{ animation: 'fadeInUp 0.6s ease-out' }}>
        {/* Logo / Brand */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6"
               style={{
                 background: 'linear-gradient(135deg, #6366f1, #a78bfa)',
                 boxShadow: '0 8px 30px rgba(99, 102, 241, 0.4)'
               }}>
            <span className="text-3xl font-bold text-white" style={{ fontFamily: 'Open Sans' }}>S</span>
          </div>
          <h1 className="text-4xl font-bold mb-2 gradient-text">SCOT 360°</h1>
          <p className="text-sm" style={{ color: 'rgba(196, 181, 253, 0.7)' }}>
            Employee Performance Evaluation System
          </p>
        </div>

        <hr className="section-divider" />

        <p className="mb-8 text-sm" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
          Sign in with your <span className="font-semibold" style={{ color: '#a78bfa' }}>@scot.lk</span> email to continue
        </p>
        
        {error && (
          <div className="error-box mb-6">
            {error}
          </div>
        )}
        
        <button onClick={handleLogin} className="btn-primary w-full py-3.5 text-base flex items-center justify-center gap-3">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#fff"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff" opacity="0.8"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#fff" opacity="0.6"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff" opacity="0.9"/>
          </svg>
          Sign In with Google
        </button>

        <p className="mt-6 text-xs" style={{ color: 'rgba(255, 255, 255, 0.3)' }}>
          Protected by Firebase Authentication
        </p>
      </div>
    </div>
  );
};

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, userData, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center loading-text">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
             style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.15))', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#a78bfa', borderTopColor: 'transparent' }}></div>
        </div>
        <p className="font-semibold" style={{ color: '#a78bfa' }}>Loading...</p>
      </div>
    </div>
  );

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && userData && !allowedRoles.includes(userData.role?.toLowerCase())) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-card text-center max-w-md">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-xl font-bold mb-2">Unauthorized Access</h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.5)' }}>You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return children;
};

const DashboardRouter = () => {
  const { userData, logout } = useAuth();
  
  if (!userData) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center loading-text">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: '#a78bfa', borderTopColor: 'transparent' }}></div>
        <p className="font-semibold" style={{ color: '#a78bfa' }}>Loading user data...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Decorative Orbs */}
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>

      {/* Header */}
      <header className="glass-header px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
               style={{
                 background: 'linear-gradient(135deg, #6366f1, #a78bfa)',
                 boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)'
               }}>
            <span className="text-sm font-bold text-white">S</span>
          </div>
          <h1 className="text-xl font-bold gradient-text m-0">SCOT 360°</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                 style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(139, 92, 246, 0.2))', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
              {(userData.name || userData.email || '?')[0].toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>{userData.name || userData.email}</span>
              <span className="text-xs capitalize" style={{ color: 'rgba(167, 139, 250, 0.7)' }}>{userData.role}</span>
            </div>
          </div>
          <button onClick={logout} className="btn-secondary py-2 px-4 text-xs">
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full relative z-10">
        {userData.role?.toLowerCase() === 'admin' && <AdminPanel />}
        {userData.role?.toLowerCase() === 'management' && <ManagementDashboard />}
        {(userData.role?.toLowerCase() === 'employee' || !userData.role) && <EmployeePortal />}
      </main>
    </div>
  );
};



const ManagementDashboard = () => (
  <div className="glass-card">
    <h2 className="mb-4 gradient-text">Management Dashboard</h2>
    <hr className="section-divider" />
    <p style={{ color: 'rgba(255, 255, 255, 0.5)' }}>View organizational scores and metrics.</p>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardRouter />
              </ProtectedRoute>
            } 
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
