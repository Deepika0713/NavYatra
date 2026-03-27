(function () {
  const RATES = {
    cab: { speed: 24, perKm: 16 },
    rental: { speed: 30, perKm: 12 },
    own: { speed: 28, perKm: 8 },
    bus: { speed: 18, perKm: 5 },
    walk: { speed: 4.8, perKm: 0 }
  };

  async function loadPlaces() {
    try {
      const response = await fetch("data/places.json");
      if (!response.ok) {
        throw new Error("Could not load places data.");
      }
      const data = await response.json();
      if (Array.isArray(data) && data.length) {
        return data;
      }
    } catch (_error) {
      // Fall back to embedded data when fetch is blocked (e.g., opened via file://).
    }

    const embedded = window.NavyatraEmbeddedPlaces;
    return Array.isArray(embedded) ? embedded : [];
  }

  function normalizePlace(place) {
    return {
      id: place.id,
      name: place.name,
      state: place.state,
      city: place.city,
      coordinates: place.coordinates || { lat: 0, lng: 0 },
      opening_time: place.opening_time || "09:00",
      closing_time: place.closing_time || "17:00",
      entry_fee: Number(place.entry_fee || 0),
      guide_available: Boolean(place.guide_available),
      average_visit_duration: Number(place.average_visit_duration || 60),
      images: Array.isArray(place.images) ? place.images : [],
      category: place.category || "heritage",
      description: place.description || "No description available.",
      suggested_visit_time: place.suggested_visit_time || "morning",
      crowd_level: place.crowd_level || "Medium",
      guide_fee: Number(place.guide_fee || 0),
      guides: Array.isArray(place.guides) ? place.guides : []
    };
  }

  function toMinutes(hhmm) {
    const [h, m] = String(hhmm).split(":").map(Number);
    return h * 60 + m;
  }

  function distanceKm(a, b) {
    const R = 6371;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const aa =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((a.lat * Math.PI) / 180) *
        Math.cos((b.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
    return R * c;
  }

  function isOpenAt(place, hhmm) {
    const check = toMinutes(hhmm);
    const open = toMinutes(place.opening_time);
    const close = toMinutes(place.closing_time);
    return check >= open && check <= close;
  }

  function getTravelMetrics(from, to, mode) {
    const config = RATES[mode] || RATES.cab;
    const km = distanceKm(from, to);
    const minutes = (km / config.speed) * 60;
    const cost = km * config.perKm;
    return { km, minutes, cost, speed: config.speed };
  }

  function findGuideAvailability(place, visitStartMins, visitEndMins) {
    if (!place.guide_available || !place.guides.length) {
      return { isAvailable: false, guide: null, nextSlot: null };
    }

    let bestFuture = null;
    for (const guide of place.guides) {
      const slots = Array.isArray(guide.available_slots) ? guide.available_slots : [];
      for (const slot of slots) {
        const [s, e] = slot.split("-");
        const start = toMinutes(s);
        const end = toMinutes(e);
        if (visitStartMins >= start && visitEndMins <= end) {
          return { isAvailable: true, guide, nextSlot: null };
        }
        if (start >= visitStartMins) {
          if (!bestFuture || start < bestFuture.start) {
            bestFuture = { guide, slot, start };
          }
        }
      }
    }

    return {
      isAvailable: false,
      guide: null,
      nextSlot: bestFuture ? { guide: bestFuture.guide, slot: bestFuture.slot } : null
    };
  }

  window.NavyatraData = {
    loadPlaces,
    normalizePlace,
    distanceKm,
    isOpenAt,
    getTravelMetrics,
    findGuideAvailability,
    rates: RATES
  };
})();
