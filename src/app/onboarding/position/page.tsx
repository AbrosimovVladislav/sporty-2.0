"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useOnboarding } from "../onboarding-context";
import { POSITIONS } from "@/lib/catalogs";

export default function OnboardingPositionPage() {
  const auth = useAuth();
  const { state, dispatch } = useOnboarding();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const positions = POSITIONS["football"];

  async function finish() {
    if (auth.status !== "authenticated") return;
    setLoading(true);
    setError("");

    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: auth.user.id,
        name: state.name,
        birth_date: state.birthDate || null,
        skill_level: state.skillLevel || null,
        district_id: state.districtId || null,
        position: state.positions.length > 0 ? state.positions : null,
      }),
    });

    if (!res.ok) {
      setError("Что-то пошло не так, попробуй снова");
      setLoading(false);
      return;
    }

    router.replace("/home");
  }

  return (
    <div className="flex flex-1 flex-col p-6 gap-6">
      <div>
        <h1 className="text-3xl font-display font-bold uppercase">Амплуа</h1>
        <p className="mt-2 text-foreground-secondary text-sm">На каких позициях ты играешь? Можно выбрать несколько.</p>
      </div>

      <div className="flex flex-col gap-2">
        {positions.map((pos) => {
          const active = state.positions.includes(pos);
          return (
            <button
              key={pos}
              onClick={() => dispatch({ type: "TOGGLE_POSITION", value: pos })}
              className={`w-full text-left px-4 py-4 rounded-lg border transition-colors font-medium ${
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background-card text-foreground"
              }`}
            >
              {pos}
            </button>
          );
        })}
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="mt-auto flex flex-col gap-3">
        <button
          onClick={finish}
          disabled={state.positions.length === 0 || loading}
          className="w-full bg-primary text-primary-foreground font-display font-semibold uppercase rounded-full px-6 py-3 disabled:opacity-50 transition-colors hover:bg-primary-hover"
        >
          {loading ? "Сохраняем..." : "Готово"}
        </button>
        <button
          onClick={finish}
          disabled={loading}
          className="w-full text-foreground-secondary text-sm disabled:opacity-50"
        >
          Пропустить
        </button>
      </div>
    </div>
  );
}
