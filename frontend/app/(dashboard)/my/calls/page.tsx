import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone } from 'lucide-react';

export const metadata = {
  title: 'My Calls | Analytics Dashboard',
};

export default function MyCallsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Мои звонки</h1>
        <p className="text-muted-foreground">История и анализ ваших звонков</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-primary" />
            <CardTitle>Журнал звонков</CardTitle>
          </div>
          <CardDescription>
            Здесь будет список ваших звонков с оценками.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center border border-dashed rounded-lg">
          <p className="text-muted-foreground">Таблица звонков будет здесь</p>
        </CardContent>
      </Card>
    </div>
  );
}
