 /** 
  * PUBLIC_INTERFACE
  * analyticsApi - Helpers for analytics endpoints.
  * 
  * Endpoints expected:
  * - POST /analytics/movement-predict { animalId?, deviceId?, start?, end?, horizon?, steps? } 
  *     -> { path: [{ lat, lng, ts } ...] } | [{ lat, lng, ts } ...]
  * - GET  /analytics/home-range?animalId=&deviceId=&start=&end=
  *     -> { polygon: [[lat,lng],...], centroid?: [lat,lng], method?: string }
  * - POST /analytics/classify (telemetry) { points: [...] }
  *     -> { results: [{ ts, label, confidence, ... }] }
  * - POST /analytics/classify-image (camera image URLs) { images: [ { id, url } ] }
  *     -> { results: [{ id, url, label, confidence, ... }] }
  */
import { apiGet, apiPost } from "./api";

// Normalize polygon: ensure array of [lat,lng]
function normalizePolygon(res) {
  const polygon =
    res?.polygon ||
    res?.data?.polygon ||
    res?.coordinates ||
    res?.data?.coordinates ||
    res;
  if (!polygon) return [];
  if (Array.isArray(polygon) && Array.isArray(polygon[0])) return polygon;
  // maybe geojson
  const gj = res?.geojson || res?.data?.geojson || res?.feature || res?.data?.feature;
  if (gj?.geometry?.type === "Polygon") {
    const coords = gj.geometry.coordinates?.[0] || [];
    return coords.map(([lng, lat]) => [lat, lng]);
  }
  return [];
}

// Normalize path: array of { lat,lng,ts? }
function normalizePath(res) {
  if (!res) return [];
  const arr = res?.path || res?.data?.path || (Array.isArray(res) ? res : res?.data);
  const list = Array.isArray(arr) ? arr : [];
  return list
    .map((p) => ({
      lat: Number(p.lat ?? p.latitude),
      lng: Number(p.lng ?? p.longitude),
      ts: p.ts || p.timestamp || null,
    }))
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
}

// PUBLIC_INTERFACE
export const analyticsApi = {
  /** 
   * PUBLIC_INTERFACE
   * movementPredict - Predict future movement path.
   */
  async movementPredict(payload) {
    const res = await apiPost("/analytics/movement-predict", payload || {});
    return normalizePath(res);
  },

  /** 
   * PUBLIC_INTERFACE
   * homeRange - Get home range polygon for filters.
   */
  async homeRange(filters = {}) {
    const params = new URLSearchParams(
      Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== undefined && v !== null && v !== "")
      )
    ).toString();
    const q = params ? `?${params}` : "";
    const res = await apiGet(`/analytics/home-range${q}`);
    return {
      polygon: normalizePolygon(res),
      centroid: res?.centroid || res?.data?.centroid || null,
      method: res?.method || res?.data?.method || "unknown",
    };
  },

  /** 
   * PUBLIC_INTERFACE
   * classifyTelemetry - Classify behavior given telemetry points.
   */
  async classifyTelemetry(points = []) {
    const res = await apiPost("/analytics/classify", { points });
    const results = res?.results || res?.data?.results || [];
    return Array.isArray(results) ? results : [];
  },

  /** 
   * PUBLIC_INTERFACE
   * classifyImages - Image classification for camera images by URL.
   */
  async classifyImages(images = []) {
    const res = await apiPost("/analytics/classify-image", { images });
    const results = res?.results || res?.data?.results || [];
    return Array.isArray(results) ? results : [];
  },
};
