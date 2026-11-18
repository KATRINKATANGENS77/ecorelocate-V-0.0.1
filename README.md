# 🌿 EcoRelocate

> **EcoRelocate** is a multi-language web application designed to help relocants and travelers quickly adapt to local environmental rules, waste sorting, and recycling regulations in a new country.

---

## 🎯 About the Project

Moving to another country often brings stress due to completely new household habits. What used to go into general plastic back home might require separate washing, cap removal, or drop-off at specialized eco-centers under the threat of fines.

**EcoRelocate** solves this problem by providing an up-to-date, structured, and fast guide to local waste disposal rules, material codes (`PET-1`, `ALU-41`, etc.), and raw material preparation instructions.



## 🏗️ Application Architecture

The project is built on a **Backend-first** principle using a **Headless CMS** as a convenient admin panel:

- **Frontend:** An intuitive user interface for searching materials, viewing recycling statuses (green/yellow/red), and step-by-step instructions.
- **Backend (`FastAPI`):** A high-performance API server that delivers data to the client in milliseconds.
- **Database (`SQLite & SQLAlchemy`):** Local storage acting as a high-speed cache.
- **CMS (`Notion API`):** Used as a flexible content manager panel. An ETL pipeline syncs changes from Notion to the local database, bypassing external API speed limits (Rate Limits).


## 🛠️ Tech Stack

### Backend
- **Python / FastAPI** — A fast asynchronous framework with auto-generated OpenAPI documentation.
- **SQLAlchemy & SQLite** — ORM and relational database.
- **Notion SDK (`notion-client`)** — Integration with the Headless CMS.
- **Pydantic** — Strict data validation for incoming and outgoing payloads.
- **Python-Dotenv** — Secure configuration management.

### Frontend
- **HTML5 / CSS3 / JavaScript** — Responsive user interface.
- **Tailwind CSS** — Modern UI styling *(applied during the layout phase)*.

---

## 🔄 Content Synchronization ETL Pipeline

To prevent administrators from having to modify code to update disposal rules across different countries, an automated synchronizer is built into the project:
1. **Extract:** Requests data from the Notion API to fetch the latest waste category entries.
2. **Transform:** Cleans nested JSON structures and flattens them into a clean format.
3. **Load:** Saves the processed data into the local SQLite database via SQLAlchemy sessions.

## 🚀 Quick Start (Local Setup)

### 1. Clone the Repository# Create and activate a virtual environment
python -m venv .venv
# For Windows:
.venv\Scripts\activate
# For macOS / Linux:
source .venv/bin/activate

# 2 Install backend dependencies
pip install -r requirements.txt

 ### 3. Environment Configuration
Copy `.env.example` to `.env` in the root directory and fill in your personal Notion API credentials:
```bash
cp .env.example .env

