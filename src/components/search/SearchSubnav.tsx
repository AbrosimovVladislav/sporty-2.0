"use client";

import { usePathname } from "next/navigation";
import { UnderlineTabs, type UnderlineTab } from "@/components/ui/UnderlineTabs";

const RAW_TABS = [
  { href: "/search/events", label: "События" },
  { href: "/search/teams", label: "Команды" },
  { href: "/search/players", label: "Игроки" },
  { href: "/search/venues", label: "Площадки" },
];

export function SearchSubnav() {
  const pathname = usePathname();
  const tabs: UnderlineTab[] = RAW_TABS.map((t) => ({
    ...t,
    active: pathname === t.href || (pathname?.startsWith(t.href + "/") ?? false),
  }));

  return <UnderlineTabs tabs={tabs} className="px-3" />;
}
