# 🎯 Координация 5 агентов

## Текущий статус

| Агент | Статус | Задача | Зависит от |
|-------|--------|--------|------------|
| Agent 1 | ⏳ Готов | Backend Core | - |
| Agent 2 | ⏳ Готов | Frontend Core | - |
| Agent 3 | ⏳ Готов | Dashboards | Agent 1, 2 (частично) |
| Agent 4 | ⏳ Готов | Analytics | Agent 1 |
| Agent 5 | ⏳ Готов | Integration | Agent 1 |

## Порядок запуска

### Фаза 1 — Параллельный старт (все агенты)

```
Agent 1 ──────────────────────────────────►
Agent 2 ──────────────────────────────────►
Agent 3 ──────────────────────────────────► (компоненты UI)
Agent 4 ──────────────────────────────────► (сервисы расчётов)
Agent 5 ──────────────────────────────────► (парсеры)
```

**Агенты могут работать независимо над:**
- Agent 1: Модели БД, базовая структура FastAPI
- Agent 2: Next.js setup, layout, компоненты UI
- Agent 3: Карточки, графики, таблицы (без данных)
- Agent 4: Классы сервисов аналитики (без БД)
- Agent 5: Excel парсеры (без БД)

### Фаза 2 — Интеграция

```
                    ┌──────────────────┐
Agent 1 (API) ─────►│  Integration     │◄───── Agent 5 (Parsers)
                    │  Point           │
Agent 2 (UI) ──────►│                  │◄───── Agent 4 (Analytics)
                    │                  │
Agent 3 (Pages) ───►│                  │
                    └──────────────────┘
```

## Команды для запуска агентов

### Для руководителя (вы)

Откройте 5 отдельных чатов в Cursor и дайте каждому агенту:

---

**Чат 1 — Agent 1 (Backend):**
```
Привет! Ты Agent 1 — Backend Core.
Твоя документация: docs/agents/AGENT_1_BACKEND.md
Начни с создания структуры backend/ и базовых файлов.
Начни работу!
```

---

**Чат 2 — Agent 2 (Frontend Core):**
```
Привет! Ты Agent 2 — Frontend Core.
Твоя документация: docs/agents/AGENT_2_FRONTEND_CORE.md
Создай Next.js проект в frontend/ с авторизацией и layout.
Начни работу!
```

---

**Чат 3 — Agent 3 (Dashboards):**
```
Привет! Ты Agent 3 — Frontend Dashboards.
Твоя документация: docs/agents/AGENT_3_DASHBOARDS.md
Создай компоненты графиков и карточек в frontend/components/.
Затем создашь страницы дашбордов.
Начни работу!
```

---

**Чат 4 — Agent 4 (Analytics):**
```
Привет! Ты Agent 4 — Analytics & Data Processing.
Твоя документация: docs/agents/AGENT_4_ANALYTICS.md
Создай сервисы аналитики в backend/app/services/analytics/.
Начни работу!
```

---

**Чат 5 — Agent 5 (Integration):**
```
Привет! Ты Agent 5 — Integration & API.
Твоя документация: docs/agents/AGENT_5_INTEGRATION.md
Создай Excel парсеры и nakama клиент в backend/app/integrations/.
Начни работу!
```

## Контрольные точки

### Checkpoint 1 — Фундамент готов
- [ ] Agent 1: `uvicorn app.main:app` запускается
- [ ] Agent 2: `npm run dev` запускается
- [ ] Agent 3: Базовые компоненты созданы
- [ ] Agent 4: Классы сервисов созданы
- [ ] Agent 5: Парсеры парсят тестовые файлы

### Checkpoint 2 — API + Парсинг
- [ ] Agent 1: CRUD API для calls работает
- [ ] Agent 5: Excel загружается и данные в БД

### Checkpoint 3 — Дашборды с данными
- [ ] Agent 3: CEO дашборд отображает данные
- [ ] Agent 3: РОП дашборд работает
- [ ] Agent 4: KPI рассчитываются

### Checkpoint 4 — Полная интеграция
- [ ] Все страницы работают
- [ ] Аналитика отображается
- [ ] nakama синхронизация работает

## Возможные конфликты

| Файл | Агенты | Решение |
|------|--------|---------|
| `backend/app/models/` | Agent 1, 4, 5 | Agent 1 создаёт первым |
| `frontend/lib/api.ts` | Agent 2, 3 | Agent 2 создаёт первым |
| `frontend/components/ui/` | Agent 2, 3 | Agent 2 настраивает shadcn |

## Коммуникация между агентами

Если агенту нужны данные от другого агента:

1. **Agent 3 нужен API?** → Создай mock данные пока Agent 1 не готов
2. **Agent 4 нужны модели?** → Используй типы из docs, Agent 1 синхронизирует позже
3. **Agent 5 нужна БД?** → Создай standalone скрипт для тестирования парсера

## Отчётность

После каждого завершённого таска агент должен обновить этот файл:

```markdown
## Agent X — Лог

### [Дата] — Задача
- ✅ Сделано: описание
- ⏳ В процессе: описание
- ❌ Проблема: описание + как решили
```

---

## Agent Logs

### Agent 1 — Backend Core

_Логи будут здесь..._

### Agent 2 — Frontend Core

### [2026-01-20] — Инициализация Frontend Core

**✅ Сделано:**
1. **Создан Next.js 14 проект** с TypeScript, Tailwind CSS, ESLint, App Router
2. **Настроен shadcn/ui** со всеми необходимыми компонентами:
   - button, input, card, label
   - dropdown-menu, avatar, separator, sheet, tooltip
3. **Создана структура папок:**
   ```
   frontend/
   ├── app/
   │   ├── layout.tsx           # Root layout с Providers
   │   ├── page.tsx             # Home → redirect to login
   │   ├── providers.tsx        # Theme, Query, Auth providers
   │   ├── login/page.tsx       # Страница входа
   │   └── (dashboard)/         # Protected routes
   │       ├── layout.tsx       # Dashboard layout с Sidebar
   │       ├── page.tsx         # Redirect по роли
   │       ├── executive/       # CEO дашборды
   │       ├── team/            # РОП дашборды
   │       ├── my/              # Personal дашборды
   │       └── admin/           # Админка
   ├── components/
   │   ├── ui/                  # shadcn компоненты
   │   ├── layout/              # Header, Sidebar, ThemeToggle
   │   └── auth/                # LoginForm
   ├── lib/
   │   ├── api.ts               # API client
   │   └── auth.tsx             # Auth context
   ├── hooks/
   │   ├── useAuth.ts           
   │   └── useApi.ts            
   └── types/index.ts           # TypeScript типы
   ```
4. **Реализована система тем** (светлая/тёмная) через next-themes
5. **Создан Auth Context** с:
   - Авторизация через API
   - Auto-redirect на login если не авторизован
   - Redirect по роли после входа
6. **Создана навигация по ролям:**
   - CEO: Executive Overview, Trends
   - ROP: Team Performance, Leaderboard, Coaching
   - Manager: My Dashboard, My Calls, Growth Areas
   - Admin: Upload, Projects, Users, Settings
7. **Создана красивая страница Login** с поддержкой тем
8. **npm run dev работает на localhost:3000** ✓
9. **npm run build завершается успешно** ✓

**🔧 Интеграция с другими агентами:**
- Исправлены TypeScript ошибки в компонентах от Agent 3 (charts, KPICard)
- api.ts был переписан Agent 3, auth.tsx адаптирован

### Agent 3 — Dashboards

#### [2026-01-20] — Создание компонентов и дашбордов
- ✅ **Компоненты карточек** (`components/cards/`):
  - `KPICard.tsx` — Число + тренд (↑↓) с декоративной линией
  - `TrendCard.tsx` — Карточка с мини-графиком
  - `ScoreCard.tsx` — Оценка с прогресс-баром и цветовой индикацией
  - `ManagerCard.tsx` — Карточка менеджера с аватаром и статистикой
  - `CallCard.tsx` — Карточка звонка со ссылкой на детали

- ✅ **Компоненты графиков** (`components/charts/`):
  - `LineChart.tsx` — Линейный график с кастомным tooltip
  - `BarChart.tsx` — Столбчатая диаграмма с цветовой индикацией по значению
  - `RadarChart.tsx` — Радар для профиля менеджера
  - `GaugeChart.tsx` — Полукруглый gauge индикатор
  - `HeatMap.tsx` — Тепловая карта менеджеры × критерии
  - `AreaChart.tsx` — Area chart с градиентом

- ✅ **Компоненты таблиц** (`components/tables/`):
  - `DataTable.tsx` — Базовая таблица с сортировкой
  - `LeaderboardTable.tsx` — Рейтинг менеджеров с медалями
  - `CallsTable.tsx` — Таблица звонков
  - `CriteriaTable.tsx` — Раскрывающаяся таблица критериев с фидбеком

- ✅ **Компоненты дашбордов** (`components/dashboard/`):
  - `PageHeader.tsx` — Заголовок страницы с селектором периода
  - `PeriodSelector.tsx` — Выбор периода (день/неделя/месяц/квартал/год)
  - `TopIssues.tsx` — Проблемные критерии
  - `CoachingQueue.tsx` — Очередь на коучинг с приоритетами
  - `GrowthAreas.tsx` — Зоны роста с рекомендациями

- ✅ **Страницы дашбордов**:
  - `app/(dashboard)/executive/page.tsx` — CEO Dashboard
  - `app/(dashboard)/team/page.tsx` — РОП Dashboard  
  - `app/(dashboard)/my/page.tsx` — Менеджер Dashboard
  - `app/(dashboard)/call/[id]/page.tsx` — Детали звонка

- ✅ **Mock данные** (`lib/mock-data.ts`) — Тестовые данные для всех компонентов
- ✅ **Утилиты** (`lib/utils.ts`) — Форматирование, цвета Score, тренды
- ✅ Сборка проекта успешна (`npm run build`)

### Agent 4 — Analytics

_Логи будут здесь..._

### Agent 5 — Integration

_Логи будут здесь..._
