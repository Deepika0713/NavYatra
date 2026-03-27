(function () {
  const { cityCoordinates, setLocation } = window.NavyatraState;
  const form = document.getElementById("home-location-form");
  if (!form) {
    return;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const state = document.getElementById("home-state").value.trim();
    const city = document.getElementById("home-city").value.trim();

    if (!state || !city) {
      return;
    }

    const fallback = { lat: 20.5937, lng: 78.9629 };
    const coordinates = cityCoordinates[city] || fallback;

    setLocation({ state, city, coordinates });
    window.location.href = "places.html";
  });
})();
