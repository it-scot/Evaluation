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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="card w-full max-w-md">
        <h2 className="mb-6 text-center text-4xl font-serif">SCOT 360°</h2>
        <p className="text-gray-600 mb-8 text-center">Sign in with your @scot.lk email</p>
        
        {error && (
          <div className="bg-red-50 text-red-700 p-3 mb-4 text-sm border border-red-200">
            {error}
          </div>
        )}
        
        <button onClick={handleLogin} className="btn-primary w-full py-3">
          Sign In with Google
        </button>
      </div>
    </div>
  );
};

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, userData, loading } = useAuth();

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && userData && !allowedRoles.includes(userData.role?.toLowerCase())) {
    return <div className="p-8 text-center text-red-600">Unauthorized Access</div>;
  }

  return children;
};

const DashboardRouter = () => {
  const { userData, logout } = useAuth();
  
  if (!userData) return <div className="p-8 text-center">Loading user data...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-serif m-0">SCOT 360°</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{userData.name || userData.email} ({userData.role})</span>
          <button onClick={logout} className="btn-secondary py-1 px-4 text-xs">Logout</button>
        </div>
      </header>
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {userData.role?.toLowerCase() === 'admin' && <AdminPanel />}
        {userData.role?.toLowerCase() === 'management' && <ManagementDashboard />}
        {(userData.role?.toLowerCase() === 'employee' || !userData.role) && <EmployeePortal />}
      </main>
    </div>
  );
};



const ManagementDashboard = () => (
  <div>
    <h2 className="mb-6">Management Dashboard</h2>
    <p>View organizational scores and metrics.</p>
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
