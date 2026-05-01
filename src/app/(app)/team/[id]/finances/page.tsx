"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useTeam, type TeamMember } from "../team-context";
import { TeamPlayerSheet } from "@/components/team/lazy";
import { SkeletonCard } from "@/components/Skeleton";
import { DebtorsList } from "./_components/DebtorsList";
import { DepositCard } from "./_components/DepositCard";
import { DepositModal } from "./_components/DepositModal";
import { FinancesHero } from "./_components/FinancesHero";
import { FlowChart } from "./_components/FlowChart";
import { MarginBar } from "./_components/MarginBar";
import { MetricsBreakdown } from "./_components/MetricsBreakdown";
import { VenuesAccordion } from "./_components/VenuesAccordion";
import type {
  FinancesData,
  InsightsFinance,
  Member,
} from "./_components/types";

export default function TeamFinancesPage() {
  const team = useTeam();
  const auth = useAuth();
  const [data, setData] = useState<FinancesData | null>(null);
  const [insights, setInsights] = useState<InsightsFinance | null>(null);
  const [openMember, setOpenMember] = useState<TeamMember | null>(null);
  const [showDeposit, setShowDeposit] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = auth.status === "authenticated" ? auth.user.id : null;
  const teamId = team.status === "ready" ? team.team.id : null;
  const teamMembers = team.status === "ready" ? team.members : [];

  const members = useMemo<Member[]>(
    () => teamMembers.map((m) => ({ user_id: m.user.id, name: m.user.name })),
    [teamMembers],
  );

  const load = () => {
    if (!teamId || !userId) return;
    Promise.all([
      fetch(`/api/teams/${teamId}/finances?userId=${userId}`).then(async (r) => {
        if (!r.ok) {
          setError("Доступ запрещён");
          return null;
        }
        return r.json() as Promise<FinancesData>;
      }),
      fetch(`/api/teams/${teamId}/insights?userId=${userId}`).then((r) =>
        r.ok ? (r.json() as Promise<InsightsFinance>) : null,
      ),
    ])
      .then(([fin, ins]) => {
        if (fin) setData(fin);
        if (ins) setInsights(ins);
      })
      .catch(() => setError("Не удалось загрузить"));
  };

  useEffect(() => {
    load();
  }, [teamId, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (team.status === "loading" || data === null) {
    return error ? (
      <div className="bg-bg-primary rounded-[16px] p-4 shadow-sm">
        <p className="text-[15px] text-text-secondary text-center">{error}</p>
      </div>
    ) : (
      <div className="flex flex-col gap-3">
        <SkeletonCard className="h-32" />
        <SkeletonCard className="h-20" />
        <SkeletonCard className="h-28" />
      </div>
    );
  }

  if (team.status !== "ready" || team.role !== "organizer") return null;

  const m = data.metrics;

  const openPlayer = (uid: string) => {
    const found = teamMembers.find((tm) => tm.user.id === uid);
    if (found) setOpenMember(found);
  };

  return (
    <>
      <div className="flex flex-col gap-3">
        <FinancesHero metrics={m} />

        <MetricsBreakdown
          collected={m.collected}
          venueCost={m.venueCostTotal}
        />

        {insights?.financeFlowByMonth &&
          insights.financeFlowByMonth.length > 0 && (
            <FlowChart data={insights.financeFlowByMonth} />
          )}

        {(m.collected > 0 || m.venuePaidTotal > 0) && (
          <MarginBar collected={m.collected} venuePaid={m.venuePaidTotal} />
        )}

        <DebtorsList
          title="Должны"
          entries={data.debtors}
          variant="debtor"
          onOpen={openPlayer}
        />

        <DebtorsList
          title="Переплатили"
          entries={data.creditors}
          variant="creditor"
          onOpen={openPlayer}
        />

        {data.venueEvents.length > 0 && teamId && (
          <VenuesAccordion teamId={teamId} events={data.venueEvents} />
        )}

        <DepositCard onClick={() => setShowDeposit(true)} />
      </div>

      {teamId && userId && openMember && (
        <TeamPlayerSheet
          member={openMember}
          teamId={teamId}
          currentUserId={userId}
          isOrganizer={true}
          initialSection="finances"
          onClose={() => setOpenMember(null)}
          onActionDone={() => {
            setOpenMember(null);
            load();
          }}
        />
      )}

      {showDeposit && teamId && userId && (
        <DepositModal
          teamId={teamId}
          organizerId={userId}
          members={members}
          onClose={() => setShowDeposit(false)}
          onSuccess={() => {
            setShowDeposit(false);
            load();
          }}
        />
      )}
    </>
  );
}
