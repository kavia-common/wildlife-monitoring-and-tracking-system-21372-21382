import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

/**
 * PUBLIC_INTERFACE
 * Login page - fake auth for now with role choice
 */
export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  const [form, setForm] = useState({ email: "", password: "", role: "researcher" });
  const [error, setError] = useState("");

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await login({ email: form.email, password: form.password, selectedRole: form.role });
      navigate(from, { replace: true });
    } catch (err) {
      setError("Login failed");
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
          <select className="w-full border rounded-md p-2" name="role" value={form.role} onChange={handleChange}>
            <option value="researcher">Researcher</option>
            <option value="admin">Admin</option>
          </select>
          <button className="btn w-full" type="submit">Login</button>
        </form>
        <div className="text-sm text-gray-600 mt-4">
          Don’t have an account? <Link to="/register" className="text-primary">Register</Link>
        </div>
      </div>
    </div>
  );
}
