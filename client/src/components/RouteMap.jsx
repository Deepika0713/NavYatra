
export default function RouteMap({
  origin,
  places = [],
}) {
  const validPlaces = places.filter((place) => {
    const lat = Number(place.coordinates?.lat);
    const lng = Number(place.coordinates?.lng);

    return (
      place.coordinates?.lat != null &&
      place.coordinates?.lng != null &&
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      Math.abs(lat) <= 90 &&
      Math.abs(lng) <= 180
    );
  });

  const hasOrigin =
    origin?.latitude != null &&
    origin?.longitude != null &&
    Number.isFinite(Number(origin.latitude)) &&
    Number.isFinite(Number(origin.longitude)) &&
    Math.abs(Number(origin.latitude)) <= 90 &&
    Math.abs(Number(origin.longitude)) <= 180;

  const originLabel = hasOrigin
    ? `${origin.latitude},${origin.longitude}`
    : "";

  // Google Maps Embed search view for the selected destinations.
  const destinationQuery = validPlaces
    .map((place) =>
      `${place.name || "Tourist attraction"}, ${place.city || ""}, ${place.state || ""}`
    )
    .join(" | ");

  const mapQuery = hasOrigin
    ? `${originLabel} to ${destinationQuery}`
    : destinationQuery;

  const embedUrl = mapQuery
    ? `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`
    : "https://maps.google.com/maps?q=India%20tourist%20attractions&output=embed";

  const directionsUrl =
    hasOrigin && validPlaces.length > 0
      ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(originLabel)}&destination=${encodeURIComponent(
          `${validPlaces[validPlaces.length - 1].name}, ${validPlaces[validPlaces.length - 1].city || ""}, ${validPlaces[validPlaces.length - 1].state || ""}`
        )}&waypoints=${encodeURIComponent(
          validPlaces
            .slice(0, -1)
            .map((place) =>
              `${place.name}, ${place.city || ""}, ${place.state || ""}`
            )
            .join("|")
        )}&travelmode=driving`
      : "https://www.google.com/maps";

  return (
    <section className="card card-pad route-map-card">
      <div className="route-map-heading">
        <div>
          <h2>Trip Route</h2>
          <p className="muted">
            {validPlaces.length} selected destination
            {validPlaces.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <div className="route-map-frame">
        <iframe
          title="NavYatra Google Maps route"
          src={embedUrl}
          className="route-map-iframe"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>

      <div className="route-map-legend">
        <span>Google Maps</span>
        <a
          href={directionsUrl}
          target="_blank"
          rel="noreferrer"
          className="btn btn-primary"
        >
          Open directions ↗
        </a>
      </div>
    </section>
  );
}
