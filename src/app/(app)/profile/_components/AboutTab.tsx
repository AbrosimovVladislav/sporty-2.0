"use client";

import { useState } from "react";
import Link from "next/link";
import { PositionChipList } from "@/components/PositionChip";
import type { User } from "@/types/database";
import { Eyebrow, StatTile } from "./atoms";

export function AboutTab({ user }: { user: User }) {
  const [bioExpanded, setBioExpanded] = useState(false);
  const age = user.birth_date ? calcAge(user.birth_date) : null;
  const positionChips = user.position ?? [];
  const isEmpty =
    !user.bio &&
    !user.skill_level &&
    positionChips.length === 0 &&
    age === null;

  if (isEmpty) {
    return (
      <div
        className="flex flex-col items-center justify-center text-center rounded-[16px] p-8"
        style={{ background: "var(--bg-primary)" }}
      >
        <p className="text-[15px]" style={{ color: "var(--text-secondary)" }}>
          Профиль ещё не заполнен
        </p>
        <Link
          href="/profile/settings"
          className="text-[14px] font-semibold mt-3"
          style={{ color: "var(--green-600)" }}
        >
          Заполнить профиль →
        </Link>
      </div>
    );
  }

  const isLong = (user.bio?.length ?? 0) > 120;
  const displayBio =
    !bioExpanded && isLong ? user.bio!.slice(0, 120) + "…" : user.bio;

  return (
    <div className="flex flex-col gap-3">
      {user.bio && (
        <div
          className="rounded-[16px] p-4"
          style={{ background: "var(--bg-primary)" }}
        >
          <Eyebrow>Био</Eyebrow>
          <p
            className="text-[15px] leading-relaxed mt-2"
            style={{ color: "var(--text-primary)" }}
          >
            {displayBio}
          </p>
          {isLong && (
            <button
              type="button"
              onClick={() => setBioExpanded((v) => !v)}
              className="text-[14px] font-semibold mt-2"
              style={{ color: "var(--green-600)" }}
            >
              {bioExpanded ? "Скрыть" : "Ещё"}
            </button>
          )}
        </div>
      )}

      {(user.skill_level || age !== null) && (
        <div className="grid grid-cols-2 gap-3">
          {user.skill_level && (
            <StatTile label="Уровень" value={user.skill_level} />
          )}
          {age !== null && <StatTile label="Возраст" value={`${age} лет`} />}
        </div>
      )}

      {positionChips.length > 0 && (
        <div
          className="rounded-[16px] p-4"
          style={{ background: "var(--bg-primary)" }}
        >
          <Eyebrow>На поле</Eyebrow>
          <div className="mt-2">
            <PositionChipList positions={positionChips} />
          </div>
        </div>
      )}
    </div>
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
