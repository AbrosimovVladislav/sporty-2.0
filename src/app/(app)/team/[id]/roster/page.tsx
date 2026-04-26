"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Status = "active" | "doubt";
type Group = "core" | "doubt" | "reserve";

type Player = {
  name: string;
  position: string;
  role: string;
  rating: number;
  status: Status;
  group: Group;
  captain?: boolean;
};

const PLAYERS: Player[] = [
  { name: "Иван Петров", position: "ЦЗ", role: "Основной", rating: 75, status: "active", group: "core" },
  { name: "Максим Козлов", position: "НАП", role: "Капитан", rating: 73, status: "active", group: "core", captain: true },
  { name: "Денис Орлов", position: "ЛЗ", role: "Основной", rating: 71, status: "active", group: "core" },
  { name: "Кирилл Смирнов", position: "ПЗ", role: "Основной", rating: 69, status: "active", group: "core" },
  { name: "Алексей Фёдоров", position: "ЦЗ", role: "Основной", rating: 66, status: "active", group: "core" },
  { name: "Павел Иванов", position: "НАП", role: "Основной", rating: 63, status: "active", group: "core" },
  { name: "Роман Сидоров", position: "ЛН", role: "Основной", rating: 60, status: "active", group: "core" },
  { name: "Артём Новиков", position: "ВРТ", role: "Основной", rating: 58, status: "active", group: "core" },
  { name: "Игорь Волков", position: "ПН", role: "Основной", rating: 55, status: "active", group: "core" },

  { name: "Сергей Морозов", position: "ЦП", role: "Травма", rating: 70, status: "doubt", group: "doubt" },
  { name: "Виктор Зайцев", position: "ПЗ", role: "Болен", rating: 65, status: "doubt", group: "doubt" },
  { name: "Дмитрий Лебедев", position: "НАП", role: "Под вопросом", rating: 61, status: "doubt", group: "doubt" },

  { name: "Андрей Козырев", position: "ЦЗ", role: "Запас", rating: 54, status: "active", group: "reserve" },
  { name: "Николай Быков", position: "ЛЗ", role: "Запас", rating: 51, status: "active", group: "reserve" },
  { name: "Тимур Ахметов", position: "ПН", role: "Запас", rating: 49, status: "active", group: "reserve" },
  { name: "Евгений Крылов", position: "ЦП", role: "Запас", rating: 47, status: "active", group: "reserve" },
  { name: "Олег Мельников", position: "НАП", role: "Запас", rating: 44, status: "active", group: "reserve" },
  { name: "Пётр Соколов", position: "ЛН", role: "Запас", rating: 42, status: "active", group: "reserve" },
  { name: "Василий Громов", position: "ВРТ", role: "Запас", rating: 39, status: "active", group: "reserve" },
  { name: "Руслан Попов", position: "ПЗ", role: "Запас", rating: 36, status: "active", group: "reserve" },
];

const GOALKEEPER_POS = "ВРТ";
const DEFENDER_POS = ["ЦЗ", "ЛЗ", "ПЗ"];
const MIDFIELDER_POS = ["ЦП"];
const FORWARD_POS = ["НАП", "ЛН", "ПН"];

type FilterKey = "all" | "gk" | "def" | "mid" | "fwd";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Все" },
  { key: "gk", label: "Вратари" },
  { key: "def", label: "Защитники" },
  { key: "mid", label: "Полузащ." },
  { key: "fwd", label: "Нападающие" },
];

function ratingToBars(rating: number): number {
  if (rating >= 70) return 5;
  if (rating >= 60) return 4;
  if (rating >= 50) return 3;
  if (rating >= 40) return 2;
  return 1;
}

function matchesFilter(p: Player, key: FilterKey): boolean {
  if (key === "all") return true;
  if (key === "gk") return p.position === GOALKEEPER_POS;
  if (key === "def") return DEFENDER_POS.includes(p.position);
  if (key === "mid") return MIDFIELDER_POS.includes(p.position);
  if (key === "fwd") return FORWARD_POS.includes(p.position);
  return true;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function RosterPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterKey>("all");

  const visible = PLAYERS.filter((p) => matchesFilter(p, filter));
  const core = visible.filter((p) => p.group === "core");
  const doubt = visible.filter((p) => p.group === "doubt");
  const reserve = visible.filter((p) => p.group === "reserve");

  return (
    <div className="flex flex-1 flex-col min-h-screen" style={{ backgroundColor: "#F0EBE1" }}>
      <NavBar onBack={() => router.back()} />

      <div className="px-4 pt-3 pb-6">
        <StatsGrid />

        <div className="mt-4 -mx-4 overflow-x-auto">
          <div className="flex gap-2 px-4 pb-1">
            {FILTERS.map((f) => (
              <FilterPill
                key={f.key}
                label={f.label}
                active={filter === f.key}
                onClick={() => setFilter(f.key)}
              />
            ))}
          </div>
        </div>

        {core.length > 0 && (
          <PlayerSection title="ЯДРО" count={core.length} players={core} />
        )}
        {doubt.length > 0 && (
          <PlayerSection title="ПОД ВОПРОСОМ" count={doubt.length} players={doubt} />
        )}
        {reserve.length > 0 && (
          <PlayerSection title="ЗАПАС" count={reserve.length} players={reserve} />
        )}
      </div>
    </div>
  );
}

function NavBar({ onBack }: { onBack: () => void }) {
  return (
    <header
      className="flex items-center justify-between px-4 pt-3 pb-3"
      style={{ backgroundColor: "#F0EBE1" }}
    >
      <button
        onClick={onBack}
        className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm"
        aria-label="Назад"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <h1 className="text-[20px] font-bold" style={{ color: "#1A1A1A" }}>Состав</h1>
      <div className="flex items-center gap-2">
        <button className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm" aria-label="Поиск">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <line x1="20" y1="20" x2="16.5" y2="16.5" />
          </svg>
        </button>
        <button className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm" aria-label="Добавить">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>
    </header>
  );
}

function StatsGrid() {
  const active = PLAYERS.filter((p) => p.group === "core").length;
  const doubt = PLAYERS.filter((p) => p.group === "doubt").length;
  const target = 12;
  const deficit = Math.max(0, target - active - doubt);
  const goalkeepers = PLAYERS.filter((p) => p.position === GOALKEEPER_POS && p.group !== "reserve").length;

  const activePct = (active / target) * 100;
  const doubtPct = (doubt / target) * 100;
  const deficitPct = (deficit / target) * 100;

  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: "1.45fr 1fr" }}>
      <div className="bg-white rounded-2xl p-4 flex flex-col justify-between" style={{ minHeight: 168 }}>
        <p className="text-[13px]" style={{ color: "#8A8A8E" }}>Состав в сборе</p>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-[64px] font-bold leading-none" style={{ color: "#2DB34A" }}>{active}</span>
          <span className="text-[28px] font-light leading-none" style={{ color: "#8A8A8E" }}>/ {target}</span>
        </div>
        <div className="mt-3">
          <div className="flex gap-1 h-[6px] rounded-full overflow-hidden">
            <div style={{ width: `${activePct}%`, backgroundColor: "#2DB34A" }} className="rounded-full" />
            <div style={{ width: `${doubtPct}%`, backgroundColor: "#F5A623" }} className="rounded-full" />
            {deficitPct > 0 && (
              <div style={{ width: `${deficitPct}%`, backgroundColor: "#E53935" }} className="rounded-full" />
            )}
          </div>
          <div className="flex items-center gap-2 mt-2 text-[10px] flex-wrap" style={{ color: "#8A8A8E" }}>
            <LegendDot color="#2DB34A" label="активные" />
            <LegendDot color="#F5A623" label="под вопросом" />
            <LegendDot color="#E53935" label="дефицит" />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <MiniStat value={doubt} valueColor="#F5A623" label="под вопросом" />
        <MiniStat value={goalkeepers} valueColor="#E53935" label="вратарей" />
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1 whitespace-nowrap">
      <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function MiniStat({ value, valueColor, label }: { value: number; valueColor: string; label: string }) {
  return (
    <div className="bg-white rounded-2xl p-4 flex-1 flex flex-col justify-center">
      <span className="text-[40px] font-bold leading-none" style={{ color: valueColor }}>{value}</span>
      <span className="text-[13px] mt-1" style={{ color: "#8A8A8E" }}>{label}</span>
    </div>
  );
}

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 px-4 h-9 rounded-full text-[14px] font-medium transition-colors"
      style={
        active
          ? { backgroundColor: "#2DB34A", color: "#FFFFFF" }
          : { backgroundColor: "#FFFFFF", color: "#1A1A1A", border: "1px solid #E0E0E0" }
      }
    >
      {label}
    </button>
  );
}

function PlayerSection({ title, count, players }: { title: string; count: number; players: Player[] }) {
  return (
    <section className="mt-5">
      <p
        className="text-[12px] font-bold uppercase mb-1"
        style={{ color: "#2DB34A", letterSpacing: "1px" }}
      >
        {title} · {count}
      </p>
      <ul>
        {players.map((p, idx) => (
          <PlayerRow key={p.name} player={p} isLast={idx === players.length - 1} />
        ))}
      </ul>
    </section>
  );
}

function PlayerRow({ player, isLast }: { player: Player; isLast: boolean }) {
  const filled = ratingToBars(player.rating);

  return (
    <li
      className="flex items-center gap-3 py-3"
      style={{ borderBottom: isLast ? "none" : "1px solid #E8E3D9" }}
    >
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
        style={{ backgroundColor: "#D9D5CC", color: "#6B6B6B" }}
      >
        <span className="text-[14px] font-semibold">{initials(player.name)}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-[17px] font-bold truncate" style={{ color: "#1A1A1A" }}>
            {player.name}
          </p>
          {player.captain && (
            <span
              className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full shrink-0"
              style={{ backgroundColor: "#2DB34A" }}
              aria-label="Капитан"
            >
              <span className="text-[10px] font-bold" style={{ color: "#FFFFFF" }}>C</span>
            </span>
          )}
        </div>
        <p className="text-[13px] mt-0.5 truncate" style={{ color: "#8A8A8E" }}>
          {player.position} · {player.role}
        </p>
      </div>

      <div className="flex items-end gap-[3px] shrink-0" aria-hidden="true">
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            className="rounded-[1px]"
            style={{
              width: 4,
              height: 14,
              backgroundColor: i < filled ? "#2DB34A" : "#E0E0E0",
            }}
          />
        ))}
      </div>

      <div
        className="rounded-lg px-2 py-1 ml-2 shrink-0"
        style={{ backgroundColor: "#EFEFEF" }}
      >
        <span className="text-[14px] font-semibold tabular-nums" style={{ color: "#1A1A1A" }}>
          {player.rating}
        </span>
      </div>
    </li>
  );
}
