'use client';

import { 
  LayoutDashboard, 
  TrendingUp, 
  Users, 
  Trophy, 
  GraduationCap,
  User,
  Phone,
  Target,
  Upload,
  Folder,
  UserCog,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import type { UserRole } from '@/types';

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

export interface NavSection {
  title: string;
  items: NavItem[];
  roles: UserRole[];
}

export const navigation: NavSection[] = [
  {
    title: 'Executive',
    roles: ['ceo', 'admin'],
    items: [
      { name: 'Обзор', href: '/executive', icon: LayoutDashboard },
      { name: 'Тренды', href: '/executive/trends', icon: TrendingUp },
    ],
  },
  {
    title: 'Команда',
    roles: ['rop', 'admin'],
    items: [
      { name: 'Показатели команды', href: '/team', icon: Users },
      { name: 'Лидерборд', href: '/team/leaderboard', icon: Trophy },
      { name: 'Очередь коучинга', href: '/team/coaching', icon: GraduationCap },
    ],
  },
  {
    title: 'Мой кабинет',
    roles: ['manager', 'rop', 'admin'],
    items: [
      { name: 'Мой дашборд', href: '/my', icon: User },
      { name: 'Мои звонки', href: '/my/calls', icon: Phone },
      { name: 'Зоны роста', href: '/my/growth', icon: Target },
    ],
  },
  {
    title: 'Администрирование',
    roles: ['admin'],
    items: [
      { name: 'Загрузка данных', href: '/admin/upload', icon: Upload },
      { name: 'Проекты', href: '/admin/projects', icon: Folder },
      { name: 'Пользователи', href: '/admin/users', icon: UserCog },
      { name: 'Настройки', href: '/admin/settings', icon: Settings },
    ],
  },
];

export function getNavigationForRole(role: UserRole): NavSection[] {
  return navigation.filter(section => section.roles.includes(role));
}
