 /**
  * PUBLIC_INTERFACE
  * alertsApi - helpers for alerts and geofences, including WebSocket live streaming.
  *
  * Exposes:
  * - alertsApi.list({ type?, severity?, start?, end?, status?, limit? })
  * - alertsApi.acknowledge(id)
  * - alertsApi.wsConnect(onMessage, onOpen?, onError?)
  *
  * Geofence:
  * - geofenceApi.list()
  * - geofenceApi.create({ name, type: 'polygon'|'circle', coordinates: [[lat,lng],...], radius? })
  * - geofenceApi.remove(id)
  * - geofenceApi.assign({ geofenceId, animalId? , deviceId? })
  */
import { apiGet, apiPost, apiDelete } from "./api";

// PUBLIC_INTERFACE
export const alertsApi = {
  // PUBLIC_INTERFACE
  async list(filters = {}) {
    const params = new URLSearchParams(
      Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== undefined && v !== null && v !== "")
      )
    ).toString();
    const q = params ? `?${params}` : "";
    return apiGet(`/alerts${q}`);
  },
  // PUBLIC_INTERFACE
  async acknowledge(id) {
    if (!id) throw new Error("Alert id is required");
    // Try POST /alerts/:id/ack or PATCH /alerts/:id
    try {
      return await apiPost(`/alerts/${id}/ack`, {});
    } catch {
      return await apiPost(`/alerts/${id}`, { status: "acknowledged" });
    }
  },
  // PUBLIC_INTERFACE
  wsConnect(onMessage, onOpen, onError) {
    /**
     * Attempt to connect to a WebSocket for live alerts.
     * Tries common paths: /ws/alerts, /alerts/ws
     * Uses REACT_APP_API_URL to derive ws(s) URL.
     */
    const base = process.env.REACT_APP_API_URL || "http://localhost:3001";
    const wsBase = base.replace(/^http/i, "ws");
    const candidates = [`${wsBase}/ws/alerts`, `${wsBase}/alerts/ws`];

    let socket = null;
    let idx = 0;

    function tryNext() {
      if (idx >= candidates.length) return;
      const url = candidates[idx++];
      try {
        socket = new WebSocket(url);
      } catch (e) {
        if (onError) onError(e);
        tryNext();
        return;
      }
      socket.onopen = (ev) => {
        if (onOpen) onOpen(ev);
      };
      socket.onerror = (ev) => {
        if (onError) onError(ev);
      };
      socket.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data);
          onMessage?.(data);
        } catch {
          // pass raw
          onMessage?.(ev.data);
        }
      };
      socket.onclose = () => {
        // no auto-retry here; caller may handle re-connect
      };
    }
    tryNext();

    return {
      close: () => {
        try {
          socket?.close();
        } catch {
          // ignore
        }
      },
      socket: () => socket,
    };
  },
};

// PUBLIC_INTERFACE
export const geofenceApi = {
  // PUBLIC_INTERFACE
  async list() {
    return apiGet(`/geofence`);
  },
  // PUBLIC_INTERFACE
  async create(payload) {
    // Expecting: { name, type: 'polygon'|'circle', coordinates: [[lat,lng],...], radius? }
    return apiPost(`/geofence`, payload);
  },
  // PUBLIC_INTERFACE
  async remove(id) {
    if (!id) throw new Error("Geofence id is required");
    return apiDelete(`/geofence/${id}`);
  },
  // PUBLIC_INTERFACE
  async assign(payload) {
    // { geofenceId, animalId?, deviceId? }
    return apiPost(`/geofence/assign`, payload);
  },
};
