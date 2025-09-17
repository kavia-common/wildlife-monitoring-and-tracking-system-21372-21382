import React, { useEffect, useState } from "react";

/**
 * PUBLIC_INTERFACE
 * DeviceForm - Create/Update GPS device form with optional animal assignment
 * Props:
 * - initialData?: { id?, deviceId, model, status, animalId? }
 * - onSubmit: (payload) => Promise<void> | void
 * - submitLabel?: string
 * - busy?: boolean
 * - animals?: Array<{ id, name, species }>
 */
export default function DeviceForm({
  initialData,
  onSubmit,
  submitLabel = "Save",
  busy = false,
  animals = [],
}) {
  const [form, setForm] = useState({
    deviceId: "",
    model: "",
    status: "active",
    animalId: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialData) {
      setForm({
        deviceId: initialData.deviceId || "",
        model: initialData.model || "",
        status: initialData.status || "active",
        animalId: initialData.animalId || "",
      });
    }
  }, [initialData]);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.deviceId) {
      setError("Device ID is required");
      return;
    }
    try {
      await onSubmit?.(form);
      if (!initialData) {
        setForm({ deviceId: "", model: "", status: "active", animalId: "" });
      }
    } catch (err) {
      setError(err?.message || "Failed to save");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card p-4 space-y-3">
      <h3 className="text-lg font-semibold">
        {initialData ? "Edit Device" : "New Device"}
      </h3>
      {error && <div className="text-error text-sm">{error}</div>}
      <input
        className="w-full border rounded-md p-2"
        name="deviceId"
        placeholder="Device ID"
        value={form.deviceId}
        onChange={handleChange}
        required
      />
      <input
        className="w-full border rounded-md p-2"
        name="model"
        placeholder="Model"
        value={form.model}
        onChange={handleChange}
      />
      <select
        className="w-full border rounded-md p-2"
        name="status"
        value={form.status}
        onChange={handleChange}
      >
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
        <option value="maintenance">Maintenance</option>
      </select>

      {/* Optional assignment to animal */}
      <div>
        <label className="block text-sm text-gray-600 mb-1">
          Assign to Animal (optional)
        </label>
        <select
          className="w-full border rounded-md p-2"
          name="animalId"
          value={form.animalId}
          onChange={handleChange}
        >
          <option value="">— Unassigned —</option>
          {animals.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name || "Unnamed"} {a.species ? `(${a.species})` : ""}
            </option>
          ))}
        </select>
      </div>

      <button className="btn" type="submit" disabled={busy}>
        {busy ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
