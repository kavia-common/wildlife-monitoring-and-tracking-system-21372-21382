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
export async function apiGet(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "GET",
    headers: { ...(options.headers || {}), ...authHeaders() },
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
export async function apiPost(path, body, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
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
export async function apiPut(path, body, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
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
export async function apiDelete(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "DELETE",
    headers: { ...(options.headers || {}), ...authHeaders() },
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
