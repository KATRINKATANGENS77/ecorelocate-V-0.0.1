from pathlib import Path
from fastapi import FastAPI, Request, Form
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from typing import Optional
from fastapi import BackgroundTasks

app = FastAPI(
    title="EcoRelocate API",
    description="Бэкенд для экологического веб-приложения и Telegram Mini App сортировки мусора при релокации.",
    version="1.0.0"
)

# 1. Подключаем папку со статическими файлами (CSS, JS, картинки)
app.mount("/static", StaticFiles(directory="static"), name="static")

# 2. Настраиваем шаблонизатор Jinja2 для работы с папкой templates
templates = Jinja2Templates(directory="templates")


# --- РОУТЫ ДЛЯ СТРАНИЦ (FRONTEND) ---

@app.get("/", response_class=HTMLResponse)
async def read_index(request: Request):
    """Главная страница приложения"""
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/community", response_class=HTMLResponse)
async def read_community(request: Request):
    """Страница советов сообщества экспатов"""
    # Если ты решишь вынести советы в отдельный шаблон community.html, 
    # можно будет рендерить его. Пока используем index.html или создадим новый шаблон.
    return templates.TemplateResponse("index.html", {"request": request})


# --- API РОУТЫ (BACKEND / JSON) ---

@app.get("/api/tips")
async def get_community_tips():
    """Эндпоинт для получения списка советов (в будущем из базы SQLite)"""
    return {
        "success": True,
        "tips": [
            {
                "id": 1,
                "author": "Alex_Berlin",
                "city": "Берлин",
                "text": "Залоговые бутылки (Pfand) можно сдавать в любом крупном супермаркете в автоматах."
            }
        ]
    }


@app.post("/api/tips")
async def create_community_tip(
    author: str = Form(...),
    city: str = Form(...),
    text: str = Form(...)
):
    """Эндпоинт для добавления нового совета от пользователя"""
    # Здесь в будущем будет логика сохранения в базу данных SQLite (files.sqlite)
    return {
        "success": True,
        "message": "Совет успешно добавлен!",
        "data": {
            "author": author,
            "city": city,
            "text": text
        }
    }

# Добавляем эндпоинт для ручной или автоматической синхронизации
@app.post("/api/v1/sync-notion")
async def trigger_notion_sync(background_tasks: BackgroundTasks):
    """Эндпоинт для запуска фоновой синхронизации данных из Notion в SQLite"""
    from app.services.notion_sync import sync_waste_categories
    
    # Запускаем процесс в фоновом потоке, чтобы не блокировать ответы сервера
    background_tasks.add_task(sync_waste_categories)
    return {"success": True, "message": "Синхронизация с Notion запущена в фоновом режиме"}







# --- ЗАПУСК СЕРВЕРА (для локальной разработки) ---
if __name__ == "__main__":
    import uvicorn
    # Запуск через uvicorn с автоперезагрузкой при изменении кода (--reload)
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)