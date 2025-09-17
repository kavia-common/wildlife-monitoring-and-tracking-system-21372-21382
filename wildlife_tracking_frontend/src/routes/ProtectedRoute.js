import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

/**
 * PUBLIC_INTERFACE
 * ProtectedRoute
 * Guards nested routes by authentication state and optional allowed roles.
 *
 * Props:
 * - allowedRoles?: string[]  // if provided, user role must be included
 */
export default function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
