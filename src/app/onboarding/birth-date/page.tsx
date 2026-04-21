"use client";

import { useRouter } from "next/navigation";
import { useOnboarding } from "../onboarding-context";

export default function OnboardingBirthDatePage() {
  const { state, dispatch } = useOnboarding();
  const router = useRouter();

  return (
    <div className="flex flex-1 flex-col p-6 gap-6">
      <div>
        <h1 className="text-3xl font-display font-bold uppercase">Дата рождения</h1>
        <p className="mt-2 text-foreground-secondary text-sm">Возраст будет виден в твоём профиле</p>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm text-foreground-secondary">Дата рождения</label>
        <input
          type="date"
          value={state.birthDate}
          onChange={(e) => dispatch({ type: "SET_BIRTH_DATE", value: e.target.value })}
          className="bg-background-card border border-border rounded-md px-4 py-3 text-foreground outline-none focus:border-primary transition-colors"
          max={new Date().toISOString().split("T")[0]}
        />
      </div>

      <div className="mt-auto flex flex-col gap-3">
        <button
          onClick={() => router.push("/onboarding/skill")}
          disabled={!state.birthDate}
          className="w-full bg-primary text-primary-foreground font-display font-semibold uppercase rounded-full px-6 py-3 disabled:opacity-50 transition-colors hover:bg-primary-hover"
        >
          Далее
        </button>
        <button
          onClick={() => router.push("/onboarding/skill")}
          className="w-full text-foreground-secondary text-sm"
        >
          Пропустить
        </button>
      </div>
    </div>
  );
}
