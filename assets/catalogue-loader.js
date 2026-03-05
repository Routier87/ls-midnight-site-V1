async function loadCatalogue(DATA_URL){
  const res = await fetch(DATA_URL, { cache:"no-store" });
  if (!res.ok) throw new Error("Impossible de charger " + DATA_URL);
  return await res.json();
}

function escapeHtml(s){
  return String(s)
    .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
    .replaceAll('"',"&quot;").replaceAll("'","&#039;");
}

function formatPrice(n){
  const v = Number(n);
  if (!Number.isFinite(v)) return "—";
  return v.toLocaleString("fr-FR") + " $";
}

function fillTags(tagEl, data){
  if (!tagEl) return;
  const tags = Array.from(new Set(data.map(v => (v.tag || "").trim()).filter(Boolean))).sort();
  tagEl.innerHTML = `<option value="">Tous</option>` + tags.map(t => `<option>${escapeHtml(t)}</option>`).join("");
}

function renderCatalogue({data, grid, qEl, tagEl, discordInvite}){
  const query = (qEl?.value || "").toLowerCase().trim();
  const t = (tagEl?.value || "").toLowerCase().trim();

  const items = data.filter(v => {
    const okQ = !query || (String(v.name)+" "+String(v.brand||"")).toLowerCase().includes(query);
    const okT = !t || String(v.tag||"").toLowerCase() === t;
    return okQ && okT;
  });

  if(!items.length){
    grid.innerHTML = `<div class="card"><div class="card-title">Aucun résultat</div><p>Change ta recherche ou ton filtre.</p></div>`;
    return;
  }

  grid.innerHTML = items.map(v => `
    <div class="card reveal">
      <div class="card-title">
        ${escapeHtml(v.name)}
        ${v.tag ? `<span class="badge" style="margin-left:8px;">${escapeHtml(v.tag)}</span>` : ""}
      </div>
      <p class="small">${escapeHtml(v.brand||"")} • <b>${formatPrice(v.price)}</b></p>
      <div style="margin-top:10px;display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;">
        <span class="badge">${escapeHtml(v.stock||"Disponible")}</span>
        <a class="btn" href="${discordInvite}" target="_blank" rel="noreferrer">Contacter</a>
      </div>
    </div>
  `).join("");

  document.querySelectorAll(".reveal").forEach(el => el.classList.add("show"));
}
