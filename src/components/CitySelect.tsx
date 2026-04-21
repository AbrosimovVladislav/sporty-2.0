"use client";

const CITIES = ["Алматы"];

type Props = {
  value: string;
  onChange: (city: string) => void;
  className?: string;
};

export default function CitySelect({ value, onChange, className }: Props) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={
        className ??
        "bg-background-card border border-border rounded-md px-4 py-3 text-foreground outline-none focus:border-primary transition-colors"
      }
    >
      <option value="">Любой город</option>
      {CITIES.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
  );
}
