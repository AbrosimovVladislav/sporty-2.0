"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/search/events", label: "События" },
  { href: "/search/teams", label: "Команды" },
  { href: "/search/players", label: "Игроки" },
  { href: "/search/venues", label: "Площадки" },
];

export function SearchSubnav() {
  const pathname = usePathname();

  return (
    <nav
      className="px-4 mt-2"
      style={{ borderBottom: "1px solid var(--gray-100)" }}
    >
      <div className="flex justify-between gap-1">
        {TABS.map((t) => {
          const active =
            pathname === t.href || pathname?.startsWith(t.href + "/");
          return (
            <Link
              key={t.href}
              href={t.href}
              className="relative flex-1 text-center pt-2 pb-2.5 text-[14px] transition-colors whitespace-nowrap"
              style={{
                color: active ? "var(--green-700)" : "var(--text-secondary)",
                fontWeight: active ? 700 : 500,
              }}
            >
              {t.label}
              {active && (
                <span
                  className="absolute left-1/2 -translate-x-1/2 bottom-0 h-[2.5px] rounded-full"
                  style={{
                    background: "var(--green-500)",
                    width: "calc(100% - 16px)",
                  }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
