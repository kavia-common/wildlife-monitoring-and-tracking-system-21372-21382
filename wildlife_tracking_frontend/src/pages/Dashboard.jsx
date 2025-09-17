import React, { useState } from "react";
import Layout from "../components/Layout";
import MapPlaceholder from "../components/map/MapPlaceholder";
import TelemetryTimeline from "../components/telemetry/TelemetryTimeline";
import { telemetryApi, lastHoursRange } from "../services/telemetry";

/**
 * PUBLIC_INTERFACE
 * Dashboard page - shows map and quick stats, plus telemetry timeline/playback
 */
export default function Dashboard() {
  const [animalId, setAnimalId] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [ingestBusy, setIngestBusy] = useState(false);
  const quickRange = lastHoursRange(6);

  const handleIngestDemo = async () => {
    // Demo ingestion helper to POST a couple of points for selected device/animal
    if (!animalId && !deviceId) {
      alert("Provide Animal ID or Device ID for demo ingestion.");
      return;
    }
    setIngestBusy(true);
    try {
      const now = Date.now();
      const mk = (offsetMin, lat, lng, speed = 0, battery = 95) => ({
        animalId: animalId || undefined,
        deviceId: deviceId || undefined,
        ts: new Date(now - offsetMin * 60 * 1000).toISOString(),
        lat,
        lng,
        speed,
        battery,
      });
      const demo = [
        mk(10, 12.9101, 77.6101, 1.1, 90),
        mk(6,  12.9202, 77.6202, 2.2, 89),
        mk(2,  12.9303, 77.6303, 0.8, 88),
      ];
      await telemetryApi.ingest(demo);
      alert("Demo telemetry ingested (3 points). Use the timeline to view.");
    } catch (e) {
      alert(`Ingest failed: ${e?.message || e}`);
    } finally {
      setIngestBusy(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>

        <MapPlaceholder />

        {/* Quick telemetry filters and demo ingestion */}
        <div className="card p-4">
          <div className="flex flex-col md:flex-row gap-3 md:items-end md:justify-between">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Animal ID</label>
                <input
                  className="w-full border rounded-md p-2"
                  placeholder="e.g., 101"
                  value={animalId}
                  onChange={(e) => setAnimalId(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Device ID</label>
                <input
                  className="w-full border rounded-md p-2"
                  placeholder="e.g., collar-42"
                  value={deviceId}
                  onChange={(e) => setDeviceId(e.target.value)}
                />
              </div>
              <div className="text-xs text-gray-600">
                <div className="mb-1">Quick Range</div>
                <div className="text-gray-700">
                  Last 6 hours: {new Date(quickRange.start).toLocaleString()} → {new Date(quickRange.end).toLocaleString()}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="btn" onClick={handleIngestDemo} disabled={ingestBusy}>
                {ingestBusy ? "Ingesting..." : "Demo Ingest 3 Points"}
              </button>
            </div>
          </div>
        </div>

        {/* Telemetry timeline */}
        <TelemetryTimeline
          animalId={animalId || undefined}
          deviceId={deviceId || undefined}
          defaultHours={6}
          onPointChange={() => {}}
        />

        {/* Stats placeholders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {["Tracked Animals", "Active Devices", "Recent Alerts", "Telemetry Events"].map((label) => (
            <div key={label} className="card p-4">
              <div className="text-sm text-gray-500">{label}</div>
              <div className="mt-2 text-2xl font-semibold">—</div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
