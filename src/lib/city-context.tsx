"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";

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
    if (auth.status === "authenticated" && auth.user.city) {
      _setActiveCity(auth.user.city);
    }
  }, [auth.status]); // eslint-disable-line react-hooks/exhaustive-deps

  const setActiveCity = useCallback((city: string) => {
    _setActiveCity(city);
    if (auth.status === "authenticated") {
      fetch(`/api/users/${auth.user.id}/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city, district_id: null }),
      }).catch(() => {});
    }
  }, [auth]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <CityContext.Provider value={{ activeCity, setActiveCity }}>
      {children}
    </CityContext.Provider>
  );
}

export function useCity() {
  return useContext(CityContext);
}
