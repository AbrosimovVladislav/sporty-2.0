"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useOnboarding } from "../onboarding-context";

export default function OnboardingNamePage() {
  const auth = useAuth();
  const { state, dispatch } = useOnboarding();
  const router = useRouter();

  useEffect(() => {
    if (auth.status === "authenticated" && !state.name) {
      dispatch({ type: "SET_NAME", value: auth.user.name });
    }
  }, [auth.status]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-1 flex-col p-6 gap-6">
      <div>
        <h1 className="text-3xl font-display font-bold uppercase">Как тебя зовут?</h1>
        <p className="mt-2 text-foreground-secondary text-sm">Имя будет видно другим игрокам</p>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm text-foreground-secondary">Имя</label>
        <input
          type="text"
          value={state.name}
          onChange={(e) => dispatch({ type: "SET_NAME", value: e.target.value })}
          className="bg-background-card border border-border rounded-md px-4 py-3 text-foreground outline-none focus:border-primary transition-colors"
          placeholder="Александр Иванов"
          autoFocus
        />
      </div>

      <div className="mt-auto">
        <button
          onClick={() => router.push("/onboarding/birth-date")}
          disabled={!state.name.trim()}
          className="w-full bg-primary text-primary-foreground font-display font-semibold uppercase rounded-full px-6 py-3 disabled:opacity-50 transition-colors hover:bg-primary-hover"
        >
          Далее
        </button>
      </div>
    </div>
  );
}
