"use client";

import { DataTable, Column } from "./DataTable";
import { Badge } from "@/components/ui/badge";
import { cn, formatPercent, getScoreColor, getScoreBgColor } from "@/lib/utils";
import { CriteriaScore } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

interface CriteriaTableProps {
  data: CriteriaScore[];
  title?: string;
  showFeedback?: boolean;
  className?: string;
}

function getStatusIcon(score: number, maxScore: number) {
  const percent = (score / maxScore) * 100;
  if (percent >= 80) {
    return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
  }
  if (percent >= 60) {
    return <AlertCircle className="h-5 w-5 text-amber-500" />;
  }
  return <XCircle className="h-5 w-5 text-red-500" />;
}

interface CriteriaRowProps {
  criteria: CriteriaScore;
  index: number;
  showFeedback: boolean;
}

function CriteriaRow({ criteria, index, showFeedback }: CriteriaRowProps) {
  const [isOpen, setIsOpen] = useState(false);
  const percent = (criteria.score / criteria.maxScore) * 100;
  const hasFeedback = showFeedback && (criteria.feedback || criteria.quote);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className={cn(
        "grid grid-cols-[40px_1fr_80px_60px] gap-4 items-center p-4",
        "border-b last:border-b-0 hover:bg-muted/30 transition-colors",
        hasFeedback && "cursor-pointer"
      )}>
        <span className="text-muted-foreground font-medium">{index + 1}.</span>
        
        <CollapsibleTrigger asChild disabled={!hasFeedback}>
          <div className="flex items-center gap-2">
            <span className="font-medium">{criteria.name}</span>
            {hasFeedback && (
              <ChevronDown className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                isOpen && "rotate-180"
              )} />
            )}
          </div>
        </CollapsibleTrigger>
        
        <div className="flex justify-center">
          <Badge 
            variant="secondary"
            className={cn(
              "text-sm font-bold px-3 py-1",
              getScoreBgColor(percent),
              getScoreColor(percent),
            )}
          >
            {criteria.score}/{criteria.maxScore}
          </Badge>
        </div>
        
        <div className="flex justify-center">
          {getStatusIcon(criteria.score, criteria.maxScore)}
        </div>
      </div>
      
      {hasFeedback && (
        <CollapsibleContent>
          <div className="px-4 pb-4 ml-10 space-y-2">
            {criteria.feedback && (
              <div className="text-sm">
                <span className="font-medium text-muted-foreground">Причина: </span>
                <span>{criteria.feedback}</span>
              </div>
            )}
            {criteria.quote && (
              <div className="text-sm bg-muted/50 rounded-lg p-3 italic border-l-4 border-primary/30">
                &ldquo;{criteria.quote}&rdquo;
              </div>
            )}
          </div>
        </CollapsibleContent>
      )}
    </Collapsible>
  );
}

export function CriteriaTable({
  data,
  title = "Оценки по критериям",
  showFeedback = true,
  className,
}: CriteriaTableProps) {
  const totalScore = data.reduce((sum, c) => sum + c.score, 0);
  const maxTotal = data.reduce((sum, c) => sum + c.maxScore, 0);
  const totalPercent = maxTotal > 0 ? (totalScore / maxTotal) * 100 : 0;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          <Badge 
            variant="secondary"
            className={cn(
              "text-base font-bold px-4 py-1.5",
              getScoreBgColor(totalPercent),
              getScoreColor(totalPercent),
            )}
          >
            {formatPercent(totalPercent)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Header */}
        <div className="grid grid-cols-[40px_1fr_80px_60px] gap-4 items-center px-4 py-2 border-b bg-muted/30">
          <span className="text-sm font-medium text-muted-foreground">#</span>
          <span className="text-sm font-medium text-muted-foreground">Критерий</span>
          <span className="text-sm font-medium text-muted-foreground text-center">Балл</span>
          <span className="text-sm font-medium text-muted-foreground text-center">Статус</span>
        </div>
        
        {/* Rows */}
        <div>
          {data.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Нет критериев
            </div>
          ) : (
            data.map((criteria, index) => (
              <CriteriaRow 
                key={criteria.id} 
                criteria={criteria} 
                index={index}
                showFeedback={showFeedback}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
