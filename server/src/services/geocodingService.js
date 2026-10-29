
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

async function geocodeAddress(address) {
  const query = address.trim();

  if (!query) {
    throw new Error("Please enter a starting location.");
  }

  const url = new URL(NOMINATIM_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "in");

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "NavYatra/1.0",
    },
  });

  if (!response.ok) {
    throw new Error("The location service is temporarily unavailable.");
  }

  const results = await response.json();

  if (!results.length) {
    throw new Error(
      "Location not found. Try adding the city and state."
    );
  }

  return {
    label: results[0].display_name,
    latitude: Number(results[0].lat),
    longitude: Number(results[0].lon),
    source: "manual",
  };
}

module.exports = { geocodeAddress };
