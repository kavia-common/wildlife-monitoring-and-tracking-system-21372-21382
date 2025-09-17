import React, { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

/**
 * PUBLIC_INTERFACE
 * NavBar - Wildlife-themed top navigation with icons, branding, quick actions, and offline badge.
 */
export default function NavBar() {
  const { isAuthenticated, role, user, logout } = useAuth();
  const navigate = useNavigate();

  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  useEffect(() => {
    const on = () => setIsOffline(false);
    const off = () => setIsOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  const navLinkClass = ({ isActive }) =>
    `px-3 py-2 rounded-md text-sm font-medium transition ${
      isActive
        ? "bg-primary text-white shadow"
        : "text-stone-700 hover:bg-stone-100"
    }`;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-white/90 backdrop-blur border-b border-stone-200 sticky top-0 z-30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2 group">
              {/* Simple bear/leaf logo */}
              <span className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-700 text-white flex items-center justify-center shadow-sm">
                🐻
              </span>
              <span className="font-semibold text-stone-900 tracking-tight">
                AnimalTrackr
              </span>
            </Link>

            {isAuthenticated && (
              <div className="hidden md:flex items-center gap-1">
                <NavLink to="/dashboard" className={navLinkClass}>
                  <span className="mr-1.5">📊</span> Dashboard
                </NavLink>
                <NavLink to="/animals" className={navLinkClass}>
                  <span className="mr-1.5">🐾</span> Animals
                </NavLink>
                <NavLink to="/devices" className={navLinkClass}>
                  <span className="mr-1.5">📡</span> Devices
                </NavLink>
                <NavLink to="/alerts" className={navLinkClass}>
                  <span className="mr-1.5">🚨</span> Alerts
                </NavLink>
                <NavLink to="/analytics" className={navLinkClass}>
                  <span className="mr-1.5">🧠</span> Analytics
                </NavLink>
                {role === "admin" && (
                  <NavLink to="/admin" className={navLinkClass}>
                    <span className="mr-1.5">⚙️</span> Admin
                  </NavLink>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Offline badge */}
            {isOffline && (
              <span
                className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-700"
                title="App is offline. Some features may not work."
              >
                ⛺ Offline
              </span>
            )}

            {!isAuthenticated ? (
              <>
                <Link
                  to="/login"
                  className="px-3 py-2 text-sm text-stone-700 hover:text-primary"
                >
                  Login
                </Link>
                <Link to="/register" className="btn text-sm">
                  Register
                </Link>
              </>
            ) : (
              <>
                {/* Quick actions */}
                <Link
                  to="/animals"
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-md border border-stone-300 bg-white px-2.5 py-1.5 text-xs text-stone-700 hover:bg-stone-50"
                  title="Add animal"
                >
                  ➕🐻 Add Animal
                </Link>
                <Link
                  to="/devices"
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-md border border-stone-300 bg-white px-2.5 py-1.5 text-xs text-stone-700 hover:bg-stone-50"
                  title="Register device"
                >
                  ➕📡 Add Device
                </Link>
                <Link
                  to="/alerts"
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-md border border-stone-300 bg-white px-2.5 py-1.5 text-xs text-stone-700 hover:bg-stone-50"
                  title="View alerts"
                >
                  🔔 Alerts
                </Link>

                <Link
                  to="/profile"
                  className="px-3 py-2 text-sm text-stone-700 hover:text-primary"
                >
                  {user?.name || "Profile"}{" "}
                  <span className="ml-2 text-xs bg-secondary/10 text-secondary px-2 py-0.5 rounded">
                    {role}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 text-sm text-stone-700 hover:text-error"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
