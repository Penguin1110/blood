const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function fetchJson(path) {
  const response = await fetch(`${API_URL}${path}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}`);
  }

  return response.json();
}

export function fetchHealth() {
  return fetchJson("/health");
}

export function fetchUsers() {
  return fetchJson("/users");
}

export function fetchDonations() {
  return fetchJson("/donations");
}

export function fetchSites() {
  return fetchJson("/sites");
}

export function fetchRewards() {
  return fetchJson("/rewards");
}
