import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { isAdminRole } from '../../constants/authRoles';

/** Solo usuarios con rol administrador (p. ej. pantalla de API Key y apariencia). */
const AdminRoute = ({ children }) => {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (!isAdminRole(role)) {
    return <Navigate to="/" replace />;
  }
  return children;
};

export default AdminRoute;
