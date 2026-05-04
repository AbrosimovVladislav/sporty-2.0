import { ReactNode, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/Button";
import { useTeam } from "../team-context";

const BAR_HEIGHT = 64;
const NAV_OFFSET_PX = 88;

function FloatingBar({ children }: { children: ReactNode }) {
  return (
    <>
      <div aria-hidden style={{ height: BAR_HEIGHT }} />
      <div
        className="fixed left-0 right-0 bg-background-card border-t border-border px-4 py-3 shadow-pop z-30"
        style={{
          bottom: `calc(${NAV_OFFSET_PX}px + env(safe-area-inset-bottom, 0px))`,
        }}
      >
        {children}
      </div>
    </>
  );
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
      <FloatingBar>
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
      </FloatingBar>
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
        <FloatingBar>
          <Button variant="secondary" className="w-full" disabled>
            Можно подать снова через {cooldown}{" "}
            {cooldown === 1 ? "день" : cooldown < 5 ? "дня" : "дней"}
          </Button>
        </FloatingBar>
      );
    }
    return (
      <FloatingBar>
        <Button
          variant="primary"
          className="w-full"
          loading={busy}
          onClick={handleJoin}
        >
          Подать заявку снова
        </Button>
      </FloatingBar>
    );
  }

  return (
    <FloatingBar>
      <Button
        variant="primary"
        className="w-full"
        loading={busy}
        onClick={handleJoin}
      >
        Подать заявку
      </Button>
    </FloatingBar>
  );
}
