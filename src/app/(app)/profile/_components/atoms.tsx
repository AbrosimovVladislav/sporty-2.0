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

export function StatTile({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string | number;
  tone?: "default" | "good";
}) {
  const valueColor =
    tone === "good" ? "var(--green-600)" : "var(--text-primary)";
  return (
    <div
      className="rounded-[16px] p-4"
      style={{ background: "var(--bg-primary)" }}
    >
      <Eyebrow>{label}</Eyebrow>
      <p
        className="font-display text-[28px] leading-none font-bold tabular-nums mt-2"
        style={{ color: valueColor }}
      >
        {value}
      </p>
    </div>
  );
}

export function SkeletonBlock() {
  return (
    <div
      className="rounded-[16px] h-32 animate-pulse"
      style={{ background: "var(--bg-card)" }}
    />
  );
}
