import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

// Guards a route: requires login, and optionally a specific role.
// Usage: <ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>
const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner fullScreen />;

  if (!user) {
    if (role === 'admin') return <Navigate to="/admin/login" replace />;
    if (role === 'worker') return <Navigate to="/worker/login" replace />;
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
