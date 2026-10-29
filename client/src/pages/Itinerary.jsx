
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import "./Itinerary.css";

import RouteMap from "../components/RouteMap";
import { getDrivingRoute } from "../services/routeService";
import { getTrips } from "../services/tripService";


function formatDate(date) {
  if (!date) return "Not specified";

  return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDuration(minutes) {
  if (minutes == null) return "Not available";

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) return `${remainingMinutes} min`;
  if (remainingMinutes === 0) return `${hours} hr`;

  return `${hours} hr ${remainingMinutes} min`;
}

function timeStringToMinutes(value) {
  if (!value || typeof value !== "string") return null;

  const match = value.trim().match(
    /^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i
  );

  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const period = match[3]?.toUpperCase();

  if (hours > 23 || minutes > 59) return null;

  if (period) {
    if (hours < 1 || hours > 12) return null;
    hours = hours % 12;
    if (period === "PM") hours += 12;
  }

  return hours * 60 + minutes;
}

function getOpeningStatus(place, arrivalMinutes, departureMinutes) {
  const opening = timeStringToMinutes(place.opening_time);
  const closing = timeStringToMinutes(place.closing_time);

  if (opening === null || closing === null) {
    return {
      status: "unknown",
      message: "Opening hours unavailable — please verify before visiting.",
    };
  }

  // This initial version supports attractions that open and close
  // on the same day, not overnight opening schedules.
  if (closing <= opening) {
    return {
      status: "unknown",
      message: "Hours may cross midnight — please verify manually.",
    };
  }

  if (arrivalMinutes < opening) {
    return {
      status: "early",
      message: `Opens at ${place.opening_time}. You may need to wait.`,
    };
  }

  if (arrivalMinutes >= closing || departureMinutes > closing) {
    return {
      status: "warning",
      message: `The planned visit may extend beyond closing at ${place.closing_time}.`,
    };
  }

  return {
    status: "open",
    message: `Planned visit fits the listed hours (${place.opening_time}–${place.closing_time}).`,
  };
}



export default function Itinerary() {
  const [trip, setTrip] = useState(null);
  const [tripLoading, setTripLoading] = useState(true);
  const [tripError, setTripError] = useState("");

  const [route, setRoute] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState("");

  // Load trips belonging to the currently authenticated account.
  useEffect(() => {
    let cancelled = false;

    async function loadTrip() {
      try {
        setTripLoading(true);
        setTripError("");

        const trips = await getTrips();

        if (cancelled) return;

        const getTimestamp = (item) => {
          const value = new Date(
            item.updatedAt ||
              item.createdAt ||
              item.generatedAt ||
              0
          ).getTime();

          return Number.isFinite(value) ? value : 0;
        };

        const latestTrip =
          [...trips].sort(
            (a, b) => getTimestamp(b) - getTimestamp(a)
          )[0] || null;

        setTrip(latestTrip);
      } catch (err) {
        if (!cancelled) {
          setTripError(
            err.message || "Unable to load your itinerary."
          );
        }
      } finally {
        if (!cancelled) {
          setTripLoading(false);
        }
      }
    }

    loadTrip();

    return () => {
      cancelled = true;
    };
  }, []);

  // Show loading before checking whether a trip exists.
  if (tripLoading) {
    return (
      <main className="container section itinerary-page">
        <p role="status">Loading your itinerary...</p>
      </main>
    );
  }

  // Show API or authentication errors.
  if (tripError) {
    return (
      <main className="container section itinerary-page">
        <section className="card card-pad itinerary-empty">
          <h1>Unable to load your itinerary</h1>
          <p role="alert" className="muted">
            {tripError}
          </p>
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

  // Show the empty state when this account has no saved destinations.
  if (
    !trip ||
    !Array.isArray(trip.places) ||
    trip.places.length === 0
  ) {
    return (
      <main className="container section itinerary-page">
        <section className="card card-pad itinerary-empty">
          <span className="itinerary-symbol">✧</span>
          <h1>No itinerary generated yet</h1>
          <p className="muted">
            Select attractions and generate your trip in Smart Trip
            Planner first.
          </p>
          <Link to="/planner" className="btn btn-primary">
            Open Trip Planner
          </Link>
        </section>
      </main>
    );
  }

  // Keep the rest of your existing itinerary calculations and JSX
  // starting from: const entryFees = trip.places.reduce(...)



  const entryFees = trip.places.reduce(
    (total, place) => total + Number(place.entry_fee || 0),
    0
  );

  const budget = Number(trip.budget || 0);
  const remainingBudget = budget - entryFees;
  // Estimated transportation cost in INR per kilometre.
  // These are configurable estimates, not live market fares.
  const transportRates = {
    cab: 18,
    rental: 15,
    own: 8,
    bus: 3,
    walk: 0,
  };

  const distanceKm = Number(route?.distanceKm || 0);

  const ratePerKm = transportRates[trip.travelMode] ?? 0;

  const transportCost = Math.round(distanceKm * ratePerKm);

  // Estimated guide rate: ₹300 per hour.
  // Change this value when you have verified local rates.
  const guideRatePerHour = 300;

  // Assumes average_visit_duration is stored in minutes.
  const totalVisitMinutes = trip.places.reduce(
    (total, place) =>
      total + Number(place.average_visit_duration || 60),
    0
  );

  // Charge for each started hour of guiding.
  const guideHours = trip.needGuide
    ? Math.ceil(totalVisitMinutes / 60)
    : 0;

  const guideCost = guideHours * guideRatePerHour;

  const estimatedTotalCost =
    entryFees + transportCost + guideCost;

  const remainingAfterTrip = budget - estimatedTotalCost;
  // Convert a time such as "09:30" into minutes after midnight.
  function timeToMinutes(time) {
    if (!time) return 9 * 60;

    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + (minutes || 0);
  }

  // Convert minutes after midnight into a readable time.
  function formatClock(minutes) {
    const normalized = ((minutes % 1440) + 1440) % 1440;
    const hours = Math.floor(normalized / 60);
    const mins = normalized % 60;

    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;

    return `${displayHours}:${String(mins).padStart(2, "0")} ${period}`;
  }

  // Read visit duration from the place data.
  function getVisitMinutes(place) {
    const value = place.average_visit_duration;

    if (typeof value === "number" && value > 0) {
      // Treat numeric values as minutes.
      return value;
    }

    if (typeof value === "string") {
      const match = value.match(/(\d+(?:\.\d+)?)\s*(hour|hr|minute|min)/i);

      if (match) {
        const amount = Number(match[1]);

        if (/hour|hr/i.test(match[2])) {
          return Math.round(amount * 60);
        }

        return Math.round(amount);
      }
    }

    // Use a one-hour fallback when duration is unavailable.
    return 60;
  }

  // Build a provisional schedule from the saved route segments.
  const timeline = (() => {
    let currentMinutes = timeToMinutes(trip.startTime);
    const items = [];

    trip.places.forEach((place, index) => {
      const leg = route?.legs?.[index];
      const travelMinutes = Number(leg?.durationMinutes || 0);

      const arrivalMinutes = currentMinutes + travelMinutes;
      const visitMinutes = getVisitMinutes(place);
      const departureMinutes = arrivalMinutes + visitMinutes;

      items.push({
        place,
        index,
        travelMinutes,
        arrivalMinutes,
        visitMinutes,
        departureMinutes,
      });

      currentMinutes = departureMinutes;
    });

    return items;
  })();

  const transportNames = {
    cab: "Cab",
    rental: "Rental",
    own: "Own Vehicle",
    bus: "Bus",
    walk: "Walk + Local",
  };

  return (
    <main className="container section itinerary-page">
      {/* Page heading */}
      <header className="itinerary-header">
        <div>
          <p className="badge">Your journey, organized</p>
          <h1>Your Travel Itinerary</h1>
          <p className="muted">
            Your selected destinations and trip preferences in one place.
          </p>
        </div>

        <Link to="/planner" className="btn btn-secondary">
          Edit Trip
        </Link>
      </header>

      {/* Trip overview */}
      <section className="grid two-col itinerary-overview">
        <article className="card card-pad">
          <span className="muted">Travel date</span>
          <h3>{formatDate(trip.travelDate)}</h3>
        </article>

        <article className="card card-pad">
          <span className="muted">Start time</span>
          <h3>{trip.startTime || "Not specified"}</h3>
        </article>

        <article className="card card-pad">
          <span className="muted">Transport</span>
          <h3>
            {transportNames[trip.travelMode] ||
              trip.travelMode ||
              "Not specified"}
          </h3>
        </article>

        <article className="card card-pad">
          <span className="muted">Budget</span>
          <h3>₹{budget.toLocaleString("en-IN")}</h3>
        </article>
      </section>

      {/* Two-column layout: destinations on the left, map on the right */}
      <div className="itinerary-route-layout">
        {/* LEFT COLUMN: Selected destinations */}
        <section className="card card-pad itinerary-destinations">
          <div className="itinerary-section-heading">
            <div>
              <h2>Selected destinations</h2>
              <p className="muted">
                {trip.places.length}{" "}
                {trip.places.length === 1 ? "place" : "places"} in your trip
              </p>
            </div>
            <span className="itinerary-symbol">⌖</span>
          </div>

          {trip.origin && (
            <div className="itinerary-origin">
              <strong>Starting point</strong>
              <p className="muted">
                {trip.origin.label || "Your selected starting location"}
              </p>
            </div>
          )}

          {!trip.origin && (
            <p className="muted">
              No starting location was saved. Edit your trip in the planner
              to calculate a driving route.
            </p>
          )}

          <div className="itinerary-list">
            {trip.places.map((place, index) => (
              <article
                className="itinerary-stop"
                key={place.id || place._id || `${place.name}-${index}`}
              >
                <div className="itinerary-stop-number">{index + 1}</div>

                <div className="itinerary-stop-content">
                  <h3>{place.name || "Unnamed destination"}</h3>

                  <p className="muted">
                    {[place.city, place.state].filter(Boolean).join(", ") ||
                      "Location details unavailable"}
                  </p>

                  <div className="itinerary-stop-details">
                    <span>
                      ⏱ {place.average_visit_duration || "Duration unavailable"}
                    </span>

                    <span>
                      {Number(place.entry_fee || 0) === 0
                        ? "Free entry"
                        : `Entry fee: ₹${Number(
                          place.entry_fee
                        ).toLocaleString("en-IN")}`}
                    </span>

                    {place.suggested_visit_time && (
                      <span>
                        Suggested: {place.suggested_visit_time}
                      </span>
                    )}
                  </div>

                  {trip.needGuide && (
                    <p className="itinerary-guide">
                      Guide preference:{" "}
                      {place.guide_available
                        ? "Guide may be available"
                        : "Availability not listed"}
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* RIGHT COLUMN: Map and route summary */}
        <aside className="itinerary-route-sidebar">
          <RouteMap
            origin={trip.origin}
            places={trip.places}
            routeCoordinates={route?.routeCoordinates || []}
          />

          {routeLoading && (
            <section className="card card-pad">
              <p className="muted">
                Calculating your connected driving route...
              </p>
            </section>
          )}

          {routeError && (
            <section className="card card-pad">
              <h3>Route unavailable</h3>
              <p className="muted" role="status">
                {routeError}
              </p>
              <p className="muted">
                Check your starting location and destination coordinates,
                then try again.
              </p>
            </section>
          )}

          {route && (
            <section className="card card-pad itinerary-route-summary">
              <h2>Route summary</h2>

              <div className="itinerary-budget-row">
                <span>Total road distance</span>
                <strong>{route.distanceKm} km</strong>
              </div>

              <div className="itinerary-budget-row">
                <span>Estimated driving time</span>
                <strong>
                  {formatDuration(route.durationMinutes)}
                </strong>
              </div>

              <p className="muted itinerary-disclaimer">
                These are road-route estimates, not live traffic predictions.
                Actual travel time may vary.
              </p>

              {Array.isArray(route.legs) && route.legs.length > 0 && (
                <>
                  <h3>Journey segments</h3>

                  {route.legs.map((leg, index) => (
                    <div className="itinerary-budget-row" key={index}>
                      <span>
                        {leg.from} → {leg.to}
                      </span>
                      <strong>
                        {leg.distanceKm} km ·{" "}
                        {formatDuration(leg.durationMinutes)}
                      </strong>
                    </div>
                  ))}
                </>
              )}
            </section>
          )}
        </aside>
      </div>

      {/* Hour-by-hour trip timeline */}
      <section className="card card-pad itinerary-timeline">
        <h2>Your Travel Timeline</h2>
        <p className="muted">
          Estimated travel and visit schedule for your selected destinations.
        </p>

        <div className="timeline-list">
          {timeline.map((item) => (
            <article
              className="timeline-item"
              key={item.place.id || item.place._id || item.index}
            >
              <div className="timeline-time">
                <strong>{formatClock(item.arrivalMinutes)}</strong>
                <span>Arrival</span>
              </div>

              <div className="timeline-content">
                <h3>
                  {item.index + 1}. {item.place.name}
                </h3>

                <p className="muted">
                  Travel to this destination:{" "}
                  {item.travelMinutes > 0
                    ? formatDuration(item.travelMinutes)
                    : item.index === 0 && !trip.origin
                      ? "Starting location not set"
                      : "Travel time unavailable"}
                </p>

                <p>
                  Planned visit: {formatDuration(item.visitMinutes)}
                </p>

                {(() => {
                  const openingStatus = getOpeningStatus(
                    item.place,
                    item.arrivalMinutes,
                    item.departureMinutes
                  );

                  return (
                    <p
                      className={`opening-status opening-status-${openingStatus.status}`}
                      role="status"
                    >
                      {openingStatus.message}
                    </p>
                  );
                })()}

                <p className="muted">
                  Estimated departure: {formatClock(item.departureMinutes)}
                </p>
              </div>
            </article>
          ))}
        </div>

        <p className="muted itinerary-disclaimer">
          This is a provisional schedule. Missing route segments are not
          included in travel-time estimates, and opening hours have not yet
          been checked.
        </p>
      </section>

      {/* Budget details */}
      <section className="card card-pad itinerary-budget">
        <h2>Budget summary</h2>

        <div className="cost-breakdown">
          <div>
            <span>Estimated travel distance</span>
            <strong>{distanceKm.toFixed(1)} km</strong>
          </div>

          <div>
            <span>Transport rate</span>
            <strong>₹{ratePerKm}/km</strong>
          </div>

          <div>
            <span>Estimated transport cost</span>
            <strong>₹{transportCost}</strong>
          </div>
          <div>
            <span>Guide charges</span>
            <strong>
              {trip.needGuide
                ? `₹${guideCost} (${guideHours} hour${guideHours === 1 ? "" : "s"})`
                : "₹0 (No guide selected)"}
            </strong>
          </div>
          <div>
            <span>Place entry fees</span>
            <strong>₹{entryFees}</strong>
          </div>

          <div className="cost-total">
            <span>Estimated total</span>
            <strong>₹{estimatedTotalCost}</strong>
          </div>

          {budget > 0 && estimatedTotalCost > budget && (
            <div className="budget-warning" role="alert">
              <strong>⚠️ Budget exceeded</strong>
              <p>
                Your estimated trip cost is ₹{estimatedTotalCost},
                which is ₹{estimatedTotalCost - budget} over your
                budget of ₹{budget}.
              </p>
              <p>
                Try choosing a cheaper travel option or removing a
                destination to reduce costs.
              </p>
            </div>
          )}

          {budget > 0 && estimatedTotalCost <= budget && (
            <div className="budget-success" role="status">
              ✓ Your estimated trip cost is within your budget.
              You have ₹{budget - estimatedTotalCost} remaining.
            </div>
          )}
          
        </div>

        <p className="muted itinerary-disclaimer">
          Accommodation and atwhile meals may cost extra. This is
          not a prediction of your complete trip cost.
        </p>
      </section>

      {/* Navigation actions */}
      <div className="itinerary-footer-actions">
        <Link to="/places" className="btn btn-secondary">
          Explore more places
        </Link>

        <Link to="/planner" className="btn btn-primary">
          Back to Trip Planner
        </Link>
      </div>
    </main>
  );
}
