
import { useEffect, useMemo, useState } from "react";

const API_URL = "";

export default function Places() {
    const [places, setPlaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [stateFilter, setStateFilter] = useState(
        new URLSearchParams(window.location.search).get("state") || ""
    );
    const [cityFilter, setCityFilter] = useState(
        new URLSearchParams(window.location.search).get("city") || ""
    );
    const [categoryFilter, setCategoryFilter] = useState("");
    const [maxFee, setMaxFee] = useState("2000");
    const [selectedIds, setSelectedIds] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem("navyatra.selectedPlaceIds") || "[]");
        } catch {
            return [];
        }
    });

    useEffect(() => {
        async function fetchPlaces() {
            try {
                setLoading(true);
                setError("");

                const response = await fetch(`${API_URL}/api/places`);
                if (!response.ok) throw new Error("Unable to load attractions.");

                const data = await response.json();
                setPlaces(data.places || []);
            } catch (err) {
                setError(
                    "Could not connect to the NavYatra API. Check that your backend is running."
                );
            } finally {
                setLoading(false);
            }
        }

        fetchPlaces();
    }, []);

    const states = useMemo(
        () => [...new Set(places.map((place) => place.state))].sort(),
        [places]
    );

    const cities = useMemo(
        () =>
            [...new Set(
                places
                    .filter((place) => !stateFilter || place.state === stateFilter)
                    .map((place) => place.city)
            )].sort(),
        [places, stateFilter]
    );

    const categories = useMemo(
        () => [...new Set(places.map((place) => place.category).filter(Boolean))].sort(),
        [places]
    );

    const filteredPlaces = useMemo(() => {
        const query = search.trim().toLowerCase();

        return places.filter((place) => {
            const matchesSearch =
                !query ||
                [place.name, place.city, place.state, place.description, place.category]
                    .filter(Boolean)
                    .some((value) => value.toLowerCase().includes(query));

            return (
                matchesSearch &&
                (!stateFilter || place.state === stateFilter) &&
                (!cityFilter || place.city === cityFilter) &&
                (!categoryFilter || place.category === categoryFilter) &&
                Number(place.entry_fee || 0) <= Number(maxFee)
            );
        });
    }, [places, search, stateFilter, cityFilter, categoryFilter, maxFee]);

    function updateSelected(nextIds) {
        setSelectedIds(nextIds);
        localStorage.setItem("navyatra.selectedPlaceIds", JSON.stringify(nextIds));
        // Keep the original V1 storage key for compatibility during migration.
        sessionStorage.setItem("navyatra.selectedPlaceIds", JSON.stringify(nextIds));
    }

    function togglePlace(id) {
        const nextIds = selectedIds.includes(id)
            ? selectedIds.filter((selectedId) => selectedId !== id)
            : [...selectedIds, id];

        updateSelected(nextIds);
    }

    function resetFilters() {
        setSearch("");
        setStateFilter("");
        setCityFilter("");
        setCategoryFilter("");
        setMaxFee("2000");
    }

    function goToPlanner() {
        if (selectedIds.length === 0) {
            alert("Please select at least one attraction first.");
            return;
        }
        window.location.href = "/planner";
    }

    return (
        <main className="container section">
            <div className="section-head">
                <div>
                    <p className="badge">Discover India</p>
                    <h1>Explore Places</h1>
                    <p className="muted">
                        Find attractions, compare entry fees, and choose stops for your trip.
                    </p>
                </div>
                <button className="btn btn-primary" onClick={goToPlanner}>
                    Plan Trip ({selectedIds.length})
                </button>
            </div>

            <section className="card card-pad" aria-label="Attraction filters">
                <div className="grid two-col">
                    <div>
                        <label htmlFor="place-search">Search attractions</label>
                        <input
                            id="place-search"
                            className="input"
                            placeholder="Search by name, city, or keyword"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                    </div>

                    <div>
                        <label htmlFor="state-filter">State</label>
                        <select
                            id="state-filter"
                            className="select"
                            value={stateFilter}
                            onChange={(event) => {
                                setStateFilter(event.target.value);
                                setCityFilter("");
                            }}
                        >
                            <option value="">All states</option>
                            {states.map((state) => (
                                <option value={state} key={state}>{state}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="city-filter">City</label>
                        <select
                            id="city-filter"
                            className="select"
                            value={cityFilter}
                            onChange={(event) => setCityFilter(event.target.value)}
                        >
                            <option value="">All cities</option>
                            {cities.map((city) => (
                                <option value={city} key={city}>{city}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="category-filter">Category</label>
                        <select
                            id="category-filter"
                            className="select"
                            value={categoryFilter}
                            onChange={(event) => setCategoryFilter(event.target.value)}
                        >
                            <option value="">All categories</option>
                            {categories.map((category) => (
                                <option value={category} key={category}>
                                    {category.charAt(0).toUpperCase() + category.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="fee-filter">Maximum entry fee (₹)</label>
                        <input
                            id="fee-filter"
                            className="input"
                            type="number"
                            min="0"
                            value={maxFee}
                            onChange={(event) => setMaxFee(event.target.value)}
                        />
                    </div>

                    <div className="grid" style={{ alignContent: "end" }}>
                        <button className="btn" type="button" onClick={resetFilters}>
                            Reset filters
                        </button>
                    </div>
                </div>
            </section>

            <div className="section-head" style={{ marginTop: "1.5rem" }}>
                <p className="muted">
                    {loading ? "Loading attractions..." : `${filteredPlaces.length} attractions found`}
                </p>
                <p className="muted">{selectedIds.length} selected</p>
            </div>

            {loading && <p role="status">Loading places from the NavYatra API…</p>}

            {error && (
                <div className="card card-pad">
                    <p role="alert">{error}</p>
                    <button className="btn" onClick={() => window.location.reload()}>
                        Try again
                    </button>
                </div>
            )}

            {!loading && !error && filteredPlaces.length === 0 && (
                <div className="card card-pad">
                    <h3>No matching attractions</h3>
                    <p className="muted">Try changing your filters or search term.</p>
                </div>
            )}

            <div className="grid three-col" style={{ marginTop: "1rem" }}>
                {filteredPlaces.map((place) => {
                    const selected = selectedIds.includes(place.id);
                    const imagePath = place.images?.[0]
                        ? `/images/${encodeURIComponent(place.images[0].split("/").pop())}`
                        : "";

                    return (
                        <article className="card" key={place.id}>
                            {imagePath && (
                                <img
                                    src={imagePath}
                                    alt={place.name}
                                    loading="lazy"
                                    style={{
                                        width: "100%",
                                        height: "190px",
                                        objectFit: "cover",
                                        borderRadius: "12px 12px 0 0",
                                    }}
                                    onError={(event) => {
                                        event.currentTarget.style.display = "none";
                                    }}
                                />
                            )}

                            <div className="card-pad">
                                <p className="badge">{place.category || "Attraction"}</p>
                                <h3>{place.name}</h3>
                                <p className="muted">{place.city}, {place.state}</p>
                                <p>{place.description}</p>

                                <div className="grid two-col">
                                    <p>
                                        <strong>Entry:</strong>{" "}
                                        {Number(place.entry_fee) === 0
                                            ? "Free"
                                            : `₹${place.entry_fee}`}
                                    </p>
                                    <p>
                                        <strong>Visit:</strong>{" "}
                                        {place.average_visit_duration || "—"} min
                                    </p>
                                    <p>
                                        <strong>Hours:</strong>{" "}
                                        {place.opening_time || "—"}–{place.closing_time || "—"}
                                    </p>
                                    <p>
                                        <strong>Guide:</strong>{" "}
                                        {place.guide_available ? "Available" : "Not listed"}
                                    </p>
                                </div>

                                <button
                                    className={`btn ${selected ? "btn-primary" : ""}`}
                                    type="button"
                                    onClick={() => togglePlace(place.id)}
                                    aria-pressed={selected}
                                    style={{ width: "100%", marginTop: "0.5rem" }}
                                >
                                    {selected ? "✓ Selected — Remove" : "＋ Add to trip"}
                                </button>
                            </div>
                        </article>
                    );
                })}
            </div>
        </main>
    );
}
