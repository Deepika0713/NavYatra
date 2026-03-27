(function () {
  function initActiveNav() {
    const currentPage = document.body.dataset.page;
    document.querySelectorAll("[data-nav]").forEach((link) => {
      if (link.dataset.nav === currentPage) {
        link.classList.add("active");
      }
    });
  }

  function initRevealAnimations() {
    const revealNodes = document.querySelectorAll(".reveal");
    if (!revealNodes.length) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    revealNodes.forEach((node) => observer.observe(node));
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) {
      node.className = className;
    }
    if (typeof text === "string") {
      node.textContent = text;
    }
    return node;
  }

  function formatDuration(totalMinutes) {
    const safe = Math.max(0, Number(totalMinutes) || 0);
    const h = Math.floor(safe / 60);
    const m = Math.round(safe % 60);
    return `${h}h ${m}m`;
  }

  function formatCurrency(value) {
    return `INR ${Math.round(Number(value) || 0).toLocaleString("en-IN")}`;
  }

  function toMinutes(hhmm) {
    const [h, m] = String(hhmm || "00:00").split(":").map(Number);
    return h * 60 + m;
  }

  function fromMinutes(total) {
    const fixed = Math.max(0, Math.round(total));
    const h = Math.floor(fixed / 60) % 24;
    const m = fixed % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }

  function clampText(input, maxLen) {
    if (!input || input.length <= maxLen) {
      return input || "";
    }
    return `${input.slice(0, maxLen - 1)}...`;
  }

  function smartModeByDistance(km) {
    if (km < 1.2) return "Walk";
    if (km < 5) return "Bus";
    if (km < 15) return "Own vehicle";
    if (km < 35) return "Cab";
    return "Rental";
  }

  window.NavyatraUI = {
    initActiveNav,
    initRevealAnimations,
    el,
    formatDuration,
    formatCurrency,
    toMinutes,
    fromMinutes,
    clampText,
    smartModeByDistance
  };

  initActiveNav();
  initRevealAnimations();
})();
