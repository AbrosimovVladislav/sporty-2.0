"use client";

import { usePathname } from "next/navigation";
import { BottomTabs, type Tab } from "@/components/BottomTabs";
import { HomeIcon, ShieldIcon, UserIcon, UsersIcon, CalendarIcon } from "@/components/Icons";

const playerTabs: Tab[] = [
  { label: "Главная", href: "/home", icon: <HomeIcon /> },
  { label: "Команды", href: "/teams", icon: <ShieldIcon /> },
  { label: "Профиль", href: "/profile", icon: <UserIcon /> },
];

function getTeamTabs(teamId: string): Tab[] {
  return [
    { label: "Главная", href: `/team/${teamId}`, icon: <HomeIcon /> },
    { label: "Состав", href: `/team/${teamId}/roster`, icon: <UsersIcon /> },
    { label: "События", href: `/team/${teamId}/events`, icon: <CalendarIcon /> },
  ];
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Determine if we're in team context
  const teamMatch = pathname.match(/^\/team\/([^/]+)/);
  const tabs = teamMatch ? getTeamTabs(teamMatch[1]) : playerTabs;

  return (
    <div className="flex flex-col flex-1 pb-16">
      {children}
      <BottomTabs tabs={tabs} />
    </div>
  );
}
