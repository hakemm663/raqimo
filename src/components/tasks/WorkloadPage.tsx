import React, { useMemo } from "react";
import { Users, AlertTriangle, Clock } from "lucide-react";
import { useWorkspace } from "../../context/WorkspaceContext";
import { computeTeamWorkload } from "../../utils/taskMetrics";
import { PageHeader } from "../shared/PageHeader";

export const WorkloadPage: React.FC = () => {
  const { data, todayISO, language, setSelectedTaskId, setActiveSection } = useWorkspace();
  const isAr = language === "ar";

  const workload = useMemo(
    () => computeTeamWorkload(data.team, data.tasks, todayISO),
    [data.team, data.tasks, todayISO]
  );

  return (
    <div className="space-y-5 pb-12 max-w-7xl mx-auto">
      <PageHeader
        breadcrumb={isAr ? "مساحة العمل / عبء العمل" : "Workspace / Workload"}
        title={isAr ? "توزيع عبء العمل والسعة" : "Team Workload & Capacity"}
        subtitle={
          isAr
            ? "تحليل توزيع المهام النشطة، الساعات المقدرة، والمهام المتأخرة لكل عضو في الفريق."
            : "Monitor active task allocation, estimated weekly hours, and overdue bottlenecks across the team."
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {workload.map((row) => {
          const memberTasks = data.tasks.filter(
            (t) =>
              !t.parentTaskId &&
              t.assigneeId === row.member.id &&
              t.status !== "Done" &&
              t.status !== "Cancelled"
          );

          const statusColor =
            row.status === "overloaded"
              ? "text-rose-400"
              : row.status === "high"
              ? "text-amber-400"
              : row.status === "light"
              ? "text-cyan-400"
              : "text-emerald-400";

          return (
            <div
              key={row.member.id}
              className="p-5 rounded-3xl bg-[#0F0F0F] border border-white/5 space-y-4 flex flex-col"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-full font-bold text-xs flex items-center justify-center border border-white/10 shrink-0"
                    style={{
                      backgroundColor: `${row.member.color}22`,
                      color: row.member.color,
                    }}
                  >
                    {row.member.initials}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-white truncate">
                      {isAr ? row.member.nameAr : row.member.name}
                    </h3>
                    <p className="text-[11px] text-white/50 truncate">
                      {isAr ? row.member.roleAr : row.member.role}
                    </p>
                  </div>
                </div>
                <span className={`text-[11px] font-bold uppercase ${statusColor}`}>
                  {row.status}
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/60 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    {isAr ? "الساعات المقدرة" : "Estimated Load"}
                  </span>
                  <span className="font-mono font-bold text-white">
                    {row.estimatedHours}h / {row.member.weeklyCapacityHours}h
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      (row.utilizationPct || 0) > 100
                        ? "bg-rose-500"
                        : (row.utilizationPct || 0) >= 80
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    }`}
                    style={{ width: `${Math.min(100, row.utilizationPct || 0)}%` }}
                  />
                </div>
                {row.hasMissingEstimates && (
                  <p className="text-[10px] text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    <span>
                      {isAr
                        ? "بعض المهام بدون تقدير زمني دقيق"
                        : "Some active tasks are missing time estimates"}
                    </span>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-[#0A0A0A] border border-white/5">
                  <span className="text-[10px] text-white/50 block">
                    {isAr ? "مهام نشطة" : "Active"}
                  </span>
                  <span className="font-mono font-bold text-white">{row.activeCount}</span>
                </div>
                <div className="p-2 rounded-xl bg-[#0A0A0A] border border-white/5">
                  <span className="text-[10px] text-white/50 block">
                    {isAr ? "متأخرة" : "Overdue"}
                  </span>
                  <span
                    className={`font-mono font-bold ${
                      row.overdueCount > 0 ? "text-rose-400" : "text-emerald-400"
                    }`}
                  >
                    {row.overdueCount}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 flex-1">
                <p className="text-[10px] uppercase tracking-wider text-white/40 font-bold">
                  {isAr ? "قائمة المهام الحالية" : "Assigned Queue"}
                </p>
                {memberTasks.slice(0, 4).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setSelectedTaskId(t.id);
                      setActiveSection("tasks-my");
                    }}
                    className="w-full text-start p-2 rounded-xl bg-[#0A0A0A] border border-white/5 hover:border-white/20 text-[11px] text-white truncate block cursor-pointer"
                  >
                    {t.title}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Table */}
      <div className="rounded-3xl bg-[#0F0F0F] border border-white/5 overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center gap-2">
          <Users className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-white">
            {isAr ? "مقارنة السعة الأسبوعية" : "Weekly Capacity Breakdown"}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/10 text-white/50 text-[11px]">
                <th className="py-3 px-4 text-start">{isAr ? "العضو" : "Member"}</th>
                <th className="py-3 px-3 text-end">{isAr ? "نشطة" : "Active"}</th>
                <th className="py-3 px-3 text-end">{isAr ? "متأخرة" : "Overdue"}</th>
                <th className="py-3 px-3 text-end">{isAr ? "ساعات مقدرة" : "Est. Hours"}</th>
                <th className="py-3 px-4 text-end">{isAr ? "نسبة الإشغال" : "Utilization"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {workload.map((row) => (
                <tr key={row.member.id}>
                  <td className="py-3 px-4 font-bold text-white">
                    {isAr ? row.member.nameAr : row.member.name}
                  </td>
                  <td className="py-3 px-3 text-end font-mono text-white/80">{row.activeCount}</td>
                  <td className="py-3 px-3 text-end font-mono text-rose-400">{row.overdueCount}</td>
                  <td className="py-3 px-3 text-end font-mono text-white/80">
                    {row.estimatedHours}h / {row.member.weeklyCapacityHours}h
                  </td>
                  <td className="py-3 px-4 text-end font-mono font-bold text-cyan-400">
                    {row.utilizationPct !== null ? `${row.utilizationPct}%` : "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
