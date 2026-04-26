import { BottomTabs, type Tab } from "@/components/BottomTabs";
import { HomeIcon, SearchIcon, ShieldIcon, UsersIcon, UserIcon } from "@/components/Icons";
import { UIChromeProvider } from "@/components/ui/UIChromeContext";

const globalTabs: Tab[] = [
  { label: "Главная",  href: "/home",    icon: <HomeIcon /> },
  { label: "Поиск",   href: "/search",  icon: <SearchIcon /> },
  { label: "Команды", href: "/teams",   icon: <ShieldIcon />, matchPaths: ["/team"] },
  { label: "Игроки",  href: "/players", icon: <UsersIcon /> },
  { label: "Профиль", href: "/profile", icon: <UserIcon /> },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <UIChromeProvider>
      <div className="flex flex-col flex-1 pb-16">
        {children}
        <BottomTabs tabs={globalTabs} />
      </div>
    </UIChromeProvider>
  );
}
