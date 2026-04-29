"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";

const STORAGE_KEY = "sporty_active_city";
const DEFAULT_CITY = "Алматы";

export const KZ_CITIES = [
  "Алматы",
  "Астана",
  "Шымкент",
  "Актобе",
  "Атырау",
  "Актау",
  "Павлодар",
  "Семей",
  "Тараз",
  "Костанай",
];

type CityContextValue = {
  activeCity: string;
  setActiveCity: (city: string) => void;
};

const CityContext = createContext<CityContextValue>({
  activeCity: DEFAULT_CITY,
  setActiveCity: () => {},
});

export function CityProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const [activeCity, _setActiveCity] = useState<string>(DEFAULT_CITY);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      _setActiveCity(stored);
    } else if (auth.status === "authenticated" && auth.user.city) {
      _setActiveCity(auth.user.city);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.status]);

  const setActiveCity = useCallback((city: string) => {
    _setActiveCity(city);
    localStorage.setItem(STORAGE_KEY, city);
  }, []);

  return (
    <CityContext.Provider value={{ activeCity, setActiveCity }}>
      {children}
    </CityContext.Provider>
  );
}

export function useCity() {
  return useContext(CityContext);
}
