import json, re, time
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

BASE = "https://www.gtabase.com/media/com_jamegafilter/en_gb/{}.json"
UA = "LSMidnightCatalogueBuilder/1.0"

def fetch_json(url):
    req = Request(url, headers={"User-Agent": UA})
    with urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode("utf-8"))

def pick_attr(item, wanted_titles):
    """
    Dans les JSON GTABase, item['attr'] contient des champs ctXX avec 'title' et 'value'/'frontend_value'.
    On récupère la première valeur matching.
    """
    attr = item.get("attr") or {}
    for _, field in attr.items():
        if not isinstance(field, dict): 
            continue
        titles = field.get("title")
        if not (isinstance(titles, list) and titles):
            continue
        t = str(titles[0]).strip().lower()
        if t in wanted_titles:
            if "frontend_value" in field and isinstance(field["frontend_value"], list) and field["frontend_value"]:
                return field["frontend_value"][0]
            if "value" in field:
                return field["value"]
            if "formatted_value" in field:
                return field["formatted_value"]
    return None

def to_int_price(v):
    if v is None: 
        return None
    s = str(v)
    s = s.replace(",", "").replace("$", "").replace("GTA$", "").strip()
    m = re.search(r"\d+", s)
    return int(m.group(0)) if m else None

def classify(vehicle_class):
    """
    On sépare en 4 catégories demandées :
    - voitures : tout ce qui n’est pas moto/bateau/avion/hélico
    - motos : Motorcycles
    - bateaux : Boats
    - aeroport : Planes + Helicopters
    """
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

def main():
    out = {"voitures": [], "motos": [], "bateaux": [], "aeroport": []}
    seen = set()

    idx = 1
    while True:
        url = BASE.format(idx)
        try:
            data = fetch_json(url)
        except HTTPError as e:
            # quand on dépasse le dernier fichier, ça 404
            if e.code == 404:
                break
            raise
        except URLError:
            break

        # chaque page contient des item_#### 
        items = [v for k, v in data.items() if str(k).startswith("item_") and isinstance(v, dict)]
        if not items:
            break

        for it in items:
            # on veut seulement les véhicules (ils ont un "Vehicle Class")
            vehicle_class = pick_attr(it, {"vehicle class"})
            if not vehicle_class:
                continue

            name = it.get("title") or it.get("name") or ""
            if not name:
                continue

            # éviter doublons
            key = name.strip().lower()
            if key in seen:
                continue
            seen.add(key)

            manufacturer = pick_attr(it, {"manufacturer"}) or ""
            price_raw = pick_attr(it, {"gta online price", "price", "purchase price", "buy it now price"})
            price = to_int_price(price_raw)

            category = classify(vehicle_class)
            out[category].append({
                "name": str(name).strip(),
                "brand": str(manufacturer).strip(),
                "price": price if price is not None else 0,
                "tag": str(vehicle_class).strip(),     # pour le filtre (ex: Sports, Motorcycles, Boats, Planes...)
                "stock": "Disponible"
            })

        print(f"Page {idx} ok | Total véhicules: {sum(len(out[k]) for k in out)}")
        idx += 1
        time.sleep(0.35)  # petit délai “polite”

    # tri
    for k in out:
        out[k].sort(key=lambda x: (x["tag"], x["price"], x["name"]))

    # écriture
    with open("data/voitures.json", "w", encoding="utf-8") as f:
        json.dump(out["voitures"], f, ensure_ascii=False, indent=2)
    with open("data/motos.json", "w", encoding="utf-8") as f:
        json.dump(out["motos"], f, ensure_ascii=False, indent=2)
    with open("data/bateaux.json", "w", encoding="utf-8") as f:
        json.dump(out["bateaux"], f, ensure_ascii=False, indent=2)
    with open("data/aeroport.json", "w", encoding="utf-8") as f:
        json.dump(out["aeroport"], f, ensure_ascii=False, indent=2)

    print("✅ Généré : data/voitures.json, motos.json, bateaux.json, aeroport.json")

if __name__ == "__main__":
    main()
