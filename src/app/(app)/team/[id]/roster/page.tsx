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
  avatarSeed: number;
};

const PLAYERS: Player[] = [
  { name: "Иван Петров", position: "ЦЗ", role: "Основной", rating: 75, status: "active", group: "core", avatarSeed: 11 },
  { name: "Максим Козлов", position: "НАП", role: "Капитан", rating: 73, status: "active", group: "core", captain: true, avatarSeed: 12 },
  { name: "Денис Орлов", position: "ЛЗ", role: "Основной", rating: 71, status: "active", group: "core", avatarSeed: 13 },
  { name: "Кирилл Смирнов", position: "ПЗ", role: "Основной", rating: 69, status: "active", group: "core", avatarSeed: 14 },
  { name: "Алексей Фёдоров", position: "ЦЗ", role: "Основной", rating: 66, status: "active", group: "core", avatarSeed: 15 },
  { name: "Павел Иванов", position: "НАП", role: "Основной", rating: 63, status: "active", group: "core", avatarSeed: 17 },
  { name: "Роман Сидоров", position: "ЛН", role: "Основной", rating: 60, status: "active", group: "core", avatarSeed: 18 },
  { name: "Артём Новиков", position: "ВРТ", role: "Основной", rating: 58, status: "active", group: "core", avatarSeed: 33 },
  { name: "Игорь Волков", position: "ПН", role: "Основной", rating: 55, status: "active", group: "core", avatarSeed: 51 },

  { name: "Сергей Морозов", position: "ЦП", role: "Травма", rating: 70, status: "doubt", group: "doubt", avatarSeed: 52 },
  { name: "Виктор Зайцев", position: "ПЗ", role: "Болен", rating: 65, status: "doubt", group: "doubt", avatarSeed: 53 },
  { name: "Дмитрий Лебедев", position: "НАП", role: "Под вопросом", rating: 61, status: "doubt", group: "doubt", avatarSeed: 54 },

  { name: "Андрей Козырев", position: "ЦЗ", role: "Запас", rating: 54, status: "active", group: "reserve", avatarSeed: 55 },
  { name: "Николай Быков", position: "ЛЗ", role: "Запас", rating: 51, status: "active", group: "reserve", avatarSeed: 56 },
  { name: "Тимур Ахметов", position: "ПН", role: "Запас", rating: 49, status: "active", group: "reserve", avatarSeed: 57 },
  { name: "Евгений Крылов", position: "ЦП", role: "Запас", rating: 47, status: "active", group: "reserve", avatarSeed: 58 },
  { name: "Олег Мельников", position: "НАП", role: "Запас", rating: 44, status: "active", group: "reserve", avatarSeed: 59 },
  { name: "Пётр Соколов", position: "ЛН", role: "Запас", rating: 42, status: "active", group: "reserve", avatarSeed: 60 },
  { name: "Василий Громов", position: "ВРТ", role: "Запас", rating: 39, status: "active", group: "reserve", avatarSeed: 61 },
  { name: "Руслан Попов", position: "ПЗ", role: "Запас", rating: 36, status: "active", group: "reserve", avatarSeed: 62 },
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

const CARD_SHADOW = "0 1px 2px rgba(15, 20, 23, 0.04), 0 1px 3px rgba(15, 20, 23, 0.05)";

export default function RosterPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterKey>("all");

  const visible = PLAYERS.filter((p) => matchesFilter(p, filter));
  const core = visible.filter((p) => p.group === "core");
  const doubt = visible.filter((p) => p.group === "doubt");
  const reserve = visible.filter((p) => p.group === "reserve");

  return (
    <div className="flex flex-1 flex-col min-h-screen" style={{ backgroundColor: "#F5F5F7" }}>
      <NavBar onBack={() => router.back()} />

      <div className="px-4 pb-4">
        <StatsGrid />

        <div className="mt-3 -mx-4 overflow-x-auto">
          <div className="flex gap-1.5 px-4 pb-1">
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
    <header className="flex items-center justify-between px-4 pt-2 pb-3">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0"
          style={{ boxShadow: CARD_SHADOW }}
          aria-label="Назад"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="text-[20px] font-bold leading-none truncate" style={{ color: "#1A1A1A" }}>
          Состав
        </h1>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          className="w-8 h-8 rounded-full bg-white flex items-center justify-center"
          style={{ boxShadow: CARD_SHADOW }}
          aria-label="Поиск"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <line x1="20" y1="20" x2="16.5" y2="16.5" />
          </svg>
        </button>
        <button
          className="w-8 h-8 rounded-full bg-white flex items-center justify-center"
          style={{ boxShadow: CARD_SHADOW }}
          aria-label="Добавить"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
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
    <div className="grid gap-2.5" style={{ gridTemplateColumns: "1.5fr 1fr" }}>
      <div
        className="bg-white rounded-2xl px-3.5 py-3 flex flex-col"
        style={{ boxShadow: CARD_SHADOW }}
      >
        <p className="text-[12px] font-medium" style={{ color: "#8A8A8E" }}>Состав в сборе</p>
        <div className="flex items-baseline gap-0.5 mt-1">
          <span className="text-[44px] font-bold leading-none" style={{ color: "#2DB34A" }}>{active}</span>
          <span className="text-[22px] font-light leading-none" style={{ color: "#9A9A9E" }}>/ {target}</span>
        </div>
        <div className="mt-2.5">
          <div className="flex gap-[2px] h-[4px]">
            <div style={{ width: `${activePct}%`, backgroundColor: "#2DB34A" }} className="rounded-full" />
            <div style={{ width: `${doubtPct}%`, backgroundColor: "#F5A623" }} className="rounded-full" />
            {deficitPct > 0 && (
              <div style={{ width: `${deficitPct}%`, backgroundColor: "#E53935" }} className="rounded-full" />
            )}
          </div>
          <div className="flex items-center gap-2 mt-1.5 text-[9px] whitespace-nowrap" style={{ color: "#8A8A8E" }}>
            <LegendDot color="#2DB34A" label="активные" />
            <LegendDot color="#F5A623" label="под вопросом" />
            <LegendDot color="#E53935" label="дефицит" />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <MiniStat value={doubt} valueColor="#F5A623" label="под вопросом" />
        <MiniStat value={goalkeepers} valueColor="#E53935" label="вратарей" />
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className="inline-block w-1 h-1 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function MiniStat({ value, valueColor, label }: { value: number; valueColor: string; label: string }) {
  return (
    <div
      className="bg-white rounded-2xl px-3.5 py-2 flex-1 flex flex-col justify-center"
      style={{ boxShadow: CARD_SHADOW }}
    >
      <span className="text-[28px] font-bold leading-none" style={{ color: valueColor }}>{value}</span>
      <span className="text-[11px] mt-0.5" style={{ color: "#8A8A8E" }}>{label}</span>
    </div>
  );
}

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 px-3 h-7 rounded-full text-[12px] font-medium transition-colors"
      style={
        active
          ? { backgroundColor: "#2DB34A", color: "#FFFFFF" }
          : { backgroundColor: "#FFFFFF", color: "#1A1A1A", border: "1px solid #E5E5EA" }
      }
    >
      {label}
    </button>
  );
}

function PlayerSection({ title, count, players }: { title: string; count: number; players: Player[] }) {
  return (
    <section className="mt-4">
      <p
        className="text-[10px] font-bold uppercase mb-0.5 px-1"
        style={{ color: "#2DB34A", letterSpacing: "0.8px" }}
      >
        {title} <span style={{ color: "#9A9A9E", letterSpacing: "0.4px" }}>· {count}</span>
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
      className="flex items-center gap-2.5 py-2"
      style={{ borderBottom: isLast ? "none" : "1px solid #ECECEE" }}
    >
      <PlayerAvatar player={player} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <p className="text-[14px] font-semibold truncate" style={{ color: "#1A1A1A" }}>
            {player.name}
          </p>
          {player.captain && (
            <span
              className="inline-flex items-center justify-center w-[14px] h-[14px] rounded-full shrink-0"
              style={{ backgroundColor: "#2DB34A" }}
              aria-label="Капитан"
            >
              <span className="text-[8px] font-bold leading-none" style={{ color: "#FFFFFF" }}>C</span>
            </span>
          )}
        </div>
        <p className="text-[11px] mt-0.5 truncate" style={{ color: "#9A9A9E" }}>
          {player.position} · {player.role}
        </p>
      </div>

      <div className="flex items-end gap-[2px] shrink-0" aria-hidden="true">
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            style={{
              width: 3,
              height: 11,
              borderRadius: 1,
              backgroundColor: i < filled ? "#2DB34A" : "#E5E5EA",
            }}
          />
        ))}
      </div>

      <div
        className="rounded-md px-1.5 py-0.5 ml-1 shrink-0"
        style={{ backgroundColor: "#F0F0F2" }}
      >
        <span className="text-[11px] font-semibold tabular-nums" style={{ color: "#3A3A3C" }}>
          {player.rating}
        </span>
      </div>
    </li>
  );
}

function PlayerAvatar({ player }: { player: Player }) {
  const src = `https://i.pravatar.cc/72?img=${player.avatarSeed}`;
  return (
    <div
      className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center shrink-0 relative"
      style={{ backgroundColor: "#EAEAEC" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        width={36}
        height={36}
        className="w-full h-full object-cover"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = "none";
        }}
      />
      <span
        className="absolute inset-0 flex items-center justify-center text-[11px] font-medium pointer-events-none"
        style={{ color: "#7A7A7E", zIndex: -1 }}
      >
        {initials(player.name)}
      </span>
    </div>
  );
}
