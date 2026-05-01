import { CalendarIcon, ClockIcon } from "./icons";

const FIELD_CLASS =
  "block w-full h-[46px] px-4 rounded-[12px] text-[14px] text-left flex items-center justify-between transition-colors";
const FIELD_STYLE: React.CSSProperties = {
  background: "var(--bg-secondary)",
  color: "var(--text-primary)",
  border: "1.5px solid var(--gray-200)",
  minWidth: 0,
};

const RU_WEEKDAYS = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];
const RU_MONTHS = [
  "янв",
  "фев",
  "мар",
  "апр",
  "мая",
  "июн",
  "июл",
  "авг",
  "сен",
  "окт",
  "ноя",
  "дек",
];

function formatDateLabel(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return "";
  const dt = new Date(y, m - 1, d);
  return `${RU_WEEKDAYS[dt.getDay()]}, ${dt.getDate()} ${RU_MONTHS[dt.getMonth()]}`;
}

export function NativeDateField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const display = value ? formatDateLabel(value) : "Выбери дату";
  return (
    <label className={`${FIELD_CLASS} relative cursor-pointer`} style={FIELD_STYLE}>
      <span
        style={{
          color: value ? "var(--text-primary)" : "var(--text-tertiary)",
        }}
      >
        {display}
      </span>
      <CalendarIcon />
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        aria-label="Дата"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        style={{ colorScheme: "light" }}
      />
    </label>
  );
}

export function NativeTimeField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const display = value || "Выбери время";
  return (
    <label className={`${FIELD_CLASS} relative cursor-pointer`} style={FIELD_STYLE}>
      <span
        className="tabular-nums"
        style={{
          color: value ? "var(--text-primary)" : "var(--text-tertiary)",
        }}
      >
        {display}
      </span>
      <ClockIcon />
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        aria-label="Время"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        style={{ colorScheme: "light" }}
      />
    </label>
  );
}
