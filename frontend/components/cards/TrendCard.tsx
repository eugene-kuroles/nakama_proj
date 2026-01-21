"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis,
  Tooltip
} from "recharts";
import { ChartDataPoint } from "@/types";

interface TrendCardProps {
  title: string;
  value: string | number;
  data: ChartDataPoint[];
  color?: string;
  className?: string;
}

export function TrendCard({
  title,
  value,
  data,
  color = "hsl(221, 83%, 53%)",
  className,
}: TrendCardProps) {
  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-300",
      "hover:shadow-lg hover:shadow-primary/5",
      className
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </CardTitle>
          <span className="text-2xl font-bold">{value}</span>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="h-16">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" hide />
              <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                fill={`url(#gradient-${title})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
