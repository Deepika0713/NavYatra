(function () {
  const kpisWrap = document.getElementById("dashboard-kpis");
  if (!kpisWrap) {
    return;
  }

  const stopsWrap = document.getElementById("dashboard-stops");
  const suggestionsWrap = document.getElementById("dashboard-suggestions");
  const empty = document.getElementById("dashboard-empty");

  const { getItinerary } = window.NavyatraState;
  const { formatDuration, formatCurrency } = window.NavyatraUI;

  const itinerary = getItinerary();
  if (!itinerary || !itinerary.stops || !itinerary.stops.length) {
    empty.style.display = "block";
    return;
  }

  function renderKPI(label, value) {
    const node = document.createElement("article");
    node.className = "card card-pad kpi";
    node.innerHTML = `<span class="muted">${label}</span><strong>${value}</strong>`;
    return node;
  }

  kpisWrap.appendChild(renderKPI("Total Stops", itinerary.totals.stops));
  kpisWrap.appendChild(renderKPI("Total Duration", formatDuration(itinerary.totals.durationMinutes)));
  kpisWrap.appendChild(renderKPI("Total Cost", formatCurrency(itinerary.totals.cost)));

  itinerary.stops.forEach((stop, idx) => {
    const node = document.createElement("article");
    node.className = "guide-card";
    node.innerHTML = `
      <strong>${idx + 1}. ${stop.name}</strong>
      <div class="muted">${stop.start} - ${stop.end}</div>
      <div class="muted">Entry: INR ${stop.entryFee} | Travel: ${stop.travelKm.toFixed(1)} km via ${stop.travelType}</div>
      <div class="muted">Guide: ${stop.guideInfo}</div>
    `;
    stopsWrap.appendChild(node);
  });

  if (itinerary.warnings.length) {
    itinerary.warnings.forEach((warning) => {
      const node = document.createElement("div");
      node.className = "notice";
      node.textContent = warning;
      suggestionsWrap.appendChild(node);
    });
  }

  if (itinerary.suggestions.length) {
    itinerary.suggestions.forEach((suggestion) => {
      const node = document.createElement("article");
      node.className = "guide-card";
      node.innerHTML = `
        <strong>${suggestion.name}</strong>
        <div class="muted">${suggestion.kind === "must-visit" ? "Nearby must-visit" : "Hidden gem"}</div>
      `;
      suggestionsWrap.appendChild(node);
    });
  }
})();
