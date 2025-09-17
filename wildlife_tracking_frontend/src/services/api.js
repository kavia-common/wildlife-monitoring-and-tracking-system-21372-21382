/**
 * Simple API helper placeholder. Replace BASE_URL and add real calls later.
 */
const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

export async function apiGet(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, { ...options, method: "GET" });
  if (!res.ok) throw new Error(`GET ${path} failed`);
  return res.json();
}

export async function apiPost(path, body, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    body: JSON.stringify(body),
    ...options,
  });
  if (!res.ok) throw new Error(`POST ${path} failed`);
  return res.json();
}
