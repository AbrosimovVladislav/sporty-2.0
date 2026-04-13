"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getSupabaseClient } from "@/lib/supabase";

type Step = "role" | "player-form" | "done";
type Role = "player" | "organizer";

export default function OnboardingPage() {
  const auth = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<Step>("role");
  const [role, setRole] = useState<Role | null>(null);
  const initialFirstName =
    auth.status === "authenticated" ? auth.user.first_name ?? auth.user.name.split(" ")[0] ?? "" : "";
  const initialLastName =
    auth.status === "authenticated"
      ? auth.user.last_name ?? auth.user.name.split(" ").slice(1).join(" ")
      : "";
  const initialCity = auth.status === "authenticated" ? auth.user.city ?? "" : "";

  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [city, setCity] = useState(initialCity);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (auth.status === "loading") {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (auth.status === "unauthenticated") {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-center text-foreground-secondary">
        Открой приложение в Telegram
      </div>
    );
  }

  async function completeOnboarding() {
    if (auth.status !== "authenticated") return;
    setLoading(true);
    setError("");

    const resolvedFirstName = firstName.trim() || initialFirstName;
    const resolvedLastName = lastName.trim() || initialLastName;
    const resolvedCity = city.trim() || initialCity;
    const fullName = [resolvedFirstName, resolvedLastName].filter(Boolean).join(" ");

    let dbError: Error | null = null;

    try {
      const supabase = getSupabaseClient();
      const result = await supabase
      .from("users")
      .update({
        name: fullName,
        first_name: resolvedFirstName || null,
        last_name: resolvedLastName || null,
        city: resolvedCity,
        sport: "football",
        onboarding_completed: true,
      })
      .eq("id", auth.user.id);

      dbError = result.error;
    } catch (clientError) {
      dbError = clientError instanceof Error ? clientError : new Error("Supabase client error");
    }

    setLoading(false);

    if (dbError) {
      setError("Что-то пошло не так, попробуй снова");
      return;
    }

    auth.updateUser({
      name: fullName,
      first_name: resolvedFirstName || null,
      last_name: resolvedLastName || null,
      city: resolvedCity,
      sport: "football",
      onboarding_completed: true,
    });

    if (role === "organizer") {
      router.replace("/onboarding/team");
    } else {
      router.replace("/home");
    }
  }

  // Step: role selection
  if (step === "role") {
    return (
      <div className="flex flex-1 flex-col p-6 gap-6">
        <div className="bg-background-dark text-foreground-on-dark rounded-lg p-6">
          <h1 className="text-3xl font-display font-bold uppercase">Добро пожаловать</h1>
          <p className="mt-2 text-foreground-on-dark-muted text-sm">Sporty 2.0</p>
        </div>

        <div className="flex-1 flex flex-col justify-center gap-4">
          <p className="text-foreground-secondary text-sm text-center">Зачем ты здесь?</p>

          <button
            onClick={() => { setRole("player"); setStep("player-form"); }}
            className="bg-background-card border border-border rounded-lg p-5 text-left"
          >
            <p className="font-display font-semibold text-lg uppercase">Я игрок</p>
            <p className="text-foreground-secondary text-sm mt-1">Ищу команду, хожу на тренировки</p>
          </button>

          <button
            onClick={() => { setRole("organizer"); setStep("player-form"); }}
            className="bg-background-card border border-border rounded-lg p-5 text-left"
          >
            <p className="font-display font-semibold text-lg uppercase">Создать команду</p>
            <p className="text-foreground-secondary text-sm mt-1">Организую игры и управляю составом</p>
          </button>
        </div>
      </div>
    );
  }

  // Step: fill profile
  return (
    <div className="flex flex-1 flex-col p-6 gap-6">
      <div className="bg-background-dark text-foreground-on-dark rounded-lg p-6">
        <h1 className="text-3xl font-display font-bold uppercase">Профиль</h1>
        <p className="mt-2 text-foreground-on-dark-muted text-sm">Заполни основную информацию</p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm text-foreground-secondary">Имя</label>
          <input
            type="text"
            value={firstName || initialFirstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="bg-background-card border border-border rounded-md px-4 py-3 text-foreground outline-none focus:border-primary transition-colors"
            placeholder="Иван"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-foreground-secondary">Фамилия</label>
          <input
            type="text"
            value={lastName || initialLastName}
            onChange={(e) => setLastName(e.target.value)}
            className="bg-background-card border border-border rounded-md px-4 py-3 text-foreground outline-none focus:border-primary transition-colors"
            placeholder="Иванов"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-foreground-secondary">Город или район</label>
          <input
            type="text"
            value={city || initialCity}
            onChange={(e) => setCity(e.target.value)}
            className="bg-background-card border border-border rounded-md px-4 py-3 text-foreground outline-none focus:border-primary transition-colors"
            placeholder="Москва / Хамовники"
          />
        </div>

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
          onClick={completeOnboarding}
          disabled={!(firstName.trim() || initialFirstName) || !(city.trim() || initialCity) || loading}
          className="w-full bg-primary text-primary-foreground font-display font-semibold uppercase rounded-full px-6 py-3 disabled:opacity-50 transition-colors hover:bg-primary-hover"
        >
          {loading ? "Сохраняем..." : "Продолжить"}
        </button>
      </div>
    </div>
  );
}
