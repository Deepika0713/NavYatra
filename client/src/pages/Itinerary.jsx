
import { Link } from "react-router-dom";
import "./Itinerary.css";

const STORAGE_KEY = "navyatra.itinerary";

function formatDate(date) {
  if (!date) return "Not specified";

  return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function Itinerary() {
  let trip = null;

  try {
    trip = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  } catch {
    trip = null;
  }

  if (!trip || !Array.isArray(trip.places) || trip.places.length === 0) {
    return (
      <main className="container section itinerary-page">
        <section className="card card-pad itinerary-empty">
          <span className="itinerary-symbol">✧</span>
          <h1>No itinerary generated yet</h1>
          <p className="muted">
            Select attractions and generate your trip in Smart Trip Planner first.
          </p>
          <Link to="/planner" className="btn btn-primary">
            Open Trip Planner
          </Link>
        </section>
      </main>
    );
  }

  const entryFees = trip.places.reduce(
    (total, place) => total + Number(place.entry_fee || 0),
    0
  );

  const budget = Number(trip.budget || 0);
  const remainingBudget = budget - entryFees;

  return (
    <main className="container section itinerary-page">
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
            {{
              cab: "Cab",
              rental: "Rental",
              own: "Own Vehicle",
              bus: "Bus",
              walk: "Walk + Local",
            }[trip.travelMode] || trip.travelMode || "Not specified"}
          </h3>
        </article>

        <article className="card card-pad">
          <span className="muted">Budget</span>
          <h3>₹{budget.toLocaleString("en-IN")}</h3>
        </article>
      </section>

      <section className="card card-pad itinerary-destinations">
        <div className="itinerary-section-heading">
          <div>
            <h2>Selected destinations</h2>
            <p className="muted">
              {trip.places.length} {trip.places.length === 1 ? "place" : "places"} in your trip
            </p>
          </div>
          <span className="itinerary-symbol">⌖</span>
        </div>

        <div className="itinerary-list">
          {trip.places.map((place, index) => (
            <article className="itinerary-stop" key={place.id || index}>
              <div className="itinerary-stop-number">{index + 1}</div>

              <div className="itinerary-stop-content">
                <h3>{place.name}</h3>
                <p className="muted">
                  {[place.city, place.state].filter(Boolean).join(", ")}
                </p>

                <div className="itinerary-stop-details">
                  <span>
                    ⏱ {place.average_visit_duration || "Duration unavailable"}
                  </span>
                  <span>
                    {Number(place.entry_fee || 0) === 0
                      ? "Free entry"
                      : `Entry fee: ₹${Number(place.entry_fee).toLocaleString("en-IN")}`}
                  </span>
                  {place.suggested_visit_time && (
                    <span>Suggested: {place.suggested_visit_time}</span>
                  )}
                </div>

                {trip.needGuide && (
                  <p className="itinerary-guide">
                    Guide preference:{" "}
                    {place.guide_available ? "Guide may be available" : "Availability not listed"}
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="card card-pad itinerary-budget">
        <h2>Budget summary</h2>

        <div className="itinerary-budget-row">
          <span>Planned budget</span>
          <strong>₹{budget.toLocaleString("en-IN")}</strong>
        </div>

        <div className="itinerary-budget-row">
          <span>Total entry fees</span>
          <strong>₹{entryFees.toLocaleString("en-IN")}</strong>
        </div>

        <div className="itinerary-budget-row itinerary-budget-total">
          <span>Budget after entry fees</span>
          <strong>
            {remainingBudget < 0 ? "Over budget by " : "₹"}
            {Math.abs(remainingBudget).toLocaleString("en-IN")}
            {remainingBudget < 0 ? "" : ""}
          </strong>
        </div>

        <p className="muted itinerary-disclaimer">
          This is an entry-fee estimate only. Transport, meals, accommodation,
          and guide charges may be additional. The remaining amount is not a
          prediction of your complete trip cost.
        </p>
      </section>

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
