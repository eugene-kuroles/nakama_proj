"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatPercent, formatDuration, formatDateFull, getScoreColor, getScoreBgColor } from "@/lib/utils";
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  User, 
  Building2,
  Phone,
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Quote
} from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CallDetailsPage({ params }: PageProps) {
  const { id } = use(params);
  const callId = parseInt(id);

  // Fetch call details from API
  const { data: call, isLoading, error } = useQuery({
    queryKey: ["call", callId],
    queryFn: () => api.get(`/calls/${callId}`),
    enabled: !isNaN(callId),
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-slate-400">Загрузка данных звонка...</span>
      </div>
    );
  }

  // Error state
  if (error || !call) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <AlertCircle className="h-16 w-16 text-red-500/50" />
        <h1 className="text-2xl font-bold text-white">Звонок не найден</h1>
        <p className="text-slate-400">Запрошенный звонок не существует или был удалён.</p>
        <Button asChild variant="outline">
          <Link href="/my">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Вернуться к списку
          </Link>
        </Button>
      </div>
    );
  }

  // Parse call data
  const score = call.final_percent || 0;
  const extraData = call.extra_data || {};
  const crmUrl = extraData.crm_url || extraData.lead_url;
  const leadName = extraData.lead_name || `Звонок #${call.external_id || call.id}`;
  const contactName = extraData.contact_name;
  const managerName = call.manager?.name || "Неизвестный менеджер";
  const callDate = call.call_date ? new Date(call.call_date) : null;

  // Group scores by criteria group
  const scoresByGroup: Record<string, typeof call.scores> = {};
  call.scores?.forEach((score: any) => {
    const groupName = score.criteria?.group?.name || "Другое";
    if (!scoresByGroup[groupName]) scoresByGroup[groupName] = [];
    scoresByGroup[groupName].push(score);
  });

  // Get score status icon
  const getScoreIcon = (scoreVal: string | null) => {
    if (!scoreVal) return <XCircle className="h-5 w-5 text-slate-500" />;
    const numScore = parseFloat(scoreVal);
    if (!isNaN(numScore)) {
      if (numScore >= 4) return <CheckCircle className="h-5 w-5 text-emerald-400" />;
      if (numScore >= 2) return <AlertCircle className="h-5 w-5 text-yellow-400" />;
      return <XCircle className="h-5 w-5 text-red-400" />;
    }
    // For tags like "Да", "Нет"
    const lower = scoreVal.toLowerCase();
    if (lower === 'да' || lower === 'yes' || lower === '5') return <CheckCircle className="h-5 w-5 text-emerald-400" />;
    if (lower === 'нет' || lower === 'no' || lower === '0') return <XCircle className="h-5 w-5 text-red-400" />;
    return <AlertCircle className="h-5 w-5 text-yellow-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="text-slate-400 hover:text-white">
            <Link href="/my">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {leadName}
            </h1>
            <p className="text-slate-400">
              Детали звонка #{call.external_id || call.id}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {crmUrl && (
            <a
              href={crmUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-400 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Открыть в CRM</span>
            </a>
          )}
          <Badge 
            className={cn(
              "text-lg font-bold px-4 py-2",
              score >= 80 ? "bg-emerald-500/20 text-emerald-400" :
              score >= 60 ? "bg-yellow-500/20 text-yellow-400" :
              "bg-red-500/20 text-red-400"
            )}
          >
            {Math.round(score)}%
          </Badge>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Score Card */}
        <div className="bg-slate-800/50 backdrop-blur rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-3 rounded-xl",
              score >= 80 ? "bg-emerald-500/20" :
              score >= 60 ? "bg-yellow-500/20" :
              "bg-red-500/20"
            )}>
              <div className="relative w-12 h-12">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    fill="none"
                    stroke="rgb(71 85 105 / 0.5)"
                    strokeWidth="4"
                  />
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    fill="none"
                    stroke={score >= 80 ? "rgb(34 197 94)" : score >= 60 ? "rgb(234 179 8)" : "rgb(239 68 68)"}
                    strokeWidth="4"
                    strokeDasharray={`${(score / 100) * 125.6} 125.6`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">{Math.round(score)}%</span>
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-400">Оценка</p>
              <p className={cn(
                "text-xl font-bold",
                score >= 80 ? "text-emerald-400" :
                score >= 60 ? "text-yellow-400" :
                "text-red-400"
              )}>
                {Math.round(score * 10) / 10}%
              </p>
            </div>
          </div>
        </div>

        {/* Duration Card */}
        <div className="bg-slate-800/50 backdrop-blur rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-500/20">
              <Clock className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Длительность</p>
              <p className="text-xl font-bold text-white">
                {formatDuration(call.duration_seconds || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Date Card */}
        <div className="bg-slate-800/50 backdrop-blur rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-purple-500/20">
              <Calendar className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Дата</p>
              <p className="text-xl font-bold text-white">
                {callDate ? formatDateFull(callDate.toISOString()) : "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Manager Card */}
        <div className="bg-slate-800/50 backdrop-blur rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-orange-500/20">
              <User className="h-6 w-6 text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Менеджер</p>
              <p className="text-xl font-bold text-white truncate">
                {managerName}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Client/Lead Info */}
      {(contactName || extraData.lead_id) && (
        <div className="bg-slate-800/50 backdrop-blur rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-slate-700/50">
              <Building2 className="h-6 w-6 text-slate-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-slate-400">Клиент / Сделка</p>
              <p className="text-lg font-semibold text-white">{leadName}</p>
              {contactName && <p className="text-sm text-slate-400">Контакт: {contactName}</p>}
            </div>
            {extraData.lead_status && (
              <Badge variant="outline" className="text-slate-300">
                {extraData.lead_status}
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Criteria Scores */}
      <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700/50 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">📋 Оценки по критериям</h2>
          <Badge className={cn(
            "text-sm font-bold",
            score >= 80 ? "bg-emerald-500/20 text-emerald-400" :
            score >= 60 ? "bg-yellow-500/20 text-yellow-400" :
            "bg-red-500/20 text-red-400"
          )}>
            {Math.round(score * 10) / 10}%
          </Badge>
        </div>
        
        <div className="divide-y divide-slate-700/30">
          {Object.entries(scoresByGroup).map(([groupName, scores]) => (
            <div key={groupName}>
              <div className="px-6 py-3 bg-slate-700/20">
                <h3 className="text-sm font-medium text-slate-400">{groupName}</h3>
              </div>
              <div className="divide-y divide-slate-700/20">
                {(scores as any[]).map((score, idx) => (
                  <div key={score.id || idx} className="px-6 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <span className="text-slate-500 font-medium min-w-[2rem]">
                          {score.criteria?.number || idx + 1}.
                        </span>
                        <div className="flex-1">
                          <p className="text-white font-medium">
                            {score.criteria?.name || `Критерий ${idx + 1}`}
                          </p>
                          
                          {/* Reason */}
                          {score.reason && (
                            <p className="mt-2 text-sm text-slate-400">
                              {score.reason}
                            </p>
                          )}
                          
                          {/* Quote */}
                          {score.quote && (
                            <div className="mt-2 p-3 bg-slate-700/30 rounded-lg border-l-2 border-blue-500/50">
                              <div className="flex items-start gap-2">
                                <Quote className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                                <p className="text-sm text-slate-300 italic">
                                  "{score.quote}"
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          "px-3 py-1 rounded-lg text-sm font-bold",
                          score.score && parseFloat(score.score) >= 4 ? "bg-emerald-500/20 text-emerald-400" :
                          score.score && parseFloat(score.score) >= 2 ? "bg-yellow-500/20 text-yellow-400" :
                          "bg-red-500/20 text-red-400"
                        )}>
                          {score.score || "—"}
                        </span>
                        {getScoreIcon(score.score)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {(!call.scores || call.scores.length === 0) && (
            <div className="px-6 py-8 text-center text-slate-500">
              Нет данных по критериям для этого звонка
            </div>
          )}
        </div>
      </div>

      {/* Back Button */}
      <div className="flex justify-center pt-4">
        <Button variant="outline" asChild>
          <Link href="/my">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Вернуться к списку звонков
          </Link>
        </Button>
      </div>
    </div>
  );
}
