(function () {
  const KEYS = {
    location: "navyatra.location",
    selectedPlaceIds: "navyatra.selectedPlaceIds",
    plannerConfig: "navyatra.plannerConfig",
    itinerary: "navyatra.itinerary"
  };

  function getJSON(key, fallback) {
    try {
      const raw = sessionStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_error) {
      return fallback;
    }
  }

  function setJSON(key, value) {
    sessionStorage.setItem(key, JSON.stringify(value));
  }

  const cityCoordinates = {
    Vijayawada: { lat: 16.5062, lng: 80.6480 },
    Jaipur: { lat: 26.9124, lng: 75.7873 },
    Kochi: { lat: 9.9312, lng: 76.2673 },
    Hyderabad: { lat: 17.3850, lng: 78.4867 }
  };

  window.NavyatraState = {
    KEYS,
    cityCoordinates,
    getLocation() {
      return getJSON(KEYS.location, null);
    },
    setLocation(payload) {
      setJSON(KEYS.location, payload);
    },
    getSelectedPlaceIds() {
      return getJSON(KEYS.selectedPlaceIds, []);
    },
    setSelectedPlaceIds(ids) {
      setJSON(KEYS.selectedPlaceIds, ids);
    },
    clearSelectedPlaces() {
      setJSON(KEYS.selectedPlaceIds, []);
    },
    getPlannerConfig() {
      return getJSON(KEYS.plannerConfig, null);
    },
    setPlannerConfig(config) {
      setJSON(KEYS.plannerConfig, config);
    },
    getItinerary() {
      return getJSON(KEYS.itinerary, null);
    },
    setItinerary(itinerary) {
      setJSON(KEYS.itinerary, itinerary);
    }
  };
})();
