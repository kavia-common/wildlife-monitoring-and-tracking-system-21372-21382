 /**
  * API helper with base URL and token support.
  * Uses REACT_APP_API_URL or defaults to http://localhost:3001
  */

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

/**
 * Get Authorization headers using stored token.
 */
function authHeaders() {
  const token = localStorage.getItem("at_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * PUBLIC_INTERFACE
 * apiGet - Perform an authenticated GET request
 */
async function apiGet(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "GET",
    headers: { Accept: "application/json", ...(options.headers || {}), ...authHeaders() },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`GET ${path} failed: ${res.status} ${text}`);
  }
  return res.json();
}

/**
 * PUBLIC_INTERFACE
 * apiPost - Perform a JSON POST request (adds Authorization if token exists)
 */
async function apiPost(path, body, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options.headers || {}),
      ...authHeaders(),
    },
    body: JSON.stringify(body),
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`POST ${path} failed: ${res.status} ${text}`);
  }
  return res.json();
}

/**
 * PUBLIC_INTERFACE
 * apiPut - Perform a JSON PUT request
 */
async function apiPut(path, body, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options.headers || {}),
      ...authHeaders(),
    },
    body: JSON.stringify(body),
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`PUT ${path} failed: ${res.status} ${text}`);
  }
  return res.json();
}

/**
 * PUBLIC_INTERFACE
 * apiDelete - Perform a DELETE request
 */
async function apiDelete(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "DELETE",
    headers: { Accept: "application/json", ...(options.headers || {}), ...authHeaders() },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`DELETE ${path} failed: ${res.status} ${text}`);
  }
  try {
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * PUBLIC_INTERFACE
 * animalsApi - Convenience wrapper for Animals CRUD
 * Adapts to common REST paths:
 * - list:   GET /animals
 * - detail: GET /animals/:id
 * - create: POST /animals
 * - update: PUT /animals/:id
 * - remove: DELETE /animals/:id
 */
const animalsApi = {
  // PUBLIC_INTERFACE
  async list(params = {}) {
    const query = new URLSearchParams(params).toString();
    const q = query ? `?${query}` : "";
    return apiGet(`/animals${q}`);
  },
  // PUBLIC_INTERFACE
  async detail(id) {
    if (!id) throw new Error("Animal id is required");
    return apiGet(`/animals/${id}`);
  },
  // PUBLIC_INTERFACE
  async create(payload) {
    return apiPost(`/animals`, payload);
  },
  // PUBLIC_INTERFACE
  async update(id, payload) {
    if (!id) throw new Error("Animal id is required");
    return apiPut(`/animals/${id}`, payload);
  },
  // PUBLIC_INTERFACE
  async remove(id) {
    if (!id) throw new Error("Animal id is required");
    return apiDelete(`/animals/${id}`);
  },
};

/**
 * PUBLIC_INTERFACE
 * devicesApi - Convenience wrapper for Devices CRUD and assignment
 * Expected REST paths:
 * - list:    GET /devices
 * - detail:  GET /devices/:id
 * - create:  POST /devices
 * - update:  PUT /devices/:id
 * - remove:  DELETE /devices/:id
 * - assign:  PUT /devices/:id/assign   { animalId }
 *   (If backend does not support this path, adjust as needed.)
 */
const devicesApi = {
  // PUBLIC_INTERFACE
  async list(params = {}) {
    const query = new URLSearchParams(params).toString();
    const q = query ? `?${query}` : "";
    return apiGet(`/devices${q}`);
  },
  // PUBLIC_INTERFACE
  async detail(id) {
    if (!id) throw new Error("Device id is required");
    return apiGet(`/devices/${id}`);
  },
  // PUBLIC_INTERFACE
  async create(payload) {
    return apiPost(`/devices`, payload);
  },
  // PUBLIC_INTERFACE
  async update(id, payload) {
    if (!id) throw new Error("Device id is required");
    return apiPut(`/devices/${id}`, payload);
  },
  // PUBLIC_INTERFACE
  async remove(id) {
    if (!id) throw new Error("Device id is required");
    return apiDelete(`/devices/${id}`);
  },
  // PUBLIC_INTERFACE
  async assignToAnimal(id, animalId) {
    if (!id) throw new Error("Device id is required");
    if (!animalId) throw new Error("animalId is required");
    try {
      return await apiPut(`/devices/${id}/assign`, { animalId });
    } catch {
      // Fallback: backend may accept animalId on update
      return apiPut(`/devices/${id}`, { animalId });
    }
  },
};

// PUBLIC_INTERFACE
export { apiGet, apiPost, apiPut, apiDelete, animalsApi, devicesApi };
