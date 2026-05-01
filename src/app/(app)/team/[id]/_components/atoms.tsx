import { pluralize } from "@/lib/format";

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[11px] font-bold uppercase"
      style={{
        letterSpacing: "0.06em",
        color: "var(--text-tertiary)",
      }}
    >
      {children}
    </p>
  );
}

export function TrendChip({ delta, unit }: { delta: number; unit: string }) {
  if (delta === 0) return null;
  const positive = delta > 0;
  return (
    <p
      className="text-[12px] font-semibold mt-1.5 inline-flex items-center gap-0.5"
      style={{
        color: positive ? "var(--green-600)" : "var(--text-secondary)",
      }}
    >
      {positive ? "↑" : "↓"} {positive ? "+" : ""}
      {Math.abs(delta).toLocaleString("ru-RU")}
      {unit ? ` ${unit}` : ""}
    </p>
  );
}

export function initial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?";
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

export function requestsLabel(n: number): string {
  return `${n} ${pluralize(n, ["новая заявка", "новые заявки", "новых заявок"])}`;
}
