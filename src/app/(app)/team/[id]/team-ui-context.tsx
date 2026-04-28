"use client";

import { createContext, useContext } from "react";

type TeamUI = {
  openRequests: () => void;
};

const TeamUIContext = createContext<TeamUI>({ openRequests: () => {} });

export const TeamUIProvider = TeamUIContext.Provider;

export function useTeamUI() {
  return useContext(TeamUIContext);
}
