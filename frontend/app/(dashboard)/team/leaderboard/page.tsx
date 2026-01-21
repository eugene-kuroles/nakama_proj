import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy } from 'lucide-react';

export const metadata = {
  title: 'Leaderboard | Analytics Dashboard',
};

export default function LeaderboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Лидерборд</h1>
        <p className="text-muted-foreground">Рейтинг менеджеров по показателям</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <CardTitle>Топ менеджеров</CardTitle>
          </div>
          <CardDescription>
            Здесь будет рейтинг лучших менеджеров.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center border border-dashed rounded-lg">
          <p className="text-muted-foreground">Лидерборд будет здесь</p>
        </CardContent>
      </Card>
    </div>
  );
}
