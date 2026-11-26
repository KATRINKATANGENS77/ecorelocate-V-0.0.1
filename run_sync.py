from app.notion_sync import run_sync

if __name__ == "__main__":
    report = run_sync()
    print(f"База данных: {report.get('db_path')}")
    print("Готово! Обновлённые таблицы в SQLite:")
    for table, count in report.get("synced", {}).items():
        print(f"  - {table}: {count}")
