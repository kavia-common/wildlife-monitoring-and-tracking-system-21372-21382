import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";

import Dashboard from "./pages/Dashboard";
import Animals from "./pages/Animals";
import Devices from "./pages/Devices";
import Alerts from "./pages/Alerts";
import Analytics from "./pages/Analytics";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Register from "./pages/Register";

import "./index.css";

/**
 * PUBLIC_INTERFACE
 * App - Application entry with Router and AuthProvider
 */
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected (any authenticated user) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/animals" element={<Animals />} />
            <Route path="/devices" element={<Devices />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Admin only */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<Admin />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
