import { ReactNode } from "react";

type Variant = "filter" | "filterActive" | "status" | "statusDanger" | "statusWarning" | "statusMuted" | "role" | "counter";

type Props = {
  children: ReactNode;
  variant?: Variant;
  className?: string;
  onClick?: () => void;
};

const variantMap: Record<Variant, string> = {
  filter: "bg-background-card text-foreground border border-border text-[13px] font-medium",
  filterActive: "bg-primary text-primary-foreground shadow-card text-[13px] font-semibold",
  status: "bg-primary text-primary-foreground text-[12px] font-semibold uppercase tracking-wide",
  statusDanger: "bg-danger-soft text-danger text-[12px] font-semibold uppercase tracking-wide",
  statusWarning: "bg-warning-soft text-warning text-[12px] font-semibold uppercase tracking-wide",
  statusMuted: "bg-background-muted text-foreground-secondary text-[12px] font-semibold uppercase tracking-wide",
  role: "bg-primary-soft text-primary text-[12px] font-semibold",
  counter: "bg-danger text-white text-[11px] font-semibold tabular-nums min-w-[18px]",
};

export function Pill({ children, variant = "filter", className = "", onClick }: Props) {
  const base = `rounded-full px-3 py-1 inline-flex items-center justify-center ${variantMap[variant]} ${className}`;
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={base}>
        {children}
      </button>
    );
  }
  return <span className={base}>{children}</span>;
}
