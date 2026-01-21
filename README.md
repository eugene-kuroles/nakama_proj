# 🎯 Spellit Analytics Dashboard

Многостраничный сайт для визуализации аналитики звонков продавцов с клиентами.

## 📊 Текущий функционал (v1.0)

### Реализовано:

- ✅ **Авторизация JWT** с ролями CEO, ROP, Manager, Admin
- ✅ **3 основных дашборда**:
  - **Executive (CEO)** — общая картина, KPI, тренды, Risk Signals
  - **Team (РОП)** — лидерборд, коучинг, scorecards
  - **My Performance (Менеджер)** — личные показатели, звонки
- ✅ **Импорт данных из Excel** — парсинг отчётов Spellit
- ✅ **Страница деталей звонка** — критерии с оценками, reason, quote
- ✅ **Навигация вкладками** — CEO → РОП → выбор менеджера
- ✅ **Светлая/тёмная тема** — автоопределение системных настроек

### Компоненты аналитики:

| Компонент | Описание | Данные |
|-----------|----------|--------|
| KPI Cards | Средняя оценка, звонки, время, менеджеры | ✅ Реальные |
| Trend Chart | Динамика качества по неделям | ✅ Реальные |
| Top Managers | Рейтинг менеджеров по оценке | ✅ Реальные |
| Problem Criteria | Проблемные критерии | ✅ Реальные |
| Best/Worst Examples | Лучшие и худшие примеры звонков | ✅ Реальные |
| VOC & Requests | Возражения клиентов (теги) | ✅ Реальные |
| Win/Loss Summary | Статистика выигранных/проигранных сделок | ✅ Реальные |
| Risk Signals | Сигналы рисков | Mock |
| Sentiment | Анализ настроения | Mock |

## 🏗️ Архитектура

```
┌─────────────────────┐     ┌─────────────────────┐
│     Frontend        │     │      Backend        │
│   Next.js 16        │────▶│    FastAPI          │
│   TypeScript        │     │    Python 3.11+     │
│   TailwindCSS       │     │    SQLAlchemy       │
│   Recharts          │     │    SQLite (dev)     │
└─────────────────────┘     └─────────────────────┘
```

## 🚀 Быстрый старт

### 1. Backend

```bash
cd backend
pip install -r requirements.txt

# Заполнить БД тестовыми данными
python -m app.seed_data

# Запустить сервер
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

### 3. Открыть в браузере

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/docs

## 🔑 Тестовые аккаунты

| Роль | Email | Пароль |
|------|-------|--------|
| CEO | testceo@spellit.ai | ceo123 |
| РОП | testrop@spellit.ai | rop123 |
| Admin | admin@spellit.ai | admin123 |
| Менеджер | testman@spellit.ai | man123 |

## 📁 Структура проекта

```
spellit-analytics/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── models/         # SQLAlchemy models
│   │   ├── routers/        # API endpoints
│   │   │   ├── auth.py     # Авторизация
│   │   │   ├── calls.py    # Звонки
│   │   │   └── analytics.py # Аналитика
│   │   ├── services/       # Business logic
│   │   └── integrations/   
│   │       └── excel/      # Excel парсер
│   ├── seed_data.py        # Загрузка тестовых данных
│   └── requirements.txt
│
├── frontend/                # Next.js frontend
│   ├── app/                
│   │   └── (dashboard)/    # Дашборды
│   │       ├── executive/  # CEO дашборд
│   │       ├── team/       # РОП дашборд
│   │       ├── my/         # Менеджер дашборд
│   │       ├── manager/[id]/ # Детали менеджера
│   │       └── call/[id]/  # Детали звонка
│   ├── components/         # React компоненты
│   │   ├── charts/         # Графики (Recharts)
│   │   ├── cards/          # KPI карточки
│   │   ├── dashboard/      # Компоненты дашбордов
│   │   └── ui/             # shadcn/ui
│   ├── hooks/              # React hooks
│   │   └── useAnalytics.ts # Хуки аналитики
│   └── lib/
│       └── api.ts          # API клиент
│
└── Docs/                    # Документация и Excel файлы
```

## 📊 API Endpoints

### Аналитика

| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/analytics/executive/summary` | KPI и тренды для CEO |
| GET | `/api/analytics/team/leaderboard` | Рейтинг менеджеров |
| GET | `/api/analytics/manager/{id}/summary` | Статистика менеджера |
| GET | `/api/analytics/manager/{id}/examples` | Best/Worst примеры |
| GET | `/api/analytics/voc` | VOC теги возражений |
| GET | `/api/analytics/win-loss` | Win/Loss статистика |

### Звонки

| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/calls` | Список звонков |
| GET | `/api/calls/{id}` | Детали звонка с оценками |

## 📋 База данных

### Модели:

- **User** — пользователи с ролями
- **Project** — проекты (клиенты)
- **Manager** — менеджеры продаж
- **Call** — проанализированные звонки
- **CallScore** — оценки по критериям
- **CriteriaGroup** — группы критериев
- **Criteria** — критерии оценки

## 🔧 Конфигурация

Для production создайте `.env` файл на основе `env.example`:

```bash
DATABASE_URL=postgresql+asyncpg://user:pass@localhost/spellit
JWT_SECRET=your-secret-key
```

## 📝 История изменений

См. файл [CHANGELOG.md](CHANGELOG.md)

## 📄 Лицензия

MIT
