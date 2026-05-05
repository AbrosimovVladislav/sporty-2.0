"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export type UnderlineTab = {
  /** If `href` is provided, tab renders as Next Link; otherwise as a button. */
  href?: string;
  label: string;
  active: boolean;
  onClick?: () => void;
};

export function UnderlineTabs({
  tabs,
  className,
}: {
  tabs: UnderlineTab[];
  className?: string;
}) {
  // Optimistic activation: when user taps a Link tab we highlight it
  // instantly, before Next.js finishes the route change. Once the parent
  // observes the new pathname (active = true on that tab), we clear it.
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    if (!pendingHref) return;
    const matched = tabs.some((t) => t.href === pendingHref && t.active);
    if (matched) setPendingHref(null);
  }, [tabs, pendingHref]);

  const isActive = (t: UnderlineTab): boolean => {
    if (pendingHref && t.href) return t.href === pendingHref;
    return t.active;
  };

  return (
    <nav
      className={className}
      style={{ borderBottom: "1px solid var(--ink-100)" }}
    >
      <div className="flex">
        {tabs.map((t, i) => {
          const active = isActive(t);
          const cls =
            "relative flex-1 text-center pt-3.5 pb-3 text-[14px] transition-colors whitespace-nowrap";
          const style = {
            color: active ? "var(--ink-900)" : "var(--ink-500)",
            fontWeight: active ? 600 : 500,
          } as const;
          const indicator = active ? (
            <span
              className="absolute left-1/2 -translate-x-1/2 -bottom-px h-[2.5px] rounded-full"
              style={{ background: "var(--green-700)", width: 36 }}
            />
          ) : null;

          if (t.href) {
            const href = t.href;
            return (
              <Link
                key={href}
                href={href}
                onPointerDown={() => {
                  if (!t.active) setPendingHref(href);
                }}
                onClick={t.onClick}
                className={cls}
                style={style}
              >
                {t.label}
                {indicator}
              </Link>
            );
          }
          return (
            <button
              key={`${t.label}-${i}`}
              type="button"
              onClick={t.onClick}
              className={cls}
              style={style}
            >
              {t.label}
              {indicator}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
