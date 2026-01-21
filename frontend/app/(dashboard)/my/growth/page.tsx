import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target } from 'lucide-react';

export const metadata = {
  title: 'Growth Areas | Analytics Dashboard',
};

export default function GrowthPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Зоны роста</h1>
        <p className="text-muted-foreground">Области для улучшения ваших навыков</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <CardTitle>Рекомендации по развитию</CardTitle>
          </div>
          <CardDescription>
            Здесь будут персонализированные рекомендации на основе анализа звонков.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center border border-dashed rounded-lg">
          <p className="text-muted-foreground">Рекомендации будут здесь</p>
        </CardContent>
      </Card>
    </div>
  );
}
