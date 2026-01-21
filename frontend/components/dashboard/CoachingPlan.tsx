"use client";

import { Calendar, User, Target, CheckCircle, Clock, AlertTriangle } from "lucide-react";

interface CoachingTask {
  id: string;
  managerId: number;
  managerName: string;
  skill: string;
  priority: "high" | "medium" | "low";
  status: "pending" | "in_progress" | "done";
  deadline: string;
  notes?: string;
}

interface CoachingPlanProps {
  tasks: CoachingTask[];
  title?: string;
  onTaskClick?: (task: CoachingTask) => void;
}

const priorityColors = {
  high: { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/30" },
  medium: { bg: "bg-yellow-500/20", text: "text-yellow-400", border: "border-yellow-500/30" },
  low: { bg: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-500/30" },
};

const statusIcons = {
  pending: Clock,
  in_progress: AlertTriangle,
  done: CheckCircle,
};

export function CoachingPlan({ tasks, title = "Coaching Plan (2 недели)", onTaskClick }: CoachingPlanProps) {
  // Group tasks by week
  const thisWeek = tasks.filter(t => {
    const deadline = new Date(t.deadline);
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return deadline <= weekFromNow;
  });
  
  const nextWeek = tasks.filter(t => {
    const deadline = new Date(t.deadline);
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    return deadline > weekFromNow && deadline <= twoWeeksFromNow;
  });

  const TaskCard = ({ task }: { task: CoachingTask }) => {
    const colors = priorityColors[task.priority];
    const StatusIcon = statusIcons[task.status];
    
    return (
      <div
        onClick={() => onTaskClick?.(task)}
        className={`p-4 rounded-lg ${colors.bg} border ${colors.border} cursor-pointer hover:opacity-80 transition-opacity`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-slate-400" />
            <span className="text-white font-medium">{task.managerName}</span>
          </div>
          <StatusIcon className={`h-4 w-4 ${task.status === 'done' ? 'text-emerald-400' : colors.text}`} />
        </div>
        <div className="mt-2">
          <div className="flex items-center gap-2">
            <Target className="h-3 w-3 text-slate-500" />
            <span className="text-sm text-slate-300">{task.skill}</span>
          </div>
        </div>
        {task.notes && (
          <p className="mt-2 text-xs text-slate-400">{task.notes}</p>
        )}
        <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
          <Calendar className="h-3 w-3" />
          <span>{task.deadline}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700/50">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Calendar className="h-5 w-5 text-blue-400" />
        {title}
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* This Week */}
        <div>
          <h4 className="text-sm font-medium text-slate-400 mb-3">Эта неделя</h4>
          <div className="space-y-3">
            {thisWeek.length > 0 ? (
              thisWeek.map((task) => <TaskCard key={task.id} task={task} />)
            ) : (
              <div className="text-center py-4 text-slate-500 text-sm">
                Нет запланированных сессий
              </div>
            )}
          </div>
        </div>
        
        {/* Next Week */}
        <div>
          <h4 className="text-sm font-medium text-slate-400 mb-3">Следующая неделя</h4>
          <div className="space-y-3">
            {nextWeek.length > 0 ? (
              nextWeek.map((task) => <TaskCard key={task.id} task={task} />)
            ) : (
              <div className="text-center py-4 text-slate-500 text-sm">
                Нет запланированных сессий
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
