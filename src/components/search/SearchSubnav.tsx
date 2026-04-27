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
    <nav className="px-4 mt-4">
      <div
        className="flex gap-1.5 overflow-x-auto scrollbar-none"
        style={{ scrollbarWidth: "none" }}
      >
        {TABS.map((t) => {
          const active = pathname === t.href || pathname?.startsWith(t.href + "/");
          return (
            <Link
              key={t.href}
              href={t.href}
              className="px-3.5 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap transition-colors"
              style={{
                background: active ? "var(--gray-900)" : "var(--bg-card)",
                color: active ? "white" : "var(--text-secondary)",
                border: active
                  ? "1.5px solid var(--gray-900)"
                  : "1.5px solid var(--gray-200)",
              }}
            >
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
