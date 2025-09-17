import React, { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import AnimalForm from "../components/forms/AnimalForm";
import { animalsApi } from "../services/api";

/**
 * PUBLIC_INTERFACE
 * Animals page - list/detail with CRUD wired to backend APIs
 */
export default function Animals() {
  const [animals, setAnimals] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState("");

  const selected = useMemo(
    () => animals.find((a) => a.id === selectedId) || selectedAnimal,
    [animals, selectedId, selectedAnimal]
  );

  const loadAnimals = async () => {
    setListLoading(true);
    setError("");
    try {
      const res = await animalsApi.list();
      // normalize common response shapes
      const items = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : res?.items || [];
      setAnimals(items);
      // sync selected item if exists
      if (selectedId) {
        const match = items.find((a) => a.id === selectedId);
        if (match) setSelectedAnimal(match);
      }
    } catch (e) {
      setError(e?.message || "Failed to load animals");
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    loadAnimals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = async (id) => {
    setSelectedId(id);
    setLoading(true);
    setError("");
    try {
      const res = await animalsApi.detail(id);
      setSelectedAnimal(res?.data || res);
    } catch (e) {
      setError(e?.message || "Failed to fetch details");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (payload) => {
    setLoading(true);
    setError("");
    try {
      await animalsApi.create(payload);
      await loadAnimals();
    } catch (e) {
      setError(e?.message || "Failed to create animal");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id, payload) => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      await animalsApi.update(id, payload);
      await loadAnimals();
    } catch (e) {
      setError(e?.message || "Failed to update animal");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!id) return;
    if (!window.confirm("Delete this animal?")) return;
    setLoading(true);
    setError("");
    try {
      await animalsApi.remove(id);
      setSelectedId(null);
      setSelectedAnimal(null);
      await loadAnimals();
    } catch (e) {
      setError(e?.message || "Failed to delete animal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Animals</h1>

        {error && <div className="text-error text-sm">{error}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Animals List</h3>
              <button className="text-sm text-primary" onClick={loadAnimals} disabled={listLoading}>
                {listLoading ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            {listLoading ? (
              <div className="text-gray-600">Loading...</div>
            ) : animals.length === 0 ? (
              <div className="text-gray-600">No animals found.</div>
            ) : (
              <ul className="divide-y">
                {animals.map((a) => (
                  <li
                    key={a.id || a.tagId || a.name}
                    className={`py-2 flex items-center justify-between ${selectedId === a.id ? "bg-blue-50/50" : ""}`}
                  >
                    <button
                      className="text-left flex-1 px-2"
                      onClick={() => handleSelect(a.id)}
                      title="View details"
                    >
                      <div className="font-medium">{a.name || "Unnamed"}</div>
                      <div className="text-xs text-gray-500">
                        {a.species || "—"} {a.tagId ? `• Tag: ${a.tagId}` : ""}
                      </div>
                    </button>
                    <div className="flex items-center gap-2 pr-2">
                      <button
                        className="text-sm text-error hover:underline"
                        onClick={() => handleDelete(a.id)}
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
                  <div><span className="font-medium">ID:</span> {selected.id || "—"}</div>
                  <div><span className="font-medium">Name:</span> {selected.name || "—"}</div>
                  <div><span className="font-medium">Species:</span> {selected.species || "—"}</div>
                  <div><span className="font-medium">Tag ID:</span> {selected.tagId || "—"}</div>
                </div>
                <div className="mt-3">
                  <AnimalForm
                    initialData={selected}
                    onSubmit={(data) => handleUpdate(selected.id, data)}
                    submitLabel="Update"
                    busy={loading}
                  />
                </div>
              </div>
            )}
          </div>

          <AnimalForm onSubmit={handleCreate} busy={loading} />
        </div>
      </div>
    </Layout>
  );
}
