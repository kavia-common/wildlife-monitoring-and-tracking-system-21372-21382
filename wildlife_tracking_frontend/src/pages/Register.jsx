import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

/**
 * PUBLIC_INTERFACE
 * Register page - placeholder
 */
export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", name: "", password: "" });

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: call signup API then redirect to login
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="card p-6 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-1">Create account</h1>
        <p className="text-gray-600 mb-6">Join AnimalTrackr</p>
        <form className="space-y-3" onSubmit={handleSubmit}>
          <input className="w-full border rounded-md p-2" name="name" placeholder="Full name" value={form.name} onChange={handleChange} required />
          <input className="w-full border rounded-md p-2" name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
          <input className="w-full border rounded-md p-2" name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required />
          <button className="btn w-full" type="submit">Register</button>
        </form>
        <div className="text-sm text-gray-600 mt-4">
          Already have an account? <Link to="/login" className="text-primary">Login</Link>
        </div>
      </div>
    </div>
  );
}
