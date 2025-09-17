 /**
  * PUBLIC_INTERFACE
  * Telemetry API helper and utilities for ingestion (POST /telemetry) and queries (GET /telemetry).
  * - All requests attach JWT via Authorization header (services/api.js handles this).
  * - Supports filtering by animalId, deviceId, start, end, limit.
  * - Normalizes common response formats.
  */

import { apiGet, apiPost } from "./api";

/**
 * Normalize telemetry API responses to an array of points.
 * Accepts:
 * - { data: [...] }
 * - { items: [...] }
 * - [ ... ]
 */
function normalizeListResponse(res) {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.items)) return res.items;
  return [];
}

// PUBLIC_INTERFACE
export const telemetryApi = {
  /**
   * PUBLIC_INTERFACE
   * ingest - POST /telemetry
   * Payload: { animalId?, deviceId?, lat, lng, ts?, speed?, battery?, ... }
   * Accepts single object or an array of points.
   */
  async ingest(payload) {
    return apiPost("/telemetry", payload);
  },

  /**
   * PUBLIC_INTERFACE
   * list - GET /telemetry with optional filters
   * filters: { animalId?, deviceId?, start?, end?, limit? }
   * Dates should be ISO strings (UTC). Use helpers below to format if needed.
   */
  async list(filters = {}) {
    const params = new URLSearchParams(
      Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== undefined && v !== null && v !== "")
      )
    ).toString();
    const q = params ? `?${params}` : "";
    const res = await apiGet(`/telemetry${q}`);
    return normalizeListResponse(res);
  },
};

/**
 * PUBLIC_INTERFACE
 * toIsoUTC - Convert a Date or number (ms) into ISO UTC string for API queries
 */
export function toIsoUTC(d) {
  const date = d instanceof Date ? d : new Date(d);
  return date.toISOString();
}

/**
 * PUBLIC_INTERFACE
 * lastHoursRange - Returns { start, end } ISO strings for the past N hours up to now.
 */
export function lastHoursRange(hours = 24) {
  const end = new Date();
  const start = new Date(end.getTime() - hours * 60 * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString() };
}

/**
 * PUBLIC_INTERFACE
 * formatTimeLabel - Format an ISO date/time for UI labels (HH:MM:SS)
 */
export function formatTimeLabel(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch {
    return iso;
  }
}
