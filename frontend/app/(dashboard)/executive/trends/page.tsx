import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

export const metadata = {
  title: 'Trends | Analytics Dashboard',
};

export default function TrendsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Тренды</h1>
        <p className="text-muted-foreground">Анализ трендов и динамики показателей</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <CardTitle>Динамика показателей</CardTitle>
          </div>
          <CardDescription>
            Здесь будут графики трендов.
            Agent 3 создаст компоненты визуализации.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center border border-dashed rounded-lg">
          <p className="text-muted-foreground">Графики трендов будут здесь</p>
        </CardContent>
      </Card>
    </div>
  );
}
