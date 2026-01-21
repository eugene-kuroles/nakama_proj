"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Bell, ChevronDown, Calendar } from "lucide-react";
import { useProject } from "@/app/providers";
import { cn } from "@/lib/utils";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const { projectId } = useProject();
  const [periodOpen, setPeriodOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("Неделя");

  const periods = ["День", "Неделя", "Месяц", "Квартал", "Год", "Произвольный"];

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        {/* Period Selector */}
        <div className="relative">
          <button
            onClick={() => setPeriodOpen(!periodOpen)}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
          >
            <Calendar className="h-4 w-4" />
            <span>{selectedPeriod}</span>
            <ChevronDown className={cn("h-4 w-4 transition-transform", periodOpen && "rotate-180")} />
          </button>
          
          {periodOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-card border border-border rounded-lg shadow-lg z-50">
              {periods.map((period) => (
                <button
                  key={period}
                  onClick={() => {
                    setSelectedPeriod(period);
                    setPeriodOpen(false);
                  }}
                  className={cn(
                    "w-full px-4 py-2 text-sm text-left hover:bg-secondary transition-colors first:rounded-t-lg last:rounded-b-lg",
                    selectedPeriod === period && "bg-primary/10 text-primary"
                  )}
                >
                  {period}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 hover:bg-secondary rounded-lg transition-colors"
          title={theme === "dark" ? "Светлая тема" : "Тёмная тема"}
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </button>

        {/* Notifications */}
        <button className="relative p-2 hover:bg-secondary rounded-lg transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>
      </div>
    </header>
  );
}
