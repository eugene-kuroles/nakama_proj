"use client";

import { 
  ResponsiveContainer, 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  Cell,
  LabelList
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

interface BarConfig {
  dataKey: string;
  name: string;
  color?: string;
  showLabel?: boolean;
}

interface BarChartProps {
  title?: string;
  data: DataPoint[];
  bars?: BarConfig[];
  dataKey?: string;
  xAxisKey?: string;
  yAxisDomain?: [number | 'auto', number | 'auto'];
  yAxisUnit?: string;
  layout?: 'horizontal' | 'vertical';
  showGrid?: boolean;
  showLegend?: boolean;
  colorByValue?: boolean;
  color?: string;
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

// Get color based on value for score-based coloring
function getBarColor(value: number): string {
  if (value >= 85) return 'hsl(142, 76%, 36%)';
  if (value >= 70) return 'hsl(38, 92%, 50%)';
  if (value >= 50) return 'hsl(25, 95%, 53%)';
  return 'hsl(0, 84%, 60%)';
}

export function BarChart({
  title,
  data,
  bars,
  dataKey = "value",
  xAxisKey = "name",
  yAxisDomain = [0, 100],
  yAxisUnit,
  layout = 'horizontal',
  showGrid = true,
  showLegend = false,
  colorByValue = false,
  color = chartColorsList[0],
  height = 300,
  className,
}: BarChartProps) {
  const isVertical = layout === 'vertical';
  
  // If bars not provided, create default one
  const effectiveBars = bars || [{ dataKey, name: dataKey, color }];

  const content = (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart 
          data={data} 
          layout={isVertical ? 'vertical' : 'horizontal'}
          margin={{ top: 5, right: 30, left: isVertical ? 80 : 0, bottom: 5 }}
        >
          {showGrid && (
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(var(--border))" 
              opacity={0.5}
              horizontal={!isVertical}
              vertical={isVertical}
            />
          )}
          {isVertical ? (
            <>
              <XAxis 
                type="number"
                domain={yAxisDomain}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => yAxisUnit === '%' ? `${value}%` : value}
              />
              <YAxis 
                type="category"
                dataKey={xAxisKey}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                width={75}
              />
            </>
          ) : (
            <>
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
            </>
          )}
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <Tooltip content={(props: any) => <CustomTooltip {...props} yAxisUnit={yAxisUnit} />} />
          {showLegend && effectiveBars.length > 1 && (
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
            />
          )}
          {effectiveBars.map((bar, barIndex) => (
            <Bar
              key={bar.dataKey}
              dataKey={bar.dataKey}
              name={bar.name}
              fill={bar.color || chartColorsList[barIndex]}
              radius={[4, 4, 4, 4]}
            >
              {colorByValue && data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={getBarColor(entry[bar.dataKey] as number)} 
                />
              ))}
              {bar.showLabel && (
                <LabelList 
                  dataKey={bar.dataKey} 
                  position={isVertical ? "right" : "top"}
                  formatter={(value) => yAxisUnit === '%' ? `${value}%` : value}
                  style={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
                />
              )}
            </Bar>
          ))}
        </RechartsBarChart>
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
