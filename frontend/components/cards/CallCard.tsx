"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, getScoreColor, getScoreBgColor, formatPercent, formatDuration, formatDate } from "@/lib/utils";
import { CallRecord } from "@/types";
import { Calendar, Clock, User, Eye, ChevronRight } from "lucide-react";
import Link from "next/link";

interface CallCardProps {
  call: CallRecord;
  showManager?: boolean;
  className?: string;
}

export function CallCard({
  call,
  showManager = true,
  className,
}: CallCardProps) {
  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-300 group",
      "hover:shadow-lg hover:shadow-primary/5",
      className
    )}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          {/* Left side - Info */}
          <div className="flex items-center gap-4">
            {/* Score Badge */}
            <div className={cn(
              "flex-shrink-0 w-16 h-16 rounded-xl flex items-center justify-center",
              getScoreBgColor(call.score)
            )}>
              <span className={cn("text-xl font-bold", getScoreColor(call.score))}>
                {formatPercent(call.score, 0)}
              </span>
            </div>
            
            {/* Details */}
            <div className="space-y-1">
              {call.client_name && (
                <h3 className="font-semibold">{call.client_name}</h3>
              )}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{formatDate(call.date)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{formatDuration(call.duration)}</span>
                </div>
                {showManager && (
                  <div className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    <span>{call.manager_name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Right side - Actions */}
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              asChild
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Link href={`/call/${call.id}`}>
                <Eye className="h-4 w-4 mr-2" />
                Детали
              </Link>
            </Button>
            <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
