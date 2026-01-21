# 🎯 Spellit Analytics Dashboard

Многостраничный сайт для визуализации аналитики звонков продавцов с клиентами.

## 📊 Функционал

- **7 ролей пользователей**: CEO, Коммерческий директор, РОП, Менеджер, Маркетолог, Продуктолог, Админ
- **Дашборды по ролям**: персонализированные KPI и метрики
- **Интеграция с nakama API**: автоматическая синхронизация данных
- **Загрузка Excel**: ручной импорт отчётов
- **Светлая/тёмная тема**: автоопределение системных настроек

## 🏗️ Архитектура

```
┌─────────────────────┐     ┌─────────────────────┐
│     Frontend        │     │      Backend        │
│   Next.js 14        │────▶│    FastAPI          │
│   TypeScript        │     │    Python 3.11+     │
│   TailwindCSS       │     │    SQLAlchemy       │
└─────────────────────┘     └──────────┬──────────┘
                                       │
                            ┌──────────▼──────────┐
                            │    PostgreSQL       │
                            │    + Redis          │
                            └─────────────────────┘
```

## 🚀 Быстрый старт

### 1. Запуск базы данных

```bash
docker-compose up -d
```

### 2. Запуск Backend

```bash
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1  # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 3. Запуск Frontend

```bash
cd frontend
npm install
npm run dev
```

### 4. Открыть в браузере

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/docs

## 📁 Структура проекта

```
spellit-analytics/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── models/         # SQLAlchemy models
│   │   ├── routers/        # API endpoints
│   │   ├── services/       # Business logic
│   │   └── integrations/   # nakama API, Excel parser
│   └── requirements.txt
│
├── frontend/                # Next.js frontend
│   ├── app/                # Pages (App Router)
│   ├── components/         # React components
│   └── lib/                # Utils, API client
│
├── docs/                    # Документация
│   └── agents/             # Инструкции для агентов
│
└── data/                    # Тестовые данные
```

## 🤖 Параллельная разработка (5 агентов)

| Агент | Задача | Документация |
|-------|--------|--------------|
| Agent 1 | Backend Core | [AGENT_1_BACKEND.md](docs/agents/AGENT_1_BACKEND.md) |
| Agent 2 | Frontend Core | [AGENT_2_FRONTEND_CORE.md](docs/agents/AGENT_2_FRONTEND_CORE.md) |
| Agent 3 | Dashboards | [AGENT_3_DASHBOARDS.md](docs/agents/AGENT_3_DASHBOARDS.md) |
| Agent 4 | Analytics | [AGENT_4_ANALYTICS.md](docs/agents/AGENT_4_ANALYTICS.md) |
| Agent 5 | Integration | [AGENT_5_INTEGRATION.md](docs/agents/AGENT_5_INTEGRATION.md) |

## 📋 Роли и дашборды

| Роль | Главный дашборд | Ключевые метрики |
|------|-----------------|------------------|
| CEO | Executive Overview | Общий %, тренды, риски |
| Коммерческий директор | Pipeline + Forecast | Воронка, прогноз, deals at risk |
| РОП | Team Performance | Рейтинг, коучинг, scorecards |
| Менеджер | My Performance | Личные KPI, звонки, зоны роста |
| Маркетолог | Marketing | VOC, источники, банк цитат |
| Продуктолог | Product | Запросы, барьеры, churn signals |
| Админ | Admin Panel | Загрузка данных, настройки |

## 🔧 Конфигурация

Создайте `.env` файл на основе `.env.example`:

```bash
cp .env.example .env
```

## 📄 Лицензия

MIT
