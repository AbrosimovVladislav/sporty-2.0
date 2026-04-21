"use client";

import { usePathname, useRouter } from "next/navigation";
import { OnboardingProvider } from "./onboarding-context";
import type { ReactNode } from "react";

const STEPS = [
  "/onboarding/name",
  "/onboarding/birth-date",
  "/onboarding/skill",
  "/onboarding/district",
  "/onboarding/position",
];

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const stepIndex = STEPS.findIndex((s) => pathname.startsWith(s));
  const currentStep = stepIndex === -1 ? -1 : stepIndex;

  return (
    <OnboardingProvider>
      <div className="flex flex-1 flex-col">
        {currentStep >= 0 && (
          <div className="flex items-center px-6 pt-6 pb-2 gap-4">
            {currentStep > 0 ? (
              <button
                onClick={() => router.push(STEPS[currentStep - 1])}
                className="w-8 h-8 rounded-full bg-background-card border border-border flex items-center justify-center text-foreground-secondary hover:text-foreground transition-colors shrink-0"
                aria-label="Назад"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ) : (
              <div className="w-8 shrink-0" />
            )}
            <div className="flex flex-1 justify-center gap-2">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i <= currentStep
                      ? "bg-primary w-6"
                      : "bg-border w-1.5"
                  }`}
                />
              ))}
            </div>
            <div className="w-8 shrink-0" />
          </div>
        )}
        {children}
      </div>
    </OnboardingProvider>
  );
}
