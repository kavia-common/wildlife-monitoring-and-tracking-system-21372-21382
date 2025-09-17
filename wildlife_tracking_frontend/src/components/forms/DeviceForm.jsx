import React, { useState } from "react";

/**
 * PUBLIC_INTERFACE
 * DeviceForm - Placeholder CRUD form for GPS devices
 */
export default function DeviceForm({ onSubmit }) {
  const [form, setForm] = useState({ deviceId: "", model: "", status: "active" });

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.(form);
  };

  return (
    <form onSubmit={handleSubmit} className="card p-4 space-y-3">
      <h3 className="text-lg font-semibold">Device</h3>
      <input className="w-full border rounded-md p-2" name="deviceId" placeholder="Device ID" value={form.deviceId} onChange={handleChange} />
      <input className="w-full border rounded-md p-2" name="model" placeholder="Model" value={form.model} onChange={handleChange} />
      <select className="w-full border rounded-md p-2" name="status" value={form.status} onChange={handleChange}>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
        <option value="maintenance">Maintenance</option>
      </select>
      <button className="btn" type="submit">Save</button>
    </form>
  );
}
