const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function fetchDonors() {
  const response = await fetch(`${API_URL}/donors`);

  if (!response.ok) {
    throw new Error("Failed to fetch donors");
  }

  return response.json();
}

export async function fetchBloodInventory() {
  const response = await fetch(`${API_URL}/blood-inventory`);

  if (!response.ok) {
    throw new Error("Failed to fetch blood inventory");
  }

  return response.json();
}
