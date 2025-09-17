import React, { useEffect, useMemo, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer as LeafletMap, TileLayer, Marker, Popup, Polyline, LayersControl, LayerGroup, useMap, ScaleControl, Polygon } from "react-leaflet";
import "leaflet.heat";
import "leaflet.markercluster";
import { telemetryApi, lastHoursRange } from "../../services/telemetry";
import { apiGet } from "../../services/api";
import { geofenceApi, alertsApi } from "../../services/alerts";
import { analyticsApi } from "../../services/analytics";

// Fix default icon paths in Leaflet when bundling
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

/**
 * PUBLIC_INTERFACE
 * MapContainer - Interactive map for telemetry tracks and points with clustering and heatmap.
 *
 * Props:
 * - animalId?: string|number
 * - deviceId?: string|number
 * - defaultHours?: number (default 24)
 * - showHeatmap?: boolean
 * - showClusters?: boolean
 * - onMarkerClick?: (item) => void
 *
 * Data sources:
 * - Telemetry points via telemetryApi.list()
 * - Optional entities for markers:
 *   - GET /animals (expects id, name, species, lastKnownLat, lastKnownLng)
 *   - GET /devices (expects id, deviceId, lastKnownLat, lastKnownLng)
 *   - GET /cameras or /camera-traps (expects id, name, lat, lng)
 * These are best-effort and will gracefully no-op if endpoints are missing.
 */
export default function MapContainer({
  animalId,
  deviceId,
  defaultHours = 24,
  showHeatmap = true,
  showClusters = true,
  onMarkerClick,
}) {
  const [points, setPoints] = useState([]);
  const [error, setError] = useState("");
  const [predictBusy, setPredictBusy] = useState(false);
  const [homeRangeBusy, setHomeRangeBusy] = useState(false);
  const [predictedPath, setPredictedPath] = useState([]); // [{lat,lng,ts}]
  const [homeRange, setHomeRange] = useState([]); // [[lat,lng],...]
  const [classifySummary, setClassifySummary] = useState(null); // {top: ..., items: [...]}
  const [loading, setLoading] = useState(false);

  // Optional entity markers
  const [animals, setAnimals] = useState([]);
  const [devices, setDevices] = useState([]);
  const [cameras, setCameras] = useState([]);

  // Geofences and drawing state
  const [geofences, setGeofences] = useState([]);
  const [drawing, setDrawing] = useState(false);
  const [drawCoords, setDrawCoords] = useState([]);
  const [geoName, setGeoName] = useState("");
  const [liveAlerts, setLiveAlerts] = useState([]);
  const wsRef = useRef(null);

  const mapRef = useRef(null);
  const clusterLayerRef = useRef(null);
  const heatLayerRef = useRef(null);

  const range = useMemo(() => lastHoursRange(defaultHours), [defaultHours]);

  const filters = useMemo(() => {
    const f = { start: range.start, end: range.end, limit: 1000 };
    if (animalId) f.animalId = animalId;
    if (deviceId) f.deviceId = deviceId;
    return f;
  }, [animalId, deviceId, range.start, range.end]);

  // Load telemetry points
  const loadTelemetry = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await telemetryApi.list(filters);
      // keep only valid lat/lng
      const normalized = data
        .map((p) => ({
          ...p,
          lat: Number(p.lat ?? p.latitude),
          lng: Number(p.lng ?? p.longitude),
          ts: p.ts || p.timestamp,
        }))
        .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))
        .sort((a, b) => new Date(a.ts) - new Date(b.ts));
      setPoints(normalized);
      // Clear previous analytics when filters change
      setPredictedPath([]);
      setHomeRange([]);
      setClassifySummary(null);
    } catch (e) {
      setError(e?.message || "Failed to load telemetry");
    } finally {
      setLoading(false);
    }
  };

  // Load entity markers (best-effort)
  const loadEntities = async () => {
    try {
      const [animalsRes, devicesRes] = await Promise.allSettled([
        apiGet("/animals"),
        apiGet("/devices"),
      ]);
      if (animalsRes.status === "fulfilled") {
        const arr = Array.isArray(animalsRes.value?.data)
          ? animalsRes.value.data
          : Array.isArray(animalsRes.value)
          ? animalsRes.value
          : animalsRes.value?.items || [];
        setAnimals(arr);
      }
      if (devicesRes.status === "fulfilled") {
        const arr = Array.isArray(devicesRes.value?.data)
          ? devicesRes.value.data
          : Array.isArray(devicesRes.value)
          ? devicesRes.value
          : devicesRes.value?.items || [];
        setDevices(arr);
      }
    } catch {
      // ignore
    }
    // camera traps: try a couple common paths
    try {
      const cams = await apiGet("/cameras").catch(() =>
        apiGet("/camera-traps")
      );
      const arr = Array.isArray(cams?.data)
        ? cams.data
        : Array.isArray(cams)
        ? cams
        : cams?.items || [];
      setCameras(arr);
    } catch {
      setCameras([]);
    }
  };

  useEffect(() => {
    loadTelemetry();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.animalId, filters.deviceId, filters.start, filters.end]);

  useEffect(() => {
    loadEntities();
  }, []);

  // Load geofences
  const loadGeofences = async () => {
    try {
      const res = await geofenceApi.list();
      const items = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : res?.items || [];
      const normalized = items.map((g) => ({
        id: g.id || g._id,
        name: g.name || "Geofence",
        type: g.type || (g.radius ? "circle" : "polygon"),
        coordinates: g.coordinates || g.points || [],
        radius: g.radius || null,
      }));
      setGeofences(normalized);
    } catch {
      setGeofences([]);
    }
  };

  useEffect(() => {
    loadGeofences();
  }, []);

  // Trigger movement prediction
  const runPrediction = async () => {
    setPredictBusy(true);
    try {
      const payload = {
        animalId: animalId || undefined,
        deviceId: deviceId || undefined,
        start: filters.start,
        end: filters.end,
        horizon: 3600, // 1h default
        steps: 20,
      };
      const path = await analyticsApi.movementPredict(payload);
      setPredictedPath(path);
    } catch (e) {
      alert(e?.message || "Failed to get movement prediction");
    } finally {
      setPredictBusy(false);
    }
  };

  // Trigger home range fetch
  const runHomeRange = async () => {
    setHomeRangeBusy(true);
    try {
      const res = await analyticsApi.homeRange({
        animalId: animalId || undefined,
        deviceId: deviceId || undefined,
        start: filters.start,
        end: filters.end,
      });
      setHomeRange(res.polygon || []);
    } catch (e) {
      alert(e?.message || "Failed to get home range");
    } finally {
      setHomeRangeBusy(false);
    }
  };

  // Trigger telemetry behavior classification
  const runClassification = async () => {
    try {
      if (!points.length) {
        alert("No telemetry points available to classify.");
        return;
      }
      const results = await analyticsApi.classifyTelemetry(points);
      // Compute quick summary: top label by count and avg confidence
      const countMap = new Map();
      let items = [];
      for (const r of results) {
        const key = r.label || "unknown";
        const prev = countMap.get(key) || { count: 0, sumConf: 0 };
        countMap.set(key, { count: prev.count + 1, sumConf: prev.sumConf + Number(r.confidence || 0) });
        items.push({ ts: r.ts || r.timestamp, label: key, confidence: r.confidence });
      }
      let top = null;
      for (const [label, { count, sumConf }] of countMap.entries()) {
        const avg = count ? sumConf / count : 0;
        if (!top || count > top.count) top = { label, count, avgConfidence: Number(avg.toFixed(2)) };
      }
      setClassifySummary({ top, items });
    } catch (e) {
      alert(e?.message || "Failed to classify telemetry");
    }
  };

  // Live alerts WS: collect breach events
  useEffect(() => {
    wsRef.current = alertsApi.wsConnect(
      (data) => {
        const d = typeof data === "string" ? {} : data;
        if ((d.type || "").toLowerCase().includes("geofence")) {
          const lat = d.location?.lat ?? d.lat ?? d.latitude;
          const lng = d.location?.lng ?? d.lng ?? d.longitude;
          const item = {
            id: d.id || `geo-${Date.now()}`,
            ts: d.ts || new Date().toISOString(),
            title: d.title || "Geofence alert",
            severity: d.severity || "warning",
            lat: Number(lat),
            lng: Number(lng),
          };
          if (Number.isFinite(item.lat) && Number.isFinite(item.lng)) {
            setLiveAlerts((prev) => [item, ...prev].slice(0, 50));
          }
        }
      },
      () => {},
      () => {}
    );
    return () => wsRef.current?.close();
  }, []);

  // Derive polyline path
  const pathCoords = useMemo(
    () => points.map((p) => [p.lat, p.lng]),
    [points]
  );

  // Fit bounds to data on load/update
  const FitBounds = () => {
    const map = useMap();
    useEffect(() => {
      if (!map) return;
      if (pathCoords.length > 0) {
        const b = L.latLngBounds(pathCoords);
        map.fitBounds(b, { padding: [30, 30] });
      } else {
        // default to some reasonable world view
        map.setView([20, 0], 2);
      }
    }, [map, pathCoords.length]);
    return null;
  };

  // Update heat layer when points change
  const HeatLayer = () => {
    const map = useMap();
    useEffect(() => {
      if (!showHeatmap) {
        if (heatLayerRef.current && map) {
          map.removeLayer(heatLayerRef.current);
          heatLayerRef.current = null;
        }
        return;
      }
      const heatData = points.map((p) => [p.lat, p.lng, Math.max(0.2, Math.min(1, (p.speed || 0) / 10))]);
      if (heatLayerRef.current) {
        heatLayerRef.current.setLatLngs(heatData);
      } else {
        // Use leaflet.heat plugin attached on L.heatLayer
        heatLayerRef.current = L.heatLayer(heatData, { radius: 20, blur: 15, maxZoom: 17 });
        heatLayerRef.current.addTo(map);
      }
      return () => {
        // keep it when toggled off via prop; removal handled above
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [points, showHeatmap]);
    return null;
  };

  // Cluster layer using Leaflet.markercluster via Leaflet API (not react-leaflet component)
  const ClusterLayer = () => {
    const map = useMap();

    useEffect(() => {
      if (!showClusters) {
        if (clusterLayerRef.current && map) {
          map.removeLayer(clusterLayerRef.current);
          clusterLayerRef.current = null;
        }
        return;
      }

      // Remove previous cluster layer
      if (clusterLayerRef.current) {
        map.removeLayer(clusterLayerRef.current);
        clusterLayerRef.current = null;
      }

      // Create cluster group and add markers: latest telemetry point, animals, devices, cameras
      const cluster = L.markerClusterGroup ? L.markerClusterGroup() : L.layerGroup();

      // Latest telemetry points (e.g., last known positions per device/animal)
      // Build map by deviceId or animalId to deduplicate to latest point each
      const latestByKey = new Map();
      for (const p of points) {
        const key = p.deviceId || p.device_id || p.animalId || p.animal_id || `point-${p.lat}-${p.lng}`;
        const prev = latestByKey.get(key);
        if (!prev || new Date(p.ts) > new Date(prev.ts)) latestByKey.set(key, p);
      }
      for (const p of latestByKey.values()) {
        if (!Number.isFinite(p.lat) || !Number.isFinite(p.lng)) continue;
        const m = L.marker([p.lat, p.lng], { title: `Telemetry ${p.deviceId || p.animalId || ""}` });
        const popupHtml = `
          <div style="min-width:200px">
            <div><strong>Time:</strong> ${new Date(p.ts).toLocaleString()}</div>
            <div><strong>Lat:</strong> ${p.lat.toFixed(5)} &nbsp; <strong>Lng:</strong> ${p.lng.toFixed(5)}</div>
            <div><strong>Speed:</strong> ${p.speed ?? "—"}</div>
            <div><strong>Battery:</strong> ${p.battery ?? "—"}</div>
            <div><strong>Animal ID:</strong> ${p.animalId ?? p.animal_id ?? "—"}</div>
            <div><strong>Device ID:</strong> ${p.deviceId ?? p.device_id ?? "—"}</div>
          </div>
        `;
        m.bindPopup(popupHtml);
        m.on("click", () => onMarkerClick?.(p));
        cluster.addLayer(m);
      }

      const addEntityMarker = (lat, lng, title, detailsObj) => {
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
        const m = L.marker([lat, lng], { title });
        const rows = Object.entries(detailsObj || {})
          .map(([k, v]) => `<div><strong>${k}:</strong> ${v ?? "—"}</div>`)
          .join("");
        m.bindPopup(`<div style="min-width:200px">${rows}</div>`);
        m.on("click", () => onMarkerClick?.(detailsObj));
        cluster.addLayer(m);
      };

      animals.forEach((a) =>
        addEntityMarker(
          a.lastKnownLat ?? a.lat ?? a.latitude,
          a.lastKnownLng ?? a.lng ?? a.longitude,
          `Animal ${a.name || a.id}`,
          { type: "animal", id: a.id, name: a.name, species: a.species, lat: a.lastKnownLat ?? a.lat, lng: a.lastKnownLng ?? a.lng }
        )
      );
      devices.forEach((d) =>
        addEntityMarker(
          d.lastKnownLat ?? d.lat ?? d.latitude,
          d.lastKnownLng ?? d.lng ?? d.longitude,
          `Device ${d.deviceId || d.id}`,
          { type: "device", id: d.id, deviceId: d.deviceId, model: d.model, status: d.status, lat: d.lastKnownLat ?? d.lat, lng: d.lastKnownLng ?? d.lng }
        )
      );
      cameras.forEach((c) =>
        addEntityMarker(
          c.lat ?? c.latitude,
          c.lng ?? c.longitude,
          `Camera ${c.name || c.id}`,
          { type: "camera", id: c.id, name: c.name, lat: c.lat, lng: c.lng }
        )
      );

      cluster.addTo(map);
      clusterLayerRef.current = cluster;

      return () => {
        if (clusterLayerRef.current) {
          map.removeLayer(clusterLayerRef.current);
          clusterLayerRef.current = null;
        }
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [points, animals, devices, cameras, showClusters]);

    return null;
  };

  // Render markers for all telemetry points with popups in a separate overlay group (can be toggled via layers control)
  const pointMarkers = points.map((p, idx) => (
    <Marker key={`pt-${idx}-${p.ts || idx}`} position={[p.lat, p.lng]} eventHandlers={{ click: () => onMarkerClick?.(p) }}>
      <Popup>
        <div className="text-sm">
          <div><strong>Time:</strong> {new Date(p.ts).toLocaleString()}</div>
          <div><strong>Lat:</strong> {p.lat} &nbsp; <strong>Lng:</strong> {p.lng}</div>
          <div><strong>Speed:</strong> {p.speed ?? "—"}</div>
          <div><strong>Battery:</strong> {p.battery ?? "—"}</div>
          <div><strong>Device:</strong> {p.deviceId ?? p.device_id ?? "—"}</div>
        </div>
      </Popup>
    </Marker>
  ));

  // Approximate circle polygon for display
  const approximateCircle = (lat, lng, radiusMeters = 100) => {
    const points = 48;
    const res = [];
    const R = 6378137; // earth radius
    for (let i = 0; i <= points; i++) {
      const theta = (i / points) * 2 * Math.PI;
      const dx = (radiusMeters * Math.cos(theta)) / R;
      const dy = (radiusMeters * Math.sin(theta)) / R;
      const newLat = lat + (dy * 180) / Math.PI;
      const newLng = lng + ((dx * 180) / Math.PI) / Math.cos((lat * Math.PI) / 180);
      res.push([newLat, newLng]);
    }
    return res;
  };

  return (
    <div className="card p-0 overflow-hidden">
      <div className="h-[540px] w-full relative">
        {error && (
          <div className="absolute z-[1000] m-3 px-3 py-2 rounded-md bg-red-50 text-red-700 text-sm border border-red-200">
            {error}
          </div>
        )}
        <LeafletMap
          ref={mapRef}
          center={[20, 0]}
          zoom={2}
          style={{ height: "100%", width: "100%" }}
          zoomControl={true}
          whenCreated={(map) => {
            // Attach click for drawing when enabled
            map.on("click", (e) => {
              if (!drawing) return;
              const { latlng } = e;
              setDrawCoords((prev) => [...prev, [latlng.lat, latlng.lng]]);
            });
          }}
        >
          <ScaleControl position="bottomleft" />
          <TileLayer
            attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
            url="https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png"
          />

          <LayersControl position="topright">
            <LayersControl.Overlay checked name="Track">
              <LayerGroup>
                {pathCoords.length > 1 && (
                  <Polyline positions={pathCoords} color="#2563EB" weight={3} opacity={0.8} />
                )}
                {predictedPath.length > 1 && (
                  <Polyline positions={predictedPath.map(p => [p.lat, p.lng])} color="#8B5CF6" weight={3} opacity={0.8} dashArray="6 6" />
                )}
              </LayerGroup>
            </LayersControl.Overlay>

            <LayersControl.Overlay name="Telemetry Points">
              <LayerGroup>{pointMarkers}</LayerGroup>
            </LayersControl.Overlay>

            <LayersControl.Overlay checked name="Geofences">
              <LayerGroup>
                {geofences.map((g) =>
                  g.type === "circle" && Number.isFinite(g.coordinates?.[0]?.[0]) && Number.isFinite(g.coordinates?.[0]?.[1]) && Number.isFinite(g.radius) ? (
                    <Polyline
                      key={`g-${g.id}`}
                      positions={approximateCircle(g.coordinates[0][0], g.coordinates[0][1], g.radius)}
                      color="#10B981"
                      weight={2}
                      opacity={0.8}
                    />
                  ) : (
                    Array.isArray(g.coordinates) && g.coordinates.length > 2 && (
                      <Polyline key={`g-${g.id}`} positions={g.coordinates} color="#10B981" weight={2} opacity={0.8} />
                    )
                  )
                )}
                {/* Home range polygon */}
                {Array.isArray(homeRange) && homeRange.length > 2 && (
                  <Polygon positions={homeRange} pathOptions={{ color: "#F97316", weight: 2, fillColor: "#F97316", fillOpacity: 0.15 }} />
                )}
                {/* current drawing preview */}
                {drawCoords.length > 1 && (
                  <Polyline positions={drawCoords} color="#F59E0B" weight={2} dashArray="4" />
                )}
              </LayerGroup>
            </LayersControl.Overlay>

            <LayersControl.Overlay name="Breach Events">
              <LayerGroup>
                {liveAlerts.map((a) =>
                  Number.isFinite(a.lat) && Number.isFinite(a.lng) ? (
                    <Marker key={a.id} position={[a.lat, a.lng]}>
                      <Popup>
                        <div className="text-sm">
                          <div className="font-semibold">{a.title}</div>
                          <div className="text-xs text-gray-500">{new Date(a.ts).toLocaleString()}</div>
                          <div className={`text-xs mt-1 ${a.severity === "critical" ? "text-error" : a.severity === "warning" ? "text-secondary" : "text-gray-600"}`}>
                            {a.severity?.toUpperCase()}
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  ) : null
                )}
              </LayerGroup>
            </LayersControl.Overlay>
          </LayersControl>

          {/* Cluster and Heat as side-effect layers */}
          <ClusterLayer />
          <HeatLayer />
          <FitBounds />
        </LeafletMap>
      </div>
      <div className="p-3 border-t text-xs text-gray-600 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-gray-800">
            {loading ? "Loading telemetry..." : `${points.length} points`}
            {animalId ? ` • Animal: ${animalId}` : ""}
            {deviceId ? ` • Device: ${deviceId}` : ""}
            {` • Geofences: ${geofences.length}`}
          </div>
          <div className="flex items-center gap-2">
            <button
              className="px-2 py-1 rounded-md border text-sm"
              onClick={loadTelemetry}
              disabled={loading}
              title="Reload telemetry"
            >
              Refresh
            </button>
            <button
              className="px-2 py-1 rounded-md border text-sm"
              onClick={runPrediction}
              disabled={predictBusy}
              title="Predict future movement"
            >
              {predictBusy ? "Predicting..." : "Predict Movement"}
            </button>
            <button
              className="px-2 py-1 rounded-md border text-sm"
              onClick={runHomeRange}
              disabled={homeRangeBusy}
              title="Calculate home range"
            >
              {homeRangeBusy ? "Calculating..." : "Home Range"}
            </button>
            <button
              className="px-2 py-1 rounded-md border text-sm"
              onClick={runClassification}
              title="Classify behavior from telemetry"
            >
              Classify Behavior
            </button>
          </div>
        </div>

        {/* Classification summary */}
        {classifySummary?.top && (
          <div className="text-sm text-gray-700">
            <span className="font-medium">Predominant behavior:</span>{" "}
            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
              {classifySummary.top.label} • n={classifySummary.top.count} • avg conf={classifySummary.top.avgConfidence}
            </span>
          </div>
        )}

        {/* Geofence controls */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-gray-700">Geofence:</span>
          {!drawing ? (
            <button className="px-2 py-1 rounded-md border text-sm" onClick={() => { setDrawing(true); setDrawCoords([]); }}>
              Start Polygon
            </button>
          ) : (
            <>
              <button className="px-2 py-1 rounded-md border text-sm" onClick={() => setDrawing(false)}>
                Pause Drawing
              </button>
              <button className="px-2 py-1 rounded-md border text-sm" onClick={() => setDrawCoords([])}>
                Clear Points
              </button>
            </>
          )}
          <input
            className="border rounded-md px-2 py-1 text-sm"
            placeholder="Fence name"
            value={geoName}
            onChange={(e) => setGeoName(e.target.value)}
          />
          <button
            className="px-2 py-1 rounded-md border text-sm"
            onClick={async () => {
              if (drawCoords.length < 3) { alert("Add at least 3 points for a polygon"); return; }
              try {
                await geofenceApi.create({ name: geoName || "Geofence", type: "polygon", coordinates: drawCoords });
                setDrawing(false);
                setDrawCoords([]);
                setGeoName("");
                await loadGeofences();
              } catch (e) {
                alert(e?.message || "Failed to save geofence");
              }
            }}
            disabled={drawCoords.length < 3}
            title="Finish and save polygon"
          >
            Save Polygon
          </button>
          <button
            className="px-2 py-1 rounded-md border text-sm"
            onClick={loadGeofences}
            title="Reload geofences"
          >
            Reload Geofences
          </button>
        </div>
      </div>
    </div>
  );
}
