"use client";

import { useRouter } from "next/navigation";
import { useOnboarding } from "../onboarding-context";
import { SKILL_LEVELS } from "@/lib/catalogs";

export default function OnboardingSkillPage() {
  const { state, dispatch } = useOnboarding();
  const router = useRouter();

  return (
    <div className="flex flex-1 flex-col p-6 gap-6">
      <div>
        <h1 className="text-3xl font-display font-bold uppercase">Твой уровень</h1>
        <p className="mt-2 text-foreground-secondary text-sm">Оцени себя честно — это поможет найти подходящих игроков</p>
      </div>

      <div className="flex flex-col gap-2">
        {SKILL_LEVELS.map((level) => (
          <button
            key={level}
            onClick={() => dispatch({ type: "SET_SKILL_LEVEL", value: level })}
            className={`w-full text-left px-4 py-4 rounded-lg border transition-colors font-medium ${
              state.skillLevel === level
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-background-card text-foreground"
            }`}
          >
            {level}
          </button>
        ))}
      </div>

      <div className="mt-auto flex flex-col gap-3">
        <button
          onClick={() => router.push("/onboarding/district")}
          disabled={!state.skillLevel}
          className="w-full bg-primary text-primary-foreground font-display font-semibold uppercase rounded-full px-6 py-3 disabled:opacity-50 transition-colors hover:bg-primary-hover"
        >
          Далее
        </button>
        <button
          onClick={() => router.push("/onboarding/district")}
          className="w-full text-foreground-secondary text-sm"
        >
          Пропустить
        </button>
      </div>
    </div>
  );
}
