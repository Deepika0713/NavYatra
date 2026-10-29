import { useEffect, useState } from "react";
import "./Planner.css";
import { createTrip, getTrips, updateTrip } from "../services/tripService";

const API_URL = "";
const STORAGE_KEY = "navyatra.selectedPlaceIds";
const ITINERARY_KEY = "navyatra.itinerary";
const ACTIVE_TRIP_KEY = "navyatra.activeTripId";

export default function Planner() {
    const [places, setPlaces] = useState([]);

    const [selectedIds, setSelectedIds] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        } catch {
            return [];
        }
    });

    const [origin, setOrigin] = useState(null);
    const [manualStart, setManualStart] = useState("");
    const [locationStatus, setLocationStatus] = useState("");
    const [locationLoading, setLocationLoading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [travelDate, setTravelDate] = useState("");
    const [startTime, setStartTime] = useState("09:00");
    const [travelMode, setTravelMode] = useState("cab");
    const [budget, setBudget] = useState("5000");
    const [needGuide, setNeedGuide] = useState(true);
    const [generated, setGenerated] = useState(false);

    const [savedTripId, setSavedTripId] = useState(
        () => localStorage.getItem(ACTIVE_TRIP_KEY)
    );
    const [savingTrip, setSavingTrip] = useState(false);
    const [saveMessage, setSaveMessage] = useState("");

    // Load attractions from the backend.
    useEffect(() => {
        let cancelled = false;

        async function loadPlaces() {
            try {
                const response = await fetch(`${API_URL}/api/places`);

                if (!response.ok) {
                    throw new Error("Unable to load attractions.");
                }

                const data = await response.json();

                if (!cancelled) {
                    setPlaces(data.places || []);
                }
            } catch {
                if (!cancelled) {
                    setError(
                        "Could not load attractions. Check that the backend is running."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadPlaces();

        return () => {
            cancelled = true;
        };
    }, []);

    // Restore the user's latest unfinished draft from MongoDB.
    useEffect(() => {
        let cancelled = false;

        async function restoreDraft() {
            try {
                const drafts = await getTrips("draft");

                if (cancelled || !drafts.length) {
                    return;
                }

                const activeId = localStorage.getItem(ACTIVE_TRIP_KEY);

                const draft =
                    drafts.find((trip) => trip._id === activeId) ||
                    drafts[0];

                if (cancelled) return;

                setSavedTripId(draft._id);
                localStorage.setItem(ACTIVE_TRIP_KEY, draft._id);

                if (Array.isArray(draft.places)) {
                    const ids = draft.places
                        .map((place) => place.id)
                        .filter((id) => id !== undefined && id !== null);

                    setSelectedIds(ids);
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
                }

                if (draft.travelDate) setTravelDate(draft.travelDate);
                if (draft.startTime) setStartTime(draft.startTime);
                if (draft.travelMode) setTravelMode(draft.travelMode);

                if (draft.budget !== undefined && draft.budget !== null) {
                    setBudget(String(draft.budget));
                }

                if (typeof draft.needGuide === "boolean") {
                    setNeedGuide(draft.needGuide);
                }

                if (draft.origin) {
                    setOrigin(draft.origin);
                }

                setSaveMessage("Your saved draft has been restored.");
            } catch (restoreError) {
                // A failed draft lookup should not prevent normal planning.
                console.error("Could not restore trip draft:", restoreError);
            }
        }

        restoreDraft();

        return () => {
            cancelled = true;
        };
    }, []);

    const selectedPlaces = places.filter((place) =>
        selectedIds.includes(place.id)
    );

    function clearSelection() {
        setSelectedIds([]);
        localStorage.removeItem(STORAGE_KEY);
        sessionStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(ITINERARY_KEY);

        setGenerated(false);
        setSaveMessage("");
    }

    function removePlace(id) {
        const nextIds = selectedIds.filter(
            (selectedId) => selectedId !== id
        );

        setSelectedIds(nextIds);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextIds));
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(nextIds));

        setGenerated(false);
        setSaveMessage("");
    }

    function useCurrentLocation() {
        if (!navigator.geolocation) {
            setLocationStatus(
                "Location is not supported by this browser. Enter an address manually."
            );
            return;
        }

        setLocationLoading(true);
        setLocationStatus("Requesting location permission...");

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setOrigin({
                    label: "My current location",
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    source: "gps",
                });

                setManualStart("");
                setLocationStatus("Current location captured successfully.");
                setLocationLoading(false);
            },
            (geoError) => {
                const message =
                    geoError.code === 1
                        ? "Location permission denied. Enter your starting address manually."
                        : geoError.code === 3
                            ? "Location request timed out. Please try again."
                            : "Could not determine your location. Please try again.";

                setLocationStatus(message);
                setLocationLoading(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 60000,
            }
        );
    }

    // Save the current trip to MongoDB.
    async function persistTrip(status, resolvedOrigin = origin) {
        const itinerary = {
            title: `NavYatra Trip - ${travelDate || "Untitled"}`,
            status,
            travelDate,
            startTime,
            travelMode,
            budget: Number(budget) || 0,
            needGuide,
            origin: resolvedOrigin || null,
            places: selectedPlaces,
            generatedAt: new Date().toISOString(),
        };

        setSavingTrip(true);
        setSaveMessage("");

        try {
            let savedTrip;

            if (savedTripId) {
                try {
                    savedTrip = await updateTrip(savedTripId, itinerary);
                } catch (updateError) {
                    // Only create a new document if the existing one no longer exists.
                    // Do not silently duplicate trips for ordinary network errors.
                    throw updateError;
                }
            } else {
                savedTrip = await createTrip(itinerary);
                setSavedTripId(savedTrip._id);
                localStorage.setItem(ACTIVE_TRIP_KEY, savedTrip._id);
            }

            // Compatibility copy for existing itinerary/dashboard pages.
            // MongoDB remains the persistent source of the trip.
            localStorage.setItem(
                ITINERARY_KEY,
                JSON.stringify({
                    ...itinerary,
                    _id: savedTrip._id,
                })
            );

            setSaveMessage(
                status === "draft"
                    ? "Draft saved to your account."
                    : "Trip saved to your account successfully."
            );

            return savedTrip;
        } catch (saveError) {
            setSaveMessage(
                saveError.message || "Could not save your trip."
            );
            throw saveError;
        } finally {
            setSavingTrip(false);
        }
    }

    async function saveDraft() {
        try {
            await persistTrip("draft");
        } catch {
            // persistTrip displays the error to the user.
        }
    }

    async function generateItinerary(event) {
        event.preventDefault();

        setLocationLoading(true);
        setLocationStatus("");

        try {
            let resolvedOrigin = origin;

            // Convert a manually entered address into coordinates.
            if (manualStart.trim() && origin?.source !== "gps") {
                const response = await fetch("/api/location/geocode", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        address: manualStart.trim(),
                    }),
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message || "Unable to find the starting location."
                    );
                }

                resolvedOrigin = data.location;
                setOrigin(resolvedOrigin);
            }

            if (!resolvedOrigin) {
                throw new Error(
                    "Please choose your current location or enter a starting address."
                );
            }

            if (selectedPlaces.length === 0) {
                throw new Error(
                    "Please select at least one destination before generating your itinerary."
                );
            }

            await persistTrip("saved", resolvedOrigin);

            setGenerated(true);
            setLocationStatus("Starting location verified successfully!");
        } catch (generateError) {
            setLocationStatus(generateError.message);
        } finally {
            setLocationLoading(false);
        }
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
                        <span className="planner-count-number">
                            {selectedPlaces.length}
                        </span>
                        <span className="muted">places selected</span>
                    </div>
                </div>

                <section className="card card-pad planner-location-card">
                    <h3>Starting Location</h3>

                    <p className="muted">
                        Choose your current location or enter a starting city or address.
                    </p>

                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={useCurrentLocation}
                        disabled={locationLoading}
                    >
                        {locationLoading
                            ? "Getting location..."
                            : "◎ Use my current location"}
                    </button>

                    <div className="planner-location-divider">
                        <span>OR enter manually</span>
                    </div>

                    <label htmlFor="starting-location">
                        Starting city or address
                    </label>

                    <input
                        id="starting-location"
                        className="input planner-location-input"
                        type="text"
                        placeholder="e.g. Vijayawada Railway Station"
                        value={manualStart}
                        onChange={(event) => {
                            setManualStart(event.target.value);
                            setOrigin(null);
                            setLocationStatus("");
                        }}
                    />

                    {locationStatus && (
                        <p className="planner-location-status" role="status">
                            {locationStatus}
                        </p>
                    )}

                    {origin && (
                        <p className="planner-location-status" role="status">
                            Selected: {origin.label || "Selected location"}
                            {Number.isFinite(Number(origin.latitude)) &&
                                Number.isFinite(Number(origin.longitude)) && (
                                    <>
                                        {" "}(
                                        {Number(origin.latitude).toFixed(5)},{" "}
                                        {Number(origin.longitude).toFixed(5)})
                                    </>
                                )}
                        </p>
                    )}
                </section>

                <div className="grid two-col planner-layout">
                    <article className="card card-pad planner-card">
                        <div className="planner-card-heading">
                            <span className="planner-icon">✦</span>
                            <div>
                                <h3>Planner Inputs</h3>
                                <p className="muted">
                                    Personalize your travel plan
                                </p>
                            </div>
                        </div>

                        <form
                            className="grid two-col planner-form"
                            onSubmit={generateItinerary}
                        >
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
                                        setSaveMessage("");
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
                                        setSaveMessage("");
                                    }}
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="travel-mode">
                                    Primary travel type
                                </label>
                                <select
                                    id="travel-mode"
                                    className="select"
                                    value={travelMode}
                                    onChange={(event) => {
                                        setTravelMode(event.target.value);
                                        setGenerated(false);
                                        setSaveMessage("");
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
                                <label htmlFor="budget-limit">
                                    Budget cap (₹)
                                </label>
                                <input
                                    id="budget-limit"
                                    className="input"
                                    type="number"
                                    min="0"
                                    value={budget}
                                    onChange={(event) => {
                                        setBudget(event.target.value);
                                        setGenerated(false);
                                        setSaveMessage("");
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
                                        setSaveMessage("");
                                    }}
                                />
                                <span>Need guide support, if available</span>
                            </label>

                            <div className="planner-submit-actions">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={saveDraft}
                                    disabled={savingTrip}
                                >
                                    {savingTrip ? "Saving..." : "Save Draft"}
                                </button>

                                <button
                                    type="submit"
                                    className="btn btn-primary planner-submit"
                                    disabled={savingTrip || locationLoading}
                                >
                                    {savingTrip
                                        ? "Saving trip..."
                                        : "Generate Itinerary →"}
                                </button>
                            </div>
                        </form>

                        {saveMessage && (
                            <p role="status" aria-live="polite">
                                {saveMessage}
                            </p>
                        )}

                        <div className="planner-budget">
                            <span>Selected places' entry fees</span>
                            <strong>
                                ₹{estimatedEntryFees.toLocaleString("en-IN")}
                            </strong>
                        </div>

                        <p className="planner-note">
                            Entry fees are estimates from the attraction data. Travel, food,
                            and guide charges may be additional.
                        </p>

                        {generated && (
                            <div className="planner-success" role="status">
                                <strong>Trip plan saved!</strong>
                                <p>
                                    Your selected places and travel preferences have been
                                    saved to your account. Your entry fees are ₹
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

                        {loading && (
                            <p role="status">
                                Loading your selected attractions…
                            </p>
                        )}

                        {error && <p role="alert">{error}</p>}

                        {!loading && !error && selectedPlaces.length === 0 && (
                            <div className="empty planner-empty">
                                <span className="planner-empty-icon">✧</span>
                                <h4>No places selected yet</h4>
                                <p className="muted">
                                    Visit the Places page and choose at least one destination
                                    to start planning your trip.
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
