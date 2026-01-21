# 🎨 AGENT 2 — Frontend Core

## Миссия
Создать основу фронтенда на Next.js 14: авторизацию, layout, навигацию и систему тем.

## Технологии
- Next.js 14 (App Router)
- TypeScript
- TailwindCSS
- shadcn/ui
- next-themes (светлая/тёмная тема)
- React Query (TanStack Query)

## Задачи в порядке выполнения

### 1. Инициализация проекта

```bash
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir=false
cd frontend
npx shadcn@latest init
```

### 2. Структура папок

```
frontend/
├── app/
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home → redirect
│   ├── login/
│   │   └── page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx       # Dashboard layout с sidebar
│   │   └── ...
│   ├── globals.css
│   └── providers.tsx
├── components/
│   ├── ui/                  # shadcn компоненты
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   ├── Navigation.tsx
│   │   └── ThemeToggle.tsx
│   └── auth/
│       └── LoginForm.tsx
├── lib/
│   ├── api.ts               # API client (fetch wrapper)
│   ├── auth.ts              # Auth context & hooks
│   └── utils.ts
├── hooks/
│   ├── useAuth.ts
│   └── useApi.ts
├── types/
│   └── index.ts
└── styles/
    └── themes.css
```

### 3. Система тем (светлая/тёмная)

**Файл: `app/globals.css`**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Light theme */
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --border: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    
    /* Score colors */
    --score-excellent: 142 76% 36%;
    --score-good: 142 71% 45%;
    --score-warning: 38 92% 50%;
    --score-danger: 0 84% 60%;
    
    /* Trends */
    --trend-up: 142 76% 36%;
    --trend-down: 0 84% 60%;
    --trend-flat: 215 16% 47%;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 48%;
  }
}
```

### 4. Layout с навигацией

**Файл: `app/(dashboard)/layout.tsx`**
```tsx
export default function DashboardLayout({ children }) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-auto p-6 bg-secondary/30">
          {children}
        </main>
      </div>
    </div>
  );
}
```

### 5. Sidebar навигация по ролям

```tsx
const navigation = {
  ceo: [
    { name: 'Executive Overview', href: '/executive', icon: LayoutDashboard },
    { name: 'Trends', href: '/executive/trends', icon: TrendingUp },
  ],
  rop: [
    { name: 'Team Performance', href: '/team', icon: Users },
    { name: 'Leaderboard', href: '/team/leaderboard', icon: Trophy },
    { name: 'Coaching Queue', href: '/team/coaching', icon: GraduationCap },
  ],
  manager: [
    { name: 'My Dashboard', href: '/my', icon: User },
    { name: 'My Calls', href: '/my/calls', icon: Phone },
    { name: 'Growth Areas', href: '/my/growth', icon: Target },
  ],
  admin: [
    { name: 'Upload Data', href: '/admin/upload', icon: Upload },
    { name: 'Projects', href: '/admin/projects', icon: Folder },
    { name: 'Users', href: '/admin/users', icon: UserCog },
  ],
};
```

### 6. Login страница

**Файл: `app/login/page.tsx`**
```tsx
// Красивая страница входа с формой
// Email + Password
// Кнопка "Войти"
// Запомнить меня
// Поддержка светлой/тёмной темы
```

### 7. API Client

**Файл: `lib/api.ts`**
```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export const api = {
  async get<T>(endpoint: string): Promise<T> {
    const token = getToken();
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  },
  
  async post<T>(endpoint: string, data: any): Promise<T> {
    // ...
  }
};
```

### 8. Auth Context

**Файл: `lib/auth.tsx`**
```typescript
interface AuthContext {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

// Хранение токена в localStorage
// Автоматический refresh
// Redirect на /login если не авторизован
```

## Критерии готовности
- [ ] npm run dev работает на localhost:3000
- [ ] Страница login отображается
- [ ] Авторизация работает (login → redirect to dashboard)
- [ ] Sidebar навигация работает
- [ ] Переключение тем работает
- [ ] Protected routes работают

## Зависимости от других агентов
- Agent 1: API эндпоинты для авторизации
- Agent 3: Dashboard страницы
