"use client";

import { createContext, useContext, useReducer, type ReactNode } from "react";

type OnboardingState = {
  name: string;
  birthDate: string;
  skillLevel: string;
  districtId: string;
  position: string;
};

type Action =
  | { type: "SET_NAME"; value: string }
  | { type: "SET_BIRTH_DATE"; value: string }
  | { type: "SET_SKILL_LEVEL"; value: string }
  | { type: "SET_DISTRICT_ID"; value: string }
  | { type: "SET_POSITION"; value: string };

function reducer(state: OnboardingState, action: Action): OnboardingState {
  switch (action.type) {
    case "SET_NAME": return { ...state, name: action.value };
    case "SET_BIRTH_DATE": return { ...state, birthDate: action.value };
    case "SET_SKILL_LEVEL": return { ...state, skillLevel: action.value };
    case "SET_DISTRICT_ID": return { ...state, districtId: action.value };
    case "SET_POSITION": return { ...state, position: action.value };
  }
}

const initial: OnboardingState = {
  name: "",
  birthDate: "",
  skillLevel: "",
  districtId: "",
  position: "",
};

type ContextValue = {
  state: OnboardingState;
  dispatch: React.Dispatch<Action>;
};

const OnboardingContext = createContext<ContextValue | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);
  return (
    <OnboardingContext.Provider value={{ state, dispatch }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error("useOnboarding must be used within OnboardingProvider");
  return ctx;
}
