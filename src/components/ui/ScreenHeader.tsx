"use client";

import { ReactNode } from "react";
import BackButton from "@/components/BackButton";

type Props = {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  fallbackHref?: string;
  actions?: ReactNode[];
  className?: string;
};

export function ScreenHeader({ title, subtitle, showBack = true, fallbackHref, actions, className = "" }: Props) {
  return (
    <header className={`flex items-center justify-between px-4 pt-4 pb-3 ${className}`}>
      <div className="flex items-center gap-3 min-w-0">
        {showBack && <BackButton kind="light" fallbackHref={fallbackHref} />}
        <div className="min-w-0">
          <h1 className="text-[28px] font-bold leading-tight truncate">{title}</h1>
          {subtitle && <p className="text-[13px] text-foreground-secondary">{subtitle}</p>}
        </div>
      </div>
      {actions && actions.length > 0 && (
        <div className="flex gap-2 shrink-0 ml-3">
          {actions.map((action, i) => (
            <span key={i}>{action}</span>
          ))}
        </div>
      )}
    </header>
  );
}
