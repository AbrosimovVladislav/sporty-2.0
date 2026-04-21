type Props = {
  value: string;
  onChange: (value: string) => void;
  options: readonly string[] | string[];
  placeholder?: string;
  className?: string;
};

export default function Select({ value, onChange, options, placeholder, className }: Props) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={
        className ??
        "w-full bg-background-card border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors text-foreground"
      }
    >
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}
