import React, { useEffect, useState } from "react";

/**
 * PUBLIC_INTERFACE
 * AnimalForm - Create/Update animal form
 * Props:
 * - initialData?: { id?, name, species, tagId }
 * - onSubmit: (payload) => void | Promise<void>
 * - submitLabel?: string
 * - busy?: boolean
 */
export default function AnimalForm({ initialData, onSubmit, submitLabel = "Save", busy = false }) {
  const [form, setForm] = useState({ name: "", species: "", tagId: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || "",
        species: initialData.species || "",
        tagId: initialData.tagId || "",
      });
    }
  }, [initialData]);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name || !form.species) {
      setError("Name and species are required");
      return;
    }
    try {
      await onSubmit?.(form);
      if (!initialData) {
        // clear only for create form
        setForm({ name: "", species: "", tagId: "" });
      }
    } catch (err) {
      setError(err?.message || "Failed to save");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card p-4 space-y-3">
      <h3 className="text-lg font-semibold">{initialData ? "Edit Animal" : "New Animal"}</h3>
      {error && <div className="text-error text-sm">{error}</div>}
      <input
        className="w-full border rounded-md p-2"
        name="name"
        placeholder="Name"
        value={form.name}
        onChange={handleChange}
        required
      />
      <input
        className="w-full border rounded-md p-2"
        name="species"
        placeholder="Species"
        value={form.species}
        onChange={handleChange}
        required
      />
      <input
        className="w-full border rounded-md p-2"
        name="tagId"
        placeholder="Tag/Collar ID"
        value={form.tagId}
        onChange={handleChange}
      />
      <button className="btn" type="submit" disabled={busy}>
        {busy ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
