import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload } from 'lucide-react';

export const metadata = {
  title: 'Upload Data | Analytics Dashboard',
};

export default function UploadPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Загрузка данных</h1>
        <p className="text-muted-foreground">Импорт Excel файлов с данными звонков</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            <CardTitle>Загрузить файл</CardTitle>
          </div>
          <CardDescription>
            Перетащите файл Excel сюда или нажмите для выбора.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg hover:border-primary/50 transition-colors cursor-pointer">
            <Upload className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              Перетащите файл .xlsx сюда
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              или нажмите для выбора
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>История загрузок</CardTitle>
          <CardDescription>
            Последние загруженные файлы и их статус.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[200px] flex items-center justify-center border border-dashed rounded-lg">
          <p className="text-muted-foreground">История загрузок будет здесь</p>
        </CardContent>
      </Card>
    </div>
  );
}
