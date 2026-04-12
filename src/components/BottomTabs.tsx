"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type Tab = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

export function BottomTabs({ tabs }: { tabs: Tab[] }) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background-card border-t border-border">
      <div className="flex">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-foreground-secondary"
              }`}
            >
              {tab.icon}
              <span className="font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
