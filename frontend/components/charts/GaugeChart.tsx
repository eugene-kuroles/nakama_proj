"use client";

import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatPercent, getScoreLevel } from "@/lib/utils";

interface GaugeChartProps {
  title?: string;
  value: number;
  maxValue?: number;
  label?: string;
  showPercent?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function GaugeChart({
  title,
  value,
  maxValue = 100,
  label,
  showPercent = true,
  size = 'md',
  className,
}: GaugeChartProps) {
  const percent = (value / maxValue) * 100;
  const scoreLevel = getScoreLevel(percent);
  
  const colors = {
    excellent: 'hsl(142, 76%, 36%)',
    good: 'hsl(38, 92%, 50%)',
    warning: 'hsl(25, 95%, 53%)',
    danger: 'hsl(0, 84%, 60%)',
  };

  const bgColor = 'hsl(var(--muted))';
  const fillColor = colors[scoreLevel];

  // Create data for semi-circle gauge
  const data = [
    { value: percent, name: 'filled' },
    { value: 100 - percent, name: 'empty' },
  ];

  const sizeConfig = {
    sm: { height: 120, innerRadius: 40, outerRadius: 55, fontSize: 'text-xl' },
    md: { height: 160, innerRadius: 55, outerRadius: 75, fontSize: 'text-3xl' },
    lg: { height: 200, innerRadius: 70, outerRadius: 95, fontSize: 'text-4xl' },
  };

  const config = sizeConfig[size];

  return (
    <Card className={cn("overflow-hidden", className)}>
      {title && (
        <CardHeader className="pb-0">
          <CardTitle className="text-lg font-semibold text-center">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className={cn("relative", !title && "pt-6")}>
        <div style={{ height: config.height }} className="relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="85%"
                startAngle={180}
                endAngle={0}
                innerRadius={config.innerRadius}
                outerRadius={config.outerRadius}
                dataKey="value"
                stroke="none"
              >
                <Cell fill={fillColor} />
                <Cell fill={bgColor} />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          
          {/* Center value */}
          <div 
            className="absolute inset-0 flex flex-col items-center justify-end pb-4"
            style={{ paddingBottom: size === 'sm' ? '8px' : size === 'md' ? '16px' : '24px' }}
          >
            <span className={cn("font-bold", config.fontSize)} style={{ color: fillColor }}>
              {showPercent ? formatPercent(percent, 0) : value}
            </span>
            {label && (
              <span className="text-sm text-muted-foreground mt-1">{label}</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
