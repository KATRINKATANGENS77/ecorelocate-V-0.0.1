from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime
from app.main import Base  # Импортируем базовый класс из вашего main.py

class CityModel(Base):
    """Таблица городов и региональных правил"""
    __tablename__ = "cities"

    id = Column(Integer, primary_key=True, index=True)
    notion_id = Column(String, unique=True, index=True)  # ID страницы в Notion
    name = Column(String, nullable=False)                  # Например: "Минск"
    country = Column(String, nullable=False)               # "Беларусь"
    waste_rules_summary = Column(Text)                    # Описание локальных правил
    updated_at = Column(DateTime, default=datetime.utcnow)

class WasteCategoryModel(Base):
    """Таблица видов отходов и маркировок"""
    __tablename__ = "waste_categories"

    id = Column(Integer, primary_key=True, index=True)
    notion_id = Column(String, unique=True, index=True)
    code = Column(String, index=True)                     # "01 PET"
    title = Column(String, nullable=False)                # "ПЭТ-бутылки"
    status = Column(String, default="green")               # "green", "yellow", "red"
    preparation = Column(Text)                            # "Сполоснуть, смять"