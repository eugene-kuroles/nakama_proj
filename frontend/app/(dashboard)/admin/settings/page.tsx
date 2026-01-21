import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';

export const metadata = {
  title: 'Settings | Analytics Dashboard',
};

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Настройки</h1>
        <p className="text-muted-foreground">Конфигурация системы</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              <CardTitle>Общие настройки</CardTitle>
            </div>
            <CardDescription>
              Основные параметры системы.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[200px] flex items-center justify-center border border-dashed rounded-lg">
            <p className="text-muted-foreground">Настройки будут здесь</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Интеграции</CardTitle>
            <CardDescription>
              Подключение внешних сервисов (Nakama и др.).
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[200px] flex items-center justify-center border border-dashed rounded-lg">
            <p className="text-muted-foreground">Интеграции будут здесь</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
