import { ReactNode } from "react";

type Props = {
  label: string;
  value: ReactNode;
  color?: "default" | "primary" | "danger" | "warning";
  progress?: { value: number; max: number };
  className?: string;
  onClick?: () => void;
};

const colorMap = {
  default: "text-foreground",
  primary: "text-primary",
  danger: "text-danger",
  warning: "text-warning",
};

export function StatCard({ label, value, color = "default", progress, className = "", onClick }: Props) {
  const content = (
    <>
      <p className="text-[13px] text-foreground-secondary mb-1">{label}</p>
      <p className={`text-[40px] leading-none font-bold tabular-nums ${colorMap[color]}`}>{value}</p>
      {progress && (
        <div className="mt-3 h-1.5 bg-background-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${Math.min(100, (progress.value / progress.max) * 100)}%` }}
          />
        </div>
      )}
    </>
  );

  const base = `bg-background-card rounded-lg p-5 shadow-card ${className}`;

  if (onClick) {
    return <button type="button" onClick={onClick} className={`${base} w-full text-left`}>{content}</button>;
  }
  return <div className={base}>{content}</div>;
}

type MiniStatCardProps = {
  label: string;
  value: ReactNode;
  color?: "default" | "primary" | "danger" | "warning";
  className?: string;
  onClick?: () => void;
};

export function MiniStatCard({ label, value, color = "default", className = "", onClick }: MiniStatCardProps) {
  const content = (
    <>
      <p className={`text-[28px] leading-none font-semibold tabular-nums ${colorMap[color]}`}>{value}</p>
      <p className="text-[13px] text-foreground-secondary mt-1">{label}</p>
    </>
  );

  const base = `bg-background-card rounded-lg p-4 shadow-card flex flex-col gap-1 ${className}`;

  if (onClick) {
    return <button type="button" onClick={onClick} className={`${base} w-full text-left`}>{content}</button>;
  }
  return <div className={base}>{content}</div>;
}
