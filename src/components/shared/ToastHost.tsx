import React from "react";
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from "lucide-react";
import { useWorkspace } from "../../context/WorkspaceContext";

export const ToastHost: React.FC = () => {
  const { toasts, dismissToast } = useWorkspace();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 end-4 z-[100] flex flex-col gap-2 max-w-sm w-[calc(100vw-2rem)] pointer-events-none"
      role="status"
      aria-live="polite"
    >
      {toasts.map((t) => {
        const icon =
          t.variant === "warning" ? (
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          ) : t.variant === "error" ? (
            <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : t.variant === "info" ? (
            <Info className="w-4 h-4 text-cyan-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          );

        return (
          <div
            key={t.id}
            className="pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl bg-[#0F0F0F] border border-white/10 shadow-2xl transition-all"
          >
            <div className="mt-0.5">{icon}</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white leading-snug">{t.title}</p>
              {t.description && (
                <p className="text-[11px] text-white/60 mt-0.5 leading-snug">{t.description}</p>
              )}
            </div>
            <button
              onClick={() => dismissToast(t.id)}
              aria-label="Dismiss notification"
              className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
