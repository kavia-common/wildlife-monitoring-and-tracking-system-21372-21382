import React, { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import DeviceForm from "../components/forms/DeviceForm";
import { devicesApi, animalsApi } from "../services/api";

/**
 * PUBLIC_INTERFACE
 * Devices page - list/detail UI and CRUD hooks wired to backend APIs
 */
export default function Devices() {
  const [devices, setDevices] = useState([]);
  const [animals, setAnimals] = useState([]); // for assignment dropdown
  const [selectedId, setSelectedId] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState(null);

  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState("");

  const selected = useMemo(
    () => devices.find((d) => d.id === selectedId) || selectedDevice,
    [devices, selectedId, selectedDevice]
  );

  const loadDevices = async () => {
    setListLoading(true);
    setError("");
    try {
      const res = await devicesApi.list();
      const items = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : res?.items || [];
      setDevices(items);
      if (selectedId) {
        const match = items.find((d) => d.id === selectedId);
        if (match) setSelectedDevice(match);
      }
    } catch (e) {
      setError(e?.message || "Failed to load devices");
    } finally {
      setListLoading(false);
    }
  };

  const loadAnimals = async () => {
    try {
      const res = await animalsApi.list();
      const items = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : res?.items || [];
      setAnimals(items);
    } catch {
      // non-blocking: ignore failure
    }
  };

  useEffect(() => {
    loadDevices();
    loadAnimals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = async (id) => {
    setSelectedId(id);
    setLoading(true);
    setError("");
    try {
      const res = await devicesApi.detail(id);
      setSelectedDevice(res?.data || res);
    } catch (e) {
      setError(e?.message || "Failed to fetch device details");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (payload) => {
    setLoading(true);
    setError("");
    try {
      // Create device
      const created = await devicesApi.create({
        deviceId: payload.deviceId,
        model: payload.model,
        status: payload.status,
        // some backends accept animalId in create payload
        ...(payload.animalId ? { animalId: payload.animalId } : {}),
      });

      const createdId =
        created?.data?.id || created?.id || created?.data?.device?.id;

      // If assignment endpoint required and not supported in create, try to assign afterwards
      if (payload.animalId && createdId) {
        try {
          await devicesApi.assignToAnimal(createdId, payload.animalId);
        } catch {
          // ignore if backend already handled assignment
        }
      }

      await loadDevices();
    } catch (e) {
      setError(e?.message || "Failed to create device");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id, payload) => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      await devicesApi.update(id, {
        deviceId: payload.deviceId,
        model: payload.model,
        status: payload.status,
        // include animalId for backends that support direct update
        ...(payload.animalId !== undefined ? { animalId: payload.animalId || null } : {}),
      });

      // If backend needs explicit assign endpoint
      if (payload.animalId) {
        try {
          await devicesApi.assignToAnimal(id, payload.animalId);
        } catch {
          // ignore if not required
        }
      }

      await loadDevices();
    } catch (e) {
      setError(e?.message || "Failed to update device");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!id) return;
    if (!window.confirm("Delete this device?")) return;
    setLoading(true);
    setError("");
    try {
      await devicesApi.remove(id);
      setSelectedId(null);
      setSelectedDevice(null);
      await loadDevices();
    } catch (e) {
      setError(e?.message || "Failed to delete device");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Devices</h1>

        {error && <div className="text-error text-sm">{error}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Devices List</h3>
              <button
                className="text-sm text-primary"
                onClick={loadDevices}
                disabled={listLoading}
              >
                {listLoading ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            {listLoading ? (
              <div className="text-gray-600">Loading...</div>
            ) : devices.length === 0 ? (
              <div className="text-gray-600">No devices found.</div>
            ) : (
              <ul className="divide-y">
                {devices.map((d) => (
                  <li
                    key={d.id || d.deviceId}
                    className={`py-2 flex items-center justify-between ${
                      selectedId === d.id ? "bg-blue-50/50" : ""
                    }`}
                  >
                    <button
                      className="text-left flex-1 px-2"
                      onClick={() => handleSelect(d.id)}
                      title="View details"
                    >
                      <div className="font-medium">
                        {d.deviceId || "Unnamed Device"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {d.model || "—"} • Status: {d.status || "—"}
                        {d.animalId
                          ? ` • Assigned to #${d.animalId}`
                          : " • Unassigned"}
                      </div>
                    </button>
                    <div className="flex items-center gap-2 pr-2">
                      <button
                        className="text-sm text-error hover:underline"
                        onClick={() => handleDelete(d.id)}
                        disabled={loading}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {/* Detail panel */}
            {selected && (
              <div className="mt-4 border-t pt-4">
                <h4 className="font-semibold mb-2">Details</h4>
                <div className="text-sm text-gray-700">
                  <div>
                    <span className="font-medium">ID:</span>{" "}
                    {selected.id || "—"}
                  </div>
                  <div>
                    <span className="font-medium">Device ID:</span>{" "}
                    {selected.deviceId || "—"}
                  </div>
                  <div>
                    <span className="font-medium">Model:</span>{" "}
                    {selected.model || "—"}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>{" "}
                    {selected.status || "—"}
                  </div>
                  <div>
                    <span className="font-medium">Assigned Animal:</span>{" "}
                    {selected.animalId ? `#${selected.animalId}` : "—"}
                  </div>
                </div>
                <div className="mt-3">
                  <DeviceForm
                    initialData={selected}
                    animals={animals}
                    onSubmit={(data) => handleUpdate(selected.id, data)}
                    submitLabel="Update"
                    busy={loading}
                  />
                </div>
              </div>
            )}
          </div>

          <DeviceForm onSubmit={handleCreate} animals={animals} busy={loading} />
        </div>
      </div>
    </Layout>
  );
}
