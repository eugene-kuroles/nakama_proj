import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LayoutDashboard, 
  Users, 
  User, 
  ArrowRight,
  BarChart3,
  Target,
  TrendingUp
} from "lucide-react";

export default function Home() {
  const dashboards = [
    {
      title: "Executive Overview",
      description: "Общая картина качества звонков для CEO",
      href: "/executive",
      icon: LayoutDashboard,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      title: "Team Performance",
      description: "Управление командой и коучинг для РОП",
      href: "/team",
      icon: Users,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-100 dark:bg-emerald-900/30",
    },
    {
      title: "My Performance",
      description: "Личные показатели для менеджеров",
      href: "/my",
      icon: User,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-100 dark:bg-purple-900/30",
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-2xl bg-primary/10">
              <BarChart3 className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Call Analytics
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Платформа аналитики качества звонков. Отслеживайте метрики, 
            анализируйте тренды и улучшайте результаты команды.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="text-center p-6">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
            </div>
            <h3 className="font-semibold mb-2">Трекинг метрик</h3>
            <p className="text-sm text-muted-foreground">
              Отслеживание KPI в реальном времени с визуализацией трендов
            </p>
          </div>
          <div className="text-center p-6">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Target className="h-6 w-6 text-primary" />
              </div>
            </div>
            <h3 className="font-semibold mb-2">Анализ критериев</h3>
            <p className="text-sm text-muted-foreground">
              Детальная оценка по каждому критерию качества звонка
            </p>
          </div>
          <div className="text-center p-6">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
            <h3 className="font-semibold mb-2">Командная работа</h3>
            <p className="text-sm text-muted-foreground">
              Лидерборды, коучинг и персональные рекомендации
            </p>
          </div>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {dashboards.map((dashboard) => {
            const Icon = dashboard.icon;
            return (
              <Card 
                key={dashboard.href}
                className="group hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300"
              >
                <CardHeader>
                  <div className={`p-3 rounded-xl w-fit ${dashboard.bg}`}>
                    <Icon className={`h-6 w-6 ${dashboard.color}`} />
                  </div>
                  <CardTitle className="mt-4">{dashboard.title}</CardTitle>
                  <CardDescription>{dashboard.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full group-hover:bg-primary">
                    <Link href={dashboard.href}>
                      Открыть
                      <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-sm text-muted-foreground">
          <p>Call Analytics Dashboard v1.0 • Agent 3</p>
        </div>
      </div>
    </main>
  );
}
