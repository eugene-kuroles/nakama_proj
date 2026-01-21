# Spellit Analytics Backend

Backend API для платформы аналитики качества звонков Spellit.

## Технологии

- **Python 3.11+**
- **FastAPI** - веб-фреймворк
- **SQLAlchemy 2.0** - async ORM
- **PostgreSQL** - база данных
- **Alembic** - миграции БД
- **JWT** - авторизация

## Быстрый старт

### 1. Запустить PostgreSQL

```bash
# Из корня проекта
docker-compose up -d postgres
```

### 2. Установить зависимости

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
```

### 3. Настроить окружение

```bash
copy .env.example .env
# Отредактировать .env при необходимости
```

### 4. Применить миграции

```bash
alembic upgrade head
```

### 5. Создать тестовых пользователей

```bash
python scripts/create_admin.py --all
```

### 6. Запустить сервер

```bash
uvicorn app.main:app --reload --port 8000
```

## API Endpoints

### Auth (`/api/auth`)
- `POST /login` - Вход (email, password) → JWT
- `POST /refresh` - Обновление токена
- `GET /me` - Текущий пользователь
- `POST /register` - Регистрация

### Calls (`/api/calls`)
- `GET /` - Список звонков с фильтрами
- `GET /{id}` - Детали звонка
- `GET /manager/{manager_id}` - Звонки менеджера

### Analytics (`/api/analytics`)
- `GET /executive/summary` - KPI для CEO
- `GET /team/leaderboard` - Рейтинг менеджеров
- `GET /manager/{id}/summary` - KPI менеджера

### Admin (`/api/admin`)
- `GET /projects` - Список проектов
- `POST /projects` - Создать проект
- `POST /upload/{project_id}` - Загрузка Excel
- `GET /users` - Список пользователей

## Структура проекта

```
backend/
├── alembic/                 # Миграции БД
│   ├── versions/            # Файлы миграций
│   └── env.py              # Конфигурация Alembic
├── app/
│   ├── core/               # Безопасность, утилиты
│   │   └── security.py     # JWT, хеширование
│   ├── integrations/       # Внешние интеграции
│   │   ├── excel/          # Парсинг Excel
│   │   └── nakama/         # nakama API
│   ├── models/             # SQLAlchemy модели
│   │   ├── user.py
│   │   ├── project.py
│   │   ├── manager.py
│   │   ├── criteria.py
│   │   └── call.py
│   ├── routers/            # API эндпоинты
│   │   ├── auth.py
│   │   ├── calls.py
│   │   ├── analytics.py
│   │   └── admin.py
│   ├── schemas/            # Pydantic схемы
│   ├── services/           # Бизнес-логика
│   │   └── analytics/      # Аналитика
│   ├── config.py           # Настройки
│   ├── database.py         # Подключение к БД
│   └── main.py             # Точка входа
├── scripts/                # Утилиты
│   └── create_admin.py     # Создание пользователей
├── requirements.txt
└── .env.example
```

## Тестовые пользователи

После `python scripts/create_admin.py --all`:

| Email | Password | Role |
|-------|----------|------|
| admin@spellit.ai | admin123 | admin |
| ceo@spellit.ai | ceo123 | ceo |
| director@spellit.ai | director123 | sales_director |
| rop@spellit.ai | rop123 | rop |
| manager@spellit.ai | manager123 | manager |

## Swagger UI

После запуска сервера: http://localhost:8000/docs
