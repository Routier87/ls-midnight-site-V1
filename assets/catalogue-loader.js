async function loadCatalogue(DATA_URL){
  const res = await fetch(DATA_URL);
  if (!res.ok) throw new Error("Impossible de charger " + DATA_URL);
  return await res.json();
}

function escapeHtml(s){
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;");
}

function formatPrice(n){
  const v = Number(n);
  if (!Number.isFinite(v)) return "—";
  return v.toLocaleString("fr-FR") + " $";
}

function normalizeTag(tag){
  const map = {
    "sports": "Sport",
    "super": "Super",
    "muscle": "Muscle",
    "sedans": "Berline",
    "suvs": "SUV",
    "coupes": "Coupé",
    "compacts": "Compact",
    "off-road": "Offroad",
    "motorcycles": "Moto",
    "boats": "Bateau",
    "planes": "Avion",
    "helicopters": "Hélico"
  };

  const t = String(tag||"").toLowerCase();
  if(map[t]) return map[t];

  return tag || "";
}

function fillTags(tagEl,data){

  const tags = [...new Set(
    data.map(v=>normalizeTag(v.tag)).filter(Boolean)
  )];

  tagEl.innerHTML =
    `<option value="">Toutes catégories</option>` +
    tags.map(t=>`<option>${escapeHtml(t)}</option>`).join("");
}

function fillBrands(brandEl,data){

  const brands = [...new Set(
    data.map(v=>v.brand).filter(Boolean)
  )];

  brandEl.innerHTML =
    `<option value="">Toutes marques</option>` +
    brands.map(b=>`<option>${escapeHtml(b)}</option>`).join("");
}

function renderCatalogue({
  data,
  grid,
  qEl,
  tagEl,
  brandEl,
  sortEl,
  countEl,
  discordInvite
}){

  const query = (qEl?.value||"").toLowerCase();
  const tag = (tagEl?.value||"").toLowerCase();
  const brand = (brandEl?.value||"").toLowerCase();
  const sort = sortEl?.value||"";

  let items = data.filter(v=>{

    const name = (v.name||"").toLowerCase();
    const brandV = (v.brand||"").toLowerCase();
    const tagV = normalizeTag(v.tag).toLowerCase();

    const okSearch =
      !query ||
      name.includes(query) ||
      brandV.includes(query);

    const okTag =
      !tag ||
      tagV===tag;

    const okBrand =
      !brand ||
      brandV===brand;

    return okSearch && okTag && okBrand;

  });

  if(sort==="price_asc")
    items.sort((a,b)=>a.price-b.price);

  if(sort==="price_desc")
    items.sort((a,b)=>b.price-a.price);

  if(sort==="name_asc")
    items.sort((a,b)=>a.name.localeCompare(b.name));

  if(sort==="name_desc")
    items.sort((a,b)=>b.name.localeCompare(a.name));

  if(countEl)
    countEl.textContent = items.length + " résultat(s)";

  if(!items.length){

    grid.innerHTML = `
      <div class="card">
        <div class="card-title">Aucun résultat</div>
      </div>`;

    return;
  }

  grid.innerHTML = items.map(v=>`

    <div class="card">

      <div class="card-title">
        ${escapeHtml(v.name)}
      </div>

      <p class="small">
        ${escapeHtml(v.brand)} •
        <b>${formatPrice(v.price)}</b>
      </p>

      <span class="badge">
        ${normalizeTag(v.tag)}
      </span>

      <div style="margin-top:10px">

        <a class="btn"
        href="${discordInvite}"
        target="_blank">

        Contacter

        </a>

      </div>

    </div>

  `).join("");

}
