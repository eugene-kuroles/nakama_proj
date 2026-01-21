"use client";

import { 
  ResponsiveContainer, 
  AreaChart as RechartsAreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, chartColorsList, formatPercent } from "@/lib/utils";

interface DataPoint {
  [key: string]: string | number | undefined;
}

interface AreaConfig {
  dataKey: string;
  name: string;
  color?: string;
  fillOpacity?: number;
  stackId?: string;
}

interface AreaChartProps {
  title?: string;
  data: DataPoint[];
  areas: AreaConfig[];
  xAxisKey?: string;
  yAxisDomain?: [number | 'auto', number | 'auto'];
  yAxisUnit?: string;
  showGrid?: boolean;
  showLegend?: boolean;
  stacked?: boolean;
  height?: number;
  className?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any[];
  label?: string | number;
  yAxisUnit?: string;
}

const CustomTooltip = ({ 
  active, 
  payload, 
  label,
  yAxisUnit 
}: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium text-muted-foreground mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-semibold">
              {typeof entry.value === 'number' 
                ? yAxisUnit === '%' 
                  ? formatPercent(entry.value)
                  : entry.value.toLocaleString()
                : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function AreaChart({
  title,
  data,
  areas,
  xAxisKey = "date",
  yAxisDomain = ['auto', 'auto'],
  yAxisUnit,
  showGrid = true,
  showLegend = true,
  stacked = false,
  height = 300,
  className,
}: AreaChartProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      {title && (
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className={cn(!title && "pt-6")}>
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <RechartsAreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <defs>
                {areas.map((area, index) => {
                  const color = area.color || chartColorsList[index];
                  return (
                    <linearGradient 
                      key={`gradient-${area.dataKey}`} 
                      id={`gradient-${area.dataKey}`} 
                      x1="0" 
                      y1="0" 
                      x2="0" 
                      y2="1"
                    >
                      <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={color} stopOpacity={0.05} />
                    </linearGradient>
                  );
                })}
              </defs>
              {showGrid && (
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="hsl(var(--border))" 
                  opacity={0.5}
                />
              )}
              <XAxis 
                dataKey={xAxisKey} 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                domain={yAxisDomain}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => yAxisUnit === '%' ? `${value}%` : value}
              />
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <Tooltip 
                content={(props: any) => (
                  <CustomTooltip {...props} yAxisUnit={yAxisUnit} />
                )} 
              />
              {showLegend && (
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="circle"
                />
              )}
              {areas.map((area, index) => {
                const color = area.color || chartColorsList[index];
                return (
                  <Area
                    key={area.dataKey}
                    type="monotone"
                    dataKey={area.dataKey}
                    name={area.name}
                    stackId={stacked ? 'stack' : area.stackId}
                    stroke={color}
                    strokeWidth={2}
                    fill={`url(#gradient-${area.dataKey})`}
                    fillOpacity={area.fillOpacity ?? 1}
                  />
                );
              })}
            </RechartsAreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
