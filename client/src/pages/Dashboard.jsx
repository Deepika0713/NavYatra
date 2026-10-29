import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getTrips } from "../services/tripService";
import "./Dashboard.css";

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);
}

function getTripTimestamp(trip) {
  const timestamp = new Date(
    trip.updatedAt || trip.createdAt || trip.generatedAt || 0
  ).getTime();

  return Number.isFinite(timestamp) ? timestamp : 0;
}

export default function Dashboard() {
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadTrip() {
      try {
        setLoading(true);
        setError("");

        const trips = await getTrips();

        if (cancelled) return;

        const latestTrip =
          [...trips].sort(
            (a, b) => getTripTimestamp(b) - getTripTimestamp(a)
          )[0] || null;

        setTrip(latestTrip);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load your trips.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadTrip();

    return () => {
      cancelled = true;
    };
  }, []);

  const places = Array.isArray(trip?.places) ? trip.places : [];
  const hasTrip = places.length > 0;

  const totalStops = places.length;

  const totalEntryFees = places.reduce(
    (total, place) => total + (Number(place.entry_fee) || 0),
    0
  );

  const suggestions = [
    {
      name: "Check opening hours",
      detail: "Verify attraction timings before leaving, especially on holidays.",
    },
    {
      name: "Review your budget",
      detail: "Keep extra money for meals, parking, and unexpected expenses.",
    },
    {
      name: "Plan travel between stops",
      detail: "Allow enough time for traffic and exploring each destination.",
    },
  ];

  if (loading) {
    return (
      <main className="container section dashboard-page">
        <p role="status">Loading your trips...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="container section dashboard-page">
        <section className="card card-pad dashboard-empty">
          <h1>Unable to load your dashboard</h1>
          <p role="alert" className="muted">{error}</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="container section dashboard-page">
      <section className="section-head dashboard-heading">
        <div>
          <p className="dashboard-eyebrow">YOUR JOURNEY, AT A GLANCE</p>
          <h1>Trip Dashboard</h1>
          <p className="muted">
            Your latest saved trip, destinations, and travel insights.
          </p>
        </div>

        <Link to="/places" className="btn btn-secondary">
          Plan Another Trip
        </Link>
      </section>

      {!hasTrip ? (
        <section className="card card-pad dashboard-empty">
          <div className="dashboard-empty-icon">✧</div>
          <h2>No generated itinerary yet</h2>
          <p className="muted">
            Select attractions in the Trip Planner to see your trip
            summary, stops, and travel insights here.
          </p>
          <Link to="/planner" className="btn btn-primary">
            Open Trip Planner
          </Link>
        </section>
      ) : (
        <>
          <section className="dashboard-kpis">
            <article className="card card-pad dashboard-kpi">
              <span className="muted">Total Stops</span>
              <strong>{totalStops}</strong>
              <span className="dashboard-kpi-note">
                Selected destinations
              </span>
            </article>

            <article className="card card-pad dashboard-kpi">
              <span className="muted">Trip Status</span>
              <strong>
                {trip.status
                  ? trip.status.charAt(0).toUpperCase() + trip.status.slice(1)
                  : "Draft"}
              </strong>
              <span className="dashboard-kpi-note">Latest saved trip</span>
              <Link to="/itinerary" className="dashboard-inline-link">
                View itinerary →
              </Link>
            </article>

            <article className="card card-pad dashboard-kpi">
              <span className="muted">Entry Fees</span>
              <strong>{formatCurrency(totalEntryFees)}</strong>
              <span className="dashboard-kpi-note">
                Sum of listed attraction fees
              </span>
            </article>
          </section>

          <section className="dashboard-content-grid">
            <article className="card card-pad dashboard-panel">
              <div className="dashboard-panel-heading">
                <div>
                  <p className="dashboard-eyebrow">YOUR SELECTED PLACES</p>
                  <h2>Stops Overview</h2>
                </div>
                <span className="dashboard-count">{totalStops} stops</span>
              </div>

              <div className="dashboard-stops">
                {places.map((place, index) => (
                  <article
                    className="dashboard-stop"
                    key={place._id || place.id || `${place.name || "place"}-${index}`}
                  >
                    <span className="dashboard-stop-number">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <div className="dashboard-stop-info">
                      <h3>{place.name || "Unnamed destination"}</h3>
                      <p className="muted">
                        {[place.city, place.state].filter(Boolean).join(", ") ||
                          "Location details unavailable"}
                      </p>
                      <p className="dashboard-stop-meta">
                        Entry fee: {formatCurrency(place.entry_fee)}
                      </p>
                      <p className="dashboard-stop-meta">
                        Suggested visit:{" "}
                        {place.average_visit_duration
                          ? `${place.average_visit_duration} min`
                          : "Not available"}
                      </p>
                    </div>
                  </article>
                ))}
              </div>

              <Link
                to="/itinerary"
                className="btn btn-primary dashboard-view-btn"
              >
                View Full Itinerary
              </Link>
            </article>

            <article className="card card-pad dashboard-panel">
              <p className="dashboard-eyebrow">TRAVEL SMARTER</p>
              <h2>Smart Suggestions</h2>

              <div className="dashboard-suggestions">
                {suggestions.map((suggestion) => (
                  <article
                    className="dashboard-suggestion"
                    key={suggestion.name}
                  >
                    <span className="dashboard-suggestion-icon">✦</span>
                    <div>
                      <h3>{suggestion.name}</h3>
                      <p className="muted">{suggestion.detail}</p>
                    </div>
                  </article>
                ))}
              </div>

              {trip.needGuide && (
                <div className="dashboard-notice">
                  <strong>Guide requested</strong>
                  <p>
                    Check guide availability and charges before confirming
                    your visit. Live guide availability has not yet been
                    verified.
                  </p>
                </div>
              )}
            </article>
          </section>
        </>
      )}
    </main>
  );
}
