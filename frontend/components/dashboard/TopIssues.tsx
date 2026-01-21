"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatPercent, getScoreColor, getScoreBgColor } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

interface Issue {
  criteria: string;
  avgScore: number;
  count: number;
}

interface TopIssuesProps {
  issues: Issue[];
  title?: string;
  className?: string;
}

export function TopIssues({
  issues,
  title = "Top Issues",
  className,
}: TopIssuesProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {issues.map((issue, index) => (
            <div 
              key={issue.criteria}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-muted-foreground w-6">
                  {index + 1}.
                </span>
                <div>
                  <p className="font-medium">{issue.criteria}</p>
                  <p className="text-sm text-muted-foreground">
                    {issue.count} случаев
                  </p>
                </div>
              </div>
              <Badge 
                variant="secondary"
                className={cn(
                  "text-sm font-bold px-3 py-1",
                  getScoreBgColor(issue.avgScore),
                  getScoreColor(issue.avgScore),
                )}
              >
                {formatPercent(issue.avgScore)}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
