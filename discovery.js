(async function () {
  const { getLocation, getSelectedPlaceIds, setSelectedPlaceIds } = window.NavyatraState;
  const { loadPlaces, normalizePlace, distanceKm, isOpenAt } = window.NavyatraData;
  const { clampText } = window.NavyatraUI;

  const grid = document.getElementById("places-grid");
  if (!grid) {
    return;
  }

  const sentinel = document.getElementById("scroll-sentinel");
  const emptyState = document.getElementById("empty-state");
  const chips = document.getElementById("selected-chips");
  const locationLabel = document.getElementById("location-label");

  const searchInput = document.getElementById("search-input");
  const stateFilter = document.getElementById("state-filter");
  const categoryFilter = document.getElementById("category-filter");
  const budgetFilter = document.getElementById("budget-filter");
  const distanceFilter = document.getElementById("distance-filter");
  const durationFilter = document.getElementById("duration-filter");
  const timeFilter = document.getElementById("time-filter");
  const sortFilter = document.getElementById("sort-filter");
  const resetFiltersButton = document.getElementById("reset-filters");
  const toPlannerButton = document.getElementById("to-planner");

  const location = getLocation();
  const defaultLocation = location || {
    state: "Andhra Pradesh",
    city: "",
    coordinates: { lat: 20.5937, lng: 78.9629 }
  };
  locationLabel.textContent = defaultLocation.city
    ? `Location: ${defaultLocation.city}, ${defaultLocation.state}`
    : `Location state: ${defaultLocation.state}`;

  if (stateFilter) {
    stateFilter.value = defaultLocation.state;
  }

  const allPlacesRaw = await loadPlaces();
  const allPlaces = allPlacesRaw.map(normalizePlace);
  if (!allPlaces.length) {
    emptyState.style.display = "block";
    emptyState.textContent = "Places data could not be loaded. Open through Live Server or refresh this page.";
    toPlannerButton.disabled = true;
    return;
  }

  let selectedIds = new Set(getSelectedPlaceIds());
  let renderedCount = 0;
  const PAGE_SIZE = 8;

  const state = {
    filtered: []
  };

  function calcDistance(place) {
    return distanceKm(defaultLocation.coordinates, place.coordinates);
  }

  function applyFilters() {
    const q = searchInput.value.trim().toLowerCase();
    const selectedState = stateFilter ? stateFilter.value : defaultLocation.state;
    const category = categoryFilter.value;
    const maxBudget = Number(budgetFilter.value || 2000);
    const maxDistance = Number(distanceFilter.value || 150);
    const maxDuration = Number(durationFilter.value || 300);
    const slot = timeFilter.value;
    const sort = sortFilter.value;

    let filtered = allPlaces.filter((place) => {
      const matchesLocation = place.state === selectedState;
      const matchesSearch = !q || `${place.name} ${place.description}`.toLowerCase().includes(q);
      const matchesCategory = category === "all" || place.category === category;
      const matchesBudget = place.entry_fee <= maxBudget;
      const distance = calcDistance(place);
      const matchesDistance = distance <= maxDistance;
      const matchesDuration = place.average_visit_duration <= maxDuration;
      const matchesSlot = slot === "all" || place.suggested_visit_time === slot;
      return matchesLocation && matchesSearch && matchesCategory && matchesBudget && matchesDistance && matchesDuration && matchesSlot;
    });

    filtered = filtered.map((place) => ({ ...place, distance_km: calcDistance(place) }));

    const sortMap = {
      distance: (a, b) => a.distance_km - b.distance_km,
      fee: (a, b) => a.entry_fee - b.entry_fee,
      duration: (a, b) => a.average_visit_duration - b.average_visit_duration
    };

    filtered.sort(sortMap[sort] || sortMap.distance);
    state.filtered = filtered;
    renderedCount = 0;
    grid.innerHTML = "";
    loadNextChunk();
    renderChips();
  }

  function createCard(place) {
    const article = document.createElement("article");
    article.className = `card place-card reveal ${selectedIds.has(place.id) ? "selected" : ""}`;
    const img = place.images[0] || "Logo.png";
    const now = new Date();
    const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const open = isOpenAt(place, hhmm);

    article.innerHTML = `
      <div class="place-media-wrap">
        <img class="place-media" src="${img}" alt="${place.name}" loading="lazy" />
      </div>
      <div class="place-body">
        <div class="place-title-row">
          <h3 class="place-title">${place.name}</h3>
          <span class="badge ${open ? "ok" : "warn"}">${open ? "Open" : "Closed"}</span>
        </div>
        <p class="muted">${clampText(place.description, 104)}</p>
        <div class="meta-row">
          <span class="selection-chip">${place.city}, ${place.state}</span>
          <span class="selection-chip">${place.category}</span>
          <span class="selection-chip">${place.distance_km.toFixed(1)} km</span>
          <span class="selection-chip">${place.average_visit_duration} min</span>
        </div>
        <div class="meta-row">
          <span class="selection-chip">${place.crowd_level} crowd</span>
          <span class="selection-chip">INR ${place.entry_fee}</span>
        </div>
        <div class="meta-row">
          <span class="selection-chip">${place.opening_time} - ${place.closing_time}</span>
          <span class="selection-chip">${place.guide_available ? "Guide possible" : "No guide"}</span>
        </div>
        <button class="btn ${selectedIds.has(place.id) ? "btn-danger" : "btn-primary"}" data-id="${place.id}">
          ${selectedIds.has(place.id) ? "Remove" : "Select"}
        </button>
      </div>
    `;

    const button = article.querySelector("button");
    button.addEventListener("click", () => {
      if (selectedIds.has(place.id)) {
        selectedIds.delete(place.id);
      } else {
        selectedIds.add(place.id);
      }
      setSelectedPlaceIds(Array.from(selectedIds));
      applyFilters();
    });

    return article;
  }

  function loadNextChunk() {
    const slice = state.filtered.slice(renderedCount, renderedCount + PAGE_SIZE);
    slice.forEach((place) => {
      grid.appendChild(createCard(place));
    });

    renderedCount += slice.length;
    emptyState.style.display = state.filtered.length ? "none" : "block";
    window.NavyatraUI.initRevealAnimations();
  }

  function renderChips() {
    chips.innerHTML = "";
    if (!selectedIds.size) {
      chips.innerHTML = "<span class=\"muted\">No places selected yet.</span>";
      return;
    }

    const selected = allPlaces.filter((p) => selectedIds.has(p.id));
    selected.forEach((place) => {
      const node = document.createElement("span");
      node.className = "selection-chip";
      node.textContent = place.name;
      chips.appendChild(node);
    });
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && renderedCount < state.filtered.length) {
          loadNextChunk();
        }
      });
    },
    { rootMargin: "120px" }
  );

  observer.observe(sentinel);

  [searchInput, stateFilter, categoryFilter, budgetFilter, distanceFilter, durationFilter, timeFilter, sortFilter].forEach((el) => {
    if (!el) {
      return;
    }
    el.addEventListener("input", applyFilters);
    el.addEventListener("change", applyFilters);
  });

  resetFiltersButton.addEventListener("click", () => {
    searchInput.value = "";
    if (stateFilter) {
      stateFilter.value = defaultLocation.state;
    }
    categoryFilter.value = "all";
    budgetFilter.value = 2000;
    distanceFilter.value = 5000;
    durationFilter.value = 240;
    timeFilter.value = "all";
    sortFilter.value = "distance";
    applyFilters();
  });

  toPlannerButton.addEventListener("click", () => {
    if (!selectedIds.size) {
      alert("Select at least one place to continue to planner.");
      return;
    }
    setSelectedPlaceIds(Array.from(selectedIds));
    window.location.href = "planner.html";
  });

  applyFilters();
})();
