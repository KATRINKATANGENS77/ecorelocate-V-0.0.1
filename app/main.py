import os
import sqlite3
from pathlib import Path
from typing import Any, Dict, List

from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

APP_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = APP_DIR.parent if APP_DIR.name == "app" else APP_DIR
TEMPLATES_DIR = PROJECT_ROOT / "templates"
STATIC_DIR = PROJECT_ROOT / "static"

app = FastAPI(title="EcoRelocate API", version="1.0.0")
templates = Jinja2Templates(directory=str(TEMPLATES_DIR))

if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


@app.get("/")
def serve_index(request: Request):
    index_path = TEMPLATES_DIR / "index.html"
    if not index_path.exists():
        raise HTTPException(status_code=404, detail="templates/index.html не найден")
    return templates.TemplateResponse("index.html", {"request": request})


def get_db_path() -> Path:
    db_env = os.getenv("ECORELOCATE_DB_PATH", "").strip().strip('"').strip("'")
    db_path = Path(db_env) if db_env else (PROJECT_ROOT / "ecorelocate.db")
    if not db_path.is_absolute():
        db_path = PROJECT_ROOT / db_path
    db_path.parent.mkdir(parents=True, exist_ok=True)
    return db_path


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(get_db_path())
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def init_db() -> None:
    with get_connection() as conn:
        conn.executescript(
            """
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

        if conn.execute("SELECT COUNT(*) FROM origins").fetchone()[0] == 0:
            conn.executemany(
                "INSERT OR IGNORE INTO origins (id, label) VALUES (?, ?)",
                [
                    ("by", "Беларусь (общие бытовые привычки)"),
                    ("ge", "Грузия (локальные дворы и пункты)"),
                    ("kz", "Казахстан (смешанный сбор / пункты)"),
                    ("ru", "Россия (смешанный / двухпоточный сбор)"),
                    ("other", "Другая страна / первый опыт сортировки"),
                ],
            )

        if conn.execute("SELECT COUNT(*) FROM categories").fetchone()[0] == 0:
            conn.executemany(
                "INSERT OR IGNORE INTO categories (id, label) VALUES (?, ?)",
                [
                    ("all", "Все предметы"),
                    ("packaging", "Упаковка и напитки"),
                    ("paper", "Бумага и картон"),
                    ("glass", "Стекло"),
                    ("special", "Батарейки и спецотходы"),
                ],
            )

        if conn.execute("SELECT COUNT(*) FROM cities").fetchone()[0] == 0:
            conn.executemany(
                "INSERT OR IGNORE INTO cities (id, name, housing_note) VALUES (?, ?, ?)",
                [
                    ("minsk", "Минск, Беларусь", "В жилых кварталах обычно разделяют ВМР (стекло, бумага, пластик/металл) и смешанные отходы; уточняйте маркировку площадок у дома."),
                    ("tbilisi", "Тбилиси, Грузия", "Во многих районах есть контейнеры для перерабатываемых отходов и общие баки; проверяйте таблички на конкретной улице."),
                    ("warsaw", "Варшава, Польша", "У жилых домов чаще всего стоят 5 фракций: стекло, бумага, пластик/металл, био и смешанные отходы."),
                    ("berlin", "Берлин, Германия", "Важно различать возвратную тару с депозитом (Pfand), упаковку (Gelbe Tonne/Sack) и биоотходы."),
                ],
            )
            conn.executemany(
                "INSERT INTO city_bins (city_id, code, name, hint) VALUES (?, ?, ?, ?)",
                [
                    ("minsk", "yellow", "ВМР / Упаковка и пластик", "ПЭТ-бутылки, плёнка, металл"),
                    ("minsk", "blue", "Бумага и картон", "Сухая макулатура и коробки"),
                    ("minsk", "green", "Стекло", "Целые бутылки и банки"),
                    ("minsk", "grey", "Смешанные отходы", "Несортируемые остатки"),
                    ("tbilisi", "yellow", "Перерабатываемые отходы", "Пластик, металл, бумага и стекло по правилам точки"),
                    ("tbilisi", "green", "Стекло и тара", "Бутылки и банки без пищевых остатков"),
                    ("tbilisi", "grey", "Общие бытовые отходы", "То, что не идёт в переработку"),
                    ("warsaw", "yellow", "Жёлтый (Metale i tworzywa)", "Пластик, металл, тетрапак"),
                    ("warsaw", "blue", "Синий (Papier)", "Сухая бумага и картон"),
                    ("warsaw", "green", "Зелёный (Szkło)", "Стеклянные банки и бутылки"),
                    ("warsaw", "brown", "Коричневый (Bio)", "Растительные остатки"),
                    ("warsaw", "grey", "Чёрный / серый (Zmieszane)", "Неперерабатываемые остатки"),
                    ("berlin", "yellow", "Жёлтый бак / мешок", "Упаковка: пластик, жесть, композиты"),
                    ("berlin", "blue", "Синий бак (Altpapier)", "Сухой картон, бумага, газеты"),
                    ("berlin", "green", "Стекло (Altglas)", "По цвету: белое, зелёное, коричневое"),
                    ("berlin", "brown", "Биоконтейнер (Biomüll)", "Пищевые и растительные отходы"),
                    ("berlin", "grey", "Остаточные (Restmüll)", "То, что не идёт в другие потоки"),
                ],
            )
            conn.executemany(
                "INSERT OR IGNORE INTO city_zones (city_id, zone_id) VALUES (?, ?)",
                [
                    ("minsk", "zone-municipal"), ("minsk", "zone-retail"), ("minsk", "zone-pharmacy"),
                    ("tbilisi", "zone-retail"), ("tbilisi", "zone-pharmacy"), ("tbilisi", "zone-municipal"),
                    ("warsaw", "zone-municipal"), ("warsaw", "zone-retail"), ("warsaw", "zone-pharmacy"), ("warsaw", "zone-deposit"),
                    ("berlin", "zone-municipal"), ("berlin", "zone-retail"), ("berlin", "zone-pharmacy"), ("berlin", "zone-deposit"),
                ],
            )

        if conn.execute("SELECT COUNT(*) FROM items").fetchone()[0] == 0:
            conn.executemany(
                """
                INSERT OR IGNORE INTO items
                (id, title, category, keywords_csv, action, bin_code, bin_label, prep_steps_pipe, outcome)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                [
                    (
                        "tetrapak",
                        "Картонная упаковка от молока или сока (Tetra Pak)",
                        "packaging",
                        "тетрапак,молоко,сок,картон,коробка,tetrapak",
                        "Слейте остатки, сплющите и отправьте в контейнер для упаковки или уточните правила приёма многослойной тары в городе.",
                        "yellow",
                        "Упаковка / ВМР",
                        "Слейте жидкость до конца.|Сплющите упаковку, чтобы сэкономить место.|Следуйте локальному правилу двора по крышкам.",
                        "Волокна целлюлозы и полимерно-алюминиевый слой разделяются и идут на новую упаковку или строительные листы.",
                    ),
                    (
                        "greasy-pizza-box",
                        "Коробка от пиццы с жирными пятнами",
                        "paper",
                        "пицца,коробка,жир,картон,бумага",
                        "Чистую верхнюю часть оторвите в бумагу, а жирное дно отправьте в смешанные отходы.",
                        "grey",
                        "Смешанные (дно) / Бумага (чистая крышка)",
                        "Уберите остатки пищи, салфетки и фольгу.|Разделите чистую крышку и пропитанное маслом дно.|Чистую часть сложите в бумагу, грязную — в смешанные отходы.",
                        "Жир мешает волокнам целлюлозы нормально распускаться и снижает качество переработанной бумаги.",
                    ),
                    (
                        "receipts",
                        "Кассовые чеки (термобумага)",
                        "paper",
                        "чек,чеки,термобумага,магазин",
                        "Отправьте чек в контейнер для смешанных отходов — не в бумагу.",
                        "grey",
                        "Смешанные отходы",
                        "Не смешивайте чеки с газетами, коробками или офисной бумагой.|Выбросьте в смешанный поток.",
                        "Термочувствительное покрытие чеков не подходит для стандартной бумажной переработки.",
                    ),
                ],
            )
            conn.executemany(
                "INSERT OR IGNORE INTO item_rule_deltas (item_id, origin_id, delta_text) VALUES (?, ?, ?)",
                [
                    ("tetrapak", "by", "В Минске и других странах упаковку часто путают с бумагой, но в Берлине и Варшаве она идёт в поток упаковки."),
                    ("tetrapak", "ge", "При переезде в Варшаву или Берлин многослойную упаковку обычно направляют в поток упаковки."),
                    ("tetrapak", "other", "Многослойные коробки с внутренним слоем фольги/пластика почти всегда отличаются от обычного картона."),
                    ("greasy-pizza-box", "by", "Частая ошибка при переезде — класть всю коробку целиком в бумагу: жирные пятна бракуют волокно."),
                    ("greasy-pizza-box", "other", "Жирный картон почти нигде не принимают в обычный бумажный поток — разделяйте части."),
                    ("receipts", "by", "Кажется, что чек — просто бумага, но из-за термослоя класть его в макулатуру не стоит."),
                    ("receipts", "other", "Термобумага редко перерабатывается в стандартном бумажном цикле."),
                ],
            )

        if conn.execute("SELECT COUNT(*) FROM checklist").fetchone()[0] == 0:
            conn.executemany(
                "INSERT OR IGNORE INTO checklist (id, title, detail, sort_order) VALUES (?, ?, ?, ?)",
                [
                    ("fw-1", "Осмотреть контейнерную площадку у дома и прочитать таблички", "Зафиксируйте цвета баков, график вывоза и правила для крупногабаритных вещей.", 1),
                    ("fw-2", "Организовать компактную точку сортировки на кухне", "Хватит двух-трёх удобных ёмкостей: под упаковку/вторсырьё, био (если есть) и смешанные отходы.", 2),
                    ("fw-3", "Завести коробку или пакет для редких и опасных фракций", "Складывайте туда батарейки, лампы, старые провода и просроченные лекарства до сдачи в точку приёма.", 3),
                ],
            )

        if conn.execute("SELECT COUNT(*) FROM symbols").fetchone()[0] == 0:
            conn.executemany(
                "INSERT OR IGNORE INTO symbols (code, name, meaning) VALUES (?, ?, ?)",
                [
                    ("PET / HDPE / PP (1–7)", "Коды типов пластика", "Указывают на вид полимера. Реальная переработка зависит от местных мощностей."),
                    ("PAP 20 / 21 / 22", "Бумага и картон", "Гофрокартон, картон и бумага. Важна сухость и отсутствие жира."),
                ],
            )

        if conn.execute("SELECT COUNT(*) FROM dropoff_zones").fetchone()[0] == 0:
            conn.executemany(
                "INSERT OR IGNORE INTO dropoff_zones (id, label, meta, title, accepted_type, note) VALUES (?, ?, ?, ?, ?, ?)",
                [
                    ("zone-municipal", "Муниципальный пункт приёма", "Крупногабарит · Химия · Краски", "Муниципальные пункты раздельного сбора", "Крупногабаритные вещи, краски, строймусор", "Демо-описание: точные адреса и расписание требует интеграции с внешним сервисом/бэкендом."),
                    ("zone-retail", "Боксы в магазинах", "Батарейки · Лампы · Мелкая техника", "Пункты приёма в магазинах", "Батарейки, аккумуляторы, мелкая электроника", "Демо-описание: удобно совмещать с покупками."),
                    ("zone-pharmacy", "Аптечные пункты", "Лекарства с истёкшим сроком", "Приём просроченных лекарств", "Просроченные препараты", "Демо-описание: не выбрасывайте лекарства в бытовой мусор."),
                    ("zone-deposit", "Зоны возврата тары", "Бутылки и банки с депозитом", "Автоматы и пункты возврата тары", "Тара с пометкой залога/депозита", "Демо-описание: применяется там, где действует депозитная система."),
                ],
            )

        if conn.execute("SELECT COUNT(*) FROM material_loops").fetchone()[0] == 0:
            conn.executemany(
                "INSERT OR IGNORE INTO material_loops (material, step_index, step_label, step_text) VALUES (?, ?, ?, ?)",
                [
                    ("paper", 1, "1. Дома", "Уберите остатки еды, скотч и жирные пятна; сложите картон плоско."),
                    ("paper", 2, "2. Бак", "Отправьте сухую бумагу и картон в профильный контейнер."),
                    ("paper", 3, "3. Сортировка", "Отделяются примеси и формируются тюки для переработки."),
                    ("paper", 4, "4. Новый ресурс", "Возвращается в виде коробок, упаковочной и типографской бумаги."),
                    ("plastic", 1, "1. Дома", "Слейте жидкость, ополосните при необходимости и сожмите."),
                    ("plastic", 2, "2. Бак", "Поместите в контейнер для упаковки / пластика и металлов."),
                    ("plastic", 3, "3. Сортировка", "Потоки разделяются по типам полимеров и материалов."),
                    ("plastic", 4, "4. Новый ресурс", "Перерабатывается в сырьё для новой тары и бытовых изделий."),
                    ("glass", 1, "1. Дома", "Ополосните банку или бутылку, снимите крышку."),
                    ("glass", 2, "2. Бак", "Сдайте в контейнер для стекла (с учётом цвета, если требуется)."),
                    ("glass", 3, "3. Сортировка", "Стеклобой очищается от примесей и измельчается."),
                    ("glass", 4, "4. Новый ресурс", "Переплавляется в новые стеклянные банки и бутылки."),
                ],
            )


def build_bootstrap_payload(conn: sqlite3.Connection) -> Dict[str, Any]:
    origins = [dict(r) for r in conn.execute("SELECT id, label FROM origins ORDER BY rowid")]

    cities_dict: Dict[str, Any] = {}
    for row in conn.execute("SELECT id, name, housing_note FROM cities ORDER BY rowid"):
        cid = row["id"]
        bins = [
            dict(b)
            for b in conn.execute("SELECT code, name, hint FROM city_bins WHERE city_id = ? ORDER BY id", (cid,))
        ]
        allowed_zones = [
            z["zone_id"]
            for z in conn.execute("SELECT zone_id FROM city_zones WHERE city_id = ? ORDER BY rowid", (cid,))
        ]
        cities_dict[cid] = {
            "id": cid,
            "name": row["name"],
            "housingNote": row["housing_note"],
            "bins": bins,
            "allowedZoneIds": allowed_zones,
        }

    categories = [dict(r) for r in conn.execute("SELECT id, label FROM categories ORDER BY rowid")]

    items_list: List[Dict[str, Any]] = []
    for r in conn.execute("SELECT * FROM items ORDER BY rowid"):
        deltas = {
            d["origin_id"]: d["delta_text"]
            for d in conn.execute("SELECT origin_id, delta_text FROM item_rule_deltas WHERE item_id = ?", (r["id"],))
        }
        items_list.append(
            {
                "id": r["id"],
                "title": r["title"],
                "category": r["category"],
                "keywords": [k.strip() for k in r["keywords_csv"].split(",") if k.strip()],
                "action": r["action"],
                "binCode": r["bin_code"],
                "binLabel": r["bin_label"],
                "prepSteps": [s.strip() for s in r["prep_steps_pipe"].split("|") if s.strip()],
                "outcome": r["outcome"],
                "ruleDeltaByOrigin": deltas,
            }
        )

    checklist = [
        {"id": r["id"], "title": r["title"], "detail": r["detail"]}
        for r in conn.execute("SELECT id, title, detail FROM checklist ORDER BY sort_order, rowid")
    ]

    symbols = [
        {"code": r["code"], "name": r["name"], "meaning": r["meaning"]}
        for r in conn.execute("SELECT code, name, meaning FROM symbols ORDER BY id")
    ]

    dropoff_zones = [
        {
            "id": r["id"],
            "label": r["label"],
            "meta": r["meta"],
            "title": r["title"],
            "type": r["accepted_type"],
            "note": r["note"],
        }
        for r in conn.execute("SELECT * FROM dropoff_zones ORDER BY rowid")
    ]

    material_loops: Dict[str, List[Dict[str, str]]] = {}
    for r in conn.execute("SELECT material, step_label, step_text FROM material_loops ORDER BY material, step_index"):
        material_loops.setdefault(r["material"], []).append({"step": r["step_label"], "text": r["step_text"]})

    return {
        "source": "sqlite",
        "origins": origins,
        "cities": cities_dict,
        "categories": categories,
        "items": items_list,
        "firstWeekChecklist": checklist,
        "symbols": symbols,
        "dropoffZones": dropoff_zones,
        "materialLoops": material_loops,
    }


@app.on_event("startup")
def on_startup() -> None:
    init_db()


@app.get("/api/bootstrap")
def api_bootstrap() -> Dict[str, Any]:
    try:
        with get_connection() as conn:
            init_db()
            return build_bootstrap_payload(conn)
    except sqlite3.Error as exc:
        raise HTTPException(status_code=500, detail=f"Ошибка чтения SQLite: {exc}") from exc


@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return Response(status_code=204)