'use client';

import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function DashboardHome() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      // Redirect based on role
      switch (user.role) {
        case 'ceo':
          router.replace('/executive');
          break;
        case 'rop':
          router.replace('/team');
          break;
        case 'manager':
          router.replace('/my');
          break;
        case 'admin':
          router.replace('/admin');
          break;
        default:
          router.replace('/my');
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Перенаправление...</p>
      </div>
    </div>
  );
}
