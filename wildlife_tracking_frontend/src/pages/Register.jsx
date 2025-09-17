import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

/**
 * PUBLIC_INTERFACE
 * Register page - integrates with backend API
 */
export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ email: "", name: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register({ name: form.name, email: form.email, password: form.password });
      navigate("/login");
    } catch (err) {
      setError(err?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="card p-6 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">Create account <span className="text-xl">🐻</span></h1>
        <p className="text-gray-600 mb-6">Join AnimalTrackr</p>
        {error && <div className="mb-4 text-error text-sm">{error}</div>}
        <form className="space-y-3" onSubmit={handleSubmit}>
          <input className="w-full border rounded-md p-2" name="name" placeholder="Full name" value={form.name} onChange={handleChange} required />
          <input className="w-full border rounded-md p-2" name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
          <input className="w-full border rounded-md p-2" name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required />
          <button className="btn w-full" type="submit" disabled={loading}>{loading ? "Creating account..." : "Register"}</button>
        </form>
        <div className="text-sm text-gray-600 mt-4">
          Already have an account? <Link to="/login" className="text-primary">Login</Link>
        </div>
      </div>
    </div>
  );
}
