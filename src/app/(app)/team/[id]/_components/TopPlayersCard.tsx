import { Eyebrow, firstName, initial } from "./atoms";
import type { Insights } from "./types";

export function TopPlayersCard({
  insights,
  onPlayerClick,
}: {
  insights: Insights | null | undefined;
  onPlayerClick: (id: string) => void;
}) {
  if (insights === undefined) {
    return (
      <div
        className="rounded-[16px] h-[148px] animate-pulse"
        style={{ background: "var(--bg-card)" }}
      />
    );
  }
  if (!insights || insights.topPlayers.length === 0) return null;

  return (
    <div
      className="rounded-[16px] p-4"
      style={{ background: "var(--bg-primary)" }}
    >
      <Eyebrow>Лидеры по посещаемости · 30 дней</Eyebrow>
      <div className="grid grid-cols-3 gap-2 mt-3">
        {insights.topPlayers.map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onPlayerClick(p.id)}
            className="flex flex-col items-center text-center gap-2 rounded-[12px] p-2 transition-colors active:bg-bg-card"
          >
            <div className="relative">
              {p.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.avatarUrl}
                  alt={p.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{
                    background: "var(--green-50)",
                    color: "var(--green-700)",
                  }}
                >
                  <span className="text-[16px] font-bold">
                    {initial(p.name)}
                  </span>
                </div>
              )}
              <span
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center"
                style={{
                  background:
                    i === 0
                      ? "var(--green-500)"
                      : i === 1
                        ? "var(--gray-400)"
                        : "var(--gray-300)",
                  color: "white",
                }}
              >
                {i + 1}
              </span>
            </div>
            <p
              className="text-[12px] font-semibold leading-tight truncate w-full"
              style={{ color: "var(--text-primary)" }}
            >
              {firstName(p.name)}
            </p>
            <p
              className="text-[11px] tabular-nums"
              style={{ color: "var(--text-tertiary)" }}
            >
              {p.played} матчей · {p.attendancePct}%
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
