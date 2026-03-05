import json, re, time
from urllib.request import Request, urlopen
from urllib.error import HTTPError

BASE = "https://www.gtabase.com/media/com_jamegafilter/en_gb/{}.json"

def fetch_json(url):
    req = Request(url, headers={
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json,text/plain,*/*",
        "Referer": "https://www.gtabase.com/grand-theft-auto-v/vehicles/"
    })
    with urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode("utf-8"))

def pick_attr(item, wanted_titles):
    attr = item.get("attr") or {}
    for _, field in attr.items():
        if not isinstance(field, dict): 
            continue
        titles = field.get("title")
        if not (isinstance(titles, list) and titles):
            continue
        t = str(titles[0]).strip().lower()
        if t in wanted_titles:
            fv = field.get("frontend_value")
            if isinstance(fv, list) and fv:
                return fv[0]
            if "value" in field:
                return field["value"]
            if "formatted_value" in field:
                return field["formatted_value"]
    return None

def to_int_price(v):
    if v is None: 
        return None
    s = str(v).replace(",", "").replace("$", "").replace("GTA$", "").strip()
    m = re.search(r"\d+", s)
    return int(m.group(0)) if m else None

def classify(vehicle_class):
    if not vehicle_class:
        return "voitures"
    vc = str(vehicle_class).strip().lower()
    if "motorcycle" in vc:
        return "motos"
    if "boat" in vc:
        return "bateaux"
    if "plane" in vc or "helicopter" in vc:
        return "aeroport"
    return "voitures"

def pick_image(item):
    # On essaye plusieurs clés possibles (selon la structure)
    for k in ["image", "img", "thumbnail", "thumb", "picture", "photo"]:
        if k in item and isinstance(item[k], str) and item[k].startswith("http"):
            return item[k]
    # parfois il y a un tableau d'images
    for k in ["images", "gallery"]:
        if k in item and isinstance(item[k], list) and item[k]:
            v = item[k][0]
            if isinstance(v, str) and v.startswith("http"):
                return v
            if isinstance(v, dict):
                for kk in ["url", "src", "image"]:
                    if kk in v and isinstance(v[kk], str) and v[kk].startswith("http"):
                        return v[kk]
    return None

def main():
    out = {"voitures": [], "motos": [], "bateaux": [], "aeroport": []}
    seen = set()

    idx = 1
    while True:
        url = BASE.format(idx)
        try:
            data = fetch_json(url)
        except HTTPError as e:
            if e.code == 404:
                break
            raise

        items = [v for k, v in data.items() if str(k).startswith("item_") and isinstance(v, dict)]
        if not items:
            break

        for it in items:
            vehicle_class = pick_attr(it, {"vehicle class"})
            if not vehicle_class:
                continue

            name = it.get("title") or it.get("name") or ""
            if not name:
                continue

            key = name.strip().lower()
            if key in seen:
                continue
            seen.add(key)

            manufacturer = pick_attr(it, {"manufacturer"}) or ""
            price_raw = pick_attr(it, {"gta online price", "price", "purchase price", "buy it now price"})
            price = to_int_price(price_raw)

            cat = classify(vehicle_class)
            out[cat].append({
                "name": str(name).strip(),
                "brand": str(manufacturer).strip(),
                "price": int(price or 0),
                "tag": str(vehicle_class).strip(),
                "stock": "Disponible",
                "image": pick_image(it)  # si dispo, sinon null
            })

        print(f"Page {idx} OK | total={sum(len(out[k]) for k in out)}")
        idx += 1
        time.sleep(0.35)

    # tri propre
    for k in out:
        out[k].sort(key=lambda x: (x["tag"], x["price"], x["name"]))

    import os
    os.makedirs("data", exist_ok=True)

    with open("data/voitures.json", "w", encoding="utf-8") as f:
        json.dump(out["voitures"], f, ensure_ascii=False, indent=2)
    with open("data/motos.json", "w", encoding="utf-8") as f:
        json.dump(out["motos"], f, ensure_ascii=False, indent=2)
    with open("data/bateaux.json", "w", encoding="utf-8") as f:
        json.dump(out["bateaux"], f, ensure_ascii=False, indent=2)
    with open("data/aeroport.json", "w", encoding="utf-8") as f:
        json.dump(out["aeroport"], f, ensure_ascii=False, indent=2)

    print("✅ JSON générés dans /data")

if __name__ == "__main__":
    main()
