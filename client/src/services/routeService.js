
const OSRM_URL = "https://router.project-osrm.org/route/v1/driving";

export async function getDrivingRoute(origin, places = []) {
  if (!origin || origin.latitude == null || origin.longitude == null) {
    throw new Error("Please select a starting location first.");
  }

  if (!Array.isArray(places) || places.length === 0) {
    throw new Error("Please select at least one destination.");
  }

  const stops = [
    {
      name: origin.label || "Starting location",
      lat: Number(origin.latitude),
      lng: Number(origin.longitude),
    },
    ...places.map((place) => ({
      name: place.name || "Destination",
      lat: Number(place.coordinates?.lat),
      lng: Number(place.coordinates?.lng),
    })),
  ];

  for (const stop of stops) {
    if (
      !Number.isFinite(stop.lat) ||
      !Number.isFinite(stop.lng) ||
      Math.abs(stop.lat) > 90 ||
      Math.abs(stop.lng) > 180
    ) {
      throw new Error(`Valid coordinates are missing for ${stop.name}.`);
    }
  }

  const coordinates = stops
    .map((stop) => `${stop.lng},${stop.lat}`)
    .join(";");

  const url =
    `${OSRM_URL}/${coordinates}` +
    "?overview=full&geometries=geojson&steps=false";

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("The routing service is temporarily unavailable.");
  }

  const data = await response.json();

  if (data.code !== "Ok" || !data.routes?.length) {
    throw new Error("No connected driving route was found.");
  }

  const route = data.routes[0];

  return {
    distanceKm: Number((route.distance / 1000).toFixed(1)),
    durationMinutes: Math.round(route.duration / 60),

    // OSRM returns [longitude, latitude].
    // Leaflet expects [latitude, longitude].
    routeCoordinates: route.geometry.coordinates.map(
      ([longitude, latitude]) => [latitude, longitude]
    ),

    legs: (route.legs || []).map((leg, index) => ({
      from: stops[index].name,
      to: stops[index + 1].name,
      distanceKm: Number((leg.distance / 1000).toFixed(1)),
      durationMinutes: Math.round(leg.duration / 60),
    })),
  };
}
