import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/Button";
import { BottomActionBar } from "@/components/ui/BottomActionBar";
import { useTeam } from "../team-context";

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
      <BottomActionBar>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" disabled>
            Заявка отправлена
          </Button>
          <Button
            variant="secondary"
            loading={busy}
            disabled={busy}
            onClick={handleWithdraw}
          >
            Отозвать
          </Button>
        </div>
      </BottomActionBar>
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
        <BottomActionBar>
          <Button variant="secondary" className="w-full" disabled>
            Можно подать снова через {cooldown}{" "}
            {cooldown === 1 ? "день" : cooldown < 5 ? "дня" : "дней"}
          </Button>
        </BottomActionBar>
      );
    }
    return (
      <BottomActionBar>
        <Button
          variant="primary"
          className="w-full"
          loading={busy}
          onClick={handleJoin}
        >
          Подать заявку снова
        </Button>
      </BottomActionBar>
    );
  }

  return (
    <BottomActionBar>
      <Button
        variant="primary"
        className="w-full"
        loading={busy}
        onClick={handleJoin}
      >
        Подать заявку
      </Button>
    </BottomActionBar>
  );
}
