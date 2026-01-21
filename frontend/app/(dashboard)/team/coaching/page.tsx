import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap } from 'lucide-react';

export const metadata = {
  title: 'Coaching Queue | Analytics Dashboard',
};

export default function CoachingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Очередь коучинга</h1>
        <p className="text-muted-foreground">Менеджеры, требующие внимания</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            <CardTitle>Приоритетный коучинг</CardTitle>
          </div>
          <CardDescription>
            Здесь будет список менеджеров с низкими показателями.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center border border-dashed rounded-lg">
          <p className="text-muted-foreground">Список для коучинга будет здесь</p>
        </CardContent>
      </Card>
    </div>
  );
}
