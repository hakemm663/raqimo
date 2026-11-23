import React from "react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="p-8 sm:p-10 rounded-3xl bg-[#0F0F0F] border border-white/5 text-center flex flex-col items-center justify-center gap-3">
      <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50">
        {icon || <Inbox className="w-5 h-5" />}
      </div>
      <div className="space-y-1 max-w-md">
        <h3 className="text-sm font-bold text-white">{title}</h3>
        <p className="text-xs text-white/60 leading-relaxed">{description}</p>
      </div>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-1 px-4 py-2 rounded-xl bg-brand-gradient text-white text-xs font-bold shadow-sm hover:opacity-95 transition-opacity cursor-pointer whitespace-nowrap"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
