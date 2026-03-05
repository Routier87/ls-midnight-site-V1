document.addEventListener("DOMContentLoaded", () => {
  // Année footer
  const y = document.querySelector("[data-year]");
  if (y) y.textContent = new Date().getFullYear();

  // Menu mobile (si tu ajoutes un bouton .nav-toggle avec id="navToggle")
  const t = document.getElementById("navToggle");
  const links = document.querySelector(".links");
  if (t && links) {
    t.addEventListener("click", () => links.classList.toggle("open"));
  }

  // Reveal animations (optionnel)
  const items = document.querySelectorAll(".reveal");
  if (!items.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) e.target.classList.add("show");
    });
  }, { threshold: 0.12 });

  items.forEach(el => io.observe(el));
});
