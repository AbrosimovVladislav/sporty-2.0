"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import CitySelect from "@/components/CitySelect";
import DistrictSelect from "@/components/DistrictSelect";
import BackButton from "@/components/BackButton";

export default function CreateTeamPage() {
  const auth = useAuth();
  const router = useRouter();
  const [teamName, setTeamName] = useState("");
  const [city, setCity] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (auth.status !== "authenticated") {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  async function createTeam() {
    if (auth.status !== "authenticated") return;
    setLoading(true);
    setError("");

    const res = await fetch("/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: teamName,
        city,
        sport: "football",
        userId: auth.user.id,
        district_id: districtId || null,
      }),
    });

    if (!res.ok) {
      setError("Что-то пошло не так, попробуй снова");
      setLoading(false);
      return;
    }

    const { team } = await res.json();
    router.replace(`/team/${team.id}`);
  }

  function handleCityChange(newCity: string) {
    setCity(newCity);
    setDistrictId("");
  }

  return (
    <div className="flex flex-1 flex-col p-6 gap-6">
      <div className="relative bg-background-dark text-foreground-on-dark rounded-lg p-6">
        <BackButton fallbackHref="/teams" className="absolute top-4 left-4 w-9 h-9 rounded-full bg-black/40 flex items-center justify-center backdrop-blur-sm text-white" />
        <h1 className="text-3xl font-display font-bold uppercase pl-10">Новая команда</h1>
        <p className="mt-2 text-foreground-on-dark-muted text-sm">Заполни информацию о команде</p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm text-foreground-secondary">Название</label>
          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            className="bg-background-card border border-border rounded-md px-4 py-3 text-foreground outline-none focus:border-primary transition-colors"
            placeholder="Название команды"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-foreground-secondary">Город</label>
          <CitySelect
            value={city}
            onChange={handleCityChange}
            className="bg-background-card border border-border rounded-md px-4 py-3 text-foreground outline-none focus:border-primary transition-colors"
          />
        </div>

        {city && (
          <div className="flex flex-col gap-1">
            <label className="text-sm text-foreground-secondary">Район</label>
            <DistrictSelect
              city={city}
              value={districtId}
              onChange={setDistrictId}
              className="bg-background-card border border-border rounded-md px-4 py-3 text-foreground outline-none focus:border-primary transition-colors"
            />
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-sm text-foreground-secondary">Вид спорта</label>
          <div className="bg-background-card border border-border rounded-md px-4 py-3 text-foreground-secondary">
            Футбол
          </div>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="mt-auto">
        <button
          onClick={createTeam}
          disabled={!teamName.trim() || !city.trim() || loading}
          className="w-full bg-primary text-primary-foreground font-display font-semibold uppercase rounded-full px-6 py-3 disabled:opacity-50 transition-colors hover:bg-primary-hover"
        >
          {loading ? "Создаём..." : "Создать команду"}
        </button>
      </div>
    </div>
  );
}
