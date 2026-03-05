// assets/catalogue-loader.js

async function loadCatalogue(DATA_URL){
  const res = await fetch(DATA_URL, { cache:"no-store" });
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

/* Remplit automatiquement le select avec toutes les catégories trouvées dans le JSON */
function fillTags(tagEl, data){
  if (!tagEl) return;

  const tags = Array.from(
    new Set(
      data.map(v => (v.tag || "").trim()).filter(Boolean)
    )
  ).sort((a,b) => a.localeCompare(b, "fr"));

  tagEl.innerHTML =
    `<option value="">Tous</option>` +
    tags.map(t => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join("");
}

/* Affiche le catalogue + recherche + filtre */
function renderCatalogue({data, grid, qEl, tagEl, discordInvite}){
  const query = (qEl?.value || "").toLowerCase().trim();
  const t = (tagEl?.value || "").toLowerCase().trim();

  const items = data.filter(v => {
    const name = String(v.name || "");
    const brand = String(v.brand || "");
    const tag = String(v.tag || "");

    const okQ = !query || (name + " " + brand).toLowerCase().includes(query);
    const okT = !t || tag.toLowerCase() === t;
    return okQ && okT;
  });

  if(!items.length){
    grid.innerHTML = `
      <div class="card">
        <div class="card-title">Aucun résultat</div>
        <p class="small">Change ta recherche ou ton filtre.</p>
      </div>`;
    return;
  }

  grid.innerHTML = items.map(v => `
    <div class="card reveal">
      <div class="card-title">
        ${escapeHtml(v.name || "Sans nom")}
        ${v.tag ? `<span class="badge" style="margin-left:8px;">${escapeHtml(v.tag)}</span>` : ""}
      </div>
      <p class="small">
        ${escapeHtml(v.brand || "")}
        • <b>${formatPrice(v.price)}</b>
      </p>

      <div style="margin-top:10px;display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;">
        <span class="badge">${escapeHtml(v.stock || "Disponible")}</span>
        <a class="btn" href="${discordInvite}" target="_blank" rel="noreferrer">Contacter</a>
      </div>
    </div>
  `).join("");

  // si l'animation reveal existe, on force l'affichage après ajout
  document.querySelectorAll(".reveal").forEach(el => el.classList.add("show"));
}
