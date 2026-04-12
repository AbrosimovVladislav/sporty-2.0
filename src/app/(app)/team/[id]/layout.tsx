"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { use } from "react";

type TeamSubTab = {
  label: string;
  href: (id: string) => string;
  /** Active when pathname matches exactly this resolved href. */
  exact?: boolean;
};

const subTabs: TeamSubTab[] = [
  { label: "Главная", href: (id) => `/team/${id}`, exact: true },
  { label: "Состав", href: (id) => `/team/${id}/roster` },
  { label: "События", href: (id) => `/team/${id}/events` },
];

export default function TeamLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const pathname = usePathname();

  return (
    <div className="flex flex-1 flex-col">
      <div className="px-6 pt-6 pb-4">
        <div className="bg-background-dark text-foreground-on-dark rounded-lg p-6">
          <p className="text-foreground-on-dark-muted text-sm uppercase font-display">Команда</p>
          <h1 className="text-3xl font-display font-bold uppercase mt-1">ФК Название</h1>
          <p className="text-foreground-on-dark-muted text-sm mt-1">Москва · Футбол</p>
        </div>
      </div>

      <nav className="px-6 pb-2 sticky top-0 z-10 bg-background">
        <div className="flex gap-2 overflow-x-auto">
          {subTabs.map((tab) => {
            const href = tab.href(id);
            const isActive = tab.exact
              ? pathname === href
              : pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-background-card text-foreground border border-border"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="flex flex-1 flex-col px-6 py-4 gap-4">{children}</div>
    </div>
  );
}
