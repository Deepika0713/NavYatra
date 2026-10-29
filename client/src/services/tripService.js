
const API_BASE = (
  import.meta.env.VITE_API_URL || ""
).replace(/\/$/, "");

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}/api/trips${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Unable to process your trip.");
  }

  return data;
}

// Fetch the current user's trips.
export async function getTrips(status) {
  const query = status
    ? `?status=${encodeURIComponent(status)}`
    : "";

  const data = await request(query);
  return data.trips || [];
}

// Save a new trip to MongoDB.
export async function createTrip(trip) {
  const data = await request("", {
    method: "POST",
    body: JSON.stringify(trip),
  });

  return data.trip;
}

// Update an existing MongoDB trip.
export async function updateTrip(id, updates) {
  const data = await request(`/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });

  return data.trip;
}

// Delete one of the current user's trips.
export async function deleteTrip(id) {
  return request(`/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

// Clear this user's saved trip history.
export async function clearTripHistory() {
  return request("/history", {
    method: "DELETE",
  });
}
