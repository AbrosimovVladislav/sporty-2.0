type Props = {
  value: number;
  max?: number;
  color?: "primary" | "danger" | "warning";
};

const colorMap = { primary: "bg-primary", danger: "bg-danger", warning: "bg-warning" };

export function MiniBar({ value, max = 5, color = "primary" }: Props) {
  const bars = Array.from({ length: max }, (_, i) => i < value);
  const barColor = colorMap[color];
  return (
    <div className="flex items-center gap-0.5" aria-hidden="true">
      {bars.map((active, i) => (
        <div key={i} className={`w-1 h-3 rounded-sm ${active ? barColor : "bg-border"}`} />
      ))}
    </div>
  );
}
