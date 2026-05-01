export type Insights = {
  nextEvent: {
    id: string;
    type: string;
    date: string;
    pricePerPlayer: number;
    venue: { id: string; name: string; photoUrl: string | null } | null;
    yesCount: number;
    totalMembers: number;
  } | null;
  activity: {
    eventsByWeek: { weekStart: string; count: number }[];
    eventsCount: number;
    eventsCountPrev: number;
    attendanceAvg: number;
    attendancePrevAvg: number;
  };
  topPlayers: {
    id: string;
    name: string;
    avatarUrl: string | null;
    played: number;
    attendancePct: number;
  }[];
  finance30d: {
    collected: number;
    venuePaid: number;
    netDelta: number;
    prevNetDelta: number;
  } | null;
};
