"use client";

import Link from "next/link";

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
  return (
    <nav
      className={className}
      style={{ borderBottom: "1px solid var(--gray-100)" }}
    >
      <div className="flex">
        {tabs.map((t, i) => {
          const cls =
            "relative flex-1 text-center pt-2 pb-2.5 text-[14px] transition-colors whitespace-nowrap";
          const style = {
            color: t.active ? "var(--green-700)" : "var(--text-secondary)",
            fontWeight: t.active ? 700 : 500,
          } as const;
          const indicator = t.active ? (
            <span
              className="absolute left-1/2 -translate-x-1/2 bottom-0 h-[2.5px] rounded-full"
              style={{ background: "var(--green-500)", width: "calc(100% - 16px)" }}
            />
          ) : null;

          if (t.href) {
            return (
              <Link
                key={t.href}
                href={t.href}
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
