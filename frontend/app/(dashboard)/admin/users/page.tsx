import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCog, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Users | Analytics Dashboard',
};

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Пользователи</h1>
          <p className="text-muted-foreground">Управление пользователями системы</p>
        </div>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Добавить пользователя
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Всего пользователей', value: '--' },
          { label: 'Администраторов', value: '--' },
          { label: 'РОПов', value: '--' },
          { label: 'Менеджеров', value: '--' },
        ].map((item, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{item.label}</CardTitle>
              <UserCog className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Список пользователей</CardTitle>
          <CardDescription>
            Все зарегистрированные пользователи и их роли.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center border border-dashed rounded-lg">
          <p className="text-muted-foreground">Таблица пользователей будет здесь</p>
        </CardContent>
      </Card>
    </div>
  );
}
