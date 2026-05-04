import { SKILL_LEVELS } from "@/lib/catalogs";

export function MiniStat({
  label,
  value,
  bad = false,
}: {
  label: string;
  value: string | number;
  bad?: boolean;
}) {
  return (
    <div
      className="rounded-lg px-3 py-2"
      style={{ background: "var(--bg-primary)" }}
    >
      <p className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
        {label}
      </p>
      <p
        className="text-[15px] font-semibold mt-0.5 tabular-nums"
        style={{ color: bad ? "var(--danger)" : "var(--text-primary)" }}
      >
        {value}
      </p>
    </div>
  );
}

export function Empty({ text }: { text: string }) {
  return (
    <p
      className="text-[13px] py-2 text-center"
      style={{ color: "var(--text-tertiary)" }}
    >
      {text}
    </p>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex flex-col gap-2 py-2">
      <div
        className="h-6 w-24 rounded animate-pulse"
        style={{ background: "var(--gray-100)" }}
      />
      <div
        className="h-3 w-full rounded animate-pulse"
        style={{ background: "var(--gray-100)" }}
      />
    </div>
  );
}

export function skillToNum(level: string | null): number {
  if (!level) return 0;
  const idx = SKILL_LEVELS.indexOf(level as (typeof SKILL_LEVELS)[number]);
  return idx === -1 ? 0 : idx + 1;
}
