
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Home.css";

const ITINERARY_KEY = "navyatra.itinerary";
const HISTORY_KEY = "navyatra.tripHistory";
const SELECTED_KEY = "navyatra.selectedPlaceIds";

function readJSON(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "null");
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function formatDate(value) {
  if (!value) return "Date not selected";

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

export default function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [history, setHistory] = useState(() =>
    readJSON(HISTORY_KEY, [])
  );
  const [draft, setDraft] = useState(() =>
    readJSON(ITINERARY_KEY, null)
  );
  const [selectedIds, setSelectedIds] = useState(() =>
    readJSON(SELECTED_KEY, [])
  );
  const [loggingOut, setLoggingOut] = useState(false);
  const [notice, setNotice] = useState("");

  const refreshHome = useCallback(() => {
    setHistory(readJSON(HISTORY_KEY, []));
    setDraft(readJSON(ITINERARY_KEY, null));
    setSelectedIds(readJSON(SELECTED_KEY, []));
  }, []);

  useEffect(() => {
    refreshHome();

    window.addEventListener("focus", refreshHome);
    window.addEventListener("storage", refreshHome);

    return () => {
      window.removeEventListener("focus", refreshHome);
      window.removeEventListener("storage", refreshHome);
    };
  }, [refreshHome]);

  function handleFindPlaces(event) {
    event.preventDefault();

    if (!state.trim() || !city.trim()) return;

    const params = new URLSearchParams({
      state: state.trim(),
      city: city.trim(),
    });

    navigate(`/places?${params.toString()}`);
  }

  async function handleLogout() {
    setLoggingOut(true);

    try {
      await logout();
      navigate("/login", { replace: true });
    } catch {
      setNotice("Unable to log out right now. Please try again.");
      setLoggingOut(false);
    }
  }

  function clearHistory() {
    const confirmed = window.confirm(
      "Clear your saved trip history from this browser? This cannot be undone."
    );

    if (!confirmed) return;

    localStorage.removeItem(HISTORY_KEY);
    setHistory([]);
    setNotice("Saved trip history cleared.");
  }

  function discardDraft() {
    const confirmed = window.confirm(
      "Discard your current trip plan and selected places?"
    );

    if (!confirmed) return;

    localStorage.removeItem(ITINERARY_KEY);
    localStorage.removeItem(SELECTED_KEY);

    setDraft(null);
    setSelectedIds([]);
    setNotice("Your unfinished trip plan was discarded.");
  }

  const firstName =
    user?.name?.trim().split(/\s+/)[0] || "Traveller";

  const draftPlaces = Array.isArray(draft?.places)
    ? draft.places
    : [];

  const savedTrips = Array.isArray(history) ? history : [];

  const hasDraft =
    draftPlaces.length > 0 || selectedIds.length > 0;

  return (
    <main className="container section navy-home">
      {notice && (
        <div className="nh-notice" role="status">
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice("")}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      )}

      {/* Hero */}
      <section className="nh-hero">
        <div className="nh-hero-copy">
          <div className="nh-brand-row">
            <img src="/Logo.png" alt="" className="nh-hero-logo" />
            <span>NavYatra</span>
          </div>

          <p className="nh-pill">
            YOUR NEXT JOURNEY STARTS HERE
          </p>

          <h1>
            Welcome, <span className="nh-welcome-name">{firstName}</span>
            <br />
            Let's explore India.
          </h1>

          <p className="nh-hero-description">
            Discover extraordinary places, plan smarter routes,
            and turn your travel bucket list into a realistic,
            time-aware journey.
          </p>

          <div className="nh-hero-actions">
            <Link to="/places" className="nh-button nh-button-primary">
              Explore places <span>↗</span>
            </Link>

            <Link to="/planner" className="nh-button nh-button-outline">
              Plan a trip
            </Link>
          </div>

          <div className="nh-progress" aria-label="How NavYatra works">
            <span className="nh-progress-active">01</span>
            <span>02</span>
            <span>03</span>
            <span>04</span>
            <span>05</span>
          </div>
          <p className="nh-progress-label">
            DISCOVER · SELECT · PLAN · EXPLORE
          </p>
        </div>

        <div className="nh-location-panel">
          <div className="nh-panel-top">
            <span className="nh-panel-icon">⌖</span>
            <div>
              <h2>Start from your location</h2>
              <p>
                Choose a city and discover attractions for your next adventure.
              </p>
            </div>
          </div>

          <form onSubmit={handleFindPlaces} className="nh-location-form">
            <div className="nh-field">
              <label htmlFor="nh-state">State</label>
              <select
                id="nh-state"
                value={state}
                onChange={(event) => setState(event.target.value)}
                required
              >
                <option value="">Select state</option>
                <option value="Andhra Pradesh">Andhra Pradesh</option>
                <option value="Rajasthan">Rajasthan</option>
                <option value="Kerala">Kerala</option>
                <option value="Telangana">Telangana</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Tamil Nadu">Tamil Nadu</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Goa">Goa</option>
                <option value="Uttar Pradesh">Uttar Pradesh</option>
                <option value="Delhi">Delhi</option>
              </select>
            </div>

            <div className="nh-field">
              <label htmlFor="nh-city">City</label>
              <input
                id="nh-city"
                value={city}
                onChange={(event) => setCity(event.target.value)}
                placeholder="e.g. Vijayawada"
                required
              />
            </div>

            <button
              className="nh-button nh-button-primary nh-find-button"
              type="submit"
            >
              Find places <span>→</span>
            </button>
          </form>

          <div className="nh-panel-footer">
            <span>✦</span>
            Your journey, thoughtfully planned.
          </div>
        </div>
      </section>

      {/* How NavYatra helps */}
      <section className="nh-section">
        <div className="nh-section-heading">
          <div>
            <p className="nh-eyebrow">TRAVEL WITH A PLAN</p>
            <h2>Make every journey count.</h2>
            <p>
              Spend less time figuring things out and more time
              experiencing the places you love.
            </p>
          </div>
          <Link to="/places" className="nh-text-link">
            Discover places <span>↗</span>
          </Link>
        </div>

        <div className="nh-feature-grid">
          <article className="nh-feature-card">
            <span className="nh-feature-number">01</span>
            <span className="nh-feature-icon">⌖</span>
            <h3>Discover nearby</h3>
            <p>
              Explore attractions by city, state, category, and
              your travel preferences.
            </p>
          </article>

          <article className="nh-feature-card">
            <span className="nh-feature-number">02</span>
            <span className="nh-feature-icon">↗</span>
            <h3>Plan smarter routes</h3>
            <p>
              Select destinations, choose your start time, and
              review route and visit-time estimates.
            </p>
          </article>

          <article className="nh-feature-card">
            <span className="nh-feature-number">03</span>
            <span className="nh-feature-icon">₹</span>
            <h3>Travel with a budget</h3>
            <p>
              Review listed entry fees, compare travel options,
              and keep your trip budget in mind.
            </p>
          </article>

          <article className="nh-feature-card">
            <span className="nh-feature-number">04</span>
            <span className="nh-feature-icon">✦</span>
            <h3>Keep plans organized</h3>
            <p>
              Return to your current plan and keep track of saved
              trips from your personal travel space.
            </p>
          </article>
        </div>
      </section>

      {/* Continue draft */}
      <section className="nh-section">
        <div className="nh-section-heading">
          <div>
            <p className="nh-eyebrow">PICK UP WHERE YOU LEFT OFF</p>
            <h2>Your journey in progress</h2>
            <p>
              Continue planning without starting from scratch.
            </p>
          </div>
        </div>

        {hasDraft ? (
          <article className="nh-trip-card nh-draft-card">
            <div className="nh-trip-card-main">
              <span className="nh-status nh-status-draft">
                DRAFT / CURRENT PLAN
              </span>
              <h3>
                {draft?.travelDate
                  ? `Trip planned for ${formatDate(draft.travelDate)}`
                  : "Your next adventure"}
              </h3>
              <p>
                {draftPlaces.length} place
                {draftPlaces.length === 1 ? "" : "s"} in your current itinerary
                {selectedIds.length > 0
                  ? ` · ${selectedIds.length} selected place IDs`
                  : ""}
              </p>
              {draft?.startTime && (
                <p className="nh-trip-meta">
                  Start time: {draft.startTime}
                  {draft?.travelMode
                    ? ` · Travel: ${draft.travelMode}`
                    : ""}
                </p>
              )}
            </div>

            <div className="nh-trip-actions">
              <Link to="/planner" className="nh-button nh-button-primary">
                Continue planning →
              </Link>
              {draft && (
                <Link to="/itinerary" className="nh-button nh-button-light">
                  View itinerary
                </Link>
              )}
              <button
                type="button"
                className="nh-danger-link"
                onClick={discardDraft}
              >
                Discard draft
              </button>
            </div>
          </article>
        ) : (
          <article className="nh-empty-card">
            <span className="nh-empty-icon">✧</span>
            <div>
              <h3>No trip in progress yet</h3>
              <p>
                Start by choosing a few destinations. Your current
                browser-saved plan will appear here.
              </p>
            </div>
            <Link to="/planner" className="nh-button nh-button-primary">
              Start planning →
            </Link>
          </article>
        )}
      </section>

      {/* Previous trips */}
      <section className="nh-section">
        <div className="nh-section-heading">
          <div>
            <p className="nh-eyebrow">YOUR TRAVEL JOURNAL</p>
            <h2>Previous trips</h2>
            <p>
              Revisit journeys you've saved in your travel history.
            </p>
          </div>

          {savedTrips.length > 0 && (
            <button
              type="button"
              className="nh-text-link nh-clear-button"
              onClick={clearHistory}
            >
              Clear history ×
            </button>
          )}
        </div>

        {savedTrips.length > 0 ? (
          <div className="nh-history-grid">
            {savedTrips.map((trip, index) => {
              const tripPlaces = Array.isArray(trip.places)
                ? trip.places
                : [];

              return (
                <article
                  className="nh-history-card"
                  key={trip.id || trip._id || `${trip.generatedAt}-${index}`}
                >
                  <div className="nh-history-top">
                    <span className="nh-history-icon">✦</span>
                    <span className="nh-status nh-status-saved">SAVED TRIP</span>
                  </div>

                  <h3>
                    {trip.title ||
                      trip.name ||
                      `India adventure ${savedTrips.length - index}`}
                  </h3>

                  <p>
                    {tripPlaces.length} place
                    {tripPlaces.length === 1 ? "" : "s"}
                    {trip.travelDate
                      ? ` · ${formatDate(trip.travelDate)}`
                      : ""}
                  </p>

                  <p className="nh-history-cost">
                    Entry fees: {formatCurrency(
                      tripPlaces.reduce(
                        (total, place) =>
                          total + Number(place.entry_fee || 0),
                        0
                      )
                    )}
                  </p>

                  <Link to="/dashboard" className="nh-text-link">
                    Open dashboard →
                  </Link>
                </article>
              );
            })}
          </div>
        ) : (
          <article className="nh-empty-card nh-history-empty">
            <span className="nh-empty-icon">↗</span>
            <div>
              <h3>Your travel journal starts here</h3>
              <p>
                Your saved-trip history is empty. Once trips are saved
                to the history collection, they will be listed here.
              </p>
            </div>
            <Link to="/planner" className="nh-button nh-button-light">
              Plan your first trip
            </Link>
          </article>
        )}
      </section>

      {/* Account / logout */}
      <section className="nh-account-bar">
        <div>
          <span className="nh-account-avatar">
            {firstName.charAt(0).toUpperCase()}
          </span>
          <div>
            <p className="nh-eyebrow">YOUR NAVYATRA ACCOUNT</p>
            <strong>{user?.name || "Traveller"}</strong>
            <span>{user?.email || ""}</span>
          </div>
        </div>

        <button
          type="button"
          className="nh-button nh-logout-button"
          onClick={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut ? "Logging out…" : "Log out ↗"}
        </button>
      </section>

      <footer className="nh-footer">
        <span>NavYatra</span>
        <p>Discover more. Plan better. Travel India.</p>
      </footer>
    </main>
  );
}
