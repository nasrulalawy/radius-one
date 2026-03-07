import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { apiMe, apiLogout } from './api';
import Login from './pages/Login';
import Layout from './components/Layout';
import AppRoutes from './AppRoutes';

function PrivateRoute({ user, children }) {
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    apiMe()
      .then((u) => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await apiLogout();
    setUser(null);
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-slate-500">Memuat...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login onLogin={setUser} />} />
      {/* path="/*" = semua URL (/, /dashboard, /users-session/hotspot, dll) masuk Layout + AppRoutes. Jangan ada route path="*" di luar yang redirect ke dashboard. */}
      <Route path="/*" element={<PrivateRoute user={user}><Layout user={user} onLogout={handleLogout} /></PrivateRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<AppRoutes />} />
      </Route>
    </Routes>
  );
}
