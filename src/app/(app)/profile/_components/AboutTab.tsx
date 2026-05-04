"use client";

import Link from "next/link";
import Image from "next/image";
import { LevelBadge, PositionBadge, RatingCircle } from "@/components/players/badges";
import {
  levelFromRating,
  levelName,
  positionCode,
  teamFallbackHue,
  type PositionCode,
} from "@/lib/playerBadges";
import type { User } from "@/types/database";
import type { ProfileTeam } from "./types";
import { Card, Eyebrow } from "./atoms";

type Props = {
  user: User;
  districtName: string | null;
  teams: ProfileTeam[] | null;
  stats: { playedCount: number; reliability: number | null } | null | undefined;
};

export function AboutTab({ user, districtName, teams, stats }: Props) {
  const age = user.birth_date ? calcAge(user.birth_date) : null;
  const lvl = levelFromRating(user.rating);
  const positions = (user.position ?? [])
    .map(positionCode)
    .filter((c): c is PositionCode => c !== null);

  const ratingValue = user.rating != null ? String(user.rating) : "—";
  const lvlText = lvl ? levelName(lvl) : "—";

  const playedCount = stats?.playedCount ?? 0;
  const reliabilityText =
    stats?.reliability != null ? `${stats.reliability}%` : "—";
  const teamsCount = teams?.length ?? 0;

  return (
    <>
      <div className="flex gap-3">
        <Card className="flex-1 p-4 flex items-center gap-3.5">
          <RatingCircle rating={user.rating} level={lvl} size={56} />
          <div className="min-w-0">
            <Eyebrow>Рейтинг</Eyebrow>
            <p
              className="font-display text-[28px] font-bold leading-[1.1] tabular-nums"
              style={{ color: "var(--text-primary)" }}
            >
              {ratingValue}
            </p>
          </div>
        </Card>
        <Card className="flex-1 p-4 flex items-center gap-3.5">
          <LevelBadge code={lvl} size="large" />
          <div className="min-w-0">
            <Eyebrow>Уровень</Eyebrow>
            <p
              className="text-[17px] font-bold leading-[1.2]"
              style={{ color: "var(--text-primary)" }}
            >
              {lvlText}
            </p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCell value={playedCount} label="Сыграно" />
        <StatCell value={reliabilityText} label="Надёжность" tone="primary" />
        <StatCell value={teamsCount} label="Команд" />
      </div>

      {positions.length > 0 && (
        <Card className="p-4">
          <Eyebrow className="mb-2.5">На поле</Eyebrow>
          <div className="flex flex-wrap gap-2.5">
            {positions.map((p) => (
              <PositionBadge key={p} code={p} />
            ))}
          </div>
        </Card>
      )}

      {(age !== null || user.city || districtName) && (
        <Card className="overflow-hidden">
          {age !== null && <InfoRow label="Возраст" value={`${age} лет`} />}
          {user.city && <InfoRow label="Город" value={user.city} />}
          {districtName && (
            <InfoRow label="Район" value={districtName} isLast />
          )}
        </Card>
      )}

      {teams && teams.length > 0 && (
        <Card className="overflow-hidden">
          <Eyebrow className="px-4 pt-3.5 pb-1.5">Команда</Eyebrow>
          {teams.map((t, i) => (
            <Link
              key={t.id}
              href={`/team/${t.id}`}
              className="flex items-center gap-3 px-4 pb-3.5 active:opacity-70"
              style={{
                paddingTop: i === 0 ? 6 : 14,
                borderTop:
                  i === 0 ? undefined : "1px solid var(--gray-100)",
              }}
            >
              <TeamLogo team={t} />
              <span
                className="flex-1 min-w-0 text-[15px] font-semibold truncate"
                style={{ color: "var(--text-primary)" }}
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
    tone === "primary" ? "var(--primary)" : "var(--text-primary)";
  return (
    <Card className="px-4 py-3.5 text-center">
      <p
        className="font-display text-[28px] font-bold leading-none tabular-nums"
        style={{ color: valueColor }}
      >
        {value}
      </p>
      <p
        className="text-[11px] mt-0.5"
        style={{ color: "var(--text-secondary)" }}
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
        borderBottom: isLast ? undefined : "1px solid var(--gray-100)",
      }}
    >
      <span
        className="text-[14px]"
        style={{ color: "var(--text-secondary)" }}
      >
        {label}
      </span>
      <span
        className="text-[14px] font-semibold"
        style={{ color: "var(--text-primary)" }}
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
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--text-tertiary)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="9 18 15 12 9 6" />
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
