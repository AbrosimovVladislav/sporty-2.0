"use client";

import { useRouter } from "next/navigation";
import { useOnboarding } from "../onboarding-context";
import DistrictSelect from "@/components/DistrictSelect";

const DEFAULT_CITY = "Алматы";

export default function OnboardingDistrictPage() {
  const { state, dispatch } = useOnboarding();
  const router = useRouter();

  return (
    <div className="flex flex-1 flex-col p-6 gap-6">
      <div>
        <h1 className="text-3xl font-display font-bold uppercase">Твой район</h1>
        <p className="mt-2 text-foreground-secondary text-sm">Город: {DEFAULT_CITY}</p>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm text-foreground-secondary">Район</label>
        <DistrictSelect
          city={DEFAULT_CITY}
          value={state.districtId}
          onChange={(id) => dispatch({ type: "SET_DISTRICT_ID", value: id })}
          className="bg-background-card border border-border rounded-md px-4 py-3 text-foreground outline-none focus:border-primary transition-colors"
        />
      </div>

      <div className="mt-auto flex flex-col gap-3">
        <button
          onClick={() => router.push("/onboarding/position")}
          disabled={!state.districtId}
          className="w-full bg-primary text-primary-foreground font-display font-semibold uppercase rounded-full px-6 py-3 disabled:opacity-50 transition-colors hover:bg-primary-hover"
        >
          Далее
        </button>
        <button
          onClick={() => router.push("/onboarding/position")}
          className="w-full text-foreground-secondary text-sm"
        >
          Пропустить
        </button>
      </div>
    </div>
  );
}
