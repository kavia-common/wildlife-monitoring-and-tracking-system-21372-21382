import React, { useState } from "react";

/**
 * PUBLIC_INTERFACE
 * AnimalForm - Placeholder CRUD form for animals
 */
export default function AnimalForm({ onSubmit }) {
  const [form, setForm] = useState({ name: "", species: "", tagId: "" });

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.(form);
  };

  return (
    <form onSubmit={handleSubmit} className="card p-4 space-y-3">
      <h3 className="text-lg font-semibold">Animal</h3>
      <input className="w-full border rounded-md p-2" name="name" placeholder="Name" value={form.name} onChange={handleChange} />
      <input className="w-full border rounded-md p-2" name="species" placeholder="Species" value={form.species} onChange={handleChange} />
      <input className="w-full border rounded-md p-2" name="tagId" placeholder="Tag/Collar ID" value={form.tagId} onChange={handleChange} />
      <button className="btn" type="submit">Save</button>
    </form>
  );
}
