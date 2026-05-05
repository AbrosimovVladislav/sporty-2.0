"use client";

import Link from "next/link";
import Image from "next/image";
import { PositionTag, RatingRing } from "@/components/ui";
import { positionCode, teamFallbackHue } from "@/lib/playerBadges";
import { ratingTier, type RatingTier } from "@/lib/ratingTier";
import type { User } from "@/types/database";
import type { ProfileTeam } from "./types";
import { Card, Eyebrow } from "./atoms";

type Props = {
  user: User;
  teams: ProfileTeam[] | null;
  stats: { playedCount: number; reliability: number | null } | null | undefined;
};

const TIER_LABEL: Record<RatingTier, string> = {
  elite: "Элитный",
  high: "Продвинутый",
  mid: "Средний",
  low: "Любитель",
  poor: "Новичок",
};

export function AboutTab({ user, teams, stats }: Props) {
  const age = user.birth_date ? calcAge(user.birth_date) : null;
  const tier = ratingTier(user.rating);
  const positions = (user.position ?? [])
    .map((p) => positionCode(p))
    .filter((c): c is NonNullable<ReturnType<typeof positionCode>> => c != null);

  const tierLabel = tier ? TIER_LABEL[tier] : "Без рейтинга";

  const playedCount = stats?.playedCount ?? 0;
  const reliabilityText =
    stats?.reliability != null ? `${stats.reliability}%` : "—";
  const teamsCount = teams?.length ?? 0;

  return (
    <>
      <Card className="p-4 flex items-center gap-4">
        <RatingRing rating={user.rating} size={80} />
        <div className="min-w-0 flex-1">
          <Eyebrow>Рейтинг</Eyebrow>
          <p
            className="text-[18px] font-bold leading-[1.2] mt-1"
            style={{ color: "var(--ink-900)" }}
          >
            {tierLabel}
          </p>
          {positions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {positions.map((p) => (
                <PositionTag key={p} code={p} />
              ))}
            </div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <StatCell value={playedCount} label="Сыграно" />
        <StatCell value={reliabilityText} label="Надёжность" tone="primary" />
        <StatCell value={teamsCount} label="Команд" />
      </div>

      {age !== null && (
        <Card className="overflow-hidden">
          <InfoRow label="Возраст" value={`${age} лет`} isLast />
        </Card>
      )}

      {teams && teams.length > 0 && (
        <Card className="overflow-hidden">
          <Eyebrow className="px-4 pt-3.5 pb-1.5">Команды</Eyebrow>
          {teams.map((t, i) => (
            <Link
              key={t.id}
              href={`/team/${t.id}`}
              className="flex items-center gap-3 px-4 pb-3.5 active:opacity-70"
              style={{
                paddingTop: i === 0 ? 6 : 14,
                borderTop:
                  i === 0 ? undefined : "1px solid var(--ink-100)",
              }}
            >
              <TeamLogo team={t} />
              <span
                className="flex-1 min-w-0 text-[16px] font-semibold truncate"
                style={{ color: "var(--ink-900)" }}
              >
                {t.name}
              </span>
              <ChevronRight />
            </Link>
          ))}
        </Card>
      )}
    </>
  );
}

function StatCell({
  value,
  label,
  tone = "default",
}: {
  value: string | number;
  label: string;
  tone?: "default" | "primary";
}) {
  const valueColor =
    tone === "primary" ? "var(--green-700)" : "var(--ink-900)";
  return (
    <Card className="px-4 py-3.5 text-center">
      <p
        className="font-display text-[28px] font-bold leading-none tabular-nums"
        style={{ color: valueColor }}
      >
        {value}
      </p>
      <p
        className="text-[11px] mt-1"
        style={{ color: "var(--ink-500)" }}
      >
        {label}
      </p>
    </Card>
  );
}

function InfoRow({
  label,
  value,
  isLast,
}: {
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3"
      style={{
        borderBottom: isLast ? undefined : "1px solid var(--ink-100)",
      }}
    >
      <span
        className="text-[14px]"
        style={{ color: "var(--ink-500)" }}
      >
        {label}
      </span>
      <span
        className="text-[14px] font-semibold"
        style={{ color: "var(--ink-900)" }}
      >
        {value}
      </span>
    </div>
  );
}

function TeamLogo({ team }: { team: ProfileTeam }) {
  const initial = team.name.trim().charAt(0).toUpperCase() || "?";

  if (team.logo_url) {
    return (
      <span
        className="inline-block rounded-[12px] overflow-hidden bg-white shrink-0"
        style={{ width: 40, height: 40 }}
      >
        <Image
          src={team.logo_url}
          alt={team.name}
          width={40}
          height={40}
          className="w-full h-full object-cover"
        />
      </span>
    );
  }

  const hue = teamFallbackHue(team.id);
  return (
    <span
      className="inline-flex items-center justify-center rounded-[12px] text-white font-display font-extrabold shrink-0"
      style={{
        width: 40,
        height: 40,
        background: `oklch(0.55 0.15 ${hue})`,
        fontSize: 16,
        lineHeight: 1,
      }}
    >
      {initial}
    </span>
  );
}

function ChevronRight() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--ink-400)"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="shrink-0"
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

function calcAge(birthDate: string): number | null {
  const d = new Date(birthDate);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  if (
    now.getMonth() < d.getMonth() ||
    (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())
  )
    age--;
  return age;
}
