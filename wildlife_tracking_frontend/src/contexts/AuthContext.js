import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiGet, apiPost } from "../services/api";

/**
 * PUBLIC_INTERFACE
 * useAuth - Hook to access Auth context
 * Provides: user, role, token, login, register, logout, isAuthenticated
 */
const AuthContext = createContext(null);

// Decode JWT payload without verifying signature (frontend only)
function decodeJwt(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

// PUBLIC_INTERFACE
export function useAuth() {
  /** Hook to access authentication state and actions. */
  return useContext(AuthContext);
}

/**
 * PUBLIC_INTERFACE
 * AuthProvider - Context provider to manage JWT/localStorage auth state.
 * Persists: token (at_token), user object (at_user), role (at_role)
 */
export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("at_token"));
  const [role, setRole] = useState(() => localStorage.getItem("at_role") || "guest");
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("at_user");
    return raw ? JSON.parse(raw) : null;
  });
  const isAuthenticated = Boolean(token);

  // Persist changes
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

  // Refresh role/user from token if available at boot
  useEffect(() => {
    if (!token) return;
    const payload = decodeJwt(token);
    if (payload) {
      const derivedRole = payload.role || payload.roles?.[0] || "researcher";
      setRole(derivedRole);
      // Prefer payload claims for user fields
      const mergedUser = {
        id: payload.sub || payload.user_id || user?.id,
        email: payload.email || user?.email,
        name: payload.name || user?.name,
        role: derivedRole,
        ...user,
      };
      setUser(mergedUser);
    }
    // Optionally fetch profile if backend provides it
    // ignore errors: token may not be valid yet or endpoint may not exist
    (async () => {
      try {
        const profile = await apiGet("/auth/me");
        if (profile) {
          setUser((prev) => ({ ...(prev || {}), ...profile, role: profile.role || role }));
          if (profile.role) setRole(profile.role);
        }
      } catch {
        // noop
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // only run on mount

  /**
   * PUBLIC_INTERFACE
   * login - Authenticate with backend and persist JWT, user, and role.
   */
  const login = async ({ email, password }) => {
    const data = await apiPost("/auth/login", { email, password });
    // Accept common response formats:
    // { token, access_token, user, role } or nested { data: { ... } }
    const payload = data?.data || data;
    const jwt = payload?.token || payload?.access_token;
    if (!jwt) {
      throw new Error("Missing token in login response");
    }
    setToken(jwt);
    const decoded = decodeJwt(jwt) || {};
    const resolvedRole = payload?.role || decoded.role || decoded.roles?.[0] || payload?.user?.role || "researcher";
    setRole(resolvedRole);

    const userObj =
      payload?.user || {
        id: decoded.sub || decoded.user_id,
        email: decoded.email || email,
        name: decoded.name || "",
        role: resolvedRole,
      };
    setUser({ ...userObj, role: resolvedRole });
    return true;
  };

  /**
   * PUBLIC_INTERFACE
   * register - Create new account via backend.
   */
  const register = async ({ name, email, password }) => {
    // typical register payload; adapt as needed
    await apiPost("/auth/register", { name, email, password });
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
      isAuthenticated,
      login,
      register,
      logout,
    }),
    [user, role, token, isAuthenticated]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
