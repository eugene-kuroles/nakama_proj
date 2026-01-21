"use client";

import { 
  ResponsiveContainer, 
  RadarChart as RechartsRadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  Legend,
  Tooltip
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, chartColorsList, formatPercent } from "@/lib/utils";

interface RadarDataPoint {
  subject: string;
  [key: string]: string | number;
}

interface RadarConfig {
  dataKey: string;
  name: string;
  color?: string;
  fillOpacity?: number;
}

interface RadarChartProps {
  title?: string;
  data: RadarDataPoint[];
  radars: RadarConfig[];
  showLegend?: boolean;
  maxValue?: number;
  height?: number;
  className?: string;
}

export function RadarChart({
  title,
  data,
  radars,
  showLegend = true,
  maxValue = 100,
  height = 350,
  className,
}: RadarChartProps) {
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
            <RechartsRadarChart data={data} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
              <PolarGrid 
                stroke="hsl(var(--border))"
                strokeOpacity={0.5}
              />
              <PolarAngleAxis 
                dataKey="subject"
                tick={{ 
                  fill: 'hsl(var(--muted-foreground))', 
                  fontSize: 11,
                }}
                tickLine={false}
              />
              <PolarRadiusAxis 
                angle={90}
                domain={[0, maxValue]}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                tickCount={5}
                axisLine={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value) => typeof value === 'number' ? formatPercent(value) : String(value)}
              />
              {radars.map((radar, index) => (
                <Radar
                  key={radar.dataKey}
                  name={radar.name}
                  dataKey={radar.dataKey}
                  stroke={radar.color || chartColorsList[index]}
                  fill={radar.color || chartColorsList[index]}
                  fillOpacity={radar.fillOpacity ?? 0.25}
                  strokeWidth={2}
                />
              ))}
              {showLegend && (
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="circle"
                />
              )}
            </RechartsRadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
