import os
from dotenv import load_dotenv
from notion_client import Client
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.models import WasteCategoryModel, CityModel

# Загружаем переменные из файла .env
load_dotenv()

NOTION_TOKEN = os.getenv("NOTION_TOKEN")
WASTE_DB_ID = os.getenv("WASTE_DB_ID")
CITIES_DB_ID = os.getenv("CITIES_DB_ID")

notion = Client(auth=NOTION_TOKEN)

def sync_waste_categories():
    """Синхронизация таблицы видов отходов из Notion в SQLite"""
    db: Session = SessionLocal()
    try:
        response = notion.databases.query(database_id=WASTE_DB_ID)
        
        for page in response.get("results", []):
            notion_id = page["id"]
            props = page["properties"]
            
            # Безопасное извлечение полей с защитой от пустых значений
            title_prop = props.get("Name", {}).get("rich_text", [])
            title = title_prop[0]["text"]["content"] if title_prop else "Без названия"
            
            code_prop = props.get("Code", {}).get("title", [])
            code = code_prop[0]["text"]["content"] if code_prop else ""
            
            status = props.get("Status", {}).get("select", {}).get("name", "green")
            
            prep_prop = props.get("Preparation", {}).get("rich_text", [])
            preparation = prep_prop[0]["text"]["content"] if prep_prop else ""

            existing = db.query(WasteCategoryModel).filter_by(notion_id=notion_id).first()
            
            if existing:
                existing.code = code
                existing.title = title
                existing.status = status
                existing.preparation = preparation
            else:
                new_item = WasteCategoryModel(
                    notion_id=notion_id,
                    code=code,
                    title=title,
                    status=status,
                    preparation=preparation
                )
                db.add(new_item)
                
        db.commit()
        print("✅ Синхронизация Notion -> SQLite прошла успешно!")
    except Exception as e:
        db.rollback()
        print(f"❌ Ошибка синхронизации: {e}")
    finally:
        db.close()