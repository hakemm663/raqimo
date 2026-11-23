import React, { useState } from "react";
import { Sparkles, Check, ChevronRight, X } from "lucide-react";
import { useWorkspace } from "../../context/WorkspaceContext";

interface AIProposal {
  label: string;
  description: string;
  onApply: () => void;
}

interface AIInsightPanelProps {
  contextLabel: string;
  promptButtonLabel: string;
  responseSummary: string;
  bullets: string[];
  proposal?: AIProposal;
  compact?: boolean;
}

export const AIInsightPanel: React.FC<AIInsightPanelProps> = ({
  contextLabel,
  promptButtonLabel,
  responseSummary,
  bullets,
  proposal,
  compact = false,
}) => {
  const { language, pushToast } = useWorkspace();
  const isAr = language === "ar";
  const [expanded, setExpanded] = useState(false);
  const [applied, setApplied] = useState(false);

  const handleApply = () => {
    if (!proposal) return;
    proposal.onApply();
    setApplied(true);
    pushToast(
      isAr ? "تم تطبيق الاقتراح" : "Suggestion applied",
      proposal.label
    );
  };

  return (
    <div className="rounded-2xl bg-[#0A0A0A] border border-white/10 p-3.5 space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-xl bg-brand-gradient text-white flex items-center justify-center shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-bold text-white truncate">{contextLabel}</div>
            <div className="text-[10px] text-white/50 truncate">
              {isAr ? "معاينة محلية مقترحة · لا يتم أي تعديل تلقائي" : "Local AI suggestion · Review before applying"}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-semibold text-white/80 flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
        >
          <span>{expanded ? (isAr ? "إخفاء" : "Hide") : promptButtonLabel}</span>
          {expanded ? <X className="w-3 h-3" /> : <ChevronRight className="w-3 h-3 rtl:rotate-180" />}
        </button>
      </div>

      {expanded && (
        <div className="pt-2 border-t border-white/10 space-y-2.5 text-xs">
          <p className={`text-white/80 leading-relaxed ${compact ? "text-[11px]" : "text-xs"}`}>
            {responseSummary}
          </p>
          {bullets.length > 0 && (
            <ul className="space-y-1.5">
              {bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-[11px] text-white/70">
                  <span className="text-cyan-400 font-bold mt-0.5">•</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}

          {proposal && (
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-2 flex-wrap">
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-white">{proposal.label}</p>
                <p className="text-[10px] text-white/60">{proposal.description}</p>
              </div>
              <button
                type="button"
                disabled={applied}
                onClick={handleApply}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer ${
                  applied
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default"
                    : "bg-brand-gradient text-white hover:opacity-95"
                }`}
              >
                <Check className="w-3 h-3" />
                <span>{applied ? (isAr ? "تم التطبيق" : "Applied") : (isAr ? "تأكيد وتطبيق" : "Confirm & Apply")}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
