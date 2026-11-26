import json
import os
import sqlite3
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any, Dict, List, Optional

APP_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = APP_DIR.parent if APP_DIR.name == "app" else APP_DIR
ENV_PATH = PROJECT_ROOT / ".env"
NOTION_VERSION = "2022-06-28"


def load_dotenv_file(path: Path = ENV_PATH) -> None:
    """Загружает переменные из .env в окружение, если они ещё не заданы."""
    if not path.exists():
        return
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


def resolve_db_path() -> Path:
    db_env = os.getenv("ECORELOCATE_DB_PATH", "").strip().strip('"').strip("'")
    db_path = Path(db_env) if db_env else (PROJECT_ROOT / "ecorelocate.db")
    if not db_path.is_absolute():
        db_path = PROJECT_ROOT / db_path
    db_path.parent.mkdir(parents=True, exist_ok=True)
    return db_path


def normalize_db_id(raw_id: Optional[str]) -> str:
    if not raw_id:
        return ""
    cleaned = raw_id.strip().strip('"').strip("'")
    if not cleaned or cleaned.startswith("YOUR_NOTION_DATABASE_ID"):
        return ""
    return cleaned


def notion_query_all(token: str, database_id: str) -> List[Dict[str, Any]]:
    """Забирает все записи из базы данных Notion с учётом пагинации."""
    url = f"https://api.notion.com/v1/databases/{database_id}/query"
    headers = {
        "Authorization": f"Bearer {token}",
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
    }

    results: List[Dict[str, Any]] = []
    start_cursor: Optional[str] = None

    while True:
        payload: Dict[str, Any] = {"page_size": 100}
        if start_cursor:
            payload["start_cursor"] = start_cursor

        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers=headers,
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=25) as resp:
                body = json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            err_body = exc.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"Notion API HTTP {exc.code} для базы {database_id}: {err_body}") from exc
        except urllib.error.URLError as exc:
            raise RuntimeError(f"Сетевая ошибка при обращении к Notion API: {exc.reason}") from exc

        results.extend(body.get("results", []))
        if not body.get("has_more"):
            break
        start_cursor = body.get("next_cursor")

    return results


def prop_text(props: Dict[str, Any], *names: str) -> str:
    for name in names:
        prop = props.get(name)
        if not prop:
            continue
        ptype = prop.get("type")
        if ptype == "title":
            return "".join(t.get("plain_text", "") for t in prop.get("title", [])).strip()
        if ptype == "rich_text":
            return "".join(t.get("plain_text", "") for t in prop.get("rich_text", [])).strip()
        if ptype == "select" and prop.get("select"):
            return str(prop["select"].get("name", "")).strip()
        if ptype == "status" and prop.get("status"):
            return str(prop["status"].get("name", "")).strip()
        if ptype == "url" and prop.get("url"):
            return str(prop["url"]).strip()
        if ptype == "number" and prop.get("number") is not None:
            return str(prop["number"])
    return ""


def prop_multi(props: Dict[str, Any], *names: str) -> List[str]:
    for name in names:
        prop = props.get(name)
        if not prop:
            continue
        ptype = prop.get("type")
        if ptype == "multi_select":
            return [opt.get("name", "").strip() for opt in prop.get("multi_select", []) if opt.get("name")]
        if ptype in ("rich_text", "title"):
            raw = prop_text(props, name)
            return [part.strip() for part in raw.split(",") if part.strip()]
    return []


def prop_relations(props: Dict[str, Any], *names: str) -> List[str]:
    for name in names:
        prop = props.get(name)
        if prop and prop.get("type") == "relation":
            return [rel.get("id", "") for rel in prop.get("relation", []) if rel.get("id")]
    return []


def ensure_schema(conn: sqlite3.Connection) -> None:
    conn.executescript(
        """
        PRAGMA foreign_keys = ON;

        CREATE TABLE IF NOT EXISTS origins (
            id TEXT PRIMARY KEY,
            label TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS cities (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            housing_note TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS city_bins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            city_id TEXT NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
            code TEXT NOT NULL,
            name TEXT NOT NULL,
            hint TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS city_zones (
            city_id TEXT NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
            zone_id TEXT NOT NULL,
            PRIMARY KEY (city_id, zone_id)
        );
        CREATE TABLE IF NOT EXISTS categories (
            id TEXT PRIMARY KEY,
            label TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS items (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            keywords_csv TEXT NOT NULL,
            action TEXT NOT NULL,
            bin_code TEXT NOT NULL,
            bin_label TEXT NOT NULL,
            prep_steps_pipe TEXT NOT NULL,
            outcome TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS item_rule_deltas (
            item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
            origin_id TEXT NOT NULL,
            delta_text TEXT NOT NULL,
            PRIMARY KEY (item_id, origin_id)
        );
        CREATE TABLE IF NOT EXISTS checklist (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            detail TEXT NOT NULL,
            sort_order INTEGER NOT NULL DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS symbols (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT NOT NULL,
            name TEXT NOT NULL,
            meaning TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS dropoff_zones (
            id TEXT PRIMARY KEY,
            label TEXT NOT NULL,
            meta TEXT NOT NULL,
            title TEXT NOT NULL,
            accepted_type TEXT NOT NULL,
            note TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS material_loops (
            material TEXT NOT NULL,
            step_index INTEGER NOT NULL,
            step_label TEXT NOT NULL,
            step_text TEXT NOT NULL,
            PRIMARY KEY (material, step_index)
        );
        """
    )


def sync_cities(conn: sqlite3.Connection, pages: List[Dict[str, Any]]) -> int:
    parsed = []
    for idx, page in enumerate(pages, start=1):
        props = page.get("properties", {})
        name = prop_text(props, "Name", "City", "Title")
        slug = prop_text(props, "Slug", "ID", "Code") or f"city-{idx}"
        housing_note = prop_text(props, "Housing Note", "Note", "Description")
        allowed_zones = prop_multi(props, "Allowed Zones", "Zones")
        bins_raw = prop_text(props, "Bins Summary", "Bins")
        if name:
            parsed.append((slug, name, housing_note, allowed_zones, bins_raw))

    if not parsed:
        return 0

    conn.execute("DELETE FROM city_zones")
    conn.execute("DELETE FROM city_bins")
    conn.execute("DELETE FROM cities")

    for slug, name, housing_note, allowed_zones, bins_raw in parsed:
        conn.execute(
            "INSERT INTO cities (id, name, housing_note) VALUES (?, ?, ?)",
            (slug, name, housing_note or "Уточняйте маркировку контейнеров на площадке у дома."),
        )
        for z_id in allowed_zones:
            conn.execute("INSERT OR IGNORE INTO city_zones (city_id, zone_id) VALUES (?, ?)", (slug, z_id))

        if bins_raw:
            for chunk in bins_raw.split("|"):
                part = chunk.strip()
                if not part:
                    continue
                code = "grey"
                rest = part
                if ":" in part:
                    maybe_code, after = part.split(":", 1)
                    if maybe_code.strip().lower() in {"yellow", "blue", "green", "brown", "grey"}:
                        code = maybe_code.strip().lower()
                        rest = after.strip()
                if "—" in rest:
                    b_name, b_hint = [x.strip() for x in rest.split("—", 1)]
                elif "-" in rest:
                    b_name, b_hint = [x.strip() for x in rest.split("-", 1)]
                else:
                    b_name, b_hint = rest, ""
                conn.execute(
                    "INSERT INTO city_bins (city_id, code, name, hint) VALUES (?, ?, ?, ?)",
                    (slug, code, b_name, b_hint),
                )

    return len(parsed)


def sync_waste_items(conn: sqlite3.Connection, pages: List[Dict[str, Any]]) -> Dict[str, str]:
    page_id_to_slug: Dict[str, str] = {}
    parsed = []

    for idx, page in enumerate(pages, start=1):
        props = page.get("properties", {})
        title = prop_text(props, "Item Title", "Name", "Title")
        if not title:
            continue
        slug = prop_text(props, "Slug", "Code") or f"item-{idx}"
        category = prop_text(props, "Category") or "packaging"
        keywords = prop_text(props, "Keywords") or title.lower()
        action = prop_text(props, "Action", "Description") or "Проверьте маркировку упаковки и локальный бак."
        bin_code = (prop_text(props, "Bin Code", "status") or "grey").lower()
        if bin_code not in {"yellow", "blue", "green", "brown", "grey"}:
            bin_code = "grey"
        bin_label = prop_text(props, "Bin Label") or "Уточните контейнер"
        prep_steps = prop_text(props, "Prep Steps") or "Очистите упаковку от остатков содержимого."
        outcome = prop_text(props, "Outcome") or "Направляется на сортировку и переработку по локальным правилам."

        page_id_to_slug[page["id"]] = slug
        parsed.append((slug, title, category, keywords, action, bin_code, bin_label, prep_steps, outcome))

    if not parsed:
        return page_id_to_slug

    conn.execute("DELETE FROM items")
    conn.executemany(
        """
        INSERT INTO items
        (id, title, category, keywords_csv, action, bin_code, bin_label, prep_steps_pipe, outcome)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        parsed,
    )
    return page_id_to_slug


def sync_rule_deltas(
    conn: sqlite3.Connection,
    pages: List[Dict[str, Any]],
    page_id_to_slug: Dict[str, str],
) -> int:
    parsed = []
    for page in pages:
        props = page.get("properties", {})
        delta_text = prop_text(props, "Rule Delta Text", "Delta", "Text", "Description")
        if not delta_text:
            continue

        origin_id = prop_text(props, "Origin Code", "Origin") or "other"
        item_slug = prop_text(props, "Item Slug")
        if not item_slug:
            rel_ids = prop_relations(props, "Item", "Waste Item")
            if rel_ids and rel_ids[0] in page_id_to_slug:
                item_slug = page_id_to_slug[rel_ids[0]]

        if item_slug:
            parsed.append((item_slug, origin_id.lower(), delta_text))

    if not parsed:
        return 0

    conn.execute("DELETE FROM item_rule_deltas")
    conn.executemany(
        "INSERT OR REPLACE INTO item_rule_deltas (item_id, origin_id, delta_text) VALUES (?, ?, ?)",
        parsed,
    )
    return len(parsed)


def sync_checklist(conn: sqlite3.Connection, pages: List[Dict[str, Any]]) -> int:
    parsed = []
    for idx, page in enumerate(pages, start=1):
        props = page.get("properties", {})
        title = prop_text(props, "Title", "Name")
        if not title:
            continue
        detail = prop_text(props, "Detail", "Description")
        order_raw = prop_text(props, "Order")
        sort_order = int(float(order_raw)) if order_raw else idx
        cid = prop_text(props, "Slug", "ID") or f"fw-{idx}"
        parsed.append((cid, title, detail, sort_order))

    if not parsed:
        return 0

    conn.execute("DELETE FROM checklist")
    conn.executemany(
        "INSERT INTO checklist (id, title, detail, sort_order) VALUES (?, ?, ?, ?)",
        parsed,
    )
    return len(parsed)


def sync_symbols(conn: sqlite3.Connection, pages: List[Dict[str, Any]]) -> int:
    parsed = []
    for page in pages:
        props = page.get("properties", {})
        code = prop_text(props, "Code", "Title")
        name = prop_text(props, "Name") or code
        meaning = prop_text(props, "Meaning", "Description")
        if code and meaning:
            parsed.append((code, name, meaning))

    if not parsed:
        return 0

    conn.execute("DELETE FROM symbols")
    conn.executemany("INSERT INTO symbols (code, name, meaning) VALUES (?, ?, ?)", parsed)
    return len(parsed)


def run_sync() -> Dict[str, Any]:
    load_dotenv_file(ENV_PATH)
    db_path = resolve_db_path()

    token = os.getenv("NOTION_TOKEN", "").strip().strip('"').strip("'")
    if not token:
        raise RuntimeError(f"В {ENV_PATH} не задан NOTION_TOKEN.")

    waste_db_id = normalize_db_id(os.getenv("WASTE_DB_ID"))
    cities_db_id = normalize_db_id(os.getenv("CITIES_DB_ID"))
    deltas_db_id = normalize_db_id(os.getenv("DELTAS_DB_ID"))
    checklist_db_id = normalize_db_id(os.getenv("CHECKLIST_DB_ID"))
    symbols_db_id = normalize_db_id(os.getenv("SYMBOLS_DB_ID"))

    summary: Dict[str, Any] = {"db_path": str(db_path), "synced": {}}

    with sqlite3.connect(db_path) as conn:
        conn.execute("PRAGMA foreign_keys = ON;")
        ensure_schema(conn)

        if cities_db_id:
            city_pages = notion_query_all(token, cities_db_id)
            summary["synced"]["cities"] = sync_cities(conn, city_pages)

        page_id_to_slug: Dict[str, str] = {}
        if waste_db_id:
            waste_pages = notion_query_all(token, waste_db_id)
            page_id_to_slug = sync_waste_items(conn, waste_pages)
            summary["synced"]["items"] = len(page_id_to_slug)

        if deltas_db_id:
            delta_pages = notion_query_all(token, deltas_db_id)
            summary["synced"]["rule_deltas"] = sync_rule_deltas(conn, delta_pages, page_id_to_slug)

        if checklist_db_id:
            checklist_pages = notion_query_all(token, checklist_db_id)
            summary["synced"]["checklist"] = sync_checklist(conn, checklist_pages)

        if symbols_db_id:
            symbol_pages = notion_query_all(token, symbols_db_id)
            summary["synced"]["symbols"] = sync_symbols(conn, symbol_pages)

        conn.commit()

    return summary