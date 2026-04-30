(function () {
  var root = document.documentElement;
  var storedTheme = localStorage.getItem("theme");
  var prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
  var initialTheme = storedTheme || (prefersLight ? "light" : "dark");

  root.setAttribute("data-theme", initialTheme);

  var navToggle = document.querySelector(".nav-toggle");
  var navLinks = document.querySelector(".nav-links");
  var themeToggle = document.querySelector(".theme-toggle");
  var progress = document.querySelector(".reading-progress");
  var backToTop = document.querySelector(".back-to-top");

  function setTheme(theme) {
    root.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    if (themeToggle) {
      themeToggle.textContent = theme === "dark" ? "☾" : "☀";
    }
  }

  setTheme(initialTheme);

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", function () {
      var isOpen = navLinks.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });

    navLinks.addEventListener("click", function (event) {
      if (event.target.tagName === "A") {
        navLinks.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      var nextTheme = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      setTheme(nextTheme);
    });
  }

  function updateScrollUI() {
    var scrollTop = window.scrollY || document.documentElement.scrollTop;
    var maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    var ratio = maxScroll > 0 ? scrollTop / maxScroll : 0;

    if (progress) {
      progress.style.width = Math.min(100, Math.max(0, ratio * 100)) + "%";
    }

    if (backToTop) {
      backToTop.classList.toggle("is-visible", scrollTop > 420);
    }
  }

  window.addEventListener("scroll", updateScrollUI, { passive: true });
  window.addEventListener("resize", updateScrollUI);
  updateScrollUI();

  if (backToTop) {
    backToTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
})();
