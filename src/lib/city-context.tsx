"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
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

  const userId = auth.status === "authenticated" ? auth.user.id : null;
  const userCity = auth.status === "authenticated" ? auth.user.city : null;

  useEffect(() => {
    if (userCity) _setActiveCity(userCity);
  }, [userCity]);

  const setActiveCity = useCallback((city: string) => {
    _setActiveCity(city);
    if (!userId) return;
    fetch(`/api/users/${userId}/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ city, district_id: null }),
    }).catch(() => {});
  }, [userId]);

  const value = useMemo(
    () => ({ activeCity, setActiveCity }),
    [activeCity, setActiveCity],
  );

  return <CityContext.Provider value={value}>{children}</CityContext.Provider>;
}

export function useCity() {
  return useContext(CityContext);
}
