import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

/**
 * PUBLIC_INTERFACE
 * useAuth - Hook to access Auth context
 * Provides: user, role, token, login, logout, isAuthenticated
 */
const AuthContext = createContext(null);

// PUBLIC_INTERFACE
export function useAuth() {
  /** Hook to access authentication state and actions. */
  return useContext(AuthContext);
}

/**
 * PUBLIC_INTERFACE
 * AuthProvider - Context provider to manage JWT/localStorage auth state.
 */
export function AuthProvider({ children }) {
  /**
   * This AuthProvider stores a simple token and role in localStorage to simulate
   * authentication flows. Replace login() with a real API call later.
   */
  const [token, setToken] = useState(() => localStorage.getItem("at_token"));
  const [role, setRole] = useState(() => localStorage.getItem("at_role") || "guest");
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("at_user");
    return raw ? JSON.parse(raw) : null;
  });

  useEffect(() => {
    if (token) localStorage.setItem("at_token", token);
    else localStorage.removeItem("at_token");
  }, [token]);

  useEffect(() => {
    if (role) localStorage.setItem("at_role", role);
    else localStorage.removeItem("at_role");
  }, [role]);

  useEffect(() => {
    if (user) localStorage.setItem("at_user", JSON.stringify(user));
    else localStorage.removeItem("at_user");
  }, [user]);

  // PUBLIC_INTERFACE
  const login = async ({ email, password, selectedRole = "researcher" }) => {
    /**
     * Basic fake login for now: accept any email/password,
     * set dummy token and role, and store a minimal user object.
     * Replace with backend API integration.
     */
    const fakeToken = "demo-token";
    setToken(fakeToken);
    setRole(selectedRole);
    setUser({ id: "demo", email, name: "Demo User", role: selectedRole });
    return true;
  };

  // PUBLIC_INTERFACE
  const logout = () => {
    setToken(null);
    setRole("guest");
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      role,
      token,
      isAuthenticated: Boolean(token),
      login,
      logout,
    }),
    [user, role, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
