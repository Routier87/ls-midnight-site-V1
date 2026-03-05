// ===== Charger un JSON catalogue =====
async function loadCatalogue(DATA_URL){
  const res = await fetch(DATA_URL, { cache:"no-store" });
  if (!res.ok) throw new Error("Impossible de charger " + DATA_URL);
  return await res.json();
}

// ===== Sécurité HTML =====
function escapeHtml(s){
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

// ===== Format prix =====
function formatPrice(n){
  const v = Number(n);
  if (!Number.isFinite(v)) return "—";
  return v.toLocaleString("fr-FR") + " $";
}

// ===== Normaliser catégories GTA =====
function normalizeTag(tag){
  const t = String(tag || "").trim().toLowerCase();

  const map = {
    "sports": "Sport",
    "super": "Super",
    "muscle": "Muscle",
    "sedans": "Berlines",
    "suvs": "SUV",
    "coupes": "Coupés",
    "compacts": "Compacts",
    "off-road": "Offroad",
    "motorcycles": "Moto",
    "boats": "Bateau",
    "planes": "Avion",
    "helicopters": "Hélico",
    "industrial": "Industriel",
    "commercial": "Commercial",
    "vans": "Vans",
    "utility": "Utilitaire",
    "service": "Service",
    "emergency": "Urgence"
  };

  if (map[t]) return map[t];

  return (tag || "")
    .trim()
    .replace(/\s+/g," ")
    .replace(/^./, c => c.toUpperCase());
}

// ===== Remplir le menu des catégories =====
function fillTags(tagEl, data){
  if (!tagEl) return;

  const tags = Array.from(new Set(
    data.map(v => normalizeTag(v.tag)).filter(Boolean)
  )).sort((a,b) => a.localeCompare(b, "fr"));

  tagEl.innerHTML =
    `<option value="">Tous</option>` +
    tags.map(t => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join("");
}

// ===== Affichage catalogue =====
function renderCatalogue({data, grid, qEl, tagEl, discordInvite}){

  const query = (qEl?.value || "").toLowerCase().trim();
  const selectedTag = (tagEl?.value || "").toLowerCase().trim();

  const items = data.filter(v => {

    const name = String(v.name || "");
    const brand = String(v.brand || "");
    const tag = normalizeTag(v.tag);

    const okSearch =
      !query ||
      (name + " " + brand).toLowerCase().includes(query);

    const okTag =
      !selectedTag ||
      tag.toLowerCase() === selectedTag;

    return okSearch && okTag;
  });

  // ===== Aucun résultat =====
  if(!items.length){
    grid.innerHTML = `
      <div class="card">
        <div class="card-title">Aucun résultat</div>
        <p class="small">Change ta recherche ou ton filtre.</p>
      </div>`;
    return;
  }

  // ===== Générer cartes =====
  grid.innerHTML = items.map(v => {

    const tag = normalizeTag(v.tag);

    return `
      <div class="card reveal">

        <div class="card-title">
          ${escapeHtml(v.name || "Sans nom")}
          ${tag ? `<span class="badge" style="margin-left:8px;">${escapeHtml(tag)}</span>` : ""}
        </div>

        <p class="small">
          ${escapeHtml(v.brand || "")}
          • <b>${formatPrice(v.price)}</b>
        </p>

        <div style="
          margin-top:10px;
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap:10px;
          flex-wrap:wrap;
        ">

          <span class="badge">
            ${escapeHtml(v.stock || "Disponible")}
          </span>

          <a class="btn"
             href="${discordInvite}"
             target="_blank"
             rel="noreferrer">
            Contacter
          </a>

        </div>

      </div>
    `;
  }).join("");

  // ===== animation reveal =====
  document.querySelectorAll(".reveal").forEach(el=>{
    el.classList.add("show");
  });
}
