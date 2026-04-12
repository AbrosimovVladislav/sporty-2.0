import { BottomTabs, type Tab } from "@/components/BottomTabs";
import { HomeIcon, ShieldIcon, UserIcon } from "@/components/Icons";

const globalTabs: Tab[] = [
  { label: "Главная", href: "/home", icon: <HomeIcon /> },
  { label: "Команды", href: "/teams", icon: <ShieldIcon />, matchPaths: ["/team"] },
  { label: "Профиль", href: "/profile", icon: <UserIcon /> },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col flex-1 pb-16">
      {children}
      <BottomTabs tabs={globalTabs} />
    </div>
  );
}
