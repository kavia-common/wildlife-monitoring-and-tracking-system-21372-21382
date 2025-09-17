import React, { useEffect, useMemo, useRef, useState } from "react";
import { telemetryApi, lastHoursRange, toIsoUTC, formatTimeLabel } from "../../services/telemetry";

/**
 * PUBLIC_INTERFACE
 * TelemetryTimeline - A lightweight timeline/playback UI for telemetry points.
 *
 * Props:
 * - animalId?: string | number
 * - deviceId?: string | number
 * - defaultHours?: number (defaults 24)
 * - onPointChange?: (point) => void // callback with the currently "played" point
 *
 * Behavior:
 * - Fetches telemetry on mount and when filters/range change.
 * - Allows selecting date range via start/end datetime-local inputs.
 * - Provides playback controls (play/pause, step prev/next, speed).
 * - Renders a simple line chart for speed over time and a list of points.
 *   (Map integration can subscribe via onPointChange to animate markers externally.)
 */
export default function TelemetryTimeline({
  animalId,
  deviceId,
  defaultHours = 24,
  onPointChange,
}) {
  const [range, setRange] = useState(() => lastHoursRange(defaultHours));
  const [loading, setLoading] = useState(false);
  const [points, setPoints] = useState([]);
  const [error, setError] = useState("");

  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1); // multiplier (1x, 2x, 4x...)

  const timerRef = useRef(null);

  // Build query filters
  const filters = useMemo(() => {
    const base = { start: range.start, end: range.end, limit: 1000 };
    if (animalId) base.animalId = animalId;
    if (deviceId) base.deviceId = deviceId;
    return base;
  }, [animalId, deviceId, range.start, range.end]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await telemetryApi.list(filters);
      // sort by timestamp ascending
      const sorted = [...data].sort((a, b) => new Date(a.ts || a.timestamp) - new Date(b.ts || b.timestamp));
      setPoints(sorted);
      setIdx(0);
    } catch (e) {
      setError(e?.message || "Failed to load telemetry");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.animalId, filters.deviceId, filters.start, filters.end]);

  // playback
  useEffect(() => {
    if (!playing || points.length === 0) return;
    if (idx >= points.length - 1) {
      setPlaying(false);
      return;
    }
    const baseInterval = 1000; // 1s base
    const interval = baseInterval / speed;
    timerRef.current = setTimeout(() => setIdx((i) => Math.min(i + 1, points.length - 1)), interval);
    return () => clearTimeout(timerRef.current);
  }, [playing, idx, speed, points.length]);

  useEffect(() => {
    if (onPointChange && points[idx]) onPointChange(points[idx]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, points]);

  // helpers
  const current = points[idx];

  // compute speed series for mini chart
  const speedSeries = useMemo(() => {
    return points.map((p) => Number(p.speed || 0));
  }, [points]);

  const maxSpeed = useMemo(() => {
    return speedSeries.length ? Math.max(...speedSeries) || 1 : 1;
  }, [speedSeries]);

  const handleRangeChange = (field, value) => {
    // value from datetime-local => convert to ISO UTC
    setRange((r) => ({ ...r, [field]: toIsoUTC(new Date(value)) }));
  };

  const toLocalInput = (iso) => {
    try {
      const d = new Date(iso);
      const pad = (n) => String(n).padStart(2, "0");
      const yyyy = d.getFullYear();
      const mm = pad(d.getMonth() + 1);
      const dd = pad(d.getDate());
      const hh = pad(d.getHours());
      const mi = pad(d.getMinutes());
      return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
    } catch {
      return "";
    }
  };

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Telemetry Timeline</h3>
        <div className="flex items-center gap-2">
          <button className="text-sm text-primary" onClick={load} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {error && <div className="text-error text-sm">{error}</div>}

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="md:col-span-2">
          <label className="block text-xs text-gray-600 mb-1">Start</label>
          <input
            type="datetime-local"
            className="w-full border rounded-md p-2"
            value={toLocalInput(range.start)}
            onChange={(e) => handleRangeChange("start", e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs text-gray-600 mb-1">End</label>
          <input
            type="datetime-local"
            className="w-full border rounded-md p-2"
            value={toLocalInput(range.end)}
            onChange={(e) => handleRangeChange("end", e.target.value)}
          />
        </div>
      </div>

      {/* Playback controls */}
      <div className="flex items-center gap-2">
        <button
          className="px-3 py-1 rounded-md border text-sm"
          onClick={() => setIdx((i) => Math.max(i - 1, 0))}
          disabled={points.length === 0 || idx === 0}
        >
          ◀ Prev
        </button>
        <button
          className="px-3 py-1 rounded-md border text-sm"
          onClick={() => setPlaying((p) => !p)}
          disabled={points.length === 0}
        >
          {playing ? "⏸ Pause" : "▶ Play"}
        </button>
        <button
          className="px-3 py-1 rounded-md border text-sm"
          onClick={() => setIdx((i) => Math.min(i + 1, points.length - 1))}
          disabled={points.length === 0 || idx >= points.length - 1}
        >
          Next ▶
        </button>
        <div className="ml-3 flex items-center gap-2">
          <span className="text-xs text-gray-500">Speed</span>
          <select
            className="border rounded-md p-1 text-sm"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
          >
            {[1, 2, 4, 8].map((s) => (
              <option key={s} value={s}>
                {s}x
              </option>
            ))}
          </select>
        </div>
        <div className="ml-auto text-xs text-gray-600">
          {points.length ? `${idx + 1} / ${points.length}` : "No data"}
        </div>
      </div>

      {/* Mini speed chart */}
      <div className="h-24 w-full bg-gradient-to-r from-forest-50 to-stone-50 rounded-md border relative overflow-hidden">
        {speedSeries.length > 0 && (
          <svg width="100%" height="100%" viewBox={`0 0 ${Math.max(speedSeries.length - 1, 1)} ${maxSpeed || 1}`} preserveAspectRatio="none">
            <polyline
              fill="none"
              stroke="#2563EB"
              strokeWidth="0.5"
              points={speedSeries.map((v, i) => `${i},${(maxSpeed - v)}`).join(" ")}
            />
            {/* Cursor */}
            <line
              x1={idx}
              x2={idx}
              y1={0}
              y2={maxSpeed}
              stroke="#F59E0B"
              strokeWidth="0.5"
            />
          </svg>
        )}
      </div>

      {/* Current point details */}
      {current && (
        <div className="text-sm text-gray-700">
          <div>
            <span className="font-medium">Time:</span>{" "}
            {formatTimeLabel(current.ts || current.timestamp)}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-1">
            <div><span className="font-medium">Lat:</span> {current.lat ?? current.latitude ?? "—"}</div>
            <div><span className="font-medium">Lng:</span> {current.lng ?? current.longitude ?? "—"}</div>
            <div><span className="font-medium">Speed:</span> {current.speed ?? "—"}</div>
            <div><span className="font-medium">Battery:</span> {current.battery ?? "—"}</div>
          </div>
        </div>
      )}

      {/* Raw list for quick inspection */}
      <div className="max-h-48 overflow-auto border rounded-md">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 sticky top-0">
            <tr className="text-left">
              <th className="p-2">Time</th>
              <th className="p-2">Lat</th>
              <th className="p-2">Lng</th>
              <th className="p-2">Speed</th>
              <th className="p-2">Battery</th>
              <th className="p-2">Device</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p, i) => (
              <tr
                key={`${p.id || p.ts || p.timestamp || i}`}
                className={`border-t hover:bg-forest-50 cursor-pointer ${i === idx ? "bg-forest-100" : ""}`}
                onClick={() => setIdx(i)}
                title="Jump to this time"
              >
                <td className="p-2">{new Date(p.ts || p.timestamp).toLocaleString()}</td>
                <td className="p-2">{p.lat ?? p.latitude ?? "—"}</td>
                <td className="p-2">{p.lng ?? p.longitude ?? "—"}</td>
                <td className="p-2">{p.speed ?? "—"}</td>
                <td className="p-2">{p.battery ?? "—"}</td>
                <td className="p-2">{p.deviceId ?? p.device_id ?? "—"}</td>
              </tr>
            ))}
            {points.length === 0 && !loading && (
              <tr><td className="p-2 text-gray-500" colSpan="6">No telemetry for selected range.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
