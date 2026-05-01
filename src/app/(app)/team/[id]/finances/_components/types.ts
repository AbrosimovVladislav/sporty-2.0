export type FinancesData = {
  metrics: {
    collected: number;
    expected: number;
    venueCostTotal: number;
    venuePaidTotal: number;
    venueOutstanding: number;
    playersDebt: number;
    playersOverpaid: number;
    cash: number;
    realBalance: number;
  };
  debtors: { userId: string; name: string; amount: number }[];
  creditors: { userId: string; name: string; amount: number }[];
  venueEvents: {
    eventId: string;
    type: string;
    date: string;
    venueName: string | null;
    cost: number;
    paid: number;
  }[];
};

export type FlowMonth = {
  month: string;
  collected: number;
  venuePaid: number;
};

export type InsightsFinance = {
  financeFlowByMonth: FlowMonth[] | null;
};

export type Member = { user_id: string; name: string };
