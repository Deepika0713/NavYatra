(async function () {
  const timelineWrap = document.getElementById("timeline");
  if (!timelineWrap) {
    return;
  }

  const timelineEmpty = document.getElementById("timeline-empty");
  const warningsWrap = document.getElementById("warnings");
  const routeList = document.getElementById("route-list");
  const mapFrame = document.getElementById("map-frame");

  const kpiStops = document.getElementById("kpi-stops");
  const kpiTime = document.getElementById("kpi-time");
  const kpiCost = document.getElementById("kpi-cost");

  const { getLocation, getPlannerConfig, getSelectedPlaceIds, getItinerary, setItinerary } = window.NavyatraState;
  const {
    loadPlaces,
    normalizePlace,
    isOpenAt,
    getTravelMetrics,
    findGuideAvailability,
    distanceKm
  } = window.NavyatraData;
  const { toMinutes, fromMinutes, formatDuration, formatCurrency } = window.NavyatraUI;

  function renderTimelineItem(container, item) {
    const node = document.createElement("article");
    node.className = "timeline-item animate-rise";
    node.innerHTML = `
      <div class="timeline-time">${item.endTime ? `${item.time} -> ${item.endTime}` : item.time}</div>
      <div>
        <strong>${item.title}</strong>
        <div class="muted">${item.detail || ""}</div>
        ${item.guideInfo ? `<div class="guide-card" style="margin-top: 0.45rem;">${item.guideInfo}</div>` : ""}
      </div>
    `;
    container.appendChild(node);
  }

  function renderFromSavedItinerary(saved) {
    timelineWrap.innerHTML = "";
    routeList.innerHTML = "";
    warningsWrap.innerHTML = "";
    timelineEmpty.style.display = "none";

    const savedTimeline = Array.isArray(saved.timeline) ? saved.timeline : [];
    const savedStops = Array.isArray(saved.stops) ? saved.stops : [];
    const timelineSource = savedTimeline.length
      ? savedTimeline
      : savedStops.map((stop) => ({
          type: "visit",
          time: stop.start,
          endTime: stop.end,
          title: `Visit ${stop.name}`,
          detail: `Entry INR ${stop.entryFee} | Travel mode: ${stop.travelType}`,
          guideInfo: stop.guideInfo
        }));

    timelineSource.forEach((item) => renderTimelineItem(timelineWrap, item));

    savedStops.forEach((stop, idx) => {
      const node = document.createElement("article");
      node.className = "guide-card";
      node.innerHTML = `
        <strong>${idx + 1}. ${stop.name}</strong>
        <div class="muted">${stop.start} - ${stop.end} | ${Number(stop.travelKm || 0).toFixed(1)} km</div>
        <div class="muted">Travel mode: ${stop.travelType || "N/A"}</div>
      `;
      routeList.appendChild(node);
    });

    const savedWarnings = Array.isArray(saved.warnings) ? saved.warnings : [];
    savedWarnings.forEach((warning) => {
      const node = document.createElement("div");
      node.className = "notice";
      node.textContent = warning;
      warningsWrap.appendChild(node);
    });

    if (saved.totals) {
      kpiStops.textContent = String(saved.totals.stops || savedStops.length || 0);
      kpiTime.textContent = formatDuration(saved.totals.durationMinutes || 0);
      kpiCost.textContent = formatCurrency(saved.totals.cost || 0);
    }

    if (savedStops.length && saved.location && saved.location.city) {
      const waypoints = savedStops.map((s) => encodeURIComponent(`${s.name}, ${saved.location.city}`)).join("|");
      mapFrame.src = `https://maps.google.com/maps?q=${waypoints}&output=embed`;
    } else {
      mapFrame.style.display = "none";
    }
  }

  const location = getLocation();
  const plannerConfig = getPlannerConfig();
  const selectedIds = getSelectedPlaceIds();
  const savedItinerary = getItinerary();

  if (!location || !plannerConfig || !selectedIds.length) {
    if (savedItinerary && Array.isArray(savedItinerary.stops) && savedItinerary.stops.length) {
      renderFromSavedItinerary(savedItinerary);
      return;
    }

    timelineEmpty.style.display = "block";
    mapFrame.style.display = "none";
    warningsWrap.innerHTML = '<div class="notice">No active planner session found. Generate itinerary from Planner page.</div>';
    return;
  }

  const allPlaces = (await loadPlaces()).map(normalizePlace);
  const selectedPlaces = allPlaces.filter((p) => selectedIds.includes(p.id));

  if (!selectedPlaces.length) {
    if (savedItinerary && Array.isArray(savedItinerary.stops) && savedItinerary.stops.length) {
      renderFromSavedItinerary(savedItinerary);
      return;
    }

    timelineEmpty.style.display = "block";
    mapFrame.style.display = "none";
    warningsWrap.innerHTML = '<div class="notice">Selected places are not available now. Re-select places from the Places page.</div>';
    return;
  }

  function optimizeRoute(startPoint, places) {
    const pending = [...places];
    const ordered = [];
    let current = startPoint;

    while (pending.length) {
      let nearestIdx = 0;
      let nearestDistance = Infinity;
      pending.forEach((place, idx) => {
        const d = distanceKm(current, place.coordinates);
        if (d < nearestDistance) {
          nearestDistance = d;
          nearestIdx = idx;
        }
      });
      const next = pending.splice(nearestIdx, 1)[0];
      ordered.push(next);
      current = next.coordinates;
    }

    return ordered;
  }

  const route = optimizeRoute(location.coordinates, selectedPlaces);
  let currentMinutes = toMinutes(plannerConfig.startTime);
  let totalCost = 0;
  let totalTravel = 0;
  const warnings = [];
  const timeline = [];
  const finalStops = [];

  let previousCoordinates = location.coordinates;

  route.forEach((place, index) => {
    const metrics = getTravelMetrics(previousCoordinates, place.coordinates, plannerConfig.travelMode);
    currentMinutes += metrics.minutes;
    totalTravel += metrics.minutes;
    totalCost += metrics.cost;

    const visitStart = currentMinutes;
    const visitEnd = visitStart + place.average_visit_duration;
    const arrivalHHMM = fromMinutes(visitStart);

    if (!isOpenAt(place, arrivalHHMM)) {
      warnings.push(`Note: ${place.name} may be closed at arrival (${arrivalHHMM}). Hours: ${place.opening_time}-${place.closing_time}.`);
    }
    const availability = plannerConfig.needGuide
      ? findGuideAvailability(place, visitStart, visitEnd)
      : { isAvailable: false, guide: null, nextSlot: null };

    let guideCost = 0;
    let guideInfo = "Guide not requested";

    if (plannerConfig.needGuide) {
      if (availability.isAvailable) {
        guideCost = availability.guide.fee;
        guideInfo = `${availability.guide.name}, ${availability.guide.experience_years} yrs, INR ${availability.guide.fee}`;
      } else if (availability.nextSlot) {
        guideInfo = `No free guide now. Next slot: ${availability.nextSlot.slot} (${availability.nextSlot.guide.name})`;
      } else {
        guideInfo = "No guide available for this place at selected window";
      }
    }

    totalCost += place.entry_fee + guideCost;

    timeline.push({
      type: "travel",
      time: fromMinutes(visitStart - metrics.minutes),
      endTime: fromMinutes(visitStart),
      title: `Travel to ${place.name}`,
      detail: `${metrics.km.toFixed(1)} km | ${Math.round(metrics.minutes)} min | Travel mode: ${plannerConfig.travelMode}`
    });

    timeline.push({
      type: "visit",
      time: fromMinutes(visitStart),
      endTime: fromMinutes(visitStart + place.average_visit_duration),
      title: `Visit ${place.name}`,
      detail: `${place.average_visit_duration} min | Entry INR ${place.entry_fee} | Crowd ${place.crowd_level}`,
      guideInfo
    });

    finalStops.push({
      name: place.name,
      city: place.city,
      start: fromMinutes(visitStart),
      end: fromMinutes(visitEnd),
      travelKm: metrics.km,
      travelType: plannerConfig.travelMode,
      entryFee: place.entry_fee,
      guide: availability,
      guideInfo
    });

    currentMinutes = visitEnd;
    previousCoordinates = place.coordinates;
  });

  const totalDuration = currentMinutes - toMinutes(plannerConfig.startTime);

  timeline.forEach((item) => renderTimelineItem(timelineWrap, item));

  warningsWrap.innerHTML = "";
  warnings.forEach((warning) => {
    const node = document.createElement("div");
    node.className = "notice";
    node.textContent = warning;
    warningsWrap.appendChild(node);
  });

  routeList.innerHTML = "";
  finalStops.forEach((stop, idx) => {
    const node = document.createElement("article");
    node.className = "guide-card";
    node.innerHTML = `
      <strong>${idx + 1}. ${stop.name}</strong>
      <div class="muted">${stop.start} - ${stop.end} | ${stop.travelKm.toFixed(1)} km</div>
      <div class="muted">Travel mode: ${stop.travelType}</div>
    `;
    routeList.appendChild(node);
  });

  const waypoints = finalStops.map((s) => encodeURIComponent(`${s.name}, ${location.city}`)).join("|");
  mapFrame.src = `https://maps.google.com/maps?q=${waypoints}&output=embed`;

  const itineraryPayload = {
    generatedAt: new Date().toISOString(),
    config: plannerConfig,
    location,
    timeline,
    stops: finalStops,
    warnings,
    totals: {
      stops: finalStops.length,
      durationMinutes: totalDuration,
      travelMinutes: Math.round(totalTravel),
      cost: Math.round(totalCost)
    },
    suggestions: generateSuggestions(allPlaces, finalStops, location)
  };

  setItinerary(itineraryPayload);

  kpiStops.textContent = String(finalStops.length);
  kpiTime.textContent = formatDuration(totalDuration);
  kpiCost.textContent = formatCurrency(totalCost);

  if (plannerConfig.budget > 0 && totalCost > plannerConfig.budget) {
    const overBudget = document.createElement("div");
    overBudget.className = "notice";
    overBudget.textContent = `Budget warning: planned trip exceeds limit by INR ${Math.round(totalCost - plannerConfig.budget)}.`;
    warningsWrap.prepend(overBudget);
  }

  function generateSuggestions(all, stops, currentLocation) {
    const visitedIds = new Set(stops.map((s) => {
      const place = all.find((p) => p.name === s.name);
      return place ? place.id : "";
    }));

    return all
      .filter((place) => !visitedIds.has(place.id) && place.state === currentLocation.state)
      .map((place) => ({
        name: place.name,
        score: distanceKm(currentLocation.coordinates, place.coordinates) + (place.entry_fee / 100),
        kind: place.category === "heritage" || place.category === "nature" ? "must-visit" : "hidden-gem"
      }))
      .sort((a, b) => a.score - b.score)
      .slice(0, 5);
  }
})();
