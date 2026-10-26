
import { useEffect, useState } from "react";
import "./Planner.css";

const API_URL = "";

const STORAGE_KEY = "navyatra.selectedPlaceIds";

export default function Planner() {
    const [places, setPlaces] = useState([]);
    const [selectedIds, setSelectedIds] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        } catch {
            return [];
        }
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [travelDate, setTravelDate] = useState("");
    const [startTime, setStartTime] = useState("09:00");
    const [travelMode, setTravelMode] = useState("cab");
    const [budget, setBudget] = useState("5000");
    const [needGuide, setNeedGuide] = useState(true);
    const [generated, setGenerated] = useState(false);

    useEffect(() => {
        async function loadPlaces() {
            try {
                const response = await fetch(`${API_URL}/api/places`);

                if (!response.ok) {
                    throw new Error("Unable to load attractions.");
                }

                const data = await response.json();
                setPlaces(data.places || []);
            } catch {
                setError("Could not load attractions. Check that the backend is running.");
            } finally {
                setLoading(false);
            }
        }

        loadPlaces();
    }, []);

    const selectedPlaces = places.filter((place) =>
        selectedIds.includes(place.id)
    );

    function clearSelection() {
        setSelectedIds([]);
        localStorage.removeItem(STORAGE_KEY);
        sessionStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem("navyatra.itinerary");
        setGenerated(false);
    }

    function removePlace(id) {
        const nextIds = selectedIds.filter((selectedId) => selectedId !== id);
        setSelectedIds(nextIds);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextIds));
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(nextIds));
        setGenerated(false);
    }

    function generateItinerary(event) {
        event.preventDefault();

        if (selectedPlaces.length === 0) {
            alert("Please select at least one attraction on the Places page.");
            return;
        }

        const itinerary = {
            travelDate,
            startTime,
            travelMode,
            budget: Number(budget),
            needGuide,
            places: selectedPlaces,
            generatedAt: new Date().toISOString(),
        };

        localStorage.setItem("navyatra.itinerary", JSON.stringify(itinerary));
        setGenerated(true);
    }

    const estimatedEntryFees = selectedPlaces.reduce(
        (total, place) => total + Number(place.entry_fee || 0),
        0
    );

    return (
        <main className="container planner-page">
            <section className="section">
                <div className="section-head planner-heading">
                    <div>
                        <p className="badge">Your next adventure</p>
                        <h1 className="planner-title">Smart Trip Planner</h1>
                        <p className="muted">
                            Set your travel date, start time, and preferences to prepare your trip.
                        </p>
                    </div>
                    <div className="planner-count">
                        <span className="planner-count-number">{selectedPlaces.length}</span>
                        <span className="muted">places selected</span>
                    </div>
                </div>

                <div className="grid two-col planner-layout">
                    <article className="card card-pad planner-card">
                        <div className="planner-card-heading">
                            <span className="planner-icon">✦</span>
                            <div>
                                <h3>Planner Inputs</h3>
                                <p className="muted">Personalize your travel plan</p>
                            </div>
                        </div>

                        <form className="grid two-col planner-form" onSubmit={generateItinerary}>
                            <div>
                                <label htmlFor="trip-date">Travel date</label>
                                <input
                                    id="trip-date"
                                    className="input"
                                    type="date"
                                    value={travelDate}
                                    onChange={(event) => {
                                        setTravelDate(event.target.value);
                                        setGenerated(false);
                                    }}
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="start-time">Start time</label>
                                <input
                                    id="start-time"
                                    className="input"
                                    type="time"
                                    value={startTime}
                                    onChange={(event) => {
                                        setStartTime(event.target.value);
                                        setGenerated(false);
                                    }}
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="travel-mode">Primary travel type</label>
                                <select
                                    id="travel-mode"
                                    className="select"
                                    value={travelMode}
                                    onChange={(event) => {
                                        setTravelMode(event.target.value);
                                        setGenerated(false);
                                    }}
                                >
                                    <option value="cab">Cab</option>
                                    <option value="rental">Rental</option>
                                    <option value="own">Own Vehicle</option>
                                    <option value="bus">Bus</option>
                                    <option value="walk">Walk + Local</option>
                                </select>
                            </div>

                            <div>
                                <label htmlFor="budget-limit">Budget cap (₹)</label>
                                <input
                                    id="budget-limit"
                                    className="input"
                                    type="number"
                                    min="0"
                                    value={budget}
                                    onChange={(event) => {
                                        setBudget(event.target.value);
                                        setGenerated(false);
                                    }}
                                    required
                                />
                            </div>

                            <label className="planner-guide-option">
                                <input
                                    type="checkbox"
                                    checked={needGuide}
                                    onChange={(event) => {
                                        setNeedGuide(event.target.checked);
                                        setGenerated(false);
                                    }}
                                />
                                <span>Need guide support, if available</span>
                            </label>

                            <button
                                type="submit"
                                className="btn btn-primary planner-submit"
                            >
                                Generate Itinerary →
                            </button>
                        </form>

                        <div className="planner-budget">
                            <span>Selected places' entry fees</span>
                            <strong>₹{estimatedEntryFees.toLocaleString("en-IN")}</strong>
                        </div>

                        <p className="planner-note">
                            Entry fees are estimates from the attraction data. Travel, food,
                            and guide charges may be additional.
                        </p>

                        {generated && (
                            <div className="planner-success" role="status">
                                <strong>Trip plan saved!</strong>
                                <p>
                                    Your selected places and travel preferences have been saved
                                    in this browser. Your entry fees are ₹
                                    {estimatedEntryFees.toLocaleString("en-IN")}.
                                </p>
                            </div>
                        )}
                    </article>

                    <article className="card card-pad planner-card">
                        <div className="planner-card-heading">
                            <span className="planner-icon">⌖</span>
                            <div>
                                <h3>Selected Places</h3>
                                <p className="muted">
                                    Your chosen destinations for this trip
                                </p>
                            </div>
                        </div>

                        {loading && <p role="status">Loading your selected attractions…</p>}

                        {error && <p role="alert">{error}</p>}

                        {!loading && !error && selectedPlaces.length === 0 && (
                            <div className="empty planner-empty">
                                <span className="planner-empty-icon">✧</span>
                                <h4>No places selected yet</h4>
                                <p className="muted">
                                    Visit the Places page and choose at least one destination to
                                    start planning your trip.
                                </p>
                            </div>
                        )}

                        {!loading && selectedPlaces.length > 0 && (
                            <div className="planner-selected-list">
                                {selectedPlaces.map((place) => (
                                    <div className="planner-place" key={place.id}>
                                        <div className="planner-place-info">
                                            <strong>{place.name}</strong>
                                            <span className="muted">
                                                {place.city}, {place.state}
                                            </span>
                                            <span className="planner-place-fee">
                                                {Number(place.entry_fee || 0) === 0
                                                    ? "Free entry"
                                                    : `Entry ₹${place.entry_fee}`}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            className="planner-remove"
                                            onClick={() => removePlace(place.id)}
                                            aria-label={`Remove ${place.name}`}
                                            title="Remove place"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="planner-actions">
                            <a href="/places" className="btn btn-secondary">
                                ← Back to Places
                            </a>
                            <button
                                type="button"
                                className="btn btn-danger"
                                onClick={clearSelection}
                                disabled={selectedIds.length === 0}
                            >
                                Clear Selection
                            </button>
                        </div>
                    </article>
                </div>
            </section>
        </main>
    );
}

