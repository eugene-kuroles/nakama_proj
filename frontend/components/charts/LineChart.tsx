"use client";

import { 
  ResponsiveContainer, 
  LineChart as RechartsLineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatPercent } from "@/lib/utils";

const chartColorsList = [
  'hsl(221, 83%, 53%)',
  'hsl(142, 76%, 36%)',
  'hsl(38, 92%, 50%)',
  'hsl(280, 65%, 60%)',
  'hsl(0, 84%, 60%)',
];

interface DataPoint {
  [key: string]: string | number | undefined;
}

interface LineConfig {
  dataKey: string;
  name: string;
  color?: string;
  strokeWidth?: number;
  dashed?: boolean;
}

interface LineChartProps {
  title?: string;
  data: DataPoint[];
  lines?: LineConfig[];
  dataKey?: string;
  xAxisKey?: string;
  yAxisDomain?: [number | 'auto', number | 'auto'];
  yAxisUnit?: string;
  color?: string;
  showGrid?: boolean;
  showLegend?: boolean;
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

export function LineChart({
  title,
  data,
  lines,
  dataKey = "value",
  xAxisKey = "date",
  yAxisDomain = ['auto', 'auto'],
  yAxisUnit,
  color = chartColorsList[0],
  showGrid = true,
  showLegend = true,
  height = 300,
  className,
}: LineChartProps) {
  // If lines not provided, create default one
  const effectiveLines = lines || [{ dataKey, name: dataKey, color }];
  
  const content = (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
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
          <Tooltip content={(props: any) => <CustomTooltip {...props} yAxisUnit={yAxisUnit} />} />
          {showLegend && effectiveLines.length > 1 && (
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
            />
          )}
          {effectiveLines.map((line, index) => (
            <Line
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              name={line.name}
              stroke={line.color || chartColorsList[index]}
              strokeWidth={line.strokeWidth || 2}
              strokeDasharray={line.dashed ? "5 5" : undefined}
              dot={{ r: 4, fill: line.color || chartColorsList[index] }}
              activeDot={{ r: 6, strokeWidth: 2 }}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );

  if (title) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          {content}
        </CardContent>
      </Card>
    );
  }

  return <div className={className}>{content}</div>;
}
