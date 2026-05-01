"use client";

export function AchievementsTab() {
  const placeholders = [
    { id: "first", label: "Первый матч", emoji: "🏅" },
    { id: "streak", label: "5 матчей подряд", emoji: "🔥" },
    { id: "captain", label: "Капитан", emoji: "🎖" },
    { id: "mvp", label: "MVP события", emoji: "⭐" },
    { id: "punctual", label: "100% явка", emoji: "✅" },
    { id: "veteran", label: "50 матчей", emoji: "🏆" },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div
        className="rounded-[16px] p-5 text-center"
        style={{ background: "var(--bg-primary)" }}
      >
        <p
          className="text-[15px] font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Достижения копятся с каждым матчем
        </p>
        <p
          className="text-[13px] mt-1"
          style={{ color: "var(--text-secondary)" }}
        >
          Скоро появятся первые значки за активность и стабильность
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {placeholders.map((p) => (
          <div
            key={p.id}
            className="rounded-[16px] p-3 flex flex-col items-center text-center"
            style={{ background: "var(--bg-primary)" }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-[20px] grayscale opacity-40"
              style={{ background: "var(--bg-card)" }}
            >
              {p.emoji}
            </div>
            <p
              className="text-[11px] font-semibold mt-2 leading-tight"
              style={{ color: "var(--text-tertiary)" }}
            >
              {p.label}
            </p>
            <p
              className="text-[10px] mt-0.5"
              style={{ color: "var(--text-tertiary)" }}
            >
              скоро
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
