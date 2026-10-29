
const API_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

const TRIP_CACHE_KEYS = [
  "navyatra.selectedPlaceIds",
  "navyatra.itinerary",
  "navyatra.activeTripId",
];

function clearTripCache() {
  TRIP_CACHE_KEYS.forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}/api/auth${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong.");
  }

  return data;
}

export async function registerUser({ name, email, password }) {
  return request("/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

export async function loginUser({ email, password }) {
  const data = await request("/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  // Remove cached data from the previous account.
  clearTripCache();

  return data;
}

export function getCurrentUser() {
  return request("/me");
}

export async function logoutUser() {
  const data = await request("/logout", {
    method: "POST",
  });

  clearTripCache();

  return data;
}
