"use client";

import Link from "next/link";
import { Avatar, MiniBar } from "@/components/ui";
import { reliabilityToBars } from "./reliabilityToBars";

type Props = {
  id: string;
  name: string;
  avatarUrl?: string | null;
  position?: string | null;
  city?: string | null;
  district?: string | null;
  lookingForTeam?: boolean;
  reliability?: number | null;
  played?: number;
};

export function PlayerListRow({
  id,
  name,
  avatarUrl,
  position,
  city,
  district,
  lookingForTeam,
  reliability,
  played = 0,
}: Props) {
  const subtitle = [position, district || city].filter(Boolean).join(" · ");
  const bars = reliabilityToBars(reliability ?? null, played);

  return (
    <Link
      href={`/players/${id}`}
      className="flex items-center gap-3.5 py-3 last:border-b-0 transition-colors active:bg-bg-secondary"
      style={{ borderBottom: "1px solid var(--gray-100)" }}
    >
      <Avatar src={avatarUrl} name={name} size="md" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span
            className="text-[15px] font-semibold truncate"
            style={{ color: "var(--text-primary)" }}
          >
            {name}
          </span>
          {lookingForTeam && <SeekingBadge />}
        </div>
        {subtitle && (
          <p
            className="text-[13px] truncate mt-0.5"
            style={{ color: "var(--text-secondary)" }}
          >
            {subtitle}
          </p>
        )}
      </div>
      <div
        className="shrink-0"
        aria-label={
          bars === 0
            ? "Надёжность: нет данных"
            : `Надёжность ${reliability ?? 0}%`
        }
      >
        {bars === 0 ? (
          <span
            className="text-[13px] font-semibold"
            style={{ color: "var(--text-tertiary)" }}
          >
            —
          </span>
        ) : (
          <MiniBar value={bars} max={5} />
        )}
      </div>
    </Link>
  );
}

function SeekingBadge() {
  return (
    <span
      className="text-[10px] font-semibold rounded-full px-1.5 py-0.5 shrink-0"
      style={{ background: "var(--green-50)", color: "var(--green-700)" }}
    >
      Ищет команду
    </span>
  );
}
