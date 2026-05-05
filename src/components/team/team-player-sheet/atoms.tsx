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
      className="rounded-[10px] px-3 py-2"
      style={{ background: "var(--bg-secondary)" }}
    >
      <p className="text-[11px]" style={{ color: "var(--ink-500)" }}>
        {label}
      </p>
      <p
        className="text-[15px] font-semibold mt-0.5 tabular-nums"
        style={{ color: bad ? "var(--danger)" : "var(--ink-900)" }}
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
      style={{ color: "var(--ink-400)" }}
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
        style={{ background: "var(--ink-100)" }}
      />
      <div
        className="h-3 w-full rounded animate-pulse"
        style={{ background: "var(--ink-100)" }}
      />
    </div>
  );
}
