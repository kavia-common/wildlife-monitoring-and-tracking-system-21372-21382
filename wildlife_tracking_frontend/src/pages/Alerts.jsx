import React, { useEffect, useMemo, useRef, useState } from "react";
import Layout from "../components/Layout";
import { alertsApi } from "../services/alerts";

/**
 * PUBLIC_INTERFACE
 * Alerts page - Filterable alert history and live notifications
 */
export default function Alerts() {
  const [filters, setFilters] = useState({
    type: "",
    severity: "",
    status: "",
    start: "",
    end: "",
  });
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [live, setLive] = useState(true);
  const [error, setError] = useState("");
  const wsRef = useRef(null);
  const [toast, setToast] = useState(null); // small transient notification

  const queryParams = useMemo(() => {
    const p = {};
    if (filters.type) p.type = filters.type;
    if (filters.severity) p.severity = filters.severity;
    if (filters.status) p.status = filters.status;
    if (filters.start) p.start = filters.start;
    if (filters.end) p.end = filters.end;
    p.limit = 200;
    return p;
  }, [filters]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await alertsApi.list(queryParams);
      const items = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : res?.items || [];
      // Normalize sort: latest first
      const normalized = items
        .map((a) => ({
          id: a.id || a.alertId || a._id,
          ts: a.ts || a.timestamp || a.createdAt || a.time,
          type: a.type || a.category || "alert",
          severity: a.severity || a.level || "info",
          status: a.status || "new",
          title: a.title || a.message || "Alert",
          details: a.details || a.payload || a.data || {},
          location: a.location || { lat: a.lat ?? a.latitude, lng: a.lng ?? a.longitude },
        }))
        .sort((a, b) => new Date(b.ts) - new Date(a.ts));
      setAlerts(normalized);
    } catch (e) {
      setError(e?.message || "Failed to load alerts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryParams.type, queryParams.severity, queryParams.status, queryParams.start, queryParams.end]);

  // live WebSocket notifications
  useEffect(() => {
    if (!live) {
      wsRef.current?.close();
      wsRef.current = null;
      return;
    }
    // connect
    wsRef.current = alertsApi.wsConnect(
      (msg) => {
        // Accept either data object or raw string.
        const a = typeof msg === "string" ? { title: msg } : msg;
        const normalized = {
          id: a.id || a.alertId || a._id || `ws-${Date.now()}`,
          ts: a.ts || a.timestamp || new Date().toISOString(),
          type: a.type || "alert",
          severity: a.severity || "info",
          status: a.status || "new",
          title: a.title || a.message || "Alert",
          details: a.details || a.payload || a.data || {},
          location: a.location || { lat: a.lat ?? a.latitude, lng: a.lng ?? a.longitude },
        };
        // Prepend to list
        setAlerts((prev) => [normalized, ...prev]);
        // Show toast
        setToast({ severity: normalized.severity, title: normalized.title, ts: normalized.ts });
        // Auto-hide toast
        setTimeout(() => setToast(null), 4000);
      },
      () => {},
      () => {}
    );
    return () => {
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [live]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((f) => ({ ...f, [name]: value }));
  };

  const handleAck = async (id) => {
    try {
      await alertsApi.acknowledge(id);
      // update status locally
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, status: "acknowledged" } : a)));
    } catch (e) {
      alert(e?.message || "Failed to acknowledge alert");
    }
  };

  const toLocalInput = (iso) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      const pad = (n) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch { return ""; }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Alerts</h1>

        {/* toast */}
        {toast && (
          <div className="fixed right-4 top-16 z-40">
            <div className="rounded-lg shadow-md border p-3 bg-white">
              <div className="text-xs text-gray-500">{new Date(toast.ts).toLocaleString()}</div>
              <div className="font-semibold">{toast.title}</div>
              <div className={`text-xs mt-1 ${toast.severity === "critical" ? "text-error" : toast.severity === "warning" ? "text-secondary" : "text-gray-600"}`}>
                {toast.severity?.toUpperCase()}
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="card p-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Type</label>
              <input className="w-full border rounded-md p-2" name="type" value={filters.type} onChange={handleChange} placeholder="e.g., geofence_breach" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Severity</label>
              <select className="w-full border rounded-md p-2" name="severity" value={filters.severity} onChange={handleChange}>
                <option value="">Any</option>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Status</label>
              <select className="w-full border rounded-md p-2" name="status" value={filters.status} onChange={handleChange}>
                <option value="">Any</option>
                <option value="new">New</option>
                <option value="acknowledged">Acknowledged</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Start</label>
              <input type="datetime-local" className="w-full border rounded-md p-2" value={toLocalInput(filters.start)} onChange={(e) => setFilters((f) => ({ ...f, start: new Date(e.target.value).toISOString() }))} />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">End</label>
              <input type="datetime-local" className="w-full border rounded-md p-2" value={toLocalInput(filters.end)} onChange={(e) => setFilters((f) => ({ ...f, end: new Date(e.target.value).toISOString() }))} />
            </div>
            <div className="flex items-end gap-2">
              <button className="btn" onClick={load} disabled={loading}>{loading ? "Loading..." : "Apply"}</button>
              <label className="text-sm flex items-center gap-2">
                <input type="checkbox" checked={live} onChange={(e) => setLive(e.target.checked)} /> Live
              </label>
            </div>
          </div>
        </div>

        {error && <div className="text-error text-sm">{error}</div>}

        {/* Alerts table */}
        <div className="card p-0 overflow-hidden">
          <div className="max-h-[520px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr className="text-left">
                  <th className="p-3">Time</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Severity</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Title</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((a) => (
                  <tr key={a.id} className="border-t hover:bg-blue-50/40">
                    <td className="p-3">{a.ts ? new Date(a.ts).toLocaleString() : "—"}</td>
                    <td className="p-3">{a.type}</td>
                    <td className={`p-3 ${a.severity === "critical" ? "text-error" : a.severity === "warning" ? "text-secondary" : "text-gray-700"}`}>
                      {a.severity}
                    </td>
                    <td className="p-3">{a.status}</td>
                    <td className="p-3">{a.title}</td>
                    <td className="p-3">
                      <button
                        className="text-primary text-sm disabled:text-gray-400"
                        onClick={() => handleAck(a.id)}
                        disabled={a.status === "acknowledged" || a.status === "resolved"}
                      >
                        Acknowledge
                      </button>
                    </td>
                  </tr>
                ))}
                {alerts.length === 0 && !loading && (
                  <tr><td className="p-3 text-gray-500" colSpan="6">No alerts found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
