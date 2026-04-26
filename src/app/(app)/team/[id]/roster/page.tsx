"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Player = {
  name: string;
  position: string;
  role: string;
  attended: number; // out of TRAINING_WINDOW last trainings
  isReserve?: boolean;
  captain?: boolean;
  avatarSeed: number;
};

type JoinRequest = {
  id: string;
  name: string;
  position: string;
  city: string;
  message?: string;
  avatarSeed: number;
};

const TRAINING_WINDOW = 5;
const CORE_THRESHOLD = 4;

const PLAYERS: Player[] = [
  { name: "Иван Петров", position: "ЦЗ", role: "Основной", attended: 5, avatarSeed: 11 },
  { name: "Максим Козлов", position: "НАП", role: "Капитан", attended: 5, captain: true, avatarSeed: 12 },
  { name: "Денис Орлов", position: "ЛЗ", role: "Основной", attended: 4, avatarSeed: 13 },
  { name: "Кирилл Смирнов", position: "ПЗ", role: "Основной", attended: 5, avatarSeed: 14 },
  { name: "Алексей Фёдоров", position: "ЦЗ", role: "Основной", attended: 4, avatarSeed: 15 },
  { name: "Павел Иванов", position: "НАП", role: "Основной", attended: 4, avatarSeed: 17 },
  { name: "Роман Сидоров", position: "ЛН", role: "Основной", attended: 5, avatarSeed: 18 },
  { name: "Артём Новиков", position: "ВРТ", role: "Основной", attended: 4, avatarSeed: 33 },
  { name: "Игорь Волков", position: "ПН", role: "Основной", attended: 4, avatarSeed: 51 },

  { name: "Сергей Морозов", position: "ЦП", role: "Травма", attended: 1, avatarSeed: 52 },
  { name: "Виктор Зайцев", position: "ПЗ", role: "Болен", attended: 0, avatarSeed: 53 },
  { name: "Дмитрий Лебедев", position: "НАП", role: "Под вопросом", attended: 2, avatarSeed: 54 },

  { name: "Андрей Козырев", position: "ЦЗ", role: "Запас", attended: 3, isReserve: true, avatarSeed: 55 },
  { name: "Николай Быков", position: "ЛЗ", role: "Запас", attended: 2, isReserve: true, avatarSeed: 56 },
  { name: "Тимур Ахметов", position: "ПН", role: "Запас", attended: 3, isReserve: true, avatarSeed: 57 },
  { name: "Евгений Крылов", position: "ЦП", role: "Запас", attended: 1, isReserve: true, avatarSeed: 58 },
  { name: "Олег Мельников", position: "НАП", role: "Запас", attended: 2, isReserve: true, avatarSeed: 59 },
  { name: "Пётр Соколов", position: "ЛН", role: "Запас", attended: 2, isReserve: true, avatarSeed: 60 },
  { name: "Василий Громов", position: "ВРТ", role: "Запас", attended: 1, isReserve: true, avatarSeed: 61 },
  { name: "Руслан Попов", position: "ПЗ", role: "Запас", attended: 3, isReserve: true, avatarSeed: 62 },
];

const PENDING_REQUESTS: JoinRequest[] = [
  {
    id: "req-1",
    name: "Глеб Антонов",
    position: "ЦП",
    city: "Москва · ЦАО",
    message: "Привет! Играю 5 лет, есть свободные вечера по вторникам и пятницам.",
    avatarSeed: 65,
  },
];

const GOALKEEPER_POS = "ВРТ";
const DEFENDER_POS = ["ЦЗ", "ЛЗ", "ПЗ"];
const MIDFIELDER_POS = ["ЦП"];
const FORWARD_POS = ["НАП", "ЛН", "ПН"];

type GroupKey = "core" | "doubt" | "reserve";

function groupOf(p: Player): GroupKey {
  if (p.isReserve) return "reserve";
  return p.attended >= CORE_THRESHOLD ? "core" : "doubt";
}

const SECTION_META: Record<GroupKey, { title: string; color: string }> = {
  core: { title: "ЯДРО", color: "#2DB34A" },
  doubt: { title: "ПОД ВОПРОСОМ", color: "#F5A623" },
  reserve: { title: "ЗАПАС", color: "#E53935" },
};

type FilterKey = "all" | "gk" | "def" | "mid" | "fwd";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Все" },
  { key: "gk", label: "Вратари" },
  { key: "def", label: "Защитники" },
  { key: "mid", label: "Полузащ." },
  { key: "fwd", label: "Нападающие" },
];

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
const AVATAR_FILTER = "saturate(0.78) contrast(0.97) brightness(1.02)";

type Modal = { type: "player"; player: Player } | { type: "requests" } | null;

export default function RosterPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [modal, setModal] = useState<Modal>(null);

  const visible = PLAYERS.filter((p) => matchesFilter(p, filter));
  const core = visible.filter((p) => groupOf(p) === "core");
  const doubt = visible.filter((p) => groupOf(p) === "doubt");
  const reserve = visible.filter((p) => groupOf(p) === "reserve");

  return (
    <div className="flex flex-1 flex-col min-h-screen" style={{ backgroundColor: "#F5F5F7" }}>
      <NavBar
        onBack={() => router.back()}
        onSearch={() => router.push("/players")}
        onRequests={() => setModal({ type: "requests" })}
        requestCount={PENDING_REQUESTS.length}
      />

      <div className="px-4 pb-4">
        <StatsGrid />

        <div className="mt-3 flex items-center justify-between gap-1">
          {FILTERS.map((f) => (
            <FilterPill
              key={f.key}
              label={f.label}
              active={filter === f.key}
              onClick={() => setFilter(f.key)}
            />
          ))}
        </div>

        {core.length > 0 && (
          <PlayerSection
            group="core"
            count={core.length}
            players={core}
            onPlayerClick={(p) => setModal({ type: "player", player: p })}
          />
        )}
        {doubt.length > 0 && (
          <PlayerSection
            group="doubt"
            count={doubt.length}
            players={doubt}
            onPlayerClick={(p) => setModal({ type: "player", player: p })}
          />
        )}
        {reserve.length > 0 && (
          <PlayerSection
            group="reserve"
            count={reserve.length}
            players={reserve}
            onPlayerClick={(p) => setModal({ type: "player", player: p })}
          />
        )}
      </div>

      {modal?.type === "player" && (
        <PlayerSheet player={modal.player} onClose={() => setModal(null)} />
      )}
      {modal?.type === "requests" && (
        <RequestsSheet
          requests={PENDING_REQUESTS}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

function NavBar({
  onBack,
  onSearch,
  onRequests,
  requestCount,
}: {
  onBack: () => void;
  onSearch: () => void;
  onRequests: () => void;
  requestCount: number;
}) {
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
          onClick={onSearch}
          className="w-8 h-8 rounded-full bg-white flex items-center justify-center"
          style={{ boxShadow: CARD_SHADOW }}
          aria-label="Найти игроков"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <line x1="20" y1="20" x2="16.5" y2="16.5" />
          </svg>
        </button>
        <button
          onClick={onRequests}
          className="w-8 h-8 rounded-full bg-white flex items-center justify-center relative"
          style={{ boxShadow: CARD_SHADOW }}
          aria-label="Заявки"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {requestCount > 0 && (
            <span
              className="absolute -top-1 -right-1 min-w-[16px] h-[16px] rounded-full flex items-center justify-center px-1"
              style={{ backgroundColor: "#E53935" }}
            >
              <span className="text-[10px] font-bold leading-none" style={{ color: "#FFFFFF" }}>
                {requestCount}
              </span>
            </span>
          )}
        </button>
      </div>
    </header>
  );
}

function StatsGrid() {
  const active = PLAYERS.filter((p) => groupOf(p) === "core").length;
  const doubt = PLAYERS.filter((p) => groupOf(p) === "doubt").length;
  const target = 12;
  const deficit = Math.max(0, target - active - doubt);
  const goalkeepers = PLAYERS.filter(
    (p) => p.position === GOALKEEPER_POS && !p.isReserve,
  ).length;

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
        <ProblemCard goalkeepers={goalkeepers} />
      </div>
    </div>
  );
}

function ProblemCard({ goalkeepers }: { goalkeepers: number }) {
  if (goalkeepers === 0) {
    return (
      <div
        className="bg-white rounded-2xl px-3.5 py-2 flex-1 flex flex-col justify-center"
        style={{ boxShadow: CARD_SHADOW }}
      >
        <span className="text-[28px] font-bold leading-none" style={{ color: "#E53935" }}>0</span>
        <span className="text-[11px] mt-0.5" style={{ color: "#8A8A8E" }}>вратарей</span>
      </div>
    );
  }
  return (
    <div
      className="bg-white rounded-2xl px-3.5 py-2 flex-1 flex flex-col justify-center"
      style={{ boxShadow: CARD_SHADOW }}
    >
      <div className="flex items-center gap-1.5">
        <span
          className="inline-flex items-center justify-center w-[22px] h-[22px] rounded-full"
          style={{ backgroundColor: "#E8F7EC" }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2DB34A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
        <span className="text-[14px] font-semibold leading-none" style={{ color: "#2DB34A" }}>
          Состав ОК
        </span>
      </div>
      <span className="text-[11px] mt-1" style={{ color: "#8A8A8E" }}>проблем нет</span>
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
      className="shrink-0 px-2.5 h-7 rounded-full text-[11px] font-medium transition-colors whitespace-nowrap"
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

function PlayerSection({
  group,
  count,
  players,
  onPlayerClick,
}: {
  group: GroupKey;
  count: number;
  players: Player[];
  onPlayerClick: (p: Player) => void;
}) {
  const meta = SECTION_META[group];
  return (
    <section className="mt-4">
      <p
        className="text-[10px] font-bold uppercase mb-0.5 px-1"
        style={{ color: meta.color, letterSpacing: "0.8px" }}
      >
        {meta.title} <span style={{ color: "#9A9A9E", letterSpacing: "0.4px" }}>· {count}</span>
      </p>
      <ul>
        {players.map((p, idx) => (
          <PlayerRow
            key={p.name}
            player={p}
            isLast={idx === players.length - 1}
            onClick={() => onPlayerClick(p)}
          />
        ))}
      </ul>
    </section>
  );
}

function PlayerRow({
  player,
  isLast,
  onClick,
}: {
  player: Player;
  isLast: boolean;
  onClick: () => void;
}) {
  const group = groupOf(player);
  const barColor = SECTION_META[group].color;

  return (
    <li style={{ borderBottom: isLast ? "none" : "1px solid #ECECEE" }}>
      <button
        onClick={onClick}
        className="w-full flex items-center gap-2.5 py-2 text-left active:bg-black/[0.03] transition-colors"
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
        <AttendanceBars
          attended={player.attended}
          total={TRAINING_WINDOW}
          color={barColor}
        />
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#C5C5C9"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </li>
  );
}

function AttendanceBars({
  attended,
  total,
  color,
}: {
  attended: number;
  total: number;
  color: string;
}) {
  return (
    <div
      className="flex items-end gap-[2px] shrink-0"
      aria-label={`Посещено ${attended} из ${total} событий`}
    >
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          style={{
            width: 3,
            height: 12,
            borderRadius: 1,
            backgroundColor: i < attended ? color : "#E5E5EA",
          }}
        />
      ))}
    </div>
  );
}

function PlayerAvatar({ player, size = 36 }: { player: Player; size?: number }) {
  const src = `https://i.pravatar.cc/${size * 2}?img=${player.avatarSeed}`;
  return (
    <div
      className="rounded-full overflow-hidden flex items-center justify-center shrink-0 relative"
      style={{ width: size, height: size, backgroundColor: "#EAEAEC" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        className="w-full h-full object-cover"
        style={{ filter: AVATAR_FILTER }}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = "none";
        }}
      />
      <span
        className="absolute inset-0 flex items-center justify-center font-medium pointer-events-none"
        style={{ color: "#7A7A7E", zIndex: -1, fontSize: Math.round(size / 3) }}
      >
        {initials(player.name)}
      </span>
    </div>
  );
}

function BottomSheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onEsc);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEsc);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-[480px] bg-white rounded-t-2xl pb-6"
        style={{ boxShadow: "0 -8px 24px rgba(0,0,0,0.12)" }}
      >
        <div className="flex justify-center pt-2 pb-1">
          <span className="block w-9 h-1 rounded-full" style={{ backgroundColor: "#D9D9DC" }} />
        </div>
        <div className="flex items-center justify-between px-4 pt-1 pb-3">
          <h2 className="text-[16px] font-bold" style={{ color: "#1A1A1A" }}>{title}</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "#F0F0F2" }}
            aria-label="Закрыть"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="px-4">{children}</div>
      </div>
    </div>
  );
}

function PlayerSheet({ player, onClose }: { player: Player; onClose: () => void }) {
  const group = groupOf(player);
  const meta = SECTION_META[group];

  return (
    <BottomSheet title="Карточка игрока" onClose={onClose}>
      <div className="flex items-center gap-3">
        <PlayerAvatar player={player} size={64} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-[18px] font-bold truncate" style={{ color: "#1A1A1A" }}>
              {player.name}
            </p>
            {player.captain && (
              <span
                className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full shrink-0"
                style={{ backgroundColor: "#2DB34A" }}
              >
                <span className="text-[10px] font-bold leading-none" style={{ color: "#FFFFFF" }}>C</span>
              </span>
            )}
          </div>
          <p className="text-[13px] mt-0.5" style={{ color: "#8A8A8E" }}>
            {player.position} · {player.role}
          </p>
          <span
            className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
            style={{
              backgroundColor: meta.color + "1A",
              color: meta.color,
              letterSpacing: "0.6px",
            }}
          >
            {meta.title}
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <StatBox label="Тренировок" value={`${player.attended} / ${TRAINING_WINDOW}`} />
        <StatBox label="Позиция" value={player.position} />
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <button
          className="w-full h-11 rounded-xl text-[14px] font-semibold"
          style={{ backgroundColor: "#2DB34A", color: "#FFFFFF" }}
        >
          Написать в Telegram
        </button>
        <button
          className="w-full h-11 rounded-xl text-[14px] font-semibold"
          style={{ backgroundColor: "#F0F0F2", color: "#1A1A1A" }}
        >
          Открыть профиль
        </button>
      </div>
    </BottomSheet>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl px-3 py-2.5" style={{ backgroundColor: "#F5F5F7" }}>
      <p className="text-[11px]" style={{ color: "#8A8A8E" }}>{label}</p>
      <p className="text-[15px] font-semibold mt-0.5" style={{ color: "#1A1A1A" }}>{value}</p>
    </div>
  );
}

function RequestsSheet({
  requests,
  onClose,
}: {
  requests: JoinRequest[];
  onClose: () => void;
}) {
  return (
    <BottomSheet title={`Заявки · ${requests.length}`} onClose={onClose}>
      {requests.length === 0 ? (
        <p className="text-[13px] py-6 text-center" style={{ color: "#8A8A8E" }}>
          Новых заявок нет
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {requests.map((r) => (
            <li
              key={r.id}
              className="rounded-xl p-3"
              style={{ backgroundColor: "#F5F5F7" }}
            >
              <div className="flex items-start gap-3">
                <PlayerAvatar
                  player={{
                    name: r.name,
                    position: r.position,
                    role: "",
                    attended: 0,
                    avatarSeed: r.avatarSeed,
                  }}
                  size={44}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold truncate" style={{ color: "#1A1A1A" }}>
                    {r.name}
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: "#9A9A9E" }}>
                    {r.position} · {r.city}
                  </p>
                  {r.message && (
                    <p className="text-[12px] mt-1.5" style={{ color: "#3A3A3C" }}>
                      {r.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  className="flex-1 h-9 rounded-lg text-[13px] font-semibold"
                  style={{ backgroundColor: "#2DB34A", color: "#FFFFFF" }}
                >
                  Принять
                </button>
                <button
                  className="flex-1 h-9 rounded-lg text-[13px] font-semibold"
                  style={{ backgroundColor: "#FFFFFF", color: "#1A1A1A", border: "1px solid #E5E5EA" }}
                >
                  Отклонить
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </BottomSheet>
  );
}
