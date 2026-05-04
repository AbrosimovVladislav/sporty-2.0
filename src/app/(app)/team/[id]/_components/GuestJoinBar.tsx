import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/Button";
import { useTeam } from "../team-context";

function pluralDays(n: number): string {
  if (n === 1) return "день";
  if (n < 5) return "дня";
  return "дней";
}

export function GuestJoinBar({ teamId }: { teamId: string }) {
  const team = useTeam();
  const auth = useAuth();
  const [busy, setBusy] = useState(false);

  if (team.status !== "ready") return null;

  const userId = auth.status === "authenticated" ? auth.user.id : null;
  const {
    joinRequestStatus,
    joinRequestId,
    joinRequestCooldownUntil,
    reload,
  } = team;

  async function handleJoin() {
    if (!userId || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) reload();
    } finally {
      setBusy(false);
    }
  }

  async function handleWithdraw() {
    if (!userId || !joinRequestId || busy) return;
    setBusy(true);
    try {
      const res = await fetch(
        `/api/join-requests/${joinRequestId}?userId=${userId}`,
        { method: "DELETE" },
      );
      if (res.ok) reload();
    } finally {
      setBusy(false);
    }
  }

  if (joinRequestStatus === "pending") {
    return (
      <div
        className="flex items-center justify-between gap-3 rounded-[16px] px-4 py-3"
        style={{ background: "var(--bg-card)" }}
      >
        <span
          className="text-[14px] font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          Заявка на вступление отправлена
        </span>
        <button
          type="button"
          onClick={handleWithdraw}
          disabled={busy}
          className="text-[13px] font-semibold disabled:opacity-50"
          style={{ color: "var(--text-accent)" }}
        >
          Отозвать
        </button>
      </div>
    );
  }

  if (joinRequestStatus === "rejected") {
    const cooldown = joinRequestCooldownUntil
      ? Math.max(
          0,
          Math.ceil(
            (new Date(joinRequestCooldownUntil).getTime() - Date.now()) /
              86400000,
          ),
        )
      : 0;

    if (cooldown > 0) {
      return (
        <div
          className="rounded-[16px] px-4 py-3 text-center text-[14px]"
          style={{
            background: "var(--bg-card)",
            color: "var(--text-secondary)",
          }}
        >
          Подать заявку снова можно через {cooldown} {pluralDays(cooldown)}
        </div>
      );
    }
    return (
      <Button
        variant="primary"
        className="w-full"
        loading={busy}
        onClick={handleJoin}
      >
        Подать заявку снова
      </Button>
    );
  }

  return (
    <Button
      variant="primary"
      className="w-full"
      loading={busy}
      onClick={handleJoin}
    >
      Вступить в команду
    </Button>
  );
}
