# 🔧 AGENT 1 — Backend Core

## Миссия
Создать backend на FastAPI с базой данных, авторизацией и основными API эндпоинтами.

## Технологии
- Python 3.11+
- FastAPI
- SQLAlchemy 2.0 (async)
- PostgreSQL (через Docker)
- JWT авторизация
- Pydantic v2

## Задачи в порядке выполнения

### 1. Инициализация проекта
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── config.py
│   └── database.py
├── requirements.txt
└── .env.example
```

### 2. Модели базы данных

**Файл: `app/models/user.py`**
```python
class User:
    id: int
    email: str (unique)
    hashed_password: str
    name: str
    role: Enum['ceo', 'sales_director', 'rop', 'manager', 'marketing', 'product', 'admin']
    is_active: bool
    created_at: datetime
```

**Файл: `app/models/project.py`**
```python
class Project:
    id: int
    name: str
    client_name: str  # Название клиента
    nakama_project_id: int (nullable)  # ID в nakama API
    created_at: datetime
    updated_at: datetime
```

**Файл: `app/models/manager.py`**
```python
class Manager:
    id: int
    project_id: FK(Project)
    external_id: str  # ID из CRM
    name: str
    created_at: datetime
```

**Файл: `app/models/criteria.py`**
```python
class CriteriaGroup:
    id: int
    project_id: FK(Project)
    name: str  # "Установление контакта", "Выявление потребностей"
    order: int

class Criteria:
    id: int
    group_id: FK(CriteriaGroup)
    number: int  # 1, 2, 3...
    name: str
    prompt: str (nullable)
    in_final_score: bool  # Входит в 100%
    score_type: Enum['numeric', 'tag', 'recommendation']
    order: int
```

**Файл: `app/models/call.py`**
```python
class Call:
    id: int
    project_id: FK(Project)
    manager_id: FK(Manager)
    external_id: str  # ID звонка из CRM
    call_date: date
    call_week: str  # "2025-01-06 - 2025-01-12"
    duration_seconds: int
    final_percent: Decimal(5,2)
    metadata: JSONB  # Все CRM поля
    created_at: datetime

class CallScore:
    id: int
    call_id: FK(Call)
    criteria_id: FK(Criteria)
    score: str  # "5", "0", "Рекомендация", "[Тег]"
    reason: text
    quote: text

class CallGroupAverage:
    id: int
    call_id: FK(Call)
    group_id: FK(CriteriaGroup)
    average_percent: Decimal(5,2)
```

### 3. API Routers

**Файл: `app/routers/auth.py`**
```
POST /api/auth/login      - Вход (email, password) → JWT
POST /api/auth/refresh    - Обновление токена
GET  /api/auth/me         - Текущий пользователь
```

**Файл: `app/routers/calls.py`**
```
GET  /api/calls                           - Список звонков (с фильтрами)
GET  /api/calls/{id}                      - Детали звонка
GET  /api/calls/{id}/scores               - Оценки по критериям
GET  /api/calls/manager/{manager_id}      - Звонки менеджера
```

**Файл: `app/routers/analytics.py`**
```
GET  /api/analytics/executive/summary     - KPI для CEO
GET  /api/analytics/team/leaderboard      - Рейтинг менеджеров
GET  /api/analytics/team/trends           - Динамика команды
GET  /api/analytics/manager/{id}/summary  - KPI менеджера
```

**Файл: `app/routers/admin.py`**
```
POST /api/admin/upload                    - Загрузка Excel
GET  /api/admin/projects                  - Список проектов
POST /api/admin/projects                  - Создать проект
GET  /api/admin/criteria/{project_id}     - Критерии проекта
```

### 4. Авторизация

- JWT токены (access: 4 часа, refresh: 7 дней)
- Role-based access control
- Middleware для проверки токена

### 5. Requirements.txt

```
fastapi==0.109.2
uvicorn[standard]==0.27.1
sqlalchemy[asyncio]==2.0.25
asyncpg==0.29.0
pydantic==2.6.1
pydantic-settings==2.1.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.9
python-dotenv==1.0.1
alembic==1.13.1
```

## Критерии готовности
- [ ] Сервер запускается на localhost:8000
- [ ] /docs работает (Swagger)
- [ ] Авторизация работает (login → token → protected routes)
- [ ] CRUD для звонков работает
- [ ] Миграции Alembic настроены

## Зависимости от других агентов
- Agent 5: Получает данные от Excel парсера
- Agent 4: Использует модели для аналитики
