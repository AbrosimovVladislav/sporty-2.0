"use client";

import { Card } from "./atoms";

const AWARDS = [
  { id: "first", icon: "🥇", label: "Первый матч" },
  { id: "streak", icon: "🔥", label: "5 матчей подряд" },
  { id: "captain", icon: "🏅", label: "Капитан" },
  { id: "mvp", icon: "⭐", label: "MVP события" },
  { id: "punctual", icon: "☑️", label: "100% явка" },
  { id: "veteran", icon: "🏆", label: "50 матчей" },
];

export function AchievementsTab() {
  return (
    <>
      <Card className="px-5 py-6 text-center">
        <p
          className="text-[16px] font-bold mb-1.5"
          style={{ color: "var(--ink-900)" }}
        >
          Достижения копятся с каждым матчем
        </p>
        <p
          className="text-[14px] leading-normal"
          style={{ color: "var(--ink-500)" }}
        >
          Скоро появятся первые значки за активность и стабильность
        </p>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        {AWARDS.map((a) => (
          <Card
            key={a.id}
            className="text-center"
            style={{
              padding: "18px 8px 14px",
              opacity: 0.45,
            }}
          >
            <p
              className="text-[32px] mb-2 leading-none"
              style={{ filter: "grayscale(1)" }}
            >
              {a.icon}
            </p>
            <p
              className="text-[13px] font-semibold leading-tight"
              style={{ color: "var(--ink-900)" }}
            >
              {a.label}
            </p>
            <p
              className="text-[11px] mt-1"
              style={{ color: "var(--ink-400)" }}
            >
              скоро
            </p>
          </Card>
        ))}
      </div>
    </>
  );
}
