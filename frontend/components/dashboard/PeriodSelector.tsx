"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PeriodFilter } from "@/types";

interface PeriodSelectorProps {
  value: PeriodFilter;
  onChange: (value: PeriodFilter) => void;
  className?: string;
}

const periodOptions: { value: PeriodFilter; label: string }[] = [
  { value: 'day', label: 'Сегодня' },
  { value: 'week', label: 'Неделя' },
  { value: 'month', label: 'Месяц' },
  { value: 'quarter', label: 'Квартал' },
  { value: 'year', label: 'Год' },
];

export function PeriodSelector({ value, onChange, className }: PeriodSelectorProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Период" />
      </SelectTrigger>
      <SelectContent>
        {periodOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
