/**
 * Русское склонение по количеству (1, 2-4, 5+).
 * @example pluralize(1, ['день', 'дня', 'дней']) // 'день'
 * @example pluralize(3, ['событие', 'события', 'событий']) // 'события'
 */
export function pluralize(n: number, forms: [one: string, few: string, many: string]): string {
  const abs = Math.abs(n);
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  if (mod100 >= 11 && mod100 <= 14) return forms[2];
  if (mod10 === 1) return forms[0];
  if (mod10 >= 2 && mod10 <= 4) return forms[1];
  return forms[2];
}

const DAYS_FORMS: [string, string, string] = ["день", "дня", "дней"];

export function formatCountdown(dateStr: string): string {
  const now = new Date();
  const d = new Date(dateStr);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const days = Math.round((startOfDate.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 0) return "прошло";
  if (days === 0) return "сегодня";
  if (days === 1) return "завтра";
  return `${days} ${pluralize(days, DAYS_FORMS)}`;
}

export function formatCountdownLabel(dateStr: string): string {
  const now = new Date();
  const d = new Date(dateStr);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const days = Math.round((startOfDate.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 1) return "";
  return "до старта";
}

export function formatPrice(price: number): string {
  if (price === 0) return "Бесплатно";
  return `${price.toLocaleString("ru-RU")} ₸`;
}

export function formatMoney(amount: number): string {
  return `${amount.toLocaleString("ru-RU")} ₸`;
}

export function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

export function formatDayShort(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.toLocaleDateString("ru-RU", { day: "numeric" });
  const month = d.toLocaleDateString("ru-RU", { month: "short" }).replace(".", "");
  return `${day} ${month}`;
}

export function formatWeekday(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ru-RU", { weekday: "short" });
}

export function formatFullDate(dateStr: string): string {
  const d = new Date(dateStr);
  const weekday = d.toLocaleDateString("ru-RU", { weekday: "long" });
  const day = d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
  const time = d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  return `${weekday}, ${day} в ${time}`;
}

/** "2026-05" → "май" (короткое название месяца). */
export function formatMonthShort(monthStr: string): string {
  const [year, month] = monthStr.split("-").map(Number);
  return new Date(year, month - 1, 1)
    .toLocaleDateString("ru-RU", { month: "short" })
    .replace(".", "");
}

export function teamGradient(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const palettes = [
    "linear-gradient(135deg, #2d3436, #636e72)",
    "linear-gradient(135deg, oklch(0.42 0.13 155), oklch(0.58 0.17 155))",
    "linear-gradient(135deg, #6c5ce7, #a29bfe)",
    "linear-gradient(135deg, #d63031, #ff7675)",
    "linear-gradient(135deg, #0984e3, #74b9ff)",
    "linear-gradient(135deg, #e17055, #fab1a0)",
    "linear-gradient(135deg, #00b894, #55efc4)",
    "linear-gradient(135deg, #fd79a8, #ffeaa7)",
  ];
  return palettes[Math.abs(hash) % palettes.length];
}
