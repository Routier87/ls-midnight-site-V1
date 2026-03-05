document.addEventListener("DOMContentLoaded", () => {
  const y = document.querySelector("[data-year]");
  if (y) y.textContent = new Date().getFullYear();

  const items = document.querySelectorAll(".reveal");
  if (!items.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("show"); });
  }, { threshold: 0.12 });

  items.forEach(el => io.observe(el));
});
