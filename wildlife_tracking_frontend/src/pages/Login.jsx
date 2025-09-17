import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

/**
 * PUBLIC_INTERFACE
 * Login page - integrates with backend API
 */
export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login({ email: form.email, password: form.password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="card p-6 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-1">Welcome back</h1>
        <p className="text-gray-600 mb-6">Sign in to AnimalTrackr</p>
        {error && <div className="mb-4 text-error text-sm">{error}</div>}
        <form className="space-y-3" onSubmit={handleSubmit}>
          <input className="w-full border rounded-md p-2" name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
          <input className="w-full border rounded-md p-2" name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required />
          <button className="btn w-full" type="submit" disabled={loading}>{loading ? "Signing in..." : "Login"}</button>
        </form>
        <div className="text-sm text-gray-600 mt-4">
          Don’t have an account? <Link to="/register" className="text-primary">Register</Link>
        </div>
      </div>
    </div>
  );
}
