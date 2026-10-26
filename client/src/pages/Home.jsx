import { useState } from "react";

export default function Home() {
  const [state, setState] = useState("");
  const [city, setCity] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    const selectedState = state.trim();
    const selectedCity = city.trim();

    if (!selectedState || !selectedCity) return;

    const params = new URLSearchParams({
      state: selectedState,
      city: selectedCity,
    });

    window.location.href = `/places?${params.toString()}`;
  }

  return (
    <main>
      <section className="container hero reveal">
        <div className="hero-grid">
          <div>
            <div className="hero-brand-row">
              <img
                className="hero-logo"
                src="/Logo.png"
                alt="NavYatra"
              />
              <span className="hero-brand-text">NavYatra</span>
            </div>

            <p className="badge hero-badge">
              Smart Route + Timing + Guide Booking
            </p>

            <h1>Plan your India travel day like a local.</h1>

            <p>
              Discover nearby attractions, check opening times, plan routes,
              and create a realistic itinerary with travel, budget, and guide
              information.
            </p>

            <div className="stepper" aria-label="Flow preview">
              {[1, 2, 3, 4, 5].map((step) => (
                <span
                  className={`step ${step === 1 ? "active" : ""}`}
                  key={step}
                >
                  {step}
                </span>
              ))}
            </div>
          </div>

          <div className="glass-panel card-pad">
            <h3>Start from your location</h3>
            <p className="muted">
              Choose a state and city to begin discovering places.
            </p>

            <form
              id="home-location-form"
              className="grid two-col"
              onSubmit={handleSubmit}
            >
              <div>
                <label htmlFor="home-state">State</label>
                <select
                  id="home-state"
                  className="select"
                  value={state}
                  onChange={(event) => setState(event.target.value)}
                  required
                >
                  <option value="">Select state</option>
                  <option value="Andhra Pradesh">Andhra Pradesh</option>
                  <option value="Rajasthan">Rajasthan</option>
                  <option value="Kerala">Kerala</option>
                  <option value="Telangana">Telangana</option>
                </select>
              </div>

              <div>
                <label htmlFor="home-city">City</label>
                <input
                  id="home-city"
                  className="input"
                  placeholder="Vijayawada / Jaipur / Kochi / Hyderabad"
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  required
                />
              </div>

              <button
                className="btn btn-primary pulse-on-hover"
                type="submit"
                style={{ gridColumn: "1 / -1" }}
              >
                Find Places
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="container section reveal">
        <div className="section-head">
          <div>
            <h2>What NavYatra does</h2>
            <p>
              From discovery to dashboard, designed for practical same-day
              trip planning.
            </p>
          </div>
        </div>

        <div className="grid three-col">
          <article className="card card-pad">
            <h3>Location-Based Discovery</h3>
            <p className="muted">
              Filter places by city, budget, travel time, and category.
            </p>
          </article>

          <article className="card card-pad">
            <h3>Smart Planner</h3>
            <p className="muted">
              Organize selected places and identify schedule conflicts.
            </p>
          </article>

          <article className="card card-pad">
            <h3>Guide Availability</h3>
            <p className="muted">
              Display guide details and fees when reliable availability data
              is available.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}