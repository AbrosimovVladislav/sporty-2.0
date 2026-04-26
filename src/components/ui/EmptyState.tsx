import { ReactNode } from "react";

type Props = {
  icon?: ReactNode;
  text: string;
  action?: { label: string; onClick: () => void };
  className?: string;
};

export function EmptyState({ icon, text, action, className = "" }: Props) {
  return (
    <div className={`bg-background-card rounded-lg p-8 text-center shadow-card ${className}`}>
      {icon && <div className="w-10 h-10 text-foreground-muted mx-auto mb-3 flex items-center justify-center">{icon}</div>}
      <p className="text-[15px] text-foreground-secondary">{text}</p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="text-primary text-[14px] font-semibold mt-3"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
