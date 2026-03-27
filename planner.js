(async function () {
  const selectedWrap = document.getElementById("planner-selected");
  if (!selectedWrap) {
    return;
  }

  const empty = document.getElementById("planner-empty");
  const clearBtn = document.getElementById("clear-selection");
  const form = document.getElementById("planner-form");

  const { getSelectedPlaceIds, clearSelectedPlaces, setPlannerConfig } = window.NavyatraState;
  const { loadPlaces, normalizePlace } = window.NavyatraData;

  const ids = getSelectedPlaceIds();
  const allPlaces = (await loadPlaces()).map(normalizePlace);
  const selected = allPlaces.filter((p) => ids.includes(p.id));

  function renderSelected() {
    selectedWrap.innerHTML = "";
    if (!selected.length) {
      empty.style.display = "block";
      return;
    }
    empty.style.display = "none";

    selected.forEach((place) => {
      const node = document.createElement("article");
      node.className = "guide-card";
      node.innerHTML = `
        <strong>${place.name}</strong>
        <div class="muted">${place.city}, ${place.state}</div>
        <div class="meta-row" style="margin-top: 0.4rem;">
          <span class="selection-chip">${place.category}</span>
          <span class="selection-chip">${place.average_visit_duration} min</span>
          <span class="selection-chip">INR ${place.entry_fee}</span>
        </div>
      `;
      selectedWrap.appendChild(node);
    });
  }

  clearBtn.addEventListener("click", () => {
    clearSelectedPlaces();
    window.location.reload();
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!selected.length) {
      alert("Select places before generating itinerary.");
      return;
    }

    const config = {
      date: document.getElementById("trip-date").value,
      startTime: document.getElementById("start-time").value,
      travelMode: document.getElementById("travel-mode").value,
      budget: Number(document.getElementById("budget-limit").value || 0),
      needGuide: document.getElementById("need-guide").checked
    };

    if (!config.date || !config.startTime) {
      alert("Please select date and start time.");
      return;
    }

    setPlannerConfig(config);
    window.location.href = "itinerary.html";
  });

  renderSelected();
})();
