async function loadCatalogue(DATA_URL){
  const res = await fetch(DATA_URL, { cache: "no-store" });
  if (!res.ok) throw new Error("Impossible de charger " + DATA_URL);
  return await res.json();
}

function escapeHtml(s){
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function formatPrice(n){
  const v = Number(n);
  if (!Number.isFinite(v)) return "—";
  return v.toLocaleString("fr-FR") + " $";
}

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
    .replace(/\s+/g, " ")
    .replace(/^./, c => c.toUpperCase());
}

function normalizeBrand(brand){
  return (brand || "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/^./, c => c.toUpperCase());
}

function fillTags(tagEl, data){
  if (!tagEl) return;

  const tags = Array.from(new Set(
    data.map(v => normalizeTag(v.tag)).filter(Boolean)
  )).sort((a,b) => a.localeCompare(b, "fr"));

  tagEl.innerHTML =
    `<option value="">Toutes catégories</option>` +
    tags.map(t => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join("");
}

function fillBrands(brandEl, data){
  if (!brandEl) return;

  const brands = Array.from(new Set(
    data.map(v => normalizeBrand(v.brand)).filter(Boolean)
  )).sort((a,b) => a.localeCompare(b, "fr"));

  brandEl.innerHTML =
    `<option value="">Toutes marques</option>` +
    brands.map(b => `<option value="${escapeHtml(b)}">${escapeHtml(b)}</option>`).join("");
}

function sortItems(items, mode){
  const m = (mode || "").toLowerCase();

  if (m === "price_asc") {
    return items.sort((a,b)=>(Number(a.price)||0)-(Number(b.price)||0));
  }

  if (m === "price_desc") {
    return items.sort((a,b)=>(Number(b.price)||0)-(Number(a.price)||0));
  }

  if (m === "name_asc") {
    return items.sort((a,b)=>String(a.name||"").localeCompare(String(b.name||""), "fr"));
  }

  if (m === "name_desc") {
    return items.sort((a,b)=>String(b.name||"").localeCompare(String(a.name||""), "fr"));
  }

  return items;
}

function renderCatalogue({data, grid, qEl, tagEl, brandEl, sortEl, countEl, discordInvite}){
  const query = (qEl?.value || "").toLowerCase().trim();
  const selectedTag = (tagEl?.value || "").toLowerCase().trim();
  const selectedBrand = (brandEl?.value || "").toLowerCase().trim();
  const sortMode = (sortEl?.value || "");

  let items = data.filter(v => {
    const name = String(v.name || "");
    const brand = normalizeBrand(v.brand);
    const tag = normalizeTag(v.tag);

    const okSearch = !query || (name + " " + brand).toLowerCase().includes(query);
    const okTag = !selectedTag || tag.toLowerCase() === selectedTag;
    const okBrand = !selectedBrand || brand.toLowerCase() === selectedBrand;

    return okSearch && okTag && okBrand;
  });

  items = sortItems(items, sortMode);

  if (countEl){
    countEl.textContent = `${items.length} résultat${items.length > 1 ? "s" : ""}`;
  }

  if (!items.length){
    grid.innerHTML = `
      <div class="card">
        <div class="card-title">Aucun résultat</div>
        <p class="small">Change ta recherche ou tes filtres.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = items.map(v => {
    const tag = normalizeTag(v.tag);
    const brand = normalizeBrand(v.brand);
    const img = v.image ? String(v.image) : "images/vehicle-placeholder.png";

    return `
      <div class="card reveal" style="padding:0; overflow:hidden;">
        <div style="height:160px; background:rgba(255,255,255,.06); border-bottom:1px solid rgba(255,255,255,.10);">
          <img
            src="${escapeHtml(img)}"
            alt="${escapeHtml(v.name || "Véhicule")}"
            style="width:100%; height:100%; object-fit:cover; display:block;"
            onerror="this.onerror=null; this.src='images/vehicle-placeholder.png';"
          >
        </div>

        <div style="padding:18px;">
          <div class="card-title">
            ${escapeHtml(v.name || "Sans nom")}
            ${tag ? `<span class="badge" style="margin-left:8px;">${escapeHtml(tag)}</span>` : ""}
          </div>

          <p class="small">${escapeHtml(brand)} • <b>${formatPrice(v.price)}</b></p>

          <div style="margin-top:12px;display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;">
            <span class="badge">${escapeHtml(v.stock || "Disponible")}</span>
            <a class="btn" href="${discordInvite}" target="_blank" rel="noreferrer">Contacter</a>
          </div>
        </div>
      </div>
    `;
  }).join("");

  document.querySelectorAll(".reveal").forEach(el => el.classList.add("show"));
}
