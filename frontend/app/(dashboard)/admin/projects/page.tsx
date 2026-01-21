import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Projects | Analytics Dashboard',
};

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Проекты</h1>
          <p className="text-muted-foreground">Управление проектами и клиентами</p>
        </div>
        <Button>
          <Folder className="mr-2 h-4 w-4" />
          Новый проект
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Список проектов</CardTitle>
          <CardDescription>
            Все активные и архивные проекты.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center border border-dashed rounded-lg">
          <p className="text-muted-foreground">Список проектов будет здесь</p>
        </CardContent>
      </Card>
    </div>
  );
}
