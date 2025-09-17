import React, { useMemo, useState } from "react";
import Layout from "../components/Layout";
import MapContainer from "../components/map/MapContainer";
import TelemetryTimeline from "../components/telemetry/TelemetryTimeline";
import { telemetryApi, lastHoursRange } from "../services/telemetry";
import AnimalCard from "../components/AnimalCard";

/**
 * PUBLIC_INTERFACE
 * Dashboard page - wildlife-themed dashboard with map, animal cards, quick actions, and timeline.
 */
export default function Dashboard() {
  const [animalId, setAnimalId] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [ingestBusy, setIngestBusy] = useState(false);
  const [showHeat, setShowHeat] = useState(true);
  const [showCluster, setShowCluster] = useState(true);
  const quickRange = lastHoursRange(6);

  // Placeholder sloth bears sample data for hero cards and map markers
  const sampleBears = useMemo(
    () => [
      {
        id: 101,
        name: "Rani",
        species: "Sloth Bear",
        tagId: "SB-101",
        status: "online",
        lastSeen: "10m ago",
        imageUrl:
          "https://images.unsplash.com/photo-1565967511849-76a60a516170?q=80&w=1600&auto=format&fit=crop",
      },
      {
        id: 102,
        name: "Bhola",
        species: "Sloth Bear",
        tagId: "SB-102",
        status: "idle",
        lastSeen: "1h ago",
        imageUrl:
          "https://images.unsplash.com/photo-1611244419377-6db3335f97b1?q=80&w=1600&auto=format&fit=crop",
      },
      {
        id: 103,
        name: "Kavi",
        species: "Sloth Bear",
        tagId: "SB-103",
        status: "offline",
        lastSeen: "Yesterday",
        imageUrl:
          "https://images.unsplash.com/photo-1608068911365-a8f3c018a174?q=80&w=1600&auto=format&fit=crop",
      },
    ],
    []
  );

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
        mk(6, 12.9202, 77.6202, 2.2, 89),
        mk(2, 12.9303, 77.6303, 0.8, 88),
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
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-stone-900">AnimalTrackr Dashboard</h1>
          <span className="inline-flex items-center gap-2 rounded-full bg-forest-100 text-forest-800 border border-forest-200 px-3 py-1 text-xs">
            🌿 Sloth Bear Conservation
          </span>
        </div>

        {/* Quick filters and actions */}
        <div className="card p-4 bg-gradient-to-br from-forest-50 to-earth-50">
          <div className="flex flex-col md:flex-row gap-3 md:items-end md:justify-between">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 flex-1">
              <div>
                <label className="block text-xs text-stone-600 mb-1">Animal ID</label>
                <input
                  className="w-full border rounded-md p-2"
                  placeholder="e.g., 101"
                  value={animalId}
                  onChange={(e) => setAnimalId(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-stone-600 mb-1">Device ID</label>
                <input
                  className="w-full border rounded-md p-2"
                  placeholder="e.g., collar-42"
                  value={deviceId}
                  onChange={(e) => setDeviceId(e.target.value)}
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showHeat}
                  onChange={(e) => setShowHeat(e.target.checked)}
                />
                Heatmap
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showCluster}
                  onChange={(e) => setShowCluster(e.target.checked)}
                />
                Clusters
              </label>
            </div>
            <div className="flex items-center gap-2">
              <button className="btn" onClick={handleIngestDemo} disabled={ingestBusy}>
                {ingestBusy ? "Ingesting..." : "Demo Ingest 3 Points"}
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-700 text-sm hover:bg-stone-50"
                onClick={() => {
                  if (sampleBears[0]) setAnimalId(String(sampleBears[0].id));
                }}
                title="Focus map on Rani"
              >
                🎯 Focus Rani
              </button>
            </div>
          </div>
        </div>

        {/* Animal hero cards */}
        <div>
          <h2 className="text-lg font-semibold text-stone-800 mb-2">Tracked Sloth Bears</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sampleBears.map((bear) => (
              <AnimalCard
                key={bear.id}
                animal={bear}
                onTrack={(a) => setAnimalId(String(a.id))}
                onDetails={() => (window.location.href = "/animals")}
              />
            ))}
          </div>
        </div>

        {/* Map */}
        <MapContainer
          animalId={animalId || undefined}
          deviceId={deviceId || undefined}
          defaultHours={6}
          showHeatmap={showHeat}
          showClusters={showCluster}
          onMarkerClick={() => {}}
        />

        {/* Telemetry timeline */}
        <TelemetryTimeline
          animalId={animalId || undefined}
          deviceId={deviceId || undefined}
          defaultHours={6}
          onPointChange={() => {}}
        />

        {/* Guidance */}
        <div className="card p-4 text-sm text-stone-700">
          Use the map toolbar above to Predict Movement (dashed purple path) and calculate Home Range
          (orange polygon) for the selected animal/device and time range.
        </div>

        {/* Stats placeholders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {["Tracked Animals", "Active Devices", "Recent Alerts", "Telemetry Events"].map(
            (label, idx) => (
              <div
                key={label}
                className="card p-4 bg-gradient-to-br from-forest-50 to-earth-50"
              >
                <div className="text-sm text-stone-600">{label}</div>
                <div className="mt-2 text-2xl font-semibold">—</div>
              </div>
            )
          )}
        </div>
      </div>
    </Layout>
  );
}
