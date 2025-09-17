import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

/**
 * PUBLIC_INTERFACE
 * NavBar - Top navigation with role-based placeholders and auth actions.
 */
export default function NavBar() {
  const { isAuthenticated, role, user, logout } = useAuth();
  const navigate = useNavigate();

  const navLinkClass = ({ isActive }) =>
    `px-3 py-2 rounded-md text-sm font-medium ${
      isActive ? "bg-primary text-white" : "text-gray-700 hover:bg-gray-100"
    }`;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link to="/" className="flex items-center space-x-2">
              <span className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                AT
              </span>
              <span className="font-semibold text-gray-900">AnimalTrackr</span>
            </Link>
            {isAuthenticated && (
              <div className="hidden md:flex items-center space-x-1">
                <NavLink to="/dashboard" className={navLinkClass}>Dashboard</NavLink>
                <NavLink to="/animals" className={navLinkClass}>Animals</NavLink>
                <NavLink to="/devices" className={navLinkClass}>Devices</NavLink>
                <NavLink to="/alerts" className={navLinkClass}>Alerts</NavLink>
                <NavLink to="/analytics" className={navLinkClass}>Analytics</NavLink>
                {role === "admin" && (
                  <NavLink to="/admin" className={navLinkClass}>Admin</NavLink>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {!isAuthenticated ? (
              <>
                <Link to="/login" className="px-3 py-2 text-sm text-gray-700 hover:text-primary">Login</Link>
                <Link to="/register" className="btn text-sm">Register</Link>
              </>
            ) : (
              <>
                <Link to="/profile" className="px-3 py-2 text-sm text-gray-700 hover:text-primary">
                  {user?.name || "Profile"} <span className="ml-2 text-xs bg-secondary/10 text-secondary px-2 py-0.5 rounded">{role}</span>
                </Link>
                <button onClick={handleLogout} className="px-3 py-2 text-sm text-gray-700 hover:text-error">
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
